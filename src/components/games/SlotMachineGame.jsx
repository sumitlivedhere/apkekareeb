import React, { useState, useMemo } from 'react';
import { hyperlocalStore } from '../../store/hyperlocalStore';
import ActionButtons from '../common/ActionButtons';

// 🔊 Synthesized Audio Engine (Lever Pull, Reel Ticks & Jackpot Fanfare)
const playSlotAudio = (type = 'spin') => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (type === 'spin') {
      for (let i = 0; i < 8; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200 + Math.random() * 400, now + i * 0.05);
        gain.gain.setValueAtTime(0.12, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.04);
      }
    } else if (type === 'jackpot') {
      [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.01, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.08 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.4);
      });
      if (navigator.vibrate) navigator.vibrate([60, 80, 150]);
    }
  } catch {}
};

// 🎰 SLOT SYMBOLS POOL
const SLOT_SYMBOLS = [
  { symbol: '7️⃣', category: 'festivals', label: 'Jackpot 777 Special', hindi: 'ट्रिपल 777 जैकपॉट', perk: 'Mega festival shopping hamper & elite pass' },
  { symbol: '🍔', category: 'restaurants', label: 'Zayka Feast Combo', hindi: 'खान-पान मेगा कॉम्बो', perk: 'Special cafe & restaurant family feast deal' },
  { symbol: '💍', category: 'shaadi', label: 'Shaadi Gold Pass', hindi: 'शादी बुटीक स्पेशल', perk: 'Bridal wear & boutique royal discount pass' },
  { symbol: '🛍️', category: 'market', label: 'Bazaar Super Saver', hindi: 'बाजार मेगा सेल', perk: 'Local retail store flat price slash voucher' },
  { symbol: '🍯', category: 'sweets', label: 'Desi Ghee Mithai Hamper', hindi: 'देसी घी मिठाई हैम्पर', perk: 'Pure ghee sweets & celebration box' },
  { symbol: '📦', category: 'recommerce', label: 'Pre-Loved Town Deal', hindi: 'पुराना सामान मेगा डील', perk: 'Inspected direct used goods discount' },
];

