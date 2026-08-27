import React, { useState } from 'react';
import { getCategoryById } from '../data/taxonomyRegistry';
import CategoryListFreeBanner from '../components/common/CategoryListFreeBanner';

const SEVA_CATEGORIES = [
  {
    categoryId: 'emergency-medical-seva',
    title: '1. Emergency Blood & Medical Seva (रक्तदान व चिकित्सा सेवा)',
    subtitle: '24x7 direct voluntary blood donors, free cataract/eye checkups & wheelchair assistance',
    badge: '24x7 EMERGENCY MEDICAL',
    color: 'border-red-500/40 text-red-300',
    subIds: ['emergency-blood-donors', 'free-medical-eye-camps', 'divyang-elderly-seva'],
  },
  {
    categoryId: 'gau-animal-welfare',
    title: '2. Gau Seva & Animal/Bird Rescue (गौ सेवा व मूक पशु-पक्षी रक्षा)',
    subtitle: 'Registered gaushala green fodder drives, emergency cow/dog rescue van & summer water parinde',
    badge: 'GAU & ANIMAL WELFARE',
    color: 'border-emerald-500/40 text-emerald-300',
    subIds: ['gau-seva-gaushalas', 'animal-rescue-birds'],
  },
  {
    categoryId: 'food-clothes-relief',
    title: '3. Food Relief, Roti Bank & Clothes (रोटी बैंक व वस्त्र दान)',
    subtitle: 'Daily hospital patient food seva, event/wedding surplus food pickup & winter blanket drives',
    badge: 'FOOD & CLOTHES RELIEF',
    color: 'border-amber-500/40 text-amber-300',
    subIds: ['roti-bank-food-seva', 'clothes-blanket-donation'],
  },
  {
    categoryId: 'education-environment-social',
    title: '4. Education, Environment & Social Aid (शिक्षा, पर्यावरण व कन्यादान)',
    subtitle: 'Slum children free evening classes, competitive book banks, tree plantation & mass marriage support',
    badge: 'EDUCATION & NATURE',
    color: 'border-cyan-500/40 text-cyan-300',
    subIds: ['free-books-slum-education', 'paryavaran-jal-piyau', 'samuhik-vivah-aid'],
  },
];

const EMERGENCY_SEVA_SOS = [
  { subId: 'emergency-blood-donors', label: '🩸 Urgent Blood Requirement', icon: '🩸', desc: 'Direct blood donors & bank network' },
  { subId: 'animal-rescue-birds', label: '🐕 Injured Cow / Animal Rescue', icon: '🚑', desc: 'Ambulance & volunteer rescue van' },
  { subId: 'roti-bank-food-seva', label: '🍲 Leftover Wedding Food Pickup', icon: '🍲', desc: 'Prevent wastage • Direct to needy' },
  { subId: 'divyang-elderly-seva', label: '🦽 Emergency Wheelchair / Oxygen', icon: '🦽', desc: 'Free medical equipment bank' },
];

