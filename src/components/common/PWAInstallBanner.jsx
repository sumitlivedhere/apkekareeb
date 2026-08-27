import React, { useState, useEffect } from 'react';

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. Check if app is already running in installed standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (isStandalone) {
      return;
    }

    // 2. Check if user dismissed the banner recently
    const isDismissed = sessionStorage.getItem('aapkekareeb_pwa_dismissed') === 'true';
    if (isDismissed) {
      return;
    }

    // 3. Android / Chrome / Edge 1-Tap Prompt Listener
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. iOS Safari Detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    if (isIosDevice && !isStandalone) {
      setIsIOS(true);
      setShowBanner(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Trigger the native browser install dialog in 1 tap
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('aapkekareeb_pwa_dismissed', 'true');
  };

  if (!showBanner) return null;

  return (
    <aside className="fixed bottom-20 left-3 right-3 max-w-md mx-auto z-50 animate-fade-in font-sans">
      <div className="bg-slate-900/95 backdrop-blur-md border border-amber-500/40 rounded-2xl p-3.5 shadow-2xl flex items-center justify-between space-x-3 text-slate-100">
        
        {/* Left: Icon & Pitch */}
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-950 font-black text-lg flex items-center justify-center shrink-0 shadow-md">
            AK
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-black text-slate-100 leading-tight truncate">
              Install Aapke Kareeb App
            </h4>
            <p className="text-[9.5px] text-amber-300 font-bold leading-tight mt-0.5">
              {isIOS ? 'Tap Share ➔ Add to Home Screen' : '1-Tap Add to Home Screen • तेज़ और आसान'}
            </p>
          </div>
        </div>

        {/* Right: 1-Tap Button / Action */}
        <div className="flex items-center space-x-1.5 shrink-0">
          {!isIOS ? (
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 text-slate-950 font-black text-[10px] rounded-xl shadow-md active:scale-95 transition cursor-pointer"
            >
              + Install
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