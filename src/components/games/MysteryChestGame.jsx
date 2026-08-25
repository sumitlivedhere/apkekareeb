import React, { useState, useMemo } from 'react';
import { hyperlocalStore } from '../../store/hyperlocalStore';
import ActionButtons from '../common/ActionButtons';

// 🔊 Synthesized Audio Engine (Chest Creak, Lock Snap, and Win Fanfare)
const playChestAudio = (type = 'open') => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (type === 'open') {
      // Magical creak and lock snap
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampType = 'exponentialRampToValueAtTime';
      osc.frequency.exponentialRampToValueAtTime(740, now + 0.2);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
      if (navigator.vibrate) navigator.vibrate([35, 50]);
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

// 🎁 MYSTERY TREASURE CHEST REWARD POOL
const CHEST_REWARDS = [
  { id: 'restaurants', label: 'Flash 60-Min Food Combo', hindi: '60-मिनट फूड कॉम्बो पास', icon: '🍔', tag: 'FLASH 60-MIN DEAL', perk: 'Urgent fast-food & cafe combo savings' },
  { id: 'shaadi', label: 'Wedding Attire Flash Pass', hindi: 'शादी पहनावा फ्लैश पास', icon: '💍', tag: 'VIP WEDDING PASS', perk: 'Exclusive boutique rental priority access' },
  { id: 'market', label: 'Bazaar Flash Coupon', hindi: 'बाजार फ्लैश कूपन', icon: '🛍️', tag: 'URGENT SALE', perk: 'In-store footwear & apparel price drop' },
  { id: 'sweets', label: 'Mithai Box Flash Deal', hindi: 'मिठाई बॉक्स फ्लैश डील', icon: '🍯', tag: 'SWEET FLASH', perk: 'Desi ghee sweets immediate takeaway combo' },
  { id: 'recommerce', label: 'Pre-Loved Flash Bargain', hindi: 'पुराना सामान फ्लैश डील', icon: '📦', tag: 'QUICK BARGAIN', perk: 'Inspected used phone & bike quick deal' },
  { id: 'fitness', label: 'Gym & Fitness Flash Trial', hindi: 'जिम व फिटनेस फ्लैश पास', icon: '💪', tag: 'URGENT FITNESS', perk: 'Immediate free gym trial pass & turf booking' },
];

export default function MysteryChestGame({ selectedCity = 'Alwar', onBack }) {
  const [openedChestIdx, setOpenedChestIdx] = useState(null);
  const [chestRewards, setChestRewards] = useState([null, null, null]);

  // Generate 3 random rewards for the 3 chests on mount or reset
  const randomizeChests = () => {
    const shuffled = [...CHEST_REWARDS].sort(() => Math.random() - 0.5);
    setChestRewards([shuffled[0], shuffled[1], shuffled[2]]);
    setOpenedChestIdx(null);
  };

  useMemo(() => {
    randomizeChests();
  }, []);

  const handleOpenChest = (idx) => {
    if (openedChestIdx !== null) return;
    setOpenedChestIdx(idx);
    playChestAudio('open');
    setTimeout(() => {
      playChestAudio('win');
    }, 250);
  };

  const winningReward = openedChestIdx !== null ? chestRewards[openedChestIdx] : null;

  // Query Database for matched business listings based on opened chest
  const matchedOffers = useMemo(() => {
    if (!winningReward) return [];
    const allListings = hyperlocalStore.getAllListings() || [];
    const city = (selectedCity || '').toLowerCase().trim();

    let pool = allListings.filter((item) => {
      if (!item || !item.id) return false;
      const c = (item.city || '').toLowerCase().trim();
      const loc = (item.location || '').toLowerCase().trim();
      return !city || c === city || loc.includes(city);
    });

    const matches = pool.filter((item) => item.category === winningReward.id);
    if (matches.length > 0) pool = matches;

    if (pool.length === 0) {
      pool = allListings.filter((item) => item && item.id);
    }

    return [...pool].sort(() => Math.random() - 0.5).slice(0, 3);
  }, [winningReward, selectedCity]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-3.5 select-none relative overflow-hidden">
      
      {/* 🌟 Shimmer & Chest Open Keyframes */}
      <style>{`
        @keyframes chestOpenAnim {
          0% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.15) rotate(-4deg); filter: brightness(1.4); }
          100% { transform: scale(1.05) rotate(0deg); }
        }
        @keyframes goldRibbonShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .chest-opened-effect {
          animation: chestOpenAnim 0.4s ease-out forwards;
        }
        .chest-gold-pass {
          background: linear-gradient(135deg, rgba(244,63,94,0.18) 0%, rgba(251,113,133,0.35) 50%, rgba(244,63,94,0.18) 100%);
          background-size: 200% 200%;
          animation: goldRibbonShimmer 3.5s ease infinite;
        }
      `}</style>

      {/* Top Header Bar */}
      <header className="flex items-center justify-between z-10 shrink-0 pb-2 border-b border-slate-800">
        <button
          type="button"
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 text-rose-300 font-black text-xs flex items-center justify-center cursor-pointer active:scale-90"
        >
          ←
        </button>

        <div className="text-center">
          <span className="text-[9.5px] font-black uppercase text-rose-400 tracking-wider block">
            🎁 3 MYSTERY CHESTS
          </span>
          <span className="text-xs font-black text-slate-100">Flash 60-Min Deals • {selectedCity}</span>
        </div>

        <button
          type="button"
          onClick={randomizeChests}
          className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300 cursor-pointer active:scale-90"
        >
          Reset 🔄
        </button>
      </header>

      {/* ========================================================================= */}
      {/* 🌟 3 TREASURE CHESTS SELECTION ARENA                                     */}
      {/* ========================================================================= */}
      {openedChestIdx === null && (
        <div className="relative flex-1 flex flex-col items-center justify-between my-auto py-2 z-10">
          
          <div className="text-center space-y-1">
            <span className="text-[10px] font-black uppercase px-3 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-rose-300">
              ⏳ Flash 60-Minute Pass
            </span>
            <h2 className="text-base font-black text-slate-100 tracking-tight pt-0.5">
              Choose 1 of 3 Mystery Chests!
            </h2>
            <p className="text-xs text-slate-400">
              Tap a shimmering treasure box to unlock urgent local deals and store combos in {selectedCity}.
            </p>
          </div>

          {/* 3 TREASURE CHEST BOXES ROW */}
          <div className="w-full max-w-sm grid grid-cols-3 gap-3 my-auto py-6">
            {chestRewards.map((reward, idx) => {
              return (
                <div
                  key={idx}
                  onClick={() => handleOpenChest(idx)}
                  className="relative group cursor-pointer select-none flex flex-col items-center"
                >
                  {/* Outer Glow Halo */}
                  <div className="absolute inset-0 rounded-3xl bg-amber-400/20 blur-md group-hover:bg-amber-400/40 transition"></div>

                  {/* The Treasure Chest Box */}
                  <div className="relative z-10 w-full h-36 rounded-3xl bg-gradient-to-b from-amber-600 via-amber-800 to-amber-950 border-2 border-amber-300/80 shadow-[0_15px_30px_rgba(0,0,0,0.8),inset_0_2px_6px_rgba(255,255,255,0.4)] p-3 flex flex-col items-center justify-between group-hover:scale-105 active:scale-95 transition duration-300">
                    
                    {/* Golden Lock & Straps */}
                    <div className="w-full flex items-center justify-between">
                      <span className="w-2.5 h-6 rounded bg-gradient-to-r from-amber-300 to-yellow-500 shadow"></span>
                      <span className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-300 via-yellow-400 to-amber-500 border border-amber-200 shadow flex items-center justify-center text-[10px]">
                        🔒
                      </span>
                      <span className="w-2.5 h-6 rounded bg-gradient-to-r from-amber-300 to-yellow-500 shadow"></span>
                    </div>

                    <div className="text-3xl filter drop-shadow">🎁</div>

                    <span className="text-[9px] font-black uppercase text-amber-200 bg-slate-950/80 px-2.5 py-0.5 rounded-full border border-amber-400/40 tracking-wider">
                      CHEST #{idx + 1}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center text-xs text-slate-500 pt-2">
            ✨ Each chest holds a verified local business combo.
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🌟 OPENED CHEST RESULT & MATCHED OFFERS                                   */}
      {/* ========================================================================= */}
      {winningReward && (
        <div className="relative flex-1 flex flex-col justify-between z-10 py-1 space-y-3 animate-fade-in">
          
          {/* Top Opened Chest Pass */}
          <div className="chest-gold-pass p-4 rounded-3xl border-2 border-rose-400/90 text-slate-950 shadow-2xl text-center space-y-1 relative overflow-hidden chest-opened-effect">
            <span className="text-[8.5px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-slate-950 text-rose-300 shadow">
              🎁 MYSTERY CHEST UNLOCKED
            </span>
            <h3 className="text-base font-black leading-tight pt-1">
              {winningReward.icon} {winningReward.label} • {winningReward.hindi}
            </h3>
            <p className="text-[10px] font-bold text-slate-900">
              ✨ {winningReward.perk} in {selectedCity}
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
                  className="bg-slate-900/95 border-2 border-rose-400/40 hover:border-rose-400 rounded-3xl p-3.5 space-y-3 shadow-xl transition"
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
                        <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/30">
                          {item.subCategory || winningReward.tag}
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
                    <span className="text-cyan-300 font-bold">Mystery Verified Deal</span>
                  </div>

                  <ActionButtons
                    phone={item.phone || item.contact || '9876543210'}
                    whatsapp={item.whatsapp || item.phone || item.contact || '919876543210'}
                    message={`Namaste! Maine TownHub Mystery Chest mein aapka offer "${item.title || item.name}" (${winningReward.label}) dekha. Kya yeh abhi available hai?`}
                  />
                </div>
              );
            })}
          </div>

          {/* Reset Control */}
          <div className="pt-1 shrink-0">
            <button
              type="button"
              onClick={randomizeChests}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white font-black text-xs uppercase tracking-wider shadow-xl active:scale-95 transition cursor-pointer"
            >
              🎁 Pick Another Chest (दूसरा खजाना खोलें)
            </button>
          </div>
        </div>
      )}

    </div>
  );
}