export default function CommunityHub({
  selectedCity = 'Alwar',
  onSelectSubCategory,
  onSelectCommunityCategory,
  onPostClick,
  onBack,
}) {
  const categoryConfig = getCategoryById('community');
  const [activeCategory, setActiveCategory] = useState('all');

  const handleSelect = (subId, catName) => {
    if (typeof onSelectSubCategory === 'function') {
      onSelectSubCategory(subId);
    } else if (typeof onSelectCommunityCategory === 'function') {
      onSelectCommunityCategory(subId, catName);
    }
  };

  const visibleCategories = activeCategory === 'all'
    ? SEVA_CATEGORIES
    : SEVA_CATEGORIES.filter((c) => c.categoryId === activeCategory);

  return (
    <div className="p-3.5 space-y-4 animate-fade-in text-slate-100 pb-16">
      
      {/* 🌟 1. HERO HEADER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-950 via-slate-900 to-amber-950 p-4 border border-rose-500/40 shadow-2xl">
        <div className="absolute -top-12 -right-12 w-44 h-44 bg-rose-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>

        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-[10px] font-black uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping"></span>
              <span>100% Non-Profit Seva • {selectedCity}</span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white mt-1 flex items-center space-x-1.5">
              <span>🤝 Social Welfare & Seva</span>
            </h2>
            <p className="text-[11px] text-rose-200/80 font-medium">
              Blood Donors, Gau Seva, Animal Rescue, Roti Bank, Free Medical Camps & Education Support in {selectedCity}
            </p>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="text-xs bg-white/10 hover:bg-white/20 text-rose-100 px-3 py-1.5 rounded-xl font-bold backdrop-blur-md active:scale-95 transition cursor-pointer border border-white/10 shrink-0"
          >
            ← Town Hub
          </button>
        </div>

        {/* Quick Highlights Strip */}
        <div className="grid grid-cols-4 gap-2 mt-3 pt-2.5 border-t border-white/10 text-center">
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-rose-300">🩸 24x7 Blood</div>
            <div className="text-[8px] text-slate-400 font-semibold">Direct Donors</div>
          </div>
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-emerald-300">🐄 Gau Seva</div>
            <div className="text-[8px] text-slate-400 font-semibold">Gaushala Trusts</div>
          </div>
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-amber-300">🍲 Roti Bank</div>
            <div className="text-[8px] text-slate-400 font-semibold">Zero Food Waste</div>
          </div>
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-cyan-300">₹0 Free</div>
            <div className="text-[8px] text-slate-400 font-semibold">Pure Voluntary</div>
          </div>
        </div>
      </div>

      {/* 🌟 2. FAST EMERGENCY SEVA SOS STRIP */}
      <section className="bg-gradient-to-r from-rose-950/60 via-slate-900 to-amber-950/60 p-3.5 rounded-3xl border border-rose-500/40 shadow-lg space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-1.5">
            <span className="text-sm">🚨</span>
            <h3 className="text-xs font-black text-rose-300 uppercase tracking-wide">
              Emergency Helpline & Seva Calls (तत्काल सेवा सहायता)
            </h3>
          </div>
          <span className="text-[9px] font-bold text-amber-300">24x7 Helpline</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {EMERGENCY_SEVA_SOS.map((sos) => (
            <button
              key={sos.subId}
              type="button"
              onClick={() => handleSelect(sos.subId, sos.label)}
              className="p-2.5 bg-slate-950/80 hover:bg-slate-900 rounded-2xl text-left transition cursor-pointer border border-rose-500/30 hover:border-rose-400 flex items-center justify-between active:scale-95 shadow-sm"
            >
              <div className="space-y-0.5">
                <div className="text-[11px] font-black text-slate-100 leading-tight">
                  {sos.label}
                </div>
                <div className="text-[9px] text-slate-400 font-medium">{sos.desc}</div>
              </div>
              <span className="text-xs text-rose-400 font-black ml-1">➔</span>
            </button>
          ))}
        </div>
      </section>

      {/* 🌟 3. SEVA PILLS FILTER */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-black text-rose-400 uppercase tracking-wider">
            Explore Seva Departments
          </span>
          <span className="text-[10px] text-slate-400 font-semibold">
            {categoryConfig.subCategories.length} Categories
          </span>
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-black shrink-0 transition cursor-pointer ${
              activeCategory === 'all'
                ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 shadow-md scale-105'
                : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
            }`}
          >
            ⚡ All Seva Initiatives
          </button>

          {SEVA_CATEGORIES.map((cat) => (
            <button
              key={cat.categoryId}
              type="button"
              onClick={() => setActiveCategory(cat.categoryId)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-black shrink-0 transition cursor-pointer ${
                activeCategory === cat.categoryId
                  ? 'bg-rose-400 text-slate-950 shadow-md scale-105'
                  : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
              }`}
            >
              {cat.badge}
            </button>
          ))}
        </div>
      </div>

      {/* 🌟 4. CATEGORIZED SEVA SECTIONS */}
      <div className="space-y-4">
        {visibleCategories.map((cat) => (
          <section
            key={cat.categoryId}
            className="bg-slate-900/90 rounded-3xl p-3.5 border border-slate-800 shadow-md space-y-2.5"
          >
            <div className="px-1 border-b border-slate-800 pb-2 flex items-start justify-between">
              <div>
                <h3 className="text-xs font-black text-white">{cat.title}</h3>
                <p className="text-[10px] text-slate-400 font-medium">{cat.subtitle}</p>
              </div>
              <span className="text-[8px] font-black px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-400/30 shrink-0 ml-2">
                {cat.badge}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {cat.subIds.map((subId) => {
                const sub = categoryConfig.subCategories.find((s) => s.id === subId);
                if (!sub) return null;

                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => handleSelect(sub.id, sub.name)}
                    className="p-3 bg-slate-950/80 hover:bg-slate-850 rounded-2xl text-left transition cursor-pointer flex items-center justify-between border border-slate-800 hover:border-rose-500/50 shadow-sm group active:scale-[0.98]"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl p-2 bg-slate-900 rounded-xl border border-slate-800 group-hover:border-rose-500/40 shadow-inner shrink-0">
                        {sub.icon || '🤝'}
                      </span>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-black text-slate-100 group-hover:text-rose-300 transition-colors leading-tight">
                            {sub.name.split('(')[0]}
                          </span>
                        </div>
                        <div className="text-[9px] text-slate-400 font-medium mt-0.5 truncate">
                          {sub.name.match(/\((.*?)\)/)?.[1] || 'सेवा व विवरण'}
                        </div>
                      </div>
                    </div>

                    <span className="text-xs font-black text-rose-400 group-hover:translate-x-1 transition-transform shrink-0 ml-2">
                      ➔
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* 🌟 5. VIEW ALL BUTTON */}
      <button
        type="button"
        onClick={() => handleSelect('all', 'All Social Welfare Services')}
        className="w-full py-3.5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 hover:from-slate-850 hover:to-slate-800 text-rose-300 border border-rose-500/30 rounded-2xl text-center text-xs font-black active:scale-95 transition cursor-pointer shadow-md"
      >
        🌟 View All Community Seva Directory ({categoryConfig.subCategories.length} Categories)
      </button>

      {/* 🌟 6. INTERACTIVE LIST FREE WIDGET */}
      <CategoryListFreeBanner
        category="property"
        selectedCity={selectedCity}
        onPostClick={onPostClick}
      />
    </div>
  );
}