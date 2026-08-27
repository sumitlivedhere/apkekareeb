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

// 18 Ambient Rising White Micro-Bubbles
const WHITE_RISING_BUBBLES = [
  { id: 1, left: '5%', size: 'w-2 h-2', duration: '4.2s', delay: '0s', sway: '12px' },
  { id: 2, left: '14%', size: 'w-3.5 h-3.5', duration: '5.6s', delay: '1.2s', sway: '-16px' },
  { id: 3, left: '22%', size: 'w-2 h-2', duration: '4.8s', delay: '0.4s', sway: '10px' },
  { id: 4, left: '32%', size: 'w-4 h-4', duration: '6.2s', delay: '2.1s', sway: '-18px' },
  { id: 5, left: '42%', size: 'w-2.5 h-2.5', duration: '4.5s', delay: '0.9s', sway: '14px' },
  { id: 6, left: '52%', size: 'w-3 h-3', duration: '5.2s', delay: '1.6s', sway: '-12px' },
  { id: 7, left: '62%', size: 'w-4 h-4', duration: '6.0s', delay: '0.2s', sway: '16px' },
  { id: 8, left: '72%', size: 'w-2 h-2', duration: '4.1s', delay: '1.8s', sway: '-10px' },
  { id: 9, left: '82%', size: 'w-3.5 h-3.5', duration: '5.4s', delay: '1.1s', sway: '14px' },
  { id: 10, left: '92%', size: 'w-2 h-2', duration: '4.9s', delay: '2.5s', sway: '-14px' },
  { id: 11, left: '18%', size: 'w-2.5 h-2.5', duration: '5.0s', delay: '3.2s', sway: '15px' },
  { id: 12, left: '28%', size: 'w-3 h-3', duration: '6.5s', delay: '2.7s', sway: '-12px' },
  { id: 13, left: '48%', size: 'w-1.5 h-1.5', duration: '3.8s', delay: '3.0s', sway: '8px' },
  { id: 14, left: '68%', size: 'w-2 h-2', duration: '4.6s', delay: '3.5s', sway: '-15px' },
  { id: 15, left: '78%', size: 'w-3 h-3', duration: '5.8s', delay: '0.7s', sway: '12px' },
  { id: 16, left: '88%', size: 'w-2 h-2', duration: '4.4s', delay: '2.9s', sway: '-8px' },
  { id: 17, left: '10%', size: 'w-3 h-3', duration: '5.7s', delay: '1.9s', sway: '10px' },
  { id: 18, left: '96%', size: 'w-2.5 h-2.5', duration: '6.1s', delay: '0.5s', sway: '-16px' },
];

