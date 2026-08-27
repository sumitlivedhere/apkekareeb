import React, { useState, useMemo } from 'react';
import { getCategoryById } from '../data/taxonomyRegistry';
import { useStoreSlice } from '../store/hyperlocalStore';
import ActionButtons from '../components/common/ActionButtons';
import CategoryListFreeBanner from '../components/common/CategoryListFreeBanner';

const DEAL_TYPE_FILTERS = [
  { id: 'all', label: 'All Offers' },
  { id: 'flat-clearance', label: '🔥 Flat 50%+ Clearance' },
  { id: 'bogo', label: '🎁 Buy 1 Get 1 Free' },
  { id: 'launch-offer', label: '🚀 Grand Opening Deals' },
  { id: 'wholesale-bulk', label: '📦 Wholesale & Mandi Rates' },
];

const RETAIL_SECTOR_FILTERS = [
  { id: 'all', label: 'All Sectors' },
  { id: 'fashion', label: '👗 Fashion & Apparel' },
  { id: 'electronics', label: '📱 Mobiles & Tech' },
  { id: 'footwear', label: '👟 Shoes & Footwear' },
  { id: 'appliances', label: '📺 Home Appliances' },
  { id: 'grocery', label: '🛒 Kirana & Staples' },
  { id: 'home-decor', label: '✨ Home Decor & Pooja' },
];

const VALIDITY_FILTERS = [
  { id: 'all', label: 'All Durations' },
  { id: 'weekend', label: '⚡ Ending This Weekend' },
  { id: 'launch-week', label: '🎉 Launch Week Only' },
  { id: 'season-long', label: '🗓️ Season Long Offer' },
];

