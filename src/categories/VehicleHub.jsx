import React, { useState, useMemo } from 'react';
import { getCategoryById } from '../data/taxonomyRegistry';
import { useStoreSlice } from '../store/hyperlocalStore';
import ActionButtons from '../components/common/ActionButtons';
import CategoryListFreeBanner from '../components/common/CategoryListFreeBanner';

const VEHICLE_SEGMENT_FILTERS = [
  { id: 'all', label: 'All Segments' },
  { id: 'car-showrooms', label: '🚘 SUVs & Cars' },
  { id: 'bike-showrooms', label: '🏍️ Bikes & Cruisers' },
  { id: 'scooters-hub', label: '🛵 Scooters' },
  { id: 'electric-ev-hub', label: '⚡ Electric EVs' },
  { id: 'modifications-custom', label: '✨ Modifications & PPF' },
  { id: 'servicing-workshops', label: '🔧 Service & Repairs' },
  { id: 'loans-insurance', label: '📑 Loans & Insurance' },
  { id: 'commercial-pickups', label: '🚚 Pickups & Trucks' },
  { id: 'tractors-agri', label: '🚜 Tractors & Agri' },
];

const FUEL_DRIVE_FILTERS = [
  { id: 'all', label: 'All Fuel / Service Types' },
  { id: 'petrol-diesel', label: '⛽ Petrol / Turbo Diesel' },
  { id: 'electric-green', label: '🔋 100% Electric EV' },
  { id: 'cng-hybrid', label: '🌱 Factory CNG / Hybrid' },
  { id: 'service-mod', label: '🛠️ Modification & Workshop' },
  { id: 'finance-loan', label: '💳 Loans & Paperwork' },
];

const DEAL_PERK_FILTERS = [
  { id: 'all', label: 'All Showroom Perks' },
  { id: 'zero-emi', label: '💳 0% Downpayment / Low EMI' },
  { id: 'exchange-bonus', label: '🔄 Exchange Bonus up to ₹50K' },
  { id: 'home-test-drive', label: '🏠 Free Doorstep Test Drive' },
  { id: 'warranty-certified', label: '🛡️ 5-Yr Official Warranty' },
  { id: 'instant-delivery', label: '⚡ Same-Day Delivery' },
];