// 17 Town Categories + 1 Hero Wildcard (18 Bubbles Total)
const ALL_TOWN_BUBBLES = [
  {
    id: 'all',
    name: 'Kismat / All Mix',
    hindiName: 'सब कुछ मिक्स',
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
    hindiName: 'खान-पान',
    icon: '🍔',
    theme: 'from-amber-400 via-orange-500 to-red-500',
    glowColor: 'rgba(245, 158, 11, 0.55)',
    borderColor: 'border-amber-400',
    textColor: 'text-amber-300',
    delay: '0.2s',
  },
  {
    id: 'kaarigar',
    name: 'Kaarigar & Mistri',
    hindiName: 'कारीगर व मरम्मत',
    icon: '🛠️',
    theme: 'from-cyan-400 via-blue-500 to-indigo-600',
    glowColor: 'rgba(6, 182, 212, 0.55)',
    borderColor: 'border-cyan-400',
    textColor: 'text-cyan-300',
    delay: '0.4s',
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
    delay: '0.6s',
  },
  {
    id: 'property',
    name: 'Makaan & Plots',
    hindiName: 'मकान व जमीन',
    icon: '🏠',
    theme: 'from-emerald-400 via-teal-500 to-green-600',
    glowColor: 'rgba(16, 185, 129, 0.55)',
    borderColor: 'border-emerald-400',
    textColor: 'text-emerald-300',
    delay: '0.8s',
  },
  {
    id: 'market',
    name: 'Bazaar & Kirana',
    hindiName: 'बाजार व किराना',
    icon: '🛍️',
    theme: 'from-yellow-300 via-amber-500 to-orange-600',
    glowColor: 'rgba(234, 179, 8, 0.55)',
    borderColor: 'border-yellow-400',
    textColor: 'text-yellow-300',
    delay: '1.0s',
  },
  {
    id: 'medical',
    name: 'Doctor & Medical',
    hindiName: 'डॉक्टर व क्लिनिक',
    icon: '🩺',
    theme: 'from-red-400 via-rose-500 to-pink-600',
    glowColor: 'rgba(239, 68, 68, 0.55)',
    borderColor: 'border-red-400',
    textColor: 'text-red-300',
    delay: '1.2s',
  },
  {
    id: 'transporters',
    name: 'Transporters',
    hindiName: 'ट्रांसपोर्ट व गाड़ियां',
    icon: '🚚',
    theme: 'from-blue-400 via-indigo-500 to-cyan-600',
    glowColor: 'rgba(59, 130, 246, 0.55)',
    borderColor: 'border-blue-400',
    textColor: 'text-blue-300',
    delay: '1.4s',
  },
  {
    id: 'construction',
    name: 'Construction',
    hindiName: 'मकान निर्माण',
    icon: '🏗️',
    theme: 'from-orange-400 via-amber-600 to-yellow-600',
    glowColor: 'rgba(249, 115, 22, 0.55)',
    borderColor: 'border-orange-400',
    textColor: 'text-orange-300',
    delay: '0.3s',
  },
  {
    id: 'education',
    name: 'Education',
    hindiName: 'कोचिंग व स्कूल',
    icon: '📚',
    theme: 'from-indigo-400 via-purple-500 to-pink-500',
    glowColor: 'rgba(99, 102, 241, 0.55)',
    borderColor: 'border-indigo-400',
    textColor: 'text-indigo-300',
    delay: '0.5s',
  },
  {
    id: 'recommerce',
    name: 'Purana Samaan',
    hindiName: 'पुराना सामान',
    icon: '📦',
    theme: 'from-teal-400 via-emerald-500 to-green-600',
    glowColor: 'rgba(20, 184, 166, 0.55)',
    borderColor: 'border-teal-400',
    textColor: 'text-teal-300',
    delay: '0.7s',
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
    delay: '0.9s',
  },
  {
    id: 'malls',
    name: 'Malls & Stores',
    hindiName: 'शॉपिंग मॉल',
    icon: '🏢',
    theme: 'from-purple-400 via-pink-500 to-rose-500',
    glowColor: 'rgba(168, 85, 247, 0.55)',
    borderColor: 'border-purple-400',
    textColor: 'text-purple-300',
    delay: '1.1s',
  },
  {
    id: 'creators',
    name: 'Creators',
    hindiName: 'फोटो व वीडियो',
    icon: '📸',
    theme: 'from-pink-400 via-fuchsia-500 to-purple-600',
    glowColor: 'rgba(236, 72, 153, 0.55)',
    borderColor: 'border-pink-400',
    textColor: 'text-pink-300',
    delay: '1.3s',
  },
  {
    id: 'white-collar',
    name: 'Consultants',
    hindiName: 'वकील व CA',
    icon: '💼',
    theme: 'from-slate-400 via-blue-500 to-indigo-600',
    glowColor: 'rgba(148, 163, 184, 0.55)',
    borderColor: 'border-blue-400',
    textColor: 'text-blue-300',
    delay: '0.4s',
  },
  {
    id: 'advertising',
    name: 'Prachar',
    hindiName: 'प्रचार व बैनर',
    icon: '📢',
    theme: 'from-yellow-400 via-amber-500 to-red-500',
    glowColor: 'rgba(234, 179, 8, 0.55)',
    borderColor: 'border-yellow-400',
    textColor: 'text-yellow-300',
    delay: '0.6s',
  },
  {
    id: 'festival',
    name: 'Festival Offers',
    hindiName: 'त्योहार ऑफर',
    icon: '🪔',
    theme: 'from-amber-400 via-orange-500 to-rose-500',
    glowColor: 'rgba(245, 158, 11, 0.55)',
    borderColor: 'border-amber-400',
    textColor: 'text-amber-300',
    delay: '0.8s',
  },
  {
    id: 'community',
    name: 'Community',
    hindiName: 'शहर सेवा',
    icon: '🤝',
    theme: 'from-cyan-400 via-teal-500 to-emerald-500',
    glowColor: 'rgba(6, 182, 212, 0.55)',
    borderColor: 'border-cyan-400',
    textColor: 'text-cyan-300',
    delay: '1.0s',
  },
];

