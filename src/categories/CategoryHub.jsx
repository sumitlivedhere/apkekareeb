import React, { useState } from 'react';
import KaarigarHub from './KaarigarHub';
import PropertyHub from './PropertyHub';
import TransporterHub from './TransporterHub';
import WhiteCollarHub from './WhiteCollarHub';
import RestaurantsHub from './RestaurantsHub';
import FashionHub from './FashionHub';
import ElectronicsHub from './ElectronicsHub';
import FurnitureHub from './FurnitureHub';
import FestivalHub from './FestivalHub';
import VehicleHub from './VehicleHub';
import MarketHub from './MarketHub';
import ReCommerceHub from './ReCommerceHub';
import EducationHub from './EducationHub';
import ConstructionHub from './ConstructionHub';
import ShaadiHub from './ShaadiHub';
import AdvertisingHub from './AdvertisingHub';
import CommunityHub from './CommunityHub';
import MedicalHub from './MedicalHub';
import MallsHub from './MallsHub';
import FitnessHub from './FitnessHub';
import CreatorsHub from './CreatorsHub';
import PostListingModal from '../components/common/PostListingModal';
import { getCategoryById } from '../data/taxonomyRegistry';
import { isBusinessAuthorized } from '../services/authService';

export default function CategoryHub({
  categoryId,
  selectedCity,
  onSelectSubCategory,
  onSelectCategory,
  onBack,
  onOpenAuth,
  ...restProps
}) {
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [activeSubCategory, setActiveSubCategory] = useState('all');

  const categoryConfig = getCategoryById(categoryId) || {
    name: categoryId ? categoryId.toUpperCase() : 'Marketplace',
    subCategories: [],
  };

  const handleSubCategoryChange = (subId) => {
    setActiveSubCategory(subId);
    if (onSelectSubCategory) onSelectSubCategory(subId);
  };

  const handleOpenPostModal = () => {
    if (!isBusinessAuthorized()) {
      if (onOpenAuth) onOpenAuth();
      else alert('Please verify your business profile to post listings.');
      return;
    }
    setIsPostModalOpen(true);
  };

  // Render specific hub component based on categoryId
  const renderHubContent = () => {
    const hubProps = {
      selectedCity,
      onSelectSubCategory: handleSubCategoryChange,
      onBack,
      ...restProps,
    };

    switch (categoryId) {
      case 'malls':
        return <MallsHub {...hubProps} />;
      case 'kaarigar':
        return <KaarigarHub {...hubProps} />;
      case 'property':
        return <PropertyHub {...hubProps} />;
      case 'medical':
        return <MedicalHub {...hubProps} />;
      case 'transporters':
      case 'transport':
        return <TransporterHub {...hubProps} />;
      case 'white-collar':
        return <WhiteCollarHub {...hubProps} />;
      case 'restaurants':
        return <RestaurantsHub {...hubProps} />;
      case 'fashion':
        return <FashionHub {...hubProps} />;
      case 'electronics':
        return <ElectronicsHub {...hubProps} />;
      case 'furniture':
        return <FurnitureHub {...hubProps} />;
      case 'vehicles':
        return <VehicleHub {...hubProps} />;
      case 'festival':
        return (
          <FestivalHub
            {...hubProps}
            onSelectFestivalCategory={handleSubCategoryChange}
          />
        );
      case 'market':
        return <MarketHub {...hubProps} />;
      case 'recommerce':
        return <ReCommerceHub {...hubProps} />;
      case 'fitness':
        return <FitnessHub {...hubProps} />;
      case 'creators':
        return <CreatorsHub {...hubProps} />;
      case 'education':
        return <EducationHub {...hubProps} />;
      case 'construction':
        return <ConstructionHub {...hubProps} />;
      case 'shaadi':
        return <ShaadiHub {...hubProps} />;
      case 'advertising':
        return <AdvertisingHub {...hubProps} />;
      case 'community':
        return <CommunityHub {...hubProps} />;
      default:
        return <MarketHub {...hubProps} />;
    }
  };

  return (
    <div className="space-y-3 font-sans text-slate-100 select-none pb-20">
      
      {/* ─── CONTEXT-LOCKED POST HERE BAR (ABOVE SCROLLABLE FEED) ─── */}
      <div className="flex items-center justify-between bg-slate-900/95 border border-slate-800/80 px-4 py-2.5 rounded-2xl shadow-md">
        <div className="flex items-center space-x-2 min-w-0 pr-2">
          <span className="text-sm">📍</span>
          <span className="text-xs font-bold text-slate-300 truncate">
            {categoryConfig.name || categoryId} • {selectedCity}
          </span>
        </div>

        <button
          type="button"
          onClick={handleOpenPostModal}
          className="px-3.5 py-1.5 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md active:scale-95 transition cursor-pointer flex items-center space-x-1.5 shrink-0"
        >
          <span>➕</span>
          <span>Post Here</span>
        </button>
      </div>

      {/* Dynamic Hub View */}
      <div className="animate-fade-in">
        {renderHubContent()}
      </div>

      {/* Unified Post Listing Modal (Pre-locked to current Category & Subcategory) */}
      {isPostModalOpen && (
        <PostListingModal
          isOpen={isPostModalOpen}
          onClose={() => setIsPostModalOpen(false)}
          initialCategory={categoryId || 'market'}
          initialSubCategory={activeSubCategory}
          selectedCity={selectedCity}
        />
      )}
    </div>
  );
}