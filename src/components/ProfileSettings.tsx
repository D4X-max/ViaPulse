import React, { useState, useEffect } from 'react';
import { updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db } from '../lib/firebase';
import { storage } from '../lib/firebase';
import { Camera, Save, Bell, Shield, MapPin, Award, User, RefreshCw, Settings } from 'lucide-react';
import { motion } from 'motion/react';

interface ProfileSettingsProps {
  user: any;
  showToast: (type: 'success' | 'info' | 'error', text: string) => void;
  onProfileUpdate: () => void;
}

export default function ProfileSettings({ user, showToast, onProfileUpdate }: ProfileSettingsProps) {
  const [alias, setAlias] = useState('');
  const [safetyAlerts, setSafetyAlerts] = useState(true);
  const [showOnLeaderboard, setShowOnLeaderboard] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (user) {
      setAlias(user.displayName || user.email?.split('@')[0] || '');
      setPreviewUrl(user.photoURL);
      
      // Load existing preferences from Firestore
      const loadProfile = async () => {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.safetyAlerts !== undefined) setSafetyAlerts(data.safetyAlerts);
            if (data.showOnLeaderboard !== undefined) setShowOnLeaderboard(data.showOnLeaderboard);
          }
        } catch (error) {
          console.error("Failed to load profile:", error);
        }
      };
      loadProfile();

      fetch('/api/leaderboard?timeframe=all')
        .then(res => res.json())
        .then(data => {
          const userStats = data.find((u: any) => u.email === user.email);
          if (userStats) setStats(userStats);
        })
        .catch(console.error);
    }
  }, [user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    
    try {
      let finalPhotoUrl = user.photoURL;

      // Handle image upload to Firebase Storage if a new file is selected
      if (imageFile && storage) {
        const storageRef = ref(storage, `avatars/${user.uid}_${Date.now()}`);
        await uploadBytes(storageRef, imageFile);
        finalPhotoUrl = await getDownloadURL(storageRef);
      }

      // 1. Update Firebase Auth Profile
      if (alias !== user.displayName || finalPhotoUrl !== user.photoURL) {
        await updateProfile(user, {
          displayName: alias,
          photoURL: finalPhotoUrl
        });
      }

      // 2. Update Firestore `users/{uid}` document
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        displayName: alias,
        photoURL: finalPhotoUrl,
        safetyAlerts,
        showOnLeaderboard,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // 3. Sync with backend profile cache for leaderboard compatibility
      await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: alias,
          photoURL: finalPhotoUrl,
          safetyAlerts,
          showOnLeaderboard
        })
      });

      showToast('success', 'Profile configuration successfully saved and synchronized.');
      onProfileUpdate(); // Trigger refresh on parent
    } catch (error: any) {
      console.error('Profile save error:', error);
      showToast('error', error.message || 'Failed to save profile changes.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto pb-12">
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-600" />
          Profile Configuration
        </h1>
        <p className="text-sm text-slate-500 font-medium">Manage your public civic identity, alerts, and visibility settings.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-8">
        
        {/* Avatar Section */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-gray-100">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full border-4 border-slate-50 bg-slate-100 overflow-hidden shadow-sm relative">
              {previewUrl ? (
                <img src={previewUrl} alt="Avatar Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-300">
                  <User className="w-10 h-10" />
                </div>
              )}
              
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>
            <input 
              type="file" 
              accept="image/*" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleImageChange}
            />
          </div>
          
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-sm font-bold text-gray-800">Avatar Image</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm">
              Upload a clear photo to help community members and municipal officers identify you. Max 5MB.
            </p>
          </div>
        </div>

        {/* Identity & Location */}
        <div className="pb-6 border-b border-gray-100">
          <div className="space-y-2 max-w-sm">
            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-500" />
              Public Civic Alias
            </label>
            <input 
              type="text" 
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="e.g. CivicGuardian99"
              className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            <p className="text-[10px] text-gray-400">This name appears on public reports and the leaderboard.</p>
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-5 pb-6 border-b border-gray-100">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Notification & Privacy</h3>
          
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-50 text-rose-500 rounded-lg shrink-0 mt-0.5">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-800">Receive 5km Critical Safety Broadcast Alerts</h4>
                <p className="text-xs text-gray-500">Get immediately notified if a high-severity hazard is reported near you.</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input type="checkbox" className="sr-only peer" checked={safetyAlerts} onChange={() => setSafetyAlerts(!safetyAlerts)} />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-50 text-amber-500 rounded-lg shrink-0 mt-0.5">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-800">Show my point score on the Global Reputation Leaderboard</h4>
                <p className="text-xs text-gray-500">Allow your alias and total civic points to be publicly ranked.</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input type="checkbox" className="sr-only peer" checked={showOnLeaderboard} onChange={() => setShowOnLeaderboard(!showOnLeaderboard)} />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>

        {/* Badges Section */}
        {stats && (
          <div className="pb-6 border-b border-gray-100">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4">My Civic Badges</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { title: 'Road Hero 🏆', reqText: 'Submit 5 issues', earned: (stats.allTimeReportCount || 0) >= 5 },
                { title: 'Civic Sentinel 🌟', reqText: '15 upvotes', earned: (stats.allTimeUpvoteCount || 0) >= 15 },
                { title: 'Clean City Champion 💪', reqText: '200+ points', earned: (stats.allTimePoints || 0) >= 200 },
                { title: 'First Resolution 🥉', reqText: 'Resolve 1 issue', earned: (stats.allTimeResolvedCount || 0) >= 1 },
                { title: 'Community Fixer 🥈', reqText: 'Resolve 5 issues', earned: (stats.allTimeResolvedCount || 0) >= 5 },
                { title: 'Neighborhood Guardian 🥇', reqText: 'Resolve 10 issues', earned: (stats.allTimeResolvedCount || 0) >= 10 },
                { title: 'City Hero 🏆', reqText: 'Resolve 25 issues', earned: (stats.allTimeResolvedCount || 0) >= 25 }
              ].map(badge => (
                <div key={badge.title} className={`p-4 rounded-xl border flex items-center gap-4 transition-all ${badge.earned ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
                  <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center text-2xl shadow-sm ${badge.earned ? 'bg-white text-indigo-500' : 'bg-slate-200 grayscale'}`}>
                    {badge.title.split(' ').pop()}
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-sm font-bold ${badge.earned ? 'text-indigo-900' : 'text-slate-500'}`}>{badge.title.replace(/[\u{1F300}-\u{1F9FF}]/u, '').trim()}</span>
                    <span className="text-[11px] font-semibold text-slate-500 mt-0.5">{badge.earned ? '✓ Earned' : `Locked: ${badge.reqText}`}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isSaving ? 'Synchronizing Data...' : 'Save Profile Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
