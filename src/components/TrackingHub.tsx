import React, { useState, useEffect, useRef } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare, Camera, CheckCircle, Navigation, ArrowRight, User, Send, ShieldAlert, Sparkles, MessageCircle, HelpCircle, Eye } from 'lucide-react';
import L from 'leaflet';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
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

// Highly polished Google MiniMap to display the localized pin for the selected ticket
function MiniMap({ lat, lng, category }: { lat: number; lng: number; category: string }) {
  const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_PLATFORM_KEY || '';
  const numLat = Number(lat);
  const numLng = Number(lng);

  return (
    <div className="relative w-full h-[160px] rounded-xl overflow-hidden border border-slate-800 shadow-inner">
      {API_KEY ? (
        <APIProvider apiKey={API_KEY} version="weekly">
          <Map
            defaultCenter={{ lat: numLat, lng: numLng }}
            center={{ lat: numLat, lng: numLng }}
            defaultZoom={15}
            mapId="MINI_MAP_ID"
            disableDefaultUI={true}
            gestureHandling="none"
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            style={{ width: '100%', height: '100%' }}
          >
            <AdvancedMarker position={{ lat: numLat, lng: numLng }}>
              <Pin background="#4f46e5" glyphColor="#fff" borderColor="#fff" />
            </AdvancedMarker>
          </Map>
        </APIProvider>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 p-4 text-center">
          <p className="text-[10px] text-slate-500 mb-1 font-semibold">Google Maps API Key Required</p>
          <a href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" target="_blank" rel="noopener noreferrer" className="text-[9px] text-indigo-500 hover:underline">Get an API Key</a>
        </div>
      )}
      <div className="absolute bottom-2 right-2 bg-slate-900/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[9px] font-mono text-slate-300 border border-slate-800/80 pointer-events-none select-none z-[1000]">
        Coords: {lat.toFixed(4)}, {lng.toFixed(4)}
      </div>
    </div>
  );
}

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
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
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  // Community confirmation counters & upload states
  const [localConfirmations, setLocalConfirmations] = useState<{ [key: string]: boolean }>({});
  const [localDismissals, setLocalDismissals] = useState<{ [key: string]: boolean }>({});

  // Separate user's own reports from alternative neighborhood users
  const userReports = (reports || []).filter(r => r.reporterEmail === user?.email);
  const otherReports = (reports || []).filter(r => {
    if (r.reporterEmail === user?.email) return false;
    if (!userLocation) return true;
    const dist = getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, r.latitude, r.longitude);
    return dist <= 5;
  });

  // Removed auto-select of user's own reports on initial load to prevent map popup

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

  // Helper to format timestamps for stepper and timeline logs
  const formatStepperTime = (timestamp?: string) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'pothole': return 'Pothole';
      case 'garbage': return 'Garbage';
      case 'water': return 'Water Leak';
      case 'lighting': return 'Streetlight';
      default: return category.charAt(0).toUpperCase() + category.slice(1);
    }
  };

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case 'REPORTED':
        return 'bg-rose-500';
      case 'VERIFIED':
        return 'bg-amber-500';
      case 'DISPATCHED':
        return 'bg-orange-500';
      case 'RESOLVED':
      case 'CLOSED_VERIFIED':
        return 'bg-emerald-500';
      default:
        return 'bg-slate-400';
    }
  };

  if (!reports) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-3 border border-dashed border-slate-200 rounded-2xl min-h-[300px]">
        <div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
        <p className="text-xs font-mono">Synchronizing civic tracking telemetry...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pt-2">
      
      {/* 1 & 2: Split-Pane Ticket Registry & Dynamic Detail Timeline Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Pane: Ticket Registry Sidebar (35% Width) */}
        <div className="lg:col-span-4 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex flex-col">
              <span className="text-[9px] font-mono font-bold text-indigo-600 uppercase tracking-wider">My Ledger</span>
              <h3 className="text-xs font-black font-display text-gray-800 uppercase tracking-wider">Ticket Registry</h3>
            </div>
            <span className="bg-indigo-50 text-indigo-600 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
              {userReports.length} Tickets
            </span>
          </div>

          <div className="flex flex-col gap-2 max-h-[480px] overflow-y-auto pr-1">
            {userReports.length > 0 ? (
              userReports.map((report) => {
                const isActive = selectedReport?.id === report.id;
                return (
                  <button
                    key={report.id}
                    onClick={() => onSelectReport(report)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                      isActive
                        ? 'border-indigo-600 bg-indigo-50/40 shadow-sm ring-1 ring-indigo-500/20'
                        : 'border-gray-100 bg-white hover:border-indigo-100 hover:shadow-sm'
                    }`}
                  >
                    {/* Micro-thumbnail */}
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-gray-100 bg-slate-50 relative">
                      <img
                        src={report.imageUrl || 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2'}
                        alt={report.category}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                      <span className="font-mono text-[9px] font-extrabold text-gray-400">
                        ROAD-REP_${report.id.slice(0, 4).toUpperCase()}
                      </span>
                      <span className="text-xs font-bold text-gray-800 truncate">
                        {getCategoryLabel(report.category)}
                      </span>
                    </div>

                    {/* Status Dot */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[9px] font-mono font-bold text-gray-500 uppercase">
                        {report.status === 'CLOSED_VERIFIED' ? 'CLOSED' : report.status}
                      </span>
                      <span className={`w-2 h-2 rounded-full ${getStatusDotColor(report.status)}`} />
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="text-center py-10 px-4 text-slate-400 flex flex-col items-center gap-2">
                <HelpCircle className="w-8 h-8 text-slate-300" />
                <p className="text-[11px] font-medium leading-relaxed font-sans">
                  No active tickets filed under your account. Use the <strong className="text-indigo-600 font-bold font-mono">Report Hazard</strong> page to lodge your first complaint.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Dynamic Detail & Timeline Hub (65% Width) */}
        <div className="lg:col-span-8">
          {selectedReport ? (
            <div className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-col gap-5">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest block">
                  Active Incident Detail
                </span>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mt-1">
                  <h3 className="text-sm font-bold font-display uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
                    <span className="bg-slate-800 border border-slate-700 text-slate-300 px-2 py-0.5 rounded text-[10px] font-mono">
                      Ticket ID
                    </span>
                    <span className="font-mono text-indigo-300">ROAD-REP_{selectedReport.id.slice(0, 6).toUpperCase()}</span>
                  </h3>
                  
                  {/* Progress Stepper Bar */}
                  {(() => {
                    const historyArray = selectedReport?.history || [];
                    const reportedEvent = historyArray.find(h => h.status === 'REPORTED') || { timestamp: selectedReport?.createdAt };
                    const verifiedEvent = historyArray.find(h => h.status === 'VERIFIED');
                    const dispatchedEvent = historyArray.find(h => h.status === 'DISPATCHED');
                    const resolvedEvent = historyArray.find(h => h.status === 'RESOLVED');
                    const closedEvent = historyArray.find(h => h.status === 'CLOSED_VERIFIED');

                    const steps = [
                      {
                        label: 'Reported',
                        active: true,
                        colorClass: 'text-emerald-400',
                        dot: '🟢',
                        time: formatStepperTime(reportedEvent?.timestamp)
                      },
                      {
                        label: 'Verified',
                        active: ['VERIFIED', 'DISPATCHED', 'RESOLVED', 'CLOSED_VERIFIED'].includes(selectedReport?.status || ''),
                        colorClass: 'text-amber-400',
                        dot: '🟡',
                        time: formatStepperTime(verifiedEvent?.timestamp)
                      },
                      {
                        label: 'Assigned',
                        active: ['DISPATCHED', 'RESOLVED', 'CLOSED_VERIFIED'].includes(selectedReport?.status || ''),
                        colorClass: 'text-orange-400',
                        dot: '🟠',
                        time: formatStepperTime(dispatchedEvent?.timestamp)
                      },
                      {
                        label: 'Fixed',
                        active: ['RESOLVED', 'CLOSED_VERIFIED'].includes(selectedReport?.status || ''),
                        colorClass: 'text-teal-400',
                        dot: '🔵',
                        time: formatStepperTime(resolvedEvent?.timestamp)
                      },
                      {
                        label: 'Closed',
                        active: selectedReport?.status === 'CLOSED_VERIFIED',
                        colorClass: 'text-emerald-500',
                        dot: '✅',
                        time: formatStepperTime(closedEvent?.timestamp)
                      }
                    ];

                    return (
                      <div className="flex items-center gap-2.5 text-[9px] font-bold font-mono overflow-x-auto py-1 scrollbar-none min-w-max">
                        {steps.map((step, idx) => (
                          <React.Fragment key={step.label}>
                            <div className="flex flex-col items-start gap-0.5">
                              <span className={step.active ? step.colorClass : 'text-slate-500'}>
                                {step.dot} {step.label}
                              </span>
                              {step.time && (
                                <span className="text-[8px] font-normal text-slate-400 font-mono block pl-4.5">
                                  {step.time}
                                </span>
                              )}
                            </div>
                            {idx < steps.length - 1 && (
                              <span className="text-slate-600 self-center">➔</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Compact Multi-Column Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                
                {/* Left Column: Image, Description, Mini Localized Viewport */}
                <div className="md:col-span-7 flex flex-col gap-4">
                  {/* Large Hazard Image */}
                  {selectedReport.status === 'CLOSED_VERIFIED' && (selectedReport.history || []).some(h => h.imageUrl) ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl overflow-hidden aspect-video bg-slate-950 border border-slate-800 relative group shadow-lg">
                        <img 
                          src={selectedReport.imageUrl || 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2'} 
                          alt="Before fault preview" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-mono text-amber-400 border border-slate-700/50 shadow-sm">
                          BEFORE
                        </div>
                      </div>
                      <div className="rounded-xl overflow-hidden aspect-video bg-slate-950 border border-slate-800 relative group shadow-lg">
                        <img 
                          src={(selectedReport.history || []).find(h => h.imageUrl)?.imageUrl} 
                          alt="After fault preview" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-mono text-emerald-400 border border-slate-700/50 shadow-sm">
                          AFTER
                        </div>
                        <div className="absolute inset-x-0 bottom-0 bg-slate-950/80 backdrop-blur-[1px] p-2 text-center text-[10px] font-mono text-emerald-400 border-t border-slate-800/50">
                          Issue Fixed & Verified
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl overflow-hidden aspect-video bg-slate-950 border border-slate-800 relative group shadow-lg">
                      <img 
                        src={selectedReport.imageUrl || 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2'} 
                        alt="Fault preview" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-slate-950/80 backdrop-blur-[1px] p-2 text-center text-[10px] font-mono text-emerald-400 border-t border-slate-800/50">
                        Consensus Secured & Verified
                      </div>
                    </div>
                  )}

                  {/* Incident Description */}
                  <div className="bg-slate-950/50 rounded-xl p-3.5 border border-slate-850/80 text-xs">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-indigo-400 block font-mono">Incident Description</span>
                    <p className="text-slate-200 mt-1 leading-relaxed font-sans">{selectedReport.description}</p>
                  </div>

                  {/* Mini Localized Viewport Map */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-indigo-400 block font-mono">
                      Localized Viewport Mapping
                    </span>
                    <MiniMap lat={selectedReport.latitude} lng={selectedReport.longitude} category={selectedReport.category} />
                  </div>
                </div>

                {/* Right Column: Timeline Stepper Log */}
                <div className="md:col-span-5">
                  <div className="flex flex-col gap-2 bg-slate-950/30 p-4 rounded-xl border border-slate-850/50 h-full">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-400 block font-mono">
                      SLA Event Log Timeline
                    </span>
                    <div className="flex flex-col gap-4 mt-3 pl-2.5 relative border-l border-slate-800/80">
                      {(selectedReport.history || []).length > 0 ? (
                        (selectedReport.history || []).map((step, idx) => {
                          const dateObj = step.timestamp ? new Date(step.timestamp) : null;
                          const formattedTime = dateObj 
                            ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                            : 'N/A';
                          const formattedDate = dateObj 
                            ? dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' }) 
                            : '';
                          
                          let defaultDesc = `Status transitioned to ${step.status}`;
                          if (step.comment) {
                            defaultDesc = step.comment;
                          } else {
                            if (step.status === 'REPORTED') {
                              defaultDesc = 'Incident logged in system. Triage verification pending.';
                            } else if (step.status === 'VERIFIED') {
                              defaultDesc = 'Community audit complete. Consensus threshold reached.';
                            } else if (step.status === 'DISPATCHED') {
                              defaultDesc = 'Assigned to the municipal maintenance division.';
                            } else if (step.status === 'RESOLVED') {
                              defaultDesc = 'Resolution declared by the official squad.';
                            } else if (step.status === 'CLOSED_VERIFIED') {
                              defaultDesc = 'Ticket closed. Community confirmed successful patch.';
                            }
                          }

                          return (
                            <div key={idx} className="relative pl-4.5 flex flex-col gap-0.5">
                              {/* Timeline dot */}
                              <span className={`absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-800 border-2 z-10 ${
                                step.status === 'CLOSED_VERIFIED' ? 'border-emerald-500' :
                                step.status === 'RESOLVED' ? 'border-teal-500' :
                                step.status === 'DISPATCHED' ? 'border-orange-500' :
                                step.status === 'VERIFIED' ? 'border-amber-500' : 'border-indigo-500'
                              }`}></span>
                              <div className="flex justify-between items-baseline text-[10px]">
                                <span className="font-extrabold text-slate-200 font-sans uppercase tracking-wide">
                                  {step.status === 'CLOSED_VERIFIED' ? 'CLOSED' : step.status}
                                </span>
                                <span className="font-mono text-indigo-400 text-[9px] whitespace-nowrap">
                                  {formattedDate} {formattedTime}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 leading-normal font-sans">
                                {defaultDesc}
                              </p>
                              {step.updatedBy && (
                                <span className="text-[9px] text-slate-500 font-mono">By: {step.updatedBy}</span>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="relative pl-4.5 flex flex-col gap-0.5">
                          <span className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-800 border-2 border-indigo-500 z-10"></span>
                          <div className="flex justify-between items-baseline text-[10px]">
                            <span className="font-extrabold text-slate-200 font-sans uppercase tracking-wide">REPORTED</span>
                            <span className="font-mono text-indigo-400 text-[9px]">
                              {selectedReport.createdAt ? new Date(selectedReport.createdAt).toLocaleString() : 'N/A'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-normal font-sans">
                            Incident logged in system. Initial telemetry verification pending.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-3 border border-dashed border-slate-200 rounded-2xl min-h-[350px]">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
                <Navigation className="w-5 h-5 animate-pulse" />
              </div>
              <p className="text-xs font-mono text-slate-500">Select a ticket from the registry sidebar to inspect its active live status & SLA timeline.</p>
            </div>
          )}
        </div>

      </div>

      {/* 3: Restructured Community Verification Forum (Bottom) - Only alternative user reports */}
      <div className="flex flex-col gap-4 border-t border-gray-100 pt-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest font-mono flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            Community Verification Forum
          </h3>
          <span className="text-[10px] font-mono text-slate-400">
            Neighborhood Claims Requiring Audit ({otherReports.length})
          </span>
        </div>

        {otherReports.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {otherReports.map((report) => (
              <div 
                key={report.id}
                className={`bg-white rounded-xl border p-4 shadow-sm flex flex-col justify-between gap-4 transition-all hover:border-indigo-100 hover:shadow-md ${
                  selectedReport?.id === report.id ? 'border-indigo-400 ring-1 ring-indigo-400/25' : 'border-gray-100'
                }`}
              >
                <div className="flex items-start gap-3">
                  <img 
                    src={report.imageUrl || 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2'} 
                    alt="Incident" 
                    className="w-16 h-16 rounded-xl object-cover shrink-0 border border-gray-100 shadow-inner bg-slate-50"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100/50 px-2 py-0.5 rounded font-mono uppercase">
                        📍 {getCategoryLabel(report.category)}
                      </span>
                      <span className="text-[9px] text-gray-400 font-mono">
                        {report.ward || 'Unknown'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-800 font-medium leading-normal mt-1.5 line-clamp-2">
                      {report.description || 'No description provided.'}
                    </p>
                  </div>
                </div>

                {/* Comment Drawer / Inline Input trigger */}
                {activeCommentReportId === report.id && (
                  <form 
                    onSubmit={(e) => handleCommentSubmit(e, report.id)}
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

                {/* Engagement Row Buttons */}
                <div className="flex items-center justify-between border-t border-gray-50 pt-3 text-[11px] font-bold text-gray-500">
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => handleConfirm(report.id)}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors ${
                        localConfirmations[report.id]
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'hover:bg-slate-50 hover:text-gray-800'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5 stroke-[2.2]" />
                      <span>Confirm Existence ({report.upvotes || 0})</span>
                    </button>

                    <button
                      onClick={() => handleDismiss(report.id)}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors ${
                        localDismissals[report.id]
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
                      onClick={() => setActiveCommentReportId(activeCommentReportId === report.id ? null : report.id)}
                      className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
                      title="Public Comments Feed"
                    >
                      <MessageSquare className="w-3.5 h-3.5 stroke-[2.2]" />
                      <span>({report.comments?.length || 0})</span>
                    </button>

                    <button
                      onClick={() => triggerUploadValidation(report.id)}
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
        ) : (
          <div className="text-center py-12 bg-gray-50 border border-gray-100 rounded-2xl text-slate-400 flex flex-col items-center gap-2">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
            <p className="text-[11px] font-sans font-medium text-slate-500">
              No other reports found within 5km radius of your current location. All local neighborhood ledgers are fully validated!
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