export default function MarketHub({
  selectedCity = 'Alwar',
  onSelectSubCategory,
  onSelectMarketCategory,
  onPostClick,
  onBack,
}) {
  const categoryConfig = getCategoryById('market');
  const storeProducts = useStoreSlice('marketProducts');

  // Filter States
  const [selectedDealType, setSelectedDealType] = useState('all');
  const [selectedSector, setSelectedSector] = useState('all');
  const [selectedValidity, setSelectedValidity] = useState('all');

  // Surprise Deal State
  const [surpriseDeal, setSurpriseDeal] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [matchCount, setMatchCount] = useState(0);

  const handleSelect = (subId) => {
    if (typeof onSelectSubCategory === 'function') {
      onSelectSubCategory(subId);
    } else if (typeof onSelectMarketCategory === 'function') {
      onSelectMarketCategory(subId);
    }
  };

  // Compute Matched Pool
  const matchedDeals = useMemo(() => {
    return (storeProducts || []).filter((item) => {
      const dType = (item.dealType || '').toLowerCase();
      const sSector = (item.retailSector || '').toLowerCase();
      const vVal = (item.validity || '').toLowerCase();

      const matchesDeal = selectedDealType === 'all' || dType === selectedDealType;
      const matchesSector = selectedSector === 'all' || sSector === selectedSector;
      const matchesValidity = selectedValidity === 'all' || vVal === selectedValidity;

      return matchesDeal && matchesSector && matchesValidity;
    });
  }, [storeProducts, selectedDealType, selectedSector, selectedValidity]);

  // Roll Surprise Deal
  const handleRollSurprise = () => {
    setIsSpinning(true);
    setSurpriseDeal(null);

    setTimeout(() => {
      const pool = matchedDeals.length > 0 ? matchedDeals : storeProducts;
      if (pool && pool.length > 0) {
        const randomIndex = Math.floor(Math.random() * pool.length);
        setSurpriseDeal(pool[randomIndex]);
        setMatchCount(pool.length);
      }
      setIsSpinning(false);
    }, 450);
  };

  const getSubcategoryBadge = (subId) => {
    switch (subId) {
      case 'new-openings': return 'NEW IN TOWN';
      case 'sales-clearance': return 'UP TO 70% OFF';
      case 'special-deals': return 'LIMITED TIME';
      case 'wholesalers': return 'BULK SAVINGS';
      case 'brand-showrooms': return 'OFFICIAL OUTLETS';
      default: return 'EXPLORE';
    }
  };

  return (
    <div className="p-3.5 space-y-4 animate-fade-in text-slate-100 pb-10">
      
      {/* 🌟 1. EDITORIAL BAZAAR & DEALS HEADER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-950 p-4 border border-emerald-500/30 shadow-2xl">
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-10 w-32 h-32 bg-amber-500 rounded-full blur-2xl opacity-15 pointer-events-none"></div>

        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-black uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Local Retail & Mega Deals • {selectedCity}</span>
            </div>
            <h2 className="text-lg font-black tracking-tight text-white mt-1">
              Market & Retail Deals
            </h2>
            <p className="text-[11px] text-emerald-200/80">
              New store openings, clearance sales, brand offers & wholesale supplies
            </p>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="text-xs bg-white/10 hover:bg-white/20 text-emerald-100 px-3 py-1.5 rounded-xl font-bold backdrop-blur-md active:scale-95 transition cursor-pointer border border-white/10"
          >
            ← Town Hub
          </button>
        </div>

        {/* Quick Value Metrics */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-white/10 text-center">
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-emerald-300">🏪 100% Local</div>
            <div className="text-[9px] text-slate-400 font-semibold">City Stores</div>
          </div>
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-amber-300">🔥 Live Discounts</div>
            <div className="text-[9px] text-slate-400 font-semibold">Verified Offers</div>
          </div>
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-teal-300">💬 Direct Chat</div>
            <div className="text-[9px] text-slate-400 font-semibold">Zero Commission</div>
          </div>
        </div>
      </div>

      {/* 🌟 2. INTERACTIVE "SURPRISE ME • DEAL MATCH ENGINE" */}
      <section className="bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950/40 p-4 rounded-3xl border border-emerald-500/30 shadow-xl space-y-3.5 relative overflow-hidden">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🏷️</span>
            <div>
              <h3 className="text-xs font-black text-amber-300 uppercase tracking-wider">
                Surprise Me • Deal Matcher
              </h3>
              <p className="text-[10px] text-slate-400">
                Filter by offer type & unlock exclusive local shopping deals
              </p>
            </div>
          </div>

          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            {matchedDeals.length} Offers Ready
          </span>
        </div>

        {/* Filter 1: Deal Type */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            1. Offer / Deal Type
          </label>
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
            {DEAL_TYPE_FILTERS.map((dt) => (
              <button
                key={dt.id}
                type="button"
                onClick={() => setSelectedDealType(dt.id)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold shrink-0 transition cursor-pointer ${
                  selectedDealType === dt.id
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-sm scale-105'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {dt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter 2: Retail Sector */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            2. Retail Category / Sector
          </label>
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
            {RETAIL_SECTOR_FILTERS.map((rs) => (
              <button
                key={rs.id}
                type="button"
                onClick={() => setSelectedSector(rs.id)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold shrink-0 transition cursor-pointer ${
                  selectedSector === rs.id
                    ? 'bg-teal-500 text-slate-950 font-black shadow-sm scale-105'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {rs.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter 3: Validity / Urgency */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            3. Deal Duration & Urgency
          </label>
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
            {VALIDITY_FILTERS.map((vf) => (
              <button
                key={vf.id}
                type="button"
                onClick={() => setSelectedValidity(vf.id)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold shrink-0 transition cursor-pointer ${
                  selectedValidity === vf.id
                    ? 'bg-amber-400 text-slate-950 font-black shadow-sm scale-105'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {vf.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleRollSurprise}
          disabled={isSpinning}
          className={`w-full py-2.5 px-4 rounded-2xl font-black text-xs shadow-lg active:scale-95 transition cursor-pointer flex items-center justify-center space-x-2 border border-emerald-400/40 ${
            isSpinning
              ? 'bg-slate-800 text-slate-400 animate-pulse cursor-wait'
              : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500 hover:from-emerald-400 hover:to-amber-400 text-slate-950 font-black shadow-emerald-500/20'
          }`}
        >
          <span className={`text-base ${isSpinning ? 'animate-spin' : ''}`}>⚡</span>
          <span>{isSpinning ? 'Hunting City Deals...' : 'Surprise Me with an Exclusive Deal!'}</span>
        </button>

        {/* Surprise Result Card */}
        {surpriseDeal && (
          <div className="pt-2 animate-scale-up">
            <div className="bg-white rounded-2xl p-3 text-slate-900 shadow-2xl border-2 border-emerald-500 relative space-y-2.5">
              
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-950 uppercase">
                  🎉 Verified Local Offer
                </span>
                <span className="text-[10px] text-slate-500 font-bold">
                  1 of {matchCount} matched offers
                </span>
              </div>

              <div className="relative h-44 w-full rounded-xl overflow-hidden bg-slate-100">
                <img
                  src={surpriseDeal.image}
                  alt={surpriseDeal.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-2 left-2 text-xs font-black px-2.5 py-1 rounded-xl text-white bg-slate-950/85 backdrop-blur-md">
                  {surpriseDeal.price}
                </span>
                <span className="absolute top-2 right-2 text-[9px] font-black px-2 py-0.5 rounded-lg text-white bg-emerald-600">
                  {surpriseDeal.badge || 'VERIFIED DEAL'}
                </span>
              </div>

              <div>
                <h4 className="text-xs font-black text-slate-900 leading-snug line-clamp-1">
                  {surpriseDeal.title}
                </h4>
                <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                  📍 {surpriseDeal.location} • {surpriseDeal.shopName}
                </p>
              </div>

              <ActionButtons
                phone={surpriseDeal.phone || '9876543210'}
                whatsapp={surpriseDeal.whatsapp || surpriseDeal.phone || '919876543210'}
                message={`Namaste, I want to claim the offer "${surpriseDeal.title}" seen on TownHub Market.`}
              />

              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleRollSurprise}
                  className="text-[10px] font-black text-emerald-700 hover:text-emerald-800 cursor-pointer flex items-center space-x-1"
                >
                  <span>🔄</span>
                  <span>Shuffle Another Deal</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelect(surpriseDeal.subCategory || 'all')}
                  className="text-[10px] font-black text-slate-700 hover:text-slate-900 cursor-pointer"
                >
                  View All in Subcategory ➔
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 🌟 3. SECTOR SUBCATEGORY TILES (MATCHING REGISTRY) */}
      <section className="space-y-2.5 pt-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black text-slate-100 uppercase tracking-wider flex items-center space-x-1.5">
            <span>🛒</span>
            <span>Browse Market Departments</span>
          </h3>
          <span className="text-[10px] text-emerald-400 font-bold">
            {categoryConfig.subCategories.length} Subcategories
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
              <div className="text-xs font-black">All Market Deals</div>
              <div className="text-[9px] text-slate-400 font-normal">All listings & promotions</div>
            </div>
          </button>

          {categoryConfig.subCategories.map((sub) => (
            <button
              key={sub.id}
              type="button"
              onClick={() => handleSelect(sub.id)}
              className="p-3.5 bg-slate-900/90 hover:bg-slate-850 text-white rounded-2xl text-left font-bold shadow-sm hover:scale-[1.02] active:scale-95 transition cursor-pointer flex flex-col justify-between h-28 border border-slate-800 hover:border-emerald-500/50"
            >
              <div className="flex items-center justify-between">
                <span className="text-xl">🛍️</span>
                <span className="text-[8px] font-black px-1.5 py-0.2 rounded-md bg-emerald-500 text-slate-950 font-bold uppercase">
                  {getSubcategoryBadge(sub.id)}
                </span>
              </div>
              <div>
                <div className="text-xs font-black leading-tight text-slate-100">{sub.name.split('(')[0]}</div>
                <div className="text-[9px] text-slate-400 font-semibold mt-0.5 truncate">
                  {sub.name.match(/\((.*?)\)/)?.[1] || 'बाज़ार डील्स'}
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