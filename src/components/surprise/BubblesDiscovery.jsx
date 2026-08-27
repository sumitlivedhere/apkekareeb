import React, { useState, useEffect, useRef } from 'react';

// 🌊 CONTINUOUS AMBIENT WATER BUBBLING SYNTHESIZER
class AmbientWaterBubbleSynth {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isPlaying = false;
    this.timer = null;
  }

  start() {
    if (this.isPlaying) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const unlockAudio = () => {
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
      };
      window.addEventListener('click', unlockAudio);
      window.addEventListener('touchstart', unlockAudio);

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(0.24, this.ctx.currentTime + 0.3);
      this.masterGain.connect(this.ctx.destination);

      this.isPlaying = true;

      const scheduleBloop = () => {
        if (!this.isPlaying || !this.ctx || this.ctx.state === 'closed') return;

        try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          const startFreq = 340 + Math.random() * 520;
          const endFreq = startFreq + 240 + Math.random() * 320;
          const dur = 0.07 + Math.random() * 0.05;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + dur);

          gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.18 + Math.random() * 0.1, this.ctx.currentTime + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);

          osc.connect(gain);
          gain.connect(this.masterGain);

          osc.start(this.ctx.currentTime);
          osc.stop(this.ctx.currentTime + dur);
        } catch {}

        const nextDelay = 140 + Math.random() * 240;
        this.timer = setTimeout(scheduleBloop, nextDelay);
      };

      scheduleBloop();
    } catch {}
  }

  stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    clearTimeout(this.timer);
    try {
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
      }
      setTimeout(() => {
        if (this.ctx && this.ctx.state !== 'closed') {
          this.ctx.close();
        }
      }, 180);
    } catch {}
  }
}

// 🔊 Tactile Pop Sound
const playBubblePopAudio = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1150, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.38, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);

    if (navigator.vibrate) navigator.vibrate(35);
  } catch {}
};

// 🎯 Filtered & Renamed Surprise-Only Town Bubbles
const SURPRISE_TOWN_BUBBLES = [
  {
    id: 'all',
    name: 'Kismat / All Mix',
    hindiName: 'किस्मत / सब कुछ मिक्स',
    icon: '🎲',
    theme: 'from-violet-400 via-fuchsia-500 to-pink-500',
    glowColor: 'rgba(217, 70, 239, 0.65)',
    borderColor: 'border-fuchsia-400',
    textColor: 'text-fuchsia-300',
    delay: '0s',
    isHero: true,
  },
  {
    id: 'restaurants',
    name: 'Food & Zayka',
    hindiName: 'खान-पान व रेस्टोरेंट',
    icon: '🍔',
    theme: 'from-amber-400 via-orange-500 to-red-500',
    glowColor: 'rgba(245, 158, 11, 0.55)',
    borderColor: 'border-amber-400',
    textColor: 'text-amber-300',
    delay: '0.2s',
  },
  {
    id: 'shaadi',
    name: 'Shaadi & Style',
    hindiName: 'शादी व पहनावा',
    icon: '💍',
    theme: 'from-pink-400 via-rose-500 to-purple-600',
    glowColor: 'rgba(244, 63, 94, 0.55)',
    borderColor: 'border-pink-400',
    textColor: 'text-pink-300',
    delay: '0.4s',
  },
  {
    id: 'property',
    name: 'Property',
    hindiName: 'प्रॉपर्टी व ज़मीन',
    icon: '🏠',
    theme: 'from-emerald-400 via-teal-500 to-green-600',
    glowColor: 'rgba(16, 185, 129, 0.55)',
    borderColor: 'border-emerald-400',
    textColor: 'text-emerald-300',
    delay: '0.6s',
  },
  {
    id: 'market',
    name: 'Bazaar & Kirana',
    hindiName: 'बाजार व खरीदारी',
    icon: '🛍️',
    theme: 'from-yellow-300 via-amber-500 to-orange-600',
    glowColor: 'rgba(234, 179, 8, 0.55)',
    borderColor: 'border-yellow-400',
    textColor: 'text-yellow-300',
    delay: '0.8s',
  },
  {
    id: 'recommerce',
    name: 'Second Hand SAMAAN',
    hindiName: 'सेकंड हैंड सामान',
    icon: '📦',
    theme: 'from-teal-400 via-emerald-500 to-green-600',
    glowColor: 'rgba(20, 184, 166, 0.55)',
    borderColor: 'border-teal-400',
    textColor: 'text-teal-300',
    delay: '1.0s',
  },
  {
    id: 'fitness',
    name: 'Fitness & Gym',
    hindiName: 'जिम व फिटनेस',
    icon: '💪',
    theme: 'from-red-500 via-orange-500 to-amber-500',
    glowColor: 'rgba(239, 68, 68, 0.55)',
    borderColor: 'border-red-500',
    textColor: 'text-red-300',
    delay: '0.3s',
  },
  {
    id: 'malls',
    name: 'Malls & Stores',
    hindiName: 'शॉपिंग मॉल व स्टोर्स',
    icon: '🏢',
    theme: 'from-purple-400 via-pink-500 to-rose-500',
    glowColor: 'rgba(168, 85, 247, 0.55)',
    borderColor: 'border-purple-400',
    textColor: 'text-purple-300',
    delay: '0.5s',
  },
  {
    id: 'creators',
    name: 'Creators',
    hindiName: 'फोटो व वीडियो स्टूडियो',
    icon: '📸',
    theme: 'from-pink-400 via-fuchsia-500 to-purple-600',
    glowColor: 'rgba(236, 72, 153, 0.55)',
    borderColor: 'border-pink-400',
    textColor: 'text-pink-300',
    delay: '0.7s',
  },
  {
    id: 'advertising',
    name: 'Prachar',
    hindiName: 'प्रचार व स्पेशल ऑफर्स',
    icon: '📢',
    theme: 'from-yellow-400 via-amber-500 to-red-500',
    glowColor: 'rgba(234, 179, 8, 0.55)',
    borderColor: 'border-yellow-400',
    textColor: 'text-yellow-300',
    delay: '0.9s',
  },
  {
    id: 'festival',
    name: 'Festival Offers',
    hindiName: 'त्योहार स्पेशल डील्स',
    icon: '🪔',
    theme: 'from-amber-400 via-orange-500 to-rose-500',
    glowColor: 'rgba(245, 158, 11, 0.55)',
    borderColor: 'border-amber-400',
    textColor: 'text-amber-300',
    delay: '1.1s',
  },
  {
    id: 'community',
    name: 'Community',
    hindiName: 'शहर व कम्युनिटी',
    icon: '🤝',
    theme: 'from-cyan-400 via-teal-500 to-emerald-500',
    glowColor: 'rgba(6, 182, 212, 0.55)',
    borderColor: 'border-cyan-400',
    textColor: 'text-cyan-300',
    delay: '1.3s',
  },
];

