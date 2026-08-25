import React, { useState } from 'react';
import LuckyDiceGame from './LuckyDiceGame';
import DartBoardGame from './DartBoardGame';
import CardShuffleGame from './CardShuffleGame';
import SpinWheelGame from './SpinWheelGame';
import ScratchCardGame from './ScratchCardGame';
import MysteryChestGame from './MysteryChestGame';
import SlotMachineGame from './SlotMachineGame';

const ARCADE_GAMES = [
  {
    id: 'dice_roll',
    number: 1,
    title: 'Lucky Dice Roll',
    hindiTitle: 'किस्मत का पासा',
    icon: '🎲',
    theme: 'from-amber-400 via-orange-500 to-yellow-500',
    borderColor: 'border-amber-400',
    tag: 'INSTANT REEL',
    description: 'Tap the 3D red dice to unlock tiered shopping discounts and lifestyle combos across town.',
    rewardBadge: '🏆 Up to ₹500 Voucher',
    accentColor: 'text-amber-300',
    bgGlow: 'rgba(245, 158, 11, 0.4)',
    bgImage: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=900&auto=format&fit=crop&q=80',
  },
  {
    id: 'spin_wheel',
    number: 2,
    title: 'Town Spin Wheel',
    hindiTitle: 'घुमाओ और जीतो',
    icon: '🎡',
    theme: 'from-emerald-400 via-teal-500 to-cyan-500',
    borderColor: 'border-emerald-400',
    tag: '8 WINNING WEDGES',
    description: 'Spin the carnival wheel for guaranteed wedding vendor passes, food treats & shopping coupons.',
    rewardBadge: '🎁 Daily Free Spin',
    accentColor: 'text-emerald-300',
    bgGlow: 'rgba(16, 185, 129, 0.4)',
    bgImage: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=900&auto=format&fit=crop&q=80',
  },
  {
    id: 'scratch_card',
    number: 3,
    title: 'Digital Scratch & Win',
    hindiTitle: 'स्क्रैच और रिवील',
    icon: '🪙',
    theme: 'from-purple-400 via-indigo-500 to-pink-500',
    borderColor: 'border-purple-400',
    tag: 'DAILY MYSTERY FOIL',
    description: 'Rub the frosted silver hologram foil with your finger to unveil secret merchant discounts.',
    rewardBadge: '⚡ 1 Free Daily Card',
    accentColor: 'text-purple-300',
    bgGlow: 'rgba(168, 85, 247, 0.4)',
    bgImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=900&auto=format&fit=crop&q=80',
  },
  {
    id: 'mystery_chest',
    number: 4,
    title: '3 Mystery Chests',
    hindiTitle: 'खजाना खोलो',
    icon: '🎁',
    theme: 'from-rose-400 via-pink-600 to-red-500',
    borderColor: 'border-rose-400',
    tag: 'FLASH 60-MIN PASS',
    description: 'Choose 1 of 3 shimmering treasure boxes to unlock urgent 60-minute flash deals from nearby shops.',
    rewardBadge: '⏳ 60-Min Flash Deal',
    accentColor: 'text-rose-300',
    bgGlow: 'rgba(244, 63, 94, 0.4)',
    bgImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=900&auto=format&fit=crop&q=80',
  },
  {
    id: 'card_shuffle',
    number: 5,
    title: '3D Card Flip & Pick',
    hindiTitle: 'किस्मत का ताश',
    icon: '🃏',
    theme: 'from-cyan-400 via-blue-600 to-indigo-600',
    borderColor: 'border-cyan-400',
    tag: '3D ROYAL FLIP',
    description: 'Watch 3 gold-embossed cards swirl, pick your lucky card, and flip for high-ticket rental perks.',
    rewardBadge: '💎 Diamond Card Jackpot',
    accentColor: 'text-cyan-300',
    bgGlow: 'rgba(6, 182, 212, 0.4)',
    bgImage: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=900&auto=format&fit=crop&q=80',
  },
  {
    id: 'dart_board',
    number: 6,
    title: 'Town Dart Board',
    hindiTitle: 'निशाना बाज़ी',
    icon: '🎯',
    theme: 'from-red-400 via-orange-600 to-amber-600',
    borderColor: 'border-red-400',
    tag: 'SKILL-BASED AIM',
    description: 'Time your tap with precision to hit the Bullseye and launch rocket dart VIP match results.',
    rewardBadge: '🎯 Bullseye VIP Pass',
    accentColor: 'text-red-300',
    bgGlow: 'rgba(239, 68, 68, 0.4)',
    bgImage: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=900&auto=format&fit=crop&q=80',
  },
  {
    id: 'slot_machine',
    number: 7,
    title: 'Town Jackpot 777',
    hindiTitle: 'जैकपॉट रील',
    icon: '🎰',
    theme: 'from-yellow-300 via-amber-500 to-orange-600',
    borderColor: 'border-yellow-400',
    tag: 'TRIPLE 777S',
    description: 'Pull the vintage slot machine lever to match 3 town symbols for mega festival shopping hampers.',
    rewardBadge: '💰 Mega Town Hamper',
    accentColor: 'text-yellow-300',
    bgGlow: 'rgba(234, 179, 8, 0.4)',
    bgImage: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=900&auto=format&fit=crop&q=80',
  },
];

