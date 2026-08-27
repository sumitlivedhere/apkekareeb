import React, { useState, useMemo } from 'react';
import { getCategoryById } from '../data/taxonomyRegistry';
import { useStoreSlice } from '../store/hyperlocalStore';
import ActionButtons from '../components/common/ActionButtons';
import CategoryListFreeBanner from '../components/common/CategoryListFreeBanner';

const GENDER_OPTIONS = [
  { id: 'all', label: 'All Genders' },
  { id: 'women', label: '👗 Women' },
  { id: 'men', label: '🤵 Men' },
  { id: 'unisex', label: '⚡ Unisex' },
  { id: 'kids', label: '👶 Kids' },
];

const AGE_OPTIONS = [
  { id: 'all', label: 'All Ages' },
  { id: 'kids', label: '👶 Kids (0-12)' },
  { id: 'gen-z', label: '🔥 Teens & Gen-Z' },
  { id: 'adults', label: '👔 Adults (25+)' },
];

const OCCASION_OPTIONS = [
  { id: 'all', label: 'All Occasions' },
  { id: 'casual', label: '☕ Casual Daily' },
  { id: 'formal', label: '💼 Formal / Office' },
  { id: 'partywear', label: '🎉 Party / Club' },
  { id: 'wedding', label: '👑 Wedding / Royal' },
];