export default function VehicleHub({
  selectedCity = 'Alwar',
  onSelectSubCategory,
  onSelectVehicleType,
  onPostClick,
  onBack,
}) {
  const categoryConfig = getCategoryById('vehicles');
  const storeListings = useStoreSlice('listings');

  // Filter Matrix States
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [selectedFuel, setSelectedFuel] = useState('all');
  const [selectedPerk, setSelectedPerk] = useState('all');

  // Surprise State
  const [surpriseVehicle, setSurpriseVehicle] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [matchCount, setMatchCount] = useState(0);

  const handleSelect = (subId) => {
    if (typeof onSelectSubCategory === 'function') {
      onSelectSubCategory(subId);
    } else if (typeof onSelectVehicleType === 'function') {
      onSelectVehicleType(subId);
    }
  };

  // Filter only vehicles pool
  const vehiclePool = useMemo(() => {
    return (storeListings || []).filter((item) => {
      const cat = (item.category || '').toLowerCase().trim();
      return cat === 'vehicles';
    });
  }, [storeListings]);

  // Compute Matched Pool
  const matchedVehicles = useMemo(() => {
    return vehiclePool.filter((item) => {
      const sub = (item.subCategory || '').toLowerCase();
      const fuel = (item.fuelType || '').toLowerCase();
      const perk = (item.dealPerk || '').toLowerCase();

      const matchesSegment = selectedSegment === 'all' || sub === selectedSegment;
      const matchesFuel = selectedFuel === 'all' || fuel === selectedFuel;
      const matchesPerk = selectedPerk === 'all' || perk === selectedPerk;

      return matchesSegment && matchesFuel && matchesPerk;
    });
  }, [vehiclePool, selectedSegment, selectedFuel, selectedPerk]);

  // Roll Surprise Ride
  const handleRollSurprise = () => {
    setIsSpinning(true);
    setSurpriseVehicle(null);

    setTimeout(() => {
      const pool = matchedVehicles.length > 0 ? matchedVehicles : vehiclePool;
      if (pool && pool.length > 0) {
        const randomIndex = Math.floor(Math.random() * pool.length);
        setSurpriseVehicle(pool[randomIndex]);
        setMatchCount(pool.length);
      }
      setIsSpinning(false);
    }, 450);
  };

  return (
    <div className="p-3.5 space-y-4 animate-fade-in text-slate-100 pb-10">
      
      {/* 🌟 1. ASPHALT & CHROME MOTOR SHOWROOM HEADER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-4 border border-blue-500/30 shadow-2xl">
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-blue-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-10 w-32 h-32 bg-amber-500 rounded-full blur-2xl opacity-15 pointer-events-none"></div>

        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[10px] font-black uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping"></span>
              <span>Automobile Showrooms & Hub • {selectedCity}</span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white mt-1 flex items-center space-x-1.5">
              <span>🏎️ Automobiles</span>
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                Showrooms & Care
              </span>
            </h2>
            <p className="text-[11px] text-blue-200/80">
              New Dealerships, Custom Modifications, Garages, Loans & 24x7 Roadside Help
            </p>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="text-xs bg-white/10 hover:bg-white/20 text-blue-100 px-3 py-1.5 rounded-xl font-bold backdrop-blur-md active:scale-95 transition cursor-pointer border border-white/10"
          >
            ← Town Hub
          </button>
        </div>

        {/* Highlights Banner Strip */}
        <div className="grid grid-cols-4 gap-2 mt-3 pt-2.5 border-t border-white/10 text-center">
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-amber-300">🔑 Test Drive</div>
            <div className="text-[8px] text-slate-400 font-semibold">At Your Home</div>
          </div>
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-blue-300">💳 0% EMI</div>
            <div className="text-[8px] text-slate-400 font-semibold">Instant Loans</div>
          </div>
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-emerald-300">✨ Custom Mods</div>
            <div className="text-[8px] text-slate-400 font-semibold">PPF & Wraps</div>
          </div>
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-rose-300">🚨 24x7 Towing</div>
            <div className="text-[8px] text-slate-400 font-semibold">Fast Roadside</div>
          </div>
        </div>
      </div>

      {/* 🌟 2. HIGHLIGHTED "VEHICLE LOAN & MOTOR INSURANCE DESK" BANNER */}
      <div className="p-3.5 bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 border border-cyan-400/40 rounded-2xl shadow-lg flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl p-2 bg-blue-500/20 border border-blue-400/30 rounded-xl">📑</span>
          <div>
            <div className="inline-flex items-center space-x-1.5">
              <span className="text-xs font-black text-amber-300 uppercase">Auto Finance & Insurance Desk</span>
              <span className="text-[8px] font-black px-1.5 py-0.2 bg-emerald-500 text-slate-950 rounded-md">LOWEST ROI</span>
            </div>
            <p className="text-[10px] text-slate-300 mt-0.5">
              Instant car/bike loan sanction, zero downpayment schemes & cashless claims in {selectedCity}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => handleSelect('loans-insurance')}
          className="text-[11px] font-black bg-cyan-400 hover:bg-cyan-300 text-slate-950 px-3 py-1.5 rounded-xl shrink-0 active:scale-95 transition cursor-pointer shadow-md shadow-cyan-400/20"
        >
          Explore Rates ➔
        </button>
      </div>

      {/* 🌟 3. INTERACTIVE "SURPRISE ME • AUTOMOBILE & RIDE MATCHER" */}
      <section className="bg-gradient-to-b from-slate-900 via-slate-900 to-blue-950/40 p-4 rounded-3xl border border-blue-500/30 shadow-xl space-y-3.5 relative overflow-hidden">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🏎️</span>
            <div>
              <h3 className="text-xs font-black text-amber-300 uppercase tracking-wider">
                Surprise Me • Automobile & Ride Matcher
              </h3>
              <p className="text-[10px] text-slate-400">
                Filter by segment or service & get the best showroom on-road quote
              </p>
            </div>
          </div>

          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-400/30">
            {matchedVehicles.length} Automobile Deals
          </span>
        </div>

        {/* Filter 1: Vehicle Segment & Services */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            1. Vehicle Variety / Service Hub
          </label>
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
            {VEHICLE_SEGMENT_FILTERS.map((seg) => (
              <button
                key={seg.id}
                type="button"
                onClick={() => setSelectedSegment(seg.id)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold shrink-0 transition cursor-pointer ${
                  selectedSegment === seg.id
                    ? 'bg-blue-500 text-white font-black shadow-sm scale-105'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {seg.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter 2: Powertrain & Category */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            2. Powertrain & Category Type
          </label>
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
            {FUEL_DRIVE_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedFuel(f.id)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold shrink-0 transition cursor-pointer ${
                  selectedFuel === f.id
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-sm scale-105'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter 3: Showroom Perk */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            3. Dealership Perk & Financing Scheme
          </label>
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
            {DEAL_PERK_FILTERS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPerk(p.id)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold shrink-0 transition cursor-pointer ${
                  selectedPerk === p.id
                    ? 'bg-amber-400 text-slate-950 font-black shadow-sm scale-105'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Trigger Button */}
        <button
          type="button"
          onClick={handleRollSurprise}
          disabled={isSpinning}
          className={`w-full py-2.5 px-4 rounded-2xl font-black text-xs shadow-lg active:scale-95 transition cursor-pointer flex items-center justify-center space-x-2 border border-blue-400/40 ${
            isSpinning
              ? 'bg-slate-800 text-slate-400 animate-pulse cursor-wait'
              : 'bg-gradient-to-r from-blue-500 via-indigo-600 to-amber-500 hover:from-blue-400 hover:to-amber-400 text-white font-black shadow-blue-500/20'
          }`}
        >
          <span className={`text-base ${isSpinning ? 'animate-spin' : ''}`}>⚡</span>
          <span>{isSpinning ? 'Revving Up Best Deal...' : 'Surprise Me with a Ride / Test Drive!'}</span>
        </button>

        {/* Surprise Result Card */}
        {surpriseVehicle && (
          <div className="pt-2 animate-scale-up">
            <div className="bg-white rounded-2xl p-3 text-slate-900 shadow-2xl border-2 border-blue-500 relative space-y-2.5">
              
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-blue-100 text-blue-950 uppercase">
                  🏎️ Featured Automotive Match
                </span>
                <span className="text-[10px] text-slate-500 font-bold">
                  1 of {matchCount} matched options
                </span>
              </div>

              <div className="relative h-44 w-full rounded-xl overflow-hidden bg-slate-100">
                <img
                  src={surpriseVehicle.image || (surpriseVehicle.images && surpriseVehicle.images[0])}
                  alt={surpriseVehicle.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-2 left-2 text-xs font-black px-2.5 py-1 rounded-xl text-white bg-slate-950/85 backdrop-blur-md">
                  {surpriseVehicle.price}
                </span>
                <span className="absolute top-2 right-2 text-[9px] font-black px-2 py-0.5 rounded-lg text-white bg-blue-600">
                  {surpriseVehicle.badge || 'OFFICIAL DEALERSHIP'}
                </span>
              </div>

              <div>
                <h4 className="text-xs font-black text-slate-900 leading-snug line-clamp-1">
                  {surpriseVehicle.title}
                </h4>
                <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                  📍 {surpriseVehicle.location} • {surpriseVehicle.sellerName}
                </p>
              </div>

              <ActionButtons
                phone={surpriseVehicle.phone || '9876543210'}
                whatsapp={surpriseVehicle.whatsapp || surpriseVehicle.phone || '919876543210'}
                message={`Namaste, I want to book a Test Drive / get quotation for "${surpriseVehicle.title}" on TownHub Automobiles.`}
              />

              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleRollSurprise}
                  className="text-[10px] font-black text-blue-700 hover:text-blue-800 cursor-pointer flex items-center space-x-1"
                >
                  <span>🔄</span>
                  <span>Shuffle Another Match</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelect(surpriseVehicle.subCategory || 'all')}
                  className="text-[10px] font-black text-slate-700 hover:text-slate-900 cursor-pointer"
                >
                  View All in Subcategory ➔
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 🌟 4. SECTOR SUBCATEGORY TILES (12 COMPREHENSIVE AUTOMOTIVE SECTORS) */}
      <section className="space-y-2.5 pt-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black text-slate-100 uppercase tracking-wider flex items-center space-x-1.5">
            <span>🏎️</span>
            <span>Browse Automobiles & Showrooms</span>
          </h3>
          <span className="text-[10px] text-blue-400 font-bold">
            {categoryConfig.subCategories.length} Specialized Sectors
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
              <div className="text-xs font-black">All Automobiles</div>
              <div className="text-[9px] text-slate-400 font-normal">Showrooms, mods & services</div>
            </div>
          </button>

          {categoryConfig.subCategories.map((sub) => (
            <button
              key={sub.id}
              type="button"
              onClick={() => handleSelect(sub.id)}
              className="p-3.5 bg-slate-900/90 hover:bg-slate-850 text-white rounded-2xl text-left font-bold shadow-sm hover:scale-[1.02] active:scale-95 transition cursor-pointer flex flex-col justify-between h-28 border border-slate-800 hover:border-blue-500/50"
            >
              <div className="flex items-center justify-between">
                <span className="text-xl">{sub.icon || '🚗'}</span>
                <span className="text-[8px] font-black px-1.5 py-0.2 rounded-md bg-blue-500 text-white font-bold uppercase">
                  {sub.tag || 'DEAL'}
                </span>
              </div>
              <div>
                <div className="text-xs font-black leading-tight text-slate-100">{sub.name.split('(')[0]}</div>
                <div className="text-[9px] text-slate-400 font-semibold mt-0.5 truncate">
                  {sub.name.match(/\((.*?)\)/)?.[1] || 'ऑटोमोबाइल'}
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