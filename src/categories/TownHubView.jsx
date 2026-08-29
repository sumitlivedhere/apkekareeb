import React, { useState, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { TAXONOMY_REGISTRY, getCategoryById } from '../data/taxonomyRegistry';
import PostListingModal from '../components/common/PostListingModal';
import { isBusinessAuthorized, getCurrentUserProfile } from '../services/authService';

export default function TownHubView({
  category = 'market',
  selectedCity = 'Alwar',
  onSelectSubCategory,
  onSelectCategory,
  onOpenAuth,
  onBack,
}) {
  const { isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [speakingId, setSpeakingId] = useState(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  // Retrieve category metadata and subcategory taxonomy
  const activeCategoryData = useMemo(() => {
    return (
      getCategoryById(category) ||
      TAXONOMY_REGISTRY[category] || {
        id: category,
        name: category.charAt(0).toUpperCase() + category.slice(1),
        hindi: 'लोकल श्रेणी',
        icon: '🏛️',
        subCategories: [
          { id: 'all', name: 'All Listings', hindi: 'सभी सूचियां', icon: '🌟' },
          { id: 'popular', name: 'Popular & Verified', hindi: 'प्रसिद्ध व सत्यापित', icon: '⭐' },
          { id: 'deals', name: 'Offers & Discounts', hindi: 'ऑफर्स व छूट', icon: '🏷️' },
          { id: 'services', name: 'Services & Trades', hindi: 'सेवाएं व कार्य', icon: '🛠️' },
        ],
      }
    );
  }, [category]);

  const subCategories = activeCategoryData.subCategories || [];

  const filteredSubs = useMemo(() => {
    if (!searchQuery.trim()) return subCategories;
    const q = searchQuery.toLowerCase().trim();
    return subCategories.filter(
      (sub) =>
        sub.name.toLowerCase().includes(q) ||
        (sub.hindi && sub.hindi.toLowerCase().includes(q)) ||
        sub.id.toLowerCase().includes(q)
    );
  }, [subCategories, searchQuery]);

  // 🔊 Audio Speech Synthesizer for Accessibility
  const handleSpeak = (e, item) => {
    e.stopPropagation();
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    setSpeakingId(item.id);

    const utterance = new SpeechSynthesisUtterance(`${item.name}. ${item.hindi || ''}`);
    utterance.lang = 'hi-IN';
    utterance.rate = 0.95;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    window.speechSynthesis.speak(utterance);
  };

  const handleSubClick = (subId) => {
    if (onSelectSubCategory) {
      onSelectSubCategory(subId);
    } else if (onSelectCategory) {
      onSelectCategory(category, subId);
    }
  };

  // ➕ Handlers for Post Modal Gating with Auth Trigger
  const handleOpenPostModal = () => {
    const user = getCurrentUserProfile();
    if (!user || !isBusinessAuthorized()) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    setIsPostModalOpen(true);
  };

  return (
    <div className="p-3.5 space-y-3.5 font-sans select-none pb-14 animate-fade-in">
      
      {/* 🌟 1. Header Navigation Bar */}
      <div
        className={`p-4 rounded-3xl border transition-colors shadow-md ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <button
            type="button"
            onClick={onBack}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer active:scale-95 flex items-center space-x-1 ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-amber-300'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
            }`}
          >
            <span>❮</span>
            <span>Back</span>
          </button>

          <div className="text-right">
            <span className="text-[9.5px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
              {selectedCity.toUpperCase()} HUB
            </span>
            <h1 className="text-sm font-black text-slate-900 dark:text-slate-100">
              {activeCategoryData.icon} {activeCategoryData.name}
            </h1>
          </div>
        </div>

        {/* Subcategory Search Input */}
        <div className="pt-3">
          <div
            className={`flex items-center rounded-2xl px-3.5 py-2.5 border transition-all ${
              isDark
                ? 'bg-slate-950 border-slate-800 focus-within:border-amber-400'
                : 'bg-slate-50 border-slate-300 focus-within:border-amber-500 focus-within:bg-white shadow-xs'
            }`}
          >
            <span className="text-slate-400 text-xs mr-2.5">🔍</span>
            <input
              type="text"
              placeholder={`Search in ${activeCategoryData.name}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden font-semibold"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 🌟 2. Quick Enlistment Banner */}
      <div
        className={`p-3.5 rounded-2xl border flex items-center justify-between shadow-sm ${
          isDark
            ? 'bg-slate-900/90 border-slate-800 text-slate-200'
            : 'bg-amber-50/70 border-amber-200/80 text-slate-900'
        }`}
      >
        <div className="min-w-0 pr-2">
          <span className="text-[9.5px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
            Merchant Action
          </span>
          <p className="text-xs font-black truncate">
            Enlist new {activeCategoryData.name} offering?
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenPostModal}
          className="px-3.5 py-2 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md active:scale-95 transition cursor-pointer flex items-center space-x-1.5 shrink-0"
        >
          <span>➕</span>
          <span>Post Here</span>
        </button>
      </div>

      {/* 🌟 3. Subcategories Header */}
      <div className="flex items-center justify-between px-1 pt-1">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-300">
          Subcategories (उप-श्रेणियां)
        </h3>
        <span
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black font-mono border ${
            isDark
              ? 'bg-slate-900 text-amber-400 border-slate-800'
              : 'bg-slate-100 text-slate-700 border-slate-300'
          }`}
        >
          {filteredSubs.length} Available
        </span>
      </div>

      {/* 🌟 4. High-Contrast Subcategory Cards Feed */}
      <div className="space-y-2.5">
        {filteredSubs.map((sub) => {
          const isSpeaking = speakingId === sub.id;

          return (
            <div
              key={sub.id}
              onClick={() => handleSubClick(sub.id)}
              className={`p-3.5 rounded-3xl border transition-all duration-150 cursor-pointer active:scale-[0.98] shadow-sm flex items-center justify-between space-x-3 ${
                isDark
                  ? 'bg-slate-900/90 border-slate-800 hover:border-amber-400/50 text-slate-100'
                  : 'bg-white border-slate-200 hover:border-amber-400 shadow-slate-200/40 text-slate-900'
              }`}
            >
              {/* Left: Icon & Typography */}
              <div className="flex items-center space-x-3.5 min-w-0">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 border ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 shadow-md'
                      : 'bg-slate-50 border-slate-200/80 shadow-xs'
                  }`}
                >
                  {sub.icon || activeCategoryData.icon || '🏷️'}
                </div>

                <div className="min-w-0">
                  <h4 className="text-[13px] font-black leading-snug truncate text-slate-900 dark:text-slate-100">
                    {sub.name}
                  </h4>
                  {sub.hindi && (
                    <p className="text-[11px] font-black text-amber-700 dark:text-amber-400 leading-snug mt-0.5 truncate">
                      {sub.hindi}
                    </p>
                  )}
                  <p className="text-[9.5px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                    📍 {selectedCity} • Verified Feed
                  </p>
                </div>
              </div>

              {/* Right: Speaker & Arrow */}
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={(e) => handleSpeak(e, sub)}
                  className={`w-9 h-9 rounded-2xl border flex items-center justify-center text-sm transition cursor-pointer active:scale-90 shadow-xs ${
                    isSpeaking
                      ? 'bg-amber-400 text-slate-950 border-amber-500 animate-pulse'
                      : isDark
                      ? 'bg-slate-950/80 hover:bg-slate-800 border-slate-800 text-slate-300'
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700 hover:text-amber-800'
                  }`}
                  title="बोलकर सुनें (Listen)"
                >
                  {isSpeaking ? '🔊' : '🔈'}
                </button>

                <span className="text-slate-400 dark:text-slate-500 text-xs font-black">
                  ➔
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Unified Guided Post Modal */}
      {isPostModalOpen && (
        <PostListingModal
          isOpen={isPostModalOpen}
          onClose={() => setIsPostModalOpen(false)}
          initialCategory={category}
          initialSubCategory="all"
          selectedCity={selectedCity}
        />
      )}
    </div>
  );
}