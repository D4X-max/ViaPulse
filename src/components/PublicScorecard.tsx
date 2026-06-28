import React, { useState } from 'react';
import { DashboardStats, WardStats } from '../types';
import { Award, CheckCircle2, AlertTriangle, ShieldAlert, Zap, TrendingUp, BarChart3, RefreshCw } from 'lucide-react';
import PredictiveRadar from './PredictiveRadar';

interface PublicScorecardProps {
  stats: DashboardStats;
}

export default function PublicScorecard({ stats }: PublicScorecardProps) {
  const [scorecardTab, setScorecardTab] = useState<'stats' | 'predictive'>('stats');

  // Helpers to get rank letters based on performance score
  const getRankLetter = (score: number) => {
    if (score >= 95) return { letter: 'A+', color: 'text-emerald-500 bg-emerald-50 border-emerald-200' };
    if (score >= 90) return { letter: 'A', color: 'text-emerald-600 bg-emerald-50/50 border-emerald-100' };
    if (score >= 80) return { letter: 'B', color: 'text-indigo-600 bg-indigo-50 border-indigo-100' };
    if (score >= 70) return { letter: 'C', color: 'text-amber-600 bg-amber-50 border-amber-100' };
    return { letter: 'F', color: 'text-rose-600 bg-rose-50 border-rose-100' };
  };

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-3 min-h-[300px]">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-xs font-mono">Synchronizing scorecard telemetry...</p>
      </div>
    );
  }

  // Compute total submissions
  const totalSubmissions = (stats.totalActive || 0) + (stats.totalResolved || 0);
  const resolutionRate = totalSubmissions > 0 
    ? Math.round(((stats.totalResolved || 0) / totalSubmissions) * 100) 
    : 100;

  return (
    <div className="flex flex-col gap-6 h-full max-h-[85vh] overflow-y-auto pr-1">
      
      {/* Banner / Title */}
      <div className="flex flex-col gap-1.5 border-b border-gray-100 pb-4 pt-6 md:pt-8">
        <div className="flex items-center gap-2 text-indigo-600">
          <Award className="w-6 h-6 stroke-[2.2]" />
          <h2 className="font-display font-semibold text-lg text-gray-900 tracking-tight">Public Accountability Index</h2>
        </div>
        <p className="text-xs text-gray-500 font-sans">
          Gamifying municipal responsiveness. See real-time service delivery benchmarks, Ward rankings, and compliance grades across the entire city.
        </p>
      </div>

      {/* Sub-tabs switcher */}
      <div className="flex bg-slate-100/80 p-1 rounded-xl border border-gray-200/40">
        <button
          onClick={() => setScorecardTab('stats')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
            scorecardTab === 'stats' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" /> Performance Scores
        </button>
        <button
          onClick={() => setScorecardTab('predictive')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
            scorecardTab === 'predictive' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-rose-500" /> AI Predictive Radar
        </button>
      </div>

      {scorecardTab === 'predictive' ? (
        <PredictiveRadar />
      ) : (
        <>
          {/* Hero Stats Counters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 font-mono">Incident Solved</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-bold text-gray-900 tracking-tight">{stats.totalResolved}</span>
                <span className="text-xs font-semibold text-emerald-500">Verified</span>
              </div>
              <span className="text-[10px] text-gray-400 mt-1">Permanently fixed</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-rose-500 font-mono">Unresolved Hazards</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-bold text-gray-900 tracking-tight">{stats.totalActive}</span>
                <span className="text-xs font-semibold text-rose-400">Pending SLA</span>
              </div>
              <span className="text-[10px] text-gray-400 mt-1">Active on sentinel network</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-500 font-mono">Resolution Rate</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-bold text-gray-900 tracking-tight">{resolutionRate}%</span>
                <span className="text-xs font-semibold text-emerald-400">SLA Grade</span>
              </div>
              <span className="text-[10px] text-gray-400 mt-1">Target fulfillment: &gt;90%</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 font-mono">Total Reports Mapped</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-bold text-gray-900 tracking-tight">{totalSubmissions}</span>
                <span className="text-xs font-semibold text-indigo-400">Total Cases</span>
              </div>
              <span className="text-[10px] text-gray-400 mt-1">Deduplication active</span>
            </div>
          </div>

      {/* Category breakdown grids */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-gray-100/80 flex flex-col gap-3">
        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider text-slate-400">Hazard Density Breakdown</h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-white px-3 py-2.5 rounded-lg border border-gray-100 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400">Potholes</span>
              <span className="text-sm font-black text-gray-800 mt-0.5">{stats.potholeCount || 0}</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-rose-500" />
          </div>

          <div className="bg-white px-3 py-2.5 rounded-lg border border-gray-100 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400">Garbage</span>
              <span className="text-sm font-black text-gray-800 mt-0.5">{stats.garbageCount || 0}</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-orange-500" />
          </div>

          <div className="bg-white px-3 py-2.5 rounded-lg border border-gray-100 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400">Leaks</span>
              <span className="text-sm font-black text-gray-800 mt-0.5">{stats.waterCount || 0}</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-blue-500" />
          </div>

          <div className="bg-white px-3 py-2.5 rounded-lg border border-gray-100 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400">Lights</span>
              <span className="text-sm font-black text-gray-800 mt-0.5">{stats.lightingCount || 0}</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-yellow-500" />
          </div>
        </div>
      </div>

      {/* Ward responsiveness Leaderboard ranking scorecard */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider text-slate-400">Ward Response Rankings</h3>

        <div className="flex flex-col gap-3">
          {(stats.wardStats || [])
            .sort((a, b) => (b?.score || 0) - (a?.score || 0)) // Sort by descending responsiveness score
            .map((ward, idx) => {
              const rankInfo = getRankLetter(ward?.score || 0);
              return (
                <div key={ward?.wardName || `ward-${idx}`} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Leaderboard Index, Title and Officer info */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-slate-50 border border-gray-100 text-[10px] font-bold text-gray-500 shrink-0 font-mono mt-0.5">
                      #{idx + 1}
                    </span>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <h4 className="font-display font-bold text-gray-800 text-sm truncate">{ward?.wardName || 'Unknown Ward'}</h4>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-[10px] text-gray-400">
                        <span className="font-medium text-gray-600">Officer: {ward?.officerName || 'N/A'}</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="font-mono">{ward?.email || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quantitative Stats */}
                  <div className="grid grid-cols-3 gap-4 md:gap-8 text-center border-t border-b sm:border-none py-2 sm:py-0 border-gray-50">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Reported</span>
                      <span className="text-xs font-black text-gray-700">{ward?.totalReports || 0}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Resolved</span>
                      <span className="text-xs font-black text-emerald-600">{ward?.resolvedReports || 0}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Avg SLA Time</span>
                      <span className="text-xs font-black text-indigo-600 font-mono">{ward?.avgResolutionTimeHours || 0}h</span>
                    </div>
                  </div>

                  {/* Performance Rating bar & grade card */}
                  <div className="flex items-center gap-3 shrink-0">
                    {/* Score indicator */}
                    <div className="flex flex-col items-end gap-1 text-right w-[110px]">
                      <span className="text-[10px] font-bold text-gray-600">Response Rating</span>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-1.5 rounded-full"
                          style={{ width: `${ward?.score || 0}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-mono font-medium text-gray-400">{ward?.score || 0}/100</span>
                    </div>

                    {/* Letter Grade Card */}
                    <div className={`w-10 h-10 rounded-lg border flex flex-col items-center justify-center font-display font-black text-sm shrink-0 ${rankInfo.color}`}>
                      {rankInfo.letter}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
      </>
      )}

    </div>
  );
}
