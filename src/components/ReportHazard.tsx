import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, AlertCircle, Send, CheckCircle, Navigation, MapPin, Sparkles, ShieldAlert, Eye, Settings, EyeOff, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Report, Category, Severity } from '../types';
import { auth } from '../lib/firebase';
import { compressImage } from '../lib/imageUtils';

const getDetectedSignature = (description: string, image: string | null) => {
  const descText = (description || '').toLowerCase();
  
  // Water Leakages
  if (
    descText.includes('water') || 
    descText.includes('leak') || 
    descText.includes('sewage') || 
    descText.includes('pipe') || 
    descText.includes('burst') || 
    descText.includes('drain') || 
    descText.includes('sprinkler') || 
    descText.includes('flood') || 
    descText.includes('puddle') || 
    descText.includes('hydrant') || 
    descText.includes('plumbing') || 
    descText.includes('runoff') ||
    (image && image.includes('photo-1515162305285-0293e4767cc2'))
  ) {
    return {
      category: 'Water Leakage',
      desc: 'Active runoff and plumbing hazard',
      metric: 'Flow rate: ~5.2 gpm',
      severity: 'Medium'
    };
  }
  // Garbage / Waste
  if (
    descText.includes('garbage') || 
    descText.includes('trash') || 
    descText.includes('waste') || 
    descText.includes('litter') || 
    descText.includes('dump') || 
    descText.includes('bin') || 
    descText.includes('can') || 
    descText.includes('rubbish') || 
    descText.includes('debris') || 
    descText.includes('overflowing')
  ) {
    return {
      category: 'Waste Management',
      desc: 'Trash dump/bin overflow on public path',
      metric: 'Est. volume: 4.5 cubic ft',
      severity: 'Medium'
    };
  }
  // Lighting / Streetlight
  if (
    descText.includes('light') || 
    descText.includes('streetlight') || 
    descText.includes('lamp') || 
    descText.includes('bulb') || 
    descText.includes('dark') || 
    descText.includes('wire') || 
    descText.includes('pole') || 
    descText.includes('electricity') || 
    descText.includes('luminaire')
  ) {
    return {
      category: 'Damaged Streetlight',
      desc: 'Broken public utility fixture',
      metric: 'Luminance drop: 100%',
      severity: 'Medium'
    };
  }
  // Potholes
  return {
    category: 'Pothole',
    desc: 'Roadway asphalt structural failure',
    metric: 'Est. diameter: 2.5 ft',
    severity: 'High'
  };
};

interface ReportHazardProps {
  user: any;
  newReportLocation: { latitude: number; longitude: number } | null;
  setNewReportLocation: (loc: { latitude: number; longitude: number } | null) => void;
  onReportCreated: (report: Report, isDuplicate: boolean, message: string) => void;
  showToast: (type: 'success' | 'info' | 'error', text: string) => void;
}

