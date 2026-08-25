import React, { useState, useMemo, useRef, useEffect } from 'react';
import { hyperlocalStore } from '../../store/hyperlocalStore';
import ActionButtons from '../common/ActionButtons';

// 🔊 Audio Synthesizer (Scratch Rubbing & Reveal Fanfare)
const playScratchAudio = (type = 'scratch') => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (type === 'scratch') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140 + Math.random() * 80, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'win') {
      [392.0, 523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.01, now + idx * 0.07);
        gain.gain.linearRampToValueAtTime(0.22, now + idx * 0.07 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.35);
      });
      if (navigator.vibrate) navigator.vibrate([40, 60, 100]);
    }
  } catch {}
};

// 🪙 MYSTERY REWARD FOIL TIERS
const MYSTERY_REWARDS = [
  { id: 'restaurants', label: 'Food & Zayka Combo', hindi: 'खान-पान स्पेशल डील', icon: '🍔', tag: 'TASTE OF TOWN', perk: 'Special cafes & street food combos' },
  { id: 'shaadi', label: 'Shaadi Style Voucher', hindi: 'शादी व पहनावा पास', icon: '💍', tag: 'WEDDING PASS', perk: 'Boutique lehengas & sherwani rentals' },
  { id: 'market', label: 'Bazaar Flash Discount', hindi: 'बाजार फ्लैश डिस्काउंट', icon: '🛍️', tag: 'RETAIL SALE', perk: 'Footwear & garments store flash coupon' },
  { id: 'sweets', label: 'Desi Ghee Mithai Box', hindi: 'देसी घी मिठाई बॉक्स', icon: '🍯', tag: 'SWEET TREATS', perk: 'Famous town kalakand & ladoo special' },
  { id: 'recommerce', label: 'Pre-Loved Bargain Pass', hindi: 'पुराना सामान बचत पास', icon: '📦', tag: 'BARGAIN PASS', perk: 'Inspected used phones & bikes discount' },
  { id: 'fitness', label: 'Gym & Fitness Trial', hindi: 'जिम व फिटनेस पास', icon: '💪', tag: 'HEALTH PASS', perk: 'Free gym trial & sports turf booking' },
];

