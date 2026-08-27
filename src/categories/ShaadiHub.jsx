import React from 'react';
import { getCategoryById } from '../data/taxonomyRegistry';
import CategoryListFreeBanner from '../components/common/CategoryListFreeBanner';


// Detailed breakdown of what is inside each wedding subcategory
const SUBCATEGORY_DETAILS = {
  'all': {
    tagline: 'Complete A-to-Z Vivah Planning & Shopping Directory',
    highlights: ['All Verified Vendors', 'Direct Phone Call', '0% Middleman Cut', 'Local Town Rates'],
    festiveBadge: 'SHUBH ARAMBH',
    festiveColor: 'from-amber-400/20 to-yellow-600/20 border-amber-400/50 text-amber-300',
    bannerGradient: 'from-[#3a060f] via-[#22040a] to-[#140206]',
  },
  'combo-offers': {
    tagline: 'Complete Venue + Catering + Mandap All-in-One Deals',
    highlights: ['Lawn + Catering + Light Combos', 'Up to 25% Heavy Savings', 'Generator & AC Rooms Included', 'Single Bill Hassle-Free'],
    festiveBadge: 'BACHAT PACKAGES',
    bannerGradient: 'from-[#3d0813] via-[#24040b] to-[#160207]',
  },
  'wedding-stuff-buying': {
    tagline: 'Double Beds, Furniture, AC/Fridge, Gold Jewellery & Gifts',
    highlights: ['Bed, Sofa & Wardrobe Packages', 'TV, Refrigerator & Washing Machines', 'Bridal Gold, Silver & Polki Sets', 'Brass Utensil Sets & VIP Suitcases'],
    festiveBadge: 'WEDDING SHOPPING',
    bannerGradient: 'from-[#380918] via-[#22040d] to-[#140208]',
  },
  'function-wholesalers': {
    tagline: 'Wholesale Ration, Desi Ghee, Gifting Fabrics & Disposables',
    highlights: ['Bulk Ghee, Oil, Sugar & Spices', 'Suiting, Shirting & Chunri Cloths', 'Paper Plates, Cups & Foil Rolls', 'Mithai Boxes & Dry Fruit Trays'],
    festiveBadge: 'THOK MANDI',
    bannerGradient: 'from-[#2e1205] via-[#1c0a03] to-[#120501]',
  },
  'home-makeover-workers': {
    tagline: 'Pre-Wedding Quick Home Painting, Deep Clean & Repairs',
    highlights: ['3-Day Express House Painting', 'Sofa, Carpet & Tank Wash', 'Electrician & Festive Bulb Fitting', 'Door Polish & Touchups'],
    festiveBadge: 'GHAR KI TAIYARI',
    bannerGradient: 'from-[#2b1008] via-[#1a0805] to-[#120303]',
  },
  'guest-management': {
    tagline: 'AC Room Blocks, Barat Buses & Decorated Doli Cars',
    highlights: ['Hotel & Dharamshala Bulk Rooms', '17/26 Seater Tempo Travellers', 'Luxury AC Barat Buses', 'Decorated Bride Doli Car'],
    festiveBadge: 'MEHMAN NAWAZI',
    bannerGradient: 'from-[#280c18] via-[#18050e] to-[#12030a]',
  },
  'marriage-gardens': {
    tagline: 'Grand Resorts, AC Banquet Halls & Spacious Lawns',
    highlights: ['1500+ Guest Capacity Lawns', 'Pillarless AC Banquet Halls', 'Valet Parking & 125kVA Genset', 'Attached Deluxe Rooms'],
    festiveBadge: 'SHAHI VENUES',
    bannerGradient: 'from-[#33081a] via-[#1e040f] to-[#140209]',
  },
  'halwai-caterers': {
    tagline: 'Pure Desi Ghee Traditional Sweets & Live Food Stalls',
    highlights: ['Famous Alwar Kalakand & Sweets', 'Live Chaat, Jalebi & Dosa Stalls', 'Traditional Dal Baati Churma', 'Uniformed Catering Staff'],
    festiveBadge: 'DESI GHEE MENU',
    bannerGradient: 'from-[#3a1306] via-[#220a03] to-[#160502]',
  },
  'tent-light-sound': {
    tagline: 'Theme Glass Mandaps, High-Bass DJ & Laser Lights',
    highlights: ['Royal Entry Tunnels & Flower Gates', 'Glass Mandap & Exotic Backdrops', 'High-Watt Line Array DJ Setup', 'Cold Pyro Guns & Heavy Fog'],
    festiveBadge: 'MANDAP & DECOR',
    bannerGradient: 'from-[#101e28] via-[#091118] to-[#04080d]',
  },
  'photographers-cinematic': {
    tagline: '4K Candid Wedding Films, Dual Drone & Pre-Wed Shoots',
    highlights: ['Siliserh & Kesroli Pre-Wedding Shoots', 'Dual 4K Drone Venue Coverage', 'Same-Day Instagram Reels', 'Luxury Velvet Photo Albums'],
    festiveBadge: '4K CINEMATICS',
    bannerGradient: 'from-[#3a1d06] via-[#211003] to-[#140901]',
  },
  'bridal-makeup-mehendi': {
    tagline: 'HD Airbrush Bridal Makeup & Organic Rajasthani Mehndi',
    highlights: ['MAC & Huda Beauty HD Makeup', '3D Hairstyling & Saree Draping', 'Dark-Stain Organic Mehndi', 'Pre-Bridal Skin Glow Packages'],
    festiveBadge: 'DULHAN SHRINGAR',
    bannerGradient: 'from-[#3a081a] via-[#22040f] to-[#16020a]',
  },
  'baraat-rituals-pooja': {
    tagline: 'Royal White Mares, 21-Piece Brass Band & Vedic Pandits',
    highlights: ['Decorated Ghodi & Royal Bagghi', '21-Piece Band & Punjabi Dhol', 'Jodhpuri Safa & Pagdi Specialists', 'Experienced Lagan-Phera Pandits'],
    festiveBadge: 'ROYAL BARAT',
    bannerGradient: 'from-[#3d0e06] via-[#240803] to-[#160401]',
  },
};

