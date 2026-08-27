import React, { useState, useMemo } from 'react';
import { getCategoryById } from '../data/taxonomyRegistry';
import { useStoreSlice } from '../store/hyperlocalStore';
import ActionButtons from '../components/common/ActionButtons';
import CategoryListFreeBanner from '../components/common/CategoryListFreeBanner';

const VIBE_FILTERS = [
  { id: 'all', label: 'All Food Spots' },
  { id: 'pure-veg-family', label: '🥗 Pure Veg Family' },
  { id: 'rooftop-cafes', label: '☕ Rooftop & Cafe' },
  { id: 'highway-dhaba', label: '🛞 Desi Dhaba' },
  { id: 'street-food-chaat', label: '🥘 Street Food & Chaat' },
  { id: 'bakeries-sweets', label: '🍰 Bakery & Sweets' },
  { id: 'non-veg-mughlai', label: '🍗 Non-Veg & Mughlai' },
  { id: 'late-night-eats', label: '🌙 Late Night Eats' },
  { id: 'daily-tiffin-thali', label: '🍱 Tiffin & Thali' },
];

const DIETARY_FILTERS = [
  { id: 'all', label: 'All Preferences' },
  { id: 'pure-veg', label: '🌿 100% Pure Veg / Jain' },
  { id: 'cafe-fastfood', label: '🍕 Pizza, Burgers & Mocktails' },
  { id: 'desi-ghee-thali', label: '🧈 Desi Ghee & Dal Baati' },
  { id: 'non-veg', label: '🍗 Non-Veg / Biryani' },
];

const BUDGET_FILTERS = [
  { id: 'all', label: 'All Budgets' },
  { id: 'budget-friendly', label: '🏷️ Pocket-Friendly (Under ₹300 for 2)' },
  { id: 'family-dining', label: '👨‍👩‍👧 Family Dine-in (₹400 - ₹800 for 2)' },
  { id: 'rooftop-luxury', label: '👑 Rooftop & Luxury (₹1,000+ for 2)' },
];

