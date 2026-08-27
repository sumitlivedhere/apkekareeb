import React, { useState, useMemo } from 'react';
import { getCategoryById } from '../data/taxonomyRegistry';
import { useStoreSlice } from '../store/hyperlocalStore';
import ActionButtons from '../components/common/ActionButtons';
import CategoryListFreeBanner from '../components/common/CategoryListFreeBanner';
const ROOM_ZONE_FILTERS = [
  { id: 'all', label: 'All Spaces' },
  { id: 'living', label: '🛋️ Living Room' },
  { id: 'bedroom', label: '🛏️ Bedroom' },
  { id: 'kitchen', label: '🍳 Modular Kitchen' },
  { id: 'dining-office', label: '🪑 Dining & Office' },
  { id: 'decor', label: '✨ Decor & Glass' },
];

const MATERIAL_FILTERS = [
  { id: 'all', label: 'All Materials' },
  { id: 'sheesham-teak', label: '🪵 Solid Sheesham / Teak' },
  { id: 'fabric-velvet', label: '🧵 Velvet / High Density Foam' },
  { id: 'eng-wood', label: '🪵 HDHMR / Modular Board' },
  { id: 'glass-upvc', label: '🪟 Toughened Glass & UPVC' },
];

const STYLE_GOAL_FILTERS = [
  { id: 'all', label: 'All Styles' },
  { id: 'solid-wood', label: '👑 Royal Solid Woodwork' },
  { id: 'modern-minimal', label: '⚡ Modern Minimalist' },
  { id: 'custom-interior', label: '📐 Custom Full-Home Interior' },
  { id: 'budget-deal', label: '🏷️ Budget / Ready-Made Pick' },
];