export default function ShaadiHub({
  selectedCity = 'Alwar',
  onSelectSubCategory,
  onSelectShaadiCategory,
  onPostClick,
  onBack,
}) {
  const categoryConfig = getCategoryById('shaadi');

  const handleSelect = (subId, catName) => {
    if (typeof onSelectSubCategory === 'function') {
      onSelectSubCategory(subId);
    } else if (typeof onSelectShaadiCategory === 'function') {
      onSelectShaadiCategory(subId, catName);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#180307] via-[#0d0103] to-[#160206] text-slate-100 font-sans pb-24 select-none relative">
      
      {/* Festive Fairy Lights Decorative Top Strip */}
      <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-rose-500 to-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.8)]"></div>

      {/* Sticky Wedding Top Bar */}
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
              <span>✨ SHUBH VIVAH DIRECTORY</span>
              <span>•</span>
              <span className="text-rose-200/80">{selectedCity.toUpperCase()} TEHSIL</span>
            </div>
            <h2 className="text-xs font-black text-amber-100 flex items-center space-x-1">
              <span>💍 Shaadi & Wedding 360° (विवाह सेवा)</span>
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
        
        {/* Festive Celebration Hero Banner */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-[#800d1e] via-[#4d0712] to-[#230208] border border-amber-400/50 space-y-3 shadow-[0_12px_35px_rgba(128,13,30,0.45)] relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-36 h-36 bg-amber-400/15 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-rose-500/20 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex items-center justify-between text-[10px]">
            <span className="px-2.5 py-0.5 rounded-full bg-[#1b0307]/80 border border-amber-400/50 text-amber-300 font-black shadow-xs flex items-center space-x-1.5">
              <span>🎉</span>
              <span>Direct Family-to-Vendor Bookings</span>
            </span>
            <span className="text-amber-200 font-bold bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-400/30">
              0% Commission
            </span>
          </div>

          <div className="flex items-center space-x-3 pt-0.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-300 to-yellow-600 p-0.5 shadow-lg flex-shrink-0 animate-pulse">
              <div className="w-full h-full bg-[#2a040a] rounded-[14px] flex items-center justify-center text-2xl">
                💍
              </div>
            </div>
            <div>
              <h1 className="text-base font-black text-amber-50 tracking-tight leading-snug drop-shadow-sm">
                Shaadi & Wedding (विवाह सेवा)
              </h1>
              <p className="text-[11px] text-amber-200/85 font-medium mt-0.5 leading-tight">
                Shopping, Wholesalers, Banquets, Catering, Decor & Barat in {selectedCity}
              </p>
            </div>
          </div>

          {/* 4 Feature Highlights */}
          <div className="grid grid-cols-4 gap-1.5 pt-1 border-t border-amber-400/20 text-center">
            <div className="bg-[#1e0307]/80 border border-amber-400/25 p-1.5 rounded-xl">
              <span className="block text-[10px] font-black text-amber-300">🛍️ Shopping</span>
              <span className="text-[7.5px] text-rose-200/70">Furniture & Gold</span>
            </div>
            <div className="bg-[#1e0307]/80 border border-amber-400/25 p-1.5 rounded-xl">
              <span className="block text-[10px] font-black text-amber-300">📦 Wholesalers</span>
              <span className="text-[7.5px] text-rose-200/70">Ration & Clothes</span>
            </div>
            <div className="bg-[#1e0307]/80 border border-amber-400/25 p-1.5 rounded-xl">
              <span className="block text-[10px] font-black text-amber-300">🏰 Gardens</span>
              <span className="text-[7.5px] text-rose-200/70">AC Banquets</span>
            </div>
            <div className="bg-[#1e0307]/80 border border-amber-400/25 p-1.5 rounded-xl">
              <span className="block text-[10px] font-black text-amber-300">🍲 Halwai</span>
              <span className="text-[7.5px] text-rose-200/70">Pure Desi Ghee</span>
            </div>
          </div>
        </div>

        {/* Section Heading */}
        <div className="flex items-center justify-between text-[10.5px] font-black px-1 text-amber-400 tracking-wider">
          <span>👑 SELECT WEDDING SERVICE (विवाह सेवा चुनें)</span>
          <span className="text-rose-300/70">{categoryConfig?.subCategories?.length + 1 || 12} CATEGORIES</span>
        </div>

        {/* Single-Column Stacked Cards Layout */}
        <div className="flex flex-col space-y-3">
          
          {/* 1. All Wedding Services Master Card */}
          <button
            type="button"
            onClick={() => handleSelect('all', 'All Wedding Services')}
            className="w-full p-3.5 bg-gradient-to-br from-[#400812] via-[#24040b] to-[#170207] hover:from-[#520d1a] hover:to-[#2e050e] text-left rounded-2xl border border-amber-500/50 shadow-[0_6px_20px_rgba(64,8,18,0.4)] transition-all active:scale-[0.99] cursor-pointer group relative overflow-hidden"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-400/15 border border-amber-400/40 flex items-center justify-center text-2xl shadow-inner group-hover:scale-105 transition-transform">
                  🌟
                </div>
                <div>
                  <h3 className="text-sm font-black text-amber-100 group-hover:text-amber-300 transition-colors">
                    All Wedding Services (सभी विवाह सेवाएं)
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

          {/* 2. Mapped Subcategories Stacked Vertically */}
          {categoryConfig?.subCategories?.map((sub) => {
            const meta = SUBCATEGORY_DETAILS[sub.id] || {
              tagline: sub.name,
              highlights: ['Direct Rates', 'Verified Local Vendor', 'Quality Assured'],
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

        {/* 🌟 5. INTERACTIVE LIST FREE WIDGET */}
      <CategoryListFreeBanner
        category="property"
        selectedCity={selectedCity}
        onPostClick={onPostClick}
      />

      </div>
    </div>
  );
}