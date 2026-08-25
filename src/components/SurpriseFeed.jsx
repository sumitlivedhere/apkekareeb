import React, { useState } from 'react';
import BubblesDiscovery from './surprise/BubblesDiscovery';
import SurpriseListingFeed from './surprise/SurpriseListingFeed';
import ArcadeDeck from './games/ArcadeDeck';

// 🎹 Peaceful Ambient Piano Synthesizer for Master Navigation
const playAmbientPianoChord = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    [261.63, 329.63, 392.0, 523.25].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.01, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.08 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 1.2);
    });
    if (navigator.vibrate) navigator.vibrate(30);
  } catch {}
};

export default function SurpriseFeed({
  selectedCity = 'Alwar',
  searchQuery = '',
  onBack,
  onNewNotification,
}) {
  // Navigation States: 'choice' | 'arcade' | 'bubbles' | 'feed'
  const [currentStage, setCurrentStage] = useState('choice');
  const [chosenCategory, setChosenCategory] = useState({ id: 'all', name: 'All Sectors' });

  const handleCategoryPopped = (catId, catName) => {
    setChosenCategory({ id: catId, name: catName || 'Selected Sector' });
    setCurrentStage('feed');
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex justify-center selection:bg-amber-400 selection:text-slate-950">
      
      {/* Mobile Frame Container */}
      <main className="w-full max-w-md min-h-screen bg-slate-950 border-x border-slate-800/80 pb-28 select-none flex flex-col relative shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-x-hidden">
        
        {/* 🌟 1. MASTER GATEWAY CHOICE SCREEN */}
        {currentStage === 'choice' && (
          <div className="flex-1 flex flex-col">
            <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between shadow-lg shrink-0">
              <div className="flex items-center space-x-2.5">
                <button
                  type="button"
                  onClick={() => {
                    playAmbientPianoChord();
                    onBack();
                  }}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-amber-300 font-black text-xs flex items-center justify-center transition cursor-pointer"
                >
                  ←
                </button>
                <div>
                  <div className="flex items-center space-x-1.5 text-[9px] font-black text-amber-400 tracking-wider">
                    <span>🎲 SURPRISE ME! DISCOVERY</span>
                    <span>•</span>
                    <span className="text-slate-400">{selectedCity.toUpperCase()}</span>
                  </div>
                  <h1 className="text-xs font-black text-slate-100">
                    Select Discovery Experience
                  </h1>
                </div>
              </div>
            </header>

            <div className="max-w-md mx-auto w-full p-4 flex-1 flex flex-col justify-center space-y-4 my-auto">
              <div className="text-center space-y-1">
                <h2 className="text-base font-black text-slate-100 tracking-tight">
                  Aap Aaj Kya Dekhna Chahenge?
                </h2>
                <p className="text-xs text-slate-400">
                  Choose your adventure across {selectedCity}
                </p>
              </div>

              {/* WIDGET 1: Gamified Deals */}
              <button
                type="button"
                onClick={() => {
                  playAmbientPianoChord();
                  setCurrentStage('arcade');
                }}
                className="w-full p-5 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 rounded-3xl text-left shadow-2xl border-2 border-amber-400/40 active:scale-[0.98] transition cursor-pointer space-y-3.5 block"
              >
                <div className="flex items-start justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-400 to-amber-500 text-slate-950 text-2xl flex items-center justify-center font-black shadow-xl">
                    🎮
                  </div>
                  <span className="text-[9.5px] font-black px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 uppercase tracking-wider shadow-md">
                    8 Arcade Games
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-black text-amber-300">
                    Gamified Deals (गेम्स & डील्स)
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Play Lucky Dice, Town Spin Wheel, 3D Card Flips & Mystery Chests to unlock instant verified shop discounts!
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                  <span className="text-[10px] text-emerald-400 font-bold">✓ Guaranteed Rewards</span>
                  <div className="px-3.5 py-1.5 bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center space-x-1">
                    <span>Play Games</span>
                    <span>➔</span>
                  </div>
                </div>
              </button>

              {/* WIDGET 2: Floating Bubbles Discovery */}
              <button
                type="button"
                onClick={() => setCurrentStage('bubbles')}
                className="w-full p-5 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 rounded-3xl text-left shadow-2xl border-2 border-cyan-400/40 active:scale-[0.98] transition cursor-pointer space-y-3.5 block"
              >
                <div className="flex items-start justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-400 to-blue-500 text-slate-950 text-2xl flex items-center justify-center font-black shadow-xl">
                    🫧
                  </div>
                  <span className="text-[9.5px] font-black px-3 py-1 rounded-full bg-slate-800 text-cyan-300 border border-cyan-400/40 uppercase tracking-wider">
                    17 Floating Bubbles
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-black text-slate-100">
                    Surprise Feed (तैरते बुलबुले डिस्कवरी)
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Pop floating liquid neon spheres to unlock surprise deals across all 17 town categories in {selectedCity}.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                  <span className="text-[10px] text-slate-400 font-bold">✓ 1-Tap Liquid Bubble Pop</span>
                  <div className="px-3.5 py-1.5 bg-slate-800 text-cyan-300 border border-cyan-400/40 font-black text-xs rounded-xl shadow-md flex items-center space-x-1">
                    <span>Pop Bubbles</span>
                    <span>➔</span>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* 🌟 2. FLOATING BUBBLES CATEGORY SELECTOR */}
        {currentStage === 'bubbles' && (
          <BubblesDiscovery
            selectedCity={selectedCity}
            onSelectCategory={handleCategoryPopped}
            onBack={() => {
              playAmbientPianoChord();
              setCurrentStage('choice');
            }}
          />
        )}

        {/* 🌟 3. ARCADE DECK & MINI-GAMES HUB */}
        {currentStage === 'arcade' && (
          <ArcadeDeck
            selectedCity={selectedCity}
            onBack={() => {
              playAmbientPianoChord();
              setCurrentStage('choice');
            }}
            onSwitchToFeed={() => setCurrentStage('bubbles')}
          />
        )}

        {/* 🌟 4. ACTIVE CURATED FEED LISTINGS */}
        {currentStage === 'feed' && (
          <SurpriseListingFeed
            selectedCity={selectedCity}
            searchQuery={searchQuery}
            chosenCategory={chosenCategory}
            onOpenBubbles={() => setCurrentStage('bubbles')}
            onNewNotification={onNewNotification}
          />
        )}

      </main>
    </div>
  );
}