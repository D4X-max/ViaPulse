import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Check, MapPin, ShieldCheck, Smartphone, Search, Lock, Compass, Sparkles, ArrowRight, CheckCircle, Navigation } from 'lucide-react';

interface OnboardingFlowProps {
  onComplete: () => void;
  userEmail?: string;
}

type OnboardingStep = 'splash' | 'welcome' | 'signin' | 'location';

export default function OnboardingFlow({ onComplete, userEmail = 'dhrvsrijit@gmail.com' }: OnboardingFlowProps) {
  const [step, setStep] = useState<OnboardingStep>('splash');
  
  // Stats counters state with custom counting animation
  const [reportedCount, setReportedCount] = useState(0);
  const [resolvedCount, setResolvedCount] = useState(0);
  const [citizensCount, setCitizensCount] = useState(0);

  // Google sign in states
  const [signingIn, setSigningIn] = useState(false);
  const [signInSuccess, setSignInSuccess] = useState(false);

  // Location permissions states
  const [permissionState, setPermissionState] = useState<'idle' | 'requesting' | 'granted'>('idle');

  // 1. Splash Screen Timer
  useEffect(() => {
    if (step === 'splash') {
      const timer = setTimeout(() => {
        setStep('welcome');
      }, 2500); // 2.5 seconds to feel immersive and allow the pin-to-shield transformation to fully play
      return () => clearTimeout(timer);
    }
  }, [step]);

  // 2. Stats animation triggers when reaching Welcome Screen
  useEffect(() => {
    if (step === 'welcome') {
      const duration = 1500; // ms
      const stepsCount = 50;
      const stepDuration = duration / stepsCount;
      let currentStep = 0;

      const timer = setInterval(() => {
        currentStep++;
        setReportedCount(Math.floor((12450 / stepsCount) * currentStep));
        setResolvedCount(Math.floor((8920 / stepsCount) * currentStep));
        setCitizensCount(Math.floor((2300 / stepsCount) * currentStep));

        if (currentStep >= stepsCount) {
          setReportedCount(12450);
          setResolvedCount(8920);
          setCitizensCount(2300);
          clearInterval(timer);
        }
      }, stepDuration);

      return () => clearInterval(timer);
    }
  }, [step]);

  const handleGoogleSignIn = () => {
    setSigningIn(true);
    // Simulate real Google Sign In flow
    setTimeout(() => {
      setSignInSuccess(true);
      setTimeout(() => {
        setSigningIn(false);
        setStep('location');
      }, 1200);
    }, 1800);
  };

  const handleRequestLocation = () => {
    setPermissionState('requesting');
    // Simulate finding satellites / checking GPS accuracy
    setTimeout(() => {
      setPermissionState('granted');
      setTimeout(() => {
        onComplete();
      }, 1000);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#FAFAFA] text-gray-900 flex flex-col font-sans select-none overflow-y-auto">
      <AnimatePresence mode="wait">
        
        {/* ==================== SPLASH SCREEN ==================== */}
        {step === 'splash' && (
          <motion.div
            key="splash-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="flex-1 flex flex-col items-center justify-center p-6 bg-[#FAFAFA]"
          >
            <div className="relative flex flex-col items-center gap-6">
              
              {/* Morphing visual container */}
              <div className="relative w-24 h-24 flex items-center justify-center">
                
                {/* Pulsing Backlight circles */}
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.35, 0.15] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                  className="absolute inset-0 bg-blue-100 rounded-full"
                />
                <motion.div
                  animate={{ scale: [1.1, 1.4, 1.1], opacity: [0.1, 0.2, 0.1] }}
                  transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut', delay: 0.3 }}
                  className="absolute -inset-4 bg-emerald-50 rounded-full"
                />

                {/* The main transitioning logo mark */}
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.6, type: 'spring' }}
                  className="relative z-10 w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200"
                >
                  <AnimatePresence mode="wait">
                    
                    {/* Starts as MapPin, then after 1.2s morphs into Shield checkmark */}
                    {reportedCount === 0 ? (
                      <motion.div
                        key="splash-pin"
                        initial={{ opacity: 1 }}
                        animate={{ y: [0, -6, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                        exit={{ opacity: 0, scale: 0.5, rotate: 180 }}
                        className="text-white"
                      >
                        <MapPin className="w-10 h-10 stroke-[2.2]" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="splash-shield"
                        initial={{ opacity: 0, scale: 0.4, rotate: -180 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', damping: 12 }}
                        className="text-white flex items-center justify-center"
                      >
                        <ShieldCheck className="w-11 h-11 stroke-[2.2]" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>

              {/* Title & Brand */}
              <div className="text-center flex flex-col gap-1.5 mt-2">
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="text-3xl font-black tracking-tight text-gray-900"
                >
                  Community <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">Hero</span>
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45, duration: 0.5 }}
                  className="text-xs font-semibold tracking-wider uppercase text-gray-400 font-mono"
                >
                  AI-powered Civic Reporting
                </motion.p>
              </div>

              {/* Loader */}
              <div className="absolute -bottom-16">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" />
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* ==================== WELCOME ONBOARDING SCREEN ==================== */}
        {step === 'welcome' && (
          <motion.div
            key="welcome-screen"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex-1 flex flex-col lg:flex-row items-stretch min-h-screen bg-[#FAFAFA]"
          >
            
            {/* Visual Column / Illustration container (Left on desktop, Top on mobile) */}
            <div className="lg:w-1/2 bg-slate-50 border-r border-gray-100 flex flex-col justify-center items-center p-8 md:p-12 relative overflow-hidden shrink-0 min-h-[340px] lg:min-h-0">
              {/* Subtle tech background shapes */}
              <div className="absolute inset-0 opacity-40">
                <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-blue-100 blur-3xl" />
                <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-emerald-100 blur-3xl" />
              </div>

              {/* HERO ILLUSTRATION: Highly polished CSS/SVG assembly */}
              <div className="relative w-full max-w-sm h-64 md:h-80 flex items-center justify-center z-10">
                
                {/* 1. Skyline Shadow Silhouettes */}
                <svg className="absolute bottom-8 w-11/12 h-24 text-gray-200 fill-current opacity-80" viewBox="0 0 400 100" preserveAspectRatio="none">
                  <rect x="10" y="30" width="30" height="70" rx="3" />
                  <rect x="45" y="10" width="40" height="90" rx="3" />
                  <rect x="90" y="45" width="25" height="55" rx="2" />
                  <rect x="120" y="20" width="35" height="80" rx="3" />
                  <rect x="160" y="5" width="45" height="95" rx="3" />
                  <rect x="210" y="35" width="30" height="65" rx="3" />
                  <rect x="245" y="15" width="40" height="85" rx="3" />
                  <rect x="290" y="40" width="35" height="60" rx="3" />
                  <rect x="330" y="25" width="45" height="75" rx="3" />
                </svg>

                {/* 2. Stylized Road under repair */}
                <div className="absolute bottom-2 left-4 right-4 h-6 bg-slate-800 rounded-lg flex items-center justify-center overflow-hidden">
                  <div className="flex gap-4">
                    <span className="w-8 h-1 bg-amber-400" />
                    <span className="w-8 h-1 bg-amber-400" />
                    <span className="w-8 h-1 bg-amber-400" />
                    <span className="w-8 h-1 bg-amber-400" />
                    <span className="w-8 h-1 bg-amber-400" />
                  </div>
                </div>

                {/* 3. Pothole defect overlay on road */}
                <div className="absolute bottom-4 left-1/4 w-12 h-6 bg-slate-900 border border-slate-700 rounded-full flex items-center justify-center shadow-inner">
                  <span className="text-[9px] font-mono text-rose-500 font-extrabold animate-pulse">DEFECT</span>
                </div>

                {/* 4. Scanner sweep laser over pothole */}
                <motion.div
                  animate={{ y: [48, 128, 48], opacity: [0.3, 0.8, 0.3] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                  className="absolute bottom-5 left-1/4 -translate-x-2 w-16 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent z-20 shadow-[0_0_8px_#3b82f6]"
                />

                {/* 5. Citizen Phone Camera Mockup */}
                <motion.div
                  initial={{ y: 20, rotate: -5 }}
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                  className="absolute left-8 bottom-12 w-28 h-48 bg-white border-2 border-gray-200 rounded-2xl shadow-xl p-1.5 flex flex-col gap-1.5 z-30"
                >
                  <div className="w-8 h-1 bg-gray-200 rounded-full mx-auto" />
                  <div className="flex-1 bg-slate-100 rounded-xl relative overflow-hidden flex flex-col justify-between p-1.5 border border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-[6px] font-bold text-blue-600 bg-blue-50 px-1 py-0.2 rounded font-mono">V-OCR SCAN</span>
                      <Smartphone className="w-2.5 h-2.5 text-gray-400" />
                    </div>
                    {/* Simulated Camera Feed */}
                    <div className="w-full h-16 bg-slate-200 rounded-lg flex items-center justify-center border border-gray-200">
                      <div className="w-8 h-8 rounded-full border-2 border-dashed border-blue-500 flex items-center justify-center">
                        <Check className="w-4 h-4 text-emerald-500" />
                      </div>
                    </div>
                    <div className="bg-slate-900 text-[6px] p-1 rounded font-mono text-white leading-normal truncate">
                      Pothole: Match 98.4%
                    </div>
                  </div>
                </motion.div>

                {/* 6. Road Worker Icon / Repair Symbol Badge */}
                <motion.div
                  initial={{ x: 20 }}
                  animate={{ y: [-3, 3, -3] }}
                  transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
                  className="absolute right-6 bottom-16 bg-white border border-gray-100 p-2.5 rounded-xl shadow-lg flex items-center gap-2 z-30"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center text-white font-bold">
                    🏗️
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-gray-800">SLA DISPATCH</span>
                    <span className="text-[7px] text-emerald-600 font-semibold flex items-center gap-0.5">
                      <Check className="w-2 h-2 stroke-[3]" /> Active Crew
                    </span>
                  </div>
                </motion.div>

                {/* 7. Floating bouncy Map Pin */}
                <motion.div
                  animate={{ y: [-15, -5, -15] }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                  className="absolute top-10 left-1/2 -translate-x-1/2 z-40 filter drop-shadow-md"
                >
                  <div className="relative flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                      <MapPin className="w-6 h-6 stroke-[2]" />
                    </div>
                    <div className="w-2 h-2 bg-blue-600 rotate-45 -mt-1.5" />
                  </div>
                </motion.div>

                {/* 8. Pulsing Verification Checkmark Badge */}
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                  className="absolute top-16 right-12 bg-emerald-500 text-white rounded-full p-2.5 shadow-lg border-2 border-white z-40"
                >
                  <Check className="w-5 h-5 stroke-[3.5]" />
                </motion.div>

              </div>
            </div>

            {/* Information & Action Column (Right on desktop, Bottom on mobile) */}
            <div className="flex-1 flex flex-col justify-between p-6 md:p-10 lg:p-14 max-w-2xl mx-auto w-full">
              
              {/* Top Meta info */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    CH
                  </div>
                  <span className="font-display font-black text-sm text-gray-900 tracking-tight">Community Hero</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3 text-blue-500" />
                  <span>v1.2 Public Release</span>
                </div>
              </div>

              {/* Titles & Headings */}
              <div className="flex flex-col gap-3 mt-6 lg:mt-8">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-gray-900 leading-[1.1] font-display">
                  Report Local Issues.<br />
                  <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                    Make Your City Better.
                  </span>
                </h2>
                <p className="text-sm md:text-base text-gray-500 font-sans max-w-lg leading-relaxed mt-2">
                  Take a photo. AI identifies the issue. Track the resolution. Join thousands of active sentinels safeguarding local community infrastructure.
                </p>
              </div>

              {/* Feature Chips Grid */}
              <div className="grid grid-cols-2 gap-3 mt-6 md:mt-8">
                <div className="p-3 bg-white rounded-xl border border-gray-150/80 shadow-xs flex items-center gap-2.5 transition-all hover:border-gray-200">
                  <span className="text-base">📸</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-800">Report in Seconds</span>
                    <span className="text-[10px] text-gray-400">Scan hazards instantly</span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-gray-150/80 shadow-xs flex items-center gap-2.5 transition-all hover:border-gray-200">
                  <span className="text-base">🤝</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-800">Community Verified</span>
                    <span className="text-[10px] text-gray-400">Vouched by neighbors</span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-gray-150/80 shadow-xs flex items-center gap-2.5 transition-all hover:border-gray-200">
                  <span className="text-base">📍</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-800">Live Tracking</span>
                    <span className="text-[10px] text-gray-400">See real SLA feedback</span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-gray-150/80 shadow-xs flex items-center gap-2.5 transition-all hover:border-gray-200">
                  <span className="text-base">🏆</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-800">Earn Points</span>
                    <span className="text-[10px] text-gray-400">Level up your sentinel</span>
                  </div>
                </div>
              </div>

              {/* Animated Counters Section */}
              <div className="bg-slate-50 border border-gray-100 p-4 rounded-2xl flex justify-between items-center mt-6 md:mt-8 text-center">
                <div className="flex-1 flex flex-col">
                  <span className="text-xl md:text-2xl font-black font-mono text-blue-600">
                    {reportedCount.toLocaleString()}+
                  </span>
                  <span className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider font-mono">Reported</span>
                </div>
                <div className="w-[1px] h-8 bg-gray-200" />
                <div className="flex-1 flex flex-col">
                  <span className="text-xl md:text-2xl font-black font-mono text-emerald-600">
                    {resolvedCount.toLocaleString()}+
                  </span>
                  <span className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider font-mono">Resolved</span>
                </div>
                <div className="w-[1px] h-8 bg-gray-200" />
                <div className="flex-1 flex flex-col">
                  <span className="text-xl md:text-2xl font-black font-mono text-indigo-600">
                    {citizensCount.toLocaleString()}+
                  </span>
                  <span className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider font-mono">Citizens</span>
                </div>
              </div>

              {/* CTA Section */}
              <div className="flex flex-col gap-3 mt-8 md:mt-10">
                <button
                  onClick={() => setStep('signin')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-md shadow-blue-200 hover:shadow-lg hover:shadow-blue-300 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
                >
                  <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                  </svg>
                  Continue with Google
                </button>
                <p className="text-[10px] text-gray-400 text-center leading-normal">
                  By continuing, you agree to our <span className="underline cursor-pointer hover:text-gray-600">Terms of Service</span> & <span className="underline cursor-pointer hover:text-gray-600">Privacy Policy</span>.
                </p>
              </div>

              {/* Bottom Branding & Mini Chips */}
              <div className="flex flex-col items-center gap-2 border-t border-gray-100 pt-5 mt-8">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                  Powered by <span className="text-indigo-600 font-extrabold flex items-center gap-0.5"><Sparkles className="w-3 h-3 text-indigo-500 fill-indigo-100" /> Gemini AI</span>
                </span>
                <div className="flex flex-wrap justify-center gap-1.5">
                  <span className="bg-gray-100 text-gray-600 border border-gray-200/60 font-semibold text-[9px] px-2.5 py-0.5 rounded-full font-sans">
                    Image Analysis
                  </span>
                  <span className="bg-gray-100 text-gray-600 border border-gray-200/60 font-semibold text-[9px] px-2.5 py-0.5 rounded-full font-sans">
                    Smart Categorization
                  </span>
                  <span className="bg-gray-100 text-gray-600 border border-gray-200/60 font-semibold text-[9px] px-2.5 py-0.5 rounded-full font-sans">
                    Priority Detection
                  </span>
                </div>
              </div>

            </div>

          </motion.div>
        )}

        {/* ==================== GOOGLE SIGN IN SIMULATOR ==================== */}
        {step === 'signin' && (
          <motion.div
            key="signin-screen"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="flex-1 flex items-center justify-center p-6 bg-slate-50/50"
          >
            <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl shadow-slate-100 flex flex-col gap-6">
              
              <div className="flex flex-col items-center text-center gap-2">
                {/* Google Logo */}
                <svg className="w-10 h-10 mb-2" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </svg>
                <h3 className="text-xl font-bold text-gray-900 font-display">Sign in with Google</h3>
                <p className="text-xs text-gray-400">Choose an account to continue to Community Hero</p>
              </div>

              {/* Account Selection Node */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={signingIn}
                  className="p-4 rounded-2xl border border-gray-100 hover:border-blue-100 hover:bg-blue-50/20 text-left transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-display font-black text-white text-sm shadow-sm">
                      AC
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-800 group-hover:text-blue-700 transition-colors">Aria Chen</span>
                      <span className="text-[10px] text-gray-400 font-mono">{userEmail}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded font-bold">
                    Logged In
                  </span>
                </button>

                <button
                  disabled={signingIn}
                  className="p-3.5 rounded-xl border border-gray-150 border-dashed hover:bg-gray-50/50 text-left text-xs font-semibold text-gray-500 transition-all flex items-center gap-3"
                >
                  <span className="w-8 h-8 rounded-full border border-gray-200 border-dashed flex items-center justify-center text-lg text-gray-400">
                    +
                  </span>
                  Use another account
                </button>
              </div>

              {/* Progress feedback */}
              <AnimatePresence mode="wait">
                {signingIn && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-col items-center gap-3 pt-2"
                  >
                    {!signInSuccess ? (
                      <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <span>Authenticating with Google OAuth...</span>
                      </div>
                    ) : (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl px-4 py-2.5 w-full justify-center text-xs font-bold shadow-sm"
                      >
                        <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                        <span>Successfully signed in! Redirecting...</span>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="text-[10px] text-gray-400 text-center leading-normal border-t border-gray-50 pt-4 mt-2">
                <div className="flex justify-center gap-3 text-gray-400 mb-1">
                  <span className="hover:text-gray-600 cursor-pointer">Help</span>
                  <span>•</span>
                  <span className="hover:text-gray-600 cursor-pointer">Privacy</span>
                  <span>•</span>
                  <span className="hover:text-gray-600 cursor-pointer">Terms</span>
                </div>
                Secure authentication handled officially via Google Services API.
              </div>

            </div>
          </motion.div>
        )}

        {/* ==================== LOCATION PERMISSION SCREEN ==================== */}
        {step === 'location' && (
          <motion.div
            key="location-screen"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="flex-1 flex items-center justify-center p-6 bg-slate-50/50"
          >
            <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl shadow-slate-100 flex flex-col gap-6">
              
              <div className="flex flex-col items-center text-center gap-3">
                {/* Visual Map/Compass Graphic */}
                <div className="relative w-20 h-20 flex items-center justify-center bg-blue-50 rounded-2xl border border-blue-100 text-blue-600">
                  <motion.div
                    animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeOut' }}
                    className="absolute inset-0 bg-blue-400 rounded-2xl"
                  />
                  <Compass className="w-10 h-10 stroke-[2] relative z-10" />
                </div>

                <h3 className="text-xl font-bold text-gray-900 font-display">Enable Location Services</h3>
                <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
                  Community Hero uses your device's GPS to precisely geolocate your reports, find hazards nearby, and compute your regional sentinel rank.
                </p>
              </div>

              {/* Status or simulation panel */}
              <div className="bg-slate-50 border border-gray-100 p-4 rounded-2xl">
                {permissionState === 'idle' && (
                  <div className="flex flex-col gap-2.5 text-xs text-gray-600 leading-normal">
                    <div className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0" />
                      <p>Pinpoint road defects instantly on our map without manual address entry.</p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0" />
                      <p>Compare issues live to prevent duplicate reports.</p>
                    </div>
                  </div>
                )}

                {permissionState === 'requesting' && (
                  <div className="flex flex-col items-center justify-center py-2.5 gap-2 font-mono">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-[10px] text-gray-400 tracking-wider uppercase">Contacting GPS satellites...</span>
                  </div>
                )}

                {permissionState === 'granted' && (
                  <div className="flex items-center gap-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl px-3 justify-center text-xs font-bold">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Location Verified: SF Ward 1</span>
                  </div>
                )}
              </div>

              {/* CTA Toggles */}
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={handleRequestLocation}
                  disabled={permissionState !== 'idle'}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-md shadow-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  <Navigation className="w-4 h-4 fill-white" />
                  Allow Location Access
                </button>

                <button
                  onClick={onComplete}
                  disabled={permissionState !== 'idle'}
                  className="w-full bg-gray-50 hover:bg-gray-100 text-gray-500 font-semibold py-3 px-6 rounded-xl text-xs transition-all disabled:opacity-50 text-center"
                >
                  Skip for now
                </button>
              </div>

              <div className="flex items-center justify-center gap-1 text-[9px] text-gray-400 font-mono text-center leading-normal border-t border-gray-50 pt-4">
                <Lock className="w-3 h-3 text-gray-400" />
                <span>Your coordinates are encrypted and secure</span>
              </div>

            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
