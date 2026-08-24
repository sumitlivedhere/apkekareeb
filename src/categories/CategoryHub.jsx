import React from 'react';
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

export default function CategoryHub({
  categoryId,
  selectedCity,
  onSelectSubCategory,
  onSelectCategory,
  onBack,
  ...restProps
}) {
  switch (categoryId) {
    case 'malls':
      return <MallsHub selectedCity={selectedCity} onSelectSubCategory={onSelectSubCategory} onBack={onBack} {...restProps} />;
    case 'kaarigar':
      return <KaarigarHub selectedCity={selectedCity} onSelectSubCategory={onSelectSubCategory} onBack={onBack} {...restProps} />;
    case 'property':
      return <PropertyHub selectedCity={selectedCity} onSelectSubCategory={onSelectSubCategory} onBack={onBack} {...restProps} />;
    case 'medical':
      return <MedicalHub selectedCity={selectedCity} onSelectSubCategory={onSelectSubCategory} onBack={onBack} {...restProps} />;
    case 'transporters':
      return <TransporterHub selectedCity={selectedCity} onSelectSubCategory={onSelectSubCategory} onBack={onBack} {...restProps} />;
    case 'white-collar':
      return <WhiteCollarHub selectedCity={selectedCity} onSelectSubCategory={onSelectSubCategory} onBack={onBack} {...restProps} />;
    case 'restaurants':
      return <RestaurantsHub selectedCity={selectedCity} onSelectSubCategory={onSelectSubCategory} onBack={onBack} {...restProps} />;
    case 'fashion':
      return <FashionHub selectedCity={selectedCity} onSelectSubCategory={onSelectSubCategory} onBack={onBack} {...restProps} />;
    case 'electronics':
      return <ElectronicsHub selectedCity={selectedCity} onSelectSubCategory={onSelectSubCategory} onBack={onBack} {...restProps} />;
    case 'furniture':
      return <FurnitureHub selectedCity={selectedCity} onSelectSubCategory={onSelectSubCategory} onBack={onBack} {...restProps} />;
    case 'vehicles':
      return <VehicleHub selectedCity={selectedCity} onSelectSubCategory={onSelectSubCategory} onBack={onBack} {...restProps} />;
    case 'festival':
      return <FestivalHub selectedCity={selectedCity}onSelectSubCategory={onSelectSubCategory}onSelectFestivalCategory={onSelectSubCategory}onBack={onBack}/>;
    case 'market':
      return <MarketHub selectedCity={selectedCity} onSelectSubCategory={onSelectSubCategory} onBack={onBack} {...restProps} />;
    case 'recommerce':
      return <ReCommerceHub selectedCity={selectedCity} onSelectSubCategory={onSelectSubCategory} onBack={onBack} {...restProps} />;
      case 'fitness':
      return <FitnessHub selectedCity={selectedCity} onSelectSubCategory={onSelectSubCategory} onBack={onBack} {...restProps} />;
    case 'creators':
      return <CreatorsHub selectedCity={selectedCity} onSelectSubCategory={onSelectSubCategory} onBack={onBack} {...restProps} />;
    case 'education':
      return <EducationHub selectedCity={selectedCity} onSelectSubCategory={onSelectSubCategory} onBack={onBack} {...restProps} />;
    case 'construction':
      return <ConstructionHub selectedCity={selectedCity} onSelectSubCategory={onSelectSubCategory} onBack={onBack} {...restProps} />;
    case 'shaadi':
      return <ShaadiHub selectedCity={selectedCity} onSelectSubCategory={onSelectSubCategory} onBack={onBack} {...restProps} />;
    case 'advertising':
      return <AdvertisingHub selectedCity={selectedCity} onSelectSubCategory={onSelectSubCategory} onBack={onBack} {...restProps} />;
    case 'community':
      return <CommunityHub selectedCity={selectedCity} onSelectSubCategory={onSelectSubCategory} onBack={onBack} {...restProps} />;
    default:
      return null;
  }
}