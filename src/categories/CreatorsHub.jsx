import React from 'react';
import { getCategoryById } from '../data/taxonomyRegistry';
import CategoryListFreeBanner from '../components/common/CategoryListFreeBanner';
const CREATOR_POPULAR_TASKS = [
  { subId: 'reels-video-editors', label: '✂️ Instagram Reels & Short-Form Editors', desc: 'Viral hooks, captions, sound design & 24hr delivery' },
  { subId: 'cameramen-drone-pilots', label: '🎥 4K Cine Shoots & Drone Pilots', desc: 'Pre-weddings, showroom tours & brand reels' },
  { subId: 'graphic-designers-branding', label: '🎨 YouTube Thumbnails & Brand Logos', desc: 'High CTR thumbnails & flex banner vector files' },
  { subId: 'podcast-creator-studios', label: '🎙️ Chroma & Podcast Studio Rental', desc: 'Shure mics, 4K multi-cam & acoustic isolation' },
];

export default function CreatorsHub({
  selectedCity = 'Alwar',
  onSelectSubCategory,
  onSelectCreatorsCategory,
  onPostClick,
  onBack,
}) {
  const categoryConfig = getCategoryById('creators');

  const handleSelect = (subId, catName) => {
    if (typeof onSelectSubCategory === 'function') {
      onSelectSubCategory(subId);
    } else if (typeof onSelectCreatorsCategory === 'function') {
      onSelectCreatorsCategory(subId, catName);
    }
  };

  return (
    <div className="p-3.5 space-y-4 animate-fade-in text-slate-100 pb-16">
      
      {/* 🌟 HERO BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-950 via-slate-900 to-fuchsia-950 p-4 border border-violet-500/40 shadow-2xl">
        <div className="absolute -top-12 -right-12 w-44 h-44 bg-fuchsia-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>

        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-violet-500/20 border border-violet-400/30 text-violet-300 text-[10px] font-black uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-ping"></span>
              <span>Creator Economy & Media • {selectedCity}</span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white mt-1 flex items-center space-x-1.5">
              <span>🎬 Digital Creators & Freelancers</span>
            </h2>
            <p className="text-[11px] text-violet-200/80 font-medium">
              Hire local Reels editors, drone pilots, thumbnail designers, studio spaces & ad copywriters
            </p>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="text-xs bg-white/10 hover:bg-white/20 text-violet-100 px-3 py-1.5 rounded-xl font-bold backdrop-blur-md active:scale-95 transition cursor-pointer border border-white/10 shrink-0"
          >
            ← Town Hub
          </button>
        </div>

        {/* Quick Highlights Strip */}
        <div className="grid grid-cols-4 gap-2 mt-3 pt-2.5 border-t border-white/10 text-center">
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-fuchsia-300">⚡ 24hr</div>
            <div className="text-[8px] text-slate-400 font-semibold">Reels Turnaround</div>
          </div>
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-violet-300">🎥 4K / 60FPS</div>
            <div className="text-[8px] text-slate-400 font-semibold">Cine Production</div>
          </div>
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-cyan-300">🎙️ Studios</div>
            <div className="text-[8px] text-slate-400 font-semibold">Acoustic Pods</div>
          </div>
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-amber-300">0% Cut</div>
            <div className="text-[8px] text-slate-400 font-semibold">Direct Freelancers</div>
          </div>
        </div>
      </div>

      {/* 🌟 POPULAR GIG SHORTCUTS */}
      <section className="bg-gradient-to-r from-violet-950/60 via-slate-900 to-fuchsia-950/60 p-3.5 rounded-3xl border border-violet-500/40 shadow-lg space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-1.5">
            <span className="text-sm">🔥</span>
            <h3 className="text-xs font-black text-violet-300 uppercase tracking-wide">
              Popular Creator Gigs (पॉपुलर डिजिटल सर्विसेज)
            </h3>
          </div>
          <span className="text-[9px] font-bold text-amber-300">Direct Portfolios</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {CREATOR_POPULAR_TASKS.map((task) => (
            <button
              key={task.subId}
              type="button"
              onClick={() => handleSelect(task.subId, task.label)}
              className="p-2.5 bg-slate-950/80 hover:bg-slate-900 rounded-2xl text-left transition cursor-pointer border border-violet-500/30 hover:border-violet-400 flex items-center justify-between active:scale-95 shadow-sm"
            >
              <div className="space-y-0.5">
                <div className="text-[11px] font-black text-slate-100 leading-tight">
                  {task.label}
                </div>
                <div className="text-[9px] text-slate-400 font-medium">{task.desc}</div>
              </div>
              <span className="text-xs text-violet-400 font-black ml-1">➔</span>
            </button>
          ))}
        </div>
      </section>

      {/* 🌟 ALL SUB-CATEGORIES GRID */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black text-slate-100 uppercase tracking-wider flex items-center space-x-1.5">
            <span>✨</span>
            <span>All Creative Disciplines & Freelance Trades</span>
          </h3>
          <span className="text-[10px] text-violet-400 font-bold">
            {categoryConfig.subCategories.length} Categories
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => handleSelect('all', 'All Digital Creators')}
            className="p-3.5 bg-slate-900 text-white rounded-2xl text-left font-black shadow-sm hover:scale-[1.01] active:scale-95 transition cursor-pointer flex items-center justify-between border border-slate-800"
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl p-2 bg-slate-950 rounded-xl border border-slate-800 shadow-inner">🌟</span>
              <div>
                <div className="text-xs font-black">All Creators & Freelancers</div>
                <div className="text-[9px] text-slate-400 font-normal">View all editors, photographers & agencies in {selectedCity}</div>
              </div>
            </div>
            <span className="text-xs text-violet-400">View All ➔</span>
          </button>

          {categoryConfig.subCategories.map((sub) => (
            <button
              key={sub.id}
              type="button"
              onClick={() => handleSelect(sub.id, sub.name)}
              className="p-3.5 bg-slate-900/90 hover:bg-slate-850 text-white rounded-2xl text-left font-bold shadow-sm hover:scale-[1.01] active:scale-95 transition cursor-pointer flex items-center justify-between border border-slate-800 hover:border-violet-500/50"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl p-2 bg-slate-950 rounded-xl border border-slate-800 shadow-inner">
                  {sub.icon || '🎬'}
                </span>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-black text-slate-100">{sub.name.split('(')[0]}</span>
                    {sub.tag && (
                      <span className="text-[8px] font-black px-1.5 py-0.2 rounded-md bg-violet-500/20 text-fuchsia-300 border border-violet-400/30">
                        {sub.tag}
                      </span>
                    )}
                  </div>
                  <div className="text-[9px] text-slate-400 font-semibold mt-0.5 truncate">
                    {sub.name.match(/\((.*?)\)/)?.[1] || 'डिजिटल सेवा'}
                  </div>
                </div>
              </div>

              <span className="text-xs font-black text-violet-400 shrink-0 ml-2">➔</span>
            </button>
          ))}
        </div>
      </section>

      {/* 🌟 5. INTERACTIVE LIST FREE WIDGET */}
      <CategoryListFreeBanner
        category="property"
        selectedCity={selectedCity}
        onPostClick={onPostClick}
      />
    </div>
  );
}