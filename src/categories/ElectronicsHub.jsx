import React, { useState, useMemo } from 'react';
import { getCategoryById } from '../data/taxonomyRegistry';
import { useStoreSlice } from '../store/hyperlocalStore';
import ActionButtons from '../components/common/ActionButtons';
import CategoryListFreeBanner from '../components/common/CategoryListFreeBanner';

const DEVICE_CATEGORY_FILTERS = [
  { id: 'all', label: 'All Gadgets' },
  { id: 'smartphones', label: '📱 Phones & Tabs' },
  { id: 'laptops', label: '💻 Laptops & PCs' },
  { id: 'appliances', label: '📺 TV & ACs' },
  { id: 'wearables', label: '🎧 Audio & Smartwatches' },
  { id: 'security', label: '📹 CCTV & Cameras' },
  { id: 'services', label: '🔧 Repairs & Service' },
];

const USE_CASE_FILTERS = [
  { id: 'all', label: 'All Use Cases' },
  { id: 'gaming-coding', label: '⚡ Gaming & Heavy Coding' },
  { id: 'flagship-camera', label: '📸 Flagship Photography' },
  { id: 'student-office', label: '💼 Student & Office Work' },
  { id: 'home-entertainment', label: '🍿 Cinema & Entertainment' },
  { id: 'home-security', label: '🛡️ CCTV & Surveillance' },
  { id: 'repair-service', label: '🛠️ Express Repair' },
];

const WARRANTY_FILTERS = [
  { id: 'all', label: 'All Purchase Perks' },
  { id: 'brand-warranty', label: '🛡️ Official Brand Warranty' },
  { id: 'emi-available', label: '💳 0% EMI & Financing' },
  { id: 'installation-included', label: '🔧 Free Installation' },
  { id: 'repair-warranty', label: '🏷️ 30-Day Service Guarantee' },
];

