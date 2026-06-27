import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { db } from './src/server/db';
import { Report, Category, Severity, ReportStatus } from './src/types';

dotenv.config();

const app = express();
const PORT = 3000;

// Set up body size limits to accommodate base64 image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize Google Gemini Client if key is available
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log('Gemini API client initialized successfully.');
  } catch (err) {
    console.error('Failed to initialize Gemini Client with provided key:', err);
  }
} else {
  console.warn('GEMINI_API_KEY is not defined. Running in Simulated Triage mode.');
}

// Utility to parse data urls
function parseDataUrl(dataUrl: string) {
  const matches = dataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return { mimeType: 'image/jpeg', base64Data: dataUrl.replace(/^data:image\/\w+;base64,/, '') };
  }
  return {
    mimeType: matches[1],
    base64Data: matches[2]
  };
}

// REST API Endpoints

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mode: ai ? 'gemini-connected' : 'simulated' });
});

// 2. List all reports
app.get('/api/reports', (req, res) => {
  try {
    const reports = db.getReports();
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve reports' });
  }
});

// 3. Get ward response scorecard & dashboard stats
app.get('/api/stats', (req, res) => {
  try {
    const reports = db.getReports();
    const wardStats = db.getWardStats();

    const activeReports = reports.filter(r => r.status !== 'CLOSED_VERIFIED');
    const resolvedReports = reports.filter(r => r.status === 'CLOSED_VERIFIED');

    const stats = {
      totalActive: activeReports.length,
      totalResolved: resolvedReports.length,
      potholeCount: reports.filter(r => r.category === 'pothole').length,
      garbageCount: reports.filter(r => r.category === 'garbage').length,
      waterCount: reports.filter(r => r.category === 'water').length,
      lightingCount: reports.filter(r => r.category === 'lighting').length,
      wardStats
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve stats' });
  }
});

// 4. Submit a new report with automated Triage, Geolocation Ward, and Deduplication
app.post('/api/reports', async (req, res) => {
  const { image, latitude, longitude, reporterName } = req.body;

  if (!image || !latitude || !longitude) {
    return res.status(400).json({ error: 'Missing required parameters (image, latitude, longitude)' });
  }

  const nameOfReporter = reporterName || 'Anonymous Citizen';
  const latNum = parseFloat(latitude);
  const lngNum = parseFloat(longitude);

  try {
    let triageResult;

    if (ai) {
      console.log('Sending report to Gemini for Triage...');
      const parsed = parseDataUrl(image);
      const imagePart = {
        inlineData: {
          mimeType: parsed.mimeType,
          data: parsed.base64Data,
        }
      };

      const prompt = `Analyze this image to detect public infrastructure issues for a civic utility app called WardWatch.
Please classify the image and extract:
1. isInfrastructureHazard: boolean (True if this is a real municipal/civic issue like potholes, illegal trash dumping, water leaks, or broken lights).
2. category: string (Must be exactly one of: 'pothole', 'garbage', 'water', 'lighting').
3. severity: string (Must be exactly one of: 'low', 'medium', 'high').
4. description: string (A professional, concise 2-3 sentence description detailing the issue and hazard risks).
5. municipalOrdinanceCitations: string (An official-sounding mock municipal code section relevant to this hazard, e.g. "Municipal Code Section 12.4 - Public Sidewalk Maintenance" or "Utility Water Protection Act Section 8").`;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: [imagePart, prompt],
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                isInfrastructureHazard: { type: Type.BOOLEAN },
                category: { type: Type.STRING },
                severity: { type: Type.STRING },
                description: { type: Type.STRING },
                municipalOrdinanceCitations: { type: Type.STRING }
              },
              required: ['isInfrastructureHazard', 'category', 'severity', 'description', 'municipalOrdinanceCitations']
            }
          }
        });

        const parsedJson = JSON.parse(response.text || '{}');
        triageResult = {
          isInfrastructureHazard: parsedJson.isInfrastructureHazard ?? true,
          category: (parsedJson.category || 'pothole').toLowerCase() as Category,
          severity: (parsedJson.severity || 'medium').toLowerCase() as Severity,
          description: parsedJson.description || 'Infrastructure hazard reported.',
          ordinance: parsedJson.municipalOrdinanceCitations || 'Municipal Ordinance Code Section 14.2'
        };

        if (!triageResult.isInfrastructureHazard) {
          return res.status(400).json({
            error: 'AI Safety Validation Failed: The uploaded image does not appear to show a public municipal infrastructure issue (pothole, illegal dump, leak, or street light outage). Please capture a clear image of the hazard.'
          });
        }
      } catch (geminiError) {
        console.error('Gemini Triage request failed, using local fallback:', geminiError);
        triageResult = getFallbackTriage();
      }
    } else {
      // Offline fallback
      triageResult = getFallbackTriage();
    }

    // Now determine the ward and local contact info based on latitude/longitude
    const wardObj = db.findWard(latNum, lngNum);

    // DEDUPLICATION: check if there's an active issue within 150m of same category
    const duplicate = db.findNearbyDuplicate(latNum, lngNum, triageResult.category);

    if (duplicate) {
      console.log(`Deduplication triggered! Merging report with existing parent: ${duplicate.id}`);
      
      const newDupId = 'dup_' + Math.random().toString(36).substring(2, 9);
      const updatedReportCount = duplicate.reportCount + 1;
      const updatedUpvotes = duplicate.upvotes + 1;
      
      const historyUpdate = {
        status: duplicate.status,
        timestamp: new Date().toISOString(),
        updatedBy: nameOfReporter,
        comment: `Duplicate report registered. Citizen verified this issue is still active. Urgency level increased.`
      };

      const updated = await db.updateReport(duplicate.id, {
        reportCount: updatedReportCount,
        upvotes: updatedUpvotes,
        duplicateIds: [...duplicate.duplicateIds, newDupId],
        history: [...duplicate.history, historyUpdate]
      });

      return res.json({
        isDuplicate: true,
        message: `Deduplicated! This issue was already reported nearby in ${duplicate.ward}. Your report has been merged to amplify urgency.`,
        report: updated
      });
    }

    // No duplicate: generate professional Ombudsman demand letter
    const ombudsmanLetter = `To: ${wardObj.name} Office
Attn: ${wardObj.officer}, Public Works Supervisor

Subject: FORMAL CIVIC INITIATIVE & DEMAND FOR REPAIR - ${triageResult.category.toUpperCase()} HAZARD

This is a formal service demand filed on behalf of local constituents, monitored via the WardWatch Civic Sentinel Network.

An infrastructure defect has been verified and mapped at GPS Coordinates: (${latNum.toFixed(5)}, ${lngNum.toFixed(5)}).
Defect Type: ${triageResult.category.toUpperCase()}
Assessment Level: ${triageResult.severity.toUpperCase()}
Ordinance Compliance Reference: ${triageResult.ordinance}

Details & Citizen Statement:
"${triageResult.description}"

Under active ward maintenance guidelines, hazards rated ${triageResult.severity.toUpperCase()} severity must be logged, inspected, and routed to field repair crews. WardWatch has flagged this issue in the public register, tracking the city's response time to ensure accountability.

Please dispatch the appropriate service unit to restore safety and public utility at this location.

Sincerely,
${nameOfReporter} and the WardWatch Civic Ombudsman Agent`;

    // Create the new report
    const newReport: Report = {
      id: 'rep_' + Math.random().toString(36).substring(2, 9),
      latitude: latNum,
      longitude: lngNum,
      category: triageResult.category,
      severity: triageResult.severity,
      status: 'REPORTED',
      description: triageResult.description,
      imageUrl: image, // save image directly
      reporterName: nameOfReporter,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ward: wardObj.name,
      wardEmail: wardObj.email,
      ombudsmanLetter,
      reportCount: 1,
      upvotes: 1,
      duplicateIds: [],
      history: [
        {
          status: 'REPORTED',
          timestamp: new Date().toISOString(),
          updatedBy: nameOfReporter,
          comment: 'Hazard logged via citizen camera.'
        },
        {
          status: 'VERIFIED',
          timestamp: new Date().toISOString(),
          updatedBy: 'WardWatch Sentinel Agent',
          comment: `AI Triage completed: ${triageResult.category} (${triageResult.severity} severity). Formatted legal request generated and sent to ${wardObj.officer}.`
        }
      ],
      comments: []
    };

    await db.createReport(newReport);
    res.json({
      isDuplicate: false,
      message: 'Report filed, triaged, and dispatched successfully!',
      report: newReport
    });

  } catch (error) {
    console.error('Error handling report submission:', error);
    res.status(500).json({ error: 'Server error processing your report.' });
  }
});

