import React, { useState, useMemo } from 'react';
import { getCategoryById } from '../data/taxonomyRegistry';
import { useStoreSlice } from '../store/hyperlocalStore';
import ActionButtons from '../components/common/ActionButtons';
import CategoryListFreeBanner from '../components/common/CategoryListFreeBanner';

const VIBE_FILTERS = [
  { id: 'all', label: 'All Showrooms' },
  { id: 'aesthetic-streetwear', label: '🧥 Streetwear & Drip' },
  { id: 'sneaker-kicks-lounges', label: '👟 Sneaker Lounges' },
  { id: 'designer-ethnic-couture', label: '🥻 Royal Couture' },
  { id: 'apple-experiential-tech', label: '📱 Flagship Tech' },
  { id: 'diamond-fine-jewels', label: '💎 Diamond Studios' },
  { id: 'luxury-perfume-grooming', label: '✨ Perfume & Lounge' },
  { id: 'smart-living-lighting', label: '🛋️ Smart Living Decor' },
  { id: 'watch-eyewear-studios', label: '🕶️ Watches & Eyewear' },
];

const PERK_FILTERS = [
  { id: 'all', label: 'All Store Amenities' },
  { id: 'vip-trial', label: '🛋️ VIP Trial Lounge & Styling' },
  { id: 'central-ac-valet', label: '❄️ Central AC & Valet Parking' },
  { id: 'interactive-tryon', label: '📱 Interactive 3D Try-On' },
  { id: 'espresso-bar', label: '☕ Complimentary Espresso Bar' },
];

const OCCASION_FILTERS = [
  { id: 'all', label: 'All Shopping Goals' },
  { id: 'weekend-drip', label: '🔥 Weekend Drip & Party Fit' },
  { id: 'luxury-gifting', label: '🎁 Premium Luxury Gifting' },
  { id: 'wedding-trousseau', label: '👑 Wedding & Festive Trousseau' },
  { id: 'experiential-tech', label: '⚡ Next-Gen Tech Upgrade' },
];

