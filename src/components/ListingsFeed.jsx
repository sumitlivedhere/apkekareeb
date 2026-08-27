import React, { useState, useMemo } from 'react';
import { hyperlocalStore, useInterestSlice } from '../store/hyperlocalStore';
import ActionButtons from './common/ActionButtons';
import ListingDetailModal from './common/ListingDetailModal';
import VoiceNotePlayer from './common/VoiceNotePlayer';

function StandardListingCard({ item, selectedCity, onSelect }) {
  const [activeMediaTab, setActiveMediaTab] = useState('photos');
  const [photoIndex, setPhotoIndex] = useState(0);

  const interestCount = useInterestSlice(
    item.id,
    Number(item.interestCount || item.interest_count || 0)
  );

  const handleStarClick = (e) => {
    e.stopPropagation();
    hyperlocalStore.incrementInterest(
      item.id,
      interestCount,
      item.title || item.name,
      item.sellerName || item.provider_name || 'Verified Merchant'
    );
  };

  const gallery = useMemo(() => {
    if (Array.isArray(item.images) && item.images.length > 0) return item.images;
    if (Array.isArray(item.image_urls) && item.image_urls.length > 0) return item.image_urls;
    if (item.image) return [item.image];
    return ['https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=700'];
  }, [item.images, item.image_urls, item.image]);

  const cleanPhotos = gallery.map((p) => (typeof p === 'string' ? p : p.url || p.preview)).filter(Boolean);
  const videos = useMemo(() => {
    const raw = item.videos || item.video_urls || [];
    return raw.map((v) => (typeof v === 'string' ? { url: v } : v)).filter((v) => v?.url);
  }, [item.videos, item.video_urls]);

  const hasVideo = videos.length > 0;
  const priceDisplay = item.price || item.deal_price || item.rent || item.rates || 'Contact for Price';

  return (
    <article
      onClick={onSelect}
      className="bg-slate-900/95 hover:bg-slate-900 border border-slate-800 hover:border-amber-400/60 rounded-3xl overflow-hidden p-3.5 space-y-3 relative cursor-pointer transition active:scale-[0.99] shadow-xl group"
    >
      {/* Media Box */}
      <div className="relative h-48 w-full bg-slate-950 rounded-2xl overflow-hidden select-none border border-slate-800">
        {activeMediaTab === 'photos' || !hasVideo ? (
          <img
            src={cleanPhotos[photoIndex] || cleanPhotos[0]}
            alt={item.title || item.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=700';
            }}
          />
        ) : (
          <video
            src={videos[0]?.url}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        )}

        {hasVideo && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute top-2.5 left-2.5 z-20 flex bg-slate-950/85 backdrop-blur-md rounded-xl p-0.5 border border-slate-700 text-[9px] font-black"
          >
            <button
              type="button"
              onClick={() => setActiveMediaTab('photos')}
              className={`px-2 py-0.5 rounded-lg transition ${
                activeMediaTab === 'photos' ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-300'
              }`}
            >
              📷 Photos
            </button>
            <button
              type="button"
              onClick={() => setActiveMediaTab('video')}
              className={`px-2 py-0.5 rounded-lg transition ${
                activeMediaTab === 'video' ? 'bg-cyan-400 text-slate-950 font-black' : 'text-slate-300'
              }`}
            >
              🎬 Video
            </button>
          </div>
        )}

        {activeMediaTab === 'photos' && cleanPhotos.length > 1 && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex items-center justify-between pointer-events-none"
          >
            <button
              type="button"
              onClick={() => setPhotoIndex((p) => Math.max(0, p - 1))}
              disabled={photoIndex === 0}
              className="w-6 h-6 rounded-full bg-slate-950/80 text-white text-[10px] flex items-center justify-center pointer-events-auto disabled:opacity-0 shadow"
            >
              ❮
            </button>
            <button
              type="button"
              onClick={() => setPhotoIndex((p) => Math.min(cleanPhotos.length - 1, p + 1))}
              disabled={photoIndex === cleanPhotos.length - 1}
              className="w-6 h-6 rounded-full bg-slate-950/80 text-white text-[10px] flex items-center justify-center pointer-events-auto disabled:opacity-0 shadow"
            >
              ❯
            </button>
          </div>
        )}

        <div className="absolute bottom-2.5 left-2.5 z-10 flex items-center space-x-1.5">
          <span className="text-xs font-black px-2.5 py-1 rounded-xl text-slate-950 bg-amber-400 shadow-md">
            {priceDisplay}
          </span>
          <span className="text-[8.5px] font-black px-1.5 py-0.5 rounded-md bg-emerald-950/90 text-emerald-300 border border-emerald-500/40">
            ✓ Verified
          </span>
        </div>

        <button
          type="button"
          onClick={handleStarClick}
          className="absolute top-2.5 right-2.5 z-20 px-2.5 py-1 rounded-xl bg-slate-950/85 hover:bg-slate-950 text-amber-300 border border-amber-400/30 text-[10px] font-black flex items-center space-x-1 backdrop-blur-xs transition active:scale-90 cursor-pointer shadow-md"
        >
          <span>⭐</span>
          <span>{interestCount}</span>
        </button>
      </div>

      {/* Info Section */}
      <div className="space-y-1">
        <div className="flex items-start justify-between">
          <div className="min-w-0 pr-2">
            <h3 className="font-black text-slate-100 text-sm leading-snug truncate group-hover:text-amber-300 transition">
              {item.title || item.name}
            </h3>
            {(item.sellerName || item.provider_name || item.brand) && (
              <p className="text-[10px] text-amber-300 font-bold mt-0.5 truncate">
                👤 {item.sellerName || item.provider_name || item.brand}
              </p>
            )}
          </div>

          <span className="text-[9px] font-black text-slate-300 bg-slate-800 px-2 py-0.5 rounded-lg uppercase tracking-wider shrink-0 border border-slate-700">
            {item.subCategory || item.category || 'DEAL'}
          </span>
        </div>

        {item.description && (
          <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        )}
      </div>

      {/* Location & Turn-by-Turn Footer */}
      <div className="flex items-center justify-between text-[10.5px] pt-2 border-t border-slate-800 text-slate-400 font-medium">
        <div className="flex items-center space-x-1 truncate max-w-[220px]">
          <span>📍</span>
          <span className="truncate text-slate-300 font-bold">{item.location || selectedCity}</span>
        </div>

        <span className="text-[9.5px] font-bold text-amber-400 uppercase tracking-widest shrink-0">
          Details ➔
        </span>
      </div>

      {/* Action Buttons */}
      <div onClick={(e) => e.stopPropagation()}>
        <ActionButtons
          phone={item.phone || item.contact || '9876543210'}
          whatsapp={item.whatsapp || item.phone || item.contact || '919876543210'}
          message={`Namaste, I found your listing "${item.title || item.name}" in Aapke Kareeb (${selectedCity}). I want more details.`}
        />
      </div>
    </article>
  );
}

