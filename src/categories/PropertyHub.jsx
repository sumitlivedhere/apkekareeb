import React, { useState, useMemo } from 'react';
import { getCategoryById } from '../data/taxonomyRegistry';
import { useStoreSlice } from '../store/hyperlocalStore';
import ActionButtons from '../components/common/ActionButtons';
import CategoryListFreeBanner from '../components/common/CategoryListFreeBanner';

const PROPERTY_GROUPS = [
  {
    groupId: 'rentals',
    title: '1. On Rent Available (किराये पर उपलब्ध)',
    subtitle: 'Houses, flats, commercial shops, godowns, student PGs & single rooms',
    color: 'border-emerald-500/40 text-emerald-300',
    subIds: ['rent-rooms-homes-flats', 'rent-shops-showrooms-godowns', 'pg-hostel-rooms'],
  },
  {
    groupId: 'for-sale',
    title: '2. Available for Sale (बिकाऊ प्रॉपर्टी व जमीन)',
    subtitle: 'Ready houses, residential plots, commercial shops, UIT plots, plottings & farmland',
    color: 'border-teal-500/40 text-teal-300',
    subIds: [
      'house-for-sale',
      'plot-for-sale',
      'shop-for-sale',
      'uit-plots-land',
      'commercial-plottings',
      'farmland-agriculture',
    ],
  },
  {
    groupId: 'services',
    title: '3. Dealers, Legal & Bank Loans (डीलर्स, रजिस्ट्री व लोन)',
    subtitle: 'Verified local real estate agents, registry lawyers, Patta work & home loan advisors',
    color: 'border-amber-500/40 text-amber-300',
    subIds: ['property-dealers-agents', 'registry-patta-clearance', 'home-property-loans'],
  },
];

const INTENT_FILTERS = [
  { id: 'all', label: 'All Categories' },
  { id: 'rent-rooms-homes-flats', label: '🔑 Homes on Rent' },
  { id: 'rent-shops-showrooms-godowns', label: '🏬 Shops / Godowns Rent' },
  { id: 'house-for-sale', label: '🏡 House for Sale' },
  { id: 'plot-for-sale', label: '📐 Plot for Sale' },
  { id: 'uit-plots-land', label: '📑 UIT Plots' },
  { id: 'commercial-plottings', label: '🏗️ Commercial Plottings' },
  { id: 'farmland-agriculture', label: '🌾 Farmland' },
  { id: 'property-dealers-agents', label: '🤝 Property Dealers' },
  { id: 'home-property-loans', label: '🏦 Home Loans' },
];

const BUDGET_FILTERS = [
  { id: 'all', label: 'All Budgets' },
  { id: 'rent-low', label: '🏷️ Rent: Under ₹8,000 / mo' },
  { id: 'rent-mid', label: '👨‍👩‍👧 Rent: ₹8,000 - ₹20,000 / mo' },
  { id: 'buy-budget', label: '📐 Buy: Under ₹25 Lakh' },
  { id: 'buy-mid', label: '🏡 Buy: ₹25L - ₹60 Lakh' },
  { id: 'buy-luxury', label: '👑 Buy: ₹60 Lakh+' },
];

