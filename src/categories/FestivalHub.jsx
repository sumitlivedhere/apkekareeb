import React, { useState } from 'react';
import { getCategoryById } from '../data/taxonomyRegistry';

const FESTIVAL_SKINS = [
  {
    id: 'diwali',
    name: '🪔 Diwali & Dhanteras (दीपावली व धनतेरस)',
    tagline: 'Deepawali Shopping, Gold, Auto, Kalakand & Clay Diyas',
    themeGradient: 'from-[#800d1e] via-[#4d0712] to-[#230208]',
    pillText: '🪔 Deepawali Mahotsav Live in Alwar',
  },
  {
    id: 'navratri',
    name: '💃 Navratri & Dussehra (नवरात्रि व दशहरा)',
    tagline: 'Dandiya Nights, Ramlila Passes & Puja Vehicle Delivery',
    themeGradient: 'from-[#7c2d12] via-[#451a03] to-[#1c0a00]',
    pillText: '💃 Dandiya & Dussehra Mela Active',
  },
  {
    id: 'teej',
    name: '🌸 Haryali Teej & Rakhi (तीज व रक्षाबंधन)',
    tagline: 'Malakhera Gate Ghewar, Bajaja Bazaar Lehariya & Mehendi',
    themeGradient: 'from-[#831843] via-[#500724] to-[#1f020d]',
    pillText: '🌸 Shahi Ghewar & Lehariya Specials',
  },
  {
    id: 'matsya',
    name: '🎪 Matsya Utsav & City Melas (मत्स्य उत्सव व मेले)',
    tagline: 'Heritage Tourism, Local Handcrafts & Jagannath Mela',
    themeGradient: 'from-[#1e1b4b] via-[#0f0e26] to-[#08071a]',
    pillText: '🎪 Alwar Matsya Festival Specials',
  },
  {
    id: 'all',
    name: '🏷️ All Town Deals & Offers (शहर के सभी ऑफर्स)',
    tagline: 'Year-Round Verified Local Town Discounts & Store Sales',
    themeGradient: 'from-[#1e293b] via-[#0f172a] to-[#020617]',
    pillText: '🏷️ 100% Verified Alwar Local Store Deals',
  },
];

const SUBCATEGORY_DETAILS = {
  'all': {
    tagline: 'All Verified Alwar Festival Offers & Local Store Discounts',
    highlights: ['Direct Shopkeeper Contacts', 'Zero Middleman Charges', 'Dhanteras Pre-Bookings', 'Late Night Market Hours'],
    festiveBadge: 'MAHABACHAT',
    bannerGradient: 'from-[#3a060f] via-[#22040a] to-[#140206]',
  },
  'dhanteras-electronics-auto': {
    tagline: 'Vehicle Pre-Bookings, Exchange Bonus & 0% Downpayment EMI',
    highlights: ['Dhanteras Day Assured Delivery', 'TV & Fridge Old Exchange Bonus', 'Free 5-Yr Insurance Combo', 'Instant Bajaj EMI on Spot'],
    festiveBadge: 'DHANTERAS AUTO',
    bannerGradient: 'from-[#3d0813] via-[#24040b] to-[#160207]',
  },
  'gold-jewellery-bartan': {
    tagline: '916 Hallmark Gold, Silver Coins & Brass Utensil Sets',
    highlights: ['Zero Making Charge on Silver Coins', 'BIS 916 Hallmark Gold Jewellery', 'Brass & Copper Puja Utensils', 'Hope Circus Sarafa Bazaar'],
    festiveBadge: 'HALLMARK SARAFA',
    bannerGradient: 'from-[#380918] via-[#22040d] to-[#140208]',
  },
  'sweets-dryfruits-hampers': {
    tagline: 'Fresh Alwar Kalakand, Desi Ghee Sweets & Dry Fruit Trays',
    highlights: ['Original Alwar Milk Cake / Kalakand', 'Bulk Corporate Sweet Boxes', 'Teej/Rakhi Malai Ghewar', 'Mandi Wholesale Dry Fruit Hampers'],
    festiveBadge: 'DESI GHEE SWEETS',
    bannerGradient: 'from-[#3a1306] via-[#220a03] to-[#160502]',
  },
  'fashion-ethnic-beauty': {
    tagline: 'Jaipur Lehariya Sarees, Mens Kurtas & Pre-Puja Salon Deals',
    highlights: ['Bajaja Bazaar Bandhani & Lehariya', 'Mens Festive Silk Kurta-Pajamas', 'Gold Facial & De-tan Salon Packages', 'Hope Circus Pop-up Mehendi'],
    festiveBadge: 'FESTIVE ETHNIC',
    bannerGradient: 'from-[#3a081a] via-[#22040f] to-[#16020a]',
  },
  'lights-decor-diyas': {
    tagline: 'Handmade Clay Diyas in Bulk, LED Pixels & Door Torans',
    highlights: ['Direct Potters (₹80 / 100 Diyas)', '50m Copper Waterproof LED Pixels', 'Terracotta Lakshmi-Ganesh Murtis', 'Balcony Curtain String Falls'],
    festiveBadge: 'CLAY DIYAS & LED',
    bannerGradient: 'from-[#2e1205] via-[#1c0a03] to-[#120501]',
  },
  'express-home-prep': {
    tagline: '3-Day Express Whitewash, Sofa Wash & Chandelier Cleaning',
    highlights: ['3-Day Guaranteed Painting Finish', 'Machine Sofa & Floor Scrubbing', 'Festive Bulb Hanging Service', 'Silent Generator Standby'],
    festiveBadge: 'EXPRESS HOME PREP',
    bannerGradient: 'from-[#2b1008] via-[#1a0805] to-[#120303]',
  },
  'city-melas-programs': {
    tagline: 'Ramlila Passes, Dussehra Mela, Temple Darshan & Parking Maps',
    highlights: ['Dussehra Ground Event Timings', 'Jagannath Temple Aarti Schedule', 'One-Way Traffic & Diversion Maps', 'Designated 2-Wheeler Parking'],
    festiveBadge: 'CITY MELAS & PUJA',
    bannerGradient: 'from-[#101e28] via-[#091118] to-[#04080d]',
  },
  'flash-deals-clearance': {
    tagline: 'Midnight Market Hours, Clearance Sales & Shop Scratch Cards',
    highlights: ['Open till 1:00 AM Midnight', 'Up to 50% Festive Clearance', 'Hope Circus Night Lighting', 'Verified Shopkeeper Vouchers'],
    festiveBadge: 'HOPE CIRCUS NIGHT',
    bannerGradient: 'from-[#3a1d06] via-[#211003] to-[#140901]',
  },
};