export default function ListingsFeed({
  selectedCategory = 'vehicles',
  selectedSubCategory = 'all',
  selectedCity = 'Alwar',
  searchQuery = '',
  onBack,
  onNewNotification,
}) {
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  const listings = useMemo(() => {
    const allItems = hyperlocalStore.getAllListings() || [];
    const cat = (selectedCategory || '').toLowerCase().trim();
    const sub = (selectedSubCategory || 'all').toLowerCase().trim();
    const q = (searchQuery || '').toLowerCase().trim();

    return allItems.filter((item) => {
      if (!item) return false;

      // 1. Category Filter
      const itemCat = (item.category || item.category_id || '').toLowerCase().trim();
      if (cat && itemCat !== cat) return false;

      // 2. Subcategory Filter
      const itemSub = (item.subCategory || item.subcategory_id || '').toLowerCase().trim();
      if (sub !== 'all' && itemSub !== sub) return false;

      // 3. Search Query Filter
      if (q) {
        const title = (item.title || item.name || '').toLowerCase();
        const desc = (item.description || '').toLowerCase();
        const provider = (item.sellerName || item.provider_name || '').toLowerCase();
        const loc = (item.location || '').toLowerCase();
        if (!title.includes(q) && !desc.includes(q) && !provider.includes(q) && !loc.includes(q)) {
          return false;
        }
      }

      // 4. Quick Filter Tabs
      if (activeFilter === 'discount') {
        const p = String(item.price || item.deal_price || '').toLowerCase();
        const d = String(item.description || '').toLowerCase();
        return p.includes('₹') || d.includes('discount') || d.includes('off') || item.isNew;
      }
      if (activeFilter === 'ready') {
        return Boolean(item.capacity || item.stockCount || item.is_active);
      }

      return true;
    });
  }, [selectedCategory, selectedSubCategory, searchQuery, activeFilter]);

  return (
    <div className="p-3.5 space-y-3.5 relative z-10 animate-fade-in text-slate-100 flex-1 pb-24">
      {/* 🌟 1. Top Category Bar */}
      <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onBack}
            className="w-7 h-7 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 text-xs font-black active:scale-90 transition cursor-pointer"
          >
            ❮
          </button>
          <div>
            <h2 className="text-xs font-black text-white uppercase tracking-wider">
              {selectedSubCategory !== 'all' ? selectedSubCategory : selectedCategory} Directory
            </h2>
            <p className="text-[10px] text-slate-400">
              {listings.length} verified listings in {selectedCity}
            </p>
          </div>
        </div>

        <span className="text-[9.5px] font-black px-2 py-0.5 rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase">
          {selectedCategory}
        </span>
      </div>

      {/* 🌟 2. Quick Filters */}
      <div className="flex items-center space-x-1.5 overflow-x-auto py-1 scrollbar-none text-xs font-bold">
        {[
          { id: 'all', label: '🌟 All Listings' },
          { id: 'discount', label: '🏷️ Deals & Discounts' },
          { id: 'ready', label: '⚡ Ready Stock / Available' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveFilter(tab.id)}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer active:scale-95 text-[11px] ${
              activeFilter === tab.id
                ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 🌟 3. Listings Stream */}
      {listings.length === 0 ? (
        <div className="bg-slate-900/60 rounded-3xl p-8 text-center border border-slate-800 space-y-2.5">
          <span className="text-3xl block">📦</span>
          <h3 className="text-xs font-black text-white">No listings found in this section</h3>
          <p className="text-[10px] text-slate-400 max-w-[240px] mx-auto">
            Try switching filter tabs or check back soon as local merchants update inventory daily.
          </p>
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className="px-3.5 py-1.5 bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {listings.map((item) => (
            <StandardListingCard
              key={item.id}
              item={item}
              selectedCity={selectedCity}
              onSelect={() => setSelectedDetailItem(item)}
            />
          ))}
        </div>
      )}

      {/* 🌟 4. Full Detail Modal Triggered on Tap */}
      {selectedDetailItem && (
        <ListingDetailModal
          item={selectedDetailItem}
          selectedCity={selectedCity}
          onClose={() => setSelectedDetailItem(null)}
          onNewNotification={onNewNotification}
        />
      )}
    </div>
  );
}