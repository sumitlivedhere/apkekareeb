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
    <div className="w-full h-[calc(100dvh-115px)] flex flex-col font-sans select-none overflow-hidden bg-slate-950 text-slate-100">
      {/* Back Button (Only visible after a bubble has been popped) */}
      {activeMode === 'feed' && (
        <div className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md px-4 py-2 border-b border-slate-800 flex items-center justify-between shadow-md shrink-0">
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

      {/* Screen-Contained Canvas */}
      <div className="flex-1 w-full overflow-hidden flex flex-col justify-center">
        {activeMode === 'bubbles' && (
          <BubblesDiscovery
            selectedCity={selectedCity}
            onSelectCategory={handleBubbleSelected}
          />
        )}

        {activeMode === 'feed' && (
          <div className="flex-1 overflow-y-auto pb-20">
            <SurpriseListingFeed
              selectedCity={selectedCity}
              filterCategory={selectedBubbleCat}
              searchQuery={searchQuery}
              onNewNotification={onNewNotification}
              onBackToBubbles={() => setActiveMode('bubbles')}
            />
          </div>
        )}
      </div>
    </div>
  );
}