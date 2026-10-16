import { supabase } from './supabaseClient';
import { compressMultipleImages } from '../utils/imageCompressor';
import { hyperlocalStore } from '../store/hyperlocalStore';

/**
 * Validates UUID or numeric ID format
 */
export function isValidDatabaseId(id) {
  if (!id) return false;
  const str = String(id).trim();
  return (
    /^\d+$/.test(str) ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
  );
}

/**
 * Clean 10-digit Indian mobile number helper
 */
export const sanitizePhone = (phone) => (phone ? String(phone).replace(/\D/g, '').slice(-10) : null);

/**
 * Detect generic development/dummy placeholder phone numbers
 */
export const DUMMY_PHONES = new Set([
  '9876543210',
  '9876543201',
  '9876543200',
  '1234567890',
  '9999999999',
  '0000000000',
  '1111111111',
]);

export function isPlaceholderPhone(phone) {
  if (!phone) return true;
  const clean = sanitizePhone(phone);
  if (!clean || clean.length < 10) return true;
  if (DUMMY_PHONES.has(clean)) return true;
  if (/^(\d)\1{9}$/.test(clean)) return true;
  return false;
}

/**
 * Cleans names by stripping parentheticals like (Direct Owner), (Owner), (Verified)
 */
export function cleanSellerName(name) {
  if (!name || typeof name !== 'string') return '';
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Checks if two seller or business names are compatible
 */
export function areSellerNamesCompatible(nameA, nameB) {
  const a = cleanSellerName(nameA);
  const b = cleanSellerName(nameB);
  if (!a || !b) return true;
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;

  const stopWords = new Set(['the', 'and', 'or', 'of', 'in', 'at', 'store', 'shop', 'centre', 'center', 'services', 'service', 'direct', 'owner']);
  const tokensA = a.split(' ').filter((t) => t.length > 2 && !stopWords.has(t));
  const tokensB = b.split(' ').filter((t) => t.length > 2 && !stopWords.has(t));

  if (tokensA.length === 0 || tokensB.length === 0) return false;
  return tokensA.some((t) => tokensB.includes(t));
}

/**
 * Strict Multi-Factor Seller Matcher
 */
export function isSellerMatch(item, sellerIdentifier) {
  if (!item || !sellerIdentifier) return false;

  const rawPhone = typeof sellerIdentifier === 'object'
    ? sellerIdentifier.phone || sellerIdentifier.whatsapp
    : sellerIdentifier;
  const targetPhone = sanitizePhone(rawPhone);
  const targetUserId = typeof sellerIdentifier === 'object'
    ? sellerIdentifier.userId || sellerIdentifier.user_id
    : null;
  const targetName = typeof sellerIdentifier === 'object'
    ? sellerIdentifier.sellerName || sellerIdentifier.seller_name || sellerIdentifier.businessName || sellerIdentifier.name
    : (typeof sellerIdentifier === 'string' && !targetPhone ? sellerIdentifier : null);

  const itemPhone = sanitizePhone(item.phone || item.whatsapp);
  const itemUserId = item.userId || item.user_id;
  const itemName = item.sellerName || item.seller_name || item.name;

  // 1. Authoritative UUID match when both are present
  if (targetUserId && itemUserId && isValidDatabaseId(targetUserId) && isValidDatabaseId(itemUserId)) {
    return String(targetUserId) === String(itemUserId);
  }

  const cleanTarget = cleanSellerName(targetName);
  const cleanItem = cleanSellerName(itemName);

  // 2. Exact or Strong Token Name Match
  if (cleanTarget && cleanItem) {
    if (cleanTarget === cleanItem) return true;
    if (cleanTarget.length >= 4 && cleanItem.length >= 4) {
      if (cleanTarget.includes(cleanItem) || cleanItem.includes(cleanTarget)) {
        return true;
      }
    }
    if (areSellerNamesCompatible(cleanTarget, cleanItem)) {
      if (targetPhone && itemPhone && targetPhone === itemPhone) return true;
      if (!targetPhone || !itemPhone) return true;
    }
  }

  // 3. Phone Match (Only if real non-dummy number AND names do NOT conflict)
  const isTargetDummy = isPlaceholderPhone(targetPhone);
  const isItemDummy = isPlaceholderPhone(itemPhone);

  if (!isTargetDummy && !isItemDummy && targetPhone === itemPhone) {
    if (cleanTarget && cleanItem && !areSellerNamesCompatible(cleanTarget, cleanItem)) {
      return false; // Conflicting identities (e.g. Sunil Sharma vs Amit Kumar)
    }
    return true;
  }

  return false;
}

/* ========================================================================= */
/* 🔔 1. PERSONA-AWARE NOTIFICATION DISPATCH ENGINE                          */
/* ========================================================================= */

/**
 * Universal In-App & Supabase Notification Dispatcher with User ID Mapping
 */
export async function saveNotificationToDB(notif) {
  const cleanRecipientPhone = sanitizePhone(notif.recipient_phone);
  const targetId = notif.targetId || notif.metadata?.targetId || notif.metadata?.listingId || null;
  const category = notif.category || notif.metadata?.category || null;

  // 🛡️ Validate UUID before assigning to prevent foreign key violations in Supabase
  const rawUserId = notif.user_id || notif.userId || null;
  const validUserId = isValidDatabaseId(rawUserId) ? String(rawUserId) : null;

  const notifPayload = {
    user_id: validUserId, // 🔒 Maps directly to public.user_profiles(id)
    tag: notif.tag || 'TOWN_ALERT',
    title: notif.title || 'New Notification',
    message: notif.message || '',
    recipient_role: notif.recipient_role || 'public',
    recipient_phone: cleanRecipientPhone,
    is_read: false,
    metadata: {
      targetId: targetId ? String(targetId) : null,
      listingId: targetId ? String(targetId) : null,
      category,
      audioUrl: notif.metadata?.audioUrl || notif.audioUrl || null,
      duration: notif.metadata?.duration || notif.duration || null,
      sellerPhone: sanitizePhone(notif.metadata?.sellerPhone || notif.metadata?.phone || notif.sellerPhone),
      sellerUserId: notif.metadata?.sellerUserId || validUserId || null,
      userPhone: sanitizePhone(notif.metadata?.userPhone || notif.metadata?.buyerPhone || notif.userPhone),
      userUserId: notif.metadata?.userUserId || null,
      dealBadge: notif.metadata?.dealBadge || null,
      tokenAmount: notif.metadata?.tokenAmount || null,
      ...notif.metadata,
    },
    created_at: new Date().toISOString(),
  };

  hyperlocalStore.addNotification(notifPayload);

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([notifPayload])
        .select()
        .single();

      if (error) console.warn('Save notification notice:', error.message);
      return data;
    } catch (err) {
      console.warn('Network notice saving notification:', err.message);
      return notifPayload;
    }
  }

  return notifPayload;
}