export default function ScratchCardGame({ selectedCity = 'Alwar', onBack }) {
  const [selectedReward, setSelectedReward] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [scratchProgress, setScratchProgress] = useState(0);

  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);

  // Pick a random reward on mount
  useMemo(() => {
    const random = MYSTERY_REWARDS[Math.floor(Math.random() * MYSTERY_REWARDS.length)];
    setSelectedReward(random);
  }, []);

  // Initialize Scratch Canvas Foil
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    ctx.fillStyle = '#94a3b8'; // Frosted Silver Hologram Foil
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw textured shimmer lines on foil
    ctx.fillStyle = '#cbd5e1';
    for (let i = 0; i < 15; i++) {
      ctx.fillRect(Math.random() * canvas.width, 0, 4, canvas.height);
    }

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🪙 SCRATCH HERE TO REVEAL DEALS', canvas.width / 2, canvas.height / 2 + 5);
  }, [selectedReward]);

  // Handle Scratching Interaction (Mouse / Touch)
  const scratchAt = (clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas || isRevealed) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const rect = canvas.getBoundingClientRect();

    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 24, 0, Math.PI * 2);
    ctx.fill();

    playScratchAudio('scratch');
    calculateProgress(ctx, canvas);
  };

  const calculateProgress = (ctx, canvas) => {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let transparentPixels = 0;
    const totalPixels = imgData.data.length / 4;

    for (let i = 3; i < imgData.data.length; i += 4) {
      if (imgData.data[i] < 128) transparentPixels++;
    }

    const pct = Math.floor((transparentPixels / totalPixels) * 100);
    setScratchProgress(pct);

    if (pct > 42 && !isRevealed) {
      setIsRevealed(true);
      playScratchAudio('win');
    }
  };

  const handleMouseDown = (e) => {
    isDrawingRef.current = true;
    scratchAt(e.clientX, e.clientY);
  };

  const handleMouseMove = (e) => {
    if (!isDrawingRef.current) return;
    scratchAt(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    isDrawingRef.current = false;
  };

  const handleTouchStart = (e) => {
    isDrawingRef.current = true;
    scratchAt(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    if (!isDrawingRef.current) return;
    scratchAt(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    isDrawingRef.current = false;
  };

  // Query Database for matched business listings based on scratched reward
  const matchedOffers = useMemo(() => {
    if (!isRevealed || !selectedReward) return [];
    const allListings = hyperlocalStore.getAllListings() || [];
    const city = (selectedCity || '').toLowerCase().trim();

    let pool = allListings.filter((item) => {
      if (!item || !item.id) return false;
      const c = (item.city || '').toLowerCase().trim();
      const loc = (item.location || '').toLowerCase().trim();
      return !city || c === city || loc.includes(city);
    });

    const matches = pool.filter((item) => item.category === selectedReward.id);
    if (matches.length > 0) pool = matches;

    if (pool.length === 0) {
      pool = allListings.filter((item) => item && item.id);
    }

    return [...pool].sort(() => Math.random() - 0.5).slice(0, 3);
  }, [isRevealed, selectedReward, selectedCity]);

  const handleReset = () => {
    setIsRevealed(false);
    setScratchProgress(0);
    const random = MYSTERY_REWARDS[Math.floor(Math.random() * MYSTERY_REWARDS.length)];
    setSelectedReward(random);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-3.5 select-none relative overflow-hidden">
      
      {/* 🌟 Holographic Shimmer Keyframes */}
      <style>{`
        @keyframes foilShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .scratch-gold-card {
          background: linear-gradient(135deg, rgba(168,85,247,0.18) 0%, rgba(236,72,153,0.35) 50%, rgba(168,85,247,0.18) 100%);
          background-size: 200% 200%;
          animation: foilShimmer 3.5s ease infinite;
        }
      `}</style>

      {/* Top Header Bar */}
      <header className="flex items-center justify-between z-10 shrink-0 pb-2 border-b border-slate-800">
        <button
          type="button"
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 text-purple-300 font-black text-xs flex items-center justify-center cursor-pointer active:scale-90"
        >
          ←
        </button>

        <div className="text-center">
          <span className="text-[9.5px] font-black uppercase text-purple-400 tracking-wider block">
            🪙 DIGITAL SCRATCH & WIN
          </span>
          <span className="text-xs font-black text-slate-100">Mystery Foil • {selectedCity}</span>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300 cursor-pointer active:scale-90"
        >
          Reset 🔄
        </button>
      </header>

      {/* ========================================================================= */}
      {/* 🌟 SCRATCH CANVAS ARENA                                                   */}
      {/* ========================================================================= */}
      {!isRevealed && selectedReward && (
        <div className="relative flex-1 flex flex-col items-center justify-between my-auto py-2 z-10">
          
          <div className="text-center space-y-1">
            <span className="text-[10px] font-black uppercase px-3 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-purple-300">
              🪙 Rub Frosted Foil
            </span>
            <h2 className="text-base font-black text-slate-100 tracking-tight pt-0.5">
              Scratch to Reveal Mystery Deal!
            </h2>
            <p className="text-xs text-slate-400">
              Rub your finger or mouse over the silver foil below to unlock your hidden deal.
            </p>
          </div>

          {/* Scratch Card Container */}
          <div className="relative w-80 h-48 rounded-3xl overflow-hidden shadow-2xl border-2 border-purple-400/60 bg-gradient-to-br from-slate-900 via-purple-950 to-slate-950 my-auto flex items-center justify-center">
            
            {/* UNDERNEATH REWARD CONTENT */}
            <div className="absolute inset-0 p-5 flex flex-col items-center justify-center text-center space-y-2 bg-gradient-to-tr from-purple-950/80 to-slate-900/90">
              <span className="text-3xl animate-bounce">{selectedReward.icon}</span>
              <div className="space-y-0.5">
                <span className="text-[8.5px] font-black uppercase px-2 py-0.5 rounded bg-purple-400 text-slate-950">
                  {selectedReward.tag}
                </span>
                <h3 className="text-base font-black text-slate-100 leading-tight pt-1">
                  {selectedReward.label}
                </h3>
                <p className="text-xs font-bold text-purple-300">
                  {selectedReward.hindi}
                </p>
              </div>
              <p className="text-[10px] text-slate-300 font-medium">
                ✨ {selectedReward.perk}
              </p>
            </div>

            {/* FROSTED SILVER SCRATCH CANVAS OVERLAY */}
            <canvas
              ref={canvasRef}
              width={320}
              height={192}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="absolute inset-0 z-20 cursor-crosshair touch-none"
            />
          </div>

          {/* Scratch Progress Bar */}
          <div className="w-full max-w-xs space-y-1.5 pt-2">
            <div className="flex items-center justify-between text-[10px] font-black text-slate-400">
              <span>Scratch Progress:</span>
              <span className="text-purple-300 font-mono">{scratchProgress}% / 42%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-150"
                style={{ width: `${Math.min(100, (scratchProgress / 42) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🌟 REVEALED MATCHED OFFERS                                                */}
      {/* ========================================================================= */}
      {isRevealed && selectedReward && (
        <div className="relative flex-1 flex flex-col justify-between z-10 py-1 space-y-3 animate-fade-in">
          
          {/* Top Revealed Pass */}
          <div className="scratch-gold-card p-4 rounded-3xl border-2 border-purple-400/90 text-slate-950 shadow-2xl text-center space-y-1 relative overflow-hidden">
            <span className="text-[8.5px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-slate-950 text-purple-300 shadow">
              🪙 SCRATCH REVEAL UNLOCKED
            </span>
            <h3 className="text-base font-black leading-tight pt-1">
              {selectedReward.icon} {selectedReward.label} • {selectedReward.hindi}
            </h3>
            <p className="text-[10px] font-bold text-slate-900">
              ✨ {selectedReward.perk} in {selectedCity}
            </p>
          </div>

          {/* Matched Listings Stream */}
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-270px)] scrollbar-none pr-0.5">
            {matchedOffers.map((item) => {
              const gallery = Array.isArray(item.images) && item.images.length > 0 ? item.images : item.image ? [item.image] : ['https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=700'];
              const photo = typeof gallery[0] === 'string' ? gallery[0] : gallery[0]?.url;

              return (
                <div
                  key={item.id}
                  className="bg-slate-900/95 border-2 border-purple-400/40 hover:border-purple-400 rounded-3xl p-3.5 space-y-3 shadow-xl transition"
                >
                  <div className="flex items-start space-x-3">
                    <img
                      src={photo}
                      alt={item.title || item.name}
                      className="w-20 h-20 rounded-2xl object-cover border border-slate-700 shrink-0"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=700';
                      }}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/30">
                          {item.subCategory || selectedReward.tag}
                        </span>
                        <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-amber-400 text-slate-950">
                          {item.price || item.rates || 'Best Value'}
                        </span>
                      </div>

                      <h4 className="font-black text-slate-100 text-sm truncate mt-1">
                        {item.title || item.name}
                      </h4>

                      {(item.sellerName || item.agencyName) && (
                        <p className="text-[10px] text-amber-300 font-bold truncate">
                          👤 {item.sellerName || item.agencyName}
                        </p>
                      )}
                    </div>
                  </div>

                  {item.description && (
                    <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                      {item.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800 pt-2 font-medium">
                    <span>📍 {item.location || selectedCity}</span>
                    <span className="text-cyan-300 font-bold">Scratch Verified Deal</span>
                  </div>

                  <ActionButtons
                    phone={item.phone || item.contact || '9876543210'}
                    whatsapp={item.whatsapp || item.phone || item.contact || '919876543210'}
                    message={`Namaste! Maine TownHub Scratch & Win mein aapka offer "${item.title || item.name}" (${selectedReward.label}) dekha. Kya yeh abhi available hai?`}
                  />
                </div>
              );
            })}
          </div>

          {/* Reset Control */}
          <div className="pt-1 shrink-0">
            <button
              type="button"
              onClick={handleReset}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 text-white font-black text-xs uppercase tracking-wider shadow-xl active:scale-95 transition cursor-pointer"
            >
              🪙 Scratch Another Card (नया स्क्रैच कार्ड खेलें)
            </button>
          </div>
        </div>
      )}

    </div>
  );
}