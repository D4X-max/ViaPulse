import React from 'react';
import { Award, Shield, Zap, TrendingUp, Users, CheckCircle, Star, ThumbsUp } from 'lucide-react';
import { motion } from 'motion/react';

export default function CivicGamification() {
  const achievements = [
    {
      id: 'pothole',
      title: 'Pothole Sentinel',
      desc: 'Discovered or confirmed 3+ high-severity road hazards.',
      icon: '🚧',
      unlocked: true,
      points: 150,
    },
    {
      id: 'leak',
      title: 'Aquifer Guardian',
      desc: 'Reported major active water main or sprinkler pipe leaks.',
      icon: '💧',
      unlocked: true,
      points: 200,
    },
    {
      id: 'verification',
      title: 'Community Pillar',
      desc: 'Provided 5+ verify/confirm tags on active local incidents.',
      icon: '🤝',
      unlocked: false,
      points: 300,
    },
    {
      id: 'lantern',
      title: 'Grid Illuminator',
      desc: 'Identified dark street corners and non-functional lamps.',
      icon: '⚡',
      unlocked: true,
      points: 100,
    },
    {
      id: 'commentary',
      title: 'Civic Vindicator',
      desc: 'Contributed 5+ public comments or photos tracking repair works.',
      icon: '💬',
      unlocked: false,
      points: 120,
    },
  ];

  const leaderboard = [
    { rank: 1, name: 'Aria Chen', points: 4250, badge: 'Grand Overseer', active: true },
    { rank: 2, name: 'David K.', points: 3910, badge: 'District Watcher', active: false },
    { rank: 3, name: 'Toby Sparks', points: 3120, badge: 'Roads Veteran', active: false },
    { rank: 4, name: 'Elena Rostova', points: 2850, badge: 'SLA Watchdog', active: false },
    { rank: 5, name: 'Marcus L.', points: 2400, badge: 'Civic Apprentice', active: false },
  ];

  return (
    <div className="flex flex-col gap-6 pt-6 md:pt-8">
      
      {/* 1. Profile Status / Impact Score */}
      <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl border border-slate-800 shadow-lg flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center font-display font-black text-white text-lg shadow-inner">
              AC
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-display font-bold text-sm">Aria Chen</span>
                <span className="bg-indigo-950 text-indigo-300 border border-indigo-900/60 font-bold text-[8px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">
                  Level 4 Ward Sentinel
                </span>
              </div>
              <span className="text-[10px] text-indigo-200">District 1 Area Commander</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[9px] uppercase tracking-wider text-indigo-300 font-mono font-bold block">Current Score</span>
            <span className="text-2xl font-black font-mono tracking-tight text-white">4,250 <span className="text-[10px] text-indigo-300">PTS</span></span>
          </div>
        </div>

        {/* Level progress bar */}
        <div className="flex flex-col gap-1.5 mt-1 border-t border-slate-800 pt-3">
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>Next Rank: Civic Guardian</span>
            <span>4,250 / 5,000 PTS</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-2 rounded-full" style={{ width: '85%' }} />
          </div>
          <p className="text-[9px] text-slate-400 italic">
            🎉 You need 750 PTS to rank up! Reporting new active hazards earns you +150 PTS.
          </p>
        </div>
      </div>

      {/* Grid of badges & leaderboard */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        
        {/* Achievements Section */}
        <div className="md:col-span-7 flex flex-col gap-3">
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Star className="w-4 h-4 text-indigo-500 fill-indigo-100" />
            Civic Achievements
          </h3>

          <div className="flex flex-col gap-2.5">
            {achievements.map((item) => (
              <div
                key={item.id}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3.5 transition-all ${
                  item.unlocked
                    ? 'bg-white border-gray-100 shadow-sm'
                    : 'bg-slate-50/50 border-gray-100 opacity-60 select-none'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl filter drop-shadow-sm shrink-0">{item.icon}</span>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="font-semibold text-gray-800 text-xs flex items-center gap-1.5">
                      {item.title}
                      {item.unlocked && (
                        <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold text-[8px] px-1.5 py-0.2 rounded uppercase">
                          Unlocked
                        </span>
                      )}
                    </span>
                    <p className="text-[10px] text-gray-400 leading-tight">{item.desc}</p>
                  </div>
                </div>

                <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50/80 border border-indigo-100 px-2 py-0.5 rounded shrink-0">
                  +{item.points} PTS
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard Section */}
        <div className="md:col-span-5 flex flex-col gap-3">
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-indigo-500" />
            Sentinel Leaderboard
          </h3>

          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-col gap-3">
            {leaderboard.map((user) => (
              <div
                key={user.rank}
                className={`flex items-center justify-between gap-3 py-1.5 border-b last:border-0 border-gray-50 ${
                  user.active ? 'bg-indigo-50/30 -mx-3 px-3 rounded-lg border-b-transparent' : ''
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`flex items-center justify-center w-5 h-5 rounded text-[10px] font-black font-mono shrink-0 ${
                    user.rank === 1 
                      ? 'bg-amber-50 text-amber-600 border border-amber-100' 
                      : user.rank === 2
                      ? 'bg-slate-50 text-slate-500 border border-slate-100'
                      : 'text-gray-400'
                  }`}>
                    #{user.rank}
                  </span>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="font-semibold text-gray-800 text-xs truncate">{user.name}</span>
                    <span className="text-[9px] text-gray-400 font-medium">{user.badge}</span>
                  </div>
                </div>

                <span className="text-[10px] font-mono font-black text-gray-700 shrink-0">
                  {user.points.toLocaleString()} pts
                </span>
              </div>
            ))}
          </div>

          {/* Scoring guide card */}
          <div className="bg-indigo-50/40 p-4 rounded-xl border border-indigo-100/40 flex flex-col gap-2 text-xs">
            <span className="font-bold text-indigo-950 font-sans">Sentry Rewards System</span>
            <ul className="flex flex-col gap-1.5 text-[10px] text-indigo-900/80 list-disc pl-4 leading-normal">
              <li>Submit a new photo hazard report: <strong>+150 PTS</strong></li>
              <li>Verify presence of a nearby incident: <strong>+30 PTS</strong></li>
              <li>Add a commentary update on repair: <strong>+20 PTS</strong></li>
              <li>First to confirm resolution with photo: <strong>+250 PTS</strong></li>
            </ul>
          </div>

        </div>

      </div>

    </div>
  );
}
