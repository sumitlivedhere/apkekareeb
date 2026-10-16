import { useState, useEffect } from 'react';
import { initialShaadiVendors } from '../data/shaadiData';
import { initialTransportFirms, initialIndividualTransporters } from '../data/transporterData';
import { initialKaarigarWorkers } from '../data/kaarigarData';
import { initialMarketProducts } from '../data/marketData';
import { initialAdvertisingProviders } from '../data/advertisingData';
import { initialEducationListings } from '../data/educationData';
import { initialConstructionListings } from '../data/constructionData';
import { initialMallsStores } from '../data/mallsData';
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

import { supabase } from '../services/supabaseClient';
import {
  getCategoryFallback,
  saveCommentToDB,
  updateInterestCountInDB,
} from '../services/listingService';
import { getCategoryById, sanitizeSubCategoryId } from '../data/taxonomyRegistry';
import { getCurrentUserProfile } from '../services/authService';

const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;
const USER_INTERESTS_STORAGE_KEY = 'aapkekareeb_user_interests';
const USER_REVIEWS_STORAGE_KEY = 'aapkekareeb_user_reviews';
const USER_NOTIFS_STORAGE_KEY = 'aapkekareeb_read_notifs';

const sanitizePhone = (phone) => (phone ? String(phone).replace(/\D/g, '').slice(-10) : null);

function isValidUuid(id) {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id).trim());
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
  vehicles: 'vehiclesListings',
  kaarigar: 'kaarigarWorkers',
  market: 'marketProducts',
  shaadi: 'shaadiVendors',
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

export function sanitizeImageUrl(url, category = 'property') {
  if (!url || typeof url !== 'string') return getCategoryFallback(category);
  const clean = url.trim();

  if (clean.startsWith('blob:')) {
    return getCategoryFallback(category);
  }

  if (clean.startsWith('photo-')) {
    return `https://images.unsplash.com/${clean}`;
  }

  if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:image')) {
    return clean;
  }

  return getCategoryFallback(category);
}

