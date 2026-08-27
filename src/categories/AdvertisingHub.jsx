import React, { useState } from 'react';
import { getCategoryById } from '../data/taxonomyRegistry';
import CategoryListFreeBanner from '../components/common/CategoryListFreeBanner';

const ADVERTISING_TRACKS = [
  {
    trackId: 'private-space-exchange',
    title: '1. Private Ad Space Exchange & Brand Space-Wanted (निजी जगह विज्ञापन एक्सचेंज)',
    subtitle: 'Monetize your roadside building rooftop/wall for monthly rental income, or find walls for brand painting',
    badge: 'SPACE MONETIZATION',
    subIds: ['private-space-roof-walls', 'brands-seeking-ad-space'],
  },
  {
    trackId: 'hoardings-townhub-promos',
    title: '2. Available UIT Hoardings & TownHub In-App Promos (यूआईटी होर्डिंग्स व ऐप विज्ञापन)',
    subtitle: 'Available municipal & UIT unipoles ready for immediate lease, plus top banner spots on TownHub app',
    badge: 'HIGH VISIBILITY',
    subIds: ['uit-vacant-hoardings-unipoles', 'townhub-inapp-featured'],
  },
  {
    trackId: 'newspapers-painters-flex',
    title: '3. Newspaper Ads, Wall Painters & Flex Printing (अखबार विज्ञापन, पेंटर व फ्लैक्स)',
    subtitle: 'Direct newspaper classified agents (Bhaskar/Patrika), commercial wall/pillar painters & 30-min flex printers',
    badge: 'PRINT & GROUND ADS',
    subIds: ['newspaper-classifieds-agents', 'wall-pillar-commercial-painters', 'flex-banner-standees', 'led-acrylic-glow-signboards'],
  },
  {
    trackId: 'audio-mobile-influencers',
    title: '4. Audio Announcements, LED Vans & Local Influencers (लाउडस्पीकर व इन्फ्लुएंसर)',
    subtitle: 'E-rickshaw microphone sound broadcast, mobile P3 LED video vans, local Instagram page promotions & WhatsApp marketing',
    badge: 'VIRAL & DIRECT REACH',
    subIds: ['autorickshaw-loudspeaker-promo', 'led-display-video-vans', 'local-influencer-reels-digital'],
  },
];

const FAST_PROMO_ACTIONS = [
  { subId: 'private-space-roof-walls', label: '🏡 List Your Roof/Wall for Rent', desc: 'Earn ₹3,000–₹25,000/month from ads' },
  { subId: 'brands-seeking-ad-space', label: '🎯 Free Wall Paint + Rent (Brands)', desc: 'Cement, agri & retail brands seeking walls' },
  { subId: 'newspaper-classifieds-agents', label: '📰 Book Newspaper Classified Ad', desc: 'Bhaskar & Patrika booking in 10 mins' },
  { subId: 'townhub-inapp-featured', label: '📱 Advertise on TownHub App', desc: 'Top banner reaching 50,000+ town buyers' },
];

