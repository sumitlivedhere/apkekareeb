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
  const [chosenCategory, setChosenCategory] = useState({ id: 'all', name: 'All Mix' });

  const handleBubbleSelected = (catId, catName) => {
    setChosenCategory({
      id: catId || 'all',
      name: catName || 'Surprise Deals',
    });
    setActiveMode('feed');
  };

  return (
    <div className="w-full h-[calc(100dvh-115px)] flex flex-col font-sans select-none overflow-hidden bg-slate-950 text-slate-100">
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
              onOpenBubbles={() => setActiveMode('bubbles')}
              onNewNotification={onNewNotification}
            />
          </div>
        )}
      </div>
    </div>
  );
}