import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare, Camera, CheckCircle, Navigation, ArrowRight, User, Send, ShieldAlert, Sparkles, MessageCircle } from 'lucide-react';
import { Report } from '../types';

interface TrackingHubProps {
  reports: Report[];
  selectedReport: Report | null;
  onSelectReport: (report: Report) => void;
  onUpvote: (id: string) => void;
  onAddComment: (id: string, author: string, text: string) => void;
  user: any;
  showToast: (type: 'success' | 'info' | 'error', text: string) => void;
}

export default function TrackingHub({
  reports,
  selectedReport,
  onSelectReport,
  onUpvote,
  onAddComment,
  user,
  showToast
}: TrackingHubProps) {
  const [commentText, setCommentText] = useState('');
  const [activeCommentReportId, setActiveCommentReportId] = useState<string | null>(null);

  // Community confirmation counters & upload states
  const [localConfirmations, setLocalConfirmations] = useState<{ [key: string]: boolean }>({});
  const [localDismissals, setLocalDismissals] = useState<{ [key: string]: boolean }>({});

  if (!reports) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-3 border border-dashed border-slate-200 rounded-2xl min-h-[300px]">
        <div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
        <p className="text-xs font-mono">Synchronizing civic tracking telemetry...</p>
      </div>
    );
  }

  const handleConfirm = (id: string) => {
    if (localConfirmations[id]) return;
    setLocalConfirmations(prev => ({ ...prev, [id]: true }));
    onUpvote(id);
    showToast('success', 'Thank you! Crowdsourced verification recorded (+50 Hero Points).');
  };

  const handleDismiss = (id: string) => {
    if (localDismissals[id]) return;
    setLocalDismissals(prev => ({ ...prev, [id]: true }));
    showToast('info', 'Incident flagged. Municipal inspectors will execute a re-scan.');
  };

  const triggerUploadValidation = (id: string) => {
    // Simulate uploading supporting validation photo
    showToast('success', 'Supporting proof uploaded! Community audit score increased.');
  };

  const handleCommentSubmit = (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    const author = user?.displayName || user?.email?.split('@')[0] || 'Sentinel';
    onAddComment(id, author, commentText);
    setCommentText('');
    setActiveCommentReportId(null);
  };

  const mockTimeline = [
    { time: '10:20 AM', title: 'Issue Reported', desc: 'Symmetric pixel triage complete. Sent as priority item.' },
    { time: '11:05 AM', title: 'Verified by community', desc: '14 consensus confirmations recorded on-chain.' },
    { time: '01:10 PM', title: 'Assigned to BBMP', desc: 'Dispatched to Road Maintenance Wing (Ward 14).' },
    { time: 'Tomorrow', title: 'Expected repair window schedule', desc: 'SLA priority timeline estimated within 24 hours.' }
  ];

  return (
    <div className="flex flex-col gap-6 pt-2">
      {/* 4. Issue Tracking Page & Ticket Detail Panel */}
      {selectedReport && (
        <div className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-col gap-4">
          <div className="border-b border-slate-800 pb-3">
            <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest block">
              Active Incident Detail
            </span>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-1">
              <h3 className="text-sm font-bold font-display uppercase tracking-wider text-slate-100">
                Ticket ID: <span className="font-mono text-indigo-300">Road-{(selectedReport?.id || "").slice(0, 5)}</span>
              </h3>
              
              {/* Progress Stepper Bar */}
              <div className="flex items-center gap-1.5 text-[9px] font-bold font-mono overflow-x-auto py-1 scrollbar-none min-w-max">
                <span className="text-emerald-400">🟢 Reported</span>
                <span className="text-slate-500">➔</span>
                <span className={selectedReport.status !== 'REPORTED' ? 'text-yellow-400' : 'text-slate-500'}>🟡 Verified</span>
                <span className="text-slate-500">➔</span>
                <span className={['DISPATCHED', 'RESOLVED', 'CLOSED_VERIFIED'].includes(selectedReport.status) ? 'text-orange-400' : 'text-slate-500'}>🟠 Assigned</span>
                <span className="text-slate-500">➔</span>
                <span className={['DISPATCHED', 'RESOLVED', 'CLOSED_VERIFIED'].includes(selectedReport.status) ? 'text-blue-400 font-extrabold' : 'text-slate-500'}>🔵 Repair Started</span>
                <span className="text-slate-500">➔</span>
                <span className={['RESOLVED', 'CLOSED_VERIFIED'].includes(selectedReport.status) ? 'text-emerald-400 font-extrabold' : 'text-slate-500'}>✅ Fixed</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            {/* Left Image & Status */}
            <div className="sm:col-span-4 rounded-xl overflow-hidden aspect-video bg-slate-950 border border-slate-800 relative group">
              <img 
                src={selectedReport.imageUrl || 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2'} 
                alt="Fault preview" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-x-0 bottom-0 bg-slate-950/80 p-2 text-center text-[10px] font-mono text-emerald-400">
                Consensus Secured
              </div>
            </div>

            {/* Right details & stepper feed */}
            <div className="sm:col-span-8 flex flex-col gap-3">
              <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-850 text-xs">
                <span className="text-[9px] uppercase font-bold tracking-wider text-indigo-400 block font-mono">Incident Description</span>
                <p className="text-slate-200 mt-1 leading-normal font-sans">{selectedReport.description}</p>
              </div>

              {/* Point 4: Vertical Timeline Stepper Feed */}
              <div className="flex flex-col gap-2 bg-slate-950/30 p-3 rounded-xl border border-slate-850/50">
                <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-400 block font-mono">
                  SLA Event Log Timeline
                </span>
                <div className="flex flex-col gap-3.5 mt-2.5 pl-2 relative border-l border-slate-800">
                  {mockTimeline.map((step, idx) => (
                    <div key={idx} className="relative pl-4 flex flex-col gap-0.5">
                      {/* Timeline dot */}
                      <span className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-800 border-2 border-indigo-500 z-10"></span>
                      <div className="flex justify-between items-baseline text-[10px]">
                        <span className="font-extrabold text-slate-200 font-sans">{step.title}</span>
                        <span className="font-mono text-indigo-400">{step.time}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal">{step.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Community Feed & Verification Hub */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1.5 border-b border-gray-100 pb-2">
          <Sparkles className="w-4.5 h-4.5 text-indigo-600" />
          Community Verification Forum
        </h3>

        {/* Localized civic Reddit forum grid loop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(reports || []).map((report) => (
            <div 
              key={report?.id || Math.random().toString()}
              className={`bg-white rounded-xl border p-4 shadow-sm flex flex-col justify-between gap-4 transition-all hover:border-indigo-100 hover:shadow ${
                selectedReport?.id === report?.id ? 'border-indigo-400 ring-1 ring-indigo-400/25' : 'border-gray-100'
              }`}
            >
              <div className="flex items-start gap-3">
                <img 
                  src={report?.imageUrl || ''} 
                  alt="Incident" 
                  className="w-16 h-16 rounded-xl object-cover shrink-0 border border-gray-100 shadow-inner bg-slate-50"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded font-mono uppercase">
                      📍 {report?.category || 'other'}
                    </span>
                    <span className="text-[9px] text-gray-400 font-mono">
                      {report?.ward || 'Unknown'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-800 font-medium leading-normal mt-1.5 line-clamp-2">
                    {report?.description || 'No description provided.'}
                  </p>
                </div>
              </div>

              {/* Comment Drawer / Inline Input trigger */}
              {activeCommentReportId === report?.id && (
                <form 
                  onSubmit={(e) => handleCommentSubmit(e, report?.id || '')}
                  className="mt-2.5 flex items-center gap-2 border-t border-gray-50 pt-3"
                >
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a public community validation update..."
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-[11px] focus:outline-none focus:border-indigo-500 font-sans"
                  />
                  <button 
                    type="submit"
                    className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </form>
              )}

              {/* Point 5: Engagement Row Buttons */}
              <div className="flex items-center justify-between border-t border-gray-50 pt-3 text-[11px] font-bold text-gray-500">
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => report?.id && handleConfirm(report.id)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors ${
                      report?.id && localConfirmations[report.id]
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'hover:bg-slate-50 hover:text-gray-800'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5 stroke-[2.2]" />
                    <span>Confirm Existence ({report?.upvotes || 0})</span>
                  </button>

                  <button
                    onClick={() => report?.id && handleDismiss(report.id)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors ${
                      report?.id && localDismissals[report.id]
                        ? 'bg-rose-50 text-rose-600'
                        : 'hover:bg-slate-50 hover:text-gray-800'
                    }`}
                  >
                    <ThumbsDown className="w-3.5 h-3.5 stroke-[2.2]" />
                    <span>Not There Anymore</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => report?.id && setActiveCommentReportId(activeCommentReportId === report.id ? null : report.id)}
                    className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
                    title="Public Comments Feed"
                  >
                    <MessageSquare className="w-3.5 h-3.5 stroke-[2.2]" />
                    <span>({report?.comments?.length || 0})</span>
                  </button>

                  <button
                    onClick={() => report?.id && triggerUploadValidation(report.id)}
                    className="p-1 rounded bg-slate-50 hover:bg-slate-100 hover:text-indigo-600 border border-gray-100 transition-all"
                    title="Upload Supporting Validation Photo"
                  >
                    <Camera className="w-3.5 h-3.5 stroke-[2.2]" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