export default function FashionHub({
  selectedCity = 'Alwar',
  onSelectSubCategory,
  onSelectFashionType,
  onPostClick,
  onBack,
}) {
  const categoryConfig = getCategoryById('fashion') || {};
  const subCategories = Array.isArray(categoryConfig.subCategories) ? categoryConfig.subCategories : [];
  const storeListings = useStoreSlice('listings');

  // Surprise Me Filter Matrix
  const [selectedGender, setSelectedGender] = useState('all');
  const [selectedAge, setSelectedAge] = useState('all');
  const [selectedOccasion, setSelectedOccasion] = useState('all');
  
  // Surprise Card State
  const [surpriseItem, setSurpriseItem] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [matchCount, setMatchCount] = useState(0);

  const handleSelect = (subId) => {
    if (typeof onSelectSubCategory === 'function') {
      onSelectSubCategory(subId);
    } else if (typeof onSelectFashionType === 'function') {
      onSelectFashionType(subId);
    }
  };

  // Only Fashion Pool
  const fashionPool = useMemo(() => {
    return (storeListings || []).filter((item) => {
      const cat = (item.category || '').toLowerCase().trim();
      return cat === 'fashion';
    });
  }, [storeListings]);

  // Compute Matched Pool based on Filters
  const matchedFashionPool = useMemo(() => {
    return fashionPool.filter((item) => {
      const g = (item.gender || 'unisex').toLowerCase();
      const a = (item.ageGroup || 'adults').toLowerCase();
      const o = (item.occasion || 'casual').toLowerCase();

      const matchesGender = selectedGender === 'all' || g === selectedGender || g === 'unisex';
      const matchesAge = selectedAge === 'all' || a === selectedAge;
      const matchesOccasion = selectedOccasion === 'all' || o === selectedOccasion;

      return matchesGender && matchesAge && matchesOccasion;
    });
  }, [fashionPool, selectedGender, selectedAge, selectedOccasion]);

  // Surprise Me Action
  const handleRollSurprise = () => {
    setIsSpinning(true);
    setSurpriseItem(null);

    setTimeout(() => {
      const pool = matchedFashionPool.length > 0 ? matchedFashionPool : fashionPool;
      if (pool.length > 0) {
        const randomIndex = Math.floor(Math.random() * pool.length);
        setSurpriseItem(pool[randomIndex]);
        setMatchCount(pool.length);
      }
      setIsSpinning(false);
    }, 450);
  };

  return (
    <div className="p-3.5 space-y-4 animate-fade-in text-slate-100 pb-20">
      {/* 🌟 1. Editorial Glamour Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-950 via-purple-950 to-slate-950 p-4 border border-pink-500/30 shadow-2xl">
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-pink-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>

        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-pink-500/20 border border-pink-400/30 text-pink-300 text-[10px] font-black uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-ping"></span>
              <span>Fashion & Lifestyle • {selectedCity}</span>
            </div>
            <h2 className="text-lg font-black tracking-tight text-white mt-1">
              Haute Couture & Streetwear
            </h2>
            <p className="text-[11px] text-pink-200/80">
              Discover verified local boutiques, kurtis, kicks & designer fits
            </p>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="text-xs bg-white/10 hover:bg-white/20 text-pink-100 px-3 py-1.5 rounded-xl font-bold backdrop-blur-md active:scale-95 transition cursor-pointer border border-white/10"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* 🌟 2. Interactive "Surprise Me" & Style Matcher Engine */}
      <section className="bg-gradient-to-b from-slate-900 via-slate-900 to-purple-950/40 p-4 rounded-3xl border border-pink-500/30 shadow-xl space-y-3.5 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🎲</span>
            <div>
              <h3 className="text-xs font-black text-amber-300 uppercase tracking-wider">
                Surprise Me • Style Matcher
              </h3>
              <p className="text-[10px] text-slate-400">
                Filter by your vibe & let the engine pick your next outfit
              </p>
            </div>
          </div>

          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-pink-500/20 text-pink-300 border border-pink-400/30">
            {matchedFashionPool.length} Fits Ready
          </span>
        </div>

        {/* Filter 1: Gender */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            1. Gender / Section
          </label>
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
            {GENDER_OPTIONS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelectedGender(g.id)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold shrink-0 transition cursor-pointer ${
                  selectedGender === g.id
                    ? 'bg-pink-500 text-white font-black shadow-sm scale-105'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter 2: Age Group */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            2. Age Bracket
          </label>
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
            {AGE_OPTIONS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setSelectedAge(a.id)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold shrink-0 transition cursor-pointer ${
                  selectedAge === a.id
                    ? 'bg-purple-600 text-white font-black shadow-sm scale-105'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter 3: Occasion */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            3. Occasion / Style Type
          </label>
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
            {OCCASION_OPTIONS.map((o) => (
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

        {/* Big Action Trigger */}
        <button
          type="button"
          onClick={handleRollSurprise}
          disabled={isSpinning}
          className={`w-full py-2.5 px-4 rounded-2xl font-black text-xs shadow-lg active:scale-95 transition cursor-pointer flex items-center justify-center space-x-2 border border-pink-400/40 ${
            isSpinning
              ? 'bg-slate-800 text-slate-400 animate-pulse cursor-wait'
              : 'bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-400 hover:to-amber-400 text-white shadow-pink-500/20'
          }`}
        >
          <span className={`text-base ${isSpinning ? 'animate-spin' : ''}`}>✨</span>
          <span>{isSpinning ? 'Finding Perfect Match...' : 'Surprise Me with an Outfit / Item!'}</span>
        </button>

        {/* Result Card */}
        {surpriseItem && (
          <div className="pt-2 animate-scale-up">
            <div className="bg-white rounded-2xl p-3 text-slate-900 shadow-2xl border-2 border-pink-500 relative space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-pink-100 text-pink-900 uppercase">
                  🎉 Curated For You
                </span>
                <span className="text-[10px] text-slate-500 font-bold">
                  1 of {matchCount} matched fits
                </span>
              </div>

              <div className="relative h-44 w-full rounded-xl overflow-hidden bg-slate-100">
                <img
                  src={surpriseItem.image || surpriseItem.images?.[0]}
                  alt={surpriseItem.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-2 left-2 text-xs font-black px-2.5 py-1 rounded-xl text-white bg-slate-950/85 backdrop-blur-md">
                  {surpriseItem.price}
                </span>
                <span className="absolute top-2 right-2 text-[9px] font-black px-2 py-0.5 rounded-lg text-white bg-pink-600">
                  {surpriseItem.badge || 'VERIFIED FIT'}
                </span>
              </div>

              <div>
                <h4 className="text-xs font-black text-slate-900 leading-snug line-clamp-1">
                  {surpriseItem.title}
                </h4>
                <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                  📍 {surpriseItem.location} • {surpriseItem.sellerName}
                </p>
              </div>

              <ActionButtons
                phone={surpriseItem.phone || '9876543210'}
                whatsapp={surpriseItem.whatsapp || surpriseItem.phone || '919876543210'}
                message={`Namaste, I found "${surpriseItem.title}" via Aapke Kareeb Style Surprise. Is it still available?`}
              />

              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleRollSurprise}
                  className="text-[10px] font-black text-pink-600 hover:text-pink-700 cursor-pointer flex items-center space-x-1"
                >
                  <span>🔄</span>
                  <span>Shuffle Another Fit</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelect(surpriseItem.subCategory || 'all')}
                  className="text-[10px] font-black text-slate-700 hover:text-slate-900 cursor-pointer"
                >
                  View All in Subcategory ➔
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 🌟 3. Sector Subcategory Tiles */}
      <section className="space-y-2.5 pt-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black text-slate-100 uppercase tracking-wider flex items-center space-x-1.5">
            <span>✨</span>
            <span>Browse Full Wardrobe Collections</span>
          </h3>
          <span className="text-[10px] text-pink-400 font-bold">{subCategories.length} Subcategories</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => handleSelect('all')}
            className="p-3.5 bg-slate-900 text-white rounded-2xl text-left font-black shadow-sm hover:scale-[1.02] active:scale-95 transition cursor-pointer flex flex-col justify-between h-28 border border-slate-800"
          >
            <span className="text-xl">🌟</span>
            <div>
              <div className="text-xs font-black">All Fashion</div>
              <div className="text-[9px] text-slate-400 font-normal">All listings & styles</div>
            </div>
          </button>

          {subCategories.map((sub) => {
            const rawName = String(sub.name || '');
            const title = rawName.includes('(') ? rawName.split('(')[0].trim() : rawName;
            const subtitle = rawName.match(/\((.*?)\)/)?.[1] || 'फैशन';

            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => handleSelect(sub.id)}
                className="p-3.5 bg-slate-900/90 hover:bg-slate-850 text-white rounded-2xl text-left font-bold shadow-sm hover:scale-[1.02] active:scale-95 transition cursor-pointer flex flex-col justify-between h-28 border border-slate-800 hover:border-pink-500/50"
              >
                <span className="text-xl">{sub.icon || '👗'}</span>
                <div>
                  <div className="text-xs font-black leading-tight">{title}</div>
                  <div className="text-[9px] text-slate-400 font-normal mt-0.5">{subtitle}</div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 🌟 4. Interactive List Free Widget */}
      <CategoryListFreeBanner
        category="fashion"
        selectedCity={selectedCity}
        onPostClick={onPostClick}
      />
    </div>
  );
}