export function normalizeDBListing(item) {
  if (!item) return null;
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
    .map((img) => (typeof img === 'string' ? sanitizeImageUrl(img, catId) : sanitizeImageUrl(img?.url, catId)))
    .filter((img) => img && !img.startsWith('blob:'));

  let coverImage =
    sanitizeImageUrl(item.image_url, catId) ||
    (sanitizedImages.length > 0 ? sanitizedImages[0] : null) ||
    sanitizeImageUrl(item.image, catId) ||
    getCategoryFallback(catId);

  if (sanitizedImages.length === 0 && coverImage) {
    sanitizedImages = [coverImage];
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

  const nameVal = item.title || item.name || 'Untitled Listing';
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
  const resolvedBadge = item.verification_badge || item.verificationBadge || (hasPendingApproval ? '⏳ Pending Approval' : 'Verified Listing');

  return {
    id: String(item.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`),
    userId: item.user_id || item.userId || null,
    user_id: item.user_id || item.userId || null,
    title: nameVal,
    name: nameVal,
    category: catId,
    // 🚀 Paid Promotion Flags
    is_promoted: Boolean(
      (item.is_promoted === true || item.deal_type === 'PAID_PROMO') &&
      (!item.deal_expires_at || new Date(item.deal_expires_at).getTime() > Date.now())
    ),
    deal_type: item.deal_type || item.dealType || null,
    deal_expires_at: item.deal_expires_at || null,
    promoted_until: item.promoted_until || item.deal_expires_at || null,
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
    deal_type: item.deal_type || item.dealType || null,
    dealType: item.deal_type || item.dealType || null,
    deal_badge: item.deal_badge || item.dealBadge || null,
    dealBadge: item.deal_badge || item.dealBadge || null,
    deal_details: item.deal_details || item.dealDetails || null,
    dealDetails: item.deal_details || item.dealDetails || null,
    original_price: item.original_price || item.originalPrice || null,
    originalPrice: item.original_price || item.originalPrice || null,
    token_amount: item.token_amount || item.tokenAmount || null,
    tokenAmount: item.token_amount || item.tokenAmount || null,
    doorstep_trial: Boolean(item.doorstep_trial ?? item.doorstepTrial ?? false),
    doorstepTrial: Boolean(item.doorstep_trial ?? item.doorstepTrial ?? false),
    deal_expires_at: item.deal_expires_at || null,
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
    is_active: isActive,
    is_shadowbanned: Boolean(item.is_shadowbanned),
    has_pending_approval: hasPendingApproval,
    pending_changes: pendingChanges,
    admin_feedback: item.admin_feedback || null,
    seller_feedback_reply: item.seller_feedback_reply || null,
    isAvailableNow: true,
    isNew: Boolean(item.isNew),
    created_at: item.created_at || new Date().toISOString(),
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
      medicalListings: (initialMedicalListings || []).map((i) =>
        normalizeDBListing({ ...i, category: 'medical' })
      ),
      creatorsListings: (initialCreatorsListings || []).map((i) =>
        normalizeDBListing({ ...i, category: 'creators' })
      ),
      marketProducts: (initialMarketProducts || []).map((i) =>
        normalizeDBListing({ ...i, category: 'market' })
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
      seen.add(String(item.id));
      return true;
    });
  }

  // 🚀 Direct In-Memory Promotion Method (Instant UI update for both DB and Mock listings)
  setListingPromotion(listingId, isPromoted, durationDays = 7) {
    const strId = String(listingId);
    const expiresAt = isPromoted
      ? new Date(Date.now() + Number(durationDays) * 24 * 60 * 60 * 1000).toISOString()
      : null;

    Object.keys(this.state).forEach((key) => {
      if (Array.isArray(this.state[key])) {
        this.state[key] = this.state[key].map((item) => {
          if (item && String(item.id) === strId) {
            return {
              ...item,
              is_promoted: isPromoted,
              deal_type: isPromoted ? 'PAID_PROMO' : null,
              deal_expires_at: expiresAt,
              deal_badge: isPromoted ? '🚀 Sponsored' : (item.deal_badge === '🚀 Sponsored' ? null : item.deal_badge),
              verification_badge: isPromoted ? '🚀 Featured Sponsor' : (item.verification_badge === '🚀 Featured Sponsor' ? 'Verified Listing' : item.verification_badge),
            };
          }
          return item;
        });
        this.notify(key);
      }
    });
    this.notify('all');
    return expiresAt;
  }

  getAllListings() {
    const listingKeys = [
      'listings',
      'propertyListings',
      'fitnessListings',
      'medicalListings',
      'creatorsListings',
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

    const seenIds = new Set();
    const combined = [];

    listingKeys.forEach((key) => {
      const bucket = this.state[key] || [];
      bucket.forEach((item) => {
        if (item && item.id && !seenIds.has(String(item.id))) {
          seenIds.add(String(item.id));
          combined.push(item);
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
        list[idx] = { ...list[idx], ...normalized };
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

  /* ========================================================================= */
  /* 🔔 ID-BOUND NOTIFICATION ENGINE & SILENCER                                */
  /* ========================================================================= */

  addNotification(notif) {
    const notifId = String(notif.id || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`);
    const readSet = getStoredReadNotifs();
    const alreadyRead = Boolean(notif.is_read || notif.read || readSet.has(notifId));

    const rawUserId = notif.user_id || notif.userId || null;
    const validUserId = isValidUuid(rawUserId) ? String(rawUserId) : null;

    const newEntry = {
      id: notifId,
      user_id: validUserId, // 🔒 Bound directly to recipient user_profiles(id)
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

    // Look up target listing to obtain seller's verified contact phone & user_id
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

    // 🛡️ Route ONLY to the specific merchant's user_id and phone
    this.addNotification({
      user_id: targetSellerUserId,
      tag: hasAudio ? 'VOICE INQUIRY' : 'NEW COMMENT',
      title: `Inquiry on "${listingTitle || targetListing?.title || 'Listing'}"`,
      message: `${newEntry.userName} sent a ${hasAudio ? 'voice note' : 'message'}.`,
      time: 'Just now',
      type: 'comment',
      targetId: listingId,
      recipient_role: 'seller',
      recipient_phone: targetSellerPhone,
      metadata: {
        listingId: strId,
        sellerPhone: targetSellerPhone,
        sellerUserId: targetSellerUserId,
        commenterName: newEntry.userName,
        commenterUserId: currentUser?.id || null,
        commenterPhone: sanitizePhone(currentUser?.phone),
        hasAudio,
      },
    });

    saveCommentToDB(strId, newEntry, listingTitle, targetSellerPhone, targetSellerUserId).then((dbRow) => {
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

    // 🛡️ Route ONLY to the specific merchant's user_id and phone
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

    if (supabase && userPhone !== 'guest_device') {
      try {
        supabase.rpc('toggle_listing_interest', {
          p_listing_id: strId,
          p_phone: userPhone,
        });
      } catch {
        updateInterestCountInDB(strId, count, listingTitle, targetSellerPhone, targetSellerUserId);
      }
    } else {
      updateInterestCountInDB(strId, count, listingTitle, targetSellerPhone, targetSellerUserId);
    }

    return { success: true, count };
  }

  incrementInterest(listingId, defaultCount = 0, listingTitle = '', sellerName = '') {
    const res = this.toggleInterestOnce(listingId, defaultCount, listingTitle, sellerName);
    return res.count;
  }

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

    if (supabase) {
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

    if (supabase) {
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

    // 🛡️ Route ONLY to the specific merchant's user_id and phone
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

    if (supabase) {
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
});

let isHydrating = false;
let lastHydrateTimestamp = 0;
const HYDRATE_COOLDOWN_MS = 4000;

/**
 * 🔒 Hydrate Store from Supabase strictly for the current User ID and Phone
 * Prevents pulling all town-wide notifications and admin queues into regular user clients
 */
export async function hydrateFromDB() {
  if (!supabase) return;
  const now = Date.now();
  if (isHydrating || now - lastHydrateTimestamp < HYDRATE_COOLDOWN_MS) {
    return;
  }

  isHydrating = true;
  lastHydrateTimestamp = now;

  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Hydration Timeout')), 3500)
    );

    // 1. Fetch Listings
    const listingsFetch = supabase
      .from('listings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    const { data: listingsData } = await Promise.race([listingsFetch, timeoutPromise]);
    if (listingsData && listingsData.length > 0) {
      hyperlocalStore.hydrateBulk(listingsData);
    }

    // 2. 🛡️ User-Specific Notifications Query (Strict Identity Security)
    const activeUser = getCurrentUserProfile();
    const activeUserId = activeUser?.id && isValidUuid(activeUser.id) ? activeUser.id : null;
    const activeUserPhone = sanitizePhone(activeUser?.phone);
    const isAdminUser = Boolean(activeUser?.role === 'admin');

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
      // Unauthenticated visitor: Only true public alerts with no recipient ID or phone
      notifsQuery = notifsQuery.eq('recipient_role', 'public').is('user_id', null).is('recipient_phone', null);
    }

    const { data: notifsData } = await Promise.race([notifsQuery, timeoutPromise]).catch(() => ({ data: null }));
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

    // 3. Fetch Product Reviews
    const reviewsFetch = supabase
      .from('listing_reviews')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    const { data: reviewsData } = await Promise.race([reviewsFetch, timeoutPromise]).catch(() => ({ data: null }));
    if (reviewsData && reviewsData.length > 0) {
      hyperlocalStore.hydrateReviews(reviewsData);
    }

    // 4. Hydrate Active User's Cart
    if (activeUserPhone) {
      hyperlocalStore.loadUserCart(activeUserPhone);
    }
  } catch (err) {
    console.warn('Fast hydration notice, continuing with local store:', err.message);
  } finally {
    isHydrating = false;
  }
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
      // 🛡️ Filter Realtime Notification Broadcasts to recipient user_id / phone
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const newNotif = payload.new;
          if (!newNotif) return;

          const currentUser = getCurrentUserProfile();
          const currentUserId = currentUser?.id;
          const currentUserPhone = sanitizePhone(currentUser?.phone);
          const isAdmin = Boolean(currentUser?.role === 'admin');

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

/**
 * 🔒 Strict Role & User-ID Notification Filter Hook
 * Prevents non-admins from receiving admin review queues, and ensures
 * sellers and residents only receive notifications addressed to them.
 */
export function useRoleFilteredNotifications(currentUser, currentScreen = 'home', isAdminMode = false) {
  const [alerts, setAlerts] = useState(() => filterAlerts());

  function filterAlerts() {
    const rawNotifs = hyperlocalStore.state.notifications || [];
    const readSet = getStoredReadNotifs();

    const notifsWithRead = rawNotifs.map((n) => {
      const isRead = Boolean(n.is_read || n.read || readSet.has(String(n.id)));
      return { ...n, is_read: isRead, read: isRead };
    });

    // 🔒 GUEST VISITOR: NOT LOGGED IN
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

      // 1. 👑 ADMIN NOTIFICATIONS
      if (role === 'admin' || ADMIN_TAGS.has(n.tag)) {
        return isAdmin;
      }

      // 2. 🏪 SELLER / MERCHANT NOTIFICATIONS
      if (role === 'seller' || SELLER_TAGS.has(n.tag)) {
        if (!isSeller) return false;
        if (notifUserId && currentUserId && notifUserId === currentUserId) return true;
        if (notifPhone && userPhone && notifPhone === userPhone) return true;
        return false;
      }

      // 3. 👤 USER / RESIDENT NOTIFICATIONS
      if (role === 'user') {
        if (notifUserId && currentUserId && notifUserId === currentUserId) return true;
        if (notifPhone && userPhone && notifPhone === userPhone) return true;
        return false;
      }

      // 4. 📢 PUBLIC TOWN NOTIFICATIONS
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

/**
 * 🚀 Hook that returns ONLY Admin-Approved Paid Promotions
 */
export function usePromotedListingsSlice() {
  const [promoted, setPromoted] = useState(() =>
    hyperlocalStore.getAllListings().filter((item) => Boolean(item.is_promoted))
  );

  useEffect(() => {
    return hyperlocalStore.subscribe((_, changedKey) => {
      if (!changedKey || changedKey === 'all') {
        setPromoted(
          hyperlocalStore.getAllListings().filter((item) => Boolean(item.is_promoted))
        );
      }
    });
  }, []);

  return promoted;
}