export default function MallsHub({
  selectedCity = 'Alwar',
  onSelectSubCategory,
  onSelectMallsCategory,
  onPostClick,
  onBack,
}) {
  const categoryConfig = getCategoryById('malls');
  const storeListings = useStoreSlice('mallsStores');

  // Filter States
  const [selectedVibe, setSelectedVibe] = useState('all');
  const [selectedPerk, setSelectedPerk] = useState('all');
  const [selectedOccasion, setSelectedOccasion] = useState('all');

  // Surprise State
  const [surpriseStore, setSurpriseStore] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [matchCount, setMatchCount] = useState(0);

  const handleSelect = (subId, catName) => {
    if (typeof onSelectSubCategory === 'function') {
      onSelectSubCategory(subId);
    } else if (typeof onSelectMallsCategory === 'function') {
      onSelectMallsCategory(subId, catName);
    }
  };

  // Matched Showrooms Pool
  const matchedStores = useMemo(() => {
    return (storeListings || []).filter((item) => {
      const sub = (item.subCategory || '').toLowerCase();
      const perk = (item.perkType || '').toLowerCase();
      const occ = (item.occasionType || '').toLowerCase();

      const matchesVibe = selectedVibe === 'all' || sub === selectedVibe;
      const matchesPerk = selectedPerk === 'all' || perk === selectedPerk;
      const matchesOcc = selectedOccasion === 'all' || occ === selectedOccasion;

      return matchesVibe && matchesPerk && matchesOcc;
    });
  }, [storeListings, selectedVibe, selectedPerk, selectedOccasion]);

  // Roll Surprise Showroom
  const handleRollSurprise = () => {
    setIsSpinning(true);
    setSurpriseStore(null);

    setTimeout(() => {
      const pool = matchedStores.length > 0 ? matchedStores : storeListings;
      if (pool && pool.length > 0) {
        const randomIndex = Math.floor(Math.random() * pool.length);
        setSurpriseStore(pool[randomIndex]);
        setMatchCount(pool.length);
      }
      setIsSpinning(false);
    }, 450);
  };

  return (
    <div className="p-3.5 space-y-4 animate-fade-in text-slate-100 pb-12">
      
      {/* 🌟 1. NEON-OBSIDIAN GLAMOUR HERO BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-950 via-slate-950 to-pink-950 p-4 border border-purple-500/40 shadow-2xl">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-pink-500 rounded-full blur-3xl opacity-25 pointer-events-none"></div>
        <div className="absolute bottom-0 left-10 w-32 h-32 bg-purple-600 rounded-full blur-2xl opacity-20 pointer-events-none"></div>

        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-pink-300 text-[10px] font-black uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-ping"></span>
              <span>Aspirational Shopping Hub • {selectedCity}</span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white mt-1 flex items-center space-x-1.5">
              <span>💎 Flagship Showrooms</span>
            </h2>
            <p className="text-[11px] text-pink-200/80 font-medium">
              Glass-front concept boutiques, sneaker lounges, Apple stores & luxury diamond studios
            </p>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="text-xs bg-white/10 hover:bg-white/20 text-pink-100 px-3 py-1.5 rounded-xl font-bold backdrop-blur-md active:scale-95 transition cursor-pointer border border-white/10 shrink-0"
          >
            ← Town Hub
          </button>
        </div>

        {/* Quick Highlights Strip */}
        <div className="grid grid-cols-4 gap-2 mt-3 pt-2.5 border-t border-white/10 text-center">
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-pink-300">📸 Aesthetic</div>
            <div className="text-[8px] text-slate-400 font-semibold">Insta Vibes</div>
          </div>
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-purple-300">❄️ Central AC</div>
            <div className="text-[8px] text-slate-400 font-semibold">Valet Parking</div>
          </div>
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-amber-300">🛋️ VIP Lounges</div>
            <div className="text-[8px] text-slate-400 font-semibold">Try-On Suites</div>
          </div>
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-cyan-300">⚡ 100% Brand</div>
            <div className="text-[8px] text-slate-400 font-semibold">Official Bill</div>
          </div>
        </div>
      </div>

      {/* 🌟 2. INTERACTIVE "SURPRISE ME • GLAMOUR SPOT MATCHER" */}
      <section className="bg-gradient-to-b from-slate-900 via-slate-900 to-purple-950/40 p-4 rounded-3xl border border-pink-500/30 shadow-xl space-y-3.5 relative overflow-hidden">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl">✨</span>
            <div>
              <h3 className="text-xs font-black text-pink-300 uppercase tracking-wider">
                Surprise Me • Glamour Spot Matcher
              </h3>
              <p className="text-[10px] text-slate-400">
                Pick your vibe & let the engine pick the trendiest showroom in town
              </p>
            </div>
          </div>

          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-purple-500/20 text-pink-300 border border-purple-400/30">
            {matchedStores.length} Showrooms Live
          </span>
        </div>

        {/* Filter 1: Store Vibe */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            1. Showroom Concept & Vibe
          </label>
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
            {VIBE_FILTERS.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedVibe(v.id)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold shrink-0 transition cursor-pointer ${
                  selectedVibe === v.id
                    ? 'bg-pink-500 text-white font-black shadow-sm scale-105'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter 2: Experience Perks */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            2. In-Store Amenities & Perks
          </label>
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
            {PERK_FILTERS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPerk(p.id)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold shrink-0 transition cursor-pointer ${
                  selectedPerk === p.id
                    ? 'bg-purple-600 text-white font-black shadow-sm scale-105'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter 3: Shopping Occasion */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            3. Shopping Occasion
          </label>
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
            {OCCASION_FILTERS.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setSelectedOccasion(o.id)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold shrink-0 transition cursor-pointer ${
                  selectedOccasion === o.id
                    ? 'bg-amber-400 text-slate-950 font-black shadow-sm scale-105'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Trigger Button */}
        <button
          type="button"
          onClick={handleRollSurprise}
          disabled={isSpinning}
          className={`w-full py-2.5 px-4 rounded-2xl font-black text-xs shadow-lg active:scale-95 transition cursor-pointer flex items-center justify-center space-x-2 border border-pink-400/40 ${
            isSpinning
              ? 'bg-slate-800 text-slate-400 animate-pulse cursor-wait'
              : 'bg-gradient-to-r from-pink-500 via-purple-600 to-amber-400 hover:from-pink-400 hover:to-amber-300 text-white font-black shadow-pink-500/20'
          }`}
        >
          <span className={`text-base ${isSpinning ? 'animate-spin' : ''}`}>💎</span>
          <span>{isSpinning ? 'Scouting Glamour Boutiques...' : 'Surprise Me with an Aesthetic Showroom!'}</span>
        </button>

        {/* Surprise Result Card */}
        {surpriseStore && (
          <div className="pt-2 animate-scale-up">
            <div className="bg-white rounded-2xl p-3 text-slate-900 shadow-2xl border-2 border-pink-500 relative space-y-2.5">
              
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-pink-100 text-pink-950 uppercase">
                  💎 Featured Flagship Boutique
                </span>
                <span className="text-[10px] text-slate-500 font-bold">
                  1 of {matchCount} matched showrooms
                </span>
              </div>

              <div className="relative h-44 w-full rounded-xl overflow-hidden bg-slate-100">
                <img
                  src={surpriseStore.image || (surpriseStore.images && surpriseStore.images[0])}
                  alt={surpriseStore.title || surpriseStore.name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-2 left-2 text-xs font-black px-2.5 py-1 rounded-xl text-white bg-slate-950/85 backdrop-blur-md">
                  {surpriseStore.price || surpriseStore.tagline || 'Flagship Outlet'}
                </span>
                <span className="absolute top-2 right-2 text-[9px] font-black px-2 py-0.5 rounded-lg text-white bg-pink-600">
                  {surpriseStore.badge || 'FLAGSHIP STORE'}
                </span>
              </div>

              <div>
                <h4 className="text-xs font-black text-slate-900 leading-snug line-clamp-1">
                  {surpriseStore.title || surpriseStore.name}
                </h4>
                <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                  📍 {surpriseStore.location} • {surpriseStore.timing || '10:30 AM - 9:30 PM'}
                </p>
              </div>

              <ActionButtons
                phone={surpriseStore.phone || '9876543210'}
                whatsapp={surpriseStore.whatsapp || surpriseStore.phone || '919876543210'}
                message={`Namaste, I saw "${surpriseStore.title || surpriseStore.name}" on TownHub Flagship Showrooms. I would like to check collection / VIP visit.`}
              />

              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleRollSurprise}
                  className="text-[10px] font-black text-pink-700 hover:text-pink-800 cursor-pointer flex items-center space-x-1"
                >
                  <span>🔄</span>
                  <span>Shuffle Another Showroom</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelect(surpriseStore.subCategory || 'all', 'All Showrooms')}
                  className="text-[10px] font-black text-slate-700 hover:text-slate-900 cursor-pointer"
                >
                  View All in Subcategory ➔
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 🌟 3. SECTOR SUBCATEGORY TILES */}
      <section className="space-y-2.5 pt-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black text-slate-100 uppercase tracking-wider flex items-center space-x-1.5">
            <span>💎</span>
            <span>Browse All Flagship Departments</span>
          </h3>
          <span className="text-[10px] text-pink-400 font-bold">
            {categoryConfig.subCategories.length} Categories
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => handleSelect('all', 'All Flagship Showrooms')}
            className="p-3.5 bg-slate-900 text-white rounded-2xl text-left font-black shadow-sm hover:scale-[1.02] active:scale-95 transition cursor-pointer flex flex-col justify-between h-28 border border-slate-800"
          >
            <span className="text-xl">🌟</span>
            <div>
              <div className="text-xs font-black">All Flagship Showrooms</div>
              <div className="text-[9px] text-slate-400 font-normal">All luxury boutiques & studios</div>
            </div>
          </button>

          {categoryConfig.subCategories.map((sub) => (
            <button
              key={sub.id}
              type="button"
              onClick={() => handleSelect(sub.id, sub.name)}
              className="p-3.5 bg-slate-900/90 hover:bg-slate-850 text-white rounded-2xl text-left font-bold shadow-sm hover:scale-[1.02] active:scale-95 transition cursor-pointer flex flex-col justify-between h-28 border border-slate-800 hover:border-pink-500/50"
            >
              <div className="flex items-center justify-between">
                <span className="text-xl">{sub.icon || '💎'}</span>
                {sub.tag && (
                  <span className="text-[8px] font-black px-1.5 py-0.2 rounded-md bg-pink-500 text-white font-bold uppercase">
                    {sub.tag}
                  </span>
                )}
              </div>
              <div>
                <div className="text-xs font-black leading-tight text-slate-100">{sub.name.split('(')[0]}</div>
                <div className="text-[9px] text-slate-400 font-semibold mt-0.5 truncate">
                  {sub.name.match(/\((.*?)\)/)?.[1] || 'शोरूम'}
                </div>
              </div>
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