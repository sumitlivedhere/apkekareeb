import { useState, useEffect } from 'react';
import { initialShaadiVendors } from '../data/shaadiData';
import { initialTransportFirms, initialIndividualTransporters } from '../data/transporterData';
import { initialKaarigarWorkers } from '../data/kaarigarData';

import { initialAdvertisingProviders } from '../data/advertisingData';
import { initialEducationListings } from '../data/educationData';
import { initialConstructionListings } from '../data/constructionData';
import { initialMallsStores } from '../data/mallsData';
import * as marketDataModule from '../data/marketData';

import { initialRestaurantsList } from '../data/restaurantsData';
import { initialWhiteCollarListings } from '../data/whiteCollarData';
import { initialListings } from '../data/mockData';
import { initialCommunityDrives } from '../data/communityData';
import { initialReCommerceListings } from '../data/reCommerceData';
import { initialPropertyListings } from '../data/propertyData';
import { initialFitnessListings } from '../data/fitnessData';
import { initialFestivalOffers } from '../data/festivalData';
import { initialMedicalListings } from '../data/medicalData';
import { initialCreatorsListings } from '../data/creatorsData';
import { initialTravelListings } from '../data/travelData';

import { supabase } from '../services/supabaseClient';
import {
  getCategoryFallback,
  saveCommentToDB,
  updateInterestCountInDB,
} from '../services/listingService';
import { getCategoryById, sanitizeSubCategoryId } from '../data/taxonomyRegistry';
import { getCurrentUserProfile, isAdminAuthorized } from '../services/authService';

const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;
const USER_INTERESTS_STORAGE_KEY = 'aapkekareeb_user_interests';
const USER_REVIEWS_STORAGE_KEY = 'aapkekareeb_user_reviews';
const USER_NOTIFS_STORAGE_KEY = 'aapkekareeb_read_notifs';
const PROMOTED_STORAGE_KEY = 'aapkekareeb_promoted_listings';

// 💳 Monetization & Subscription Plans
export const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: 'Free Citizen Plan',
    priceMonthly: 0,
    badge: null,
    canPostFlashDeals: false,
    canPostPromotions: false,
  },
  retail_pro: {
    id: 'retail_pro',
    name: 'Local Dukaan Pro',
    priceMonthly: 199,
    badge: 'VERIFIED SHOP',
    canPostFlashDeals: true,
    canPostPromotions: true,
    maxListingsPerCategory: 25,
  },
  commercial_partner: {
    id: 'commercial_partner',
    name: 'Verified Commercial Partner',
    priceMonthly: 499,
    badge: 'VERIFIED PARTNER',
    canPostFlashDeals: true,
    canPostPromotions: true,
    maxListingsPerCategory: 100,
  },
};

// 🏛️ 3-Tier Categorization Quotas
export const MONETIZATION_TIER_CONFIG = {
  // Tier 1: Community & Habit Builders (Free)
  community: { tier: 1, tierName: 'Community & Habit', freeLimit: 999, requiredPlan: 'free' },
  kaarigar: { tier: 1, tierName: 'Community & Habit', freeLimit: 5, requiredPlan: 'retail_pro' },
  recommerce: { tier: 1, tierName: 'Community & Habit', freeLimit: 5, requiredPlan: 'retail_pro' },
  creators: { tier: 1, tierName: 'Community & Habit', freeLimit: 5, requiredPlan: 'retail_pro' },

  // Tier 2: Local Retail & Services (Freemium - 3 free listings)
  market: { tier: 2, tierName: 'Local Retail & Services', freeLimit: 3, requiredPlan: 'retail_pro' },
  restaurants: { tier: 2, tierName: 'Local Retail & Services', freeLimit: 3, requiredPlan: 'retail_pro' },
  electronics: { tier: 2, tierName: 'Local Retail & Services', freeLimit: 3, requiredPlan: 'retail_pro' },
  fashion: { tier: 2, tierName: 'Local Retail & Services', freeLimit: 3, requiredPlan: 'retail_pro' },
  furniture: { tier: 2, tierName: 'Local Retail & Services', freeLimit: 3, requiredPlan: 'retail_pro' },
  fitness: { tier: 2, tierName: 'Local Retail & Services', freeLimit: 3, requiredPlan: 'retail_pro' },
  education: { tier: 2, tierName: 'Local Retail & Services', freeLimit: 3, requiredPlan: 'retail_pro' },
  transporter: { tier: 2, tierName: 'Local Retail & Services', freeLimit: 3, requiredPlan: 'retail_pro' },
  transporters: { tier: 2, tierName: 'Local Retail & Services', freeLimit: 3, requiredPlan: 'retail_pro' },
  travel: { tier: 2, tierName: 'Local Retail & Services', freeLimit: 3, requiredPlan: 'retail_pro' },

  // Tier 2 Paid Boost Verticals (Flash Deals & Festival Offers)
  surprise: { tier: 2, tierName: 'Flash Deals & Promos', freeLimit: 1, requiredPlan: 'retail_pro' },
  festival: { tier: 2, tierName: 'Flash Deals & Promos', freeLimit: 1, requiredPlan: 'retail_pro' },

  // Tier 3: High-Ticket Commercial (1 Free for Owners; Partner Plan for Brokers/Agencies)
  property: { tier: 3, tierName: 'High-Ticket Commercial', freeLimit: 1, requiredPlan: 'commercial_partner' },
  vehicle: { tier: 3, tierName: 'High-Ticket Commercial', freeLimit: 1, requiredPlan: 'commercial_partner' },
  vehicles: { tier: 3, tierName: 'High-Ticket Commercial', freeLimit: 1, requiredPlan: 'commercial_partner' },
  shaadi: { tier: 3, tierName: 'High-Ticket Commercial', freeLimit: 1, requiredPlan: 'commercial_partner' },
  construction: { tier: 3, tierName: 'High-Ticket Commercial', freeLimit: 1, requiredPlan: 'commercial_partner' },
  malls: { tier: 3, tierName: 'High-Ticket Commercial', freeLimit: 1, requiredPlan: 'commercial_partner' },
  whitecollar: { tier: 3, tierName: 'High-Ticket Commercial', freeLimit: 1, requiredPlan: 'commercial_partner' },
  'white-collar': { tier: 3, tierName: 'High-Ticket Commercial', freeLimit: 1, requiredPlan: 'commercial_partner' },
  advertising: { tier: 3, tierName: 'High-Ticket Commercial', freeLimit: 0, requiredPlan: 'commercial_partner' },
};

// ⏳ Freshness & Time-To-Live (Hours)
export const CATEGORY_TTL_HOURS = {
  surprise: 48,        // 48 hours for Flash Deals
  festival: 24 * 7,    // 7 days for Festival Offers
  recommerce: 24 * 21, // 21 days for Pre-owned / Used Goods
  default: 24 * 60,    // 60 days default freshness window
};

// 🛡️ Legal, Safety & Privacy Rules by Vertical
export const CATEGORY_SAFETY_RULES = {
  medical: {
    requiresDisclaimer: true,
    requireLicenseField: true,
    badgeLabel: 'DIRECTORY LISTING ONLY',
    disclaimerTitle: 'Medical & Emergency Disclaimer',
    disclaimerText:
      'ApkeKareeb is a local discovery directory and does not provide medical advice, diagnosis, or emergency services. Verify practitioner registration independently. In a medical emergency, call 108 or 112 immediately.',
  },
  shaadi: {
    requiresDisclaimer: true,
    maskPublicPhone: true,
    badgeLabel: 'PRIVACY PROTECTED',
    disclaimerTitle: 'Matrimonial Privacy & Safety Notice',
    disclaimerText:
      'Family contact numbers are masked for public visitors. Sign in to send a verified interest request, and always conduct independent family/background verification.',
  },
  whitecollar: {
    requiresDisclaimer: true,
    badgeLabel: 'ZERO JOB FEE POLICY',
    disclaimerTitle: 'Job Seeker Safety Warning',
    disclaimerText:
      'Never pay any registration fee, security deposit, or interview charge to any employer or recruiter. Report any listing demanding money immediately.',
  },
  property: {
    requiresDisclaimer: true,
    badgeLabel: 'VERIFY DOCUMENTS',
    disclaimerTitle: 'Property Transaction Advisory',
    disclaimerText:
      'Never transfer token money or advance rent without visiting the property in person and verifying ownership documents.',
  },
};

const sanitizePhone = (phone) => (phone ? String(phone).replace(/\D/g, '').slice(-10) : null);

function isValidUuid(id) {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id).trim());
}

// Old static single-category fallback URLs that caused duplicate thumbnails
const LEGACY_GENERIC_FALLBACK_IDS = new Set([
  'photo-1560518883-ce09059eeffa',
  'photo-1519003722824-194d4455a60c',
  'photo-1586528116311-ad8dd3c8310d',
  'photo-1549399542-7e3f8b79c341',
  'photo-1511707171634-5f897ff02aa9',
  'photo-1550009158-9ebf69173e03',
  'photo-1489987707025-afc232f7ea0f',
  'photo-1490481651871-ab68de25d43d',
  'photo-1555041469-a586c61ea9bc',
  'photo-1621905251189-08b45d6a269e',
  'photo-1581578731548-c64695cc6952',
  'photo-1584622650111-993a426fbf0a',
  'photo-1519494026892-80bbd2d6fd0d',
  'photo-1517248135467-4c7edcad34c4',
  'photo-1542751371-adc38448a05e',
  'photo-1542601906990-b4d3fb778b09',
  'photo-1504307651254-35680f356dfd',
  'photo-1574717024653-61fd2cf4d44d',
  'photo-1523240795612-9a054b0db644',
  'photo-1509062522246-3755977927d7',
  'photo-1534438327276-14e5300c3a48',
  'photo-1441986300917-64674bd600d8',
  'photo-1542838132-92c53300491e',
  'photo-1519741497674-611481863552',
  'photo-1554224155-8d04cb21cd6c',
  'photo-1526170375885-4d8ecf77b99f',
  'photo-1526304640581-d334cdbbf45e',
]);

// 🎨 Curated Multi-Image Pools by Category & Subcategory Keyword
const SUBCATEGORY_IMAGE_POOLS = {
  property_rent: [
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=700',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=700',
    'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=700',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=700',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=700',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=700',
  ],
  travel: [
    'https://images.unsplash.com/photo-1534567153574-2b12153a87f0?w=700',
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=700',
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=700',
    'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=700',
    'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=700',
  ],
  property_house: [
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=700',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=700',
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=700',
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=700',
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=700',
    'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=700',
  ],
  property_plot: [
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=700',
    'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=700',
    'https://images.unsplash.com/photo-1592595896551-12b371d546d5?w=700',
    'https://images.unsplash.com/photo-1516156008625-3a9d6067fab5?w=700',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=700',
  ],
  property_commercial: [
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=700',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=700',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=700',
    'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=700',
    'https://images.unsplash.com/photo-1582037928769-181f2644ecb7?w=700',
  ],
  property_pg: [
    'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=700',
    'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=700',
    'https://images.unsplash.com/photo-1540518614846-7ede433c4efb?w=700',
    'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=700',
  ],
  kaarigar: [
    'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=700',
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=700',
    'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=700',
    'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=700',
    'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=700',
    'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=700',
    'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=700',
    'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?w=700',
  ],
  transporters: [
    'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=700',
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=700',
    'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=700',
    'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=700',
    'https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=700',
    'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=700',
  ],
  vehicles: [
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=700',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=700',
    'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=700',
    'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=700',
    'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=700',
    'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=700',
  ],
  market: [
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=700',
    'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=700',
    'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=700',
    'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=700',
    'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=700',
    'https://images.unsplash.com/photo-1506617420156-8e4536971650?w=700',
  ],
  malls: [
    'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=700',
    'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=700',
    'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=700',
    'https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?w=700',
    'https://images.unsplash.com/photo-1582037928769-181f2644ecb7?w=700',
  ],
  restaurants: [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=700',
    'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=700',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=700',
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=700',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=700',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=700',
  ],
  medical: [
    'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=700',
    'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=700',
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=700',
    'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=700',
    'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=700',
    'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=700',
  ],
  fitness: [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=700',
    'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=700',
    'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=700',
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=700',
    'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=700',
  ],
  education: [
    'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=700',
    'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=700',
    'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=700',
    'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=700',
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=700',
  ],
  shaadi: [
    'https://images.unsplash.com/photo-1519741497674-611481863552?w=700',
    'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=700',
    'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=700',
    'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=700',
    'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=700',
  ],
  electronics: [
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=700',
    'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=700',
    'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=700',
    'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=700',
    'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=700',
  ],
  fashion: [
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=700',
    'https://images.unsplash.com/photo-1445205170230-053b83016050?w=700',
    'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=700',
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=700',
    'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=700',
  ],
  furniture: [
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=700',
    'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=700',
    'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=700',
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=700',
    'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=700',
  ],
  construction: [
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=700',
    'https://images.unsplash.com/photo-1541888946425-d09bb18086f6?w=700',
    'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=700',
    'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=700',
    'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=700',
  ],
  recommerce: [
    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=700',
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=700',
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=700',
    'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=700',
    'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=700',
  ],
  'white-collar': [
    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=700',
    'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=700',
    'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=700',
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=700',
  ],
  creators: [
    'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=700',
    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=700',
    'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=700',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=700',
  ],
  advertising: [
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=700',
    'https://images.unsplash.com/photo-1557838923-2985c318be48?w=700',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=700',
    'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=700',
  ],
  community: [
    'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=700',
    'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=700',
    'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=700',
    'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=700',
  ],
  festival: [
    'https://images.unsplash.com/photo-1514222134-b57cbb8ce073?w=700',
    'https://images.unsplash.com/photo-1604514628550-37477afdf4e3?w=700',
    'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?w=700',
    'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=700',
  ],
};

