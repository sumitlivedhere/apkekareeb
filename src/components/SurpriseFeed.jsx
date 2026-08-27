import React, { useState, useEffect, useRef } from 'react';
import BubblesDiscovery from './surprise/BubblesDiscovery';
import SurpriseListingFeed from './surprise/SurpriseListingFeed';

export default function SurpriseFeed({
  selectedCity = 'Alwar',
  searchQuery = '',
  onBack,
  onNewNotification,
}) {
  const [activeMode, setActiveMode] = useState('bubbles');
  const [chosenCategory, setChosenCategory] = useState({ id: 'all', name: 'All Mix' });

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  // Sync mode with browser popstate
  useEffect(() => {
    const handlePopState = () => {
      if (activeMode === 'feed') {
        setActiveMode('bubbles');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeMode]);

  const handleBubbleSelected = (catId, catName) => {
    setChosenCategory({
      id: catId || 'all',
      name: catName || 'Surprise Deals',
    });
    // Push sub-state so mobile back and swipe-right return to bubbles
    window.history.pushState({ surpriseMode: 'feed' }, '');
    setActiveMode('feed');
  };

  const handleFeedBack = () => {
    if (window.history.state && window.history.state.surpriseMode) {
      window.history.back();
    } else {
      setActiveMode('bubbles');
    }
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.changedTouches[0].clientX;
    touchStartY.current = e.changedTouches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (activeMode !== 'feed') return;
    const target = e.target;
    if (target.closest('.overflow-x-auto, input, textarea, select')) return;

    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Swiping right inside feed returns to bubbles
    if (deltaX > 55 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
      e.stopPropagation();
      handleFeedBack();
    }
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="w-full h-[calc(100dvh-115px)] flex flex-col font-sans select-none overflow-hidden bg-slate-950 text-slate-100"
    >
      {/* Back Button (Only visible after a bubble has been popped) */}
      {activeMode === 'feed' && (
        <div className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md px-4 py-2 border-b border-slate-800 flex items-center justify-between shadow-md shrink-0">
          <button
            type="button"
            onClick={handleFeedBack}
            className="w-7 h-7 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400 text-xs font-black active:scale-90 transition cursor-pointer"
          >
            ❮
          </button>
          <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider truncate max-w-[200px]">
            {chosenCategory.name}
          </span>
          <div className="w-7" />
        </div>
      )}

      {/* Screen-Contained Canvas */}
      <div className="flex-1 w-full overflow-hidden flex flex-col justify-center">
        {activeMode === 'bubbles' && (
          <BubblesDiscovery
            selectedCity={selectedCity}
            onSelectCategory={handleBubbleSelected}
            onBack={onBack}
          />
        )}

        {activeMode === 'feed' && (
          <div className="flex-1 overflow-y-auto pb-20">
            <SurpriseListingFeed
              selectedCity={selectedCity}
              searchQuery={searchQuery}
              chosenCategory={chosenCategory}
              onOpenBubbles={handleFeedBack}
              onNewNotification={onNewNotification}
            />
          </div>
        )}
      </div>
    </div>
  );
}