import React, { useState, useEffect, useRef } from 'react';

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const promptEventRef = useRef(null);

  useEffect(() => {
    // 1. Skip if already installed and running in standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (isStandalone) return;

    // 2. Skip if dismissed in the last 2 days
    const dismissedAt = localStorage.getItem('aapkekareeb_pwa_dismissed_time');
    if (dismissedAt && Date.now() - Number(dismissedAt) < 2 * 24 * 60 * 60 * 1000) {
      return;
    }

    // 3. Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);

    // 4. Capture native install prompt without displaying immediately
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      promptEventRef.current = e;
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 5. ⏱️ 120-Second Engagement Delay: Show only after user explores the app
    const timer = setTimeout(() => {
      if (promptEventRef.current) {
        setShowBanner(true);
      } else if (isIosDevice) {
        setIsIOS(true);
        setShowBanner(true);
      }
    }, 120000); // 120 seconds delay

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('aapkekareeb_pwa_dismissed_time', String(Date.now()));
  };

  if (!showBanner) return null;

  return (
    <aside className="fixed bottom-20 left-3 right-3 max-w-md mx-auto z-50 animate-slide-up font-sans">
      <div className="bg-slate-900/95 backdrop-blur-md border border-amber-500/40 rounded-2xl p-3.5 shadow-2xl flex items-center justify-between space-x-3 text-slate-100">
        
        {/* Left: Icon & Copy */}
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-950 font-black text-sm flex items-center justify-center shrink-0 shadow-md">
            AK
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-black text-slate-100 leading-tight truncate">
              Add to Home Screen
            </h4>
            <p className="text-[10px] text-amber-300 font-bold leading-tight mt-0.5">
              {isIOS
                ? 'Tap Share ➔ Add to Home Screen'
                : 'Fast and easy in use • तेज़ और आसान'}
            </p>
          </div>
        </div>

        {/* Right: 1-Tap Action */}
        <div className="flex items-center space-x-1.5 shrink-0">
          {!isIOS ? (
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 text-slate-950 font-black text-[10px] rounded-xl shadow-md active:scale-95 transition cursor-pointer"
            >
              + Add
            </button>
          ) : (
            <span className="px-2 py-1 bg-slate-800 text-amber-300 font-bold text-[9px] rounded-lg border border-slate-700">
              Share ➔ ➕
            </span>
          )}

          <button
            type="button"
            onClick={handleDismiss}
            className="w-6 h-6 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs flex items-center justify-center cursor-pointer active:scale-90 transition"
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      </div>
    </aside>
  );
}