export default function BubblesDiscovery({ onSelectCategory, onBack, selectedCity = 'Alwar' }) {
  const [poppedBubbleId, setPoppedBubbleId] = useState(null);
  // 'en' (English Primary) | 'hi' (Hindi Primary)
  const [langMode, setLangMode] = useState('en');
  const synthRef = useRef(new AmbientWaterBubbleSynth());

  useEffect(() => {
    synthRef.current.start();
    return () => {
      synthRef.current.stop();
    };
  }, []);

  const handleBubbleClick = (bubble) => {
    if (poppedBubbleId) return;

    synthRef.current.stop();
    playBubblePopAudio();
    setPoppedBubbleId(bubble.id);

    const displayName = langMode === 'hi' ? bubble.hindiName : bubble.name;

    setTimeout(() => {
      onSelectCategory(bubble.id, displayName);
    }, 420);
  };

  return (
    <div className="relative w-full h-[calc(100dvh-125px)] max-h-[calc(100dvh-125px)] flex flex-col justify-between items-center select-none text-slate-100 overflow-hidden px-2 py-1">
      {/* 🌟 Liquid Wobble & Bubble Keyframes */}
      <style>{`
        @keyframes liquidBobbing {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-5px) rotate(1deg); }
        }
        @keyframes shimmerGaze {
          0%, 100% { opacity: 0.45; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.03); }
        }
        @keyframes bubbleBurstPop {
          0% { transform: scale(1); opacity: 1; }
          45% { transform: scale(1.3); opacity: 0.9; filter: brightness(1.8); }
          100% { transform: scale(2); opacity: 0; filter: blur(6px); }
        }
        @keyframes particleBurstFly {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
        }
        .liquid-bubble-float {
          animation: liquidBobbing 4s ease-in-out infinite;
        }
        .bubble-glow-halo {
          animation: shimmerGaze 3s ease-in-out infinite;
        }
        .bubble-pop-active {
          animation: bubbleBurstPop 0.42s ease-out forwards;
        }
      `}</style>

      {/* 🌟 1-Tap Language Toggle Switcher */}
      <div className="z-20 shrink-0 flex items-center bg-slate-900/90 border border-slate-800 rounded-full p-0.5 shadow-sm mt-0.5">
        <button
          type="button"
          onClick={() => setLangMode('en')}
          className={`px-3 py-1 rounded-full text-[10px] font-black transition cursor-pointer ${
            langMode === 'en'
              ? 'bg-amber-400 text-slate-950 shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          English
        </button>
        <button
          type="button"
          onClick={() => setLangMode('hi')}
          className={`px-3 py-1 rounded-full text-[10px] font-black transition cursor-pointer ${
            langMode === 'hi'
              ? 'bg-amber-400 text-slate-950 shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          हिंदी
        </button>
      </div>

      {/* 🌟 Floating Category Bubbles Canvas */}
      <div className="relative z-10 w-full flex-1 overflow-y-auto overscroll-contain scrollbar-none py-1 px-1 flex flex-col items-center justify-center">
        <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto place-items-center my-auto">
          {SURPRISE_TOWN_BUBBLES.map((bubble) => {
            const isPopped = poppedBubbleId === bubble.id;
            const isAnyPopped = Boolean(poppedBubbleId);

            const primaryText = langMode === 'hi' ? bubble.hindiName : bubble.name;
            const secondaryText = langMode === 'hi' ? bubble.name : bubble.hindiName;

            return (
              <div
                key={bubble.id}
                style={{ animationDelay: bubble.delay }}
                className={`relative liquid-bubble-float flex items-center justify-center transition-all duration-300 ${
                  bubble.isHero
                    ? 'col-span-3 w-28 h-28 my-0.5'
                    : 'w-20 h-20'
                } ${isAnyPopped && !isPopped ? 'opacity-15 scale-75 blur-[1px]' : 'opacity-100'}`}
              >
                {/* Glowing Halos */}
                <div
                  className={`absolute inset-0 rounded-full bubble-glow-halo pointer-events-none ${isPopped ? 'hidden' : ''}`}
                  style={{
                    boxShadow: `0 0 18px 3px ${bubble.glowColor}, inset 0 0 12px 2px ${bubble.glowColor}`,
                  }}
                />

                {/* The Bubble Button */}
                <button
                  type="button"
                  onClick={() => handleBubbleClick(bubble)}
                  disabled={isAnyPopped}
                  className={`relative z-10 w-full h-full rounded-full border-2 ${bubble.borderColor} bg-gradient-to-b from-slate-900/90 via-slate-950/95 to-slate-900/90 backdrop-blur-md p-1.5 flex flex-col items-center justify-center text-center shadow-xl active:scale-90 transition cursor-pointer group ${
                    isPopped ? 'bubble-pop-active pointer-events-none' : 'hover:scale-105'
                  }`}
                >
                  <span className="absolute top-1 left-2 w-4 h-2 rounded-full bg-white/35 blur-[0.5px] rotate-[-25deg] pointer-events-none"></span>

                  <span className={`${bubble.isHero ? 'text-2xl' : 'text-xl'} block group-hover:scale-115 transition duration-300`}>
                    {bubble.icon}
                  </span>

                  <span className={`text-[8.5px] font-black leading-tight mt-0.5 ${bubble.textColor} truncate max-w-[68px]`}>
                    {primaryText.split('&')[0].split('/')[0]}
                  </span>

                  <span className="text-[7px] font-bold text-slate-400 block truncate max-w-[68px]">
                    {secondaryText.split('&')[0].split('/')[0]}
                  </span>
                </button>

                {/* Pop Particle Splash */}
                {isPopped && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                    {[
                      { x: '-28px', y: '-28px' },
                      { x: '28px', y: '-28px' },
                      { x: '-36px', y: '16px' },
                      { x: '36px', y: '16px' },
                      { x: '0px', y: '-40px' },
                      { x: '0px', y: '40px' },
                    ].map((pos, idx) => (
                      <span
                        key={idx}
                        style={{
                          '--tx': pos.x,
                          '--ty': pos.y,
                          animation: 'particleBurstFly 0.4s cubic-bezier(0.1, 0.8, 0.2, 1) forwards',
                        }}
                        className={`absolute w-2 h-2 rounded-full bg-gradient-to-tr ${bubble.theme} shadow-md`}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}