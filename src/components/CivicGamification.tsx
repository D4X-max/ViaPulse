import React, { useState, useEffect } from 'react';
import { Award, Shield, Zap, TrendingUp, Users, CheckCircle, Star, ThumbsUp, Gift, ShoppingBag, MapPin, Coffee, ShieldCheck, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Report } from '../types';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Lottie from 'lottie-react';

interface CivicGamificationProps {
  user: any;
  reports?: Report[];
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
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'bazaar'>('leaderboard');
  const [leaderboardTimeframe, setLeaderboardTimeframe] = useState<'all' | 'weekly' | 'monthly'>('all');
  const [localLeaderboard, setLocalLeaderboard] = useState<any[] | null>(null);
  const [pointsSpent, setPointsSpent] = useState<number>(0);
  const [claimModalData, setClaimModalData] = useState<{ open: boolean; voucher?: string; rewardName?: string }>({ open: false });
  const [isClaiming, setIsClaiming] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [successLottie, setSuccessLottie] = useState<any>(null);

  useEffect(() => {
    if (leaderboardTimeframe !== 'all') {
      fetch(`/api/leaderboard?timeframe=${leaderboardTimeframe}`)
        .then(res => res.json())
        .then(data => setLocalLeaderboard(data))
        .catch(err => console.error("Error fetching timeframe leaderboard:", err));
    } else {
      setLocalLeaderboard(null);
    }
  }, [leaderboardTimeframe]);

  useEffect(() => {
    // Fetch a reliable simple confetti lottie JSON from a public CDN
    fetch('https://assets2.lottiefiles.com/packages/lf20_u4yrau.json')
      .then(r => r.json())
      .then(data => setSuccessLottie(data))
      .catch(() => {
        // Fallback Lottie URL if the first fails
        fetch('https://assets3.lottiefiles.com/packages/lf20_touohxv0.json')
          .then(r => r.json())
          .then(data => setSuccessLottie(data))
          .catch(e => console.error("Lottie fetch error", e));
      });
  }, []);