export default function AdvertisingHub({
  selectedCity = 'Alwar',
  onSelectSubCategory,
  onSelectAdvertisingCategory,
  onPostClick,
  onBack,
}) {
  const categoryConfig = getCategoryById('advertising');
  const [activeTrack, setActiveTrack] = useState('all');

  const handleSelect = (subId, catName) => {
    if (typeof onSelectSubCategory === 'function') {
      onSelectSubCategory(subId);
    } else if (typeof onSelectAdvertisingCategory === 'function') {
      onSelectAdvertisingCategory(subId, catName);
    }
  };

  const visibleTracks = activeTrack === 'all'
    ? ADVERTISING_TRACKS
    : ADVERTISING_TRACKS.filter((t) => t.trackId === activeTrack);

  return (
    <div className="p-3.5 space-y-4 animate-fade-in text-slate-100 pb-16">
      
      {/* 🌟 1. HERO HEADER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-950 via-slate-900 to-orange-950 p-4 border border-amber-500/40 shadow-2xl">
        <div className="absolute -top-12 -right-12 w-44 h-44 bg-amber-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>

        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[10px] font-black uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
              <span>Ad Space & Promotion Hub • {selectedCity}</span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white mt-1 flex items-center space-x-1.5">
              <span>📢 Advertising & Space Exchange</span>
            </h2>
            <p className="text-[11px] text-amber-200/80 font-medium">
              Rent Private Rooftops/Walls, UIT Hoardings, Newspaper Ads, Painters & Influencers in {selectedCity}
            </p>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="text-xs bg-white/10 hover:bg-white/20 text-amber-100 px-3 py-1.5 rounded-xl font-bold backdrop-blur-md active:scale-95 transition cursor-pointer border border-white/10 shrink-0"
          >
            ← Town Hub
          </button>
        </div>

        {/* Quick Highlights Strip */}
        <div className="grid grid-cols-4 gap-2 mt-3 pt-2.5 border-t border-white/10 text-center">
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-amber-300">🏡 Rent Space</div>
            <div className="text-[8px] text-slate-400 font-semibold">Walls & Roofs</div>
          </div>
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-orange-300">🏙️ UIT Spots</div>
            <div className="text-[8px] text-slate-400 font-semibold">Vacant Hoardings</div>
          </div>
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-cyan-300">📰 Paper Ads</div>
            <div className="text-[8px] text-slate-400 font-semibold">Direct Agents</div>
          </div>
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-emerald-300">0% Cut</div>
            <div className="text-[8px] text-slate-400 font-semibold">Direct Deals</div>
          </div>
        </div>
      </div>

      {/* 🌟 2. FAST ACTION TILES: SPACE MONETIZATION & IN-APP PROMOS */}
      <section className="bg-gradient-to-r from-amber-950/70 via-slate-900 to-orange-950/70 p-3.5 rounded-3xl border border-amber-500/50 shadow-lg space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-1.5">
            <span className="text-sm">⚡</span>
            <h3 className="text-xs font-black text-amber-300 uppercase tracking-wide">
              Quick Ad Actions & Space Monetization
            </h3>
          </div>
          <span className="text-[9px] font-bold text-amber-300">Direct Connect</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {FAST_PROMO_ACTIONS.map((action, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelect(action.subId, action.label)}
              className="p-2.5 bg-slate-950/90 hover:bg-slate-900 rounded-2xl text-left transition cursor-pointer border border-amber-500/30 hover:border-amber-400 flex items-center justify-between active:scale-95 shadow-sm"
            >
              <div className="space-y-0.5">
                <div className="text-[11px] font-black text-slate-100 leading-tight">
                  {action.label}
                </div>
                <div className="text-[9px] text-slate-400 font-medium">{action.desc}</div>
              </div>
              <span className="text-xs text-amber-400 font-black ml-1">➔</span>
            </button>
          ))}
        </div>
      </section>

      {/* 🌟 3. TRACK SELECTOR CHIPS */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">
            Explore Promotion & Space Channels
          </span>
          <span className="text-[10px] text-slate-400 font-semibold">
            {categoryConfig.subCategories.length} Specialties
          </span>
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTrack('all')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-black shrink-0 transition cursor-pointer ${
              activeTrack === 'all'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md scale-105'
                : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
            }`}
          >
            ⚡ All Ad Tracks
          </button>

          {ADVERTISING_TRACKS.map((track) => (
            <button
              key={track.trackId}
              type="button"
              onClick={() => setActiveTrack(track.trackId)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-black shrink-0 transition cursor-pointer ${
                activeTrack === track.trackId
                  ? 'bg-amber-400 text-slate-950 shadow-md scale-105'
                  : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
              }`}
            >
              {track.badge}
            </button>
          ))}
        </div>
      </div>

      {/* 🌟 4. CATEGORIZED SECTIONS */}
      <div className="space-y-4">
        {visibleTracks.map((track) => (
          <section
            key={track.trackId}
            className="bg-slate-900/90 rounded-3xl p-3.5 border border-slate-800 shadow-md space-y-2.5"
          >
            <div className="px-1 border-b border-slate-800 pb-2 flex items-start justify-between">
              <div>
                <h3 className="text-xs font-black text-white">{track.title}</h3>
                <p className="text-[10px] text-slate-400 font-medium">{track.subtitle}</p>
              </div>
              <span className="text-[8px] font-black px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-400/30 shrink-0 ml-2">
                {track.badge}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {track.subIds.map((subId) => {
                const sub = categoryConfig.subCategories.find((s) => s.id === subId);
                if (!sub) return null;

                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => handleSelect(sub.id, sub.name)}
                    className="p-3 bg-slate-950/80 hover:bg-slate-850 rounded-2xl text-left transition cursor-pointer flex items-center justify-between border border-slate-800 hover:border-amber-500/50 shadow-sm group active:scale-[0.98]"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl p-2 bg-slate-900 rounded-xl border border-slate-800 group-hover:border-amber-500/40 shadow-inner shrink-0">
                        {sub.icon || '📢'}
                      </span>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-black text-slate-100 group-hover:text-amber-300 transition-colors leading-tight">
                            {sub.name.split('(')[0]}
                          </span>
                        </div>
                        <div className="text-[9px] text-slate-400 font-medium mt-0.5 truncate">
                          {sub.name.match(/\((.*?)\)/)?.[1] || 'सेवाएं व रेट'}
                        </div>
                      </div>
                    </div>

                    <span className="text-xs font-black text-amber-400 group-hover:translate-x-1 transition-transform shrink-0 ml-2">
                      ➔
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* 🌟 5. VIEW ALL BUTTON */}
      <button
        type="button"
        onClick={() => handleSelect('all', 'All Advertising & Spaces')}
        className="w-full py-3.5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 hover:from-slate-850 hover:to-slate-800 text-amber-300 border border-amber-500/30 rounded-2xl text-center text-xs font-black active:scale-95 transition cursor-pointer shadow-md"
      >
        🌟 View All Advertising Directory ({categoryConfig.subCategories.length} Categories)
      </button>

      {/* 🌟 6. INTERACTIVE LIST FREE WIDGET */}
      <CategoryListFreeBanner
        category="property"
        selectedCity={selectedCity}
        onPostClick={onPostClick}
      />
    </div>
  );
}