export default function FestivalHub({
  selectedCity = 'Alwar',
  onSelectSubCategory,
  onSelectFestivalCategory,
  onBack,
}) {
  const [activeSkin, setActiveSkin] = useState('diwali');
  const categoryConfig = getCategoryById('festival');

  const selectedSkinData =
    FESTIVAL_SKINS.find((s) => s.id === activeSkin) || FESTIVAL_SKINS[0];

  const handleSelect = (subId, catName) => {
    if (typeof onSelectSubCategory === 'function') {
      onSelectSubCategory(subId);
    } else if (typeof onSelectFestivalCategory === 'function') {
      onSelectFestivalCategory(subId, catName);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#180307] via-[#0d0103] to-[#160206] text-slate-100 font-sans pb-24 select-none relative">
      
      {/* Festive Fairy Lights Top Border */}
      <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-rose-500 to-yellow-300 shadow-[0_0_15px_rgba(251,191,36,0.8)]"></div>

      {/* Sticky Festive Navigation Bar */}
      <div className="sticky top-0 z-40 bg-[#1e040a]/95 backdrop-blur-md border-b border-[#5e121e]/70 px-4 py-3 flex items-center justify-between shadow-[0_4px_25px_rgba(0,0,0,0.6)]">
        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={onBack}
            className="w-8 h-8 rounded-full bg-[#350a12] hover:bg-[#4d0f1b] border border-amber-500/40 flex items-center justify-center text-amber-300 text-xs font-black cursor-pointer transition active:scale-95 shadow-inner"
          >
            ←
          </button>
          <div>
            <div className="flex items-center space-x-1.5 text-[9.5px] font-black tracking-wider text-amber-400">
              <span>🎪 UTSAV & CITY DEALS</span>
              <span>•</span>
              <span className="text-rose-200/80">{selectedCity.toUpperCase()} TEHSIL</span>
            </div>
            <h2 className="text-xs font-black text-amber-100 flex items-center space-x-1">
              <span>🎪 Festival Offers & Melas (त्योहारी ऑफर्स)</span>
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-[#3d0912] to-[#250308] hover:from-[#520d1a] hover:to-[#35050c] text-amber-300 text-[10px] font-bold border border-amber-500/40 transition shadow-sm cursor-pointer"
        >
          ← Back
        </button>
      </div>

      <div className="max-w-md mx-auto p-3.5 space-y-3.5">
        
        {/* Dynamic Festival Season Switcher Tabs */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[9.5px] text-amber-300/80 font-bold px-1">
            <span>CHOOSE OCCASION / FESTIVAL</span>
            <span className="text-amber-400">Alwar Calendar</span>
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
            {FESTIVAL_SKINS.map((skin) => (
              <button
                key={skin.id}
                type="button"
                onClick={() => setActiveSkin(skin.id)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black whitespace-nowrap transition cursor-pointer ${
                  activeSkin === skin.id
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-[0_0_12px_rgba(251,191,36,0.5)] scale-102'
                    : 'bg-[#25050d] border border-[#5a111f] text-amber-200/80 hover:bg-[#380813]'
                }`}
              >
                {skin.name}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Celebration Hero Banner */}
        <div className={`p-4 rounded-3xl bg-gradient-to-br ${selectedSkinData.themeGradient} border border-amber-400/50 space-y-3 shadow-[0_12px_35px_rgba(128,13,30,0.45)] relative overflow-hidden transition-all duration-300`}>
          <div className="absolute -top-6 -right-6 w-36 h-36 bg-amber-400/15 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-rose-500/20 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex items-center justify-between text-[10px]">
            <span className="px-2.5 py-0.5 rounded-full bg-[#1b0307]/80 border border-amber-400/50 text-amber-300 font-black shadow-xs flex items-center space-x-1.5">
              <span>✨</span>
              <span>{selectedSkinData.pillText}</span>
            </span>
            <span className="text-amber-200 font-bold bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-400/30">
              0% Commission
            </span>
          </div>

          <div className="flex items-center space-x-3 pt-0.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-300 to-yellow-600 p-0.5 shadow-lg flex-shrink-0 animate-pulse">
              <div className="w-full h-full bg-[#2a040a] rounded-[14px] flex items-center justify-center text-2xl">
                🎪
              </div>
            </div>
            <div>
              <h1 className="text-base font-black text-amber-50 tracking-tight leading-snug drop-shadow-sm">
                {selectedSkinData.name.split('(')[0]}
              </h1>
              <p className="text-[11px] text-amber-200/85 font-medium mt-0.5 leading-tight">
                {selectedSkinData.tagline} in {selectedCity}
              </p>
            </div>
          </div>

          {/* 4 Feature Badges */}
          <div className="grid grid-cols-4 gap-1.5 pt-1 border-t border-amber-400/20 text-center">
            <div className="bg-[#1e0307]/80 border border-amber-400/25 p-1.5 rounded-xl">
              <span className="block text-[10px] font-black text-amber-300">🚗 Auto & TV</span>
              <span className="text-[7.5px] text-rose-200/70">Dhanteras EMI</span>
            </div>
            <div className="bg-[#1e0307]/80 border border-amber-400/25 p-1.5 rounded-xl">
              <span className="block text-[10px] font-black text-amber-300">🪙 Sarafa</span>
              <span className="text-[7.5px] text-rose-200/70">916 Gold & Silver</span>
            </div>
            <div className="bg-[#1e0307]/80 border border-amber-400/25 p-1.5 rounded-xl">
              <span className="block text-[10px] font-black text-amber-300">🍬 Kalakand</span>
              <span className="text-[7.5px] text-rose-200/70">Pure Desi Ghee</span>
            </div>
            <div className="bg-[#1e0307]/80 border border-amber-400/25 p-1.5 rounded-xl">
              <span className="block text-[10px] font-black text-amber-300">⚡ Midnight</span>
              <span className="text-[7.5px] text-rose-200/70">Hope Circus Sale</span>
            </div>
          </div>
        </div>

        {/* Section Heading */}
        <div className="flex items-center justify-between text-[10.5px] font-black px-1 text-amber-400 tracking-wider">
          <span>👑 SELECT FESTIVE CATEGORY (श्रेणी चुनें)</span>
          <span className="text-rose-300/70">{categoryConfig?.subCategories?.length + 1 || 9} SPECIALTIES</span>
        </div>

        {/* Single-Column Stacked Cards Layout ("One Below Other") */}
        <div className="flex flex-col space-y-3">
          
          {/* Master "All Offers" Card */}
          <button
            type="button"
            onClick={() => handleSelect('all', 'All Festival Offers')}
            className="w-full p-3.5 bg-gradient-to-br from-[#400812] via-[#24040b] to-[#170207] hover:from-[#520d1a] hover:to-[#2e050e] text-left rounded-2xl border border-amber-500/50 shadow-[0_6px_20px_rgba(64,8,18,0.4)] transition-all active:scale-[0.99] cursor-pointer group relative overflow-hidden"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-400/15 border border-amber-400/40 flex items-center justify-center text-2xl shadow-inner group-hover:scale-105 transition-transform">
                  🌟
                </div>
                <div>
                  <h3 className="text-sm font-black text-amber-100 group-hover:text-amber-300 transition-colors">
                    All Festival Offers & Melas (सभी त्योहारी ऑफर्स)
                  </h3>
                  <p className="text-[10.5px] text-amber-200/80 font-medium">
                    {SUBCATEGORY_DETAILS.all.tagline}
                  </p>
                </div>
              </div>
              <span className="text-[8px] font-black px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/40 text-amber-300 tracking-wider">
                {SUBCATEGORY_DETAILS.all.festiveBadge}
              </span>
            </div>

            <div className="mt-3 pt-2.5 border-t border-amber-400/20 flex flex-wrap gap-1.5 items-center">
              <span className="text-[9px] font-bold text-amber-400 mr-1">Includes:</span>
              {SUBCATEGORY_DETAILS.all.highlights.map((h, i) => (
                <span
                  key={i}
                  className="text-[8.5px] font-semibold px-2 py-0.5 rounded-full bg-[#1b0307]/80 border border-amber-400/25 text-amber-200/90"
                >
                  ✓ {h}
                </span>
              ))}
            </div>
          </button>

          {/* Subcategories Stacked Vertically with What's Inside Badges */}
          {categoryConfig?.subCategories?.map((sub) => {
            const meta = SUBCATEGORY_DETAILS[sub.id] || {
              tagline: sub.name,
              highlights: ['Direct Shop Rates', 'Verified Local Dealer', 'Special Festival Discount'],
              festiveBadge: sub.tag || 'VERIFIED',
              bannerGradient: 'from-[#2b050d] via-[#1a0308] to-[#120205]',
            };

            const titleMain = sub.name.split('(')[0].trim();
            const hindiSub = sub.name.match(/\((.*?)\)/)?.[1] || '';

            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => handleSelect(sub.id, sub.name)}
                className={`w-full p-3.5 bg-gradient-to-br ${meta.bannerGradient} hover:border-amber-400/70 text-left rounded-2xl border border-[#5a111f]/70 shadow-[0_5px_18px_rgba(0,0,0,0.3)] transition-all active:scale-[0.99] cursor-pointer group relative overflow-hidden`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 rounded-2xl bg-[#380911] border border-amber-400/30 flex items-center justify-center text-2xl shadow-md group-hover:scale-105 transition-transform flex-shrink-0">
                      {sub.icon || '🎪'}
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-amber-50 group-hover:text-amber-200 transition-colors leading-snug">
                        {titleMain}
                      </h3>
                      {hindiSub && (
                        <p className="text-[10px] text-amber-400/90 font-bold leading-tight mt-0.5">
                          {hindiSub}
                        </p>
                      )}
                      <p className="text-[9.5px] text-rose-200/70 font-medium leading-tight mt-0.5">
                        {meta.tagline}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-1">
                    <span className="text-[7.5px] font-black px-1.5 py-0.5 rounded-md bg-[#380811] border border-amber-400/30 text-amber-300 tracking-wider">
                      {sub.tag || meta.festiveBadge}
                    </span>
                    <span className="text-amber-400 text-sm font-black group-hover:translate-x-1 transition-transform">
                      ➔
                    </span>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-[#4a0e19]/80 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[8.5px] font-bold text-amber-400/90 mr-0.5">क्या मिलेगा:</span>
                  {meta.highlights.map((item, idx) => (
                    <span
                      key={idx}
                      className="text-[8.5px] font-semibold px-2 py-0.5 rounded-md bg-[#22040a] border border-[#5c1322] text-amber-100/85"
                    >
                      • {item}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* Local Merchant Onboarding Banner */}
        <div className="p-3.5 bg-gradient-to-r from-[#4d0914] via-[#2a040b] to-[#450711] border border-amber-400/40 rounded-2xl flex items-center justify-between shadow-[0_6px_20px_rgba(77,9,20,0.4)]">
          <div className="space-y-0.5 pr-2">
            <span className="text-[9px] font-black text-amber-400 block tracking-wider">
              🏪 ALWAR FESTIVE MERCHANT REGISTRATION
            </span>
            <h4 className="text-xs font-black text-amber-50 leading-snug">
              Running a Festive Offer or Event in Alwar?
            </h4>
            <p className="text-[9.5px] text-amber-200/75 leading-tight">
              Broadcast your festive deals to thousands of families in {selectedCity}. Zero commission.
            </p>
          </div>

          <span className="px-3.5 py-2 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 text-[#3b000c] font-black text-[10px] rounded-xl whitespace-nowrap shadow-[0_0_15px_rgba(251,191,36,0.35)] active:scale-95 transition cursor-pointer">
            Post Deal ➔
          </span>
        </div>

      </div>
    </div>
  );
}