// 👑 ADMIN ALERTS DISPATCHERS
export async function notifyAdminPendingApproval({ listingId, listingTitle, sellerName, sellerPhone, category, isEdit = false, dealBadge = null, sellerUserId = null }) {
  const cleanSellerPhone = sanitizePhone(sellerPhone);
  const titleText = isEdit
    ? (dealBadge ? `Offer Proposal: "${dealBadge}" on "${listingTitle}"` : `Edit Proposal: "${listingTitle}"`)
    : `New Listing: "${listingTitle}"`;

  return saveNotificationToDB({
    user_id: null,
    tag: isEdit ? 'EDIT PROPOSAL' : 'NEW ENLISTMENT',
    title: titleText,
    message: `${sellerName || 'Merchant'} (+91 ${cleanSellerPhone || ''}) submitted ${dealBadge ? `a deal (${dealBadge})` : 'an offering'} in ${category}. Review required.`,
    targetId: listingId,
    category,
    recipient_role: 'admin',
    recipient_phone: null,
    metadata: { listingId, sellerPhone: cleanSellerPhone, sellerUserId, category, isEdit, dealBadge },
  });
}

export async function notifyAdminNewUserRegistration({ fullName, phone, activationPin, userId = null }) {
  const cleanPhone = sanitizePhone(phone);
  return saveNotificationToDB({
    user_id: null,
    tag: 'NEW_USER_PIN',
    title: `New Join: ${fullName}`,
    message: `WhatsApp PIN (${activationPin}) registered for +91 ${cleanPhone}.`,
    recipient_role: 'admin',
    recipient_phone: null,
    metadata: { phone: cleanPhone, activationPin, registrantUserId: userId },
  });
}

export async function notifyAdminReportedListing({ listingId, listingTitle, reporterPhone, reason, reporterUserId = null }) {
  const cleanReporterPhone = sanitizePhone(reporterPhone);
  return saveNotificationToDB({
    user_id: null,
    tag: 'FLAGGED_REPORT',
    title: `Listing Flagged: "${listingTitle || 'Item'}"`,
    message: `Reported by +91 ${cleanReporterPhone} for: "${reason}". Review required.`,
    targetId: listingId,
    recipient_role: 'admin',
    recipient_phone: null,
    metadata: { listingId, reporterPhone: cleanReporterPhone, reporterUserId, reason },
  });
}

// 🏪 SELLER / MERCHANT ALERTS DISPATCHERS
export async function notifySellerComment({
  sellerUserId = null,
  sellerPhone,
  listingId,
  listingTitle,
  commenterName,
  commentText,
  audioUrl = null,
  duration = null,
  commenterUserId = null,
  commenterPhone = null,
}) {
  const cleanSellerPhone = sanitizePhone(sellerPhone);
  const hasAudio = Boolean(audioUrl);
  return saveNotificationToDB({
    user_id: sellerUserId || null,
    tag: hasAudio ? 'VOICE INQUIRY' : 'NEW COMMENT',
    title: `Inquiry on "${listingTitle}"`,
    message: `${commenterName || 'A resident'} sent a ${hasAudio ? `voice note (${duration || '0:15'})` : `message: "${(commentText || '').slice(0, 70)}..."`}`,
    targetId: listingId,
    recipient_role: 'seller',
    recipient_phone: cleanSellerPhone,
    metadata: {
      listingId,
      audioUrl,
      duration,
      commenterName,
      sellerPhone: cleanSellerPhone,
      sellerUserId,
      commenterUserId,
      commenterPhone: sanitizePhone(commenterPhone),
    },
  });
}

export async function notifySellerListingStatus({
  sellerUserId = null,
  sellerPhone,
  listingId,
  listingTitle,
  isApproved,
  feedbackText = '',
  audioUrl = null,
  duration = null,
  category = null,
  dealBadge = null,
}) {
  const cleanSellerPhone = sanitizePhone(sellerPhone);
  const approvalMsg = dealBadge
    ? `Your promotional deal "${dealBadge}" on "${listingTitle}" is now verified & live across town feeds.`
    : `Your listing "${listingTitle}" is now verified and live across the town feed.`;

  return saveNotificationToDB({
    user_id: sellerUserId || null,
    tag: isApproved ? 'APPROVED' : 'ADMIN FEEDBACK',
    title: isApproved ? `Listing Verified Live: "${listingTitle}"` : `Review Action Needed: "${listingTitle}"`,
    message: isApproved ? approvalMsg : (feedbackText || `Listing could not be approved. Tap to view admin correction notes.`),
    targetId: listingId,
    category,
    recipient_role: 'seller',
    recipient_phone: cleanSellerPhone,
    metadata: {
      listingId,
      isApproved,
      audioUrl,
      duration,
      category,
      dealBadge,
      sellerPhone: cleanSellerPhone,
      sellerUserId,
    },
  });
}

export async function notifySellerInterest({
  sellerUserId = null,
  sellerPhone,
  listingId,
  listingTitle,
  newCount,
  buyerUserId = null,
}) {
  const cleanSellerPhone = sanitizePhone(sellerPhone);
  return saveNotificationToDB({
    user_id: sellerUserId || null,
    tag: 'INTEREST REGISTERED',
    title: `New Interest on "${listingTitle}"`,
    message: `A local resident saved your listing. Total saves: ${newCount} ⭐`,
    targetId: listingId,
    recipient_role: 'seller',
    recipient_phone: cleanSellerPhone,
    metadata: {
      listingId,
      newCount,
      sellerPhone: cleanSellerPhone,
      sellerUserId,
      buyerUserId,
    },
  });
}

export async function notifySellerNewReview({
  sellerUserId = null,
  sellerPhone,
  listingId,
  listingTitle,
  reviewerName,
  rating,
  hasMedia = false,
  reviewerUserId = null,
}) {
  const cleanSellerPhone = sanitizePhone(sellerPhone);
  const stars = '⭐'.repeat(Math.min(5, Math.max(1, Math.round(rating))));
  return saveNotificationToDB({
    user_id: sellerUserId || null,
    tag: 'NEW_REVIEW',
    title: `New Review (${stars}) on "${listingTitle || 'Product'}"`,
    message: `${reviewerName || 'A customer'} left a ${rating}-star rating${hasMedia ? ' with attached photos/audio' : ''}.`,
    targetId: listingId,
    recipient_role: 'seller',
    recipient_phone: cleanSellerPhone,
    metadata: {
      listingId,
      rating,
      reviewerName,
      sellerPhone: cleanSellerPhone,
      sellerUserId,
      reviewerUserId,
    },
  });
}

// 👤 RESIDENT / USER ALERTS DISPATCHERS
export async function notifyUserSellerReply({
  userUserId = null,
  userPhone,
  listingId,
  listingTitle,
  sellerName,
  replyText,
  audioUrl = null,
  duration = null,
}) {
  const cleanUserPhone = sanitizePhone(userPhone);
  const isAudio = Boolean(audioUrl);
  return saveNotificationToDB({
    user_id: userUserId || null,
    tag: 'SELLER REPLIED',
    title: `${sellerName || 'Merchant'} replied to your inquiry!`,
    message: `On "${listingTitle}": ${isAudio ? `🎤 Voice note reply (${duration || '0:15'})` : `"${(replyText || '').slice(0, 80)}..."`}`,
    targetId: listingId,
    recipient_role: 'user',
    recipient_phone: cleanUserPhone,
    metadata: {
      listingId,
      audioUrl,
      duration,
      sellerName,
      userPhone: cleanUserPhone,
      userUserId,
    },
  });
}

/* ========================================================================= */
/* 📸 2. MULTIMEDIA UPLOAD PIPELINE                                          */
/* ========================================================================= */

