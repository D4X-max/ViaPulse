import { useState, useEffect } from 'react';
import { ShieldCheck, Shield, Eye, Award, CheckCircle, Navigation, MapPin, RefreshCw, AlertCircle, BarChart3, LogIn, LogOut, Home, Send, HelpCircle, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReportMap from './components/ReportMap';
import CitizenPortal from './components/CitizenPortal';
import OmbudsmanDashboard from './components/OmbudsmanDashboard';
import PublicScorecard from './components/PublicScorecard';
import CivicGamification from './components/CivicGamification';
import TopographicBackground from './components/TopographicBackground';
import { Report, DashboardStats } from './types';
import { auth } from './lib/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import AuthGate from './components/AuthGate';

// 10-point Hackathon SPEC Components
import HomeDashboard from './components/HomeDashboard';
import ReportHazard from './components/ReportHazard';
import TrackingHub from './components/TrackingHub';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import FloatingChatbot from './components/FloatingChatbot';
import ProfileSettings from './components/ProfileSettings';

export default function App() {
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalActive: 0,
    totalResolved: 0,
    potholeCount: 0,
    garbageCount: 0,
    waterCount: 0,
    lightingCount: 0,
    wardStats: []
  });
  
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [newReportLocation, setNewReportLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'report' | 'tracking' | 'ombudsman' | 'league' | 'scorecard'>('home');
  const [mapCategoryFilter, setMapCategoryFilter] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Authentication State
  const [user, setUser] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Create a clean userRole state hook: 'citizen' | 'admin' | null
  const [userRole, setUserRole] = useState<'citizen' | 'admin' | null>(null);

  // Sync userRole dynamically based on authentication state
  useEffect(() => {
    if (user) {
      const isGov = user.email?.endsWith('.gov') || 
                    user.email === 'ombudsman@viapulse.gov' || 
                    user.email === 'admin@city.gov';
      setUserRole(isGov ? 'admin' : 'citizen');
    } else {
      setUserRole(null);
    }
  }, [user]);

  // Auto-route active tab on role changes or mount
  useEffect(() => {
    if (userRole === 'admin') {
      setActiveTab('ombudsman');
    } else if (userRole === 'citizen') {
      // Standard citizen default tab is home portal
      if (activeTab === 'ombudsman') {
        setActiveTab('home');
      }
    }
  }, [userRole]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const isGov = currentUser.email?.endsWith('.gov') || 
                      currentUser.email === 'ombudsman@viapulse.gov' || 
                      currentUser.email === 'admin@city.gov';
        setUserRole(isGov ? 'admin' : 'citizen');

        try {
          await fetch('/api/profiles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Citizen',
              photoURL: currentUser.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser.email}`
            })
          });
          fetchData(true);
        } catch (err) {
          console.error('Error registering user profile:', err);
        }
      } else {
        setUserRole(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserRole(null);
      localStorage.removeItem('municipal_override');
      showToast('success', 'Logged out of civic node.');
    } catch (err: any) {
      console.error('Sign-out failure:', err);
      showToast('error', 'Sign-out failed.');
    }
  };

  // Load Initial Data
  const fetchData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const reportsRes = await fetch('/api/reports');
      const reportsData = await reportsRes.json();
      setReports(reportsData);

      // Sync selected report if it was updated
      if (selectedReport) {
        const updated = reportsData.find((r: Report) => r.id === selectedReport.id);
        if (updated) setSelectedReport(updated);
      }

      const statsRes = await fetch('/api/stats');
      const statsData = await statsRes.json();
      setStats(statsData);

      const leaderboardRes = await fetch('/api/leaderboard');
      const leaderboardData = await leaderboardRes.json();
      setLeaderboard(leaderboardData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      showToast('error', 'Network sync failed. Operating offline/simulated.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Show Toast notification helper
  const showToast = (type: 'success' | 'info' | 'error', text: string) => {
    setNotification({ type, text });
    setTimeout(() => {
      setNotification(null);
    }, 6000);
  };

  // Callback when citizen logs a new complaint
  const handleReportCreated = (newReport: Report, isDuplicate: boolean, msg: string) => {
    showToast(isDuplicate ? 'info' : 'success', msg);
    fetchData(true);
    setSelectedReport(newReport);
  };

  // Upvote incident
  const handleUpvote = async (id: string) => {
    try {
      const res = await fetch(`/api/reports/${id}/upvote`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to register upvote');
      const updated = await res.json();
      
      // Update local state smoothly
      setReports(prev => prev.map(r => r.id === id ? updated : r));
      setSelectedReport(updated);
      showToast('success', 'Complaint urgency escalated! Upvote registered.');
      fetchData(true);
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to upvote.');
    }
  };

  // Submit comment
  const handleAddComment = async (id: string, author: string, text: string) => {
    try {
      const res = await fetch(`/api/reports/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author, text })
      });
      if (!res.ok) throw new Error('Comment failed');
      const updated = await res.json();

      setReports(prev => prev.map(r => r.id === id ? updated : r));
      setSelectedReport(updated);
      showToast('success', 'Public commentary registered successfully.');
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to submit comment.');
    }
  };

  // Manual Status updating inside Ombudsman view
  const handleStatusUpdated = (updatedReport: Report) => {
    setReports(prev => prev.map(r => r.id === updatedReport.id ? updatedReport : r));
    setSelectedReport(updatedReport);
    showToast('success', `Dispatch record updated: ${updatedReport.status}`);
    fetchData(true);
  };

  // Visual Verification submission inside Ombudsman view
  const handleVerifyResolution = async (id: string, resolutionImage: string, resolverName: string, comment: string) => {
    try {
      const res = await fetch(`/api/reports/${id}/verify-resolution`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolutionImage, resolverName, comment })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Visual verification failed.');
      }

      const data = await res.json();
      
      // Update local reports and selected report
      setReports(prev => prev.map(r => r.id === id ? data.report : r));
      setSelectedReport(data.report);
      
      if (data.approved) {
        showToast('success', 'AI Visual Verification APPROVED! Case resolved and closed.');
      } else {
        showToast('error', 'AI Visual Verification REJECTED! Repair has been flagged as insufficient.');
      }

      fetchData(true);
      return data;
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  };

  // Click on map to place a pin for a new complaint
  const handleSelectLocationFromMap = (lat: number, lng: number) => {
    // Only allow changing location pin if citizen portal is open
    if (activeTab === 'citizen') {
      setNewReportLocation({ latitude: lat, longitude: lng });
      showToast('info', `Geolocation updated: Pin placed on map.`);
    }
  };



  // If user is not signed in or role is not resolved, display the elegant dual-path Auth Gate
  if (!user && !userRole) {
    return (
      <div className="min-h-screen bg-[#0c231c] font-sans flex flex-col justify-center items-center antialiased relative z-0 p-4">
        <TopographicBackground />
        
        {/* Absolute Header Branding */}
        <div className="absolute top-6 left-6 z-10 select-none">
          <div className="flex items-center bg-black px-3.5 py-2 rounded-xl border border-slate-900 shadow-lg h-11">
            <span className="font-display font-black tracking-wide text-sm sm:text-base flex items-center leading-none">
              <span className="text-[#f14d24]">VIA</span>
              <span className="text-[#00af50] ml-1.5">PULSE</span>
            </span>
          </div>
        </div>

        <AuthGate 
          onAuthSuccess={async (authenticatedUser, role) => {
            setUser(authenticatedUser);
            setUserRole(role);
            try {
              await fetch('/api/profiles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  uid: authenticatedUser.uid,
                  email: authenticatedUser.email,
                  displayName: authenticatedUser.displayName || authenticatedUser.email?.split('@')[0] || 'Citizen',
                  photoURL: authenticatedUser.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${authenticatedUser.email}`
                })
              });
              fetchData(true);
            } catch (err) {
              console.error('Error registering profile onAuthSuccess:', err);
            }
          }} 
          showToast={showToast}
        />
        
        {/* Toast Notification Container inside AuthGate */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-6 left-1/2 -translate-x-1/2 z-[1100] w-full max-w-md px-4"
            >
              <div className={`p-4 rounded-xl border shadow-lg flex items-start gap-3 backdrop-blur-md ${
                notification.type === 'success'
                  ? 'bg-emerald-50/95 border-emerald-100 text-emerald-800'
                  : notification.type === 'error'
                  ? 'bg-rose-50/95 border-rose-100 text-rose-800'
                  : 'bg-indigo-50/95 border-indigo-100 text-indigo-800'
              }`}>
                {notification.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : notification.type === 'error' ? (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                ) : (
                  <Navigation className="w-5 h-5 text-indigo-600 shrink-0" />
                )}
                <div className="flex-1 text-xs text-slate-800">
                  <span className="font-bold">ViaPulse Sentinel</span>
                  <p className="mt-0.5 leading-normal opacity-90">{notification.text}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c231c] font-sans flex flex-col antialiased relative z-0">
      <TopographicBackground />
      
      {/* 1. Header/Navigation Brand Bar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-[1000] px-4 md:px-8 py-3.5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between shadow-sm">
        <div className="flex items-center justify-between w-full md:w-auto">
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5 select-none">
            <div className="flex items-center justify-center bg-[#1c2026] rounded-xl border border-slate-800 shadow-sm h-10 w-10 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#1c2026] to-[#0f172a] pointer-events-none"></div>
              <svg viewBox="0 0 100 100" className="w-full h-full p-1.5 relative z-10 drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="vpGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#1e40af" />
                    <stop offset="40%" stopColor="#0ea5e9" />
                    <stop offset="100%" stopColor="#2dd4bf" />
                  </linearGradient>
                  <linearGradient id="vpGradDark" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#1e3a8a" />
                    <stop offset="100%" stopColor="#0369a1" />
                  </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="42" stroke="url(#vpGrad)" strokeWidth="6" opacity="0.8" strokeDasharray="180 80" strokeDashoffset="60" strokeLinecap="round" />
                <path d="M 18 42 L 35 78 L 50 45 L 62 65 L 72 35 L 85 48" stroke="url(#vpGradDark)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M 22 40 L 39 76 L 54 43 L 66 63 L 76 33 L 89 46" stroke="url(#vpGrad)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M 75 18 L 70 26 L 78 26 L 74 35" stroke="#2dd4bf" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="#2dd4bf" />
              </svg>
            </div>
            <span className="font-display font-black tracking-widest text-lg sm:text-xl flex items-center leading-none text-slate-800">
              VIA<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0ea5e9] to-[#2dd4bf] ml-0.5">PULSE</span>
            </span>
          </div>
          
          {/* Controls side on mobile */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-gray-500 disabled:opacity-50 transition-all border border-gray-100"
              title="Refresh Data Logs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
            </button>

            {authLoading ? (
              <div className="w-6 h-6 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin"></div>
            ) : user ? (
              <div className="flex items-center gap-1.5 pl-1.5 border-l border-gray-100">
                <img
                  src={user.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.email}`}
                  alt={user.displayName || 'User'}
                  className="w-7 h-7 rounded-full border border-indigo-100 cursor-pointer hover:ring-2 ring-indigo-500 transition-all"
                  referrerPolicy="no-referrer"
                  onClick={() => setActiveTab('profile')}
                />
                <button
                  onClick={handleSignOut}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setUser(null); setUserRole(null); }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-sm"
              >
                <LogIn className="w-3 h-3" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Workspace Tab Nav Toggles */}
        <div className="flex bg-slate-100/80 p-1 rounded-xl border border-gray-200/40 w-full md:w-auto overflow-x-auto scrollbar-none justify-start sm:justify-center">
          <div className="flex items-center gap-1 min-w-max w-full justify-around sm:justify-center">
            {userRole === 'citizen' && (
              <>
                <button
                  onClick={() => { setActiveTab('home'); setNewReportLocation(null); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'home'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Home className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Home Desk</span>
                </button>

                <button
                  onClick={() => { setActiveTab('report'); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'report'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Send className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Report Hazard</span>
                </button>

                <button
                  onClick={() => { setActiveTab('tracking'); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'tracking'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Tracking & Hub</span>
                </button>

                <button
                  onClick={() => { setActiveTab('league'); setNewReportLocation(null); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'league'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  <span>Leaderboard</span>
                </button>
              </>
            )}
            
            {userRole === 'admin' && (
              <button
                onClick={() => { setActiveTab('ombudsman'); setNewReportLocation(null); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'ombudsman'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Ombudsman Desk</span>
              </button>
            )}

            <button
              onClick={() => { setActiveTab('scorecard'); setNewReportLocation(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'scorecard'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-rose-500" />
              <span>Public Indexes</span>
            </button>
          </div>
        </div>

        {/* Sync & User Auth Controls for Desktop */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-gray-500 disabled:opacity-50 transition-all border border-gray-100"
            title="Refresh Data Logs"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          {authLoading ? (
            <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin"></div>
          ) : user ? (
            <div className="flex items-center gap-2 border-l border-gray-100 pl-3">
              <button 
                onClick={() => setActiveTab('profile')}
                className="flex items-center gap-2 text-left hover:bg-slate-50 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <img
                  src={user.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.email}`}
                  alt={user.displayName || 'User'}
                  className="w-9 h-9 rounded-full border border-indigo-100"
                  referrerPolicy="no-referrer"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-gray-800 leading-tight">
                    {user.displayName || 'Sentinel'}
                  </span>
                  <span className="text-[10px] text-gray-400 leading-tight">
                    {user.email}
                  </span>
                </div>
              </button>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                title="Toggle Theme"
              >
                {isDarkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
              </button>
              <button
                onClick={handleSignOut}
                className="p-2 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setUser(null); setUserRole(null); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </header>

      {/* Toast Notification Container */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[1100] w-full max-w-md px-4"
          >
            <div className={`p-4 rounded-xl border shadow-lg flex items-start gap-3 backdrop-blur-md ${
              notification.type === 'success'
                ? 'bg-emerald-50/95 border-emerald-100 text-emerald-800'
                : notification.type === 'error'
                ? 'bg-rose-50/95 border-rose-100 text-rose-800'
                : 'bg-indigo-50/95 border-indigo-100 text-indigo-800'
            }`}>
              {notification.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : notification.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              ) : (
                <Navigation className="w-5 h-5 text-indigo-600 shrink-0" />
              )}
              <div className="flex-1 text-xs">
                <span className="font-bold">ViaPulse Sentinel</span>
                <p className="mt-0.5 leading-normal opacity-90">{notification.text}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Loading State Overlay */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-gray-500 font-sans uppercase tracking-wider">Synchronizing Civic Node Ledger...</p>
        </div>
      ) : (
        /* 3. Main Workspace Grid - Split Map Layout */
        <main className={`flex-1 grid grid-cols-1 ${['tracking', 'league'].includes(activeTab) ? '' : 'lg:grid-cols-12'} gap-6 p-4 md:p-6 lg:p-8 pt-8 md:pt-8 lg:pt-8 max-w-[1600px] mx-auto w-full overflow-hidden`}>
          
          {/* TAB PANEL WORKSPACE: Occupies 7 columns on large desktop, or 12 columns if map is hidden */}
          <section className={`${['tracking', 'league'].includes(activeTab) ? 'lg:col-span-12' : 'lg:col-span-7'} bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6 flex flex-col min-h-[450px] lg:min-h-0`}>
            <AnimatePresence mode="wait">
              {activeTab === 'home' && (
                <motion.div
                  key="home-tab"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="h-full overflow-y-auto pr-1"
                >
                  <HomeDashboard
                    user={user}
                    reports={reports}
                    onSelectReport={(r) => setSelectedReport(r)}
                    onNavigateToReport={() => setActiveTab('report')}
                    onNavigateToTracking={() => setActiveTab('tracking')}
                  />
                </motion.div>
              )}

              {activeTab === 'report' && (
                <motion.div
                  key="report-tab"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="h-full overflow-y-auto pr-1"
                >
                  <ReportHazard
                    user={user}
                    newReportLocation={newReportLocation}
                    setNewReportLocation={setNewReportLocation}
                    onReportCreated={handleReportCreated}
                    showToast={showToast}
                  />
                </motion.div>
              )}

              {activeTab === 'tracking' && (
                <motion.div
                  key="tracking-tab"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="h-full overflow-y-auto pr-1"
                >
                  <TrackingHub
                    reports={reports}
                    selectedReport={selectedReport}
                    onSelectReport={(r) => setSelectedReport(r)}
                    onUpvote={handleUpvote}
                    onAddComment={handleAddComment}
                    user={user}
                    showToast={showToast}
                  />
                </motion.div>
              )}

              {activeTab === 'ombudsman' && (
                <motion.div
                  key="ombudsman-tab"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="h-full overflow-y-auto pr-1"
                >
                  <OmbudsmanDashboard
                    reports={reports}
                    selectedReport={selectedReport}
                    onSelectReport={(r) => setSelectedReport(r)}
                    onStatusUpdated={handleStatusUpdated}
                    onVerifyResolution={handleVerifyResolution}
                  />
                </motion.div>
              )}

              {activeTab === 'league' && (
                <motion.div
                  key="league-tab"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="h-full overflow-y-auto pr-1"
                >
                  <CivicGamification user={user} reports={reports} leaderboard={leaderboard} />
                </motion.div>
              )}

              {activeTab === 'scorecard' && (
                <motion.div
                  key="scorecard-tab"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="h-full overflow-y-auto pr-1"
                >
                  <AnalyticsDashboard reports={reports} userRole={userRole} />
                </motion.div>
              )}

              {activeTab === 'profile' && (
                <motion.div
                  key="profile-tab"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="h-full overflow-y-auto pr-1"
                >
                  <ProfileSettings 
                    user={user} 
                    showToast={showToast} 
                    onProfileUpdate={() => {
                      fetchData(true);
                    }} 
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* INTERACTIVE MAP PANEL: Occupies 5 columns on large desktop */}
          {!['tracking', 'league'].includes(activeTab) && (
            <section className="lg:col-span-5 h-[350px] sm:h-[450px] lg:h-[75vh] min-h-[350px] flex flex-col sticky top-24">
              <ReportMap
                reports={reports}
                selectedReportId={selectedReport?.id}
                onSelectReport={(r) => setSelectedReport(r)}
                onSelectLocation={activeTab === 'report' ? handleSelectLocationFromMap : undefined}
                newReportLocation={newReportLocation}
                categoryFilter={mapCategoryFilter}
              />
            </section>
          )}

        </main>
      )}

      {/* Floating AI Assistant Chatbot */}
      <FloatingChatbot 
        user={user} 
        reports={reports} 
        wardStats={stats?.wardStats || []} 
        onNavigate={setActiveTab}
        onFilterMap={setMapCategoryFilter}
      />

      {/* Minimal Footer */}
      <footer className="bg-white border-t border-gray-100 py-3.5 px-6 text-center text-[10px] text-gray-400 font-sans mt-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <span>ViaPulse Autonomous Ombudsman Framework © 2026. Powered by Google Gemini Multi-Agent Infrastructure.</span>
      </footer>

    </div>
  );
}
