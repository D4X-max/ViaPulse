import fs from 'fs';
import path from 'path';
import { Report, WardStats, Category, ReportStatus, Comment } from '../types';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Predefined Wards with Officers and geographic centers
export const WARDS = [
  { name: 'Ward 1 - Downtown', officer: 'Sarah Jenkins', email: 'sjenkins@city-ward1.gov', lat: 37.7749, lng: -122.4194 },
  { name: 'Ward 2 - Eastside Heights', officer: 'David Miller', email: 'dmiller@city-ward2.gov', lat: 37.7858, lng: -122.4008 },
  { name: 'Ward 3 - Riverdale', officer: 'Elena Rostova', email: 'erostova@city-ward3.gov', lat: 37.7608, lng: -122.4356 },
  { name: 'Ward 4 - North Hills', officer: 'Marcus Vance', email: 'mvance@city-ward4.gov', lat: 37.7994, lng: -122.4273 }
];

// Seed Reports to make the demo look amazing immediately
const SEED_REPORTS: Report[] = [
  {
    id: 'rep_1',
    latitude: 37.7752,
    longitude: -122.4199,
    category: 'pothole',
    severity: 'high',
    status: 'DISPATCHED',
    description: 'Deep, dangerous pothole right in the middle of the bike lane on Market St. Multiple cyclists have nearly crashed trying to avoid it.',
    imageUrl: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=800&q=80',
    reporterName: 'Aria Chen',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    ward: 'Ward 1 - Downtown',
    wardEmail: 'sjenkins@city-ward1.gov',
    ombudsmanLetter: `To: Ward 1 - Downtown Office
Attn: Sarah Jenkins, Public Works Officer

Subject: FORMAL DEMAND FOR REPAIR - ROADWAY HAZARD ON MARKET ST

This is an official petition filed under Municipal Infrastructure Safety Code Section 14.2 (Roadway Maintenance and Hazard Abatement).

A severe roadway defect has been documented and verified at coordinates (37.7752, -122.4199).
Defect Type: Pothole
Severity Assessment: HIGH - Impending risk to life and property, specifically active transportation users (cyclists, scooter riders).

Impact Description: Deep, dangerous pothole right in the middle of the bike lane on Market St. Multiple cyclists have nearly crashed trying to avoid it.

Under Municipal Ordinance 402-B, the City is required to inspect and secure high-hazard roadway defects within 48 hours of formal notification. Failure to mitigate this hazard exposes the municipality to direct liability for any property damage or physical injury resulting from this unresolved defect.

Please dispatch a road maintenance crew immediately to patch this hazard and restore the safety of the public right-of-way.

Sincerely,
Aria Chen and the WardWatch Civic Sentinel Network`,
    reportCount: 3,
    upvotes: 24,
    duplicateIds: ['dup_1a', 'dup_1b'],
    history: [
      {
        status: 'REPORTED',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedBy: 'Aria Chen',
        comment: 'Initial report submitted via WardWatch camera.'
      },
      {
        status: 'VERIFIED',
        timestamp: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedBy: 'WardWatch Sentinel Agent',
        comment: 'AI Triage completed. Confirmed severe pothole in active bike lane. Legal notice generated and dispatched to Sarah Jenkins.'
      },
      {
        status: 'DISPATCHED',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updatedBy: 'Sarah Jenkins',
        comment: 'Work order #92841 generated. Scheduled for asphalt patching crew.'
      }
    ],
    comments: [
      {
        id: 'c_1',
        author: 'John Doe',
        text: 'Nearly hit this yesterday! Thank you for reporting.',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'c_2',
        author: 'Clarissa Vance',
        text: 'Ward 1 response has been slow lately. Let’s track this closely.',
        createdAt: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: 'rep_2',
    latitude: 37.7865,
    longitude: -122.4015,
    category: 'garbage',
    severity: 'medium',
    status: 'REPORTED',
    description: 'Massive pile of illegal trash dumping on the sidewalk near the alleyway. Includes old furniture, mattresses, and hazardous electronics.',
    imageUrl: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=800&q=80',
    reporterName: 'David K.',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    ward: 'Ward 2 - Eastside Heights',
    wardEmail: 'dmiller@city-ward2.gov',
    ombudsmanLetter: `To: Ward 2 - Eastside Heights Office
Attn: David Miller, Public Works Officer

Subject: FORMAL DEMAND FOR REPAIR - SANITATION HAZARD ON SIDEWALK

This is an official petition filed under Municipal Infrastructure Safety Code Section 8.7 (Sanitation, Litter, and Sidewalk Obstruction).

A severe sanitation hazard has been documented and verified at coordinates (37.7865, -122.4015).
Defect Type: Garbage / Illegal Dumping
Severity Assessment: MEDIUM - Obstruction of public right-of-way and potential vector for pests.

Impact Description: Massive pile of illegal trash dumping on the sidewalk near the alleyway. Includes old furniture, mattresses, and hazardous electronics.

Under Municipal Ordinance 120-C, sidewalks must remain clear of all trash and debris to maintain ADA compliance. Failure to resolve this obstruction restricts public mobility and creates health hazards.

Please dispatch a waste removal crew immediately to clear this dump site.

Sincerely,
David K. and the WardWatch Civic Sentinel Network`,
    reportCount: 1,
    upvotes: 8,
    duplicateIds: [],
    history: [
      {
        status: 'REPORTED',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        updatedBy: 'David K.',
        comment: 'Initial report submitted.'
      },
      {
        status: 'VERIFIED',
        timestamp: new Date(Date.now() - 11.5 * 60 * 60 * 1000).toISOString(),
        updatedBy: 'WardWatch Sentinel Agent',
        comment: 'AI Triage completed. Sidewalk obstruction identified. Formatted legal notice sent to David Miller.'
      }
    ],
    comments: []
  },
  {
    id: 'rep_3',
    latitude: 37.7612,
    longitude: -122.4361,
    category: 'water',
    severity: 'high',
    status: 'CLOSED_VERIFIED',
    description: 'Water main leak spraying clean drinking water directly onto the sidewalk. Creating a massive puddle and eroding the nearby planting strip.',
    imageUrl: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80',
    reporterName: 'Elena Rostova',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    ward: 'Ward 3 - Riverdale',
    wardEmail: 'erostova@city-ward3.gov',
    ombudsmanLetter: `To: Ward 3 - Riverdale Office
Attn: Elena Rostova, Public Works Officer

Subject: FORMAL DEMAND FOR REPAIR - WATER RESOURCE WASTE & EROSION

This is an official petition filed under Municipal Infrastructure Safety Code Section 21.4 (Water Resource Abatement and Utility Integrity).

A major utility leak has been documented and verified at coordinates (37.7612, -122.4361).
Defect Type: Water Leak
Severity Assessment: HIGH - Wasting clean municipal resources and causing local erosion.

Impact Description: Water main leak spraying clean drinking water directly onto the sidewalk. Creating a massive puddle and eroding the nearby planting strip.

Sincerely,
WardWatch Civic Sentinel Network`,
    reportCount: 2,
    upvotes: 35,
    duplicateIds: ['dup_3a'],
    history: [
      {
        status: 'REPORTED',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedBy: 'Marcus L.',
        comment: 'Initial leak report submitted.'
      },
      {
        status: 'VERIFIED',
        timestamp: new Date(Date.now() - 4.8 * 24 * 60 * 60 * 1000).toISOString(),
        updatedBy: 'WardWatch Sentinel Agent',
        comment: 'AI Triage completed. High severity water leak confirmed.'
      },
      {
        status: 'DISPATCHED',
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        updatedBy: 'Elena Rostova',
        comment: 'Water utility crew dispatched to repair main line valve.'
      },
      {
        status: 'RESOLVED',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedBy: 'Elena Rostova',
        comment: 'Main valve replaced, street surface secured and cleared.'
      },
      {
        status: 'CLOSED_VERIFIED',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedBy: 'WardWatch Verification Agent',
        comment: 'AI Visual Verification COMPLETE. Before and After images compared. Confirmed water flow stopped and roadway fully dry.'
      }
    ],
    comments: [
      {
        id: 'c_3',
        author: 'Elena Rostova',
        text: 'This was a tricky leak but our crew did an amazing job shutting it down in record time!',
        createdAt: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: 'rep_4',
    latitude: 37.7998,
    longitude: -122.4269,
    category: 'lighting',
    severity: 'low',
    status: 'VERIFIED',
    description: 'Streetlight completely out on the dark corner of Hyde and Union St. Makes walking at night very unsafe.',
    imageUrl: 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&w=800&q=80',
    reporterName: 'Toby Sparks',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    ward: 'Ward 4 - North Hills',
    wardEmail: 'mvance@city-ward4.gov',
    ombudsmanLetter: `To: Ward 4 - North Hills Office
Attn: Marcus Vance, Public Works Officer

Subject: FORMAL DEMAND FOR REPAIR - STREETLIGHT OUTAGE

This is an official petition filed under Municipal Infrastructure Safety Code Section 11.5 (Public Illumination and Safety Standards).

A dark-zone streetlight hazard has been documented at coordinates (37.7998, -122.4269).
Defect Type: Lighting Outage
Severity Assessment: LOW - Crime prevention and pedestrian safety hazard.

Sincerely,
Toby Sparks`,
    reportCount: 1,
    upvotes: 5,
    duplicateIds: [],
    history: [
      {
        status: 'REPORTED',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updatedBy: 'Toby Sparks',
        comment: 'Report submitted.'
      },
      {
        status: 'VERIFIED',
        timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
        updatedBy: 'WardWatch Sentinel Agent',
        comment: 'AI Triage completed. Light outage mapped and registered.'
      }
    ],
    comments: []
  }
];

// In-memory data store with disk persistence
class LocalDB {
  private reports: Report[] = [];

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        this.reports = JSON.parse(fileContent);
        console.log(`Database loaded with ${this.reports.length} reports.`);
      } else {
        this.reports = [...SEED_REPORTS];
        this.save();
        console.log(`Database initialized with seed data.`);
      }
    } catch (e) {
      console.error('Error reading/initializing database, using in-memory.', e);
      this.reports = [...SEED_REPORTS];
    }
  }

  private save() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.reports, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving database file:', e);
    }
  }

  public getReports(): Report[] {
    return this.reports;
  }

  public getReportById(id: string): Report | undefined {
    return this.reports.find(r => r.id === id);
  }

  public createReport(report: Report) {
    this.reports.unshift(report);
    this.save();
  }

  public updateReport(id: string, updates: Partial<Report>): Report | undefined {
    const reportIndex = this.reports.findIndex(r => r.id === id);
    if (reportIndex === -1) return undefined;

    const existingReport = this.reports[reportIndex];
    const updatedReport = {
      ...existingReport,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.reports[reportIndex] = updatedReport;
    this.save();
    return updatedReport;
  }

  public deleteReport(id: string): boolean {
    const reportIndex = this.reports.findIndex(r => r.id === id);
    if (reportIndex === -1) return false;

    this.reports.splice(reportIndex, 1);
    this.save();
    return true;
  }

  public findNearbyDuplicate(lat: number, lng: number, category: Category, thresholdMeters: number = 150): Report | undefined {
    // Haversine formula to compute distance between coordinates in meters
    const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371e3; // metres
      const phi1 = (lat1 * Math.PI) / 180;
      const phi2 = (lat2 * Math.PI) / 180;
      const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
      const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

      const a =
        Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      return R * c; // in metres
    };

    return this.reports.find(report => {
      if (report.category !== category) return false;
      if (report.status === 'CLOSED_VERIFIED') return false; // closed issues cannot be duplicates

      const dist = getDistance(lat, lng, report.latitude, report.longitude);
      return dist <= thresholdMeters;
    });
  }

  public findWard(lat: number, lng: number) {
    // Map coordinate to the closest ward center
    let closestWard = WARDS[0];
    let minDistance = Infinity;

    const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      return Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(lon1 - lon2, 2));
    };

    for (const ward of WARDS) {
      const dist = getDistance(lat, lng, ward.lat, ward.lng);
      if (dist < minDistance) {
        minDistance = dist;
        closestWard = ward;
      }
    }

    return closestWard;
  }

  public getWardStats(): WardStats[] {
    const counts = WARDS.map(w => {
      const wardReports = this.reports.filter(r => r.ward === w.name);
      const total = wardReports.length;
      const resolved = wardReports.filter(r => r.status === 'CLOSED_VERIFIED').length;
      const pending = total - resolved;

      // Calculate typical resolution times or return mock if none resolved
      const resolvedTimes = wardReports
        .filter(r => r.status === 'CLOSED_VERIFIED')
        .map(r => {
          const start = new Date(r.createdAt).getTime();
          const end = new Date(r.updatedAt).getTime();
          return (end - start) / (1000 * 60 * 60); // hours
        });

      const avgTime = resolvedTimes.length > 0 
        ? parseFloat((resolvedTimes.reduce((a, b) => a + b, 0) / resolvedTimes.length).toFixed(1))
        : 24.5; // default mock SLA hours

      // Generate score (0-100) based on resolution percentage and time
      const resRate = total > 0 ? (resolved / total) * 100 : 80;
      const score = Math.min(100, Math.max(10, Math.round(resRate * 0.7 + (48 - Math.min(48, avgTime)) * 0.625)));

      return {
        wardName: w.name,
        officerName: w.officer,
        email: w.email,
        totalReports: total,
        resolvedReports: resolved,
        pendingReports: pending,
        avgResolutionTimeHours: avgTime,
        score
      };
    });

    return counts;
  }
}

export const db = new LocalDB();
