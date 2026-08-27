import React, { useState } from 'react';
import BubblesDiscovery from './surprise/BubblesDiscovery';
import SurpriseListingFeed from './surprise/SurpriseListingFeed';

export default function SurpriseFeed({
  selectedCity = 'Alwar',
  searchQuery = '',
  onBack,
  onNewNotification,
}) {
  const [activeMode, setActiveMode] = useState('bubbles');
  const [selectedBubbleCat, setSelectedBubbleCat] = useState(null);

  const handleBubbleSelected = (catId) => {
    setSelectedBubbleCat(catId);
    setActiveMode('feed');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none pb-20">
      {/* Back Button (Only shows when browsing the popped feed) */}
      {activeMode === 'feed' && (
        <div className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md px-4 py-2 border-b border-slate-800 flex items-center justify-between shadow-md">
          <button
            type="button"
            onClick={() => setActiveMode('bubbles')}
            className="w-7 h-7 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400 text-xs font-black active:scale-90 transition cursor-pointer"
          >
            ❮
          </button>
          <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider">
            {selectedBubbleCat ? `${selectedBubbleCat} Deals` : 'Surprise Deals'}
          </span>
          <div className="w-7" />
        </div>
      )}

      {/* Pure Floating Bubbles */}
      <div className="flex-1 flex flex-col justify-center">
        {activeMode === 'bubbles' && (
          <BubblesDiscovery
            selectedCity={selectedCity}
            onSelectCategory={handleBubbleSelected}
          />
        )}

        {activeMode === 'feed' && (
          <SurpriseListingFeed
            selectedCity={selectedCity}
            filterCategory={selectedBubbleCat}
            searchQuery={searchQuery}
            onNewNotification={onNewNotification}
            onBackToBubbles={() => setActiveMode('bubbles')}
          />
        )}
      </div>
    </div>
  );
}