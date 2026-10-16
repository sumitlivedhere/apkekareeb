import React, { useState, useMemo } from 'react';
import { usePromotedListingsSlice } from '../../store/hyperlocalStore';
import { TAXONOMY_REGISTRY } from '../../data/taxonomyRegistry';

export default function PromotionsHubTile({
  activeFeedMode = 'organic', // 'organic' | 'promotions'
  onChangeFeedMode,
  onSelectListing,
  selectedCity = 'Alwar',
}) {
  const promotedListings = usePromotedListingsSlice();
  const [selectedSector, setSelectedSector] = useState('all');

  const filteredPromotions = useMemo(() => {
    if (selectedSector === 'all') return promotedListings;
    return promotedListings.filter(
      (item) => String(item.category).toLowerCase() === String(selectedSector).toLowerCase()
    );
  }, [promotedListings, selectedSector]);

  // Available categories within active promotions
  const activePromoCategories = useMemo(() => {
    const cats = new Set(promotedListings.map((i) => i.category).filter(Boolean));
    return Array.from(cats);
  }, [promotedListings]);

  return (
    <div className="w-full space-y-4 select-none font-sans">
      
      {/* 🌟 TOP DUAL-TILE SWITCHER: ORGANIC DIRECTORY vs PAID PROMOTIONS */}
      <div className="grid grid-cols-2 gap-3">
        
        {/* Tile 1: Regular Organic Feed */}
        <button
          type="button"
          onClick={() => onChangeFeedMode('organic')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
            activeFeedMode === 'organic'
              ? 'bg-[#111c28] border-amber-400/70 shadow-lg ring-1 ring-amber-400/30'
              : 'bg-[#0b121c]/80 border-slate-800/80 opacity-75 hover:opacity-100 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center space-x-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
              activeFeedMode === 'organic'
                ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                : 'bg-slate-800 text-slate-300'
            }`}>
              🏛️
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <h3 className="text-xs sm:text-sm font-black text-white truncate">
                  Alwar Categories
                </h3>
              </div>
              <p className="text-[10px] text-amber-400 font-bold truncate">
                सभी श्रेणियां • Regular Feed
              </p>
            </div>
          </div>
          {activeFeedMode === 'organic' && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
          )}
        </button>

        {/* Tile 2: Paid Promotions & Featured Spotlight Tile */}
        <button
          type="button"
          onClick={() => onChangeFeedMode('promotions')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between relative overflow-hidden ${
            activeFeedMode === 'promotions'
              ? 'bg-gradient-to-r from-amber-950/80 via-[#181f2c] to-amber-950/60 border-amber-400 shadow-xl ring-2 ring-amber-400/40'
              : 'bg-gradient-to-r from-[#111824] to-[#172030] border-amber-500/30 hover:border-amber-400/60'
          }`}
        >
          <div className="flex items-center space-x-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
              activeFeedMode === 'promotions'
                ? 'bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 font-black shadow-md'
                : 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
            }`}>
              🚀
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <h3 className="text-xs sm:text-sm font-black text-white truncate">
                  Promotions
                </h3>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-400 text-slate-950 font-mono">
                  {promotedListings.length}
                </span>
              </div>
              <p className="text-[10px] text-amber-300 font-bold truncate">
                विशेष प्रचार • Featured Hub
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* 🌟 DEDICATED PAID PROMOTIONS VIEW (ONLY SHOWN WHEN PROMOTIONS TILE IS ACTIVE) */}
      {activeFeedMode === 'promotions' && (
        <div className="space-y-4 pt-1 animate-fade-in">
          
          {/* Header Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-slate-900 to-amber-500/10 border border-amber-400/30 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black text-[9px] uppercase tracking-wider">
                  👑 Admin Verified Sponsors
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">
                  • {selectedCity} Spotlight
                </span>
              </div>
              <h2 className="text-sm font-black text-white pt-0.5">
                Featured Businesses & Exclusive Town Offers
              </h2>
              <p className="text-[11px] text-slate-400">
                Handpicked & verified promotions approved by Aapke Kareeb Admin.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onChangeFeedMode('organic')}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 shrink-0 cursor-pointer"
            >
              ← Back to Categories
            </button>
          </div>

          {/* Sector Filter Pills inside Promotions */}
          {activePromoCategories.length > 1 && (
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedSector('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedSector === 'all'
                    ? 'bg-amber-400 text-slate-950 font-black shadow'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                All Sponsors ({promotedListings.length})
              </button>
              {activePromoCategories.map((catId) => {
                const label = TAXONOMY_REGISTRY[catId]?.name?.split('(')[0]?.trim() || catId;
                return (
                  <button
                    key={catId}
                    type="button"
                    onClick={() => setSelectedSector(catId)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap capitalize transition cursor-pointer ${
                      selectedSector === catId
                        ? 'bg-amber-400 text-slate-950 font-black shadow'
                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Promoted Cards Grid */}
          {filteredPromotions.length === 0 ? (
            <div className="py-16 px-4 text-center bg-[#0d1520] border border-slate-800/80 rounded-3xl space-y-2">
              <span className="text-3xl block">🚀</span>
              <h3 className="text-sm font-black text-slate-200">
                No Active Paid Promotions Right Now
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Only businesses and special offers verified & approved by the Admin team appear in this spotlight section.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredPromotions.map((item) => {
                const coverImg =
                  item.image ||
                  item.image_url ||
                  (Array.isArray(item.images) && item.images[0]) ||
                  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=500';

                const cleanPhone = String(item.phone || '').replace(/\D/g, '').slice(-10);

                return (
                  <div
                    key={item.id}
                    onClick={() => onSelectListing && onSelectListing(item)}
                    className="bg-[#101926] border-2 border-amber-400/40 hover:border-amber-400 rounded-3xl overflow-hidden shadow-xl transition group cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      {/* Image Stage */}
                      <div className="relative h-48 w-full bg-slate-950 overflow-hidden">
                        <img
                          src={coverImg}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute top-3 left-3 flex items-center space-x-1.5">
                          <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-black text-[10px] uppercase shadow-md">
                            🚀 Sponsored
                          </span>
                          {item.deal_badge && (
                            <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white font-black text-[10px] shadow-md">
                              {item.deal_badge}
                            </span>
                          )}
                        </div>
                        <span className="absolute bottom-2.5 right-2.5 px-2.5 py-0.5 rounded-lg bg-slate-950/85 backdrop-blur-xs text-amber-300 text-[10px] font-bold border border-amber-400/30 uppercase">
                          {item.category}
                        </span>
                      </div>

                      {/* Content Body */}
                      <div className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-black text-white line-clamp-1">
                            {item.title || item.name}
                          </h3>
                          <span className="text-emerald-400 font-mono font-black text-xs shrink-0">
                            {item.price}
                          </span>
                        </div>

                        {item.description && (
                          <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        )}

                        <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400">
                          <span className="truncate">📍 {item.location || selectedCity}</span>
                          <span className="font-bold text-amber-300 truncate">
                            🏬 {item.sellerName || item.seller_name}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div
                      className="px-4 py-3 bg-[#0a1018] border-t border-slate-800/80 flex items-center justify-between gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <a
                        href={`tel:+91${cleanPhone}`}
                        className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs text-center transition"
                      >
                        📞 Call Now
                      </a>
                      <a
                        href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
                          `Namaste! I saw your featured promotion "${item.title}" on Aapke Kareeb (${selectedCity}).`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs text-center transition"
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
      )}
    </div>
  );
}