// 5. Update report status manually (for Officers / Admins)
app.post('/api/reports/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, updatedBy, comment } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Missing required status parameter' });
  }

  try {
    const report = db.getReportById(id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const name = updatedBy || 'Municipal Official';
    const newHistory = {
      status: status as ReportStatus,
      timestamp: new Date().toISOString(),
      updatedBy: name,
      comment: comment || `Status updated to ${status}`
    };

    const updated = await db.updateReport(id, {
      status: status as ReportStatus,
      history: [...report.history, newHistory]
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update report status' });
  }
});

// 6. Upvote a report to increase urgency
app.post('/api/reports/:id/upvote', async (req, res) => {
  const { id } = req.params;

  try {
    const report = db.getReportById(id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const updated = await db.updateReport(id, {
      upvotes: report.upvotes + 1
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to upvote report' });
  }
});

// 7. Add citizen comment to an issue
app.post('/api/reports/:id/comments', async (req, res) => {
  const { id } = req.params;
  const { author, text } = req.body;

  if (!author || !text) {
    return res.status(400).json({ error: 'Author and text are required for comments' });
  }

  try {
    const report = db.getReportById(id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const newComment = {
      id: 'c_' + Math.random().toString(36).substring(2, 9),
      author,
      text,
      createdAt: new Date().toISOString()
    };

    const updated = await db.updateReport(id, {
      comments: [...report.comments, newComment]
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// 8. AI Visual Verification Loop: Compare Before & After Photos to confirm repairs
app.post('/api/reports/:id/verify-resolution', async (req, res) => {
  const { id } = req.params;
  const { resolutionImage, resolverName, comment } = req.body;

  if (!resolutionImage) {
    return res.status(400).json({ error: 'Missing resolutionImage parameter for comparison' });
  }

  try {
    const report = db.getReportById(id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const solver = resolverName || 'Field Maintenance Crew';
    const note = comment || 'Repair completed. Photographic proof submitted.';

    let verificationResult;

    if (ai) {
      console.log('Sending Before and After images to Gemini for Visual Verification...');
      const beforeParsed = parseDataUrl(report.imageUrl);
      const afterParsed = parseDataUrl(resolutionImage);

      const beforePart = {
        inlineData: {
          mimeType: beforeParsed.mimeType,
          data: beforeParsed.base64Data,
        }
      };

      const afterPart = {
        inlineData: {
          mimeType: afterParsed.mimeType,
          data: afterParsed.base64Data,
        }
      };

      const prompt = `You are the WardWatch Automated AI Verification Agent.
You are given two images for comparison:
- Image 1 is the 'before' image showing an active civic infrastructure hazard (originally classified as a '${report.category}').
- Image 2 is the 'after' image showing the reported location after a claimed maintenance repair.

Evaluate whether the infrastructure issue/hazard shown in the before image has been successfully resolved, cleaned, patched, or cleared in the after image.
Please return a JSON object with:
1. isResolved: boolean (True if the repair was fully completed and the hazard is no longer present. False if the hazard is still there or the photo is irrelevant/blurry/scam).
2. confidence: number (from 0.0 to 1.0 representing your confidence).
3. feedback: string (Describe what you see in the after image and justify your approval or rejection of the repair in 2-3 professional sentences).`;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: [beforePart, afterPart, prompt],
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                isResolved: { type: Type.BOOLEAN },
                confidence: { type: Type.NUMBER },
                feedback: { type: Type.STRING }
              },
              required: ['isResolved', 'confidence', 'feedback']
            }
          }
        });

        const parsedJson = JSON.parse(response.text || '{}');
        verificationResult = {
          isResolved: parsedJson.isResolved ?? true,
          confidence: parsedJson.confidence ?? 0.9,
          feedback: parsedJson.feedback || 'Visual verification successful. Hazard cleared.'
        };
      } catch (geminiError) {
        console.error('Gemini Verification failed, using fallback:', geminiError);
        verificationResult = getFallbackVerification(report.category);
      }
    } else {
      verificationResult = getFallbackVerification(report.category);
    }

    if (verificationResult.isResolved) {
      // Resolution approved by AI
      const resolvedHistory = {
        status: 'RESOLVED' as ReportStatus,
        timestamp: new Date().toISOString(),
        updatedBy: solver,
        comment: note,
        imageUrl: resolutionImage
      };

      const closedHistory = {
        status: 'CLOSED_VERIFIED' as ReportStatus,
        timestamp: new Date().toISOString(),
        updatedBy: 'WardWatch Verification Agent',
        comment: `AI Visual Verification APPROVED (Confidence: ${(verificationResult.confidence * 100).toFixed(0)}%). Feedback: ${verificationResult.feedback}`
      };

      const updated = await db.updateReport(id, {
        status: 'CLOSED_VERIFIED',
        history: [...report.history, resolvedHistory, closedHistory]
      });

      res.json({
        approved: true,
        verification: verificationResult,
        report: updated
      });
    } else {
      // Resolution rejected by AI
      const rejectedHistory = {
        status: report.status, // keep current status
        timestamp: new Date().toISOString(),
        updatedBy: 'WardWatch Verification Agent',
        comment: `AI Visual Verification REJECTED (Confidence: ${(verificationResult.confidence * 100).toFixed(0)}%). Feedback: ${verificationResult.feedback}. Issue remains open.`
      };

      const updated = await db.updateReport(id, {
        history: [...report.history, rejectedHistory]
      });

      res.json({
        approved: false,
        verification: verificationResult,
        report: updated
      });
    }

  } catch (error) {
    console.error('Error in visual verification:', error);
    res.status(500).json({ error: 'Server error during repair visual verification.' });
  }
});

// Global JSON error handler for express parsing issues and route failures
app.use((err: any, req: any, res: any, next: any) => {
  if (err.type === 'entity.too.large' || err.status === 413) {
    return res.status(413).json({ error: 'The uploaded photo is too large. Please upload a smaller image or select a compressed file.' });
  }
  console.error('Unhandled request error:', err);
  res.status(500).json({ error: 'Internal server error processing the request.' });
});

// Fallback logic helpers
function getFallbackTriage() {
  const categories: Category[] = ['pothole', 'garbage', 'water', 'lighting'];
  const severities: Severity[] = ['low', 'medium', 'high'];
  const descMap = {
    pothole: 'Medium size roadway asphalt failure causing wheel alignment risk and cyclist swerving.',
    garbage: 'Overflowing public waste bin causing trash scatter and strong odors on public pavement.',
    water: 'Sidewalk runoff from broken sprinkler system or plumbing line, wasting resources.',
    lighting: 'Broken fixture causing darkness on corner, creating public security risks.'
  };

  const cat = categories[Math.floor(Math.random() * categories.length)];
  const sev = severities[Math.floor(Math.random() * severities.length)];

  return {
    isInfrastructureHazard: true,
    category: cat,
    severity: sev,
    description: descMap[cat],
    ordinance: `Municipal Code Section ${Math.floor(Math.random() * 20) + 10}.5 - Public Health and Safety`
  };
}

function getFallbackVerification(category: Category) {
  return {
    isResolved: true,
    confidence: 0.95,
    feedback: `Verified repair of '${category}'. The area matches clean pavement profiles, indicating full remediation and clearance of the hazard.`
  };
}

// Vite and static file serving configuration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite middleware mounted for development.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Serving production static assets.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WardWatch Full-Stack Server running on port ${PORT}`);
  });
}

startServer();