export default function SlotMachineGame({ selectedCity = 'Alwar', onBack }) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [reels, setReels] = useState(['7️⃣', '🍔', '💍']);
  const [jackpotHit, setJackpotHit] = useState(false);

  const handlePullLever = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setJackpotHit(false);
    playSlotAudio('spin');

    let count = 0;
    const interval = setInterval(() => {
      setReels([
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)].symbol,
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)].symbol,
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)].symbol,
      ]);
      count++;

      if (count >= 12) {
        clearInterval(interval);
        // Force a guaranteed fun win or match on final reel settle
        const finalMatch = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
        setReels([finalMatch.symbol, finalMatch.symbol, finalMatch.symbol]);
        setIsSpinning(false);
        setJackpotHit(true);
        playSlotAudio('jackpot');
      }
    }, 70);
  };

  const winningCategory = useMemo(() => {
    if (!jackpotHit) return SLOT_SYMBOLS[0];
    const matched = SLOT_SYMBOLS.find((s) => s.symbol === reels[0]);
    return matched || SLOT_SYMBOLS[0];
  }, [jackpotHit, reels]);

  // Query Database for matched business listings
  const matchedOffers = useMemo(() => {
    if (!jackpotHit) return [];
    const allListings = hyperlocalStore.getAllListings() || [];
    const city = (selectedCity || '').toLowerCase().trim();

    let pool = allListings.filter((item) => {
      if (!item || !item.id) return false;
      const c = (item.city || '').toLowerCase().trim();
      const loc = (item.location || '').toLowerCase().trim();
      return !city || c === city || loc.includes(city);
    });

    const matches = pool.filter((item) => item.category === winningCategory.category);
    if (matches.length > 0) pool = matches;

    if (pool.length === 0) {
      pool = allListings.filter((item) => item && item.id);
    }

    return [...pool].sort(() => Math.random() - 0.5).slice(0, 3);
  }, [jackpotHit, winningCategory, selectedCity]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-3.5 select-none relative overflow-hidden">
      
      {/* 🌟 Jackpot Gold Shimmer Keyframes */}
      <style>{`
        @keyframes jackpotShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .slot-gold-card {
          background: linear-gradient(135deg, rgba(234,179,8,0.18) 0%, rgba(251,191,36,0.35) 50%, rgba(234,179,8,0.18) 100%);
          background-size: 200% 200%;
          animation: jackpotShimmer 3.5s ease infinite;
        }
      `}</style>

      {/* Top Header Bar */}
      <header className="flex items-center justify-between z-10 shrink-0 pb-2 border-b border-slate-800">
        <button
          type="button"
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 text-yellow-300 font-black text-xs flex items-center justify-center cursor-pointer active:scale-90"
        >
          ←
        </button>

        <div className="text-center">
          <span className="text-[9.5px] font-black uppercase text-yellow-400 tracking-wider block">
            🎰 TOWN JACKPOT 777
          </span>
          <span className="text-xs font-black text-slate-100">Slot Machine • {selectedCity}</span>
        </div>

        <button
          type="button"
          onClick={() => setJackpotHit(false)}
          className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300 cursor-pointer active:scale-90"
        >
          Reset 🔄
        </button>
      </header>

      {/* ========================================================================= */}
      {/* 🌟 SLOT MACHINE CABINET ARENA                                             */}
      {/* ========================================================================= */}
      {!jackpotHit && (
        <div className="relative flex-1 flex flex-col items-center justify-between my-auto py-2 z-10">
          
          <div className="text-center space-y-1">
            <span className="text-[10px] font-black uppercase px-3 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-yellow-300">
              🎰 Triple 777s Match
            </span>
            <h2 className="text-base font-black text-slate-100 tracking-tight pt-0.5">
              Pull the Slot Lever!
            </h2>
            <p className="text-xs text-slate-400">
              Match 3 town symbols to unlock mega festival shopping hampers in {selectedCity}.
            </p>
          </div>

          {/* 🎰 THE SLOT MACHINE CABINET */}
          <div className="relative w-72 bg-gradient-to-b from-amber-600 via-amber-800 to-amber-950 border-4 border-amber-300 rounded-3xl p-4 shadow-2xl my-auto space-y-4">
            
            {/* Top Cabinet Marquee Banner */}
            <div className="bg-slate-950 border-2 border-yellow-400 rounded-2xl p-2 text-center shadow-inner">
              <span className="text-xs font-black text-yellow-400 uppercase tracking-widest animate-pulse">
                💰 MEGA JACKPOT 777 💰
              </span>
            </div>

            {/* 3 Mechanical Reels Window */}
            <div className="bg-slate-950 border-4 border-slate-900 rounded-2xl p-3 grid grid-cols-3 gap-2 shadow-inner">
              {reels.map((symbol, idx) => (
                <div
                  key={idx}
                  className="h-24 rounded-xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-slate-800 flex items-center justify-center text-4xl shadow-inner overflow-hidden"
                >
                  <span className={isSpinning ? 'animate-bounce blur-[0.5px]' : ''}>{symbol}</span>
                </div>
              ))}
            </div>

            {/* Pull Lever / Spin Button */}
            <button
              type="button"
              onClick={handlePullLever}
              disabled={isSpinning}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-2xl active:scale-95 transition cursor-pointer flex items-center justify-center space-x-2"
            >
              <span>🎰</span>
              <span>{isSpinning ? 'Reels Spinning...' : 'PULL SLOT LEVER (स्पिन करें)'}</span>
              <span>➔</span>
            </button>
          </div>

          <div className="text-center text-xs text-slate-500 pt-1">
            ✨ Match 3 symbols for instant festive rewards.
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🌟 JACKPOT WIN REVEAL & DEALS                                             */}
      {/* ========================================================================= */}
      {jackpotHit && winningCategory && (
        <div className="relative flex-1 flex flex-col justify-between z-10 py-1 space-y-3 animate-fade-in">
          
          {/* Top Jackpot Pass */}
          <div className="slot-gold-card p-4 rounded-3xl border-2 border-yellow-400/90 text-slate-950 shadow-2xl text-center space-y-1 relative overflow-hidden">
            <span className="text-[8.5px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-slate-950 text-yellow-300 shadow">
              💰 JACKPOT MATCH UNLOCKED
            </span>
            <h3 className="text-base font-black leading-tight pt-1">
              {winningCategory.symbol} {winningCategory.label} • {winningCategory.hindi}
            </h3>
            <p className="text-[10px] font-bold text-slate-900">
              ✨ {winningCategory.perk} in {selectedCity}
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
                  className="bg-slate-900/95 border-2 border-yellow-400/40 hover:border-yellow-400 rounded-3xl p-3.5 space-y-3 shadow-xl transition"
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
                        <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-yellow-950 text-yellow-300 border border-yellow-500/30">
                          {item.subCategory || winningCategory.label}
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
                    <span className="text-cyan-300 font-bold">Jackpot Verified Deal</span>
                  </div>

                  <ActionButtons
                    phone={item.phone || item.contact || '9876543210'}
                    whatsapp={item.whatsapp || item.phone || item.contact || '919876543210'}
                    message={`Namaste! Maine TownHub Jackpot 777 mein aapka offer "${item.title || item.name}" (${winningCategory.label}) dekha. Kya yeh abhi available hai?`}
                  />
                </div>
              );
            })}
          </div>

          {/* Reset Control */}
          <div className="pt-1 shrink-0">
            <button
              type="button"
              onClick={() => setJackpotHit(false)}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl active:scale-95 transition cursor-pointer"
            >
              🎰 Spin Slot Machine Again (फिर से लीवर खींचें)
            </button>
          </div>
        </div>
      )}

    </div>
  );
}