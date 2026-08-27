import React, { useState, useMemo } from 'react';
import { getCategoryById } from '../data/taxonomyRegistry';
import { useStoreSlice } from '../store/hyperlocalStore';
import ActionButtons from '../components/common/ActionButtons';
import CategoryListFreeBanner from '../components/common/CategoryListFreeBanner';

const ITEM_CATEGORY_FILTERS = [
  { id: 'all', label: 'All Pre-Loved Items' },
  { id: 'phones-gadgets', label: '📱 Mobiles & Tabs' },
  { id: 'used-bikes-scooters', label: '🏍️ Bikes & Cycles' },
  { id: 'home-furniture-appliances', label: '🛋️ Furniture & Fridge' },
  { id: 'moving-out-sale', label: '📦 Moving Out Sale' },
  { id: 'student-books-notes', label: '📚 Books & Notes' },
  { id: 'laptops-monitors', label: '💻 Laptops & PCs' },
  { id: 'kids-cycles-toys', label: '🧸 Kids & Toys' },
  { id: 'fitness-gym-sports', label: '🏋️ Gym & Sports' },
  { id: 'giveaways-free', label: '🎁 ₹0 Free Giveaway' },
];

const CONDITION_FILTERS = [
  { id: 'all', label: 'All Conditions' },
  { id: 'like-new', label: '✨ Like New (With Bill & Box)' },
  { id: 'gently-used', label: '👍 Gently Used & Clean' },
  { id: 'well-maintained', label: '🛠️ Well Maintained Working' },
  { id: 'free-giveaway', label: '🎁 ₹0 Free Giveaway' },
];

const URGENCY_DEAL_FILTERS = [
  { id: 'all', label: 'All Deal Types' },
  { id: 'urgent-relocation', label: '🔥 Urgent Moving Out / Price Drop' },
  { id: 'under-1000', label: '⚡ Steals Under ₹1,000' },
  { id: 'negotiable', label: '💬 Price Negotiable' },
  { id: 'fixed-fair', label: '🏷️ Fixed Fair Citizen Price' },
];

