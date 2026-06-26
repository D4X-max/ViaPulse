import React from 'react';
import { AlertTriangle, TrendingUp, Zap, Clock, ShieldAlert, BarChart3, HelpCircle } from 'lucide-react';

export default function PredictiveRadar() {
  const predictions = [
    {
      id: 'potholes',
      hazard: 'Pothole Expansion Rate',
      risk: 'CRITICAL',
      percentage: 82,
      trigger: 'Heavy freeze-thaw thermal cycle predicted over the next 72 hours.',
      suggestion: 'Pre-load hot asphalt trucks in Ward 1 & 4 to intercept growth.',
      color: 'text-rose-600 bg-rose-50 border-rose-100',
      barColor: 'bg-rose-500',
    },
    {
      id: 'water',
      hazard: 'Stormwater Drainage Backflow',
      risk: 'HIGH',
      percentage: 64,
      trigger: '95% likelihood of a major precipitation front exceeding 1.2" rainfall.',
      suggestion: 'Dispatch sanitation crews to clear catch-basins on Eastside Boulevard.',
      color: 'text-amber-600 bg-amber-50 border-amber-100',
      barColor: 'bg-amber-500',
    },
    {
      id: 'lighting',
      hazard: 'Grid Bulb Defatigation',
      risk: 'MEDIUM',
      percentage: 45,
      trigger: 'Streetlamps in Ward 2 exceeding 11,500 active burn hours.',
      suggestion: 'Replace block fixtures during scheduled maintenance cycles.',
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
      barColor: 'bg-indigo-500',
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      
      {/* Risk Alert Header Banner */}
      <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-start gap-3.5">
        <ShieldAlert className="w-6 h-6 text-rose-500 shrink-0 mt-0.5 animate-pulse" />
        <div className="flex flex-col gap-1">
          <span className="font-bold text-rose-950 text-xs">Incoming Weather/Thermal Alert System</span>
          <p className="text-[10px] text-rose-800 leading-relaxed font-sans">
            Our predictive AI has detected a significant thermal shift. Rapid roadway surface contraction is predicted to expand active micro-fissures into heavy grade potholes in <strong>Ward 1 (Downtown)</strong> and <strong>Ward 4 (North Hills)</strong> within 3 days. Early containment is highly recommended.
          </p>
        </div>
      </div>

      {/* Grid of predictors */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        
        {/* Risk Indicators */}
        <div className="md:col-span-7 flex flex-col gap-4">
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-rose-500" />
            Infrastructure Wear Predictions
          </h3>

          <div className="flex flex-col gap-3">
            {predictions.map((p) => (
              <div key={p.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3 border-b border-gray-50 pb-2.5">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-gray-800 text-xs">{p.hazard}</span>
                    <span className="text-[9px] font-mono text-gray-400">Trigger Model: Weather & Lifespan Coefficients</span>
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${p.color}`}>
                    {p.risk} RISK
                  </span>
                </div>

                {/* Meter */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-[9px] font-mono font-medium text-gray-500">
                    <span>Incidence Probability Metric</span>
                    <span>{p.percentage}% Probability</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className={`${p.barColor} h-2 rounded-full`} style={{ width: `${p.percentage}%` }} />
                  </div>
                </div>

                {/* Details */}
                <div className="bg-slate-50/80 rounded-lg p-2.5 border border-gray-100 text-[10px] flex flex-col gap-1.5 leading-normal text-gray-600">
                  <p>⚠️ <strong>Forecast Cause:</strong> {p.trigger}</p>
                  <p className="text-indigo-600">💡 <strong>Optimal Interception:</strong> {p.suggestion}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Predictive Insights Analytics */}
        <div className="md:col-span-5 flex flex-col gap-4">
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-indigo-500" />
            Predicted Resource Savings
          </h3>

          <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 border border-slate-800 shadow-md flex flex-col gap-4">
            <div className="flex flex-col gap-0.5 border-b border-slate-800 pb-3">
              <span className="text-[9px] uppercase tracking-wider text-indigo-400 font-mono font-bold">Autonomous Dispatch Impact</span>
              <h4 className="text-sm font-bold font-display text-white">Projected Municipal Savings</h4>
            </div>

            <div className="flex flex-col gap-3 font-mono">
              <div className="flex justify-between items-baseline py-1 border-b border-slate-800/60 text-xs">
                <span className="text-slate-400">Claims Mitigated:</span>
                <span className="text-emerald-400 font-bold">$24,500</span>
              </div>
              <div className="flex justify-between items-baseline py-1 border-b border-slate-800/60 text-xs">
                <span className="text-slate-400">Crew Overtime Saved:</span>
                <span className="text-emerald-400 font-bold">$18,200</span>
              </div>
              <div className="flex justify-between items-baseline py-1 border-b border-slate-800/60 text-xs">
                <span className="text-slate-400">SLA Breach Reductions:</span>
                <span className="text-emerald-400 font-bold">-48% Time</span>
              </div>
              <div className="flex justify-between items-baseline py-1 text-xs">
                <span className="text-slate-400">Total Est. Savings:</span>
                <span className="text-indigo-400 font-bold text-sm">$42,700 / mo</span>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[9px] text-slate-400 leading-normal">
              💡 <strong>How it works:</strong> By patching potholes and clearing drain inlets <em>before</em> they expand or back up, the city avoids expensive emergency crew callouts and liability claims from motorists/pedestrians.
            </div>
          </div>

          {/* Model Trust Level */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-col gap-2.5">
            <span className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-indigo-500" />
              Machine Learning Trust Factor
            </span>
            <div className="flex items-center justify-between text-[10px] text-gray-500 border-t border-gray-50 pt-2 font-mono">
              <span>Model Confidence:</span>
              <span className="text-indigo-600 font-bold">94.8% (Verified)</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono">
              <span>Primary Grounding:</span>
              <span className="text-indigo-600 font-bold">NOAA Weather APIs</span>
            </div>
            <p className="text-[9px] text-gray-400 leading-normal italic mt-1">
              *Trained on 3 years of San Francisco municipal incident history and climate fluctuation indexes.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
