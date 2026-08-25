import React, { useState, useMemo } from 'react';
import { hyperlocalStore } from '../../store/hyperlocalStore';
import ActionButtons from '../common/ActionButtons';

// 🔊 Synthesized Audio Engine (Spinning Ticks, Deceleration, and Fanfare)
const playWheelAudio = (type = 'tick') => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (type === 'tick') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(650 + Math.random() * 200, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
      if (navigator.vibrate) navigator.vibrate(15);
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

// 🎡 8 WINNING CARNIVAL WEDGES
const SPIN_WEDGES = [
  { id: 'restaurants', label: 'Food & Zayka', hindi: 'खान-पान कॉम्बो', icon: '🍔', color: '#f59e0b', tag: 'TASTE OF TOWN', perk: 'Special cafes & street food deals' },
  { id: 'shaadi', label: 'Shaadi & Style', hindi: 'शादी व पहनावा', icon: '💍', tag: 'WEDDING PASS', perk: 'Lehengas, sherwanis & boutique rentals' },
  { id: 'market', label: 'Bazaar Deals', hindi: 'बाजार खरीदारी', icon: '🛍️', tag: 'RETAIL SALE', perk: 'Footwear, garments & store discounts' },
  { id: 'sweets', label: 'Mithai & Bakery', hindi: 'मिठाई व केक', icon: '🍯', tag: 'SWEET TREATS', perk: 'Desi ghee sweets & fresh birthday cakes' },
  { id: 'recommerce', label: 'Purana Samaan', hindi: 'पुराना सामान', icon: '📦', tag: 'PRE-LOVED DEAL', perk: 'Inspected used bikes, phones & furniture' },
  { id: 'fitness', label: 'Gym & Fitness', hindi: 'जिम व फिटनेस', icon: '💪', tag: 'HEALTH PASS', perk: 'Gym trial sessions & sports turf booking' },
  { id: 'malls', label: 'Hangout & Cafes', hindi: 'फैमिली हैंगआउट', icon: '☕', tag: 'LEISURE SPOT', perk: 'Cozy rooftop cafes & dessert lounges' },
  { id: 'festivals', label: 'Festival Specials', hindi: 'त्योहार ऑफर', icon: '🪔', tag: 'FESTIVE OFFER', perk: 'Special hampers & seasonal discounts' },
];

export default function SpinWheelGame({ selectedCity = 'Alwar', onBack }) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [winningWedge, setWinningWedge] = useState(null);

  // Swipe gesture tracking
  const [touchStartAngle, setTouchStartAngle] = useState(null);

  const handleSpinWheel = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setWinningWedge(null);

    // Random extra spins (between 5 to 8 full rotations + random wedge offset)
    const randomWedgeIdx = Math.floor(Math.random() * SPIN_WEDGES.length);
    const degreesPerWedge = 360 / SPIN_WEDGES.length;
    // Calculate target angle so pointer (at top) aligns with winning wedge
    const extraSpins = 360 * (5 + Math.floor(Math.random() * 3));
    const targetAngle = rotationAngle + extraSpins + (360 - (randomWedgeIdx * degreesPerWedge + degreesPerWedge / 2));

    setRotationAngle(targetAngle);

    // Play ticking audio intervals during spin deceleration
    let ticks = 0;
    const tickInterval = setInterval(() => {
      playWheelAudio('tick');
      ticks++;
      if (ticks > 22) clearInterval(tickInterval);
    }, 120);

    // Stop spin after 2.8 seconds
    setTimeout(() => {
      setIsSpinning(false);
      clearInterval(tickInterval);
      setWinningWedge(SPIN_WEDGES[randomWedgeIdx]);
      playWheelAudio('win');
    }, 2800);
  };

  // Query Database for matched business listings based on winning wedge
  const matchedOffers = useMemo(() => {
    if (!winningWedge) return [];
    const allListings = hyperlocalStore.getAllListings() || [];
    const city = (selectedCity || '').toLowerCase().trim();

    let pool = allListings.filter((item) => {
      if (!item || !item.id) return false;
      const c = (item.city || '').toLowerCase().trim();
      const loc = (item.location || '').toLowerCase().trim();
      return !city || c === city || loc.includes(city);
    });

    const matches = pool.filter((item) => item.category === winningWedge.id);
    if (matches.length > 0) pool = matches;

    if (pool.length === 0) {
      pool = allListings.filter((item) => item && item.id);
    }

    return [...pool].sort(() => Math.random() - 0.5).slice(0, 3);
  }, [winningWedge, selectedCity]);

  const handleReset = () => {
    setWinningWedge(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-3.5 select-none relative overflow-hidden">
      
      {/* 🌟 Carnival Gold Shimmer Keyframes */}
      <style>{`
        @keyframes carnivalShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .carnival-gold-card {
          background: linear-gradient(135deg, rgba(16,185,129,0.18) 0%, rgba(52,211,153,0.35) 50%, rgba(16,185,129,0.18) 100%);
          background-size: 200% 200%;
          animation: carnivalShimmer 3.5s ease infinite;
        }
      `}</style>

      {/* Top Header Bar */}
      <header className="flex items-center justify-between z-10 shrink-0 pb-2 border-b border-slate-800">
        <button
          type="button"
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 text-emerald-300 font-black text-xs flex items-center justify-center cursor-pointer active:scale-90"
        >
          ←
        </button>

        <div className="text-center">
          <span className="text-[9.5px] font-black uppercase text-emerald-400 tracking-wider block">
            🎡 TOWN SPIN WHEEL
          </span>
          <span className="text-xs font-black text-slate-100">Carnival Wheel • {selectedCity}</span>
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
      {/* 🌟 SPIN WHEEL ARENA                                                       */}
      {/* ========================================================================= */}
      {!winningWedge && (
        <div className="relative flex-1 flex flex-col items-center justify-between my-auto py-2 z-10">
          
          <div className="text-center space-y-1">
            <span className="text-[10px] font-black uppercase px-3 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-emerald-300">
              🎡 8 Winning Wedges
            </span>
            <h2 className="text-base font-black text-slate-100 tracking-tight pt-0.5">
              Spin the Carnival Wheel!
            </h2>
            <p className="text-xs text-slate-400">
              Tap or swipe to spin the wheel and unlock guaranteed local deals in {selectedCity}.
            </p>
          </div>

          {/* 🎡 THE CARNIVAL WHEEL COMPONENT */}
          <div className="relative w-72 h-72 my-auto flex items-center justify-center">
            
            {/* Top Pointer Arrow */}
            <div className="absolute -top-4 z-30 w-8 h-10 bg-gradient-to-b from-amber-300 to-yellow-600 clip-path-triangle shadow-lg border border-amber-200"></div>

            {/* Outer Glowing Neon Ring */}
            <div className="absolute inset-0 rounded-full border-4 border-emerald-400/80 shadow-[0_0_35px_rgba(16,185,129,0.5),inset_0_0_20px_rgba(16,185,129,0.3)]"></div>

            {/* Spinning Wheel Body */}
            <div
              onClick={handleSpinWheel}
              className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-slate-900 shadow-2xl cursor-pointer transition-transform ease-out"
              style={{
                transform: `rotate(${rotationAngle}deg)`,
                transitionDuration: isSpinning ? '2.8s' : '0s',
                background: 'conic-gradient(#f59e0b 0deg 45deg, #10b981 45deg 90deg, #06b6d4 90deg 135deg, #a855f7 135deg 180deg, #f43f5e 180deg 225deg, #3b82f6 225deg 270deg, #ec4899 270deg 315deg, #eab308 315deg 360deg)',
              }}
            >
              {/* Wedge Icons & Labels Overlay */}
              {SPIN_WEDGES.map((w, idx) => {
                const angle = idx * 45 + 22.5;
                return (
                  <div
                    key={w.id}
                    className="absolute inset-0 flex items-start justify-center pt-3 text-slate-950 font-black text-xs select-none pointer-events-none"
                    style={{ transform: `rotate(${angle}deg)`, transformOrigin: 'center center' }}
                  >
                    <span className="text-xl filter drop-shadow">{w.icon}</span>
                  </div>
                );
              })}
            </div>

            {/* Center Hub Button */}
            <div
              onClick={handleSpinWheel}
              className="absolute z-20 w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 border-4 border-slate-900 shadow-2xl flex items-center justify-center text-slate-950 font-black text-xs uppercase tracking-tighter cursor-pointer active:scale-95 transition"
            >
              SPIN
            </div>
          </div>

          {/* Action Trigger Button */}
          <div className="w-full max-w-xs pt-2">
            <button
              type="button"
              onClick={handleSpinWheel}
              disabled={isSpinning}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-2xl active:scale-95 transition cursor-pointer flex items-center justify-center space-x-2"
            >
              <span>🎡</span>
              <span>{isSpinning ? 'Spinning Wheel...' : 'SPIN CARNIVAL WHEEL (घुमाएं)'}</span>
              <span>➔</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🌟 WINNING WEDGE MATCH REVEAL & DEALS                                     */}
      {/* ========================================================================= */}
      {winningWedge && (
        <div className="relative flex-1 flex flex-col justify-between z-10 py-1 space-y-3 animate-fade-in">
          
          {/* Top Winning Wedge Pass */}
          <div className="carnival-gold-card p-4 rounded-3xl border-2 border-emerald-400/90 text-slate-950 shadow-2xl text-center space-y-1 relative overflow-hidden">
            <span className="text-[8.5px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-slate-950 text-emerald-300 shadow">
              🎁 WINNING WEDGE UNLOCKED
            </span>
            <h3 className="text-base font-black leading-tight pt-1">
              {winningWedge.icon} {winningWedge.label} • {winningWedge.hindi}
            </h3>
            <p className="text-[10px] font-bold text-slate-900">
              ✨ {winningWedge.perk} in {selectedCity}
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
                  className="bg-slate-900/95 border-2 border-emerald-400/40 hover:border-emerald-400 rounded-3xl p-3.5 space-y-3 shadow-xl transition"
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
                        <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                          {item.subCategory || winningWedge.tag}
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
                    <span className="text-cyan-300 font-bold">Carnival Verified Deal</span>
                  </div>

                  <ActionButtons
                    phone={item.phone || item.contact || '9876543210'}
                    whatsapp={item.whatsapp || item.phone || item.contact || '919876543210'}
                    message={`Namaste! Maine TownHub Spin Wheel mein aapka offer "${item.title || item.name}" (${winningWedge.label}) dekha. Kya yeh abhi available hai?`}
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
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl active:scale-95 transition cursor-pointer"
            >
              🎡 Spin Wheel Again (फिर से पहिया घुमाएं)
            </button>
          </div>
        </div>
      )}

    </div>
  );
}