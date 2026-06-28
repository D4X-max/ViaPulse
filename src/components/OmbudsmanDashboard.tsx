import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Mail, User, Clock, FileText, ArrowRight, Camera, Upload, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Report, ReportStatus, Category } from '../types';

interface OmbudsmanDashboardProps {
  reports: Report[];
  selectedReport: Report | null;
  onSelectReport: (report: Report) => void;
  onStatusUpdated: (updatedReport: Report) => void;
  onVerifyResolution: (id: string, resolutionImage: string, resolverName: string, comment: string) => Promise<{ approved: boolean; verification: any; report: Report }>;
}

export default function OmbudsmanDashboard({
  reports,
  selectedReport,
  onSelectReport,
  onStatusUpdated,
  onVerifyResolution
}: OmbudsmanDashboardProps) {
  // Filters State
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterWard, setFilterWard] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Resolution Form State
  const [resolutionImage, setResolutionImage] = useState<string | null>(null);
  const [resolverName, setResolverName] = useState('');
  const [resolverComment, setResolverComment] = useState('');
  
  // Verification states
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ approved: boolean; feedback: string; confidence: number } | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  // Quick status updates
  const [statusComment, setStatusComment] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Filter reports
  const filteredReports = reports.filter(r => {
    const catMatch = filterCategory === 'all' || r.category === filterCategory;
    const wardMatch = filterWard === 'all' || r.ward.includes(filterWard);
    const statusMatch = filterStatus === 'all' || r.status === filterStatus;
    return catMatch && wardMatch && statusMatch;
  });

  // Extract unique wards for filter
  const wardsList = ['Ward 1 - Downtown', 'Ward 2 - Eastside Heights', 'Ward 3 - Riverdale', 'Ward 4 - North Hills'];

  // Manual status updating helper
  const handleStatusChange = async (newStatus: ReportStatus) => {
    if (!selectedReport) return;
    setStatusUpdating(true);

    try {
      const response = await fetch(`/api/reports/${selectedReport.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          updatedBy: 'Municipal Ward Dispatcher',
          comment: statusComment || `Operational status updated to ${newStatus}.`
        })
      });

      if (!response.ok) throw new Error('Status update failed');
      const updatedReport = await response.json();
      onStatusUpdated(updatedReport);
      setStatusComment('');
    } catch (err) {
      console.error(err);
      alert('Failed to update report status.');
    } finally {
      setStatusUpdating(false);
    }
  };

  // Run AI Visual Verification Loop
  const handleRunVerification = async () => {
    if (!selectedReport || !resolutionImage) return;

    setIsVerifying(true);
    setVerificationResult(null);
    setVerificationError(null);

    try {
      const result = await onVerifyResolution(
        selectedReport.id,
        resolutionImage,
        resolverName || 'Field Crew Alpha',
        resolverComment || 'Completed full site patching.'
      );

      setVerificationResult({
        approved: result.approved,
        feedback: result.verification.feedback,
        confidence: result.verification.confidence
      });

      // Clear resolution form on success
      if (result.approved) {
        setResolutionImage(null);
        setResolverName('');
        setResolverComment('');
      }
    } catch (err: any) {
      console.error(err);
      setVerificationError(err.message || 'Verification Error: Hazard context mismatch');
    } finally {
      setIsVerifying(false);
    }
  };

  // Camera helpers
  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error opening camera:', err);
      alert('Camera access denied or unavailable. Please use file upload instead.');
      setIsCameraActive(false);
    }
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
      setResolutionImage(dataUrl);
      stopCamera();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setResolutionImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Cleanup camera tracks
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full max-h-[85vh] overflow-y-auto">
      
      {/* LEFT COLUMN: Report List & Filtering (5 cols) */}
      <div className="lg:col-span-5 flex flex-col gap-4 border-r border-gray-100 pr-0 lg:pr-4 h-full overflow-y-auto">
        <div className="flex flex-col gap-1.5 border-b border-gray-100 pb-3 pt-6 md:pt-8">
          <div className="flex items-center gap-2 text-indigo-600">
            <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
            <h2 className="font-display font-semibold text-lg text-gray-900 tracking-tight">Ombudsman Control Room</h2>
          </div>
          <p className="text-xs text-gray-500 font-sans">
            Oversee active service demands, dispatch work crews, and utilize the visual verification pipeline to confirm repairs.
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-slate-50 p-3 rounded-xl border border-gray-100 grid grid-cols-3 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full bg-white text-[11px] p-1.5 rounded-md border border-gray-200 font-medium focus:outline-none focus:border-indigo-500 font-sans"
            >
              <option value="all">All Items</option>
              <option value="pothole">Potholes</option>
              <option value="garbage">Garbage</option>
              <option value="water">Leaks</option>
              <option value="lighting">Lights</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Ward</label>
            <select
              value={filterWard}
              onChange={(e) => setFilterWard(e.target.value)}
              className="w-full bg-white text-[11px] p-1.5 rounded-md border border-gray-200 font-medium focus:outline-none focus:border-indigo-500 font-sans"
            >
              <option value="all">All Wards</option>
              {wardsList.map((w, idx) => (
                <option key={idx} value={`Ward ${idx + 1}`}>{`Ward ${idx + 1}`}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-white text-[11px] p-1.5 rounded-md border border-gray-200 font-medium focus:outline-none focus:border-indigo-500 font-sans"
            >
              <option value="all">All Status</option>
              <option value="REPORTED">Reported</option>
              <option value="VERIFIED">Verified</option>
              <option value="DISPATCHED">Dispatched</option>
              <option value="CLOSED_VERIFIED">Closed</option>
            </select>
          </div>
        </div>

        {/* List of active reports */}
        <div className="flex flex-col gap-2.5 h-full overflow-y-auto max-h-[500px]">
          {filteredReports.length > 0 ? (
            filteredReports.map((report) => {
              const isSelected = selectedReport?.id === report.id;
              const isClosed = report.status === 'CLOSED_VERIFIED';
              return (
                <div
                  key={report.id}
                  onClick={() => onSelectReport(report)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex gap-3 ${
                    isSelected 
                      ? 'bg-slate-900 border-slate-900 text-slate-100 shadow-md scale-[1.01]' 
                      : 'bg-white border-gray-100 hover:bg-slate-50/50 text-gray-800'
                  }`}
                >
                  {/* Small Aspect thumbnail */}
                  <div className="w-16 h-16 rounded-lg bg-slate-100 border overflow-hidden shrink-0 aspect-square">
                    <img
                      src={report.imageUrl}
                      alt=""
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        isClosed 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : isSelected 
                          ? 'bg-indigo-900/60 text-indigo-300' 
                          : 'bg-indigo-50 text-indigo-700'
                      }`}>
                        {report.status}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">#{report.id.substring(4)}</span>
                    </div>

                    <h4 className={`text-xs font-bold truncate capitalize font-display ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                      {report.category} on {report.ward.split(' - ')[1] || 'Main St'}
                    </h4>

                    <p className={`text-[11px] line-clamp-1 ${isSelected ? 'text-slate-300' : 'text-gray-400'}`}>
                      {report.description}
                    </p>

                    <div className="flex items-center justify-between text-[9px] font-mono mt-1 text-gray-400">
                      <span>Upvotes: {report.upvotes}</span>
                      <span>Duplicates: {report.duplicateIds.length}</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-gray-400 text-xs font-medium">
              No service demands matched filters.
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Active Dispatch / Workorder Triage (7 cols) */}
      <div className="lg:col-span-7 flex flex-col gap-5 h-full overflow-y-auto">
        {selectedReport ? (
          <div className="flex flex-col gap-5">
            {/* Top Info Banner */}
            <div className="bg-slate-50 p-4 rounded-xl border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 font-mono">Assigned Official Contact</span>
                <h3 className="text-sm font-bold text-gray-800 font-sans flex items-center gap-1.5">
                  <User className="w-4 h-4 text-gray-400" />
                  {selectedReport.ward} — {(selectedReport?.history || []).slice(-1)[0]?.updatedBy || 'Official'}
                </h3>
              </div>
              
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Clock className="w-4 h-4 text-gray-400" />
                <span>Active Since: {new Date(selectedReport.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Ombudsman Formal Legal demand Preview */}
            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-500" />
                Active Legal Ombudsman Petition
              </h4>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-[10px] text-slate-300 leading-relaxed overflow-x-auto max-h-[140px]">
                <pre className="whitespace-pre-wrap font-mono">{selectedReport.ombudsmanLetter}</pre>
              </div>
            </div>

            {/* Quick Actions (Update Status manually) */}
            {selectedReport.status !== 'CLOSED_VERIFIED' && (
              <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm flex flex-col gap-3">
                <h4 className="text-xs font-bold text-gray-800">Operational Dispatch Actions</h4>
                
                <div className="grid grid-cols-3 gap-2">
                  <button
                    disabled={statusUpdating || selectedReport.status === 'VERIFIED'}
                    onClick={() => handleStatusChange('VERIFIED')}
                    className="bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200/50 text-indigo-700 disabled:opacity-50 py-2 rounded-lg text-xs font-semibold font-sans transition-all"
                  >
                    Verify Incident
                  </button>
                  <button
                    disabled={statusUpdating || selectedReport.status === 'DISPATCHED'}
                    onClick={() => handleStatusChange('DISPATCHED')}
                    className="bg-amber-50 hover:bg-amber-100 active:bg-amber-200/50 text-amber-700 disabled:opacity-50 py-2 rounded-lg text-xs font-semibold font-sans transition-all"
                  >
                    Dispatch Crew
                  </button>
                  <button
                    disabled={statusUpdating || selectedReport.status === 'RESOLVED'}
                    onClick={() => handleStatusChange('RESOLVED')}
                    className="bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200/50 text-emerald-700 disabled:opacity-50 py-2 rounded-lg text-xs font-semibold font-sans transition-all"
                  >
                    Mark Resolved
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={statusComment}
                    onChange={(e) => setStatusComment(e.target.value)}
                    placeholder="Add dispatcher comment or dispatch ID..."
                    className="flex-1 text-xs p-2 rounded-lg border border-gray-200 focus:outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white transition-all"
                  />
                </div>
              </div>
            )}

            {/* Closed / Completed view */}
            {selectedReport.status === 'CLOSED_VERIFIED' && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-4 rounded-xl flex items-start gap-3 shadow-inner">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <h4 className="font-bold text-sm">Issue Closed & Verified</h4>
                  <p className="text-xs text-emerald-700/90 leading-relaxed">
                    This public infrastructure hazard has been fully resolved by city work teams, verified by the WardWatch visual neural comparison model, and permanently marked closed in the city register.
                  </p>
                </div>
              </div>
            )}

            {/* AI Visual Verification Pipeline Form */}
            {selectedReport.status !== 'CLOSED_VERIFIED' && (
              <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm flex flex-col gap-4">
                <div className="flex items-center gap-2 text-indigo-600 border-b border-gray-50 pb-2">
                  <Eye className="w-5 h-5 text-indigo-500" />
                  <h4 className="font-display font-semibold text-xs text-gray-800 uppercase tracking-wider">AI Visual Verification Loop</h4>
                </div>

                <p className="text-[11px] text-gray-400">
                  Submit photographic proof of resolution. Our Verification Agent will compare 'Before' and 'After' geometries via Gemini to authorize issue closure.
                </p>

                {/* Picture selector / camera */}
                <div className="flex flex-col gap-3">
                  {!resolutionImage && !isCameraActive ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        onClick={startCamera}
                        className="flex flex-col items-center justify-center p-5 bg-slate-50 hover:bg-slate-100/80 active:bg-slate-200/50 rounded-xl border border-dashed border-gray-200 group transition-all"
                      >
                        <Camera className="w-6 h-6 text-indigo-500 mb-1" />
                        <span className="text-[11px] font-bold text-gray-700">Take Repair Photo</span>
                      </button>

                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-col items-center justify-center p-5 bg-slate-50 hover:bg-slate-100/80 active:bg-slate-200/50 rounded-xl border border-dashed border-gray-200 group transition-all"
                      >
                        <Upload className="w-6 h-6 text-indigo-500 mb-1" />
                        <span className="text-[11px] font-bold text-gray-700">Upload Photo File</span>
                      </button>

                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                  ) : isCameraActive ? (
                    <div className="relative rounded-xl overflow-hidden bg-black flex flex-col items-center">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full max-h-[180px] object-cover"
                      />
                      <div className="absolute bottom-2.5 left-0 right-0 flex justify-center gap-3">
                        <button
                          onClick={capturePhoto}
                          className="bg-white text-indigo-600 px-3 py-1.5 rounded-full font-bold text-[10px] shadow-md"
                        >
                          Capture Resolution
                        </button>
                        <button
                          onClick={stopCamera}
                          className="bg-black/60 text-white px-3 py-1.5 rounded-full font-bold text-[10px]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative rounded-xl overflow-hidden border bg-slate-50 max-h-[140px] aspect-video">
                      <img src={resolutionImage} alt="Repair proof" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setResolutionImage(null)}
                        className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white text-[10px] font-bold px-2.5 py-1 rounded-full transition-all"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>

                {resolutionImage && (
                  <div className="flex flex-col gap-3 border-t border-gray-50 pt-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-0.5">
                        <label className="text-[10px] font-semibold text-gray-500">Resolver Name</label>
                        <input
                          type="text"
                          value={resolverName}
                          onChange={(e) => setResolverName(e.target.value)}
                          placeholder="e.g. Field Crew Bravo"
                          className="p-1.5 rounded-lg border border-gray-200 text-xs bg-slate-50 focus:bg-white"
                        />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <label className="text-[10px] font-semibold text-gray-500">Maintenance Commentary</label>
                        <input
                          type="text"
                          value={resolverComment}
                          onChange={(e) => setResolverComment(e.target.value)}
                          placeholder="e.g. Patched roadway area"
                          className="p-1.5 rounded-lg border border-gray-200 text-xs bg-slate-50 focus:bg-white"
                        />
                      </div>
                    </div>

                    {verificationError && (
                      <div className="bg-rose-50 border border-rose-100 p-2.5 rounded-xl flex items-start gap-2 text-xs text-rose-700">
                        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">AI Comparison Refused</span>
                          <p className="text-[11px] text-rose-600 mt-0.5">{verificationError}</p>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleRunVerification}
                      disabled={isVerifying}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-xl text-xs font-semibold font-sans transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      {isVerifying ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Verifying via Gemini Visual comparison...
                        </>
                      ) : (
                        'Run AI Visual Verification'
                      )}
                    </button>
                  </div>
                )}

                {/* Visual verification result display */}
                <AnimatePresence>
                  {verificationResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className={`p-3.5 rounded-xl border flex gap-3 ${
                        verificationResult.approved
                          ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800'
                          : 'bg-rose-50/50 border-rose-100 text-rose-800'
                      }`}
                    >
                      {verificationResult.approved ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      )}
                      <div className="flex flex-col gap-1 text-xs">
                        <h5 className="font-bold font-sans">
                          {verificationResult.approved ? 'AI Visual Verification APPROVED' : 'AI Visual Verification REJECTED'}
                          <span className="ml-1 text-[10px] font-mono font-normal">
                            (Confidence: {(verificationResult.confidence * 100).toFixed(0)}%)
                          </span>
                        </h5>
                        <p className={`text-[11px] leading-relaxed ${verificationResult.approved ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {verificationResult.feedback}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Incident Operational Timeline */}
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex flex-col gap-3">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider text-slate-400">Incident Operational Timeline</h4>
              
              <div className="relative border-l border-gray-100 pl-4 ml-1 flex flex-col gap-4">
                {(selectedReport?.history || []).map((hist, idx) => (
                  <div key={idx} className="relative">
                    {/* Circle Dot indicator */}
                    <span className={`absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full ring-4 ring-white ${
                      hist?.status === 'CLOSED_VERIFIED' 
                        ? 'bg-emerald-500' 
                        : hist?.status === 'RESOLVED'
                        ? 'bg-teal-500'
                        : hist?.status === 'DISPATCHED'
                        ? 'bg-amber-500'
                        : 'bg-indigo-500'
                    }`} />

                    <div className="flex flex-col gap-0.5 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-gray-800">
                        <span className="font-display font-medium text-[11px] uppercase tracking-wide">{hist?.status || 'PENDING'}</span>
                        <span className="text-[10px] font-normal text-gray-400">• by {hist?.updatedBy || 'Official'}</span>
                      </div>
                      <span className="text-[9px] text-gray-400 font-mono">{hist?.timestamp ? new Date(hist.timestamp).toLocaleString() : 'N/A'}</span>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-normal italic">
                        "{hist?.comment || ''}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed rounded-2xl bg-slate-50/30 text-center gap-3">
            <ShieldCheck className="w-10 h-10 text-indigo-300 stroke-[1.5]" />
            <div>
              <h4 className="text-xs font-semibold text-gray-800">No Service Demand Loaded</h4>
              <p className="text-[10px] text-gray-400 mt-1 max-w-[200px] leading-normal">
                Select an issue from the Ward Control Room panel or click interactive map coordinates to view official documentation.
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