export async function uploadListingImagesToStorage(files = [], options = {}) {
  if (!files || files.length === 0) return [];

  const existingUrls = files.filter((f) => typeof f === 'string' && f.startsWith('http'));
  const rawFiles = files.filter((f) => f && (f instanceof File || f instanceof Blob || (f.file && f.file instanceof File)));

  if (rawFiles.length === 0) return existingUrls;

  try {
    const unnestedFiles = rawFiles.map((f) => (f.file ? f.file : f));
    let filesToUpload = unnestedFiles;

    try {
      filesToUpload = await compressMultipleImages(
        unnestedFiles,
        {
          maxWidth: options.maxWidth || 1200,
          maxHeight: options.maxHeight || 1200,
          quality: options.quality || 0.75,
        },
        options.onProgress
      );
    } catch (compressErr) {
      console.warn('Image compression skipped, uploading original files:', compressErr.message);
      filesToUpload = unnestedFiles;
    }

    if (!supabase) {
      return [...existingUrls, ...filesToUpload.map((f) => URL.createObjectURL(f))];
    }

    const uploadPromises = filesToUpload.map(async (file, idx) => {
      try {
        const fileExt = file.name ? file.name.split('.').pop() : 'webp';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${idx}.${fileExt}`;
        const filePath = `photos/${fileName}`;

        const { error } = await supabase.storage
          .from('listing-images')
          .upload(filePath, file, {
            contentType: file.type || 'image/webp',
            upsert: true,
          });

        if (error) {
          console.warn('Storage upload notice:', error.message);
          return null;
        }

        const { data: publicUrlData } = supabase.storage
          .from('listing-images')
          .getPublicUrl(filePath);

        return publicUrlData?.publicUrl || null;
      } catch (err) {
        console.warn('Image upload catch:', err.message);
        return null;
      }
    });

    const uploadedUrls = await Promise.all(uploadPromises);
    return [...existingUrls, ...uploadedUrls.filter(Boolean)];
  } catch (error) {
    console.error('Error in photo upload pipeline:', error);
    return existingUrls;
  }
}

export async function uploadListingVideosToStorage(videoItems = []) {
  if (!videoItems || videoItems.length === 0) return [];
  const uploadedVideos = [];

  for (let i = 0; i < videoItems.length; i++) {
    const item = videoItems[i];
    const file = item.file || (item instanceof File ? item : null);

    if (!file) {
      if (typeof item === 'string' && item.startsWith('http')) {
        uploadedVideos.push({ url: item, name: `Video ${i + 1}`, duration: 30 });
      } else if (item?.url && item.url.startsWith('http')) {
        uploadedVideos.push(item);
      }
      continue;
    }

    if (!supabase) {
      uploadedVideos.push({
        url: item.preview || URL.createObjectURL(file),
        name: file.name || `Video ${i + 1}`,
        duration: item.duration || 30,
      });
      continue;
    }

    try {
      const fileExt = file.name ? file.name.split('.').pop() : 'mp4';
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${i}.${fileExt}`;
      const filePath = `videos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('listing-images')
        .upload(filePath, file, {
          contentType: file.type || 'video/mp4',
          cacheControl: '31536000',
          upsert: true,
        });

      if (uploadError) {
        console.warn('Video upload notice:', uploadError.message);
        continue;
      }

      const { data: publicUrlData } = supabase.storage
        .from('listing-images')
        .getPublicUrl(filePath);

      if (publicUrlData?.publicUrl) {
        uploadedVideos.push({
          url: publicUrlData.publicUrl,
          name: file.name || `Video ${i + 1}`,
          duration: item.duration || 30,
        });
      }
    } catch (err) {
      console.warn('Video upload catch:', err.message);
    }
  }

  return uploadedVideos;
}

export async function uploadVoiceNoteToStorage(audioBlobOrFile) {
  if (!audioBlobOrFile) return null;
  if (typeof audioBlobOrFile === 'string' && audioBlobOrFile.startsWith('http')) return audioBlobOrFile;
  if (!supabase) return URL.createObjectURL(audioBlobOrFile);

  try {
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.webm`;
    const filePath = `voice-notes/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('listing-images')
      .upload(filePath, audioBlobOrFile, {
        contentType: audioBlobOrFile.type || 'audio/webm',
        cacheControl: '432000',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from('listing-images')
      .getPublicUrl(filePath);

    return publicUrlData?.publicUrl || null;
  } catch (err) {
    console.warn('Voice note upload failed, using local URL:', err.message);
    return URL.createObjectURL(audioBlobOrFile);
  }
}

/* ========================================================================= */
/* 📦 3. LISTING CRUD & PROPOSAL PIPELINE                                    */
/* ========================================================================= */

export async function submitSellerEditProposal(listingId, proposedData) {
  if (!supabase) return { success: true };
  try {
    const cleanImages = (proposedData.images || proposedData.image_urls || [])
      .filter((img) => typeof img === 'string' && img.startsWith('http'));

    const cleanVideos = (proposedData.videos || [])
      .map((v) => {
        if (typeof v === 'string' && v.startsWith('http')) return { url: v, duration: 30 };
        if (v?.url && typeof v.url === 'string' && v.url.startsWith('http')) return v;
        return null;
      })
      .filter(Boolean);

    const cleanPayload = {
      ...proposedData,
      phone: sanitizePhone(proposedData.phone),
      whatsapp: sanitizePhone(proposedData.whatsapp || proposedData.phone),
      price: proposedData.price || 'Contact for Price',
      image: cleanImages[0] || (typeof proposedData.image === 'string' && proposedData.image.startsWith('http') ? proposedData.image : getCategoryFallback(proposedData.category)),
      images: cleanImages,
      image_urls: cleanImages,
      videos: cleanVideos,
      video_urls: cleanVideos.map((v) => v.url),
    };

    if (isValidDatabaseId(listingId)) {
      const { data, error } = await supabase
        .from('listings')
        .update({
          pending_changes: cleanPayload,
          has_pending_approval: true,
          admin_feedback: null,
          seller_feedback_reply: null,
        })
        .eq('id', listingId)
        .select()
        .single();

      if (error) console.error('Submit proposal error:', error);

      await notifyAdminPendingApproval({
        listingId,
        listingTitle: proposedData.title || proposedData.name,
        sellerName: proposedData.sellerName,
        sellerPhone: proposedData.phone,
        sellerUserId: proposedData.userId || proposedData.user_id || data?.user_id || null,
        category: proposedData.category,
        isEdit: true,
      });

      return { data, error };
    } else {
      return await createListingInDB(cleanPayload);
    }
  } catch (err) {
    console.error('Submit proposal catch:', err);
    return { data: null, error: err };
  }
}

export async function createListingInDB(listingData) {
  const cleanSellerPhone = sanitizePhone(listingData.phone);
  const cleanWhatsapp = sanitizePhone(listingData.whatsapp || listingData.phone);
  const rawStock = String(listingData.stock_count || listingData.stockCount || listingData.capacity || '').replace(/\D/g, '');

  const cleanImages = (listingData.images || listingData.image_urls || []).filter(
    (img) => typeof img === 'string' && img.startsWith('http')
  );
  const cleanVideos = (listingData.videos || []).filter(
    (v) => v?.url && typeof v.url === 'string' && v.url.startsWith('http')
  );

  const rawUserId = listingData.user_id || listingData.userId || null;
  const validUserId = isValidDatabaseId(rawUserId) ? String(rawUserId) : null;

  const dbPayload = {
    title: (listingData.title || listingData.name || 'Untitled Listing').trim(),
    description: (listingData.description || '').trim(),
    category: (listingData.category || 'market').toLowerCase().trim(),
    sub_category: listingData.subCategory || listingData.sub_category || 'all',
    bucket_key: 'listings',
    price: listingData.price || 'Contact for Price',
    original_price: listingData.original_price || null,
    deal_type: listingData.deal_type || null,
    deal_badge: listingData.deal_badge || null,
    deal_details: listingData.deal_details || null,
    token_amount: listingData.token_amount || null,
    doorstep_trial: Boolean(listingData.doorstep_trial),
    seller_name: (listingData.sellerName || listingData.seller_name || 'Verified Merchant').trim(),
    phone: cleanSellerPhone || '9876543210',
    whatsapp: cleanWhatsapp || cleanSellerPhone || '9876543210',
    location_name: (listingData.location || listingData.location_name || 'Town Center').trim(),
    lat: listingData.lat !== undefined && listingData.lat !== null ? Number(listingData.lat) : null,
    lng: listingData.lng !== undefined && listingData.lng !== null ? Number(listingData.lng) : null,
    timing: listingData.timing || listingData.activeHours || '09:00 AM - 09:00 PM',
    capacity: listingData.capacity || (rawStock ? `${rawStock} Units Available` : 'Ready Stock'),
    stock_count: rawStock ? parseInt(rawStock, 10) : null,
    condition: listingData.condition || 'Brand New',
    image_url: cleanImages[0] || (typeof listingData.image === 'string' && listingData.image.startsWith('http') ? listingData.image : getCategoryFallback(listingData.category)),
    image_urls: cleanImages.length > 0 ? cleanImages : [getCategoryFallback(listingData.category)],
    video_urls: cleanVideos.map((v) => v.url),
    videos: cleanVideos,
    is_active: listingData.is_active !== undefined ? Boolean(listingData.is_active) : false,
    has_pending_approval: true,
    pending_changes: listingData,
    admin_feedback: null,
    seller_feedback_reply: null,
    interest_count: 0,
    verification_badge: '⏳ Pending Approval',
    user_id: validUserId,
    created_at: new Date().toISOString(),
  };

  if (!supabase) {
    const fallbackItem = { id: `draft-${Date.now()}`, ...dbPayload };
    await notifyAdminPendingApproval({
      listingId: fallbackItem.id,
      listingTitle: dbPayload.title,
      sellerName: dbPayload.seller_name,
      sellerPhone: dbPayload.phone,
      sellerUserId: validUserId,
      category: dbPayload.category,
      isEdit: false,
    });
    return { data: fallbackItem, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('listings')
      .insert([dbPayload])
      .select()
      .single();

    if (error) {
      console.error('Insert listing error:', error);
      return { data: null, error };
    }

    await notifyAdminPendingApproval({
      listingId: data.id,
      listingTitle: data.title,
      sellerName: data.seller_name,
      sellerPhone: data.phone,
      sellerUserId: data.user_id,
      category: data.category,
      isEdit: false,
    });

    return { data, error: null };
  } catch (err) {
    console.error('Insert listing network catch:', err);
    return { data: null, error: err };
  }
}

export async function approveListingChanges(listingId, approvedData) {
  if (!supabase || !isValidDatabaseId(listingId)) return { success: true };
  try {
    const rawStock = String(approvedData.stock_count || approvedData.stockCount || approvedData.capacity || '').replace(/\D/g, '');

    const dbPayload = {
      title: approvedData.title || approvedData.name,
      category: approvedData.category,
      sub_category: approvedData.subCategory || approvedData.sub_category || 'all',
      price: approvedData.price,
      original_price: approvedData.original_price || null,
      deal_type: approvedData.deal_type || null,
      deal_badge: approvedData.deal_badge || null,
      deal_details: approvedData.deal_details || null,
      token_amount: approvedData.token_amount || null,
      doorstep_trial: Boolean(approvedData.doorstep_trial),
      description: approvedData.description,
      location_name: approvedData.location || approvedData.location_name || 'Town Center',
      lat: approvedData.lat !== undefined && approvedData.lat !== null ? Number(approvedData.lat) : null,
      lng: approvedData.lng !== undefined && approvedData.lng !== null ? Number(approvedData.lng) : null,
      timing: approvedData.timing || approvedData.activeHours || '09:00 AM - 09:00 PM',
      capacity: approvedData.capacity || (rawStock ? `${rawStock} Units Available` : 'Ready Stock'),
      stock_count: rawStock ? parseInt(rawStock, 10) : null,
      condition: approvedData.condition || 'Brand New',
      image_url: approvedData.image || approvedData.images?.[0] || getCategoryFallback(approvedData.category),
      image_urls: approvedData.images || approvedData.image_urls || [],
      video_urls: approvedData.video_urls || (approvedData.videos || []).map((v) => (typeof v === 'string' ? v : v?.url)).filter(Boolean),
      videos: approvedData.videos || [],
      is_active: true,
      has_pending_approval: false,
      pending_changes: null,
      admin_feedback: null,
      seller_feedback_reply: null,
      verification_badge: 'Verified Listing',
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('listings')
      .update(dbPayload)
      .eq('id', listingId)
      .select()
      .single();

    if (error) throw error;

    await dismissAdminNotificationsForListing(listingId);

    const sellerUserId = approvedData.user_id || approvedData.userId || data?.user_id || null;

    await notifySellerListingStatus({
      sellerUserId: isValidDatabaseId(sellerUserId) ? String(sellerUserId) : null,
      sellerPhone: approvedData.phone || data.phone,
      listingId,
      listingTitle: approvedData.title,
      isApproved: true,
      category: approvedData.category,
      dealBadge: approvedData.deal_badge,
    });

    return { data, error: null };
  } catch (err) {
    console.error('Approve changes error:', err);
    return { data: null, error: err };
  }
}

export async function rejectListingChanges(listingId, rejectionReason = '', sellerPhone = '', sellerUserId = null) {
  if (!supabase || !isValidDatabaseId(listingId)) return { success: true };
  try {
    const reasonText = rejectionReason || 'Listing was not approved based on town guidelines. Please review and resubmit.';
    
    const { data: currentListing } = await supabase
      .from('listings')
      .select('admin_feedback, phone, title, category, user_id')
      .eq('id', listingId)
      .maybeSingle();

    let preservedFeedback = reasonText;
    if (currentListing?.admin_feedback && currentListing.admin_feedback.startsWith('{')) {
      try {
        const parsed = JSON.parse(currentListing.admin_feedback);
        preservedFeedback = JSON.stringify({ ...parsed, text: reasonText });
      } catch {}
    }

    const { data, error } = await supabase
      .from('listings')
      .update({
        pending_changes: null,
        has_pending_approval: false,
        admin_feedback: preservedFeedback,
      })
      .eq('id', listingId)
      .select()
      .single();

    if (error) throw error;

    await dismissAdminNotificationsForListing(listingId);

    const resolvedUserId = sellerUserId || currentListing?.user_id || data?.user_id || null;

    await notifySellerListingStatus({
      sellerUserId: isValidDatabaseId(resolvedUserId) ? String(resolvedUserId) : null,
      sellerPhone: sellerPhone || data?.phone,
      listingId,
      listingTitle: data?.title || 'Listing',
      isApproved: false,
      feedbackText: reasonText,
      category: data?.category,
    });

    return { data, error: null };
  } catch (err) {
    console.error('Reject changes error:', err);
    return { data: null, error: err };
  }
}

export async function dismissAdminNotificationsForListing(listingId) {
  if (!listingId) return;
  try {
    if (supabase) {
      await supabase
        .from('notifications')
        .delete()
        .eq('recipient_role', 'admin')
        .filter('metadata->>listingId', 'eq', String(listingId));
    }

    const current = hyperlocalStore.state.notifications || [];
    const filtered = current.filter(
      (n) => !(n.recipient_role === 'admin' && String(n.targetId || n.metadata?.listingId || n.metadata?.targetId) === String(listingId))
    );
    hyperlocalStore.state.notifications = filtered;
    hyperlocalStore.notify('notifications');
  } catch (err) {
    console.warn('Dismiss notification catch:', err.message);
  }
}

export async function sendAdminFeedbackToSeller(listingId, sellerPhone, feedbackPayload, sellerUserId = null) {
  if (!supabase || !listingId) return { success: true };
  try {
    const feedbackText =
      typeof feedbackPayload === 'string'
        ? feedbackPayload
        : feedbackPayload.text || 'Action needed on listing';
    const feedbackAudioUrl = feedbackPayload.audioUrl || null;
    const feedbackDuration = feedbackPayload.duration || null;

    const storedFeedback = feedbackAudioUrl
      ? JSON.stringify({ text: feedbackText, audioUrl: feedbackAudioUrl, duration: feedbackDuration })
      : feedbackText;

    if (isValidDatabaseId(listingId)) {
      await supabase
        .from('listings')
        .update({
          admin_feedback: storedFeedback,
        })
        .eq('id', listingId);
    }

    await notifySellerListingStatus({
      sellerUserId: isValidDatabaseId(sellerUserId) ? String(sellerUserId) : null,
      sellerPhone,
      listingId,
      listingTitle: 'Your Listing',
      isApproved: false,
      feedbackText,
      audioUrl: feedbackAudioUrl,
      duration: feedbackDuration,
    });

    return { success: true };
  } catch (err) {
    console.error('Send feedback error:', err);
    return { success: false, error: err.message };
  }
}

export async function sendSellerReplyToAdmin(listingId, sellerPhone, replyPayload, sellerUserId = null) {
  if (!supabase || !listingId) return { success: true };
  try {
    const cleanSellerPhone = sanitizePhone(sellerPhone);
    const replyText =
      typeof replyPayload === 'string'
        ? replyPayload
        : replyPayload.text || 'Merchant replied to feedback';
    const replyAudioUrl = replyPayload.audioUrl || null;
    const replyDuration = replyPayload.duration || null;

    const storedReply = replyAudioUrl
      ? JSON.stringify({ text: replyText, audioUrl: replyAudioUrl, duration: replyDuration })
      : replyText;

    if (isValidDatabaseId(listingId)) {
      await supabase
        .from('listings')
        .update({
          seller_feedback_reply: storedReply,
        })
        .eq('id', listingId);
    }

    await saveNotificationToDB({
      user_id: null,
      tag: replyAudioUrl ? 'SELLER VOICE REPLY' : 'SELLER FEEDBACK REPLY',
      title: `Merchant Reply (+91 ${cleanSellerPhone})`,
      message: replyText,
      targetId: listingId,
      recipient_role: 'admin',
      recipient_phone: null,
      metadata: {
        audioUrl: replyAudioUrl,
        duration: replyDuration,
        sellerPhone: cleanSellerPhone,
        sellerUserId: isValidDatabaseId(sellerUserId) ? String(sellerUserId) : null,
        targetId: listingId,
      },
    });

    return { success: true };
  } catch (err) {
    console.error('Send seller reply error:', err);
    return { success: false, error: err.message };
  }
}

/* ========================================================================= */
/* 💬 4. THREADS, COMMENTS, INTEREST & COMMUNITY REPORTS                     */
/* ========================================================================= */

export async function saveCommentToDB(listingId, comment, listingTitle = '', sellerPhone = '', sellerUserId = null) {
  if (!supabase || !listingId || !isValidDatabaseId(listingId)) return null;
  try {
    const hasAudio = Boolean(comment.audioUrl);
    const rawCommenterId = comment.userId || comment.user_id || null;
    const validCommenterId = isValidDatabaseId(rawCommenterId) ? String(rawCommenterId) : null;

    const dbPayload = {
      listing_id: String(listingId),
      user_id: validCommenterId,
      user_name: comment.userName || 'Local Resident',
      user_area: comment.userArea || 'Nearby',
      comment_text: comment.text || (hasAudio ? '🎤 Voice Note Question' : ''),
      is_public: comment.isPublic !== undefined ? comment.isPublic : true,
      audio_url: comment.audioUrl || null,
      audio_duration: comment.audioDuration || null,
      listing_title: listingTitle || 'Listing',
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('listing_threads')
      .insert([dbPayload])
      .select()
      .single();

    if (error) console.warn('Save comment notice:', error.message);

    if (sellerPhone || sellerUserId) {
      await notifySellerComment({
        sellerUserId: isValidDatabaseId(sellerUserId) ? String(sellerUserId) : null,
        sellerPhone,
        listingId,
        listingTitle,
        commenterName: dbPayload.user_name,
        commentText: dbPayload.comment_text,
        audioUrl: dbPayload.audio_url,
        duration: dbPayload.audio_duration,
        commenterUserId: validCommenterId,
        commenterPhone: comment.userPhone || null,
      });
    }

    return data;
  } catch (err) {
    console.warn('Network notice saving comment:', err.message);
    return null;
  }
}

export async function saveReplyToDB(commentId, replyObj, listingTitle = '', buyerPhone = '', buyerUserId = null) {
  if (!supabase || !commentId || !isValidDatabaseId(commentId)) return null;
  try {
    const isAudio = replyObj?.type === 'audio' || Boolean(replyObj?.audioUrl);
    const replyText = isAudio ? (replyObj.text || '🎤 Voice Note Reply') : (typeof replyObj === 'string' ? replyObj : replyObj.text);

    const updatePayload = {
      seller_reply: replyText,
      seller_replied_at: new Date().toISOString(),
    };

    if (isAudio) {
      updatePayload.seller_audio_url = replyObj.audioUrl;
      updatePayload.seller_audio_duration = replyObj.duration;
    }

    const { data, error } = await supabase
      .from('listing_threads')
      .update(updatePayload)
      .eq('id', commentId)
      .select()
      .single();

    if (error) console.warn('Save reply notice:', error.message);

    if (buyerPhone || buyerUserId) {
      await notifyUserSellerReply({
        userUserId: isValidDatabaseId(buyerUserId) ? String(buyerUserId) : null,
        userPhone: buyerPhone,
        listingId: data?.listing_id || commentId,
        listingTitle: listingTitle || data?.listing_title || 'Listing',
        sellerName: typeof replyObj === 'object' && replyObj?.sellerName ? replyObj.sellerName : 'Shopkeeper',
        replyText,
        audioUrl: updatePayload.seller_audio_url || null,
        duration: updatePayload.seller_audio_duration || null,
      });
    }

    return data;
  } catch (err) {
    console.warn('Network notice saving reply:', err.message);
    return null;
  }
}

export async function updateInterestCountInDB(listingId, newCount, listingTitle = '', sellerPhone = '', sellerUserId = null) {
  if (!supabase || !listingId || !isValidDatabaseId(listingId)) return;
  try {
    const { error } = await supabase
      .from('listings')
      .update({ interest_count: Number(newCount) })
      .eq('id', listingId);

    if (error) console.warn('Update interest notice:', error.message);

    if (sellerPhone || sellerUserId) {
      await notifySellerInterest({
        sellerUserId: isValidDatabaseId(sellerUserId) ? String(sellerUserId) : null,
        sellerPhone,
        listingId,
        listingTitle: listingTitle || 'Listing',
        newCount,
      });
    }
  } catch (err) {
    console.warn('Network notice updating interest:', err.message);
  }
}

export async function reportListing(listingId, reporterPhone, reason, listingTitle = '', reporterUserId = null) {
  if (!supabase || !isValidDatabaseId(listingId)) return { success: true };
  try {
    const cleanReporterPhone = sanitizePhone(reporterPhone) || '9876543210';
    const validReporterId = isValidDatabaseId(reporterUserId) ? String(reporterUserId) : null;

    const { data, error } = await supabase
      .from('listing_reports')
      .insert({
        listing_id: listingId,
        reporter_id: validReporterId,
        reporter_phone: cleanReporterPhone,
        reason: reason || 'Community Flag',
      });

    await notifyAdminReportedListing({
      listingId,
      listingTitle,
      reporterPhone: cleanReporterPhone,
      reporterUserId: validReporterId,
      reason,
    });

    return { data, error };
  } catch (err) {
    console.error('Report listing error:', err);
    return { data: null, error: err };
  }
}

/* ========================================================================= */
/* 🌐 5. FEED FETCHING, PUBLISHING & CASCADING REMOVAL                       */
/* ========================================================================= */

export function formatListingRow(row, selectedCity = 'Alwar') {
  if (!row) return null;

  const rowImages =
    row.image_urls && row.image_urls.length > 0
      ? row.image_urls
      : row.image_url
      ? [row.image_url]
      : [getCategoryFallback(row.category)];

  const rowVideos = Array.isArray(row.videos) ? row.videos : [];
  const rowVideoUrls = Array.isArray(row.video_urls) ? row.video_urls : [];

  return {
    id: row.id,
    userId: row.user_id || null,
    user_id: row.user_id || null,
    category: row.category,
    subCategory: row.sub_category,
    sub_category: row.sub_category,
    bucketKey: row.bucket_key || 'listings',
    bucket_key: row.bucket_key || 'listings',
    title: row.title,
    name: row.title,
    description: row.description || '',
    price: row.price || 'Contact for Price',
    originalPrice: row.original_price || null,
    original_price: row.original_price || null,
    dealType: row.deal_type || null,
    deal_type: row.deal_type || null,
    dealBadge: row.deal_badge || null,
    deal_badge: row.deal_badge || null,
    dealDetails: row.deal_details || null,
    deal_details: row.deal_details || null,
    tokenAmount: row.token_amount || null,
    token_amount: row.token_amount || null,
    doorstepTrial: Boolean(row.doorstep_trial),
    doorstep_trial: Boolean(row.doorstep_trial),
    rates: row.price || 'Contact for Price',
    startingPackage: row.price || 'Contact for Price',
    sellerName: row.seller_name,
    seller_name: row.seller_name,
    phone: row.phone,
    whatsapp: row.whatsapp || row.phone,
    location: row.location_name,
    location_name: row.location_name,
    city: row.city || selectedCity,
    lat: row.lat !== undefined && row.lat !== null ? Number(row.lat) : null,
    lng: row.lng !== undefined && row.lng !== null ? Number(row.lng) : null,
    timing: row.timing || '09:00 AM - 09:00 PM',
    activeHours: row.timing || '09:00 AM - 09:00 PM',
    capacity: row.capacity || 'Ready Stock',
    stockCount: row.stock_count || row.capacity || 'Ready Stock',
    stock_count: row.stock_count || null,
    condition: row.condition || 'Brand New',
    image: rowImages[0],
    image_url: rowImages[0],
    images: rowImages,
    image_urls: rowImages,
    videos: rowVideos,
    video_urls: rowVideoUrls.length > 0 ? rowVideoUrls : rowVideos.map((v) => (typeof v === 'string' ? v : v?.url)).filter(Boolean),
    interestCount: row.interest_count || 0,
    interest_count: row.interest_count || 0,
    rating: Number(row.rating || 5.0),
    reviewsCount: Number(row.reviews_count || 0),
    reviews_count: Number(row.reviews_count || 0),
    verificationBadge: row.verification_badge || 'Verified Listing',
    verification_badge: row.verification_badge || 'Verified Listing',
    has_pending_approval: Boolean(row.has_pending_approval),
    pending_changes: row.pending_changes || null,
    admin_feedback: row.admin_feedback || null,
    seller_feedback_reply: row.seller_feedback_reply || null,
    is_active: row.is_active !== undefined ? Boolean(row.is_active) : true,
    createdAt: row.created_at,
    created_at: row.created_at,
    updatedAt: row.updated_at,
    updated_at: row.updated_at,
  };
}

export async function fetchLiveListingsFromSupabase(selectedCity = 'Alwar') {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((row) => formatListingRow(row, selectedCity));
  } catch (err) {
    console.warn('Supabase fetch error:', err.message);
    return null;
  }
}

export async function publishHyperlocalListing(category, payload) {
  const finalCategory = (category || payload.category || 'market').toLowerCase();

  const imageUrls =
    Array.isArray(payload.images) && payload.images.length > 0
      ? payload.images
      : Array.isArray(payload.image_urls) && payload.image_urls.length > 0
      ? payload.image_urls
      : payload.image
      ? [payload.image]
      : [getCategoryFallback(finalCategory)];

  const videoObjects = Array.isArray(payload.videos) ? payload.videos : [];
  const videoUrls =
    Array.isArray(payload.video_urls) && payload.video_urls.length > 0
      ? payload.video_urls
      : videoObjects.map((v) => (typeof v === 'string' ? v : v?.url)).filter(Boolean);

  const formattedItem = {
    id: payload.id || `item_${Date.now()}`,
    ...payload,
    category: finalCategory,
    price: payload.price || 'Contact for Price',
    original_price: payload.original_price || payload.originalPrice || null,
    deal_type: payload.deal_type || payload.dealType || null,
    deal_badge: payload.deal_badge || payload.dealBadge || null,
    deal_details: payload.deal_details || payload.dealDetails || null,
    token_amount: payload.token_amount || payload.tokenAmount || null,
    doorstep_trial: Boolean(payload.doorstep_trial ?? payload.doorstepTrial),
    image: imageUrls[0],
    image_url: imageUrls[0],
    images: imageUrls,
    image_urls: imageUrls,
    videos: videoObjects,
    video_urls: videoUrls,
    timing: payload.timing || payload.activeHours || '09:00 AM - 09:00 PM',
    capacity: payload.capacity || payload.stockCount || 'Ready Stock',
    condition: payload.condition || 'Brand New',
    interestCount: 0,
    interest_count: 0,
    is_active: false,
    has_pending_approval: true,
    verification_badge: '⏳ Pending Approval',
    createdAt: new Date().toISOString(),
  };

  const { data } = await createListingInDB(formattedItem);
  hyperlocalStore.insertListing(finalCategory, data || formattedItem);
  return data || formattedItem;
}

export function getCategoryFallback(catId) {
  const fallbacks = {
    property: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=700',
    transporters: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=700',
    transport: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=700',
    vehicles: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=700',
    electronics: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=700',
    fashion: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=700',
    furniture: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=700',
    kaarigar: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=700',
    medical: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=700',
    restaurants: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=700',
    advertising: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=700',
    community: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=700',
    construction: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=700',
    creators: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=700',
    education: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=700',
    fitness: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=700',
    malls: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=700',
    market: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=700',
    shaadi: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=700',
    'white-collar': 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=700',
    recommerce: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=700',
  };
  return fallbacks[catId] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=700';
}

/**
 * 🚀 Cascade-Safe Helper: Deletes foreign key dependent child rows before deleting a listing
 */
export async function deleteListingDependenciesInDB(listingIds = []) {
  if (!supabase || !Array.isArray(listingIds)) return;
  const validUuids = listingIds.map((id) => String(id).trim()).filter(isValidDatabaseId);
  if (validUuids.length === 0) return;

  await Promise.allSettled([
    supabase.from('listing_threads').delete().in('listing_id', validUuids),
    supabase.from('listing_reports').delete().in('listing_id', validUuids),
    supabase.from('listing_interests').delete().in('listing_id', validUuids),
    supabase.from('listing_reviews').delete().in('listing_id', validUuids),
    supabase.from('user_carts').delete().in('listing_id', validUuids),
  ]);
}

async function safeDeleteByColumn(table, column, value) {
  if (!supabase || value === undefined || value === null || value === '') return;
  try {
    const { error } = await supabase.from(table).delete().eq(column, value);
    if (error) console.warn(`Note: safeDelete on ${table}.${column} returned:`, error.message);
  } catch (err) {
    console.warn(`safeDelete error on ${table}:`, err);
  }
}

export async function deleteListingFromDB(listingId) {
  if (!listingId) return { success: false, error: 'Listing ID is required.' };
  const strId = String(listingId).trim();

  if (supabase && isValidDatabaseId(strId)) {
    try {
      await Promise.allSettled([
        safeDeleteByColumn('user_carts', 'listing_id', strId),
        safeDeleteByColumn('listing_interests', 'listing_id', strId),
        safeDeleteByColumn('listing_reports', 'listing_id', strId),
        safeDeleteByColumn('listing_reviews', 'listing_id', strId),
        safeDeleteByColumn('listing_threads', 'listing_id', strId),
        dismissAdminNotificationsForListing(strId),
      ]);

      const { error: listingError } = await supabase
        .from('listings')
        .delete()
        .eq('id', strId);

      if (listingError) throw listingError;

      if (typeof hyperlocalStore?.removeListing === 'function') {
        hyperlocalStore.removeListing(strId);
      }

      return { success: true };
    } catch (err) {
      console.error('Delete listing cascade error:', err);
      return { success: false, error: err.message || 'Failed to delete listing.' };
    }
  }

  if (typeof hyperlocalStore?.removeListing === 'function') {
    hyperlocalStore.removeListing(strId);
  }
  return { success: true };
}

export async function fetchUserCartFromDB(phone) {
  if (!supabase || !phone) return [];
  const cleanPhone = sanitizePhone(phone);

  try {
    const { data, error } = await supabase
      .from('user_carts')
      .select('listing_id, quantity')
      .eq('phone', cleanPhone);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('Failed to fetch user cart from DB:', err.message);
    return [];
  }
}

export async function syncCartItemToDB(phone, listingId, quantity) {
  if (!supabase || !phone || !listingId) return null;
  const cleanPhone = sanitizePhone(phone);

  try {
    if (quantity <= 0) {
      await supabase
        .from('user_carts')
        .delete()
        .eq('phone', cleanPhone)
        .eq('listing_id', listingId);
      return { action: 'deleted' };
    }

    const { data, error } = await supabase
      .from('user_carts')
      .upsert(
        {
          phone: cleanPhone,
          listing_id: listingId,
          quantity: Number(quantity),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'phone,listing_id' }
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Failed to sync cart item to DB:', err.message);
    return null;
  }
}

export async function clearUserCartInDB(phone) {
  if (!supabase || !phone) return;
  const cleanPhone = sanitizePhone(phone);

  try {
    await supabase.from('user_carts').delete().eq('phone', cleanPhone);
  } catch (err) {
    console.warn('Failed to clear cart in DB:', err.message);
  }
}

/* ========================================================================= */
/* 🏬 6. SELLER PROFILE & STOREFRONT AGGREGATION ENGINE                      */
/* ========================================================================= */

export async function fetchSellerProfileFromDB(sellerIdentifier) {
  if (!sellerIdentifier) return null;

  const rawPhone = typeof sellerIdentifier === 'object' 
    ? (sellerIdentifier.phone || sellerIdentifier.whatsapp) 
    : sellerIdentifier;
  const cleanPhone = sanitizePhone(rawPhone);
  const isDummy = isPlaceholderPhone(cleanPhone);
  const userId = typeof sellerIdentifier === 'object' 
    ? (sellerIdentifier.userId || sellerIdentifier.user_id) 
    : null;
  const sellerName = typeof sellerIdentifier === 'object'
    ? (sellerIdentifier.sellerName || sellerIdentifier.seller_name || sellerIdentifier.businessName || sellerIdentifier.name)
    : (typeof sellerIdentifier === 'string' && !cleanPhone ? sellerIdentifier : null);
  const locationFallback = typeof sellerIdentifier === 'object' 
    ? (sellerIdentifier.locationName || sellerIdentifier.location || sellerIdentifier.areaName) 
    : 'Town Center';
  const badgeFallback = typeof sellerIdentifier === 'object' 
    ? (sellerIdentifier.verificationBadge || sellerIdentifier.verification_badge) 
    : 'Verified Merchant';

  if (supabase) {
    try {
      let profileQuery = supabase.from('user_profiles').select('*');
      if (userId && isValidDatabaseId(userId)) {
        profileQuery = profileQuery.eq('id', userId);
      } else if (cleanPhone && !isDummy) {
        profileQuery = profileQuery.eq('phone', cleanPhone);
      } else if (sellerName) {
        profileQuery = profileQuery.ilike('business_name', `%${cleanSellerName(sellerName)}%`);
      }

      const { data: profile, error: profileErr } = await profileQuery.limit(1).maybeSingle();

      if (!profileErr && profile) {
        return {
          id: profile.id,
          userId: profile.id,
          fullName: profile.full_name || sellerName || 'Merchant',
          businessName: profile.business_name || profile.full_name || sellerName || 'Local Business',
          phone: profile.phone || cleanPhone || '',
          whatsapp: profile.phone || cleanPhone || '',
          city: profile.city || 'Alwar',
          areaName: profile.area_name || locationFallback || 'Town Center',
          locationName: profile.area_name || locationFallback || 'Town Center',
          trustScore: profile.trust_score ?? 100,
          verificationTier: profile.verification_tier || 'merchant',
          isMerchant: Boolean(profile.is_merchant),
          isVerified: Boolean(profile.is_verified),
          verificationBadge: profile.custom_badge || (profile.is_verified ? 'Verified Business' : 'Unverified'),
          upiId: profile.upi_id || null,
          upiName: profile.upi_name || null,
          listingsCount: profile.listings_count || 0,
          createdAt: profile.created_at || new Date().toISOString(),
        };
      }

      let listingQuery = supabase
        .from('listings')
        .select('seller_name, phone, whatsapp, location_name, verification_badge, user_id, rating, created_at')
        .order('created_at', { ascending: false });

      if (cleanPhone && !isDummy) {
        listingQuery = listingQuery.or(`phone.eq.${cleanPhone},whatsapp.eq.${cleanPhone}`);
      } else if (userId && isValidDatabaseId(userId)) {
        listingQuery = listingQuery.eq('user_id', userId);
      } else if (sellerName) {
        listingQuery = listingQuery.ilike('seller_name', `%${cleanSellerName(sellerName)}%`);
      }

      const { data: listingMeta, error: listMetaErr } = await listingQuery.limit(1).maybeSingle();

      if (!listMetaErr && listingMeta) {
        return {
          id: listingMeta.user_id || `seller_${cleanPhone || Date.now()}`,
          userId: listingMeta.user_id || null,
          fullName: listingMeta.seller_name || sellerName || 'Merchant',
          businessName: listingMeta.seller_name || sellerName || 'Local Business',
          phone: listingMeta.phone || cleanPhone || '',
          whatsapp: listingMeta.whatsapp || listingMeta.phone || cleanPhone || '',
          city: 'Alwar',
          areaName: listingMeta.location_name || locationFallback || 'Town Center',
          locationName: listingMeta.location_name || locationFallback || 'Town Center',
          trustScore: 100,
          verificationTier: 'merchant',
          isMerchant: true,
          isVerified: true,
          verificationBadge: listingMeta.verification_badge || badgeFallback || 'Verified Business',
          upiId: null,
          upiName: null,
          listingsCount: 1,
          createdAt: listingMeta.created_at || new Date().toISOString(),
        };
      }
    } catch (err) {
      console.warn('Notice fetching seller profile:', err.message);
    }
  }

  return {
    id: userId || `seller_${cleanPhone || 'local'}`,
    userId: userId || null,
    fullName: sellerName || 'Verified Merchant',
    businessName: sellerName || 'Local Business',
    phone: cleanPhone || '9876543210',
    whatsapp: cleanPhone || '9876543210',
    city: 'Alwar',
    areaName: locationFallback || 'Town Center',
    locationName: locationFallback || 'Town Center',
    trustScore: 100,
    verificationTier: 'merchant',
    isMerchant: true,
    isVerified: true,
    verificationBadge: badgeFallback || 'Verified Storefront',
    upiId: null,
    upiName: null,
    listingsCount: 1,
    createdAt: new Date().toISOString(),
  };
}

export async function fetchSellerListingsFromDB(sellerIdentifier) {
  if (!sellerIdentifier) return [];

  const rawPhone = typeof sellerIdentifier === 'object' 
    ? (sellerIdentifier.phone || sellerIdentifier.whatsapp) 
    : sellerIdentifier;
  const cleanPhone = sanitizePhone(rawPhone);
  const isDummy = isPlaceholderPhone(cleanPhone);
  const userId = typeof sellerIdentifier === 'object' 
    ? (sellerIdentifier.userId || sellerIdentifier.user_id) 
    : null;
  const sellerName = typeof sellerIdentifier === 'object'
    ? (sellerIdentifier.sellerName || sellerIdentifier.seller_name || sellerIdentifier.businessName || sellerIdentifier.name)
    : (typeof sellerIdentifier === 'string' && !cleanPhone ? sellerIdentifier : null);

  if (supabase) {
    try {
      let query = supabase
        .from('listings')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (cleanPhone && !isDummy) {
        query = query.or(`phone.eq.${cleanPhone},whatsapp.eq.${cleanPhone}`);
      } else if (userId && isValidDatabaseId(userId)) {
        query = query.eq('user_id', userId);
      } else if (sellerName) {
        query = query.ilike('seller_name', `%${cleanSellerName(sellerName)}%`);
      }

      const { data, error } = await query;
      if (!error && Array.isArray(data) && data.length > 0) {
        const rows = data.map((row) => formatListingRow(row));
        return rows.filter((item) => isSellerMatch(item, sellerIdentifier));
      }
    } catch (err) {
      console.warn('Notice fetching seller listings from DB:', err.message);
    }
  }

  try {
    const all = typeof hyperlocalStore?.getAllListings === 'function' 
      ? hyperlocalStore.getAllListings() 
      : [];
    return all.filter((item) => isSellerMatch(item, sellerIdentifier));
  } catch (storeErr) {
    console.warn('Notice searching local store fallback for seller:', storeErr.message);
  }

  return [];
}

export const getSellerProfile = fetchSellerProfileFromDB;
export const getListingsBySeller = fetchSellerListingsFromDB;
export const normalizeListing = formatListingRow;

/**
 * Persists read status for a notification to Supabase
 */
export async function markNotificationAsReadInDB(notifId) {
  if (!supabase || !isValidDatabaseId(notifId)) return;
  try {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notifId);
  } catch (err) {
    console.warn('Notice syncing notification read state:', err.message);
  }
}

/**
 * Batch marks notifications as read in Supabase
 */
export async function markAllNotificationsAsReadInDB(notifIds = []) {
  if (!supabase || !Array.isArray(notifIds) || notifIds.length === 0) return;
  const validIds = notifIds.filter(isValidDatabaseId);
  if (validIds.length === 0) return;

  try {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', validIds);
  } catch (err) {
    console.warn('Notice batch syncing read notifications:', err.message);
  }
}

/**
 * 🚀 Admin-Only: Approve or Revoke a Listing for the Paid Promotions Section
 * Automatically handles Mock string IDs ('prop-1') and Database UUIDs with zero errors
 */
export async function adminTogglePaidPromotion(
  listingId,
  shouldPromote = true,
  durationDays = 7,
  customLabel = '🚀 Featured Sponsor'
) {
  if (!listingId) {
    return { success: false, error: 'Listing ID missing' };
  }

  const strId = String(listingId).trim();
  const expiresAt = shouldPromote
    ? new Date(Date.now() + Number(durationDays) * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const isUuid = isValidDatabaseId(strId);

  // If it's a mock listing ID (e.g. 'prop-1'), succeed immediately so local store & localStorage persist it
  if (!supabase || !isUuid) {
    return { success: true, isLocalMock: true, expiresAt };
  }

  // Schema-safe payload using columns guaranteed in public.listings
  const basePayload = {
    deal_type: shouldPromote ? 'PAID_PROMO' : null,
    deal_expires_at: expiresAt,
    verification_badge: shouldPromote ? customLabel : 'Verified Listing',
    is_active: true,
    has_pending_approval: false,
    updated_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from('listings')
      .update(basePayload)
      .eq('id', strId)
      .select()
      .maybeSingle();

    if (error) {
      console.warn('Supabase promo update notice (falling back to local persistence):', error.message);
      return { success: true, expiresAt };
    }

    return { success: true, data, expiresAt };
  } catch (err) {
    console.warn('Paid promo DB error:', err.message);
    return { success: true, expiresAt };
  }
}