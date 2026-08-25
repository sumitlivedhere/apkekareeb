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
  createListingInDB,
  saveCommentToDB,
  saveReplyToDB,
  updateInterestCountInDB,
} from '../services/listingService';
import { getCategoryById, sanitizeSubCategoryId } from '../data/taxonomyRegistry';
import { getCurrentUserProfile, isAdminAuthorized } from '../services/authService';

const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

// Bidirectional category-to-slice mapping
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

/**
 * Sanitizes any raw image URL, fixing relative Unsplash IDs and filtering expired blob URLs
 */
export function sanitizeImageUrl(url, category = 'property') {
  if (!url || typeof url !== 'string') return getCategoryFallback(category);
  const clean = url.trim();

  // Filter out dead blob URLs
  if (clean.startsWith('blob:')) {
    return getCategoryFallback(category);
  }

  // Prepend domain to bare Unsplash photo IDs
  if (clean.startsWith('photo-')) {
    return `https://images.unsplash.com/${clean}`;
  }

  if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:image')) {
    return clean;
  }

  return getCategoryFallback(category);
}

/**
 * Normalizes DB rows, mock data, and custom user listings into a single uniform schema
 */
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
  const subCatId = sanitizeSubCategoryId(catId, rawSub);

  // 1. Image Resolution with Sanitization
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

  // 2. Video Resolution
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

  // 3. Price & Operational Metadata
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

  // 4. Verification & Approval State
  const isActive = item.is_active !== undefined ? Boolean(item.is_active) : true;
  const hasPendingApproval = Boolean(item.has_pending_approval);
  const pendingChanges = item.pending_changes || null;

  return {
    id: String(item.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`),
    title: nameVal,
    name: nameVal,
    category: catId,
    subCategory: subCatId,
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
    visitingCharge: priceVal,
    consultationFee: priceVal,
    priceForTwo: priceVal,
    startingPackage: priceVal,
    sellerName: personOrBiz,
    driverName: personOrBiz,
    trainerName: personOrBiz,
    providerName: personOrBiz,
    doctorName: personOrBiz,
    phone: item.phone || '9876543201',
    whatsapp: item.whatsapp || item.phone || '9876543201',
    city: resolvedCity,
    location: rawLocation,
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
    images: sanitizedImages,
    image_urls: sanitizedImages,
    videos: allVideos,
    video_urls: allVideoUrls,
    photo: coverImage,
    avatar: coverImage,
    description: item.description || '',
    condition: item.condition || 'Good',
    interestCount: Number(
      item.interest_count !== undefined
        ? item.interest_count
        : item.interestCount || 0
    ),
    rating: item.rating || 5.0,
    verified: item.verified !== undefined ? item.verified : true,
    badge: item.badge || (hasPendingApproval ? '⏳ Pending Approval' : '🟢 Verified Listing'),
    experience: item.experience || '5+ Years Exp',
    timing: item.timing || item.activeHours || '09:00 AM - 09:00 PM',
    activeHours: item.timing || item.activeHours || '09:00 AM - 09:00 PM',
    capacity: item.capacity || item.stockCount || 'Ready Stock',
    stockCount: item.capacity || item.stockCount || 'Ready Stock',
    qualifications: item.qualifications || '',
    regNumber: item.regNumber || '',
    is_active: isActive,
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
      notifications: [],
    };
    this.listeners = new Set();
  }

  // 🛡️ Public Feed: ONLY returns approved active items
  getState(key) {
    if (key === 'notifications') {
      return this.state.notifications || [];
    }
    const list = this.state[key] || [];
    const seen = new Set();
    return list.filter((item) => {
      if (!item || !item.id || seen.has(String(item.id))) return false;
      if (item.is_active === false) return false;
      seen.add(String(item.id));
      return true;
    });
  }

  // 👑 Master Feed: Returns all items for Admin & Merchant Hub
  getAllListings() {
    const buckets = Object.values(this.state).filter(Array.isArray);
    const seenIds = new Set();
    const combined = [];

    buckets.forEach((bucket) => {
      bucket.forEach((item) => {
        if (item && item.id && !seenIds.has(String(item.id))) {
          seenIds.add(String(item.id));
          combined.push(item);
        }
      });
    });

    return combined;
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

  addNotification(notif) {
    const newEntry = {
      id: notif.id || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tag: notif.tag || 'ALERT',
      title: notif.title || 'New Notification',
      message: notif.message || '',
      time: notif.time || 'Just now',
      read: false,
      is_read: false,
      type: notif.type || 'general',
      targetId: notif.targetId || notif.metadata?.targetId || null,
      recipient_role: notif.recipient_role || 'public',
      recipient_phone: notif.recipient_phone || null,
      metadata: notif.metadata || {},
      created_at: notif.created_at || new Date().toISOString(),
    };
    this.state.notifications = [newEntry, ...(this.state.notifications || [])];
    this.notify('notifications');
  }

  removeNotificationsForTarget(listingId) {
    const targetStr = String(listingId);
    this.state.notifications = (this.state.notifications || []).filter(
      (n) => String(n.targetId) !== targetStr && String(n.metadata?.targetId) !== targetStr
    );
    this.notify('notifications');
  }

  markAllNotificationsRead() {
    this.state.notifications = (this.state.notifications || []).map((n) => ({
      ...n,
      read: true,
      is_read: true,
    }));
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

    this.addNotification({
      tag: hasAudio ? 'VOICE INQUIRY' : 'NEW COMMENT',
      title: `Inquiry on "${listingTitle || 'Listing'}"`,
      message: `${newEntry.userName} sent a ${hasAudio ? 'voice note' : 'message'}.`,
      time: 'Just now',
      type: 'comment',
      targetId: listingId,
    });

    saveCommentToDB(strId, newEntry, listingTitle).then((dbRow) => {
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

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      String(commentId).trim()
    );

    if (supabase && isUuid) {
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

  getInterestCount(listingId, defaultCount = 0) {
    const strId = String(listingId);
    return this.state.interests[strId] !== undefined
      ? this.state.interests[strId]
      : defaultCount;
  }

  incrementInterest(listingId, defaultCount = 0, listingTitle = '', sellerName = '') {
    const strId = String(listingId);
    const count = this.getInterestCount(listingId, defaultCount) + 1;
    this.state.interests[strId] = count;
    this.notify(`interest:${strId}`);

    this.addNotification({
      tag: 'INTEREST REGISTERED',
      title: `You expressed interest in "${listingTitle || 'Listing'}"`,
      message: `${sellerName || 'The seller'} was notified. Total buyers interested: ${count}`,
      time: 'Just now',
      type: 'interest',
      targetId: listingId,
    });

    updateInterestCountInDB(listingId, count);
    return count;
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

let isHydrating = false;
let lastHydrateTimestamp = 0;
const HYDRATE_COOLDOWN_MS = 6000;

/**
 * Hydrate Store from Supabase with Connection Throttling & Fast Timeouts
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
      setTimeout(() => reject(new Error('Hydration Timeout')), 3000)
    );

    // 1. Fetch Listings
    const listingsFetch = supabase
      .from('listings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(60);

    const { data: listingsData } = await Promise.race([listingsFetch, timeoutPromise]);
    if (listingsData && listingsData.length > 0) {
      hyperlocalStore.hydrateBulk(listingsData);
    }

    // 2. Fetch Notifications
    const notifsFetch = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(25);

    const { data: notifsData } = await Promise.race([notifsFetch, timeoutPromise]);
    if (notifsData) {
      hyperlocalStore.state.notifications = notifsData.map((n) => ({
        id: n.id,
        tag: n.tag,
        title: n.title,
        message: n.message,
        read: n.is_read,
        recipient_role: n.recipient_role,
        recipient_phone: n.recipient_phone,
        targetId: n.metadata?.targetId || null,
        metadata: n.metadata || {},
        created_at: n.created_at,
      }));
      hyperlocalStore.notify('notifications');
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
          if (payload.new) {
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
      if (!changedKey || changedKey === `interest:${listingId}`) {
        setCount(hyperlocalStore.getInterestCount(listingId, defaultCount));
      }
    });
  }, [listingId, defaultCount]);

  return count;
}

export function useNotificationSlice() {
  const [filteredNotifs, setFilteredNotifs] = useState(() => getScopedNotifications());

  function getScopedNotifications() {
    const rawNotifs = hyperlocalStore.getState('notifications') || [];
    const profile = getCurrentUserProfile();
    const isAdmin = isAdminAuthorized();
    const userPhone = profile?.phone ? String(profile.phone).replace(/\D/g, '').slice(-10) : null;

    return rawNotifs.filter((n) => {
      // 1. Admin mode -> show moderation & merchant reply notifications
      if (isAdmin) {
        if (
          n.recipient_role === 'admin' ||
          n.tag === 'NEW ENLISTMENT' ||
          n.tag === 'EDIT PROPOSAL' ||
          n.tag === 'REPORT' ||
          n.tag === 'SELLER FEEDBACK REPLY' ||
          n.tag === 'SELLER VOICE REPLY'
        ) {
          return true;
        }
      }

      // 2. Merchant / Resident logged in
      if (userPhone) {
        const notifPhone = n.recipient_phone ? String(n.recipient_phone).replace(/\D/g, '').slice(-10) : null;
        const metaPhone = n.metadata?.sellerPhone || n.metadata?.seller_phone || n.metadata?.phone || n.metadata?.recipient_phone;
        const cleanMetaPhone = metaPhone ? String(metaPhone).replace(/\D/g, '').slice(-10) : null;

        if (notifPhone === userPhone || cleanMetaPhone === userPhone) {
          return true;
        }
        if (n.recipient_role === 'seller' && (notifPhone === userPhone || cleanMetaPhone === userPhone)) {
          return true;
        }
      }

      // 3. Public general notifications
      if (
        n.recipient_role === 'public' &&
        !['NEW ENLISTMENT', 'EDIT PROPOSAL', 'REPORT', 'ADMIN FEEDBACK', 'ADMIN VOICE NOTE', 'SELLER FEEDBACK REPLY', 'SELLER VOICE REPLY'].includes(n.tag)
      ) {
        return true;
      }

      return false;
    });
  }

  useEffect(() => {
    return hyperlocalStore.subscribe((_, changedKey) => {
      if (!changedKey || changedKey === 'notifications') {
        setFilteredNotifs(getScopedNotifications());
      }
    });
  }, []);

  return filteredNotifs;
}