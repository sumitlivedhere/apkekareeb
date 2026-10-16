import React, { useState, useEffect, useMemo } from 'react';
import { hyperlocalStore } from '../../store/hyperlocalStore';

const cleanPhoneNum = (p) => (p ? String(p).replace(/\D/g, '').slice(-10) : '');

// Category Normalization Dictionary (Aliases & Taxonomy keys)
const CATEGORY_ALIAS_MAP = {
  property: 'property',
  realestate: 'property',
  kaarigar: 'kaarigar',
  mistri: 'kaarigar',
  services: 'kaarigar',
  transporters: 'transporters',
  transport: 'transporters',
  market: 'market',
  kirana: 'market',
  malls: 'malls',
  restaurants: 'restaurants',
  food: 'restaurants',
  medical: 'medical',
  doctors: 'medical',
  fitness: 'fitness',
  gym: 'fitness',
  education: 'education',
  coaching: 'education',
  shaadi: 'shaadi',
  events: 'shaadi',
  vehicles: 'vehicles',
  cars: 'vehicles',
  creators: 'creators',
  advertising: 'advertising',
  construction: 'construction',
  recommerce: 'recommerce',
  puranabazaar: 'recommerce',
  festival: 'festival',
  community: 'community',
  'white-collar': 'white-collar',
  jobs: 'white-collar',
  electronics: 'electronics',
  fashion: 'fashion',
  furniture: 'furniture',
};

export default function CategoryPromotionsBar({
  category = 'property',
  onSelectListing,
  selectedCity = 'Alwar',
}) {
  const [allListings, setAllListings] = useState(() => hyperlocalStore.getAllListings());
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    return hyperlocalStore.subscribe((_, changedKey) => {
      if (!changedKey || changedKey === 'all' || changedKey === category) {
        setAllListings([...hyperlocalStore.getAllListings()]);
      }
    });
  }, [category]);

  const targetCategoryKey = useMemo(() => {
    const raw = String(category || '').toLowerCase().trim();
    return CATEGORY_ALIAS_MAP[raw] || raw;
  }, [category]);

  // Filter ONLY admin-approved, non-expired promotions for THIS active category
  const categoryPromotions = useMemo(() => {
    const now = Date.now();

    return allListings.filter((item) => {
      const itemCat = String(item.category || '').toLowerCase().trim();
      const normalizedItemCat = CATEGORY_ALIAS_MAP[itemCat] || itemCat;

      if (normalizedItemCat !== targetCategoryKey) return false;

      // Must be marked as promoted or have 'PAID_PROMO' deal_type
      const isPromoted = Boolean(item.is_promoted || item.deal_type === 'PAID_PROMO');
      if (!isPromoted) return false;

      // Expiry verification
      if (item.deal_expires_at) {
        const expiryTime = new Date(item.deal_expires_at).getTime();
        if (expiryTime <= now) return false;
      }

      return true;
    });
  }, [allListings, targetCategoryKey]);

  // 🔒 ZERO CLUTTER: Render 0px if there are no active sponsors in this category
  if (categoryPromotions.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-md mx-auto px-3 pt-3 pb-1 space-y-2 animate-fade-in font-sans select-none">
      {/* Spotlight Header Bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-xs shadow-amber-400 animate-pulse" />
          <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider">
            👑 FEATURED {targetCategoryKey.toUpperCase()} SPOTLIGHT ({categoryPromotions.length})
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="text-[9px] font-bold text-slate-400 hover:text-amber-300 transition cursor-pointer flex items-center space-x-1"
        >
          <span>{isCollapsed ? 'Show Sponsors ▼' : 'Hide ▲'}</span>
        </button>
      </div>

      {/* Collapsible Sponsor Showcase */}
      {!isCollapsed && (
        <div className="flex items-stretch space-x-3 overflow-x-auto pb-2 scrollbar-none snap-x">
          {categoryPromotions.map((item) => {
            const coverImg =
              item.image ||
              item.image_url ||
              (Array.isArray(item.images) && item.images[0]) ||
              'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=500';

            const phone = cleanPhoneNum(item.phone || item.whatsapp);

            return (
              <div
                key={item.id}
                onClick={() => onSelectListing && onSelectListing(item)}
                className="w-72 sm:w-80 shrink-0 snap-start bg-[#0e1720] border-2 border-amber-400/50 hover:border-amber-400 rounded-3xl overflow-hidden shadow-2xl transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.99]"
              >
                <div>
                  {/* Media Stage */}
                  <div className="relative h-36 w-full bg-slate-950 overflow-hidden">
                    <img
                      src={coverImg}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />

                    {/* Floating Badges */}
                    <div className="absolute top-2.5 left-2.5 flex items-center space-x-1.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-black text-[9px] uppercase shadow-md">
                        👑 Sponsored
                      </span>
                      {item.deal_badge && (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-black text-[9px] shadow-md">
                          {item.deal_badge}
                        </span>
                      )}
                    </div>

                    <span className="absolute bottom-2 right-2 px-2.5 py-0.5 rounded-md bg-slate-950/85 backdrop-blur-xs text-amber-300 font-bold text-[10px] border border-amber-400/30">
                      {item.subCategory || item.sub_category || 'Featured'}
                    </span>
                  </div>

                  {/* Listing Details */}
                  <div className="p-3.5 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-black text-white line-clamp-1 group-hover:text-amber-200 transition">
                        {item.title || item.name}
                      </h4>
                      <span className="text-emerald-400 font-mono font-black text-xs shrink-0">
                        {item.price}
                      </span>
                    </div>

                    {item.description && (
                      <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span className="truncate">📍 {item.location || selectedCity}</span>
                      <span className="font-bold text-amber-300 truncate">
                        🏬 {item.sellerName || item.seller_name}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div
                  className="px-3.5 py-2.5 bg-[#080f16] border-t border-slate-800 flex items-center justify-between gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <a
                    href={`tel:+91${phone}`}
                    className="flex-1 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] text-center transition cursor-pointer"
                  >
                    📞 Call
                  </a>
                  <a
                    href={`https://wa.me/91${phone}?text=${encodeURIComponent(
                      `Namaste! I saw your featured listing "${item.title}" on Aapke Kareeb (${selectedCity}).`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] text-center transition cursor-pointer"
                  >
                    💬 WhatsApp
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}