export default function FurnitureHub({
  selectedCity = 'Alwar',
  onSelectSubCategory,
  onSelectFurnitureType,
  onPostClick,
  onBack,
}) {
  const categoryConfig = getCategoryById('furniture');
  const storeListings = useStoreSlice('listings');

  // Filter Matrix States
  const [selectedZone, setSelectedZone] = useState('all');
  const [selectedMaterial, setSelectedMaterial] = useState('all');
  const [selectedGoal, setSelectedGoal] = useState('all');

  // Surprise State
  const [surpriseItem, setSurpriseItem] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [matchCount, setMatchCount] = useState(0);

  const handleSelect = (subId) => {
    if (typeof onSelectSubCategory === 'function') {
      onSelectSubCategory(subId);
    } else if (typeof onSelectFurnitureType === 'function') {
      onSelectFurnitureType(subId);
    }
  };

  // Extract Furniture Pool
  const furniturePool = useMemo(() => {
    return (storeListings || []).filter((item) => {
      const cat = (item.category || '').toLowerCase().trim();
      return cat === 'furniture';
    });
  }, [storeListings]);

  // Compute Matched Pool
  const matchedFurniture = useMemo(() => {
    return furniturePool.filter((item) => {
      const zone = (item.roomZone || '').toLowerCase();
      const mat = (item.materialType || '').toLowerCase();
      const goal = (item.budgetGoal || '').toLowerCase();

      const matchesZone = selectedZone === 'all' || zone === selectedZone;
      const matchesMat = selectedMaterial === 'all' || mat === selectedMaterial;
      const matchesGoal = selectedGoal === 'all' || goal === selectedGoal;

      return matchesZone && matchesMat && matchesGoal;
    });
  }, [furniturePool, selectedZone, selectedMaterial, selectedGoal]);

  // Roll Surprise Decor Piece
  const handleRollSurprise = () => {
    setIsSpinning(true);
    setSurpriseItem(null);

    setTimeout(() => {
      const pool = matchedFurniture.length > 0 ? matchedFurniture : furniturePool;
      if (pool && pool.length > 0) {
        const randomIndex = Math.floor(Math.random() * pool.length);
        setSurpriseItem(pool[randomIndex]);
        setMatchCount(pool.length);
      }
      setIsSpinning(false);
    }, 450);
  };

  const getSubcategoryBadge = (subId) => {
    switch (subId) {
      case 'modular-kitchen': return 'CUSTOM FIT';
      case 'interior-decorators': return '3D DESIGN';
      case 'glass-aluminium': return 'SOUNDPROOF';
      case 'sofas-living': return '40D FOAM';
      case 'beds-wardrobes': return 'SHEESHAM';
      case 'dining-tables': return 'SOLID WOOD';
      case 'home-decor-curtains': return 'HANDLOOM';
      default: return 'FURNITURE';
    }
  };

  return (
    <div className="p-3.5 space-y-4 animate-fade-in text-slate-100 pb-10">
      
      {/* 🌟 1. EDITORIAL LUXURY FURNITURE HEADER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-950 via-stone-950 to-slate-950 p-4 border border-amber-500/30 shadow-2xl">
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-10 w-32 h-32 bg-orange-600 rounded-full blur-2xl opacity-15 pointer-events-none"></div>

        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[10px] font-black uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
              <span>Furniture & Interior Studio • {selectedCity}</span>
            </div>
            <h2 className="text-lg font-black tracking-tight text-white mt-1">
              Furniture & Home Decor
            </h2>
            <p className="text-[11px] text-amber-200/80">
              Modular kitchens, solid Sheesham beds, velvet sofas & turnkey interiors
            </p>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="text-xs bg-white/10 hover:bg-white/20 text-amber-100 px-3 py-1.5 rounded-xl font-bold backdrop-blur-md active:scale-95 transition cursor-pointer border border-white/10"
          >
            ← Town Hub
          </button>
        </div>

        {/* Highlight Quality Strip */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-white/10 text-center">
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-amber-300">🪵 Pure Sheesham</div>
            <div className="text-[9px] text-slate-400 font-semibold">100% Solid Wood</div>
          </div>
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-orange-300">📐 Custom Sizes</div>
            <div className="text-[9px] text-slate-400 font-semibold">Made-to-Order</div>
          </div>
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-emerald-300">🚚 Direct Drop</div>
            <div className="text-[9px] text-slate-400 font-semibold">Zero Middlemen</div>
          </div>
        </div>
      </div>

      {/* 🌟 2. INTERACTIVE "SURPRISE ME • ROOM DECOR MATCHER" */}
      <section className="bg-gradient-to-b from-slate-900 via-slate-900 to-amber-950/40 p-4 rounded-3xl border border-amber-500/30 shadow-xl space-y-3.5 relative overflow-hidden">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🛋️</span>
            <div>
              <h3 className="text-xs font-black text-amber-300 uppercase tracking-wider">
                Surprise Me • Room Decor Matcher
              </h3>
              <p className="text-[10px] text-slate-400">
                Pick your room zone & let the engine suggest the centerpiece
              </p>
            </div>
          </div>

          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-400/30">
            {matchedFurniture.length} Pieces Ready
          </span>
        </div>

        {/* Filter 1: Room Space */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            1. Room Space / Living Zone
          </label>
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
            {ROOM_ZONE_FILTERS.map((rz) => (
              <button
                key={rz.id}
                type="button"
                onClick={() => setSelectedZone(rz.id)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold shrink-0 transition cursor-pointer ${
                  selectedZone === rz.id
                    ? 'bg-amber-400 text-slate-950 font-black shadow-sm scale-105'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {rz.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter 2: Material & Craft */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            2. Material & Craftsmanship
          </label>
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
            {MATERIAL_FILTERS.map((mf) => (
              <button
                key={mf.id}
                type="button"
                onClick={() => setSelectedMaterial(mf.id)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold shrink-0 transition cursor-pointer ${
                  selectedMaterial === mf.id
                    ? 'bg-orange-500 text-white font-black shadow-sm scale-105'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {mf.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter 3: Style Goal */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            3. Interior Style & Budget Goal
          </label>
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
            {STYLE_GOAL_FILTERS.map((sg) => (
              <button
                key={sg.id}
                type="button"
                onClick={() => setSelectedGoal(sg.id)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold shrink-0 transition cursor-pointer ${
                  selectedGoal === sg.id
                    ? 'bg-amber-500 text-slate-950 font-black shadow-sm scale-105'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {sg.label}
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
              : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black shadow-amber-500/20'
          }`}
        >
          <span className={`text-base ${isSpinning ? 'animate-spin' : ''}`}>✨</span>
          <span>{isSpinning ? 'Styling Your Room Match...' : 'Surprise Me with a Furniture Piece!'}</span>
        </button>

        {/* Surprise Result Card */}
        {surpriseItem && (
          <div className="pt-2 animate-scale-up">
            <div className="bg-white rounded-2xl p-3 text-slate-900 shadow-2xl border-2 border-amber-500 relative space-y-2.5">
              
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-950 uppercase">
                  👑 Curated Interior Piece
                </span>
                <span className="text-[10px] text-slate-500 font-bold">
                  1 of {matchCount} matched options
                </span>
              </div>

              <div className="relative h-44 w-full rounded-xl overflow-hidden bg-slate-100">
                <img
                  src={surpriseItem.image || (surpriseItem.images && surpriseItem.images[0])}
                  alt={surpriseItem.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-2 left-2 text-xs font-black px-2.5 py-1 rounded-xl text-white bg-slate-950/85 backdrop-blur-md">
                  {surpriseItem.price}
                </span>
                <span className="absolute top-2 right-2 text-[9px] font-black px-2 py-0.5 rounded-lg text-white bg-amber-600">
                  {surpriseItem.badge || 'SOLID WOOD'}
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
                message={`Namaste, I want to inquire about purchasing/customizing "${surpriseItem.title}" on TownHub Furniture.`}
              />

              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleRollSurprise}
                  className="text-[10px] font-black text-amber-700 hover:text-amber-800 cursor-pointer flex items-center space-x-1"
                >
                  <span>🔄</span>
                  <span>Shuffle Another Piece</span>
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

      {/* 🌟 3. SECTOR SUBCATEGORY TILES */}
      <section className="space-y-2.5 pt-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black text-slate-100 uppercase tracking-wider flex items-center space-x-1.5">
            <span>🛋️</span>
            <span>Browse All Furniture Departments</span>
          </h3>
          <span className="text-[10px] text-amber-400 font-bold">
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
              <div className="text-xs font-black">All Furniture</div>
              <div className="text-[9px] text-slate-400 font-normal">All woodwork & decor</div>
            </div>
          </button>

          {categoryConfig.subCategories.map((sub) => (
            <button
              key={sub.id}
              type="button"
              onClick={() => handleSelect(sub.id)}
              className="p-3.5 bg-slate-900/90 hover:bg-slate-850 text-white rounded-2xl text-left font-bold shadow-sm hover:scale-[1.02] active:scale-95 transition cursor-pointer flex flex-col justify-between h-28 border border-slate-800 hover:border-amber-500/50"
            >
              <div className="flex items-center justify-between">
                <span className="text-xl">🪑</span>
                <span className="text-[8px] font-black px-1.5 py-0.2 rounded-md bg-amber-500 text-slate-950 font-bold uppercase">
                  {getSubcategoryBadge(sub.id)}
                </span>
              </div>
              <div>
                <div className="text-xs font-black leading-tight text-slate-100">{sub.name.split('(')[0]}</div>
                <div className="text-[9px] text-slate-400 font-semibold mt-0.5 truncate">
                  {sub.name.match(/\((.*?)\)/)?.[1] || 'फर्नीचर'}
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