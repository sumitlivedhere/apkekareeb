import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAllListingsSlice } from '../../store/hyperlocalStore';
import {
  performUnifiedSearch,
  TRENDING_SEARCH_CHIPS,
  CATEGORY_SYNONYMS,
} from '../../utils/searchEngine';
import { CITY_ZONES } from '../../data/cityZones';

const RECENT_SEARCHES_KEY = 'aapkekareeb_recent_searches';
const cleanPhoneNum = (p) => (p ? String(p).replace(/\D/g, '').slice(-10) : '');

export default function SearchOverlay({
  isOpen = false,
  initialQuery = '',
  selectedCity = 'Alwar',
  onClose,
  onSelectCategory,
  onSelectIntent,
  onSelectListing,
}) {
  const allListings = useAllListingsSlice();
  const inputRef = useRef(null);

  const [query, setQuery] = useState(initialQuery || '');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedZone, setSelectedZone] = useState('all');
  const [isListening, setIsListening] = useState(false);
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  const saveRecentSearch = (term) => {
    const clean = String(term || '').trim();
    if (!clean || clean.length < 2) return;
    try {
      const updated = [clean, ...recentSearches.filter((s) => s.toLowerCase() !== clean.toLowerCase())].slice(0, 6);
      setRecentSearches(updated);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {}
  };

  const handleVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice search is not supported in this browser.');
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'hi-IN';
      setIsListening(true);
      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        if (transcript) {
          setQuery(transcript.trim());
          saveRecentSearch(transcript.trim());
        }
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const results = useMemo(() => {
    if (!query.trim()) return { intents: [], listings: [], totalCount: 0 };
    return performUnifiedSearch(allListings, query, {
      categoryFilter: selectedCategory,
      localityFilter: selectedZone,
      limit: 40,
    });
  }, [allListings, query, selectedCategory, selectedZone]);

  if (!isOpen) return null;

  return (
    <div
      data-modal-open="true"
      className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col font-sans select-none animate-fade-in text-slate-100"
    >
      {/* Top Search Bar Header */}
      <div className="w-full max-w-xl mx-auto p-3.5 border-b border-slate-800 space-y-2.5">
        <div className="flex items-center space-x-2">
          <div className="flex-1 flex items-center bg-slate-900 border-2 border-amber-400/70 rounded-2xl px-3.5 py-2">
            <span className="text-amber-400 text-sm mr-2">🔍</span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search anything in ${selectedCity}...`}
              className="w-full bg-transparent text-xs sm:text-sm font-bold text-white placeholder-slate-400 focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] mr-1.5 cursor-pointer"
              >
                ✕
              </button>
            )}
            <button
              type="button"
              onClick={handleVoiceSearch}
              className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs cursor-pointer ${
                isListening ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-800 text-amber-300'
              }`}
            >
              🎤
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-black text-slate-300 cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Locality Filter */}
        <div className="flex items-center space-x-2">
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-slate-200 outline-none"
          >
            <option value="all">📍 All {selectedCity} Localities</option>
            {Object.keys(CITY_ZONES || {}).map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-amber-300 outline-none"
          >
            <option value="all">🏛️ All 22 Categories</option>
            {Object.entries(CATEGORY_SYNONYMS).map(([id, meta]) => (
              <option key={id} value={id}>
                {meta.icon} {meta.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Body Results */}
      <div className="flex-1 overflow-y-auto w-full max-w-xl mx-auto p-4 space-y-4">
        {!query.trim() ? (
          <div className="space-y-4">
            {recentSearches.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-400">
                    🕒 Recent Searches
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setRecentSearches([]);
                      localStorage.removeItem(RECENT_SEARCHES_KEY);
                    }}
                    className="text-[10px] text-rose-400 font-bold cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {recentSearches.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => setQuery(term)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-200 cursor-pointer"
                    >
                      🕒 {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase text-amber-400 block">
                🔥 Trending in {selectedCity}
              </span>
              <div className="flex flex-wrap gap-2">
                {TRENDING_SEARCH_CHIPS.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => {
                      setQuery(chip.query);
                      saveRecentSearch(chip.query);
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 flex items-center space-x-1.5 cursor-pointer"
                  >
                    <span>{chip.icon}</span>
                    <span>{chip.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Intent Matches */}
            {results.intents.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase text-amber-400 block">
                  🏛️ Matching Categories
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {results.intents.map((intent) => (
                    <div
                      key={`${intent.categoryId}_${intent.subCategory?.id || 'root'}`}
                      onClick={() => {
                        saveRecentSearch(query);
                        onClose && onClose();
                        if (intent.subCategory?.id && onSelectIntent) {
                          onSelectIntent(intent.categoryId, intent.subCategory.id);
                        } else if (onSelectCategory) {
                          onSelectCategory(intent.categoryId, 'all');
                        }
                      }}
                      className="p-3 rounded-2xl bg-slate-900 border border-amber-400/40 flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <span className="text-xl">{intent.icon}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-white truncate">
                            {intent.subCategory ? intent.subCategory.name : intent.title}
                          </p>
                          <p className="text-[10px] text-amber-400 font-bold truncate">
                            {intent.hindi}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-amber-400">➔</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Listing Results */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-black uppercase text-slate-400 block">
                📦 Matching Listings ({results.totalCount})
              </span>

              {results.listings.map((item) => {
                const phone = cleanPhoneNum(item.phone || item.whatsapp);
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      saveRecentSearch(query);
                      onClose && onClose();
                      onSelectListing && onSelectListing(item);
                    }}
                    className="p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-400/50 flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <img
                        src={item.image || item.image_url}
                        alt={item.title}
                        className="w-14 h-14 rounded-xl object-cover shrink-0 bg-slate-950"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-white truncate">
                          {item.title || item.name}
                        </h4>
                        <p className="text-xs font-mono font-black text-emerald-400">
                          {item.price}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          🏬 {item.sellerName} • 📍 {item.location}
                        </p>
                      </div>
                    </div>

                    <a
                      href={`tel:+91${phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-[10px] shrink-0"
                    >
                      📞 Call
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}