  useEffect(() => {
    if (user?.uid) {
      const fetchUserData = async () => {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setPointsSpent(docSnap.data().pointsSpent || 0);
          }
        } catch (error) {
          console.error("Failed to fetch user data:", error);
        }
      };
      fetchUserData();
    }
  }, [user]);

  const getLeaderboardAndUserStats = (): UserScore[] => {
    let baseData: UserScore[] = [];
    const targetLeaderboard = localLeaderboard || leaderboard;
    if (targetLeaderboard && targetLeaderboard.length > 0) {
      baseData = [...targetLeaderboard];
    } else {
      const usersMap: Record<string, { name: string; email?: string; reportCount: number; upvoteCount: number; resolvedCount: number; allTimeReportCount: number; allTimeUpvoteCount: number; allTimeResolvedCount: number; }> = {};
      const isGovUser = (email: string) => email.endsWith('.gov') || email === 'admin@city.gov' || email === 'ombudsman@viapulse.gov';

      const now = Date.now();
      const getCutoff = () => {
        if (leaderboardTimeframe === 'weekly') return now - 7 * 24 * 60 * 60 * 1000;
        if (leaderboardTimeframe === 'monthly') return now - 30 * 24 * 60 * 60 * 1000;
        return 0;
      };
      const cutoff = getCutoff();

      (reports || []).forEach(r => {
        const name = r?.reporterName || 'Anonymous Citizen';
        const email = r?.reporterEmail || '';
        
        if (email && isGovUser(email)) return;

        if (!usersMap[name]) {
          usersMap[name] = { name, email, reportCount: 0, upvoteCount: 0, resolvedCount: 0, allTimeReportCount: 0, allTimeUpvoteCount: 0, allTimeResolvedCount: 0 };
        }
        
        const reportTime = new Date(r.createdAt).getTime();
        const isWithinTimeframe = reportTime >= cutoff;
        const isResolved = r.status === 'RESOLVED' || r.status === 'CLOSED_VERIFIED';

        usersMap[name].allTimeReportCount += 1;
        usersMap[name].allTimeUpvoteCount += (r?.upvotes || 0);
        if (isResolved) usersMap[name].allTimeResolvedCount += 1;

        if (isWithinTimeframe) {
          usersMap[name].reportCount += 1;
          usersMap[name].upvoteCount += (r?.upvotes || 0);
          if (isResolved) usersMap[name].resolvedCount += 1;
        }
      });

      if (user && !isGovUser(user.email)) {
        const currentName = user?.displayName || user?.email?.split('@')[0] || 'Citizen';
        if (!usersMap[currentName]) {
          usersMap[currentName] = { name: currentName, email: user?.email || '', reportCount: 0, upvoteCount: 0, resolvedCount: 0, allTimeReportCount: 0, allTimeUpvoteCount: 0, allTimeResolvedCount: 0 };
        }
      }

      baseData = Object.values(usersMap).map(u => {
        const points = ((u?.reportCount || 0) * 50) + ((u?.upvoteCount || 0) * 10);
        const allTimePoints = ((u?.allTimeReportCount || 0) * 50) + ((u?.allTimeUpvoteCount || 0) * 10);
        
        const badges: string[] = [];
        
        if ((u?.allTimeReportCount || 0) >= 5) badges.push('Road Hero 🏆');
        if ((u?.allTimeUpvoteCount || 0) >= 15) badges.push('Civic Sentinel 🌟');
        if (allTimePoints >= 200) badges.push('Clean City Champion 💪');

        if ((u?.allTimeResolvedCount || 0) >= 1) badges.push('First Resolution 🥉');
        if ((u?.allTimeResolvedCount || 0) >= 5) badges.push('Community Fixer 🥈');
        if ((u?.allTimeResolvedCount || 0) >= 10) badges.push('Neighborhood Guardian 🥇');
        if ((u?.allTimeResolvedCount || 0) >= 25) badges.push('City Hero 🏆');
        
        return { ...u, points, badges };
      });
    }

    // Apply local pointsSpent deduction for current user so the UI updates instantly
    const adjustedData = baseData.map(u => {
      if (user?.email && u.email === user.email) {
        return { ...u, points: Math.max(0, u.points - pointsSpent) };
      }
      return u;
    });

    adjustedData.sort((a, b) => b.points - a.points);
    return adjustedData;
  };

  const leaderboardData = getLeaderboardAndUserStats() || [];
  const currentName = user?.displayName || user?.email?.split('@')[0] || 'Citizen';
  const currentUserStats = (leaderboardData || []).find(u => u?.email && user?.email && u.email === user.email) || 
                           (leaderboardData || []).find(u => u?.name === currentName) || {
    name: currentName, email: user?.email || '', reportCount: 0, upvoteCount: 0, points: 0, badges: []
  };

  const handleClaimReward = async (cost: number, rewardName: string) => {
    if (!user?.uid || isClaiming) return;
    if (currentUserStats.points < cost) return;

    setIsClaiming(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        pointsSpent: increment(cost)
      });
      
      setPointsSpent(prev => prev + cost);
      
      const voucherToken = `VP-${rewardName.substring(0, 3).toUpperCase().replace(/\s/g, '')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      setClaimModalData({ open: true, voucher: voucherToken, rewardName });
    } catch (err) {
      console.error("Failed to claim reward:", err);
    } finally {
      setIsClaiming(false);
    }
  };

  const rewards = [
    {
      tier: 'Bronze Tier',
      subtitle: 'Daily Commuter Hooks',
      color: 'from-amber-600 to-amber-700',
      textColor: 'text-amber-700',
      bgColor: 'bg-amber-50',
      items: [
        { name: 'Namma Metro Transit Voucher (₹50)', cost: 150, icon: <MapPin className="w-4 h-4" /> },
        { name: 'Fast-Track Virtual Pass (BBMP Desk)', cost: 300, icon: <Zap className="w-4 h-4" /> }
      ]
    },
    {
      tier: 'Silver Tier',
      subtitle: 'Local Economic Engine',
      color: 'from-slate-400 to-slate-500',
      textColor: 'text-slate-600',
      bgColor: 'bg-slate-50',
      items: [
        { name: '₹250 Swiggy/Zomato Gourmet Coupon', cost: 1200, icon: <Gift className="w-4 h-4" /> },
        { name: '₹300 Independent Bookstore/Cafe Voucher', cost: 1500, icon: <Coffee className="w-4 h-4" /> }
      ]
    },
    {
      tier: 'Gold Tier',
      subtitle: 'The Civic Guardian Peaks',
      color: 'from-yellow-400 to-amber-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50/50',
      items: [
        { name: 'ViaPulse "Civic Guardian" Premium Hoodie & Bottle', cost: 3000, icon: <ShoppingBag className="w-4 h-4" /> },
        { name: 'VIP Ward Director Pass (Breakfast Roundtable)', cost: 3500, icon: <ShieldCheck className="w-4 h-4" /> }
      ]
    }
  ];

  return (
    <div className="flex flex-col gap-6 pt-2 h-full max-w-5xl mx-auto">
      
      {/* 1. Profile Status / Impact Score */}
      <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl border border-slate-800 shadow-lg flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center font-display font-black text-white text-lg shadow-inner">
              {(currentName || 'Citizen').substring(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-display font-bold text-sm text-white">{currentName}</span>
                <span className="bg-indigo-950 text-indigo-300 border border-indigo-900/60 font-bold text-[8px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">
                  Level {Math.max(1, Math.floor((currentUserStats?.points || 0) / 300) + 1)} Ward Sentinel
                </span>
              </div>
              <span className="text-[10px] text-indigo-200">{(currentUserStats?.badges || [])[0] || 'Civic Scout'}</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[9px] uppercase tracking-wider text-indigo-300 font-mono font-bold block">Current Score</span>
            <span className="text-2xl font-black font-mono tracking-tight text-white">{(currentUserStats?.points || 0).toLocaleString()} <span className="text-[10px] text-indigo-300">PTS</span></span>
          </div>
        </div>
      </div>

      {/* Dual Tab Navigation */}
      <div className="flex p-1 bg-slate-100/80 rounded-xl border border-slate-200">
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'leaderboard' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Award className="w-4 h-4" />
          Ward Honor Roll
        </button>
        <button
          onClick={() => setActiveTab('bazaar')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'bazaar' ? 'bg-white text-emerald-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Gift className="w-4 h-4" />
          ViaPulse Rewards Bazaar
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'leaderboard' ? (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex p-1 bg-white border border-slate-200 rounded-lg w-full sm:w-auto shadow-sm">
                <button 
                  onClick={() => setLeaderboardTimeframe('all')}
                  className={`flex-1 sm:flex-none py-1.5 px-4 text-[10px] font-bold font-mono tracking-wider uppercase rounded-md transition-all ${leaderboardTimeframe === 'all' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
                >All Time</button>
                <button 
                  onClick={() => setLeaderboardTimeframe('weekly')}
                  className={`flex-1 sm:flex-none py-1.5 px-4 text-[10px] font-bold font-mono tracking-wider uppercase rounded-md transition-all ${leaderboardTimeframe === 'weekly' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
                >Weekly</button>
                <button 
                  onClick={() => setLeaderboardTimeframe('monthly')}
                  className={`flex-1 sm:flex-none py-1.5 px-4 text-[10px] font-bold font-mono tracking-wider uppercase rounded-md transition-all ${leaderboardTimeframe === 'monthly' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
                >Monthly</button>
              </div>
              
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search citizen or alias..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 placeholder:text-slate-400 shadow-sm"
                />
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-col gap-3">
              {(leaderboardData || []).filter(u => u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 15).map((userItem, index) => {
                const rank = index + 1;
                const isActive = userItem?.email === user?.email || userItem?.name === currentName;
                return (
                  <div
                    key={userItem?.name || `user-${index}`}
                    className={`flex items-center justify-between gap-3 py-2 border-b last:border-0 border-gray-50 ${
                      isActive ? 'bg-indigo-50/50 -mx-4 px-4 rounded-lg border-b-transparent' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`flex items-center justify-center w-6 h-6 rounded text-xs font-black font-mono shrink-0 ${
                        rank === 1 
                          ? 'bg-amber-100 text-amber-700 border border-amber-200 shadow-sm' 
                          : rank === 2
                          ? 'bg-slate-100 text-slate-600 border border-slate-200 shadow-sm'
                          : rank === 3
                          ? 'bg-orange-50 text-orange-700 border border-orange-200 shadow-sm'
                          : 'text-gray-400'
                      }`}>
                        #{rank}
                      </span>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="font-bold text-gray-800 text-sm truncate">{userItem?.name || 'Anonymous'} {isActive && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded ml-1 font-bold">YOU</span>}</span>
                        <span className="text-[10px] text-gray-500 font-medium">
                          {(userItem?.badges || [])[0] || 'Civic Scout'}
                        </span>
                      </div>
                    </div>

                    <span className="text-xs font-mono font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 shrink-0">
                      {(userItem?.points || 0).toLocaleString()} pts
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="bazaar"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-6"
          >
            {rewards.map((tier, tIdx) => (
              <div key={tIdx} className={`rounded-2xl border border-gray-200 overflow-hidden shadow-sm bg-white`}>
                <div className={`p-4 bg-gradient-to-r ${tier.color} text-white flex flex-col`}>
                  <h3 className="font-black text-lg tracking-tight">{tier.tier}</h3>
                  <p className="text-xs font-medium opacity-90">{tier.subtitle}</p>
                </div>
                <div className="p-4 flex flex-col gap-4">
                  {tier.items.map((item, iIdx) => {
                    const canAfford = currentUserStats.points >= item.cost;
                    const shortfall = item.cost - currentUserStats.points;
                    
                    return (
                      <div key={iIdx} className={`p-4 rounded-xl border flex flex-col gap-3 transition-all ${canAfford ? 'border-emerald-100 bg-emerald-50/30' : 'border-slate-100 bg-slate-50/50'}`}>
                        <div className="flex justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className={`p-2.5 rounded-lg shrink-0 ${tier.bgColor} ${tier.textColor}`}>
                              {item.icon}
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="font-bold text-gray-800 text-sm leading-tight">{item.name}</span>
                              <span className="text-xs font-mono font-black text-gray-500">{item.cost.toLocaleString()} PTS</span>
                            </div>
                          </div>
                        </div>

                        {canAfford ? (
                          <button
                            onClick={() => handleClaimReward(item.cost, item.name)}
                            disabled={isClaiming}
                            className="w-full mt-2 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider rounded-lg shadow-sm shadow-emerald-200 transition-all cursor-pointer flex items-center justify-center gap-2"
                          >
                            <Gift className="w-3.5 h-3.5" />
                            Claim Reward Voucher
                          </button>
                        ) : (
                          <div className="flex flex-col gap-1.5 mt-2">
                            <div className="flex justify-between text-[10px] text-gray-500 font-bold font-mono uppercase">
                              <span>Locked</span>
                              <span>Need {shortfall.toLocaleString()} more PTS</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-slate-400 h-1.5 rounded-full" style={{ width: `${Math.min(100, (currentUserStats.points / item.cost) * 100)}%` }} />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Claim Success Modal */}
      <AnimatePresence>
        {claimModalData.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full flex flex-col items-center text-center relative overflow-hidden border border-gray-100"
            >
              {successLottie && (
                <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center opacity-40">
                  <Lottie animationData={successLottie} loop={false} className="w-full h-full scale-[2]" />
                </div>
              )}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-50 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-5 relative z-10">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              
              <h2 className="text-xl font-black text-slate-800 tracking-tight mb-2 relative z-10">Reward Claimed!</h2>
              <p className="text-sm text-slate-500 font-medium mb-6 relative z-10">
                You have successfully claimed the <span className="font-bold text-slate-700">{claimModalData.rewardName}</span>.
              </p>
              
              <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col items-center justify-center gap-3 relative z-10">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Voucher Code</span>
                <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 border-dashed w-full">
                  <span className="text-xl font-mono font-black text-indigo-600 tracking-widest block">{claimModalData.voucher}</span>
                </div>
                {/* Mock QR Code Pattern */}
                <div className="grid grid-cols-5 grid-rows-5 gap-1 p-2 bg-white rounded border border-slate-100 mt-2 opacity-80">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div key={i} className={`w-3 h-3 ${Math.random() > 0.4 ? 'bg-slate-800' : 'bg-transparent'} ${[0,4,20,24].includes(i) ? 'bg-indigo-600 rounded-sm' : ''}`}></div>
                  ))}
                </div>
              </div>
              
              <button
                onClick={() => setClaimModalData({ open: false })}
                className="mt-6 w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-lg transition-all relative z-10 cursor-pointer"
              >
                Close & Return
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
