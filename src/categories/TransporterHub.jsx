import React from 'react';
import { getCategoryById } from '../data/taxonomyRegistry';
import CategoryListFreeBanner from '../components/common/CategoryListFreeBanner';

const QUICK_DISPATCH_NEEDS = [
  { subId: 'tata-ace-chota-hathi', label: '📦 Local Goods & Box Delivery', icon: '🚐', desc: 'Tata Ace in 15-25 mins' },
  { subId: 'packers-movers-shifting', label: '🏠 House & Office Shifting', icon: '📦', desc: 'Full truck + labor team' },
  { subId: 'bolero-maxi-pickup', label: '🌾 Mandi & Wholesale Bulk', icon: '🛻', desc: '1.5 Ton Bolero Pickup' },
  { subId: 'towing-crane-recovery', label: '🚨 Car / Bike Breakdown Towing', icon: '🚨', desc: '24x7 Hydraulic crane' },
];

export default function TransporterHub({
  selectedCity = 'Alwar',
  onSelectSubCategory,
  onSelectTransporterCategory,
  onPostClick,
  onBack,
}) {
  const categoryConfig = getCategoryById('transporters');

  const handleSelect = (subId, catName) => {
    if (typeof onSelectSubCategory === 'function') {
      onSelectSubCategory(subId);
    } else if (typeof onSelectTransporterCategory === 'function') {
      onSelectTransporterCategory(subId, catName);
    }
  };

  return (
    <div className="p-3.5 space-y-4 animate-fade-in text-slate-100 pb-16">
      
      {/* 🌟 1. DIRECT UTILITY HERO BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-950 via-slate-900 to-blue-950 p-4 border border-cyan-500/40 shadow-2xl">
        <div className="absolute -top-12 -right-12 w-44 h-44 bg-cyan-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>

        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-[10px] font-black uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
              <span>City Logistics & Freight • {selectedCity}</span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white mt-1 flex items-center space-x-1.5">
              <span>🚚 Transporters & Loading</span>
            </h2>
            <p className="text-[11px] text-cyan-200/80 font-medium">
              Chhota Hathi, Bolero Pickup, Packers & Movers, Tractors & Heavy Trucks with direct driver contact
            </p>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="text-xs bg-white/10 hover:bg-white/20 text-cyan-100 px-3 py-1.5 rounded-xl font-bold backdrop-blur-md active:scale-95 transition cursor-pointer border border-white/10 shrink-0"
          >
            ← Town Hub
          </button>
        </div>

        {/* Quick Highlights Strip */}
        <div className="grid grid-cols-4 gap-2 mt-3 pt-2.5 border-t border-white/10 text-center">
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-cyan-300">0% Cut</div>
            <div className="text-[8px] text-slate-400 font-semibold">Direct Driver</div>
          </div>
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-amber-300">⚡ 15-25 Min</div>
            <div className="text-[8px] text-slate-400 font-semibold">Fast Dispatch</div>
          </div>
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-emerald-300">Up to 10T</div>
            <div className="text-[8px] text-slate-400 font-semibold">Payload Variety</div>
          </div>
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-rose-300">🇮🇳 All India</div>
            <div className="text-[8px] text-slate-400 font-semibold">Local & Outstation</div>
          </div>
        </div>
      </div>

      {/* 🌟 2. FAST DISPATCH / COMMON NEEDS STRIP */}
      <section className="bg-gradient-to-r from-blue-950/60 via-slate-900 to-cyan-950/60 p-3.5 rounded-3xl border border-cyan-500/40 shadow-lg space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-1.5">
            <span className="text-sm">⚡</span>
            <h3 className="text-xs font-black text-cyan-300 uppercase tracking-wide">
              Instant Dispatch & Common Needs (तत्काल गाड़ी)
            </h3>
          </div>
          <span className="text-[9px] font-bold text-amber-300">15-25 Min Pickup</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {QUICK_DISPATCH_NEEDS.map((need) => (
            <button
              key={need.subId}
              type="button"
              onClick={() => handleSelect(need.subId, need.label)}
              className="p-2.5 bg-slate-950/80 hover:bg-slate-900 rounded-2xl text-left transition cursor-pointer border border-cyan-500/30 hover:border-cyan-400 flex items-center justify-between active:scale-95 shadow-sm"
            >
              <div className="space-y-0.5">
                <div className="text-[11px] font-black text-slate-100 leading-tight">
                  {need.label}
                </div>
                <div className="text-[9px] text-slate-400 font-medium">{need.desc}</div>
              </div>
              <span className="text-xs text-cyan-400 font-black ml-1">➔</span>
            </button>
          ))}
        </div>
      </section>

      {/* 🌟 3. MAIN VEHICLES & FLEET GRID */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black text-slate-100 uppercase tracking-wider flex items-center space-x-1.5">
            <span>🚚</span>
            <span>All Commercial Vehicles & Fleet</span>
          </h3>
          <span className="text-[10px] text-cyan-400 font-bold">
            {categoryConfig.subCategories.length} Categories
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => handleSelect('all', 'All Commercial Vehicles')}
            className="p-3.5 bg-slate-900 text-white rounded-2xl text-left font-black shadow-sm hover:scale-[1.01] active:scale-95 transition cursor-pointer flex items-center justify-between border border-slate-800"
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl p-2 bg-slate-950 rounded-xl border border-slate-800 shadow-inner">🌟</span>
              <div>
                <div className="text-xs font-black">All Transporters & Loading</div>
                <div className="text-[9px] text-slate-400 font-normal">View all drivers & vehicles in {selectedCity}</div>
              </div>
            </div>
            <span className="text-xs text-cyan-400">View All ➔</span>
          </button>

          {categoryConfig.subCategories.map((sub) => (
            <button
              key={sub.id}
              type="button"
              onClick={() => handleSelect(sub.id, sub.name)}
              className="p-3.5 bg-slate-900/90 hover:bg-slate-850 text-white rounded-2xl text-left font-bold shadow-sm hover:scale-[1.01] active:scale-95 transition cursor-pointer flex items-center justify-between border border-slate-800 hover:border-cyan-500/50"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl p-2 bg-slate-950 rounded-xl border border-slate-800 shadow-inner">
                  {sub.icon || '🚚'}
                </span>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-black text-slate-100">{sub.name.split('(')[0]}</span>
                    {sub.tag && (
                      <span className="text-[8px] font-black px-1.5 py-0.2 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                        {sub.tag}
                      </span>
                    )}
                  </div>
                  <div className="text-[9px] text-slate-400 font-semibold mt-0.5 truncate">
                    {sub.name.match(/\((.*?)\)/)?.[1] || 'वाहन'}
                  </div>
                </div>
              </div>

              <span className="text-xs font-black text-cyan-400 shrink-0 ml-2">➔</span>
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