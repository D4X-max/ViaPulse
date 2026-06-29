import React from 'react';
import { Sparkles, ArrowRight, CheckCircle, Clock, AlertTriangle, MapPin, ThumbsUp } from 'lucide-react';
import { Report } from '../types';

interface HomeDashboardProps {
  user: any;
  reports: Report[];
  onSelectReport: (report: Report) => void;
  onNavigateToReport: () => void;
  onNavigateToTracking: () => void;
}

export default function HomeDashboard({
  user,
  reports,
  onSelectReport,
  onNavigateToReport,
  onNavigateToTracking
}: HomeDashboardProps) {
  if (!reports) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-3 border border-dashed border-slate-200 rounded-2xl min-h-[300px]">
        <Clock className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-xs font-mono">Synchronizing civic ledger telemetry...</p>
      </div>
    );
  }

  // Calculate metrics based strictly on live data payload
  const resolvedCount = (reports || []).filter(r => {
    const s = (r?.status || "") as string;
    return s === 'CLOSED_VERIFIED' || s === 'Fixed' || s === 'RESOLVED';
  }).length;
  const inProgressCount = (reports || []).filter(r => {
    const s = (r?.status || "") as string;
    return s === 'VERIFIED' || s === 'DISPATCHED' || s === 'Assigned' || s === 'Repair Started';
  }).length;
  const reportedTodayCount = (reports || []).filter(r => {
    if (!r?.createdAt) return false;
    return r.createdAt.split('T')[0] === new Date().toISOString().split('T')[0];
  }).length;

  // Filter My Reports dynamically: map reports array using allReports.filter(report => report.reporterEmail === currentUser.email)
  const myReports = (reports || []).filter(r => {
    if (!user?.email) return false;
    return r?.reporterEmail === user.email;
  }).slice(0, 5);

  const displayUserName = user?.displayName || user?.email?.split('@')[0] || 'Citizen';

  // Find top category (mode) within active report stack
  let topCategory = 'infrastructure';
  if ((reports || []).length > 0) {
    const counts = (reports || []).reduce((acc, r) => {
      const cat = r?.category || 'other';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    let maxCount = -1;
    Object.entries(counts || {}).forEach(([cat, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topCategory = cat;
      }
    });
  }

  return (
    <div className="flex flex-col gap-6 pt-2">
      {/* Welcome Message Card block */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-15 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-400 via-teal-500 to-indigo-900 pointer-events-none"></div>
        <div className="relative z-10">
          <span className="text-indigo-200 text-xs font-mono uppercase tracking-widest block mb-1">ViaPulse Civic System</span>
          <h2 className="text-2xl font-display font-bold tracking-tight">👋 Welcome Back, {displayUserName}</h2>
          {user?.email && <p className="text-xs text-indigo-200 font-mono mt-1">{user.email}</p>}
          <p className="text-xs text-slate-300 mt-2 max-w-xl leading-relaxed">
            You are authorized on the ViaPulse decentralized ledger. Help us monitor infrastructure flaws and accelerate public municipal repairs.
          </p>
          
          <button
            onClick={onNavigateToReport}
            className="mt-4 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl text-xs font-extrabold shadow-lg shadow-emerald-500/10 transition-all flex items-center gap-2 group cursor-pointer"
          >
            Report an Active Civic Hazard
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-col justify-between">
          <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider block">Issues Resolved</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl md:text-2xl font-black font-mono text-emerald-600">{resolvedCount}</span>
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-col justify-between">
          <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider block">In Progress</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl md:text-2xl font-black font-mono text-amber-600">{inProgressCount}</span>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-col justify-between">
          <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider block">Reported Today</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl md:text-2xl font-black font-mono text-indigo-600">{reportedTodayCount}</span>
            <AlertTriangle className="w-3.5 h-3.5 text-indigo-500" />
          </div>
        </div>
      </div>

      {/* AI Insights Card */}
      <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex items-start gap-3 shadow-inner">
        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
          <Sparkles className="w-4.5 h-4.5 text-indigo-600" />
        </div>
        <div className="flex-1">
          <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block font-mono">AI Suggestion System</span>
          <p className="text-xs text-indigo-900 mt-1 leading-normal font-sans font-medium">
            💡 AI Insight: Looks like a high volume of {topCategory} anomalies are currently surfacing within active tracking ranges.
          </p>
        </div>
      </div>

      {/* Split column container for feeds */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Community Activity Feed */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-indigo-500" />
            Recent Community Activity
          </h3>
          <div className="flex flex-col gap-3">
            {(reports || []).slice(0, 3).map((report) => (
              <div 
                key={report?.id || Math.random().toString()}
                onClick={() => {
                  if (report) {
                    onSelectReport(report);
                    onNavigateToTracking();
                  }
                }}
                className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm hover:border-indigo-100 hover:shadow-md transition-all cursor-pointer flex items-center gap-3"
              >
                <img 
                  src={report?.imageUrl || ''} 
                  alt={report?.category || 'other'} 
                  className="w-12 h-12 rounded-lg object-cover bg-slate-100" 
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                      {report?.category || 'other'}
                    </span>
                    <span className="text-[9px] text-gray-400 font-mono">{report?.ward || 'Unknown'}</span>
                  </div>
                  <p className="text-xs text-gray-700 font-medium truncate mt-1">{report?.description || 'No description'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Point 8: Personal Dashboard & Profile Matrix ("My Reports") */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            My Reports Dashboard
          </h3>
          <div className="flex flex-col gap-3">
            {(myReports || []).length > 0 ? (
              (myReports || []).map((report) => (
                <div 
                  key={report?.id || Math.random().toString()}
                  onClick={() => {
                    if (report) {
                      onSelectReport(report);
                      onNavigateToTracking();
                    }
                  }}
                  className="bg-white p-3.5 rounded-xl border border-emerald-50 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all cursor-pointer flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-800 truncate max-w-[150px]">
                      {report?.category === 'pothole' ? 'Pothole near Metro' : `${report?.category || 'other'} at ${report?.ward || 'Unknown'}`}
                    </span>
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                      report?.status === 'RESOLVED' || report?.status === 'CLOSED_VERIFIED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                      {report?.status === 'DISPATCHED' ? 'Repair Started' : report?.status === 'RESOLVED' ? 'Fixed' : report?.status || 'PENDING'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono mt-0.5">
                    <span>Reported on {report?.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'N/A'}</span>
                    <span className="text-indigo-600 font-semibold flex items-center gap-0.5">
                      <ThumbsUp className="w-3 h-3" />
                      {report?.upvotes || 0} Community Confirmations
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 rounded-xl border border-dashed border-gray-200 text-center text-xs text-gray-400">
                You haven't transmitted any ledger issues yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