export default function ElectronicsHub({
  selectedCity = 'Alwar',
  onSelectSubCategory,
  onSelectElectronicsType,
  onPostClick,
  onBack,
}) {
  const categoryConfig = getCategoryById('electronics');
  const storeListings = useStoreSlice('listings');

  // Filter Matrix States
  const [selectedDevice, setSelectedDevice] = useState('all');
  const [selectedUseCase, setSelectedUseCase] = useState('all');
  const [selectedWarranty, setSelectedWarranty] = useState('all');

  // Surprise Gadget State
  const [surpriseGadget, setSurpriseGadget] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [matchCount, setMatchCount] = useState(0);

  const handleSelect = (subId) => {
    if (typeof onSelectSubCategory === 'function') {
      onSelectSubCategory(subId);
    } else if (typeof onSelectElectronicsType === 'function') {
      onSelectElectronicsType(subId);
    }
  };

  // Extract Electronics Pool
  const electronicsPool = useMemo(() => {
    return (storeListings || []).filter((item) => {
      const cat = (item.category || '').toLowerCase().trim();
      return cat === 'electronics';
    });
  }, [storeListings]);

  // Compute Matched Pool
  const matchedGadgets = useMemo(() => {
    return electronicsPool.filter((item) => {
      const dev = (item.deviceCategory || '').toLowerCase();
      const use = (item.useCase || '').toLowerCase();
      const war = (item.warrantyType || '').toLowerCase();

      const matchesDev = selectedDevice === 'all' || dev === selectedDevice;
      const matchesUse = selectedUseCase === 'all' || use === selectedUseCase;
      const matchesWar = selectedWarranty === 'all' || war === selectedWarranty;

      return matchesDev && matchesUse && matchesWar;
    });
  }, [electronicsPool, selectedDevice, selectedUseCase, selectedWarranty]);

  // Roll Surprise Gadget
  const handleRollSurprise = () => {
    setIsSpinning(true);
    setSurpriseGadget(null);

    setTimeout(() => {
      const pool = matchedGadgets.length > 0 ? matchedGadgets : electronicsPool;
      if (pool && pool.length > 0) {
        const randomIndex = Math.floor(Math.random() * pool.length);
        setSurpriseGadget(pool[randomIndex]);
        setMatchCount(pool.length);
      }
      setIsSpinning(false);
    }, 450);
  };

  const getSubcategoryBadge = (subId) => {
    switch (subId) {
      case 'smartphones-tablets': return '5G PHONES';
      case 'laptops-computers': return 'RTX & M3';
      case 'home-appliances': return '4K & SMART';
      case 'audio-wearables': return 'HI-RES ANC';
      case 'cameras-cctv': return 'HD NIGHT VISION';
      case 'printers-accessories': return 'WIFI INK TANK';
      case 'service-centers': return 'CHIP-LEVEL';
      default: return 'TECH';
    }
  };

  return (
    <div className="p-3.5 space-y-4 animate-fade-in text-slate-100 pb-10">
      
      {/* 🌟 1. CYBER TECH GLAMOUR HEADER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-cyan-950 to-blue-950 p-4 border border-cyan-500/30 shadow-2xl">
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-cyan-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-10 w-32 h-32 bg-blue-600 rounded-full blur-2xl opacity-15 pointer-events-none"></div>

        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-[10px] font-black uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
              <span>Electronics & Gadgets Hub • {selectedCity}</span>
            </div>
            <h2 className="text-lg font-black tracking-tight text-white mt-1">
              Smart Tech & Appliances
            </h2>
            <p className="text-[11px] text-cyan-200/80">
              Smartphones, gaming laptops, smart 4K TVs, CCTV security & chip repairs
            </p>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="text-xs bg-white/10 hover:bg-white/20 text-cyan-100 px-3 py-1.5 rounded-xl font-bold backdrop-blur-md active:scale-95 transition cursor-pointer border border-white/10"
          >
            ← Town Hub
          </button>
        </div>

        {/* Highlight Quality Strip */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-white/10 text-center">
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-cyan-300">📱 100% Genuine</div>
            <div className="text-[9px] text-slate-400 font-semibold">Official Invoices</div>
          </div>
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-blue-300">💳 0% EMI Loans</div>
            <div className="text-[9px] text-slate-400 font-semibold">Instant Approvals</div>
          </div>
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-emerald-300">🛠️ Same-Day Fix</div>
            <div className="text-[9px] text-slate-400 font-semibold">Verified Techs</div>
          </div>
        </div>
      </div>

      {/* 🌟 2. INTERACTIVE "SURPRISE ME • GADGET MATCH ENGINE" */}
      <section className="bg-gradient-to-b from-slate-900 via-slate-900 to-cyan-950/40 p-4 rounded-3xl border border-cyan-500/30 shadow-xl space-y-3.5 relative overflow-hidden">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl">⚡</span>
            <div>
              <h3 className="text-xs font-black text-cyan-300 uppercase tracking-wider">
                Surprise Me • Gadget Matcher
              </h3>
              <p className="text-[10px] text-slate-400">
                Filter by your use case & discover the perfect device setup
              </p>
            </div>
          </div>

          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
            {matchedGadgets.length} Devices Ready
          </span>
        </div>

        {/* Filter 1: Device Category */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            1. Device Category / Ecosystem
          </label>
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
            {DEVICE_CATEGORY_FILTERS.map((dev) => (
              <button
                key={dev.id}
                type="button"
                onClick={() => setSelectedDevice(dev.id)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold shrink-0 transition cursor-pointer ${
                  selectedDevice === dev.id
                    ? 'bg-cyan-400 text-slate-950 font-black shadow-sm scale-105'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {dev.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter 2: Use Case / Workload */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            2. Tech Goal / Workload
          </label>
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
            {USE_CASE_FILTERS.map((uc) => (
              <button
                key={uc.id}
                type="button"
                onClick={() => setSelectedUseCase(uc.id)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold shrink-0 transition cursor-pointer ${
                  selectedUseCase === uc.id
                    ? 'bg-blue-500 text-white font-black shadow-sm scale-105'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {uc.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter 3: Warranty / Deal Perks */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            3. Financing & Warranty Perk
          </label>
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
            {WARRANTY_FILTERS.map((wf) => (
              <button
                key={wf.id}
                type="button"
                onClick={() => setSelectedWarranty(wf.id)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold shrink-0 transition cursor-pointer ${
                  selectedWarranty === wf.id
                    ? 'bg-amber-400 text-slate-950 font-black shadow-sm scale-105'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {wf.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Trigger Button */}
        <button
          type="button"
          onClick={handleRollSurprise}
          disabled={isSpinning}
          className={`w-full py-2.5 px-4 rounded-2xl font-black text-xs shadow-lg active:scale-95 transition cursor-pointer flex items-center justify-center space-x-2 border border-cyan-400/40 ${
            isSpinning
              ? 'bg-slate-800 text-slate-400 animate-pulse cursor-wait'
              : 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black shadow-cyan-500/20'
          }`}
        >
          <span className={`text-base ${isSpinning ? 'animate-spin' : ''}`}>⚡</span>
          <span>{isSpinning ? 'Scanning Tech Catalogs...' : 'Surprise Me with a Tech Setup / Device!'}</span>
        </button>

        {/* Surprise Result Card */}
        {surpriseGadget && (
          <div className="pt-2 animate-scale-up">
            <div className="bg-white rounded-2xl p-3 text-slate-900 shadow-2xl border-2 border-cyan-500 relative space-y-2.5">
              
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-cyan-100 text-cyan-950 uppercase">
                  ⚡ Curated Tech Recommendation
                </span>
                <span className="text-[10px] text-slate-500 font-bold">
                  1 of {matchCount} matched gadgets
                </span>
              </div>

              <div className="relative h-44 w-full rounded-xl overflow-hidden bg-slate-100">
                <img
                  src={surpriseGadget.image || (surpriseGadget.images && surpriseGadget.images[0])}
                  alt={surpriseGadget.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-2 left-2 text-xs font-black px-2.5 py-1 rounded-xl text-white bg-slate-950/85 backdrop-blur-md">
                  {surpriseGadget.price}
                </span>
                <span className="absolute top-2 right-2 text-[9px] font-black px-2 py-0.5 rounded-lg text-white bg-cyan-600">
                  {surpriseGadget.badge || 'VERIFIED DEAL'}
                </span>
              </div>

              <div>
                <h4 className="text-xs font-black text-slate-900 leading-snug line-clamp-1">
                  {surpriseGadget.title}
                </h4>
                <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                  📍 {surpriseGadget.location} • {surpriseGadget.sellerName}
                </p>
              </div>

              <ActionButtons
                phone={surpriseGadget.phone || '9876543210'}
                whatsapp={surpriseGadget.whatsapp || surpriseGadget.phone || '919876543210'}
                message={`Namaste, I want to inquire about purchasing/booking "${surpriseGadget.title}" on TownHub Electronics.`}
              />

              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleRollSurprise}
                  className="text-[10px] font-black text-cyan-700 hover:text-cyan-800 cursor-pointer flex items-center space-x-1"
                >
                  <span>🔄</span>
                  <span>Shuffle Another Gadget</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelect(surpriseGadget.subCategory || 'all')}
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
            <span>📱</span>
            <span>Browse All Gadget Departments</span>
          </h3>
          <span className="text-[10px] text-cyan-400 font-bold">
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
              <div className="text-xs font-black">All Electronics</div>
              <div className="text-[9px] text-slate-400 font-normal">All gadgets, tech & repairs</div>
            </div>
          </button>

          {categoryConfig.subCategories.map((sub) => (
            <button
              key={sub.id}
              type="button"
              onClick={() => handleSelect(sub.id)}
              className="p-3.5 bg-slate-900/90 hover:bg-slate-850 text-white rounded-2xl text-left font-bold shadow-sm hover:scale-[1.02] active:scale-95 transition cursor-pointer flex flex-col justify-between h-28 border border-slate-800 hover:border-cyan-500/50"
            >
              <div className="flex items-center justify-between">
                <span className="text-xl">💻</span>
                <span className="text-[8px] font-black px-1.5 py-0.2 rounded-md bg-cyan-500 text-slate-950 font-bold uppercase">
                  {getSubcategoryBadge(sub.id)}
                </span>
              </div>
              <div>
                <div className="text-xs font-black leading-tight text-slate-100">{sub.name.split('(')[0]}</div>
                <div className="text-[9px] text-slate-400 font-semibold mt-0.5 truncate">
                  {sub.name.match(/\((.*?)\)/)?.[1] || 'गैजेट्स'}
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