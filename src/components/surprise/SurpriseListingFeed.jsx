import React, { useState, useMemo } from 'react';
import { hyperlocalStore, useInterestSlice } from '../../store/hyperlocalStore';
import ActionButtons from '../common/ActionButtons';
import ListingDetailModal from '../common/ListingDetailModal';
import VoiceNotePlayer from '../common/VoiceNotePlayer';

function SurpriseCardItem({ item, selectedCity, onSelect, getMessageTemplate }) {
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
      item.sellerName || item.agencyName || item.providerName || 'Local Provider'
    );
  };

  const gallery = useMemo(() => {
    if (Array.isArray(item.images) && item.images.length > 0) return item.images;
    if (item.image) return [item.image];
    return ['https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=700'];
  }, [item.images, item.image]);

  const cleanPhotos = gallery.map((p) => (typeof p === 'string' ? p : p.url || p.preview)).filter(Boolean);
  const videos = useMemo(() => {
    const raw = item.videos || item.video_urls || [];
    return raw.map((v) => (typeof v === 'string' ? { url: v } : v)).filter((v) => v?.url);
  }, [item.videos, item.video_urls]);

  const hasVideo = videos.length > 0;
  const priceDisplay = item.price || item.rates || item.rent || item.budget || 'Best Price';

  const attachedAudioUrl = useMemo(() => {
    if (item.seller_audio_url) return item.seller_audio_url;
    if (typeof item.admin_feedback === 'string' && item.admin_feedback.startsWith('{')) {
      try {
        const parsed = JSON.parse(item.admin_feedback);
        if (parsed.audioUrl) return parsed.audioUrl;
      } catch {}
    }
    return null;
  }, [item.seller_audio_url, item.admin_feedback]);

  const stockInfo = item.capacity || item.stockCount || null;

  return (
    <article
      onClick={onSelect}
      className="bg-slate-900/95 hover:bg-slate-900 border border-slate-800 hover:border-amber-400/60 rounded-3xl overflow-hidden p-3.5 space-y-3 relative cursor-pointer transition active:scale-[0.99] shadow-xl group"
    >
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
              className={`px-2 py-0.5 rounded-lg transition ${activeMediaTab === 'photos' ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-300'}`}
            >
              📷 Photos
            </button>
            <button
              type="button"
              onClick={() => setActiveMediaTab('video')}
              className={`px-2 py-0.5 rounded-lg transition ${activeMediaTab === 'video' ? 'bg-cyan-400 text-slate-950 font-black' : 'text-slate-300'}`}
            >
              🎬 Video
            </button>
          </div>
        )}

        {activeMediaTab === 'photos' && cleanPhotos.length > 1 && (
          <div onClick={(e) => e.stopPropagation()} className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex items-center justify-between pointer-events-none">
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

        {activeMediaTab === 'photos' && cleanPhotos.length > 1 && (
          <div className="absolute bottom-2.5 right-2.5 flex items-center space-x-1 bg-slate-950/70 backdrop-blur-xs px-2 py-0.5 rounded-full z-10 border border-slate-700">
            {cleanPhotos.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${photoIndex === i ? 'w-3.5 bg-amber-400' : 'w-1.5 bg-slate-600'}`}
              />
            ))}
          </div>
        )}

        <div className="absolute bottom-2.5 left-2.5 z-10 flex items-center space-x-1.5">
          <span className="text-xs font-black px-2.5 py-1 rounded-xl text-slate-950 bg-amber-400 shadow-md">
            {priceDisplay}
          </span>
          <span className="text-[8.5px] font-black px-1.5 py-0.5 rounded-md bg-emerald-950/90 text-emerald-300 border border-emerald-500/40">
            ⚡ Deal Live
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

      <div className="flex items-center justify-between text-[9px] font-black text-slate-300">
        <div className="flex items-center space-x-1.5">
          <span className="px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center space-x-1">
            <span>⏳</span>
            <span>Aaj Ka Khaas Offer</span>
          </span>

          {stockInfo && (
            <span className="px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              📦 {stockInfo}
            </span>
          )}
        </div>

        <span className="text-emerald-400 flex items-center space-x-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Available Today</span>
        </span>
      </div>

      <div className="space-y-1">
        <div className="flex items-start justify-between">
          <div className="min-w-0 pr-2">
            <h3 className="font-black text-slate-100 text-sm leading-snug truncate group-hover:text-amber-300 transition">
              {item.title || item.name}
            </h3>
            {(item.sellerName || item.agencyName || item.driverName) && (
              <p className="text-[10px] text-amber-300 font-bold mt-0.5 truncate">
                👤 {item.sellerName || item.agencyName || item.driverName}
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

      {attachedAudioUrl && (
        <div onClick={(e) => e.stopPropagation()} className="p-2 bg-slate-950 rounded-xl border border-amber-500/30">
          <VoiceNotePlayer
            audioUrl={attachedAudioUrl}
            duration="0:15"
            senderName="🎙️ सुनिए दुकानदार का संदेश"
          />
        </div>
      )}

      <div className="flex items-center justify-between text-[10.5px] pt-2 border-t border-slate-800 text-slate-400 font-medium">
        <div className="flex items-center space-x-1 truncate max-w-[220px]">
          <span>📍</span>
          <span className="truncate text-slate-300 font-bold">{item.location || selectedCity}</span>
          <span className="text-[9px] text-cyan-300 shrink-0 font-mono">• 800m (~9 min walk)</span>
        </div>

        <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-widest shrink-0">
          Verified • सत्यापित
        </span>
      </div>

      <div onClick={(e) => e.stopPropagation()}>
        <ActionButtons
          phone={item.phone || item.contact || '9876543210'}
          whatsapp={item.whatsapp || item.phone || item.contact || '919876543210'}
          message={getMessageTemplate(item)}
        />
      </div>
    </article>
  );
}

export default function SurpriseListingFeed({
  selectedCity = 'Alwar',
  searchQuery = '',
  chosenCategory,
  onOpenBubbles,
  onNewNotification,
}) {
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [shuffleKey, setShuffleKey] = useState(0);

  const surpriseListings = useMemo(() => {
    const allItems = hyperlocalStore.getAllListings() || [];
    const city = (selectedCity || '').toLowerCase().trim();
    const q = (searchQuery || '').toLowerCase().trim();

    let matched = allItems.filter((item) => {
      if (!item || !item.id) return false;
      const itemCity = (item.city || '').toLowerCase().trim();
      const itemLoc = (item.location || item.location_name || '').toLowerCase().trim();
      return !city || itemCity === city || itemLoc.includes(city) || city.includes(itemCity);
    });

    if (matched.length === 0) {
      matched = allItems.filter((item) => item && item.id);
    }

    if (chosenCategory.id !== 'all') {
      matched = matched.filter((item) => item.category === chosenCategory.id);
    }

    if (activeFilter === 'discount') {
      matched = matched.filter((item) => {
        const p = String(item.price || '').toLowerCase();
        const d = String(item.description || '').toLowerCase();
        return p.includes('₹') || d.includes('off') || d.includes('discount') || item.isNew;
      });
    } else if (activeFilter === 'urgent') {
      matched = matched.filter((item) => Boolean(item.capacity) || Boolean(item.stockCount) || item.is_active);
    } else if (activeFilter === 'gems') {
      matched = matched.filter((item) => Number(item.rating || 5) >= 4.5 || Number(item.interestCount || 0) > 0);
    } else if (activeFilter === 'nearby') {
      matched = matched.filter((item) => !item.distance || item.distance.includes('0.') || item.distance.includes('1.'));
    }

    if (q) {
      matched = matched.filter((item) => {
        const title = (item.title || item.name || '').toLowerCase();
        const desc = (item.description || '').toLowerCase();
        const loc = (item.location || '').toLowerCase();
        return title.includes(q) || desc.includes(q) || loc.includes(q);
      });
    }

    const shuffled = [...matched];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  }, [selectedCity, searchQuery, chosenCategory, activeFilter, shuffleKey]);

  const getMessageTemplate = (item) => {
    return `Namaste, I found your listing "${item.title || item.name}" in TownHub Surprise Discovery in ${selectedCity}. I want to inquire for more details.`;
  };

  return (
    <div className="p-3.5 space-y-3.5 relative z-10 animate-fade-in text-slate-100 flex-1">
      {/* Top Banner with Active Category Info & Navigation Buttons */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 p-4 rounded-3xl text-slate-950 shadow-xl flex items-center justify-between">
        <div className="min-w-0 pr-2">
          <div className="flex items-center space-x-1.5">
            <span className="text-lg">🫧</span>
            <h2 className="text-xs font-black uppercase tracking-wider leading-none">
              {chosenCategory.name}
            </h2>
          </div>
          <p className="text-[10px] font-bold text-slate-900 mt-1 truncate">
            Handpicked surprise listings in {selectedCity}
          </p>
        </div>

        <div className="flex items-center space-x-1.5 shrink-0">
          <button
            type="button"
            onClick={onOpenBubbles}
            className="px-2.5 py-1.5 bg-slate-950/20 hover:bg-slate-950/30 text-slate-950 text-xs font-black rounded-xl active:scale-90 transition cursor-pointer shadow-sm flex items-center space-x-1"
            title="Pop Another Bubble"
          >
            <span>🫧</span>
            <span>Bubbles</span>
          </button>

          <button
            type="button"
            onClick={() => setShuffleKey((k) => k + 1)}
            title="Shuffle Listings"
            className="px-3 py-1.5 bg-slate-950 hover:bg-slate-900 text-amber-300 text-xs font-black rounded-xl active:scale-90 transition cursor-pointer shadow-md flex items-center space-x-1"
          >
            <span>🎲</span>
            <span>Shuffle</span>
          </button>
        </div>
      </div>

      {/* Discovery Filter Tabs */}
      <div className="flex items-center space-x-1.5 overflow-x-auto py-1 scrollbar-none text-xs font-bold">
        {[
          { id: 'all', label: '🌟 All Finds' },
          { id: 'discount', label: '🏷️ Bhaari Discount' },
          { id: 'urgent', label: '⚡ Aaj Hi Chahiye' },
          { id: 'gems', label: '💎 Town Gems' },
          { id: 'nearby', label: '📍 Paas Mein (< 2 km)' },
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

      {/* Listings Stream */}
      {surpriseListings.length === 0 ? (
        <div className="bg-slate-900/60 rounded-3xl p-10 text-center border border-slate-800 space-y-3">
          <span className="text-4xl block">🔍</span>
          <h3 className="text-sm font-black text-white">No listings found in this sector</h3>
          <p className="text-xs text-slate-400 max-w-[240px] mx-auto">
            Try switching to "All Finds" or tap Bubbles to pop another category sphere.
          </p>
          <div className="flex items-center justify-center space-x-2">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className="px-4 py-2 bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer"
            >
              Reset Filters
            </button>
            <button
              type="button"
              onClick={onOpenBubbles}
              className="px-4 py-2 bg-slate-800 text-cyan-300 font-black text-xs rounded-xl border border-slate-700 shadow-md cursor-pointer"
            >
              🫧 Pop Another Bubble
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3.5">
          {surpriseListings.map((item) => (
            <SurpriseCardItem
              key={item.id}
              item={item}
              selectedCity={selectedCity}
              onSelect={() => setSelectedDetailItem(item)}
              getMessageTemplate={getMessageTemplate}
            />
          ))}
        </div>
      )}

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