export default function RestaurantsHub({
  selectedCity = 'Alwar',
  onSelectSubCategory,
  onSelectRestaurantCategory,
  onPostClick,
  onBack,
}) {
  const categoryConfig = getCategoryById('restaurants');
  const storeRestaurants = useStoreSlice('restaurantsList');

  // Filter Matrix States
  const [selectedVibe, setSelectedVibe] = useState('all');
  const [selectedDiet, setSelectedDiet] = useState('all');
  const [selectedBudget, setSelectedBudget] = useState('all');

  // Surprise Food State
  const [surpriseFood, setSurpriseFood] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [matchCount, setMatchCount] = useState(0);

  const handleSelect = (subId, catName) => {
    if (typeof onSelectSubCategory === 'function') {
      onSelectSubCategory(subId);
    } else if (typeof onSelectRestaurantCategory === 'function') {
      onSelectRestaurantCategory(subId, catName);
    }
  };

  // Compute Matched Pool
  const matchedRestaurants = useMemo(() => {
    return (storeRestaurants || []).filter((item) => {
      const sub = (item.subCategory || '').toLowerCase();
      const diet = (item.dietaryType || '').toLowerCase();
      const budget = (item.budgetTier || '').toLowerCase();

      const matchesVibe = selectedVibe === 'all' || sub === selectedVibe;
      const matchesDiet = selectedDiet === 'all' || diet === selectedDiet;
      const matchesBudget = selectedBudget === 'all' || budget === selectedBudget;

      return matchesVibe && matchesDiet && matchesBudget;
    });
  }, [storeRestaurants, selectedVibe, selectedDiet, selectedBudget]);

  // Roll Surprise Food Pick
  const handleRollSurprise = () => {
    setIsSpinning(true);
    setSurpriseFood(null);

    setTimeout(() => {
      const pool = matchedRestaurants.length > 0 ? matchedRestaurants : storeRestaurants;
      if (pool && pool.length > 0) {
        const randomIndex = Math.floor(Math.random() * pool.length);
        setSurpriseFood(pool[randomIndex]);
        setMatchCount(pool.length);
      }
      setIsSpinning(false);
    }, 450);
  };

  return (
    <div className="p-3.5 space-y-4 animate-fade-in text-slate-100 pb-12">
      
      {/* 🌟 1. CULINARY GLAMOUR HERO BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-950 via-rose-950 to-slate-950 p-4 border border-amber-500/40 shadow-2xl">
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-10 w-32 h-32 bg-rose-600 rounded-full blur-2xl opacity-15 pointer-events-none"></div>

        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[10px] font-black uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
              <span>City Food Guide • {selectedCity}</span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white mt-1 flex items-center space-x-1.5">
              <span>🍔 Restaurants & Cafes</span>
            </h2>
            <p className="text-[11px] text-amber-200/80 font-medium">
              Pure veg family dining, scenic rooftops, dhabas, famous street food & midnight delivery
            </p>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="text-xs bg-white/10 hover:bg-white/20 text-amber-100 px-3 py-1.5 rounded-xl font-bold backdrop-blur-md active:scale-95 transition cursor-pointer border border-white/10 shrink-0"
          >
            ← Town Hub
          </button>
        </div>

        {/* Quick Highlights Strip */}
        <div className="grid grid-cols-4 gap-2 mt-3 pt-2.5 border-t border-white/10 text-center">
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-amber-300">🥗 Pure Veg</div>
            <div className="text-[8px] text-slate-400 font-semibold">AC Family Halls</div>
          </div>
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-rose-300">☕ Rooftops</div>
            <div className="text-[8px] text-slate-400 font-semibold">Live Music & View</div>
          </div>
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-orange-300">🛞 Dhabas</div>
            <div className="text-[8px] text-slate-400 font-semibold">Desi Dal Baati</div>
          </div>
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-emerald-300">🛵 Direct Call</div>
            <div className="text-[8px] text-slate-400 font-semibold">0% Commission</div>
          </div>
        </div>
      </div>

      {/* 🌟 2. INTERACTIVE "SURPRISE ME • CRAVING & MOOD MATCHER" */}
      <section className="bg-gradient-to-b from-slate-900 via-slate-900 to-amber-950/40 p-4 rounded-3xl border border-amber-500/30 shadow-xl space-y-3.5 relative overflow-hidden">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🎲</span>
            <div>
              <h3 className="text-xs font-black text-amber-300 uppercase tracking-wider">
                Surprise Me • Craving & Mood Matcher
              </h3>
              <p className="text-[10px] text-slate-400">
                Can't decide what to eat? Pick your mood & let the engine suggest a spot
              </p>
            </div>
          </div>

          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-400/30">
            {matchedRestaurants.length} Food Spots Live
          </span>
        </div>

        {/* Filter 1: Food Vibe */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            1. Dining Mood / Spot Vibe
          </label>
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
            {VIBE_FILTERS.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedVibe(v.id)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold shrink-0 transition cursor-pointer ${
                  selectedVibe === v.id
                    ? 'bg-amber-400 text-slate-950 font-black shadow-sm scale-105'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter 2: Dietary & Food Specialty */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            2. Dietary Preference & Cuisine
          </label>
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
            {DIETARY_FILTERS.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setSelectedDiet(d.id)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold shrink-0 transition cursor-pointer ${
                  selectedDiet === d.id
                    ? 'bg-rose-600 text-white font-black shadow-sm scale-105'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter 3: Budget Range */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            3. Price for Two People
          </label>
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
            {BUDGET_FILTERS.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedBudget(b.id)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold shrink-0 transition cursor-pointer ${
                  selectedBudget === b.id
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-sm scale-105'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Trigger Button */}
        <button
          type="button"
          onClick={handleRollSurprise}
          disabled={isSpinning}
          className={`w-full py-2.5 px-4 rounded-2xl font-black text-xs shadow-lg active:scale-95 transition cursor-pointer flex items-center justify-center space-x-2 border border-amber-400/40 ${
            isSpinning
              ? 'bg-slate-800 text-slate-400 animate-pulse cursor-wait'
              : 'bg-gradient-to-r from-amber-500 via-rose-600 to-amber-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-black shadow-amber-500/20'
          }`}
        >
          <span className={`text-base ${isSpinning ? 'animate-spin' : ''}`}>🍽️</span>
          <span>{isSpinning ? 'Cooking Up Food Recommendation...' : 'Surprise Me with Where to Eat!'}</span>
        </button>

        {/* Surprise Result Card */}
        {surpriseFood && (
          <div className="pt-2 animate-scale-up">
            <div className="bg-white rounded-2xl p-3 text-slate-900 shadow-2xl border-2 border-amber-500 relative space-y-2.5">
              
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-950 uppercase">
                  🎉 Curated Food Recommendation
                </span>
                <span className="text-[10px] text-slate-500 font-bold">
                  1 of {matchCount} matched spots
                </span>
              </div>

              <div className="relative h-44 w-full rounded-xl overflow-hidden bg-slate-100">
                <img
                  src={surpriseFood.image || (surpriseFood.images && surpriseFood.images[0])}
                  alt={surpriseFood.title || surpriseFood.name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-2 left-2 text-xs font-black px-2.5 py-1 rounded-xl text-white bg-slate-950/85 backdrop-blur-md">
                  {surpriseFood.price || surpriseFood.priceForTwo || '₹ 400 for Two'}
                </span>
                <span className="absolute top-2 right-2 text-[9px] font-black px-2 py-0.5 rounded-lg text-white bg-rose-600">
                  {surpriseFood.badge || 'VERIFIED FOOD SPOT'}
                </span>
              </div>

              <div>
                <h4 className="text-xs font-black text-slate-900 leading-snug line-clamp-1">
                  {surpriseFood.title || surpriseFood.name}
                </h4>
                <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                  📍 {surpriseFood.location} • {surpriseFood.timing || '11 AM - 11 PM'}
                </p>
              </div>

              <ActionButtons
                phone={surpriseFood.phone || '9876543210'}
                whatsapp={surpriseFood.whatsapp || surpriseFood.phone || '919876543210'}
                message={`Namaste, I found "${surpriseFood.title || surpriseFood.name}" on TownHub Food. I want to book a table / place an order.`}
              />

              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleRollSurprise}
                  className="text-[10px] font-black text-rose-700 hover:text-rose-800 cursor-pointer flex items-center space-x-1"
                >
                  <span>🔄</span>
                  <span>Shuffle Another Spot</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelect(surpriseFood.subCategory || 'all', 'All Restaurants')}
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
            <span>🍽️</span>
            <span>Browse Full Food Directory</span>
          </h3>
          <span className="text-[10px] text-amber-400 font-bold">
            {categoryConfig.subCategories.length} Categories
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => handleSelect('all', 'All Restaurants')}
            className="p-3.5 bg-slate-900 text-white rounded-2xl text-left font-black shadow-sm hover:scale-[1.02] active:scale-95 transition cursor-pointer flex flex-col justify-between h-28 border border-slate-800"
          >
            <span className="text-xl">🌟</span>
            <div>
              <div className="text-xs font-black">All Food & Cafes</div>
              <div className="text-[9px] text-slate-400 font-normal">All restaurants & dhabas</div>
            </div>
          </button>

          {categoryConfig.subCategories.map((sub) => (
            <button
              key={sub.id}
              type="button"
              onClick={() => handleSelect(sub.id, sub.name)}
              className="p-3.5 bg-slate-900/90 hover:bg-slate-850 text-white rounded-2xl text-left font-bold shadow-sm hover:scale-[1.02] active:scale-95 transition cursor-pointer flex flex-col justify-between h-28 border border-slate-800 hover:border-amber-500/50"
            >
              <div className="flex items-center justify-between">
                <span className="text-xl">{sub.icon || '🍔'}</span>
                {sub.tag && (
                  <span className="text-[8px] font-black px-1.5 py-0.2 rounded-md bg-amber-500 text-slate-950 font-bold uppercase">
                    {sub.tag}
                  </span>
                )}
              </div>
              <div>
                <div className="text-xs font-black leading-tight text-slate-100">{sub.name.split('(')[0]}</div>
                <div className="text-[9px] text-slate-400 font-semibold mt-0.5 truncate">
                  {sub.name.match(/\((.*?)\)/)?.[1] || 'फूड'}
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