function computeDeterministicHash(str = '') {
  let hash = 0;
  const clean = String(str);
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getUniqueSubcategoryFallback(category = 'property', subCategory = 'all', seedStr = '') {
  const cat = String(category || 'property').toLowerCase().trim();
  const sub = String(subCategory || '').toLowerCase().trim();
  const combinedText = `${sub} ${seedStr}`.toLowerCase();

  let pool = SUBCATEGORY_IMAGE_POOLS[cat];

  if (cat === 'property') {
    if (combinedText.includes('plot') || combinedText.includes('land') || combinedText.includes('farm') || combinedText.includes('bigha')) {
      pool = SUBCATEGORY_IMAGE_POOLS.property_plot;
    } else if (combinedText.includes('shop') || combinedText.includes('showroom') || combinedText.includes('godown') || combinedText.includes('office') || combinedText.includes('commercial')) {
      pool = SUBCATEGORY_IMAGE_POOLS.property_commercial;
    } else if (combinedText.includes('pg') || combinedText.includes('hostel') || combinedText.includes('student')) {
      pool = SUBCATEGORY_IMAGE_POOLS.property_pg;
    } else if (combinedText.includes('rent') || combinedText.includes('flat')) {
      pool = SUBCATEGORY_IMAGE_POOLS.property_rent;
    } else {
      pool = SUBCATEGORY_IMAGE_POOLS.property_house;
    }
  }

  if (!pool || pool.length === 0) {
    pool = SUBCATEGORY_IMAGE_POOLS.property_house;
  }

  const hashIndex = computeDeterministicHash(`${cat}_${sub}_${seedStr}`) % pool.length;
  return pool[hashIndex];
}

function isGenericFallbackUrl(url) {
  if (!url || typeof url !== 'string') return true;
  for (const id of LEGACY_GENERIC_FALLBACK_IDS) {
    if (url.includes(id)) return true;
  }
  return false;
}

// 🚀 Persistent Paid Promotions Registry
export function getStoredPromotionsMap() {
  try {
    const raw = localStorage.getItem(PROMOTED_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    const now = Date.now();
    const valid = {};
    Object.keys(parsed).forEach((id) => {
      const entry = parsed[id];
      if (entry && (!entry.expiresAt || new Date(entry.expiresAt).getTime() > now)) {
        valid[id] = entry;
      }
    });
    return valid;
  } catch {
    return {};
  }
}

export function saveStoredPromotion(listingId, isPromoted, expiresAt = null) {
  if (!listingId) return;
  try {
    const map = getStoredPromotionsMap();
    const strId = String(listingId);
    if (isPromoted) {
      map[strId] = {
        is_promoted: true,
        deal_type: 'PAID_PROMO',
        expiresAt: expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        promotedAt: new Date().toISOString(),
      };
    } else {
      delete map[strId];
    }
    localStorage.setItem(PROMOTED_STORAGE_KEY, JSON.stringify(map));
  } catch {}
}

function getUserCartStorageKey(phone) {
  if (!phone) return null;
  const clean = sanitizePhone(phone);
  return `aapkekareeb_cart_${clean}`;
}

function getStoredCartForUser(phone) {
  const key = getUserCartStorageKey(phone);
  if (!key) return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredCartForUser(phone, items) {
  const key = getUserCartStorageKey(phone);
  if (!key) return;
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {}
}

function getStoredInterestsMap() {
  try {
    const raw = localStorage.getItem(USER_INTERESTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredInterestsMap(data) {
  try {
    localStorage.setItem(USER_INTERESTS_STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

function getStoredReviewsMap() {
  try {
    const raw = localStorage.getItem(USER_REVIEWS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredReviewsMap(data) {
  try {
    localStorage.setItem(USER_REVIEWS_STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

export function getStoredReadNotifs() {
  try {
    const raw = localStorage.getItem(USER_NOTIFS_STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function saveStoredReadNotif(id) {
  if (!id) return;
  try {
    const set = getStoredReadNotifs();
    set.add(String(id));
    localStorage.setItem(USER_NOTIFS_STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

export function saveStoredAllReadNotifs(ids = []) {
  try {
    const set = getStoredReadNotifs();
    ids.forEach((id) => set.add(String(id)));
    localStorage.setItem(USER_NOTIFS_STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

export const ADMIN_TAGS = new Set([
  'NEW ENLISTMENT',
  'NEW_ENLISTMENT',
  'EDIT PROPOSAL',
  'EDIT_PROPOSAL',
  'FLAGGED_REPORT',
  'REPORT',
  'NEW_USER_PIN',
  'USER_PIN_REQUEST',
  'SELLER_PIN_REQUEST',
  'SELLER FEEDBACK REPLY',
  'SELLER_FEEDBACK_REPLY',
  'SELLER VOICE REPLY',
  'SELLER_VOICE_REPLY',
  'TRUST & SAFETY ALERT',
]);

export const SELLER_TAGS = new Set([
  'VOICE INQUIRY',
  'VOICE_INQUIRY',
  'NEW COMMENT',
  'USER_COMMENT',
  'APPROVED',
  'LISTING_APPROVED',
  'ADMIN FEEDBACK',
  'ADMIN_FEEDBACK',
  'ADMIN VOICE NOTE',
  'REJECTED',
  'LISTING_REJECTED',
  'INTEREST REGISTERED',
  'INTEREST_REGISTERED',
  'INTEREST_ALERT',
  'NEW_REVIEW',
  'CART_ADDITION',
  'WHATSAPP LEAD',
  'CALL INQUIRY',
]);

export function parseNumericPrice(priceStr) {
  if (!priceStr || typeof priceStr !== 'string') return 0;
  const clean = priceStr.toLowerCase().replace(/,/g, '');
  if (clean.includes('lakh')) {
    const val = parseFloat(clean.replace(/[^\d.]/g, ''));
    return isNaN(val) ? 0 : Math.round(val * 100000);
  }
  const numericOnly = clean.replace(/[^\d.]/g, '');
  const parsed = parseFloat(numericOnly);
  return isNaN(parsed) ? 0 : Math.round(parsed);
}

export const CATEGORY_SLICE_MAP = {
  property: 'propertyListings',
  construction: 'constructionListings',
  transporters: 'transportFirms',
  transport: 'transportFirms',
  vehicles: 'listings',
  kaarigar: 'kaarigarWorkers',
  market: 'marketProducts',
  shaadi: 'shaadiVendors',
  travel: 'travelListings',
  medical: 'medicalListings',
  fitness: 'fitnessListings',
  creators: 'creatorsListings',
  education: 'educationListings',
  advertising: 'advertisingProviders',
  community: 'communityDrives',
  malls: 'mallsStores',
  restaurants: 'restaurantsList',
  'white-collar': 'whiteCollarListings',
  recommerce: 'reCommerceListings',
  festival: 'festivalOffers',
};

export function sanitizeImageUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const clean = url.trim();
  if (!clean || clean.startsWith('blob:')) return null;

  if (clean.startsWith('photo-')) {
    return `https://images.unsplash.com/${clean}`;
  }

  if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:image')) {
    return clean;
  }

  return null;
}

export function normalizeDBListing(item) {
  if (!item) return null;
  const itemId = String(item.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`);
  const catId = (item.category || 'property').toLowerCase().trim();
  const categoryConfig = getCategoryById(catId) || {};
  const rawSub =
    item.sub_category ||
    item.subCategory ||
    item.propertyType ||
    item.trade ||
    item.tradeType ||
    item.vehicleType ||
    item.profession ||
    item.cuisine ||
    'all';
  const subCatId = sanitizeSubCategoryId ? sanitizeSubCategoryId(catId, rawSub) : rawSub;
  const nameVal = item.title || item.name || 'Untitled Listing';

  let rawImages = [];
  if (Array.isArray(item.image_urls) && item.image_urls.length > 0) {
    rawImages = item.image_urls;
  } else if (Array.isArray(item.images) && item.images.length > 0) {
    rawImages = item.images;
  } else if (typeof item.image_urls === 'string' && item.image_urls.startsWith('[')) {
    try {
      rawImages = JSON.parse(item.image_urls);
    } catch {}
  }

  let sanitizedImages = rawImages
    .map((img) => (typeof img === 'string' ? sanitizeImageUrl(img) : sanitizeImageUrl(img?.url)))
    .filter(Boolean);

  const explicitSingleImage =
    sanitizeImageUrl(item.image) ||
    sanitizeImageUrl(item.photo) ||
    sanitizeImageUrl(item.avatar) ||
    sanitizeImageUrl(item.image_url);

  const uniqueFallback = getUniqueSubcategoryFallback(catId, subCatId, `${itemId}_${nameVal}`);

  let coverImage = explicitSingleImage || (sanitizedImages.length > 0 ? sanitizedImages[0] : null);
  if (!coverImage || isGenericFallbackUrl(coverImage)) {
    coverImage = uniqueFallback;
  }

  sanitizedImages = sanitizedImages.map((imgUrl) =>
    isGenericFallbackUrl(imgUrl) ? coverImage : imgUrl
  );

  if (sanitizedImages.length === 0 && coverImage) {
    sanitizedImages = [coverImage];
  } else if (coverImage && !sanitizedImages.includes(coverImage)) {
    sanitizedImages = [coverImage, ...sanitizedImages];
  }

  let allVideos = [];
  if (Array.isArray(item.videos) && item.videos.length > 0) {
    allVideos = item.videos.filter((v) => v?.url && !String(v.url).startsWith('blob:'));
  } else if (typeof item.videos === 'string' && item.videos.startsWith('[')) {
    try {
      allVideos = JSON.parse(item.videos);
    } catch {}
  }

  let allVideoUrls = [];
  if (Array.isArray(item.video_urls) && item.video_urls.length > 0) {
    allVideoUrls = item.video_urls.filter((u) => u && !String(u).startsWith('blob:'));
  } else if (allVideos.length > 0) {
    allVideoUrls = allVideos.map((v) => (typeof v === 'string' ? v : v?.url)).filter(Boolean);
  }

  const priceVal =
    item.price ||
    item.rates ||
    item.fee ||
    item.rent ||
    item.visitingCharge ||
    item.consultationFee ||
    item.priceForTwo ||
    item.startingPackage ||
    'Contact for Price';

  const rawStock = String(item.stock_count || item.stockCount || item.capacity || '').replace(/\D/g, '');
  const capacityVal = item.capacity || (rawStock ? `${rawStock} Units Available` : 'Ready Stock');

  const rawLocation = item.location_name || item.location || 'Alwar';
  const resolvedCity = item.city || (rawLocation.toLowerCase().includes('jaipur') ? 'Jaipur' : 'Alwar');

  const personOrBiz =
    item.seller_name ||
    item.sellerName ||
    item.driverName ||
    item.trainerName ||
    item.providerName ||
    item.doctorName ||
    item.agencyName ||
    item.name ||
    'Verified Member';

  const targetBucket =
    CATEGORY_SLICE_MAP[catId] ||
    item.bucket_key ||
    item.bucketKey ||
    categoryConfig.bucketKey ||
    'listings';

  const isActive = item.is_active !== undefined ? Boolean(item.is_active) : true;
  const hasPendingApproval = Boolean(item.has_pending_approval);
  const pendingChanges = item.pending_changes || null;

  const now = Date.now();
  const storedPromos = getStoredPromotionsMap();
  const localPromo = storedPromos[itemId];
  const rawDealType = localPromo ? 'PAID_PROMO' : (item.deal_type || item.dealType || null);
  const resolvedExpiresAt = localPromo?.expiresAt || item.deal_expires_at || item.promoted_until || null;
  const isExpired = Boolean(resolvedExpiresAt && new Date(resolvedExpiresAt).getTime() <= now);

  const isPromotedActive = Boolean(
    (localPromo ||
      item.is_promoted === true ||
      rawDealType === 'PAID_PROMO' ||
      String(item.verification_badge || '').includes('Sponsor')) &&
    !isExpired
  );

  const resolvedDealType = isExpired
    ? null
    : rawDealType === 'PAID_PROMO' && !isPromotedActive
    ? null
    : rawDealType;

  const resolvedDealBadge = isExpired
    ? null
    : (item.deal_badge || item.dealBadge || (isPromotedActive ? '👑 Sponsored' : null));

  const resolvedDealDetails = isExpired ? null : (item.deal_details || item.dealDetails || null);
  const resolvedOriginalPrice = isExpired ? null : (item.original_price || item.originalPrice || null);

  const rawBadge = item.verification_badge || item.verificationBadge || '';
  const cleanedRawBadge = !isPromotedActive && String(rawBadge).includes('Sponsor') ? 'Verified Listing' : rawBadge;

  const resolvedBadge = isPromotedActive
    ? '🚀 Featured Sponsor'
    : (cleanedRawBadge || (hasPendingApproval ? '⏳ Pending Approval' : 'Verified Listing'));

  return {
    id: itemId,
    userId: item.user_id || item.userId || null,
    user_id: item.user_id || item.userId || null,
    title: nameVal,
    name: nameVal,
    category: catId,
    subCategory: subCatId,
    sub_category: subCatId,
    bucketKey: targetBucket,
    trade: subCatId,
    profession: subCatId,
    vehicleType: subCatId,
    cuisine: subCatId,
    tuitionType: subCatId,
    shopType: subCatId,
    workType: subCatId,
    vendorType: subCatId,
    itemType: subCatId,
    price: priceVal,
    fee: priceVal,
    rent: priceVal,
    rates: priceVal,
    visitingCharge: item.visitingCharge || priceVal,
    consultationFee: item.consultationFee || priceVal,
    priceForTwo: priceVal,
    startingPackage: priceVal,
    is_promoted: isPromotedActive,
    promoted_until: isPromotedActive ? resolvedExpiresAt : null,
    deal_type: resolvedDealType,
    dealType: resolvedDealType,
    deal_badge: resolvedDealBadge,
    dealBadge: resolvedDealBadge,
    deal_details: resolvedDealDetails,
    dealDetails: resolvedDealDetails,
    original_price: resolvedOriginalPrice,
    originalPrice: resolvedOriginalPrice,
    token_amount: item.token_amount || item.tokenAmount || null,
    tokenAmount: item.token_amount || item.tokenAmount || null,
    doorstep_trial: Boolean(item.doorstep_trial ?? item.doorstepTrial ?? false),
    doorstepTrial: Boolean(item.doorstep_trial ?? item.doorstepTrial ?? false),
    deal_expires_at: isExpired ? null : resolvedExpiresAt,
    sellerName: personOrBiz,
    seller_name: personOrBiz,
    driverName: personOrBiz,
    trainerName: personOrBiz,
    providerName: personOrBiz,
    doctorName: personOrBiz,
    phone: sanitizePhone(item.phone) || '9876543201',
    whatsapp: sanitizePhone(item.whatsapp || item.phone) || '9876543201',
    city: resolvedCity,
    location: rawLocation,
    location_name: rawLocation,
    locationName: rawLocation,
    landmark: item.landmark || rawLocation || 'Main Road',
    distance: item.distance || '0.1 km away',
    lat: item.lat !== undefined && item.lat !== null ? Number(item.lat) : null,
    lng: item.lng !== undefined && item.lng !== null ? Number(item.lng) : null,
    mapUrl:
      item.mapUrl ||
      (item.lat && item.lng
        ? `https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lng}`
        : null),
    image: coverImage,
    image_url: coverImage,
    images: sanitizedImages,
    image_urls: sanitizedImages,
    videos: allVideos,
    video_urls: allVideoUrls,
    photo: coverImage,
    avatar: coverImage,
    description: item.description || '',
    condition: item.condition || 'Brand New',
    interestCount: Number(item.interest_count !== undefined ? item.interest_count : item.interestCount || 0),
    interest_count: Number(item.interest_count !== undefined ? item.interest_count : item.interestCount || 0),
    rating: Number(item.rating || 5.0),
    reviewsCount: Number(item.reviews_count !== undefined ? item.reviews_count : item.reviewsCount || 0),
    reviews_count: Number(item.reviews_count !== undefined ? item.reviews_count : item.reviewsCount || 0),
    verified: item.verified !== undefined ? item.verified : true,
    verification_badge: resolvedBadge,
    verificationBadge: resolvedBadge,
    badge: item.badge || (hasPendingApproval ? '⏳ Pending Approval' : '🟢 Verified Listing'),
    experience: item.experience || '5+ Years Exp',
    timing: item.timing || item.activeHours || '09:00 AM - 09:00 PM',
    activeHours: item.timing || item.activeHours || '09:00 AM - 09:00 PM',
    capacity: capacityVal,
    stockCount: capacityVal,
    stock_count: rawStock ? parseInt(rawStock, 10) : null,
    qualifications: item.qualifications || '',
    regNumber: item.regNumber || '',
    status: item.status || 'active',
    is_active: isActive,
    is_shadowbanned: Boolean(item.is_shadowbanned),
    has_pending_approval: hasPendingApproval,
    pending_changes: pendingChanges,
    admin_feedback: item.admin_feedback || null,
    seller_feedback_reply: item.seller_feedback_reply || null,
    isAvailableNow: true,
    isNew: Boolean(item.isNew),
    created_at: item.created_at || new Date().toISOString(),
    expires_at: item.expires_at || null,
  };
}

class HyperlocalEngineStore {
  constructor() {
    const initialUser = getCurrentUserProfile();
    const initialPhone = sanitizePhone(initialUser?.phone);

    this.state = {
      listings: (initialListings || []).map((i) => normalizeDBListing(i)),
      propertyListings: (initialPropertyListings || []).map((i) =>
        normalizeDBListing({ ...i, category: 'property' })
      ),
      fitnessListings: (initialFitnessListings || []).map((i) =>
        normalizeDBListing({ ...i, category: 'fitness' })
      ),
      travelListings: (initialTravelListings || []).map((i) =>
        normalizeDBListing({ ...i, category: 'travel' })
      ),
      medicalListings: (initialMedicalListings || []).map((i) =>
        normalizeDBListing({ ...i, category: 'medical' })
      ),
      creatorsListings: (initialCreatorsListings || []).map((i) =>
        normalizeDBListing({ ...i, category: 'creators' })
      ),
      kaarigarWorkers: (initialKaarigarWorkers || []).map((i) =>
        normalizeDBListing({ ...i, category: 'kaarigar' })
      ),
      transportFirms: (initialTransportFirms || []).map((i) =>
        normalizeDBListing({ ...i, category: 'transporters' })
      ),
      individualTransporters: (initialIndividualTransporters || []).map((i) =>
        normalizeDBListing({ ...i, category: 'transporters' })
      ),
      communityDrives: (initialCommunityDrives || []).map((i) =>
        normalizeDBListing({ ...i, category: 'community' })
      ),
      shaadiVendors: (initialShaadiVendors || []).map((i) =>
        normalizeDBListing({ ...i, category: 'shaadi' })
      ),
      festivalOffers: (initialFestivalOffers || []).map((i) =>
        normalizeDBListing({ ...i, category: 'festival' })
      ),
      advertisingProviders: (initialAdvertisingProviders || []).map((i) =>
        normalizeDBListing({ ...i, category: 'advertising' })
      ),
      educationListings: (initialEducationListings || []).map((i) =>
        normalizeDBListing({ ...i, category: 'education' })
      ),
      constructionListings: (initialConstructionListings || []).map((i) =>
        normalizeDBListing({ ...i, category: 'construction' })
      ),
      marketProducts: (
        marketDataModule.initialMarketListings ||
        marketDataModule.initialMarketProducts ||
        marketDataModule.marketListings ||
        marketDataModule.default ||
        []
      ).map((i) => normalizeDBListing({ ...i, category: 'market' })),
      mallsStores: (initialMallsStores || []).map((i) =>
        normalizeDBListing({ ...i, category: 'malls' })
      ),
      restaurantsList: (initialRestaurantsList || []).map((i) =>
        normalizeDBListing({ ...i, category: 'restaurants' })
      ),
      whiteCollarListings: (initialWhiteCollarListings || []).map((i) =>
        normalizeDBListing({ ...i, category: 'white-collar' })
      ),
      reCommerceListings: (initialReCommerceListings || []).map((i) =>
        normalizeDBListing({ ...i, category: 'recommerce' })
      ),

      // 📊 Lead Attribution & Proof of Value
      leadStats: (() => {
        try {
          const saved = localStorage.getItem('ak_lead_stats_v1');
          return saved ? JSON.parse(saved) : {};
        } catch {
          return {};
        }
      })(),

      // 💳 Commercial Subscription Tiers
      sellerPlans: (() => {
        try {
          const saved = localStorage.getItem('ak_seller_plans_v1');
          return saved ? JSON.parse(saved) : {};
        } catch {
          return {};
        }
      })(),

      // 🛡️ Trust & Safety Community Moderation
      safetyReports: (() => {
        try {
          const saved = localStorage.getItem('ak_safety_reports_v1');
          return saved ? JSON.parse(saved) : {};
        } catch {
          return {};
        }
      })(),

      // 🛡️ SMS OTP Rate-Limiting Guard
      otpRateLimits: (() => {
        try {
          const saved = localStorage.getItem('ak_otp_rate_limits_v1');
          return saved ? JSON.parse(saved) : {};
        } catch {
          return {};
        }
      })(),

      threads: {},
      interests: {},
      reviews: getStoredReviewsMap(),
      cart: getStoredCartForUser(initialPhone),
      activeUserPhone: initialPhone,
      notifications: [],

      selectedSeller: null,
      isSellerProfileOpen: false,
    };
    this.listeners = new Set();

    if (initialPhone) {
      this.loadUserCart(initialPhone);
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === PROMOTED_STORAGE_KEY) {
          this.syncPromotionsFromStorage();
        }
      });
    }
  }

  syncPromotionsFromStorage() {
    const promoMap = getStoredPromotionsMap();
    const now = Date.now();
    Object.keys(this.state).forEach((key) => {
      if (Array.isArray(this.state[key]) && key !== 'notifications' && key !== 'cart') {
        this.state[key] = this.state[key].map((item) => {
          if (!item || !item.id) return item;
          const strId = String(item.id);
          const expiresAt = promoMap[strId]?.expiresAt || item.deal_expires_at || item.promoted_until || null;
          const notExpired = !expiresAt || new Date(expiresAt).getTime() > now;
          const isLocalPromo = Boolean(promoMap[strId]);
          const isDbPromo = Boolean(item.deal_type === 'PAID_PROMO' || item.is_promoted);
          const activePromo = (isLocalPromo || isDbPromo) && notExpired;
          return {
            ...item,
            is_promoted: activePromo,
            deal_type: activePromo ? 'PAID_PROMO' : (item.deal_type === 'PAID_PROMO' ? null : item.deal_type),
            deal_expires_at: activePromo ? expiresAt : null,
          };
        });
      }
    });
    this.notify('all');
  }

  setListingPromotion(listingId, isPromoted, durationDays = 7) {
    const strId = String(listingId);
    const expiresAt = isPromoted
      ? new Date(Date.now() + Number(durationDays) * 24 * 60 * 60 * 1000).toISOString()
      : null;

    saveStoredPromotion(strId, isPromoted, expiresAt);

    Object.keys(this.state).forEach((key) => {
      if (Array.isArray(this.state[key]) && key !== 'notifications' && key !== 'cart') {
        let changed = false;
        this.state[key] = this.state[key].map((item) => {
          if (item && String(item.id) === strId) {
            changed = true;
            return {
              ...item,
              is_promoted: isPromoted,
              deal_type: isPromoted ? 'PAID_PROMO' : null,
              dealType: isPromoted ? 'PAID_PROMO' : null,
              deal_expires_at: expiresAt,
              promoted_until: expiresAt,
              deal_badge: isPromoted ? '👑 Sponsored' : (item.deal_badge === '👑 Sponsored' ? null : item.deal_badge),
              verification_badge: isPromoted ? '🚀 Featured Sponsor' : 'Verified Listing',
            };
          }
          return item;
        });
        if (changed) this.notify(key);
      }
    });

    this.notify('all');
    return expiresAt;
  }

  getState(key) {
    if (key === 'notifications') {
      return this.state.notifications || [];
    }
    const list = this.state[key] || [];
    const seen = new Set();
    return list.filter((item) => {
      if (!item || !item.id || seen.has(String(item.id))) return false;
      if (item.is_active === false || item.is_shadowbanned === true) return false;
      if (item.status === 'flagged_hidden') return false;
      seen.add(String(item.id));
      return true;
    });
  }

  getAllListings() {
    const listingKeys = [
      'listings',
      'propertyListings',
      'fitnessListings',
      'medicalListings',
      'creatorsListings',
      'travelListings',
      'marketProducts',
      'kaarigarWorkers',
      'transportFirms',
      'individualTransporters',
      'communityDrives',
      'shaadiVendors',
      'festivalOffers',
      'advertisingProviders',
      'educationListings',
      'constructionListings',
      'mallsStores',
      'restaurantsList',
      'whiteCollarListings',
      'reCommerceListings',
    ];

    const promoMap = getStoredPromotionsMap();
    const seenIds = new Set();
    const combined = [];

    listingKeys.forEach((key) => {
      const bucket = this.state[key] || [];
      bucket.forEach((item) => {
        if (item && item.id && !seenIds.has(String(item.id))) {
          if (item.status === 'flagged_hidden') return;
          const strId = String(item.id);
          seenIds.add(strId);
          if (promoMap[strId] && !item.is_promoted) {
            combined.push({
              ...item,
              is_promoted: true,
              deal_type: 'PAID_PROMO',
              deal_expires_at: promoMap[strId].expiresAt,
            });
          } else {
            combined.push(item);
          }
        }
      });
    });

    return combined;
  }

  openSellerProfile(sellerData) {
    if (!sellerData) return;
    this.state.selectedSeller = sellerData;
    this.state.isSellerProfileOpen = true;
    this.notify('sellerProfile');
  }

  closeSellerProfile() {
    this.state.selectedSeller = null;
    this.state.isSellerProfileOpen = false;
    this.notify('sellerProfile');
  }

  getListingsBySeller(sellerIdentifier) {
    if (!sellerIdentifier) return [];
    const all = this.getAllListings();

    const targetPhone = sanitizePhone(
      typeof sellerIdentifier === 'object'
        ? sellerIdentifier.phone || sellerIdentifier.whatsapp
        : sellerIdentifier
    );
    const targetUserId = typeof sellerIdentifier === 'object'
      ? sellerIdentifier.userId || sellerIdentifier.user_id
      : null;
    const targetName = (
      typeof sellerIdentifier === 'object'
        ? sellerIdentifier.sellerName || sellerIdentifier.seller_name || sellerIdentifier.businessName || sellerIdentifier.name
        : (typeof sellerIdentifier === 'string' ? sellerIdentifier : '')
    ) || '';

    const cleanTarget = targetName.toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9\s]/g, ' ').trim();
    const DUMMY_SET = new Set(['9876543210', '9876543201', '9876543200', '1234567890', '9999999999', '0000000000']);
    const isTargetDummy = !targetPhone || DUMMY_SET.has(targetPhone) || /^(\d)\1{9}$/.test(targetPhone);

    return all.filter((item) => {
      const itemPhone = sanitizePhone(item.phone || item.whatsapp);
      const itemUserId = item.userId || item.user_id;
      const itemName = (item.sellerName || item.seller_name || item.name || '').toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9\s]/g, ' ').trim();

      if (targetUserId && itemUserId && String(targetUserId) === String(itemUserId)) return true;

      if (cleanTarget && itemName) {
        if (cleanTarget === itemName) return true;
        if (cleanTarget.length >= 4 && itemName.length >= 4) {
          if (cleanTarget.includes(itemName) || itemName.includes(cleanTarget)) return true;
        }

        const tokensT = cleanTarget.split(' ').filter((t) => t.length > 2);
        const tokensI = itemName.split(' ').filter((t) => t.length > 2);
        if (tokensT.length > 0 && tokensI.length > 0) {
          const hasOverlap = tokensT.some((t) => tokensI.includes(t));
          if (hasOverlap) return true;
        }
      }

      const isItemDummy = !itemPhone || DUMMY_SET.has(itemPhone) || /^(\d)\1{9}$/.test(itemPhone);
      if (!isTargetDummy && !isItemDummy && targetPhone === itemPhone) {
        if (cleanTarget && itemName) {
          const tokensT = cleanTarget.split(' ').filter((t) => t.length > 2);
          const tokensI = itemName.split(' ').filter((t) => t.length > 2);
          const hasOverlap = tokensT.some((t) => tokensI.includes(t));
          return hasOverlap;
        }
        return true;
      }

      return false;
    });
  }

  insertListing(rawBucketOrCategory, item) {
    const tempId = item.id || `custom-${Date.now()}`;
    const norm = normalizeDBListing({ ...item, id: tempId });
    if (!norm) return;

    const catId = (norm.category || rawBucketOrCategory || 'property').toLowerCase();
    const targetSlice = CATEGORY_SLICE_MAP[catId] || (this.state[rawBucketOrCategory] ? rawBucketOrCategory : 'listings');

    const currentList = this.state[targetSlice] || [];
    const existingIdx = currentList.findIndex((e) => String(e.id) === String(norm.id));

    if (existingIdx !== -1) {
      currentList[existingIdx] = { ...currentList[existingIdx], ...norm };
      this.state[targetSlice] = [...currentList];
    } else {
      this.state[targetSlice] = [norm, ...currentList];
    }

    this.notify(targetSlice);
    this.notify(catId);
    this.notify('all');
  }

  removeListing(listingId) {
    const targetStr = String(listingId);
    saveStoredPromotion(targetStr, false);

    Object.keys(this.state).forEach((key) => {
      if (Array.isArray(this.state[key])) {
        this.state[key] = this.state[key].filter((item) => String(item?.id) !== targetStr);
        this.notify(key);
      }
    });

    if (this.state.threads[targetStr]) {
      delete this.state.threads[targetStr];
      this.notify(`thread:${targetStr}`);
    }
    if (this.state.reviews[targetStr]) {
      delete this.state.reviews[targetStr];
      saveStoredReviewsMap(this.state.reviews);
      this.notify(`reviews:${targetStr}`);
    }
    if (this.state.interests[targetStr] !== undefined) {
      delete this.state.interests[targetStr];
      this.notify(`interest:${targetStr}`);
    }

    this.removeNotificationsForTarget(targetStr);
    this.notify('all');
  }

  hydrateBulk(items) {
    if (!Array.isArray(items) || items.length === 0) return;
    const touchedBuckets = new Set();

    items.forEach((row) => {
      const normalized = normalizeDBListing(row);
      if (!normalized) return;

      const catId = normalized.category || 'property';
      const targetSlice = CATEGORY_SLICE_MAP[catId] || normalized.bucketKey || 'listings';

      const list = this.state[targetSlice] || [];
      const idx = list.findIndex(
        (existing) =>
          String(existing.id) === String(normalized.id) ||
          (existing.title === normalized.title &&
            existing.phone === normalized.phone &&
            String(existing.id).startsWith('custom-'))
      );

      if (idx !== -1) {
        const existingImg = list[idx].image;
        const incomingRawImg = row.image_url || row.image;
        const keepExistingImage =
          existingImg && !isGenericFallbackUrl(existingImg) && isGenericFallbackUrl(incomingRawImg);

        list[idx] = {
          ...list[idx],
          ...normalized,
          ...(keepExistingImage
            ? {
                image: existingImg,
                image_url: existingImg,
                photo: existingImg,
                avatar: existingImg,
                images: list[idx].images?.length ? list[idx].images : [existingImg],
                image_urls: list[idx].image_urls?.length ? list[idx].image_urls : [existingImg],
              }
            : {}),
        };
      } else {
        list.unshift(normalized);
      }
      this.state[targetSlice] = [...list];
      touchedBuckets.add(targetSlice);
      touchedBuckets.add(catId);

      if (normalized.interestCount !== undefined) {
        this.state.interests[String(normalized.id)] = normalized.interestCount;
      }
    });

    touchedBuckets.forEach((bucketKey) => this.notify(bucketKey));
    this.notify('all');
  }

  hydrateThreads(threadsRows) {
    if (!Array.isArray(threadsRows) || threadsRows.length === 0) return;
    const grouped = {};
    const now = Date.now();

    threadsRows.forEach((row) => {
      const createdAtTime = new Date(row.created_at).getTime();
      if (now - createdAtTime > FIVE_DAYS_MS) return;

      const listingId = String(row.listing_id);
      if (!grouped[listingId]) grouped[listingId] = [];

      const hasBuyerAudio = Boolean(row.audio_url);
      const hasSellerAudio = Boolean(row.seller_audio_url);

      grouped[listingId].push({
        id: row.id,
        userName: row.user_name || 'Local Buyer',
        userArea: row.user_area || 'Nearby',
        text: row.comment_text || (hasBuyerAudio ? '🎤 Voice Note' : ''),
        type: hasBuyerAudio ? 'audio' : 'text',
        audioUrl: row.audio_url || null,
        audioDuration: row.audio_duration || '0:15',
        timestamp: new Date(row.created_at).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        created_at: row.created_at,
        isPublic: row.is_public !== undefined ? row.is_public : true,
        sellerReply: (row.seller_reply || hasSellerAudio)
          ? {
              text: row.seller_reply || (hasSellerAudio ? '🎤 Voice Note Reply' : ''),
              type: hasSellerAudio ? 'audio' : 'text',
              audioUrl: row.seller_audio_url || null,
              duration: row.seller_audio_duration || '0:15',
              timestamp: row.seller_replied_at
                ? new Date(row.seller_replied_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Verified Response',
            }
          : null,
      });
    });

    this.state.threads = { ...this.state.threads, ...grouped };
    Object.keys(grouped).forEach((lid) => this.notify(`thread:${lid}`));
    this.notify('threads');
  }

  hydrateReviews(reviewRows) {
    if (!Array.isArray(reviewRows) || reviewRows.length === 0) return;
    const grouped = { ...this.state.reviews };

    reviewRows.forEach((row) => {
      const listingId = String(row.listing_id);
      if (!grouped[listingId]) grouped[listingId] = [];

      const exists = grouped[listingId].some((r) => String(r.id) === String(row.id));
      if (!exists) {
        grouped[listingId].unshift({
          id: row.id,
          listingId: listingId,
          userId: row.user_id || null,
          phone: sanitizePhone(row.phone),
          userName: row.user_name || 'Verified Resident',
          rating: Number(row.rating) || 5,
          comment: row.comment || '',
          photos: Array.isArray(row.photos) ? row.photos : [],
          video: row.video_url || null,
          audioUrl: row.audio_url || null,
          audioDuration: row.audio_duration || null,
          createdAt: row.created_at || new Date().toISOString(),
          verifiedResident: Boolean(row.is_verified_resident),
        });
      }
    });

    this.state.reviews = grouped;
    saveStoredReviewsMap(grouped);
    Object.keys(grouped).forEach((lid) => this.notify(`reviews:${lid}`));
    this.notify('reviews');
    this.notify('all');
  }

  addNotification(notif) {
    const notifId = String(notif.id || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`);
    const readSet = getStoredReadNotifs();
    const alreadyRead = Boolean(notif.is_read || notif.read || readSet.has(notifId));

    const rawUserId = notif.user_id || notif.userId || null;
    const validUserId = isValidUuid(rawUserId) ? String(rawUserId) : null;

    const newEntry = {
      id: notifId,
      user_id: validUserId,
      tag: notif.tag || 'TOWN_ALERT',
      title: notif.title || 'New Notification',
      message: notif.message || '',
      time: notif.time || 'Just now',
      read: alreadyRead,
      is_read: alreadyRead,
      type: notif.type || 'general',
      targetId: notif.targetId || notif.metadata?.targetId || notif.metadata?.listingId || null,
      recipient_role:
        notif.recipient_role ||
        notif.recipientRole ||
        (ADMIN_TAGS.has(notif.tag) ? 'admin' : SELLER_TAGS.has(notif.tag) ? 'seller' : 'public'),
      recipient_phone: sanitizePhone(notif.recipient_phone || notif.metadata?.sellerPhone || notif.metadata?.userPhone),
      metadata: notif.metadata || {},
      created_at: notif.created_at || new Date().toISOString(),
    };

    const current = this.state.notifications || [];
    const existingIdx = current.findIndex((n) => String(n.id) === notifId);

    if (existingIdx !== -1) {
      current[existingIdx] = { ...current[existingIdx], ...newEntry };
      this.state.notifications = [...current];
    } else {
      this.state.notifications = [newEntry, ...current];
    }

    this.notify('notifications');
  }

  markNotificationRead(notifId) {
    if (!notifId) return;
    const strId = String(notifId);
    saveStoredReadNotif(strId);

    this.state.notifications = (this.state.notifications || []).map((n) =>
      String(n.id) === strId ? { ...n, read: true, is_read: true } : n
    );

    this.notify('notifications');

    if (supabase && isValidUuid(strId)) {
      supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', strId)
        .then(({ error }) => {
          if (error) console.warn('Supabase mark read notice:', error.message);
        });
    }
  }

  markAllNotificationsRead(targetIds = null) {
    const list = this.state.notifications || [];
    const idsToMark = targetIds && Array.isArray(targetIds) && targetIds.length > 0
      ? targetIds.map(String)
      : list.map((n) => String(n.id));

    saveStoredAllReadNotifs(idsToMark);
    const idSet = new Set(idsToMark);

    this.state.notifications = list.map((n) =>
      idSet.has(String(n.id)) ? { ...n, read: true, is_read: true } : n
    );

    this.notify('notifications');

    if (supabase) {
      const validUuids = idsToMark.filter(isValidUuid);
      if (validUuids.length > 0) {
        supabase
          .from('notifications')
          .update({ is_read: true })
          .in('id', validUuids)
          .then(({ error }) => {
            if (error) console.warn('Supabase batch mark read notice:', error.message);
          });
      }
    }
  }

  resetNotificationsOnLogout() {
    this.state.notifications = [];
    this.notify('notifications');
  }

  removeNotificationsForTarget(listingId) {
    const targetStr = String(listingId);
    this.state.notifications = (this.state.notifications || []).filter(
      (n) => String(n.targetId) !== targetStr && String(n.metadata?.targetId) !== targetStr && String(n.metadata?.listingId) !== targetStr
    );
    this.notify('notifications');
  }

  getThreadComments(listingId, fallback = []) {
    const comments = this.state.threads[String(listingId)] || fallback;
    const now = Date.now();
    return comments.filter((c) => {
      if (!c.created_at) return true;
      return now - new Date(c.created_at).getTime() <= FIVE_DAYS_MS;
    });
  }

  addThreadComment(listingId, comment, listingTitle = '') {
    const strId = String(listingId);
    const hasAudio = Boolean(comment.audioUrl);

    const allListings = this.getAllListings();
    const targetListing = allListings.find((l) => String(l.id) === strId);
    const targetSellerPhone = sanitizePhone(targetListing?.phone || targetListing?.whatsapp || comment.sellerPhone);
    const targetSellerUserId = targetListing?.user_id || targetListing?.userId || null;
    const currentUser = getCurrentUserProfile();

    const newEntry = {
      id: comment.id || `local-${Date.now()}`,
      userName: comment.userName || 'Local Buyer',
      userArea: comment.userArea || 'Nearby',
      text: comment.text || (hasAudio ? '🎤 Voice Note' : ''),
      type: comment.type || (hasAudio ? 'audio' : 'text'),
      audioUrl: comment.audioUrl || null,
      audioDuration: comment.audioDuration || '0:15',
      timestamp: 'Just now',
      created_at: new Date().toISOString(),
      isPublic: comment.isPublic !== undefined ? comment.isPublic : true,
      sellerReply: null,
    };

    this.state.threads[strId] = [newEntry, ...(this.state.threads[strId] || [])];
    this.notify(`thread:${strId}`);
    this.notify('threads');

    saveCommentToDB(
      strId,
      {
        ...newEntry,
        userId: currentUser?.id || null,
        userPhone: sanitizePhone(currentUser?.phone),
      },
      listingTitle || targetListing?.title || 'Listing',
      targetSellerPhone,
      targetSellerUserId
    ).then((dbRow) => {
      if (dbRow && dbRow.id) {
        const list = this.state.threads[strId] || [];
        const idx = list.findIndex((c) => c.id === newEntry.id);
        if (idx !== -1) {
          list[idx].id = dbRow.id;
          this.state.threads[strId] = [...list];
          this.notify(`thread:${strId}`);
          this.notify('threads');
        }
      }
    });
  }

  addSellerReply(listingId, commentId, replyObj, listingTitle = '') {
    if (!this.state.threads[listingId]) {
      this.state.threads[listingId] = [];
    }

    const currentComments = this.state.threads[listingId];
    const matchIndex = currentComments.findIndex((comm) => String(comm.id) === String(commentId));

    if (matchIndex >= 0) {
      currentComments[matchIndex] = {
        ...currentComments[matchIndex],
        sellerReply: replyObj,
      };
    } else {
      currentComments.push({
        id: commentId,
        listingId,
        userName: 'Local Buyer',
        userArea: 'Alwar',
        text: 'Customer question',
        timestamp: '15m ago',
        isPublic: true,
        sellerReply: replyObj,
      });
    }

    this.state.threads = {
      ...this.state.threads,
      [listingId]: [...currentComments],
    };

    this.notify(`thread:${listingId}`);
    this.notify('threads');
    this.notify('all');

    if (supabase && isValidUuid(commentId)) {
      supabase
        .from('listing_threads')
        .update({
          seller_reply: typeof replyObj === 'string' ? replyObj : replyObj.text,
          seller_audio_url: replyObj.audioUrl || null,
          seller_audio_duration: replyObj.duration || null,
          seller_replied_at: new Date().toISOString(),
        })
        .eq('id', commentId)
        .then(({ error }) => {
          if (error) console.error('Supabase seller reply sync error:', error);
        });
    }
  }

  hasUserInterested(listingId) {
    const user = getCurrentUserProfile();
    const userPhone = sanitizePhone(user?.phone) || 'guest_device';
    const stored = getStoredInterestsMap();
    return Boolean(stored[`${userPhone}_${listingId}`]);
  }

  getInterestCount(listingId, defaultCount = 0) {
    const strId = String(listingId);
    return this.state.interests[strId] !== undefined
      ? this.state.interests[strId]
      : defaultCount;
  }

  toggleInterestOnce(listingId, defaultCount = 0, listingTitle = '', sellerName = '') {
    const strId = String(listingId);
    const user = getCurrentUserProfile();
    const userPhone = sanitizePhone(user?.phone) || 'guest_device';
    const stored = getStoredInterestsMap();
    const interestKey = `${userPhone}_${strId}`;

    if (stored[interestKey]) {
      return {
        success: false,
        message: 'You have already registered your interest for this listing.',
        count: this.getInterestCount(strId, defaultCount),
      };
    }

    stored[interestKey] = true;
    saveStoredInterestsMap(stored);

    const count = this.getInterestCount(strId, defaultCount) + 1;
    this.state.interests[strId] = count;
    this.notify(`interest:${strId}`);
    this.notify('all');

    const allListings = this.getAllListings();
    const targetListing = allListings.find((l) => String(l.id) === strId);
    const targetSellerPhone = sanitizePhone(targetListing?.phone || targetListing?.whatsapp);
    const targetSellerUserId = targetListing?.user_id || targetListing?.userId || null;

    this.addNotification({
      user_id: targetSellerUserId,
      tag: 'INTEREST REGISTERED',
      title: `Interest registered for "${listingTitle || targetListing?.title || 'Listing'}"`,
      message: `${sellerName || 'The seller'} was notified. Total buyers interested: ${count}`,
      time: 'Just now',
      type: 'interest',
      targetId: strId,
      recipient_role: 'seller',
      recipient_phone: targetSellerPhone,
      metadata: {
        listingId: strId,
        sellerPhone: targetSellerPhone,
        sellerUserId: targetSellerUserId,
        count,
        buyerUserId: user?.id || null,
      },
    });

    if (supabase && isValidUuid(strId) && userPhone !== 'guest_device') {
      supabase
        .from('listing_interests')
        .upsert(
          { listing_id: strId, phone: userPhone },
          { onConflict: 'listing_id,phone', ignoreDuplicates: true }
        )
        .then(() => {
          updateInterestCountInDB(strId, count, listingTitle, targetSellerPhone, targetSellerUserId);
        });
    } else {
      updateInterestCountInDB(strId, count, listingTitle, targetSellerPhone, targetSellerUserId);
    }

    return { success: true, count };
  }

  incrementInterest(listingId, defaultCount = 0, listingTitle = '', sellerName = '') {
    const res = this.toggleInterestOnce(listingId, defaultCount, listingTitle, sellerName);
    return res.count;
  }

  // ==========================================
  // 🎯 STEP 2: LEAD ATTRIBUTION & SELLER ROI ENGINE
  // ==========================================

  buildAttributedWhatsAppUrl(listing, customNote = '') {
    if (!listing) return '';
    const rawPhone =
      listing.seller_phone ||
      listing.phone ||
      listing.contact ||
      listing.whatsapp ||
      '';
    const cleanPhone = sanitizePhone(rawPhone);
    if (!cleanPhone) return '';

    const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const title = listing.title || listing.name || listing.shopName || 'Listing';
    const rawPrice = listing.price || listing.rent || listing.salary || listing.startingPrice;
    const priceLabel = rawPrice ? ` (₹${rawPrice})` : '';
    const locality = listing.locality || listing.location || listing.zone || '';
    const localityLabel = locality ? ` 📍 ${locality}` : '';

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://apkekareeb.com';
    const deepLink = listing.id ? `${baseUrl}/?listing=${encodeURIComponent(String(listing.id))}` : baseUrl;

    const messageLines = [
      `Namaste! 🙏 Maine *ApkeKareeb* app par aapki listing dekhi:`,
      `*${title}*${priceLabel}${localityLabel}`,
      customNote ? `\n💬 ${customNote}` : `\nMujhe iske baare mein jaankari chahiye. Kya yeh abhi available hai?`,
      `\n🔗 Listing Link: ${deepLink}`,
    ];

    return `https://wa.me/${fullPhone}?text=${encodeURIComponent(messageLines.join('\n'))}`;
  }

  recordLeadAction(listingOrId, actionType = 'whatsapp') {
    const targetListing =
      typeof listingOrId === 'object' && listingOrId !== null
        ? listingOrId
        : this.getAllListings().find((item) => String(item.id) === String(listingOrId));

    const strId = String(targetListing?.id || listingOrId || '');
    if (!strId) return null;

    const prev = this.state.leadStats?.[strId] || {
      whatsapp_clicks: Number(targetListing?.whatsapp_clicks) || 0,
      call_clicks: Number(targetListing?.call_clicks) || 0,
      status_shares: Number(targetListing?.status_shares) || 0,
    };

    const nextStats = {
      ...prev,
      whatsapp_clicks: actionType === 'whatsapp' ? prev.whatsapp_clicks + 1 : prev.whatsapp_clicks,
      call_clicks: actionType === 'call' ? prev.call_clicks + 1 : prev.call_clicks,
      status_shares: actionType === 'share' ? prev.status_shares + 1 : prev.status_shares,
      lastLeadAt: new Date().toISOString(),
    };

    this.state.leadStats = {
      ...(this.state.leadStats || {}),
      [strId]: nextStats,
    };

    try {
      localStorage.setItem('ak_lead_stats_v1', JSON.stringify(this.state.leadStats));
    } catch {}

    if (targetListing && (actionType === 'whatsapp' || actionType === 'call')) {
      const currentUser = getCurrentUserProfile();
      const buyerName = currentUser?.name || 'A local customer';
      const buyerPhone = sanitizePhone(currentUser?.phone);
      const sellerPhone = sanitizePhone(
        targetListing.seller_phone || targetListing.phone || targetListing.contact
      );
      const sellerUserId = targetListing.user_id || targetListing.seller_id || null;

      if (!buyerPhone || buyerPhone !== sellerPhone) {
        this.addNotification({
          user_id: sellerUserId,
          tag: actionType === 'whatsapp' ? 'WHATSAPP LEAD' : 'CALL INQUIRY',
          title: `New ${actionType === 'whatsapp' ? 'WhatsApp' : 'Call'} Lead on "${targetListing.title || targetListing.name || 'Listing'}"`,
          message: `${buyerName} clicked to ${actionType === 'whatsapp' ? 'chat on WhatsApp' : 'call you'} via ApkeKareeb.`,
          time: 'Just now',
          type: 'lead',
          targetId: strId,
          recipient_role: 'seller',
          recipient_phone: sellerPhone,
          metadata: {
            listingId: strId,
            actionType,
            buyerName,
            buyerPhone,
            sellerPhone,
          },
        });
      }
    }

    this.notify('leadStats');
    this.notify(`leadStats:${strId}`);
    return nextStats;
  }

  getSellerROIMetrics(sellerPhone, sellerUserId = null) {
    const cleanTargetPhone = sanitizePhone(sellerPhone);
    const allListings = this.getAllListings();

    const sellerListings = allListings.filter((item) => {
      if (sellerUserId && (item.user_id === sellerUserId || item.seller_id === sellerUserId)) {
        return true;
      }
      const itemPhone = sanitizePhone(item.seller_phone || item.phone || item.contact);
      return Boolean(cleanTargetPhone && itemPhone && itemPhone === cleanTargetPhone);
    });

    let totalInterests = 0;
    let totalCalls = 0;
    let totalWhatsAppLeads = 0;
    let totalShares = 0;
    let totalComments = 0;
    let totalVoiceInquiries = 0;

    sellerListings.forEach((item) => {
      const idStr = String(item.id);
      const stats = this.state.leadStats?.[idStr] || {};
      const threads = this.state.threads?.[idStr] || [];

      totalInterests += Number(this.state.interests?.[idStr] ?? item.interest_count ?? item.interests ?? 0);
      totalCalls += Number(stats.call_clicks ?? item.call_clicks ?? 0);
      totalWhatsAppLeads += Number(stats.whatsapp_clicks ?? item.whatsapp_clicks ?? 0);
      totalShares += Number(stats.status_shares ?? item.status_shares ?? 0);
      totalComments += threads.length;
      totalVoiceInquiries += threads.filter((t) => Boolean(t.audioUrl || t.audio_url)).length;
    });

    const totalDirectLeads = totalCalls + totalWhatsAppLeads + totalVoiceInquiries + totalInterests;

    return {
      totalListings: sellerListings.length,
      totalInterests,
      totalCalls,
      totalWhatsAppLeads,
      totalShares,
      totalComments,
      totalVoiceInquiries,
      totalDirectLeads,
    };
  }

  // ==========================================
  // 💳 STEP 3: MONETIZATION ARCHITECTURE & QUOTAS
  // ==========================================

  getSellerPlan(userOrPhone = null) {
    const targetUser =
      typeof userOrPhone === 'object' && userOrPhone !== null
        ? userOrPhone
        : getCurrentUserProfile();

    if (targetUser?.role === 'admin' || targetUser?.isAdmin) {
      return SUBSCRIPTION_PLANS.commercial_partner;
    }

    const rawPhone = typeof userOrPhone === 'string' ? userOrPhone : targetUser?.phone || '';
    const cleanPhone = sanitizePhone(rawPhone);

    const planKey =
      targetUser?.subscription_plan ||
      (cleanPhone && this.state.sellerPlans?.[cleanPhone]?.planId) ||
      'free';

    return SUBSCRIPTION_PLANS[planKey] || SUBSCRIPTION_PLANS.free;
  }

  setSellerPlan(phone, planId = 'retail_pro', expiresAt = null) {
    const cleanPhone = sanitizePhone(phone);
    if (!cleanPhone) return null;

    const validPlan = SUBSCRIPTION_PLANS[planId] ? planId : 'free';
    const nextEntry = {
      phone: cleanPhone,
      planId: validPlan,
      updatedAt: new Date().toISOString(),
      expiresAt: expiresAt || new Date(Date.now() + 30 * 86400000).toISOString(),
    };

    this.state.sellerPlans = {
      ...(this.state.sellerPlans || {}),
      [cleanPhone]: nextEntry,
    };

    try {
      localStorage.setItem('ak_seller_plans_v1', JSON.stringify(this.state.sellerPlans));
    } catch {}

    this.notify('sellerPlans');
    return nextEntry;
  }

  checkPostingQuota(categorySlug = 'market', userOrPhone = null, options = {}) {
    const normCat = String(categorySlug || 'market').toLowerCase().trim();
    const tierRule = MONETIZATION_TIER_CONFIG[normCat] || {
      tier: 2,
      tierName: 'Local Retail & Services',
      freeLimit: 3,
      requiredPlan: 'retail_pro',
    };

    const targetUser =
      typeof userOrPhone === 'object' && userOrPhone !== null
        ? userOrPhone
        : getCurrentUserProfile();

    const rawPhone = typeof userOrPhone === 'string' ? userOrPhone : targetUser?.phone || '';
    const cleanPhone = sanitizePhone(rawPhone);
    const userId = targetUser?.id || null;

    const activePlan = this.getSellerPlan(userOrPhone);

    const allListings = this.getAllListings();
    const userCategoryListings = allListings.filter((item) => {
      const itemCat = String(item.category || '').toLowerCase().trim();
      if (itemCat !== normCat) return false;
      const idStr = String(item.id || '');
      if (!isValidUuid(idStr) && !idStr.startsWith('live_') && !item.user_id) {
        return false;
      }
      if (item.status === 'sold' || item.status === 'archived' || item.status === 'rejected') {
        return false;
      }
      if (userId && (item.user_id === userId || item.seller_id === userId)) {
        return true;
      }
      const itemPhone = sanitizePhone(item.seller_phone || item.phone || item.contact);
      return Boolean(cleanPhone && itemPhone && itemPhone === cleanPhone);
    });

    const activeCount = userCategoryListings.length;

    let effectiveLimit = tierRule.freeLimit;
    if (activePlan.id === 'commercial_partner') {
      effectiveLimit = SUBSCRIPTION_PLANS.commercial_partner.maxListingsPerCategory;
    } else if (activePlan.id === 'retail_pro' && tierRule.tier <= 2) {
      effectiveLimit = SUBSCRIPTION_PLANS.retail_pro.maxListingsPerCategory;
    }

    const wantsFeaturedBoost = Boolean(options.isFeatured || options.isPromoted);
    const isCommercialBroker = Boolean(options.isBroker || options.isAgency);

    if (wantsFeaturedBoost && !activePlan.canPostPromotions) {
      const targetUpgrade = SUBSCRIPTION_PLANS[tierRule.requiredPlan] || SUBSCRIPTION_PLANS.retail_pro;
      return {
        allowed: false,
        requiresUpgrade: true,
        tier: tierRule.tier,
        tierName: tierRule.tierName,
        activeCount,
        freeLimit: tierRule.freeLimit,
        effectiveLimit,
        remainingFree: Math.max(0, effectiveLimit - activeCount),
        currentPlan: activePlan,
        recommendedPlan: targetUpgrade,
        reason: `Featured Banner & Flash Promotions require the ${targetUpgrade.name} (₹${targetUpgrade.priceMonthly}/mo).`,
      };
    }

    if (tierRule.tier === 3 && isCommercialBroker && activePlan.id !== 'commercial_partner') {
      const targetUpgrade = SUBSCRIPTION_PLANS.commercial_partner;
      return {
        allowed: false,
        requiresUpgrade: true,
        tier: tierRule.tier,
        tierName: tierRule.tierName,
        activeCount,
        freeLimit: tierRule.freeLimit,
        effectiveLimit,
        remainingFree: 0,
        currentPlan: activePlan,
        recommendedPlan: targetUpgrade,
        reason: `Brokers, Dealers & Commercial Agencies in ${normCat.toUpperCase()} require the ${targetUpgrade.name} (₹${targetUpgrade.priceMonthly}/mo). Individual owners get 1 free listing.`,
      };
    }

    const allowed = activeCount < effectiveLimit;
    const targetUpgrade = SUBSCRIPTION_PLANS[tierRule.requiredPlan] || SUBSCRIPTION_PLANS.retail_pro;

    return {
      allowed,
      requiresUpgrade: !allowed,
      tier: tierRule.tier,
      tierName: tierRule.tierName,
      activeCount,
      freeLimit: tierRule.freeLimit,
      effectiveLimit,
      remainingFree: Math.max(0, effectiveLimit - activeCount),
      currentPlan: activePlan,
      recommendedPlan: targetUpgrade,
      reason: allowed
        ? `You have ${Math.max(0, effectiveLimit - activeCount)} free listing slot(s) remaining in ${normCat.toUpperCase()}.`
        : `You have reached your free limit (${tierRule.freeLimit} active listing${tierRule.freeLimit === 1 ? '' : 's'}) in ${normCat.toUpperCase()}. Upgrade to ${targetUpgrade.name} (₹${targetUpgrade.priceMonthly}/mo) to post more.`,
    };
  }

  // ==========================================
  // 🛡️ STEP 4: TRUST, SAFETY, LEGAL & OPERATIONAL PROTECTIONS
  // ==========================================

  getCategorySafetyRule(categorySlug = '') {
    const normCat = String(categorySlug || '').toLowerCase().trim();
    return CATEGORY_SAFETY_RULES[normCat] || null;
  }

  getSafeDisplayPhone(listing) {
    if (!listing) return { masked: true, displayPhone: 'XXXXXXXXXX', canCallDirect: false };
    const rawPhone =
      listing.seller_phone || listing.phone || listing.contact || listing.whatsapp || '';
    const clean = sanitizePhone(rawPhone);
    if (!clean) return { masked: true, displayPhone: 'Not Provided', canCallDirect: false };

    const normCat = String(listing.category || '').toLowerCase().trim();
    const rule = CATEGORY_SAFETY_RULES[normCat];
    const currentUser = getCurrentUserProfile();
    const isLoggedIn = Boolean(currentUser?.phone || currentUser?.id);

    if (rule?.maskPublicPhone && !isLoggedIn) {
      const visiblePrefix = clean.slice(0, 2);
      const visibleSuffix = clean.slice(-2);
      return {
        masked: true,
        displayPhone: `+91 ${visiblePrefix}••••••${visibleSuffix}`,
        canCallDirect: false,
        reason: 'Sign in with your verified phone number to view family contact details.',
      };
    }

    return {
      masked: false,
      displayPhone: `+91 ${clean.slice(-10)}`,
      rawPhone: clean.slice(-10),
      canCallDirect: true,
    };
  }

  isListingExpiredOrHidden(listing) {
    if (!listing) return true;
    const status = String(listing.status || 'active').toLowerCase();
    if (status === 'flagged_hidden' || status === 'rejected' || status === 'archived') {
      return true;
    }

    if (listing.expires_at) {
      const expTime = new Date(listing.expires_at).getTime();
      if (!Number.isNaN(expTime) && Date.now() > expTime) {
        return true;
      }
    }

    const normCat = String(listing.category || '').toLowerCase().trim();
    const ttlHours = CATEGORY_TTL_HOURS[normCat];
    if (ttlHours && listing.created_at) {
      const createdTime = new Date(listing.created_at).getTime();
      if (!Number.isNaN(createdTime)) {
        const ageHours = (Date.now() - createdTime) / (1000 * 60 * 60);
        if (ageHours > ttlHours) {
          return true;
        }
      }
    }

    return false;
  }

  async markListingAsSold(listingId) {
    const strId = String(listingId || '');
    if (!strId) return false;

    const listingKeys = Object.values(CATEGORY_SLICE_MAP);
    for (const key of listingKeys) {
      const list = this.state[key];
      if (Array.isArray(list)) {
        const idx = list.findIndex((item) => String(item.id) === strId);
        if (idx !== -1) {
          this.state[key][idx] = {
            ...this.state[key][idx],
            status: 'sold',
            sold_at: new Date().toISOString(),
          };
          this.notify(key);
        }
      }
    }

    if (supabase && isValidUuid(strId)) {
      try {
        await supabase
          .from('listings')
          .update({ status: 'sold' })
          .eq('id', strId);
      } catch {}
    }

    this.notify('listings');
    return true;
  }

  async submitListingReport(listingId, reason = 'Misleading or Scam', details = '') {
    const strId = String(listingId || '');
    if (!strId) return { ok: false, message: 'Invalid listing ID' };

    const currentUser = getCurrentUserProfile();
    const reporterPhone =
      sanitizePhone(currentUser?.phone) ||
      currentUser?.id ||
      'guest_reporter';

    const existingReports = Array.isArray(this.state.safetyReports?.[strId])
      ? this.state.safetyReports[strId]
      : [];

    const alreadyReported = existingReports.some((r) => r.reporter === reporterPhone);
    const nextReports = alreadyReported
      ? existingReports
      : [
          ...existingReports,
          {
            reporter: reporterPhone,
            reason,
            details,
            createdAt: new Date().toISOString(),
          },
        ];

    this.state.safetyReports = {
      ...(this.state.safetyReports || {}),
      [strId]: nextReports,
    };

    try {
      localStorage.setItem('ak_safety_reports_v1', JSON.stringify(this.state.safetyReports));
    } catch {}

    const reportCount = nextReports.length;
    const autoHidden = reportCount >= 3;

    if (autoHidden) {
      const listingKeys = Object.values(CATEGORY_SLICE_MAP);
      for (const key of listingKeys) {
        const list = this.state[key];
        if (Array.isArray(list)) {
          const idx = list.findIndex((item) => String(item.id) === strId);
          if (idx !== -1) {
            this.state[key][idx] = {
              ...this.state[key][idx],
              status: 'flagged_hidden',
            };
            this.notify(key);
          }
        }
      }

      if (supabase && isValidUuid(strId)) {
        try {
          await supabase
            .from('listings')
            .update({ status: 'flagged_hidden' })
            .eq('id', strId);
        } catch {}
      }

      this.addNotification({
        tag: 'TRUST & SAFETY ALERT',
        title: `Listing Auto-Hidden (${reportCount} Reports)`,
        message: `Listing #${strId.slice(0, 8)} was automatically hidden after ${reportCount} community reports (${reason}).`,
        time: 'Just now',
        type: 'moderation',
        targetId: strId,
        recipient_role: 'admin',
      });
    }

    this.notify('safetyReports');
    this.notify('listings');

    return {
      ok: true,
      reportCount,
      autoHidden,
      message: autoHidden
        ? 'Thank you. This listing reached 3 community reports and has been automatically hidden pending Admin review.'
        : 'Report submitted to ApkeKareeb Trust & Safety team.',
    };
  }

  checkOtpRateLimit(rawPhone) {
    const cleanPhone = sanitizePhone(rawPhone);
    if (!cleanPhone || cleanPhone.length < 10) {
      return { allowed: false, waitSeconds: 0, message: 'Please enter a valid 10-digit mobile number.' };
    }

    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const history = Array.isArray(this.state.otpRateLimits?.[cleanPhone])
      ? this.state.otpRateLimits[cleanPhone].filter((ts) => ts > oneHourAgo)
      : [];

    if (history.length > 0) {
      const lastRequestTs = history[history.length - 1];
      const elapsedSeconds = Math.floor((now - lastRequestTs) / 1000);
      if (elapsedSeconds < 60) {
        const waitSeconds = 60 - elapsedSeconds;
        return {
          allowed: false,
          waitSeconds,
          message: `Please wait ${waitSeconds}s before requesting another OTP.`,
        };
      }
    }

    if (history.length >= 3) {
      return {
        allowed: false,
        waitSeconds: 3600,
        message: 'Maximum OTP limit (3 per hour) reached for this number. Please try again later.',
      };
    }

    const updatedHistory = [...history, now];
    this.state.otpRateLimits = {
      ...(this.state.otpRateLimits || {}),
      [cleanPhone]: updatedHistory,
    };

    try {
      localStorage.setItem('ak_otp_rate_limits_v1', JSON.stringify(this.state.otpRateLimits));
    } catch {}

    return {
      allowed: true,
      remainingThisHour: Math.max(0, 3 - updatedHistory.length),
      waitSeconds: 60,
    };
  }

  // ==========================================
  // 🌟 REVIEWS & RATINGS ENGINE
  // ==========================================

  getListingReviews(listingId) {
    const strId = String(listingId);
    return this.state.reviews[strId] || [];
  }

  async addListingReview(listingId, reviewData) {
    const strId = String(listingId);
    const user = getCurrentUserProfile();
    const userPhone = sanitizePhone(user?.phone) || sanitizePhone(reviewData.phone) || 'guest';
    const currentReviews = this.getListingReviews(strId);

    const existingIndex = currentReviews.findIndex((r) => r.phone === userPhone);
    if (existingIndex >= 0) {
      return { success: false, message: 'You have already reviewed this product.' };
    }

    const newReview = {
      id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      listingId: strId,
      userId: user?.id || null,
      phone: userPhone,
      userName: reviewData.userName || user?.full_name || 'Verified Resident',
      rating: Number(reviewData.rating) || 5,
      comment: reviewData.comment || '',
      photos: Array.isArray(reviewData.photos) ? reviewData.photos : [],
      video: reviewData.video || null,
      audioUrl: reviewData.audioUrl || null,
      audioDuration: reviewData.audioDuration || null,
      createdAt: new Date().toISOString(),
      verifiedResident: Boolean(user?.verification_tier === 'verified_resident' || user?.is_verified),
    };

    const updatedReviews = [newReview, ...currentReviews];
    this.state.reviews[strId] = updatedReviews;
    saveStoredReviewsMap(this.state.reviews);

    this.notify(`reviews:${strId}`);
    this.notify('reviews');
    this.notify('all');

    if (supabase && isValidUuid(strId)) {
      try {
        await supabase.from('listing_reviews').insert([
          {
            listing_id: strId,
            user_id: user?.id || null,
            user_name: newReview.userName,
            phone: userPhone,
            rating: newReview.rating,
            comment: newReview.comment,
            photos: newReview.photos,
            video_url: newReview.video,
            audio_url: newReview.audioUrl,
            audio_duration: newReview.audioDuration,
            is_verified_resident: newReview.verifiedResident,
          },
        ]);
      } catch (err) {
        console.warn('Review database sync note:', err.message);
      }
    }

    return { success: true, review: newReview };
  }

  getListingRatingStats(listingId, defaultRating = 4.8) {
    const reviews = this.getListingReviews(listingId);
    if (reviews.length === 0) {
      return {
        averageRating: Number(defaultRating).toFixed(1),
        totalReviews: 0,
        breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      };
    }

    const total = reviews.length;
    const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
    const avg = (sum / total).toFixed(1);

    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating || 5)));
      breakdown[star] = (breakdown[star] || 0) + 1;
    });

    return {
      averageRating: avg,
      totalReviews: total,
      breakdown,
    };
  }

  // ==========================================
  // 🛒 CART MANAGEMENT ENGINE
  // ==========================================

  async loadUserCart(phone) {
    if (!phone) {
      this.state.cart = [];
      this.state.activeUserPhone = null;
      this.notify('cart');
      return;
    }

    const cleanPhone = sanitizePhone(phone);
    this.state.activeUserPhone = cleanPhone;

    const localCart = getStoredCartForUser(cleanPhone);
    this.state.cart = localCart;
    this.notify('cart');

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('user_carts')
          .select('listing_id, quantity')
          .eq('phone', cleanPhone);

        if (!error && data && data.length > 0) {
          const allListings = this.getAllListings();
          const dbCart = [];

          data.forEach((row) => {
            const match = allListings.find((l) => String(l.id) === String(row.listing_id));
            if (match && row.quantity > 0) {
              dbCart.push({
                id: String(match.id),
                listingId: String(match.id),
                title: match.title || match.name || 'Product',
                price: match.price || match.rates || 'Contact for Price',
                numericPrice: parseNumericPrice(match.price || match.rates),
                image: match.image || match.image_url || (match.images && match.images[0]) || null,
                sellerName: match.sellerName || match.providerName || 'Local Merchant',
                phone: sanitizePhone(match.phone || match.whatsapp) || '9876543210',
                whatsapp: sanitizePhone(match.whatsapp || match.phone) || '9876543210',
                category: match.category || 'general',
                subCategory: match.subCategory || 'all',
                location: match.location || 'Alwar',
                quantity: Number(row.quantity),
                addedAt: new Date().toISOString(),
              });
            }
          });

          if (dbCart.length > 0) {
            this.state.cart = dbCart;
            saveStoredCartForUser(cleanPhone, dbCart);
            this.notify('cart');
          }
        }
      } catch (err) {
        console.warn('Cart database hydration note:', err.message);
      }
    }
  }

  resetCartOnLogout() {
    this.state.cart = [];
    this.state.activeUserPhone = null;
    this.notify('cart');
  }

  getCartItems() {
    return this.state.cart || [];
  }

  getCartCount() {
    return (this.state.cart || []).reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  }

  getCartTotal() {
    return (this.state.cart || []).reduce((sum, item) => {
      const unit = parseNumericPrice(item.price);
      return sum + unit * (Number(item.quantity) || 1);
    }, 0);
  }

  getCartBySeller() {
    const items = this.state.cart || [];
    return items.reduce((acc, item) => {
      const vendorKey = item.sellerPhone || item.phone || 'store';
      if (!acc[vendorKey]) {
        acc[vendorKey] = {
          sellerName: item.sellerName || 'Local Merchant',
          sellerPhone: vendorKey,
          whatsapp: item.whatsapp || vendorKey,
          location: item.location || 'Alwar',
          timing: item.timing || '09:00 AM - 09:00 PM',
          items: [],
          subtotal: 0,
        };
      }
      acc[vendorKey].items.push(item);
      acc[vendorKey].subtotal += (item.numericPrice || parseNumericPrice(item.price)) * (item.quantity || 1);
      return acc;
    }, {});
  }

  addToCart(listingItem, quantity = 1, explicitPhone = null) {
    if (!listingItem || !listingItem.id) return { success: false, message: 'Invalid listing' };

    const currentUser = getCurrentUserProfile();
    const phone = explicitPhone || currentUser?.phone || this.state.activeUserPhone;

    if (!phone) {
      return {
        success: false,
        requireAuth: true,
        message: 'Please sign in to add items to your personal cart.',
      };
    }

    const cleanPhone = sanitizePhone(phone);
    const sellerPhone = sanitizePhone(listingItem.phone || listingItem.whatsapp);

    if (cleanPhone && sellerPhone && cleanPhone === sellerPhone) {
      return {
        success: false,
        isSelfListing: true,
        message: 'You cannot add your own business listing to your personal cart.',
      };
    }

    this.state.activeUserPhone = cleanPhone;
    const cart = [...(this.state.cart || [])];
    const targetId = String(listingItem.id);
    const existingIndex = cart.findIndex((i) => String(i.id) === targetId);
    let finalQuantity = quantity;

    if (existingIndex > -1) {
      finalQuantity = (Number(cart[existingIndex].quantity) || 1) + Number(quantity);
      cart[existingIndex].quantity = finalQuantity;
    } else {
      cart.push({
        id: targetId,
        listingId: targetId,
        userId: listingItem.user_id || listingItem.userId || null,
        title: listingItem.title || listingItem.name || 'Listing Item',
        price: listingItem.price || listingItem.rates || 'Contact for Price',
        originalPrice: listingItem.original_price || listingItem.originalPrice || null,
        numericPrice: parseNumericPrice(listingItem.price || listingItem.rates),
        image: listingItem.image || listingItem.image_url || (listingItem.images && listingItem.images[0]) || null,
        sellerName: listingItem.sellerName || listingItem.seller_name || listingItem.providerName || 'Verified Merchant',
        sellerPhone: sellerPhone || '9876543210',
        phone: sellerPhone || '9876543210',
        whatsapp: sanitizePhone(listingItem.whatsapp || listingItem.phone) || '9876543210',
        category: listingItem.category || 'general',
        subCategory: listingItem.subCategory || listingItem.sub_category || 'all',
        location: listingItem.location || listingItem.location_name || 'Alwar',
        city: listingItem.city || 'Alwar',
        timing: listingItem.timing || listingItem.activeHours || '09:00 AM - 09:00 PM',
        dealBadge: listingItem.deal_badge || listingItem.dealBadge || null,
        tokenAmount: listingItem.token_amount || listingItem.tokenAmount || null,
        doorstepTrial: Boolean(listingItem.doorstep_trial ?? listingItem.doorstepTrial),
        quantity: Math.max(1, Number(quantity)),
        addedAt: new Date().toISOString(),
      });
    }

    this.state.cart = cart;
    saveStoredCartForUser(cleanPhone, cart);
    this.notify('cart');
    this.notify('all');

    if (supabase && isValidUuid(targetId)) {
      supabase
        .from('user_carts')
        .upsert(
          {
            phone: cleanPhone,
            listing_id: targetId,
            quantity: finalQuantity,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'phone,listing_id' }
        )
        .then(({ error }) => {
          if (error) console.warn('Supabase cart sync notice:', error.message);
        });
    }

    const buyerLocality = currentUser?.area_name || currentUser?.city || 'your area';
    const residentTier = currentUser?.verification_tier === 'verified_resident' ? 'A verified resident' : 'A local resident';
    const listingTitle = listingItem.title || listingItem.name || 'Your Product';
    const sellerUserId = listingItem.user_id || listingItem.userId || null;

    const sellerAlert = {
      user_id: sellerUserId,
      tag: 'CART_ADDITION',
      title: `🛒 In Cart: "${listingTitle}"`,
      message: `${residentTier} in ${buyerLocality} added this listing to their shopping cart.`,
      time: 'Just now',
      type: 'cart',
      targetId: targetId,
      recipient_role: 'seller',
      recipient_phone: sellerPhone,
      metadata: {
        listingId: targetId,
        category: listingItem.category || 'general',
        sellerUserId,
        sellerPhone,
        buyerUserId: currentUser?.id || null,
      },
    };

    this.addNotification(sellerAlert);

    if (supabase && sellerPhone) {
      supabase.from('notifications').insert([
        {
          user_id: isValidUuid(sellerUserId) ? sellerUserId : null,
          tag: 'CART_ADDITION',
          title: sellerAlert.title,
          message: sellerAlert.message,
          recipient_role: 'seller',
          recipient_phone: sellerPhone,
          metadata: sellerAlert.metadata,
        },
      ]).then(({ error }) => {
        if (error) console.warn('Seller cart notification sync notice:', error.message);
      });
    }

    return { success: true, count: this.getCartCount(), cart };
  }

  updateCartQuantity(listingId, quantity, explicitPhone = null) {
    const currentUser = getCurrentUserProfile();
    const phone = explicitPhone || currentUser?.phone || this.state.activeUserPhone;
    if (!phone) return;

    const cleanPhone = sanitizePhone(phone);
    let cart = [...(this.state.cart || [])];
    const targetId = String(listingId);
    const numQty = Number(quantity);

    if (numQty <= 0) {
      cart = cart.filter((i) => String(i.id) !== targetId);
    } else {
      const idx = cart.findIndex((i) => String(i.id) === targetId);
      if (idx > -1) {
        cart[idx].quantity = numQty;
      }
    }

    this.state.cart = cart;
    saveStoredCartForUser(cleanPhone, cart);
    this.notify('cart');
    this.notify('all');

    if (supabase && isValidUuid(targetId)) {
      if (numQty <= 0) {
        supabase
          .from('user_carts')
          .delete()
          .eq('phone', cleanPhone)
          .eq('listing_id', targetId)
          .then();
      } else {
        supabase
          .from('user_carts')
          .upsert(
            {
              phone: cleanPhone,
              listing_id: targetId,
              quantity: numQty,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'phone,listing_id' }
          )
          .then();
      }
    }
  }

  removeFromCart(listingId, explicitPhone = null) {
    this.updateCartQuantity(listingId, 0, explicitPhone);
  }

  clearCart(explicitPhone = null) {
    const currentUser = getCurrentUserProfile();
    const phone = explicitPhone || currentUser?.phone || this.state.activeUserPhone;

    if (phone) {
      const cleanPhone = sanitizePhone(phone);
      const key = getUserCartStorageKey(cleanPhone);
      if (key) localStorage.removeItem(key);

      if (supabase) {
        supabase.from('user_carts').delete().eq('phone', cleanPhone).then();
      }
    }

    this.state.cart = [];
    this.notify('cart');
    this.notify('all');
  }

  isItemInCart(listingId) {
    const targetId = String(listingId);
    return (this.state.cart || []).some((i) => String(i.id) === targetId);
  }

  getCartItemQuantity(listingId) {
    const targetId = String(listingId);
    const match = (this.state.cart || []).find((i) => String(i.id) === targetId);
    return match ? Number(match.quantity) || 0 : 0;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(changedKey) {
    this.listeners.forEach((listener) => listener(this.state, changedKey));
  }
}

export const hyperlocalStore = new HyperlocalEngineStore();

export const useHyperlocalStore = () => ({
  listings: hyperlocalStore.state.listings,
  interests: hyperlocalStore.state.interests,
  reviews: hyperlocalStore.state.reviews,
  cart: hyperlocalStore.state.cart,
  notifications: hyperlocalStore.state.notifications,
  selectedSeller: hyperlocalStore.state.selectedSeller,
  isSellerProfileOpen: hyperlocalStore.state.isSellerProfileOpen,
  leadStats: hyperlocalStore.state.leadStats,
  sellerPlans: hyperlocalStore.state.sellerPlans,
  safetyReports: hyperlocalStore.state.safetyReports,
  openSellerProfile: (seller) => hyperlocalStore.openSellerProfile(seller),
  closeSellerProfile: () => hyperlocalStore.closeSellerProfile(),
  getListingsBySeller: (seller) => hyperlocalStore.getListingsBySeller(seller),
  getCartBySeller: () => hyperlocalStore.getCartBySeller(),
  toggleInterestOnce: (lid, title, seller) => hyperlocalStore.toggleInterestOnce(lid, 0, title, seller),
  hasUserInterested: (lid) => hyperlocalStore.hasUserInterested(lid),
  addListingReview: (lid, data) => hyperlocalStore.addListingReview(lid, data),
  getListingRatingStats: (lid, def) => hyperlocalStore.getListingRatingStats(lid, def),
  getInterestCount: (lid, def) => hyperlocalStore.getInterestCount(lid, def),
  addToCart: (item, qty) => hyperlocalStore.addToCart(item, qty),
  updateCartQuantity: (lid, qty) => hyperlocalStore.updateCartQuantity(lid, qty),
  removeFromCart: (lid) => hyperlocalStore.removeFromCart(lid),
  clearCart: () => hyperlocalStore.clearCart(),
  isItemInCart: (lid) => hyperlocalStore.isItemInCart(lid),
  markNotificationRead: (id) => hyperlocalStore.markNotificationRead(id),
  markAllNotificationsRead: (ids) => hyperlocalStore.markAllNotificationsRead(ids),
  setListingPromotion: (id, promoted, days) => hyperlocalStore.setListingPromotion(id, promoted, days),

  // Step 2 & 3 & 4 additions surfaced in the hook
  buildAttributedWhatsAppUrl: (listing, note) => hyperlocalStore.buildAttributedWhatsAppUrl(listing, note),
  recordLeadAction: (listing, action) => hyperlocalStore.recordLeadAction(listing, action),
  getSellerROIMetrics: (phone, uid) => hyperlocalStore.getSellerROIMetrics(phone, uid),
  getSellerPlan: (userOrPhone) => hyperlocalStore.getSellerPlan(userOrPhone),
  setSellerPlan: (phone, planId, exp) => hyperlocalStore.setSellerPlan(phone, planId, exp),
  checkPostingQuota: (cat, user, opt) => hyperlocalStore.checkPostingQuota(cat, user, opt),
  getCategorySafetyRule: (cat) => hyperlocalStore.getCategorySafetyRule(cat),
  getSafeDisplayPhone: (listing) => hyperlocalStore.getSafeDisplayPhone(listing),
  isListingExpiredOrHidden: (listing) => hyperlocalStore.isListingExpiredOrHidden(listing),
  markListingAsSold: (lid) => hyperlocalStore.markListingAsSold(lid),
  submitListingReport: (lid, reason, details) => hyperlocalStore.submitListingReport(lid, reason, details),
  checkOtpRateLimit: (phone) => hyperlocalStore.checkOtpRateLimit(phone),
});

let inFlightHydration = null;
let lastHydrateTimestamp = 0;
const HYDRATE_COOLDOWN_MS = 5000;

export async function hydrateFromDB(force = false) {
  if (!supabase) return;
  const now = Date.now();
  if (!force && inFlightHydration) return inFlightHydration;
  if (!force && now - lastHydrateTimestamp < HYDRATE_COOLDOWN_MS) return;

  lastHydrateTimestamp = now;

  inFlightHydration = (async () => {
    try {
      const withTimeout = (promise, ms = 4000) =>
        Promise.race([
          promise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Hydration Timeout')), ms)),
        ]);

      const activeUser = getCurrentUserProfile();
      const activeUserId = activeUser?.id && isValidUuid(activeUser.id) ? activeUser.id : null;
      const activeUserPhone = sanitizePhone(activeUser?.phone);
      const isAdminUser = Boolean(activeUser?.role === 'admin' || isAdminAuthorized());

      const listingsFetch = supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      let notifsQuery = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(60);

      if (isAdminUser) {
        if (activeUserId && activeUserPhone) {
          notifsQuery = notifsQuery.or(`recipient_role.eq.admin,user_id.eq.${activeUserId},recipient_phone.eq.${activeUserPhone},recipient_role.eq.public`);
        } else {
          notifsQuery = notifsQuery.or('recipient_role.eq.admin,recipient_role.eq.public');
        }
      } else if (activeUserId && activeUserPhone) {
        notifsQuery = notifsQuery.or(`user_id.eq.${activeUserId},recipient_phone.eq.${activeUserPhone},and(recipient_role.eq.public,user_id.is.null,recipient_phone.is.null)`);
      } else if (activeUserPhone) {
        notifsQuery = notifsQuery.or(`recipient_phone.eq.${activeUserPhone},and(recipient_role.eq.public,user_id.is.null,recipient_phone.is.null)`);
      } else if (activeUserId) {
        notifsQuery = notifsQuery.or(`user_id.eq.${activeUserId},and(recipient_role.eq.public,user_id.is.null,recipient_phone.is.null)`);
      } else {
        notifsQuery = notifsQuery.eq('recipient_role', 'public').is('user_id', null).is('recipient_phone', null);
      }

      const reviewsFetch = supabase
        .from('listing_reviews')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      const threadsFetch = supabase
        .from('listing_threads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(150);

      const [listingsRes, notifsRes, reviewsRes, threadsRes] = await Promise.allSettled([
        withTimeout(listingsFetch),
        withTimeout(notifsQuery),
        withTimeout(reviewsFetch),
        withTimeout(threadsFetch),
      ]);

      const listingsData = listingsRes.status === 'fulfilled' ? listingsRes.value?.data : null;
      if (listingsData && listingsData.length > 0) {
        hyperlocalStore.hydrateBulk(listingsData);
      }

      const notifsData = notifsRes.status === 'fulfilled' ? notifsRes.value?.data : null;
      if (notifsData && Array.isArray(notifsData)) {
        const readSet = getStoredReadNotifs();

        hyperlocalStore.state.notifications = notifsData.map((n) => {
          const readResolved = Boolean(n.is_read || readSet.has(String(n.id)));
          return {
            id: String(n.id),
            user_id: n.user_id || null,
            tag: n.tag,
            title: n.title,
            message: n.message,
            read: readResolved,
            is_read: readResolved,
            recipient_role: n.recipient_role || 'public',
            recipient_phone: sanitizePhone(n.recipient_phone),
            targetId: n.metadata?.targetId || n.metadata?.listingId || null,
            metadata: n.metadata || {},
            created_at: n.created_at,
          };
        });
        hyperlocalStore.notify('notifications');
      }

      const reviewsData = reviewsRes.status === 'fulfilled' ? reviewsRes.value?.data : null;
      if (reviewsData && reviewsData.length > 0) {
        hyperlocalStore.hydrateReviews(reviewsData);
      }

      const threadsData = threadsRes.status === 'fulfilled' ? threadsRes.value?.data : null;
      if (threadsData && threadsData.length > 0) {
        hyperlocalStore.hydrateThreads(threadsData);
      }

      if (activeUserPhone) {
        hyperlocalStore.loadUserCart(activeUserPhone);
      }
    } catch (err) {
      console.warn('Fast hydration notice, continuing with local store:', err.message);
    } finally {
      inFlightHydration = null;
    }
  })();

  return inFlightHydration;
}

let realtimeChannel = null;

export function initRealtimeSubscriptions() {
  if (realtimeChannel || !supabase) return;

  const startSocket = () => {
    if (realtimeChannel) return;

    realtimeChannel = supabase
      .channel('hyperlocal-realtime-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'listings' },
        (payload) => {
          if (payload.eventType === 'DELETE' && payload.old?.id) {
            hyperlocalStore.removeListing(payload.old.id);
          } else if (payload.new) {
            hyperlocalStore.hydrateBulk([payload.new]);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'listing_threads' },
        (payload) => {
          const row = payload.new;
          if (!row) return;

          if (payload.eventType === 'INSERT') {
            const strId = String(row.listing_id);
            const currentThreads = hyperlocalStore.state.threads[strId] || [];
            const exists = currentThreads.some((c) => String(c.id) === String(row.id));

            if (!exists) {
              hyperlocalStore.state.threads[strId] = [
                {
                  id: row.id,
                  userName: row.user_name || 'Local Buyer',
                  userArea: row.user_area || 'Nearby',
                  text: row.comment_text,
                  type: row.audio_url ? 'audio' : 'text',
                  audioUrl: row.audio_url || null,
                  audioDuration: row.audio_duration || '0:15',
                  timestamp: 'Just now',
                  created_at: row.created_at,
                  isPublic: row.is_public !== undefined ? row.is_public : true,
                  sellerReply: (row.seller_reply || row.seller_audio_url)
                    ? {
                        text: row.seller_reply,
                        type: row.seller_audio_url ? 'audio' : 'text',
                        audioUrl: row.seller_audio_url || null,
                        duration: row.seller_audio_duration || '0:15',
                        timestamp: 'Verified Response',
                      }
                    : null,
                },
                ...currentThreads,
              ];
              hyperlocalStore.notify(`thread:${strId}`);
              hyperlocalStore.notify('threads');
            }
          } else if (payload.eventType === 'UPDATE') {
            const strId = String(row.listing_id);
            hyperlocalStore.state.threads[strId] = (
              hyperlocalStore.state.threads[strId] || []
            ).map((c) =>
              String(c.id) === String(row.id)
                ? {
                    ...c,
                    sellerReply: {
                      text: row.seller_reply,
                      type: row.seller_audio_url ? 'audio' : 'text',
                      audioUrl: row.seller_audio_url || null,
                      duration: row.seller_audio_duration || '0:15',
                      timestamp: 'Just now',
                    },
                  }
                : c
            );
            hyperlocalStore.notify(`thread:${strId}`);
            hyperlocalStore.notify('threads');
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'listing_reviews' },
        (payload) => {
          if (payload.new) {
            hyperlocalStore.hydrateReviews([payload.new]);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_carts' },
        (payload) => {
          const activeUser = getCurrentUserProfile();
          const activePhone = sanitizePhone(activeUser?.phone);
          const rowPhone = sanitizePhone(payload.new?.phone || payload.old?.phone);

          if (activePhone && rowPhone && rowPhone === activePhone) {
            hyperlocalStore.loadUserCart(activePhone);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const newNotif = payload.new;
          if (!newNotif) return;

          const currentUser = getCurrentUserProfile();
          const currentUserId = currentUser?.id;
          const currentUserPhone = sanitizePhone(currentUser?.phone);
          const isAdmin = Boolean(currentUser?.role === 'admin' || isAdminAuthorized());

          const notifUserId = newNotif.user_id;
          const notifPhone = sanitizePhone(newNotif.recipient_phone);
          const notifRole = String(newNotif.recipient_role || 'public').toLowerCase();

          let belongsToMe = false;

          if (notifRole === 'admin') {
            belongsToMe = isAdmin;
          } else if (notifUserId && currentUserId && String(notifUserId) === String(currentUserId)) {
            belongsToMe = true;
          } else if (notifPhone && currentUserPhone && notifPhone === currentUserPhone) {
            belongsToMe = true;
          } else if (notifRole === 'public' && !notifUserId && !notifPhone) {
            belongsToMe = true;
          }

          if (belongsToMe) {
            hyperlocalStore.addNotification(newNotif);
          }
        }
      )
      .subscribe();
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(startSocket, { timeout: 1500 });
  } else {
    setTimeout(startSocket, 400);
  }
}

export function useStoreSlice(bucketKey) {
  const [data, setData] = useState(() => hyperlocalStore.getState(bucketKey));

  useEffect(() => {
    return hyperlocalStore.subscribe((_, changedKey) => {
      if (!changedKey || changedKey === bucketKey || changedKey === 'all') {
        setData([...hyperlocalStore.getState(bucketKey)]);
      }
    });
  }, [bucketKey]);

  return data;
}

export function useAllListingsSlice() {
  const [allListings, setAllListings] = useState(() => hyperlocalStore.getAllListings());

  useEffect(() => {
    return hyperlocalStore.subscribe((_, changedKey) => {
      if (!changedKey || changedKey === 'all') {
        setAllListings([...hyperlocalStore.getAllListings()]);
      }
    });
  }, []);

  return allListings;
}

const isCurrentlyPromoted = (item) => {
  if (!item || item.is_active === false || item.is_shadowbanned) return false;
  const expiresAt = item.promoted_until || item.deal_expires_at;
  const notExpired = !expiresAt || new Date(expiresAt).getTime() > Date.now();
  return Boolean((item.is_promoted || item.deal_type === 'PAID_PROMO') && notExpired);
};

export function usePromotedListingsSlice() {
  const [promoted, setPromoted] = useState(() =>
    hyperlocalStore.getAllListings().filter(isCurrentlyPromoted)
  );

  useEffect(() => {
    return hyperlocalStore.subscribe((_, changedKey) => {
      if (!changedKey || changedKey === 'all') {
        setPromoted(hyperlocalStore.getAllListings().filter(isCurrentlyPromoted));
      }
    });
  }, []);

  return promoted;
}

export function useThreadSlice(listingId, defaultComments = []) {
  const [comments, setComments] = useState(() =>
    hyperlocalStore.getThreadComments(listingId, defaultComments)
  );

  useEffect(() => {
    return hyperlocalStore.subscribe((_, changedKey) => {
      if (!changedKey || changedKey === `thread:${listingId}` || changedKey === 'threads') {
        setComments([...hyperlocalStore.getThreadComments(listingId, defaultComments)]);
      }
    });
  }, [listingId, defaultComments]);

  return comments;
}

export function useInterestSlice(listingId, defaultCount = 0) {
  const [count, setCount] = useState(() =>
    hyperlocalStore.getInterestCount(listingId, defaultCount)
  );

  useEffect(() => {
    return hyperlocalStore.subscribe((_, changedKey) => {
      if (!changedKey || changedKey === `interest:${listingId}` || changedKey === 'all') {
        setCount(hyperlocalStore.getInterestCount(listingId, defaultCount));
      }
    });
  }, [listingId, defaultCount]);

  return count;
}

export function useListingReviews(listingId) {
  const [reviews, setReviews] = useState(() =>
    hyperlocalStore.getListingReviews(listingId)
  );

  useEffect(() => {
    return hyperlocalStore.subscribe((_, changedKey) => {
      if (!changedKey || changedKey === `reviews:${listingId}` || changedKey === 'reviews' || changedKey === 'all') {
        setReviews([...hyperlocalStore.getListingReviews(listingId)]);
      }
    });
  }, [listingId]);

  return reviews;
}

export function useListingRatingStats(listingId, defaultRating = 4.8) {
  const [stats, setStats] = useState(() =>
    hyperlocalStore.getListingRatingStats(listingId, defaultRating)
  );

  useEffect(() => {
    return hyperlocalStore.subscribe((_, changedKey) => {
      if (!changedKey || changedKey === `reviews:${listingId}` || changedKey === 'reviews' || changedKey === 'all') {
        setStats(hyperlocalStore.getListingRatingStats(listingId, defaultRating));
      }
    });
  }, [listingId, defaultRating]);

  return stats;
}

export function useCartSlice() {
  const [cart, setCart] = useState(() => hyperlocalStore.getCartItems());

  useEffect(() => {
    return hyperlocalStore.subscribe((_, changedKey) => {
      if (!changedKey || changedKey === 'cart' || changedKey === 'all') {
        setCart([...hyperlocalStore.getCartItems()]);
      }
    });
  }, []);

  return cart;
}

export function useCartCount() {
  const [count, setCount] = useState(() => hyperlocalStore.getCartCount());

  useEffect(() => {
    return hyperlocalStore.subscribe((_, changedKey) => {
      if (!changedKey || changedKey === 'cart' || changedKey === 'all') {
        setCount(hyperlocalStore.getCartCount());
      }
    });
  }, []);

  return count;
}

export function useNotificationSlice(explicitScope = null) {
  const [filteredNotifs, setFilteredNotifs] = useState(() => getScopedNotifications(explicitScope));

  function getScopedNotifications(scope) {
    const rawNotifs = hyperlocalStore.state.notifications || [];
    const profile = getCurrentUserProfile();
    const userPhone = sanitizePhone(profile?.phone);

    const readSet = getStoredReadNotifs();

    const notifsWithReadState = rawNotifs.map((n) => {
      const isRead = Boolean(n.is_read || n.read || readSet.has(String(n.id)));
      return { ...n, is_read: isRead, read: isRead };
    });

    if (scope === 'admin') {
      return notifsWithReadState.filter(
        (n) => n.recipient_role === 'admin' || ADMIN_TAGS.has(n.tag)
      );
    }

    if (scope === 'seller' || (scope !== 'public' && userPhone)) {
      return notifsWithReadState.filter((n) => {
        const notifPhone = sanitizePhone(
          n.recipient_phone ||
          n.metadata?.sellerPhone ||
          n.metadata?.seller_phone ||
          n.metadata?.phone
        );

        if (userPhone && notifPhone === userPhone) {
          return true;
        }
        if (n.recipient_role === 'public' && !ADMIN_TAGS.has(n.tag) && !SELLER_TAGS.has(n.tag)) {
          return true;
        }
        return false;
      });
    }

    return notifsWithReadState.filter(
      (n) => n.recipient_role === 'public' && !ADMIN_TAGS.has(n.tag) && !SELLER_TAGS.has(n.tag)
    );
  }

  useEffect(() => {
    return hyperlocalStore.subscribe((_, changedKey) => {
      if (!changedKey || changedKey === 'notifications') {
        setFilteredNotifs(getScopedNotifications(explicitScope));
      }
    });
  }, [explicitScope]);

  return filteredNotifs;
}

export function useRoleFilteredNotifications(currentUser, currentScreen = 'home', isAdminMode = false) {
  const [alerts, setAlerts] = useState(() => filterAlerts());

  function filterAlerts() {
    const rawNotifs = hyperlocalStore.state.notifications || [];
    const readSet = getStoredReadNotifs();

    const notifsWithRead = rawNotifs.map((n) => {
      const isRead = Boolean(n.is_read || n.read || readSet.has(String(n.id)));
      return { ...n, is_read: isRead, read: isRead };
    });

    if (!currentUser) {
      return notifsWithRead.filter((n) => {
        const role = String(n.recipient_role || n.role || '').toLowerCase();
        const hasUserId = Boolean(n.user_id);
        const hasPhone = Boolean(n.recipient_phone);
        const isInternalTag = ADMIN_TAGS.has(n.tag) || SELLER_TAGS.has(n.tag);

        return role === 'public' && !hasUserId && !hasPhone && !isInternalTag;
      });
    }

    const currentUserId = currentUser.id ? String(currentUser.id) : null;
    const userPhone = sanitizePhone(currentUser.phone);

    const isSeller = Boolean(
      currentUser.is_merchant ||
      currentUser.verification_tier === 'verified_merchant' ||
      currentUser.verification_tier === 'merchant' ||
      currentUser.role === 'seller'
    );

    const isAdmin = Boolean(
      currentScreen === 'admin-dashboard' ||
      currentUser.role === 'admin' ||
      (isAdminMode && currentScreen === 'admin-dashboard')
    );

    return notifsWithRead.filter((n) => {
      const role = String(n.recipient_role || n.role || 'public').toLowerCase();
      const notifUserId = n.user_id ? String(n.user_id) : null;
      const notifPhone = sanitizePhone(n.recipient_phone || n.metadata?.sellerPhone || n.metadata?.userPhone);

      if (role === 'admin' || ADMIN_TAGS.has(n.tag)) {
        return isAdmin;
      }

      if (role === 'seller' || SELLER_TAGS.has(n.tag)) {
        if (!isSeller) return false;
        if (notifUserId && currentUserId && notifUserId === currentUserId) return true;
        if (notifPhone && userPhone && notifPhone === userPhone) return true;
        return false;
      }

      if (role === 'user') {
        if (notifUserId && currentUserId && notifUserId === currentUserId) return true;
        if (notifPhone && userPhone && notifPhone === userPhone) return true;
        return false;
      }

      if (role === 'public') {
        if (notifUserId && currentUserId && notifUserId !== currentUserId) return false;
        if (notifPhone && userPhone && notifPhone !== userPhone) return false;
        return !ADMIN_TAGS.has(n.tag) && !SELLER_TAGS.has(n.tag);
      }

      return false;
    });
  }

  useEffect(() => {
    return hyperlocalStore.subscribe((_, changedKey) => {
      if (!changedKey || changedKey === 'notifications' || changedKey === 'all') {
        setAlerts(filterAlerts());
      }
    });
  }, [currentUser?.id, currentUser?.phone, currentUser?.is_merchant, currentScreen, isAdminMode]);

  return alerts;
}

export function useSellerProfileSlice() {
  const [profileState, setProfileState] = useState(() => ({
    selectedSeller: hyperlocalStore.state.selectedSeller,
    isOpen: hyperlocalStore.state.isSellerProfileOpen,
  }));

  useEffect(() => {
    return hyperlocalStore.subscribe((_, changedKey) => {
      if (!changedKey || changedKey === 'sellerProfile' || changedKey === 'all') {
        setProfileState({
          selectedSeller: hyperlocalStore.state.selectedSeller,
          isOpen: hyperlocalStore.state.isSellerProfileOpen,
        });
      }
    });
  }, []);

  return {
    selectedSeller: profileState.selectedSeller,
    isSellerProfileOpen: profileState.isOpen,
    openSellerProfile: (seller) => hyperlocalStore.openSellerProfile(seller),
    closeSellerProfile: () => hyperlocalStore.closeSellerProfile(),
    getListingsBySeller: (seller) => hyperlocalStore.getListingsBySeller(seller),
  };
}