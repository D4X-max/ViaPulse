import React from 'react';
import { Award, Shield, Zap, TrendingUp, Users, CheckCircle, Star, ThumbsUp } from 'lucide-react';
import { motion } from 'motion/react';
import { Report } from '../types';

interface CivicGamificationProps {
  user: any;
  reports: Report[];
  leaderboard?: any[];
}

interface UserScore {
  name: string;
  email?: string;
  reportCount: number;
  upvoteCount: number;
  points: number;
  badges: string[];
}

export default function CivicGamification({ user, reports = [], leaderboard }: CivicGamificationProps) {
  // Aggregate reports dynamically to compute leaderboard standings
  const getLeaderboardAndUserStats = (): UserScore[] => {
    if (leaderboard && leaderboard.length > 0) {
      return leaderboard;
    }

    const usersMap: Record<string, { name: string; email?: string; reportCount: number; upvoteCount: number }> = {};
    
    // Group all reports by reporter name
    reports.forEach(r => {
      const name = r.reporterName || 'Anonymous Citizen';
      const email = r.reporterEmail || '';
      
      if (!usersMap[name]) {
        usersMap[name] = {
          name,
          email,
          reportCount: 0,
          upvoteCount: 0
        };
      }
      
      usersMap[name].reportCount += 1;
      usersMap[name].upvoteCount += (r.upvotes || 0);
    });

    // Make sure current user is represented if logged in
    if (user) {
      const currentName = user.displayName || user.email?.split('@')[0] || 'Citizen';
      if (!usersMap[currentName]) {
        usersMap[currentName] = {
          name: currentName,
          email: user.email || '',
          reportCount: 0,
          upvoteCount: 0
        };
      }
    }

    // Map stats to points and badges according to the hackathon weight guidelines:
    // - 50 Hero Points per report entry
    // - 10 Hero Points per upvote/confirmation
    const standings: UserScore[] = Object.values(usersMap).map(u => {
      const points = (u.reportCount * 50) + (u.upvoteCount * 10);
      const badges: string[] = [];
      
      if (u.reportCount >= 5) badges.push('Road Hero 🏆');
      if (u.upvoteCount >= 15) badges.push('Civic Sentinel 🌟');
      if (points >= 200) badges.push('Clean City Champion 💪');
      
      return {
        ...u,
        points,
        badges
      };
    });

    // Sort descending by points
    standings.sort((a, b) => b.points - a.points);
    return standings;
  };

  const leaderboardData = getLeaderboardAndUserStats();

  const currentName = user?.displayName || user?.email?.split('@')[0] || 'Citizen';
  const currentUserStats = leaderboardData.find(u => u.email && user?.email && u.email === user.email) || 
                           leaderboardData.find(u => u.name === currentName) || {
    name: currentName,
    email: user?.email || '',
    reportCount: 0,
    upvoteCount: 0,
    points: 0,
    badges: []
  };

  // Build the dynamic milestones
  const achievements = [
    {
      id: 'road_hero',
      title: 'Road Hero 🏆',
      desc: 'Submit 5 or more hazard reports to help clear roadways.',
      icon: '🚧',
      unlocked: currentUserStats.reportCount >= 5,
      points: 250,
    },
    {
      id: 'civic_sentinel',
      title: 'Civic Sentinel 🌟',
      desc: 'Amplify civic issues by garnering 15 or more community confirmations/upvotes.',
      icon: '🌟',
      unlocked: currentUserStats.upvoteCount >= 15,
      points: 150,
    },
    {
      id: 'clean_city',
      title: 'Clean City Champion 💪',
      desc: 'Cross 200 total Hero Points to claim the crown.',
      icon: '💪',
      unlocked: currentUserStats.points >= 200,
      points: 300,
    }
  ];

  return (
    <div className="flex flex-col gap-6 pt-2">
      
      {/* 1. Profile Status / Impact Score */}
      <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl border border-slate-800 shadow-lg flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center font-display font-black text-white text-lg shadow-inner">
              {currentName.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-display font-bold text-sm text-white">{currentName}</span>
                <span className="bg-indigo-950 text-indigo-300 border border-indigo-900/60 font-bold text-[8px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">
                  Level {Math.max(1, Math.floor(currentUserStats.points / 300) + 1)} Ward Sentinel
                </span>
              </div>
              <span className="text-[10px] text-indigo-200">{currentUserStats.badges[0] || 'Civic Scout'}</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[9px] uppercase tracking-wider text-indigo-300 font-mono font-bold block">Current Score</span>
            <span className="text-2xl font-black font-mono tracking-tight text-white">{currentUserStats.points.toLocaleString()} <span className="text-[10px] text-indigo-300">PTS</span></span>
          </div>
        </div>

        {/* Level progress bar */}
        <div className="flex flex-col gap-1.5 mt-1 border-t border-slate-800 pt-3">
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>Next Rank: {currentUserStats.points >= 1500 ? 'Master Warden' : 'Civic Guardian'}</span>
            <span>{currentUserStats.points % 300} / 300 PTS</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-2 rounded-full" style={{ width: `${Math.min(100, ((currentUserStats.points % 300) / 300) * 100)}%` }} />
          </div>
          <p className="text-[9px] text-slate-400 italic">
            🎉 You need {300 - (currentUserStats.points % 300)} PTS to rank up! Reporting new active hazards earns you +50 PTS.
          </p>
        </div>
      </div>

      {/* Grid of badges & leaderboard */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        
        {/* Achievements Section */}
        <div className="md:col-span-7 flex flex-col gap-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
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
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-indigo-500" />
            Sentinel Leaderboard
          </h3>

          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-col gap-3">
            {leaderboardData.slice(0, 8).map((userItem, index) => {
              const rank = index + 1;
              const isActive = userItem.name === currentName;
              return (
                <div
                  key={userItem.name}
                  className={`flex items-center justify-between gap-3 py-1.5 border-b last:border-0 border-gray-50 ${
                    isActive ? 'bg-indigo-50/30 -mx-3 px-3 rounded-lg border-b-transparent' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`flex items-center justify-center w-5 h-5 rounded text-[10px] font-black font-mono shrink-0 ${
                      rank === 1 
                        ? 'bg-amber-50 text-amber-600 border border-amber-100' 
                        : rank === 2
                        ? 'bg-slate-50 text-slate-500 border border-slate-100'
                        : 'text-gray-400'
                    }`}>
                      #{rank}
                    </span>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="font-semibold text-gray-800 text-xs truncate">{userItem.name}</span>
                      <span className="text-[9px] text-gray-400 font-medium">
                        {userItem.badges[0] || 'Civic Scout'}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono font-black text-gray-700 shrink-0">
                    {userItem.points.toLocaleString()} pts
                  </span>
                </div>
              );
            })}
          </div>

          {/* Scoring guide card */}
          <div className="bg-indigo-50/40 p-4 rounded-xl border border-indigo-100/40 flex flex-col gap-2 text-xs">
            <span className="font-bold text-indigo-950 font-sans">Sentry Rewards System</span>
            <ul className="flex flex-col gap-1.5 text-[10px] text-indigo-900/80 list-disc pl-4 leading-normal font-medium">
              <li>Submit a new photo hazard report: <strong>+50 PTS</strong></li>
              <li>Garner community confirmations/upvotes: <strong>+10 PTS per upvote</strong></li>
            </ul>
          </div>

        </div>

      </div>

    </div>
  );
}
