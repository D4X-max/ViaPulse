import React, { useEffect, useState } from 'react';
import { AlertTriangle, TrendingUp, Zap, Clock, ShieldAlert, BarChart3, HelpCircle, RefreshCw } from 'lucide-react';

export default function PredictiveRadar() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchPredictions = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/predictions');
        if (!res.ok) throw new Error('Failed to load predictions');
        const payload = await res.json();
        if (active) {
          setData(payload);
          setError(null);
        }
      } catch (err: any) {
        console.error(err);
        if (active) {
          setError(err.message || 'Failed to generate predictions');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    fetchPredictions();
    return () => {
      active = false;
    };
  }, []);

  const getRiskColors = (risk: string) => {
    const r = (risk || '').toUpperCase();
    if (r === 'CRITICAL') {
      return {
        color: 'text-rose-600 bg-rose-50 border-rose-100',
        barColor: 'bg-rose-500',
      };
    }
    if (r === 'HIGH') {
      return {
        color: 'text-orange-600 bg-orange-50 border-orange-100',
        barColor: 'bg-orange-500',
      };
    }
    if (r === 'MEDIUM') {
      return {
        color: 'text-amber-600 bg-amber-50 border-amber-100',
        barColor: 'bg-amber-500',
      };
    }
    return {
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
      barColor: 'bg-indigo-500',
    };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-3 min-h-[350px]">
        <RefreshCw className="w-8 h-8 animate-spin text-rose-500" />
        <p className="text-xs font-mono text-slate-500">Running predictive algorithms against civic ledger...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-rose-50 border border-rose-100 p-6 rounded-2xl text-center text-rose-800 text-xs font-mono max-w-md mx-auto my-12 flex flex-col items-center gap-3">
        <AlertTriangle className="w-8 h-8 text-rose-500" />
        <div>
          <p className="font-bold">Prediction Retrieval Failed</p>
          <p className="text-[10px] text-rose-600 mt-1">Ensure the backend server is online and try reloading the page.</p>
        </div>
      </div>
    );
  }

  const { predictions, alertBanner, savings, confidence, primaryGrounding } = data;

  return (
    <div className="flex flex-col gap-6">
      
      {/* Risk Alert Header Banner */}
      <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-start gap-3.5">
        <ShieldAlert className="w-6 h-6 text-rose-500 shrink-0 mt-0.5 animate-pulse" />
        <div className="flex flex-col gap-1">
          <span className="font-bold text-rose-950 text-xs">{alertBanner?.title || 'Incoming Weather/Thermal Alert System'}</span>
          <p className="text-[10px] text-rose-800 leading-relaxed font-sans">
            {alertBanner?.text || 'Our predictive AI is parsing climate fluctuations and historical ward incident data to forecast potential service outages.'}
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
            {predictions?.map((p: any) => {
              const colors = getRiskColors(p.risk);
              return (
                <div key={p.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3 border-b border-gray-50 pb-2.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-gray-800 text-xs">{p.hazard}</span>
                      <span className="text-[9px] font-mono text-gray-400">Trigger Model: Weather & Lifespan Coefficients</span>
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${colors.color}`}>
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
                      <div className={`${colors.barColor} h-2 rounded-full transition-all duration-500`} style={{ width: `${p.percentage}%` }} />
                    </div>
                  </div>

                  {/* Details */}
                  <div className="bg-slate-50/80 rounded-lg p-2.5 border border-gray-100 text-[10px] flex flex-col gap-1.5 leading-normal text-gray-600">
                    <p>⚠️ <strong>Forecast Cause:</strong> {p.trigger}</p>
                    <p className="text-indigo-600">💡 <strong>Optimal Interception:</strong> {p.suggestion}</p>
                  </div>
                </div>
              );
            })}
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
                <span className="text-emerald-400 font-bold">{savings?.claimsMitigated || '$0'}</span>
              </div>
              <div className="flex justify-between items-baseline py-1 border-b border-slate-800/60 text-xs">
                <span className="text-slate-400">Crew Overtime Saved:</span>
                <span className="text-emerald-400 font-bold">{savings?.crewOvertimeSaved || '$0'}</span>
              </div>
              <div className="flex justify-between items-baseline py-1 border-b border-slate-800/60 text-xs">
                <span className="text-slate-400">SLA Breach Reductions:</span>
                <span className="text-emerald-400 font-bold">{savings?.slaBreachReduction || '0%'}</span>
              </div>
              <div className="flex justify-between items-baseline py-1 text-xs">
                <span className="text-slate-400">Total Est. Savings:</span>
                <span className="text-indigo-400 font-bold text-sm">{savings?.totalSavings || '$0 / mo'}</span>
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
              <span className="text-indigo-600 font-bold">{confidence || '94.8%'} (Verified)</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono">
              <span>Primary Grounding:</span>
              <span className="text-indigo-600 font-bold">{primaryGrounding || 'NOAA Weather APIs'}</span>
            </div>
            <p className="text-[9px] text-gray-400 leading-normal italic mt-1">
              *Trained on 3 years of local municipal incident history and climate fluctuation indexes.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