export default function ReCommerceHub({
  selectedCity = 'Alwar',
  onSelectSubCategory,
  onSelectCategory,
  onPostClick,
  onBack,
}) {
  const categoryConfig = getCategoryById('recommerce');
  const storeListings = useStoreSlice('reCommerceListings');

  // Filter Matrix States
  const [selectedItemCat, setSelectedItemCat] = useState('all');
  const [selectedCondition, setSelectedCondition] = useState('all');
  const [selectedUrgency, setSelectedUrgency] = useState('all');

  // Surprise State
  const [surpriseItem, setSurpriseItem] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [matchCount, setMatchCount] = useState(0);

  const handleSelect = (subId) => {
    if (typeof onSelectSubCategory === 'function') {
      onSelectSubCategory(subId);
    } else if (typeof onSelectCategory === 'function') {
      onSelectCategory(subId);
    }
  };

  // Compute Matched Pool
  const matchedListings = useMemo(() => {
    return (storeListings || []).filter((item) => {
      const sub = (item.subCategory || '').toLowerCase();
      const cond = (item.conditionType || '').toLowerCase();
      const urg = (item.dealType || '').toLowerCase();

      const matchesCat = selectedItemCat === 'all' || sub === selectedItemCat;
      const matchesCond = selectedCondition === 'all' || cond === selectedCondition;
      const matchesUrg = selectedUrgency === 'all' || urg === selectedUrgency;

      return matchesCat && matchesCond && matchesUrg;
    });
  }, [storeListings, selectedItemCat, selectedCondition, selectedUrgency]);

  // Roll Surprise Thrift Deal
  const handleRollSurprise = () => {
    setIsSpinning(true);
    setSurpriseItem(null);

    setTimeout(() => {
      const pool = matchedListings.length > 0 ? matchedListings : storeListings;
      if (pool && pool.length > 0) {
        const randomIndex = Math.floor(Math.random() * pool.length);
        setSurpriseItem(pool[randomIndex]);
        setMatchCount(pool.length);
      }
      setIsSpinning(false);
    }, 450);
  };

  return (
    <div className="p-3.5 space-y-4 animate-fade-in text-slate-100 pb-10">
      
      {/* 🌟 1. CITIZEN FLEA MARKET EDITORIAL HEADER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-950 via-cyan-950 to-slate-950 p-4 border border-teal-500/30 shadow-2xl">
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-teal-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-10 w-32 h-32 bg-amber-500 rounded-full blur-2xl opacity-15 pointer-events-none"></div>

        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-[10px] font-black uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping"></span>
              <span>City Citizen Flea Market • {selectedCity}</span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white mt-1 flex items-center space-x-1.5">
              <span>🛍️ Pre-Loved & Thrift</span>
              <span className="bg-gradient-to-r from-teal-300 to-amber-300 bg-clip-text text-transparent">
                Bazaar
              </span>
            </h2>
            <p className="text-[11px] text-teal-200/80">
              Direct peer-to-peer pre-owned deals from verified local neighbors
            </p>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="text-xs bg-white/10 hover:bg-white/20 text-teal-100 px-3 py-1.5 rounded-xl font-bold backdrop-blur-md active:scale-95 transition cursor-pointer border border-white/10"
          >
            ← Town Hub
          </button>
        </div>

        {/* Highlight Quality Strip */}
        <div className="grid grid-cols-4 gap-2 mt-3 pt-2.5 border-t border-white/10 text-center">
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-teal-300">0% Cut</div>
            <div className="text-[8px] text-slate-400 font-semibold">Zero Commission</div>
          </div>
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-amber-300">🏠 Nearby</div>
            <div className="text-[8px] text-slate-400 font-semibold">5 km Radius</div>
          </div>
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-cyan-300">💬 Direct</div>
            <div className="text-[8px] text-slate-400 font-semibold">WhatsApp & Call</div>
          </div>
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-emerald-300">🎁 Free</div>
            <div className="text-[8px] text-slate-400 font-semibold">Giveaway Items</div>
          </div>
        </div>
      </div>

      {/* 🌟 2. HIGHLIGHTED "MOVING OUT / HOUSE CLEARANCE" STRIP */}
      <div className="p-3.5 bg-gradient-to-r from-amber-950 via-slate-900 to-teal-950 border border-amber-500/40 rounded-2xl shadow-lg flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl p-2 bg-amber-500/20 border border-amber-400/30 rounded-xl">📦</span>
          <div>
            <div className="inline-flex items-center space-x-1.5">
              <span className="text-xs font-black text-amber-300 uppercase">Moving Out & Relocation Clearance</span>
              <span className="text-[8px] font-black px-1.5 py-0.2 bg-red-500 text-white rounded-md">HEAVY DISCOUNTS</span>
            </div>
            <p className="text-[10px] text-slate-300 mt-0.5">
              Families & students relocating out of {selectedCity} selling appliances, beds & sofas at distress prices
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => handleSelect('moving-out-sale')}
          className="text-[11px] font-black bg-amber-400 hover:bg-amber-300 text-slate-950 px-3 py-1.5 rounded-xl shrink-0 active:scale-95 transition cursor-pointer shadow-md shadow-amber-400/20"
        >
          View Clearance ➔
        </button>
      </div>

      {/* 🌟 3. INTERACTIVE "SURPRISE ME • THRIFT & BARGAIN HUNTER" */}
      <section className="bg-gradient-to-b from-slate-900 via-slate-900 to-teal-950/40 p-4 rounded-3xl border border-teal-500/30 shadow-xl space-y-3.5 relative overflow-hidden">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🎲</span>
            <div>
              <h3 className="text-xs font-black text-teal-300 uppercase tracking-wider">
                Surprise Me • Thrift & Bargain Hunter
              </h3>
              <p className="text-[10px] text-slate-400">
                Filter by condition or price drop & discover what neighbors are selling today
              </p>
            </div>
          </div>

          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 border border-teal-400/30">
            {matchedListings.length} Pre-Loved Deals
          </span>
        </div>

        {/* Filter 1: Item Category */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            1. Item Variety & Department
          </label>
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
            {ITEM_CATEGORY_FILTERS.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedItemCat(cat.id)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold shrink-0 transition cursor-pointer ${
                  selectedItemCat === cat.id
                    ? 'bg-teal-400 text-slate-950 font-black shadow-sm scale-105'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter 2: Condition & Maintenance */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            2. Item Condition & Maintenance
          </label>
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CONDITION_FILTERS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCondition(c.id)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold shrink-0 transition cursor-pointer ${
                  selectedCondition === c.id
                    ? 'bg-cyan-500 text-slate-950 font-black shadow-sm scale-105'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter 3: Deal Urgency & Budget */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            3. Deal Urgency & Price Deal
          </label>
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
            {URGENCY_DEAL_FILTERS.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => setSelectedUrgency(u.id)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold shrink-0 transition cursor-pointer ${
                  selectedUrgency === u.id
                    ? 'bg-amber-400 text-slate-950 font-black shadow-sm scale-105'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {u.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Trigger Button */}
        <button
          type="button"
          onClick={handleRollSurprise}
          disabled={isSpinning}
          className={`w-full py-2.5 px-4 rounded-2xl font-black text-xs shadow-lg active:scale-95 transition cursor-pointer flex items-center justify-center space-x-2 border border-teal-400/40 ${
            isSpinning
              ? 'bg-slate-800 text-slate-400 animate-pulse cursor-wait'
              : 'bg-gradient-to-r from-teal-400 via-cyan-500 to-amber-400 hover:from-teal-300 hover:to-amber-300 text-slate-950 font-black shadow-teal-500/20'
          }`}
        >
          <span className={`text-base ${isSpinning ? 'animate-spin' : ''}`}>🎲</span>
          <span>{isSpinning ? 'Hunting Neighbor Deals...' : 'Surprise Me with a Second-Hand Bargain!'}</span>
        </button>

        {/* Surprise Result Card */}
        {surpriseItem && (
          <div className="pt-2 animate-scale-up">
            <div className="bg-white rounded-2xl p-3 text-slate-900 shadow-2xl border-2 border-teal-500 relative space-y-2.5">
              
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-teal-100 text-teal-950 uppercase">
                  🏷️ Citizen Thrift Pick
                </span>
                <span className="text-[10px] text-slate-500 font-bold">
                  1 of {matchCount} matched items
                </span>
              </div>

              <div className="relative h-44 w-full rounded-xl overflow-hidden bg-slate-100">
                <img
                  src={surpriseItem.image || surpriseItem.photo}
                  alt={surpriseItem.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-2 left-2 text-xs font-black px-2.5 py-1 rounded-xl text-white bg-slate-950/85 backdrop-blur-md">
                  {surpriseItem.price}
                </span>
                <span className="absolute top-2 right-2 text-[9px] font-black px-2 py-0.5 rounded-lg text-white bg-teal-600">
                  {surpriseItem.badge || 'LOCAL CITIZEN'}
                </span>
              </div>

              <div>
                <h4 className="text-xs font-black text-slate-900 leading-snug line-clamp-1">
                  {surpriseItem.title}
                </h4>
                <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                  📍 {surpriseItem.location} • Posted by {surpriseItem.sellerName}
                </p>
              </div>

              <ActionButtons
                phone={surpriseItem.phone || '9876543210'}
                whatsapp={surpriseItem.whatsapp || surpriseItem.phone || '919876543210'}
                message={`Namaste ${surpriseItem.sellerName || ''}, I am interested in buying your pre-owned item "${surpriseItem.title}" on TownHub. Is it still available to inspect today?`}
              />

              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleRollSurprise}
                  className="text-[10px] font-black text-teal-700 hover:text-teal-800 cursor-pointer flex items-center space-x-1"
                >
                  <span>🔄</span>
                  <span>Shuffle Another Deal</span>
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

      {/* 🌟 4. SECTOR SUBCATEGORY TILES (10 CITIZEN SECTORS) */}
      <section className="space-y-2.5 pt-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black text-slate-100 uppercase tracking-wider flex items-center space-x-1.5">
            <span>📦</span>
            <span>Browse Second-Hand Categories</span>
          </h3>
          <span className="text-[10px] text-teal-400 font-bold">
            {categoryConfig.subCategories.length} Categories
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => handleSelect('all')}
            className="p-3.5 bg-slate-900 text-white rounded-2xl text-left font-black shadow-sm hover:scale-[1.02] active:scale-95 transition cursor-pointer flex flex-col justify-between h-28 border border-slate-800"
          >
            <span className="text-xl">🌟</span>
            <div>
              <div className="text-xs font-black">All Second-Hand</div>
              <div className="text-[9px] text-slate-400 font-normal">All neighbor listings</div>
            </div>
          </button>

          {categoryConfig.subCategories.map((sub) => (
            <button
              key={sub.id}
              type="button"
              onClick={() => handleSelect(sub.id)}
              className="p-3.5 bg-slate-900/90 hover:bg-slate-850 text-white rounded-2xl text-left font-bold shadow-sm hover:scale-[1.02] active:scale-95 transition cursor-pointer flex flex-col justify-between h-28 border border-slate-800 hover:border-teal-500/50"
            >
              <div className="flex items-center justify-between">
                <span className="text-xl">{sub.icon || '🛍️'}</span>
                <span className="text-[8px] font-black px-1.5 py-0.2 rounded-md bg-teal-500 text-slate-950 font-bold uppercase">
                  {sub.tag || 'THRIFT'}
                </span>
              </div>
              <div>
                <div className="text-xs font-black leading-tight text-slate-100">{sub.name.split('(')[0]}</div>
                <div className="text-[9px] text-slate-400 font-semibold mt-0.5 truncate">
                  {sub.name.match(/\((.*?)\)/)?.[1] || 'पुराना सामान'}
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