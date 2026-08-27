import React from 'react';
import { getCategoryById } from '../data/taxonomyRegistry';
import CategoryListFreeBanner from '../components/common/CategoryListFreeBanner';

const EMERGENCY_SERVICES = [
  { subId: 'plumbers-water-motor', label: '💧 Water Pipe Leak / Motor Jam', desc: 'Plumber in 20-30 mins' },
  { subId: 'electricians-inverter', label: '⚡ MCB Trip / Short Circuit', desc: 'Electrician on call' },
  { subId: 'locksmith-key-maker', label: '🔑 Locked Out / Broken Key', desc: 'Doorstep key maker' },
  { subId: 'mechanic-puncture', label: '🛞 Flat Tyre / Breakdown', desc: 'Mobile puncture & mechanic' },
];

export default function KaarigarHub({
  selectedCity = 'Alwar',
  onSelectSubCategory,
  onSelectKaarigarCategory,
  onPostClick,
  onBack,
}) {
  const categoryConfig = getCategoryById('kaarigar') || {};
  const subCategories = Array.isArray(categoryConfig.subCategories) ? categoryConfig.subCategories : [];

  const handleSelect = (subId, catName) => {
    if (typeof onSelectSubCategory === 'function') {
      onSelectSubCategory(subId, catName);
    } else if (typeof onSelectKaarigarCategory === 'function') {
      onSelectKaarigarCategory(subId, catName);
    }
  };

  return (
    <div className="p-3.5 space-y-4 animate-fade-in text-slate-100 pb-20">
      {/* 🌟 1. Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-950 via-slate-900 to-cyan-950 p-4 border border-blue-500/40 shadow-2xl">
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[10px] font-black uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
              <span>City Skilled Trades • {selectedCity}</span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white mt-1">
              🛠️ Kaarigar & Mistri Directory
            </h2>
            <p className="text-[11px] text-blue-200/80 font-medium">
              Verified local technicians, daily wage mistris & doorstep repair with direct contact
            </p>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="text-xs bg-white/10 hover:bg-white/20 text-blue-100 px-3 py-1.5 rounded-xl font-bold backdrop-blur-md active:scale-95 transition cursor-pointer border border-white/10 shrink-0"
          >
            ← Town Hub
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2 mt-3 pt-2.5 border-t border-white/10 text-center">
          <div className="bg-white/5 rounded-xl py-1">
            <div className="text-xs font-black text-cyan-300">0% Cut</div>
            <div className="text-[8px] text-slate-400 font-semibold">Direct Payment</div>
          </div>
          <div className="bg-white/5 rounded-xl py-1">
            <div className="text-xs font-black text-amber-300">⚡ 20-30 Min</div>
            <div className="text-[8px] text-slate-400 font-semibold">Fast Response</div>
          </div>
          <div className="bg-white/5 rounded-xl py-1">
            <div className="text-xs font-black text-emerald-300">₹150 Starting</div>
            <div className="text-[8px] text-slate-400 font-semibold">Visiting Fee</div>
          </div>
          <div className="bg-white/5 rounded-xl py-1">
            <div className="text-xs font-black text-rose-300">🧰 Own Tools</div>
            <div className="text-[8px] text-slate-400 font-semibold">Equipped Pros</div>
          </div>
        </div>
      </div>

      {/* 🌟 2. Emergency SOS Bar */}
      <section className="bg-gradient-to-r from-red-950/60 via-slate-900 to-amber-950/60 p-3.5 rounded-3xl border border-red-500/40 shadow-lg space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-1.5">
            <span className="text-sm">🚨</span>
            <h3 className="text-xs font-black text-red-300 uppercase tracking-wide">
              Emergency Doorstep Fix (तत्काल सहायता)
            </h3>
          </div>
          <span className="text-[9px] font-bold text-amber-300">20-30 Min Arrival</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {EMERGENCY_SERVICES.map((sos) => (
            <button
              key={sos.subId}
              type="button"
              onClick={() => handleSelect(sos.subId, sos.label)}
              className="p-2.5 bg-slate-950/80 hover:bg-slate-900 rounded-2xl text-left transition cursor-pointer border border-red-500/30 hover:border-red-400 flex items-center justify-between active:scale-95 shadow-sm"
            >
              <div className="space-y-0.5">
                <div className="text-[11px] font-black text-slate-100 leading-tight">
                  {sos.label}
                </div>
                <div className="text-[9px] text-slate-400 font-medium">{sos.desc}</div>
              </div>
              <span className="text-xs text-red-400 font-black ml-1">➔</span>
            </button>
          ))}
        </div>
      </section>

      {/* 🌟 3. Subcategories Grid */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black text-slate-100 uppercase tracking-wider flex items-center space-x-1.5">
            <span>🛠️</span>
            <span>All Skilled Trades & Services</span>
          </h3>
          <span className="text-[10px] text-blue-400 font-bold">
            {subCategories.length} Categories
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => handleSelect('all', 'All Kaarigars')}
            className="p-3.5 bg-slate-900 text-white rounded-2xl text-left font-black shadow-sm hover:scale-[1.01] active:scale-95 transition cursor-pointer flex items-center justify-between border border-slate-800"
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl p-2 bg-slate-950 rounded-xl border border-slate-800 shadow-inner">🌟</span>
              <div>
                <div className="text-xs font-black">All Kaarigars & Mistris</div>
                <div className="text-[9px] text-slate-400 font-normal">View all verified workers in {selectedCity}</div>
              </div>
            </div>
            <span className="text-xs text-blue-400">View All ➔</span>
          </button>

          {subCategories.map((sub) => {
            const rawName = String(sub.name || '');
            const title = rawName.includes('(') ? rawName.split('(')[0].trim() : rawName;
            const subtitle = rawName.match(/\((.*?)\)/)?.[1] || 'कारीगर';

            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => handleSelect(sub.id, sub.name)}
                className="p-3.5 bg-slate-900/90 hover:bg-slate-850 text-white rounded-2xl text-left font-bold shadow-sm hover:scale-[1.01] active:scale-95 transition cursor-pointer flex items-center justify-between border border-slate-800 hover:border-blue-500/50"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl p-2 bg-slate-950 rounded-xl border border-slate-800 shadow-inner">
                    {sub.icon || '🛠️'}
                  </span>
                  <div>
                    <div className="text-xs font-black">{title}</div>
                    <div className="text-[9px] text-slate-400 font-normal">{subtitle}</div>
                  </div>
                </div>
                <span className="text-xs font-black text-blue-400 shrink-0 ml-2">➔</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 🌟 4. Interactive List Free Widget */}
      <CategoryListFreeBanner
        category="kaarigar"
        selectedCity={selectedCity}
        onPostClick={onPostClick}
      />
    </div>
  );
}