export default function BubblesDiscovery({ onSelectCategory, onBack, selectedCity = 'Alwar' }) {
  const [poppedBubbleId, setPoppedBubbleId] = useState(null);
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

    setTimeout(() => {
      onSelectCategory(bubble.id, bubble.name);
    }, 420);
  };

  return (
    <div className="relative w-full flex-1 flex flex-col justify-center items-center p-3 select-none text-slate-100 overflow-hidden min-h-[calc(100vh-100px)]">
      
      {/* 🌟 Rising Background White Micro-Bubbles & Liquid Wobble Keyframes */}
      <style>{`
        @keyframes riseFloatUp {
          0% {
            transform: translateY(105vh) translateX(0px) scale(0.6);
            opacity: 0;
          }
          15% {
            opacity: 0.8;
          }
          50% {
            transform: translateY(50vh) translateX(var(--sway, 12px)) scale(1.1);
            opacity: 0.9;
          }
          85% {
            opacity: 0.75;
          }
          95% {
            transform: translateY(4vh) translateX(0px) scale(1.35);
            opacity: 0.9;
            filter: blur(0px);
          }
          100% {
            transform: translateY(-5vh) translateX(0px) scale(2);
            opacity: 0;
            filter: blur(4px);
          }
        }
        @keyframes liquidBobbing {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(1.5deg); }
        }
        @keyframes shimmerGaze {
          0%, 100% { opacity: 0.45; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.04); }
        }
        @keyframes bubbleBurstPop {
          0% { transform: scale(1); opacity: 1; }
          45% { transform: scale(1.4); opacity: 0.9; filter: brightness(2); }
          100% { transform: scale(2.2); opacity: 0; filter: blur(8px); }
        }
        @keyframes particleBurstFly {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
        }
        .white-rising-bubble-particle {
          animation: riseFloatUp var(--dur, 5s) ease-in-out infinite;
        }
        .liquid-bubble-float {
          animation: liquidBobbing 4.5s ease-in-out infinite;
        }
        .bubble-glow-halo {
          animation: shimmerGaze 3s ease-in-out infinite;
        }
        .bubble-pop-active {
          animation: bubbleBurstPop 0.42s ease-out forwards;
        }
      `}</style>

      {/* 🌟 1. BACKGROUND RISING TRANSLUCENT WHITE MICRO-BUBBLES */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {WHITE_RISING_BUBBLES.map((b) => (
          <div
            key={b.id}
            style={{
              left: b.left,
              bottom: '-30px',
              '--dur': b.duration,
              '--sway': b.sway,
              animationDelay: b.delay,
            }}
            className={`absolute ${b.size} rounded-full bg-white/60 border border-white/90 shadow-[0_0_12px_rgba(255,255,255,0.9)] backdrop-blur-[0.5px] white-rising-bubble-particle`}
          >
            <span className="absolute top-0.5 left-0.5 w-1 h-0.5 rounded-full bg-white opacity-90 rotate-[-30deg]"></span>
          </div>
        ))}
      </div>

      {/* 🌟 2. FLOATING CATEGORY BUBBLES CANVAS */}
      <div className="relative z-10 w-full flex-1 my-auto py-4 overflow-y-auto max-h-[calc(100vh-140px)] scrollbar-none px-1 flex flex-col justify-center">
        <div className="grid grid-cols-3 gap-3.5 max-w-sm mx-auto place-items-center">
          {ALL_TOWN_BUBBLES.map((bubble) => {
            const isPopped = poppedBubbleId === bubble.id;
            const isAnyPopped = Boolean(poppedBubbleId);

            return (
              <div
                key={bubble.id}
                style={{ animationDelay: bubble.delay }}
                className={`relative w-24 h-24 liquid-bubble-float flex items-center justify-center transition-all duration-300 ${
                  bubble.isHero ? 'scale-105 col-span-3 w-32 h-32 my-1' : ''
                } ${isAnyPopped && !isPopped ? 'opacity-15 scale-75 blur-[1px]' : 'opacity-100'}`}
              >
                {/* Glowing Halos */}
                <div
                  className={`absolute inset-0 rounded-full bubble-glow-halo pointer-events-none ${isPopped ? 'hidden' : ''}`}
                  style={{
                    boxShadow: `0 0 25px 4px ${bubble.glowColor}, inset 0 0 16px 2px ${bubble.glowColor}`,
                  }}
                />

                {/* The Bubble Button */}
                <button
                  type="button"
                  onClick={() => handleBubbleClick(bubble)}
                  disabled={isAnyPopped}
                  className={`relative z-10 w-full h-full rounded-full border-2 ${bubble.borderColor} bg-gradient-to-b from-slate-900/85 via-slate-950/90 to-slate-900/85 backdrop-blur-md p-2 flex flex-col items-center justify-center text-center shadow-2xl active:scale-90 transition cursor-pointer group ${
                    isPopped ? 'bubble-pop-active pointer-events-none' : 'hover:scale-105'
                  }`}
                >
                  <span className="absolute top-1.5 left-2.5 w-5 h-2.5 rounded-full bg-white/30 blur-[0.5px] rotate-[-25deg] pointer-events-none"></span>

                  <span className={`${bubble.isHero ? 'text-3xl' : 'text-2xl'} block group-hover:scale-125 transition duration-300`}>
                    {bubble.icon}
                  </span>

                  <span className={`text-[9px] font-black leading-tight mt-0.5 ${bubble.textColor} truncate max-w-[78px]`}>
                    {bubble.name.split('&')[0]}
                  </span>

                  <span className="text-[7.5px] font-bold text-slate-400 block truncate max-w-[78px]">
                    {bubble.hindiName}
                  </span>
                </button>

                {/* Pop Particle Splash */}
                {isPopped && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                    {[
                      { x: '-35px', y: '-35px' },
                      { x: '35px', y: '-35px' },
                      { x: '-45px', y: '20px' },
                      { x: '45px', y: '20px' },
                      { x: '0px', y: '-50px' },
                      { x: '0px', y: '50px' },
                    ].map((pos, idx) => (
                      <span
                        key={idx}
                        style={{
                          '--tx': pos.x,
                          '--ty': pos.y,
                          animation: 'particleBurstFly 0.4s cubic-bezier(0.1, 0.8, 0.2, 1) forwards',
                        }}
                        className={`absolute w-2.5 h-2.5 rounded-full bg-gradient-to-tr ${bubble.theme} shadow-lg`}
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