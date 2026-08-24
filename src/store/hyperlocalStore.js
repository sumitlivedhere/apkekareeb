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

const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

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
  const categoryFallback = getCategoryFallback(catId);

  // 1. Image Resolution
  let allImages = [];
  if (Array.isArray(item.image_urls) && item.image_urls.length > 0) {
    allImages = item.image_urls.filter(Boolean);
  } else if (Array.isArray(item.images) && item.images.length > 0) {
    allImages = item.images.filter(Boolean);
  } else if (typeof item.image_urls === 'string' && item.image_urls.startsWith('[')) {
    try {
      allImages = JSON.parse(item.image_urls);
    } catch {}
  }

  let coverImage =
    item.image_url ||
    (allImages.length > 0 ? allImages[0] : null) ||
    item.image ||
    item.photo ||
    item.avatar ||
    categoryFallback;

  if (typeof coverImage === 'string' && coverImage.startsWith('data:image') && coverImage.length > 20000) {
    coverImage = categoryFallback;
  }

  if (allImages.length === 0 && coverImage) {
    allImages = [coverImage];
  }

  // 2. Video Resolution
  let allVideos = [];
  if (Array.isArray(item.videos) && item.videos.length > 0) {
    allVideos = item.videos;
  } else if (typeof item.videos === 'string' && item.videos.startsWith('[')) {
    try {
      allVideos = JSON.parse(item.videos);
    } catch {}
  }

  let allVideoUrls = [];
  if (Array.isArray(item.video_urls) && item.video_urls.length > 0) {
    allVideoUrls = item.video_urls.filter(Boolean);
  } else if (allVideos.length > 0) {
    allVideoUrls = allVideos.map((v) => (typeof v === 'string' ? v : v?.url)).filter(Boolean);
  } else if (typeof item.video_urls === 'string' && item.video_urls.startsWith('[')) {
    try {
      allVideoUrls = JSON.parse(item.video_urls);
    } catch {}
  }

  // 3. Price & Rates
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

  const resolvedCity =
    item.city ||
    (rawLocation.toLowerCase().includes('jaipur') ? 'Jaipur' : 'Alwar');

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
    item.bucket_key ||
    item.bucketKey ||
    categoryConfig.bucketKey ||
    'listings';

  return {
    id: String(item.id || Date.now() + Math.random()),
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
        ? `https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lng}`
        : null),
    image: coverImage,
    images: allImages.length > 0 ? allImages : [coverImage],
    image_urls: allImages.length > 0 ? allImages : [coverImage],
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
    badge: item.badge || '🟢 Verified Listing',
    experience: item.experience || '5+ Years Exp',
    timing: item.timing || '',
    qualifications: item.qualifications || '',
    regNumber: item.regNumber || '',
    capacity: item.capacity || '',
    isAvailableNow: true,
    isNew: Boolean(item.isNew),
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

  getState(key) {
    const list = this.state[key] || [];
    const seen = new Set();
    return list.filter((item) => {
      if (!item || !item.id || seen.has(String(item.id))) return false;
      seen.add(String(item.id));
      return true;
    });
  }

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
    const norm = normalizeDBListing({ ...item, id: tempId, isNew: true });
    if (!norm) return;

    const catConfig = getCategoryById(norm.category);
    const targetBucket =
      catConfig && catConfig.bucketKey && this.state[catConfig.bucketKey]
        ? catConfig.bucketKey
        : rawBucketOrCategory && this.state[rawBucketOrCategory]
        ? rawBucketOrCategory
        : norm.bucketKey && this.state[norm.bucketKey]
        ? norm.bucketKey
        : 'listings';

    const list = this.state[targetBucket] || [];
    this.state[targetBucket] = [norm, ...list];

    this.addNotification({
      tag: 'LISTING LIVE',
      title: `"${norm.title}" Published!`,
      message: `Your listing is live in ${norm.location}.`,
      time: 'Just now',
      type: 'listing',
      targetId: norm.id,
    });

    this.notify(targetBucket);
    this.notify(norm.category);
    this.notify('all');

    createListingInDB(norm)
      .then(({ data: dbRow, error }) => {
        if (!error && dbRow && dbRow.id) {
          const currentList = this.state[targetBucket] || [];
          const itemIdx = currentList.findIndex((e) => String(e.id) === String(tempId));
          if (itemIdx !== -1) {
            currentList[itemIdx] = {
              ...currentList[itemIdx],
              id: String(dbRow.id),
              isNew: false,
            };
            this.state[targetBucket] = [...currentList];
            this.notify(targetBucket);
          }
        }
      })
      .catch((err) => console.warn('Supabase insert notice:', err));
  }

  hydrateBulk(items) {
    if (!Array.isArray(items) || items.length === 0) return;
    const touchedBuckets = new Set();

    items.forEach((row) => {
      const normalized = normalizeDBListing(row);
      if (!normalized) return;

      const catConfig = getCategoryById(normalized.category);
      const bucket =
        catConfig && catConfig.bucketKey && this.state[catConfig.bucketKey]
          ? catConfig.bucketKey
          : row.bucket_key || normalized.bucketKey || 'listings';

      const list = this.state[bucket] || [];
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
      this.state[bucket] = [...list];
      touchedBuckets.add(bucket);

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
  }

  addNotification(notif) {
    const newEntry = {
      id: notif.id || Date.now() + Math.random(),
      tag: notif.tag || 'ALERT',
      title: notif.title || 'New Notification',
      message: notif.message || '',
      time: notif.time || 'Just now',
      read: false,
      type: notif.type || 'general',
      targetId: notif.targetId || null,
      subCategory: notif.subCategory || null,
    };
    this.state.notifications = [newEntry, ...(this.state.notifications || [])];
    this.notify('notifications');
  }

  markAllNotificationsRead() {
    this.state.notifications = (this.state.notifications || []).map((n) => ({
      ...n,
      read: true,
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
        }
      }
    });
  }

  addSellerReply(listingId, commentId, replyObj, listingTitle = '') {
    const strId = String(listingId);
    const hasAudio = Boolean(replyObj?.audioUrl);

    const formattedReply = {
      text: replyObj.text || (hasAudio ? '🎤 Voice Note Reply' : ''),
      type: replyObj.type || (hasAudio ? 'audio' : 'text'),
      audioUrl: replyObj.audioUrl || null,
      duration: replyObj.duration || '0:15',
      sellerName: replyObj.sellerName || 'Verified Member',
      timestamp: 'Just now',
    };

    this.state.threads[strId] = (this.state.threads[strId] || []).map((c) =>
      c.id === commentId ? { ...c, sellerReply: formattedReply } : c
    );
    this.notify(`thread:${strId}`);

    this.addNotification({
      tag: 'SELLER REPLIED',
      title: `Reply on "${listingTitle || 'Listing'}"`,
      message: `Seller replied with a ${formattedReply.type === 'audio' ? 'voice note' : 'message'}.`,
      time: 'Just now',
      type: 'reply',
      targetId: listingId,
    });

    saveReplyToDB(commentId, replyObj);
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

/**
 * ⚡ Ultra-fast Light Hydration
 */
export async function hydrateFromDB() {
  if (!supabase) return;
  try {
    const { data: listingsData, error: listingsError } = await supabase
      .from('listings')
      .select(`
        id,
        title,
        description,
        category,
        sub_category,
        bucket_key,
        price,
        seller_name,
        phone,
        whatsapp,
        location_name,
        lat,
        lng,
        image_url,
        image_urls,
        video_urls,
        videos,
        interest_count,
        is_active,
        created_at
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(60);

    if (!listingsError && listingsData && listingsData.length > 0) {
      hyperlocalStore.hydrateBulk(listingsData);
    }

    const fiveDaysAgo = new Date(Date.now() - FIVE_DAYS_MS).toISOString();
    const { data: threadsData, error: threadsError } = await supabase
      .from('listing_threads')
      .select(`
        id,
        listing_id,
        user_name,
        user_area,
        comment_text,
        audio_url,
        audio_duration,
        seller_reply,
        seller_audio_url,
        seller_audio_duration,
        is_public,
        created_at
      `)
      .gte('created_at', fiveDaysAgo)
      .order('created_at', { ascending: false })
      .limit(80);

    if (!threadsError && threadsData && threadsData.length > 0) {
      hyperlocalStore.hydrateThreads(threadsData);
    }
  } catch (err) {
    console.error('Fast hydration error:', err);
  }
}

let realtimeChannel = null;

/**
 * ⚡ Non-blocking Realtime Subscription
 */
export function initRealtimeSubscriptions() {
  if (realtimeChannel || !supabase) return;

  const startSocket = () => {
    if (realtimeChannel) return;

    realtimeChannel = supabase
      .channel('hyperlocal-realtime-sync')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'listings' },
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

// React Hooks
export function useStoreSlice(bucketKey) {
  const [data, setData] = useState(() => hyperlocalStore.getState(bucketKey));

  useEffect(() => {
    return hyperlocalStore.subscribe((newState, changedKey) => {
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
      if (!changedKey || changedKey === `thread:${listingId}`) {
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
  const [notifs, setNotifs] = useState(() => hyperlocalStore.getState('notifications'));

  useEffect(() => {
    return hyperlocalStore.subscribe((_, changedKey) => {
      if (!changedKey || changedKey === 'notifications') {
        setNotifs([...hyperlocalStore.getState('notifications')]);
      }
    });
  }, []);

  return notifs;
}