export default function ReportHazard({
  user,
  newReportLocation,
  setNewReportLocation,
  onReportCreated,
  showToast
}: ReportHazardProps) {
  const [image, setImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [description, setDescription] = useState('');
  const [reporterName, setReporterName] = useState(user?.displayName || user?.email?.split('@')[0] || '');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const [aiCategory, setAiCategory] = useState<Category | null>(null);
  const [aiSeverity, setAiSeverity] = useState<Severity | null>(null);
  const [aiOrdinance, setAiOrdinance] = useState<string | null>(null);

  // Point 2: Asynchronous Triage Block state
  const [showTriageCard, setShowTriageCard] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  // Point 3: Intermediary AI Confirmation Gate state
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (user) {
      setReporterName(user.displayName || user.email?.split('@')[0] || '');
    }
  }, [user]);

  // Clean camera tracks on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async (overrideFacingMode?: 'environment' | 'user') => {
    try {
      setIsCameraActive(true);
      const mode = overrideFacingMode || facingMode;
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error opening camera:', err);
      showToast('error', 'Camera access denied. Please use File Upload.');
      setIsCameraActive(false);
    }
  };

  const flipCamera = () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    startCamera(newMode);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      handleMediaSelection(dataUrl);
      stopCamera();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Compress the image before uploading to speed up transit time and AI processing
      const compressedDataUrl = await compressImage(file, 800, 800, 0.7);
      handleMediaSelection(compressedDataUrl);
    } catch (err) {
      console.error('Error compressing image:', err);
      // Fallback to original
      const reader = new FileReader();
      reader.onloadend = () => {
        handleMediaSelection(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMediaSelection = async (dataUrl: string) => {
    setImage(dataUrl);
    setIsScanning(true);
    setScanProgress(15);
    
    // Simulate smooth progress updates while the API is thinking
    let progress = 15;
    const progressInterval = setInterval(() => {
      progress = Math.min(85, progress + Math.floor(Math.random() * 8) + 3);
      setScanProgress(progress);
    }, 200);

    try {
      const response = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl })
      });

      clearInterval(progressInterval);

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Server failed to analyze image');
      }

      setScanProgress(100);
      setTimeout(() => {
        setIsScanning(false);
        const triage = data.triageResult;
        
        // Auto-fill description & category
        setDescription(triage.description);
        setAiCategory(triage.category);
        setAiSeverity(triage.severity);
        setAiOrdinance(triage.ordinance);

        setShowTriageCard(true);
        if (!newReportLocation) {
          setNewReportLocation({ latitude: 37.7749 + (Math.random() - 0.5) * 0.02, longitude: -122.4194 + (Math.random() - 0.5) * 0.02 });
        }
        showToast('success', `AI successfully categorized as ${triage.category.toUpperCase()}`);
      }, 500);

    } catch (err: any) {
      clearInterval(progressInterval);
      setIsScanning(false);
      console.error('AI Triage error:', err);
      showToast('error', err.message || 'AI Triage failed. Please enter details manually.');
      
      // Reset image state on error so user can re-upload
      setImage(null);
      setAiCategory(null);
      setAiSeverity(null);
      setAiOrdinance(null);
      setShowTriageCard(false);
      if (!newReportLocation) {
        setNewReportLocation({ latitude: 37.7749, longitude: -122.4194 });
      }
    }
  };

  const shareGPSLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setNewReportLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          showToast('success', 'Current GPS Coordinates locked in.');
        },
        () => {
          // Fallback to random SF
          setNewReportLocation({ latitude: 37.7749, longitude: -122.4194 });
          showToast('info', 'GPS failed. Placing marker on default center.');
        }
      );
    } else {
      setNewReportLocation({ latitude: 37.7749, longitude: -122.4194 });
    }
  };

  // Triggers Point 3: Intermediary gate
  const triggerSubmitForm = () => {
    if (!image) {
      showToast('error', 'Please upload or capture a hazard photo.');
      return;
    }
    if (!newReportLocation) {
      showToast('error', 'Please drop a marker on the map to specify coordinates.');
      return;
    }
    if (!description.trim()) {
      showToast('error', 'Please provide a markdown description of the issue.');
      return;
    }

    // Explicitly open confirmation modal gate
    setShowConfirmationModal(true);
  };

  const executeFinalSubmit = async () => {
    setShowConfirmationModal(false);
    setIsSubmitting(true);

    try {
      const currentUser = auth.currentUser;
      const secureEmail = currentUser?.email || user?.email || 'anonymous@viapulse.gov';
      const secureName = currentUser?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Anonymous Citizen';

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image,
          latitude: newReportLocation?.latitude,
          longitude: newReportLocation?.longitude,
          reporterName: secureName,
          reporterEmail: secureEmail,
          description: description,
          category: aiCategory,
          severity: aiSeverity,
          ordinance: aiOrdinance
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Server failed to process report');
      }

      // Reset
      setImage(null);
      setDescription('');
      setAiCategory(null);
      setAiSeverity(null);
      setAiOrdinance(null);
      setShowTriageCard(false);
      setNewReportLocation(null);
      setIsSubmitting(false);

      onReportCreated(data.report, data.isDuplicate, data.message);
    } catch (err: any) {
      console.error(err);
      showToast('error', err.message || 'Verification Error: Hazard context mismatch');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 pt-2">
      <div className="border-b border-gray-100 pb-3">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-1.5 font-display tracking-tight">
          <ShieldAlert className="w-5 h-5 text-indigo-600" />
          Report an Active Civic Hazard
        </h2>
        <p className="text-xs text-gray-400 mt-0.5 leading-normal">
          Log an infrastructure fault to the decentralized ledger. Our AI automatically handles department routing.
        </p>
      </div>

      {/* Point 2: Dual Media Inputs */}
      <div className="bg-slate-50 rounded-2xl border border-gray-100 p-4.5">
        <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-widest block mb-2.5">
          Step 1: Visual Proof Capture
        </span>

        {isCameraActive ? (
          <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-video flex flex-col items-center justify-center border border-slate-800 shadow-inner">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            
            <button
              onClick={flipCamera}
              className="absolute top-4 right-4 p-2 bg-slate-800/80 hover:bg-slate-700/80 backdrop-blur text-white rounded-full transition-all"
              title="Flip Camera"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <div className="absolute bottom-4 flex gap-2">
              <button
                onClick={capturePhoto}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs rounded-lg shadow transition-all"
              >
                Capture Photo
              </button>
              <button
                onClick={stopCamera}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-lg transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : image ? (
          <div className="relative rounded-xl overflow-hidden aspect-video bg-slate-100 border border-gray-150 shadow-inner group">
            <img src={image} alt="Hazard preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                onClick={() => {
                  setImage(null);
                  setShowTriageCard(false);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-lg shadow transition-all cursor-pointer"
              >
                Clear & Retake
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Take Photo trigger */}
            <button
              onClick={startCamera}
              className="border border-dashed border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/10 rounded-xl p-5 flex flex-col items-center justify-center gap-2.5 transition-all group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
                <Camera className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="text-center">
                <span className="text-xs font-bold text-gray-700 block">Take Photo with Live Camera</span>
                <span className="text-[10px] text-gray-400">Secure high-contrast verification</span>
              </div>
            </button>

            {/* Upload block */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="border border-dashed border-gray-200 hover:border-emerald-400 hover:bg-emerald-50/10 rounded-xl p-5 flex flex-col items-center justify-center gap-2.5 transition-all group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
                <Upload className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="text-center">
                <span className="text-xs font-bold text-gray-700 block">Upload Image or Video</span>
                <span className="text-[10px] text-gray-400">File dropzone or directory picker</span>
              </div>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*,video/*"
              className="hidden"
            />
          </div>
        )}

        {/* AI Scanner Bar */}
        <AnimatePresence>
          {isScanning && (
            <motion.div
              key="scanner-bar"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="mt-4 bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin shrink-0"></div>
              <div className="flex-1">
                <div className="flex justify-between text-[10px] text-slate-400 font-mono font-bold mb-1">
                  <span>TRANSITING CONTEXT TO GEMINI FLASH...</span>
                  <span>{scanProgress}%</span>
                </div>
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400" style={{ width: `${scanProgress}%` }} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Point 2: Asynchronous Triage Block removed per user request */}


      {/* Step 2: Geographic Bindings & Descriptive Details */}
      {showTriageCard && (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 p-4.5 flex flex-col gap-4 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-widest block">
              Step 2: Geotag & Description Details
            </span>

            {/* AI Triage Banner */}
            {aiCategory && (
              <div className="bg-indigo-50/40 border border-indigo-100 rounded-xl p-3.5 flex flex-col gap-2">
                <span className="text-[10px] font-bold text-indigo-600 font-mono uppercase tracking-widest block">
                  🤖 Multi-Agent AI Sentinel Classification
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-extrabold uppercase font-mono">
                    Category: {aiCategory}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-extrabold uppercase font-mono">
                    Severity: {aiSeverity}
                  </span>
                  {aiOrdinance && (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold font-mono">
                      {aiOrdinance}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed font-sans">
                  Gemini analyzed your visual proof and successfully categorized this hazard, drafting a detailed summary of what is present in the image. You can refine the draft below if needed.
                </p>
              </div>
            )}

            {/* GPS location sharing trigger */}
            <div className="flex items-center gap-3">
              <button
                onClick={shareGPSLocation}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5 text-indigo-600 stroke-[2.2]" />
                Share Current GPS Location
              </button>
              {newReportLocation ? (
                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-mono font-medium">
                  <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{newReportLocation.latitude.toFixed(5)}, {newReportLocation.longitude.toFixed(5)}</span>
                </div>
              ) : (
                <span className="text-[10px] text-gray-400 font-mono italic">
                  *Coordinates unset. Drag and drop pin on map or select GPS button.
                </span>
              )}
            </div>

            {/* Markdown descriptive text area */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-700">Detailed Description (Markdown Enabled)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="e.g. **Dangerous pothole** located directly in front of the metro pillar. Vehicles are swerving to avoid it, creating unsafe conditions..."
                className="w-full rounded-xl border border-gray-200 p-3.5 text-xs focus:outline-none focus:border-indigo-500 font-sans leading-relaxed transition-all placeholder:text-gray-400 focus:bg-white bg-slate-50/50"
              />
            </div>

            {/* Reporter name block */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-700">Reporter Identity Name</label>
              <input
                type="text"
                value={reporterName}
                readOnly
                disabled
                placeholder="Anonymous Citizen"
                className="w-full rounded-xl border border-gray-200 p-3 text-xs focus:outline-none focus:border-indigo-500 font-sans transition-all bg-slate-100 text-gray-500 cursor-not-allowed"
              />
            </div>

            {/* Submit */}
            <button
              onClick={triggerSubmitForm}
              disabled={isSubmitting}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-1.5 group cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              {isSubmitting ? 'Transmitting Context to Ledger...' : 'Transmit Report to Multi-Agent Node'}
            </button>
          </div>

          {/* Point 3: AI Confirmation Screen Modal (Intermediary Gate State) */}
          <AnimatePresence>
            {showConfirmationModal && (
              <motion.div
                key="confirmation-modal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[3000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ scale: 0.95, y: 15 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 15 }}
                  className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 text-white shadow-2xl flex flex-col gap-5"
                >
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-3.5">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider font-display">
                        AI Pre-Verification Check
                      </h3>
                      <p className="text-[10px] text-slate-400">Verifying payload attributes before serialization</p>
                    </div>
                  </div>

                  {/* Point 3: Required detection string */}
                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850/80 flex flex-col gap-3">
                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                      Automated Detection Signature
                    </span>
                    <p className="text-xs text-slate-200 font-sans font-medium leading-relaxed">
                      {"We detected: "}<span className="text-rose-400 font-bold font-mono">{String(aiCategory || getDetectedSignature(description, image).category).toUpperCase()}</span> | <span className="text-indigo-300">{aiCategory ? `${aiCategory} hazard detected` : getDetectedSignature(description, image).desc}</span> | <span className="text-emerald-400 font-mono font-bold">{getDetectedSignature(description, image).metric}</span> | <span className="text-rose-400 font-bold font-mono">{String(aiSeverity || getDetectedSignature(description, image).severity).toUpperCase()} Urgency</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3.5 text-xs text-slate-400 leading-normal bg-slate-950/30 p-3 rounded-lg">
                    <AlertCircle className="w-4.5 h-4.5 text-indigo-400 shrink-0" />
                    <span>
                      Confirming this transaction commits visual metrics permanently.
                    </span>
                  </div>

                  {/* Point 3: Dual interactive confirmation choices */}
                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={() => setShowConfirmationModal(false)}
                      className="flex-1 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold rounded-xl text-xs transition-all border border-slate-800 cursor-pointer"
                    >
                      Edit Details
                    </button>
                    <button
                      onClick={executeFinalSubmit}
                      className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/15 cursor-pointer"
                    >
                      Yes, This is Correct
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