export default function PropertyHub({
  selectedCity = 'Alwar',
  onSelectSubCategory,
  onSelectPropertyCategory,
  onPostClick,
  onBack,
}) {
  const categoryConfig = getCategoryById('property');
  const storeListings = useStoreSlice('propertyListings');

  // Filter States
  const [selectedIntent, setSelectedIntent] = useState('all');
  const [selectedBudget, setSelectedBudget] = useState('all');

  // Surprise State
  const [matchedProperty, setMatchedProperty] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [matchCount, setMatchCount] = useState(0);

  const handleSelect = (subId, catName) => {
    if (typeof onSelectSubCategory === 'function') {
      onSelectSubCategory(subId);
    } else if (typeof onSelectPropertyCategory === 'function') {
      onSelectPropertyCategory(subId, catName);
    }
  };

  // Matched Pool
  const filteredPool = useMemo(() => {
    return (storeListings || []).filter((item) => {
      const sub = (item.subCategory || '').toLowerCase();
      const bud = (item.budgetBracket || '').toLowerCase();

      const matchesIntent = selectedIntent === 'all' || sub === selectedIntent;
      const matchesBudget = selectedBudget === 'all' || bud === selectedBudget;

      return matchesIntent && matchesBudget;
    });
  }, [storeListings, selectedIntent, selectedBudget]);

  const handleFindProperty = () => {
    setIsSearching(true);
    setMatchedProperty(null);

    setTimeout(() => {
      const pool = filteredPool.length > 0 ? filteredPool : storeListings;
      if (pool && pool.length > 0) {
        const randomIndex = Math.floor(Math.random() * pool.length);
        setMatchedProperty(pool[randomIndex]);
        setMatchCount(pool.length);
      }
      setIsSearching(false);
    }, 400);
  };

  return (
    <div className="p-3.5 space-y-4 animate-fade-in text-slate-100 pb-16">
      
      {/* 🌟 1. HERO HEADER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 p-4 border border-emerald-500/40 shadow-2xl">
        <div className="absolute -top-12 -right-12 w-44 h-44 bg-emerald-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>

        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-black uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span>City Real Estate Hub • {selectedCity}</span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white mt-1 flex items-center space-x-1.5">
              <span>🏢 Property & Land</span>
              <span className="bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent">
                Exchange
              </span>
            </h2>
            <p className="text-[11px] text-emerald-200/80 font-medium">
              Rentals, Plots, Ready Kothis, Farmland, Dealers & Registry Services
            </p>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="text-xs bg-white/10 hover:bg-white/20 text-emerald-100 px-3 py-1.5 rounded-xl font-bold backdrop-blur-md active:scale-95 transition cursor-pointer border border-white/10 shrink-0"
          >
            ← Town Hub
          </button>
        </div>

        {/* Quick Highlights Strip */}
        <div className="grid grid-cols-4 gap-2 mt-3 pt-2.5 border-t border-white/10 text-center">
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-emerald-300">0% Cut</div>
            <div className="text-[8px] text-slate-400 font-semibold">Direct Owner</div>
          </div>
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-teal-300">📑 UIT Patta</div>
            <div className="text-[8px] text-slate-400 font-semibold">Approved Plots</div>
          </div>
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-cyan-300">🌾 Farmland</div>
            <div className="text-[8px] text-slate-400 font-semibold">Bigha / Acre</div>
          </div>
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-amber-300">🏦 Loans</div>
            <div className="text-[8px] text-slate-400 font-semibold">Fast Registry</div>
          </div>
        </div>
      </div>

      {/* 🌟 2. SMART PROPERTY & BUDGET MATCHER */}
      <section className="bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950/40 p-4 rounded-3xl border border-emerald-500/30 shadow-xl space-y-3.5 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🎯</span>
            <div>
              <h3 className="text-xs font-black text-emerald-300 uppercase tracking-wider">
                Smart Property & Budget Matcher
              </h3>
              <p className="text-[10px] text-slate-400">
                Filter by your requirement & let the engine suggest a verified match
              </p>
            </div>
          </div>

          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            {filteredPool.length} Listings
          </span>
        </div>

        {/* Filter 1: Intent */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            1. Property Purpose & Category
          </label>
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
            {INTENT_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedIntent(f.id)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold shrink-0 transition cursor-pointer ${
                  selectedIntent === f.id
                    ? 'bg-emerald-400 text-slate-950 font-black shadow-sm scale-105'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter 2: Budget */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            2. Budget Bracket
          </label>
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
            {BUDGET_FILTERS.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedBudget(b.id)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold shrink-0 transition cursor-pointer ${
                  selectedBudget === b.id
                    ? 'bg-teal-400 text-slate-950 font-black shadow-sm scale-105'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Matcher Button */}
        <button
          type="button"
          onClick={handleFindProperty}
          disabled={isSearching}
          className={`w-full py-2.5 px-4 rounded-2xl font-black text-xs shadow-lg active:scale-95 transition cursor-pointer flex items-center justify-center space-x-2 border border-emerald-400/40 ${
            isSearching
              ? 'bg-slate-800 text-slate-400 animate-pulse cursor-wait'
              : 'bg-gradient-to-r from-emerald-400 via-teal-500 to-amber-400 hover:from-emerald-300 hover:to-amber-300 text-slate-950 font-black shadow-emerald-500/20'
          }`}
        >
          <span className={`text-base ${isSearching ? 'animate-spin' : ''}`}>🔍</span>
          <span>{isSearching ? 'Matching Verified Properties...' : 'Find Matched Verified Properties!'}</span>
        </button>

        {/* Match Result Card */}
        {matchedProperty && (
          <div className="pt-2 animate-scale-up">
            <div className="bg-white rounded-2xl p-3 text-slate-900 shadow-2xl border-2 border-emerald-500 relative space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-950 uppercase">
                  🟢 Verified Match Recommendation
                </span>
                <span className="text-[10px] text-slate-500 font-bold">
                  1 of {matchCount} matched properties
                </span>
              </div>

              <div className="relative h-44 w-full rounded-xl overflow-hidden bg-slate-100">
                <img
                  src={matchedProperty.image || matchedProperty.photo}
                  alt={matchedProperty.title || matchedProperty.name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-2 left-2 text-xs font-black px-2.5 py-1 rounded-xl text-white bg-slate-950/85 backdrop-blur-md">
                  {matchedProperty.price}
                </span>
                <span className="absolute top-2 right-2 text-[9px] font-black px-2 py-0.5 rounded-lg text-white bg-emerald-600">
                  {matchedProperty.badge || 'VERIFIED'}
                </span>
              </div>

              <div>
                <h4 className="text-xs font-black text-slate-900 leading-snug line-clamp-1">
                  {matchedProperty.title || matchedProperty.name}
                </h4>
                <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                  📍 {matchedProperty.location} • {matchedProperty.sellerName || 'Direct Owner / Dealer'}
                </p>
              </div>

              <ActionButtons
                phone={matchedProperty.phone || '9876543210'}
                whatsapp={matchedProperty.whatsapp || matchedProperty.phone || '919876543210'}
                message={`Namaste ${matchedProperty.sellerName || ''}, I saw your listing "${matchedProperty.title || matchedProperty.name}" on TownHub Property. Is it available to inspect?`}
              />

              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleFindProperty}
                  className="text-[10px] font-black text-emerald-700 hover:text-emerald-800 cursor-pointer flex items-center space-x-1"
                >
                  <span>🔄</span>
                  <span>Shuffle Another Match</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelect(matchedProperty.subCategory || 'all', 'All Properties')}
                  className="text-[10px] font-black text-slate-700 hover:text-slate-900 cursor-pointer"
                >
                  View All in Subcategory ➔
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 🌟 3. STRUCTURED SUB-CATEGORY GROUPS */}
      <div className="space-y-4">
        {PROPERTY_GROUPS.map((group) => (
          <section
            key={group.groupId}
            className="bg-slate-900/90 rounded-3xl p-3.5 border border-slate-800 shadow-md space-y-2.5"
          >
            <div className="px-1 border-b border-slate-800 pb-2">
              <h3 className="text-xs font-black text-white">{group.title}</h3>
              <p className="text-[10px] text-slate-400 font-medium">{group.subtitle}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {group.subIds.map((subId) => {
                const sub = categoryConfig.subCategories.find((s) => s.id === subId);
                if (!sub) return null;

                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => handleSelect(sub.id, sub.name)}
                    className="p-3 bg-slate-950/80 hover:bg-slate-850 rounded-2xl text-left transition cursor-pointer flex items-center justify-between border border-slate-800 hover:border-emerald-500/50 shadow-sm group active:scale-[0.98]"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl p-2 bg-slate-900 rounded-xl border border-slate-800 group-hover:border-emerald-500/40 shadow-inner shrink-0">
                        {sub.icon || '🏢'}
                      </span>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-black text-slate-100 group-hover:text-emerald-300 transition-colors leading-tight">
                            {sub.name.split('(')[0]}
                          </span>
                        </div>
                        <div className="text-[9px] text-slate-400 font-medium mt-0.5 truncate">
                          {sub.name.match(/\((.*?)\)/)?.[1] || 'देखें'}
                        </div>
                      </div>
                    </div>

                    <span className="text-xs font-black text-emerald-400 group-hover:translate-x-1 transition-transform shrink-0 ml-2">
                      ➔
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* 🌟 4. VIEW ALL BUTTON */}
      <button
        type="button"
        onClick={() => handleSelect('all', 'All Real Estate')}
        className="w-full py-3.5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 hover:from-slate-850 hover:to-slate-800 text-emerald-300 border border-emerald-500/30 rounded-2xl text-center text-xs font-black active:scale-95 transition cursor-pointer shadow-md"
      >
        🌟 View All Real Estate Directory ({categoryConfig.subCategories.length} Categories)
      </button>

      {/* 🌟 5. INTERACTIVE LIST FREE WIDGET */}
      <CategoryListFreeBanner
        category="property"
        selectedCity={selectedCity}
        onPostClick={onPostClick}
      />
    </div>
  );
}