export default function ArcadeDeck({ selectedCity = 'Alwar', onBack, onSwitchToFeed }) {
  const [activeGameIdx, setActiveGameIdx] = useState(0);
  const [activePlayGameId, setActivePlayGameId] = useState(null);
  const [touchStartX, setTouchStartX] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Game Routing Switch
  if (activePlayGameId === 'dice_roll') {
    return <LuckyDiceGame selectedCity={selectedCity} onBack={() => setActivePlayGameId(null)} />;
  }
  if (activePlayGameId === 'spin_wheel') {
    return <SpinWheelGame selectedCity={selectedCity} onBack={() => setActivePlayGameId(null)} />;
  }
  if (activePlayGameId === 'scratch_card') {
    return <ScratchCardGame selectedCity={selectedCity} onBack={() => setActivePlayGameId(null)} />;
  }
  if (activePlayGameId === 'mystery_chest') {
    return <MysteryChestGame selectedCity={selectedCity} onBack={() => setActivePlayGameId(null)} />;
  }
  if (activePlayGameId === 'card_shuffle') {
    return <CardShuffleGame selectedCity={selectedCity} onBack={() => setActivePlayGameId(null)} />;
  }
  if (activePlayGameId === 'dart_board') {
    return <DartBoardGame selectedCity={selectedCity} onBack={() => setActivePlayGameId(null)} />;
  }
  if (activePlayGameId === 'slot_machine') {
    return <SlotMachineGame selectedCity={selectedCity} onBack={() => setActivePlayGameId(null)} />;
  }

  // Infinite Cycle Handlers (1 -> 7 -> 1)
  const handleNextGame = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setActiveGameIdx((prev) => (prev + 1) % ARCADE_GAMES.length);
    setTimeout(() => setIsAnimating(false), 240);
  };

  const handlePrevGame = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setActiveGameIdx((prev) => (prev - 1 + ARCADE_GAMES.length) % ARCADE_GAMES.length);
    setTimeout(() => setIsAnimating(false), 240);
  };

  // Fixed Swipe Gesture Logic
  const handleTouchStart = (e) => setTouchStartX(e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    if (touchStartX === null) return;
    const deltaX = touchStartX - e.changedTouches[0].clientX;
    
    if (deltaX > 35) {
      // Swiped Left -> Go to Next Game
      handleNextGame();
    } else if (deltaX < -35) {
      // Swiped Right -> Go to Previous Game (instead of exiting)
      handlePrevGame();
    }
    setTouchStartX(null);
  };

  const currentGame = ARCADE_GAMES[activeGameIdx];

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="max-w-md mx-auto w-full p-3.5 flex-1 flex flex-col justify-between"
      style={{ minHeight: 'calc(100dvh - 120px)' }}
    >
      <header className="flex items-center justify-between pb-2 shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 text-amber-300 font-black text-xs flex items-center justify-center cursor-pointer active:scale-90"
          title="Back to Choice Screen"
        >
          ←
        </button>
        <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">
          🕹️ Arcade Game {currentGame.number} of {ARCADE_GAMES.length}
        </span>
        <button
          type="button"
          onClick={onSwitchToFeed}
          className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-cyan-300 text-[10px] font-bold cursor-pointer"
        >
          Bubbles ➔
        </button>
      </header>

      <div
        className={`relative flex-1 rounded-3xl overflow-hidden border-2 ${currentGame.borderColor} shadow-2xl flex flex-col justify-between p-5 transition-all duration-300 group`}
        style={{ boxShadow: `0 25px 60px -15px ${currentGame.bgGlow}` }}
      >
        <div className="absolute inset-0 z-0">
          <img
            src={currentGame.bgImage}
            alt={currentGame.title}
            className="w-full h-full object-cover opacity-35 scale-105 group-hover:scale-110 transition duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/40"></div>
        </div>

        <div className="relative z-10 flex items-start justify-between">
          <span className={`text-[9.5px] font-black px-3 py-1 rounded-full bg-gradient-to-r ${currentGame.theme} text-slate-950 uppercase tracking-wider shadow-lg`}>
            {currentGame.tag}
          </span>
          <span className="text-[10.5px] font-black font-mono text-slate-300 bg-slate-950/90 px-3 py-1 rounded-xl border border-slate-700 shadow-md">
            {currentGame.number} / {ARCADE_GAMES.length}
          </span>
        </div>

        <div className="relative z-10 my-auto text-center space-y-3 py-4">
          <div className={`w-24 h-24 rounded-3xl bg-gradient-to-tr ${currentGame.theme} text-slate-950 text-5xl flex items-center justify-center font-black shadow-2xl mx-auto animate-bounce`}>
            {currentGame.icon}
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-100 tracking-tight leading-tight">
              {currentGame.title}
            </h2>
            <p className={`text-sm font-black ${currentGame.accentColor}`}>
              {currentGame.hindiTitle}
            </p>
          </div>

          <div className="p-3.5 bg-slate-950/85 backdrop-blur-md rounded-2xl border border-slate-800 space-y-2 text-xs max-w-xs mx-auto">
            <p className="text-slate-200 text-xs leading-relaxed font-medium">
              {currentGame.description}
            </p>
            <div className="flex items-center justify-between pt-1.5 border-t border-slate-900 text-[11px]">
              <span className="text-slate-400 font-bold">Guaranteed Outcome:</span>
              <span className={`font-black ${currentGame.accentColor}`}>{currentGame.rewardBadge}</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-2">
          <button
            type="button"
            onClick={() => setActivePlayGameId(currentGame.id)}
            className={`w-full py-4 bg-gradient-to-r ${currentGame.theme} text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-2xl active:scale-95 transition cursor-pointer flex items-center justify-center space-x-2`}
          >
            <span>PLAY & UNLOCK DEALS</span>
            <span className="text-base">➔</span>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 shrink-0">
        <button
          type="button"
          onClick={handlePrevGame}
          className="px-4 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-800 active:scale-95 transition cursor-pointer flex items-center space-x-1.5 shadow-md"
        >
          <span>◀</span>
          <span>Prev</span>
        </button>

        <div className="flex items-center space-x-1.5">
          {ARCADE_GAMES.map((g, idx) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setActiveGameIdx(idx)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                activeGameIdx === idx
                  ? 'w-7 bg-amber-400 shadow-md'
                  : 'w-2 bg-slate-800 hover:bg-slate-700'
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleNextGame}
          className="px-4 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-800 active:scale-95 transition cursor-pointer flex items-center space-x-1.5 shadow-md"
        >
          <span>Next</span>
          <span>▶</span>
        </button>
      </div>
    </div>
  );
}