import { supabase } from './supabaseClient';
import { compressMultipleImages } from '../utils/imageCompressor';
import { hyperlocalStore } from '../store/hyperlocalStore';

export function isValidDatabaseId(id) {
  if (!id) return false;
  const str = String(id).trim();
  return (
    /^\d+$/.test(str) ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
  );
}

/* ========================================================================= */
/* 🔔 1. PERSONA-AWARE NOTIFICATION DISPATCH ENGINE                          */
/* ========================================================================= */

/**
 * Universal In-App & Supabase Notification Dispatcher
 * Persists to public.notifications & updates local in-memory store
 */
export async function saveNotificationToDB(notif) {
  const cleanPhone = notif.recipient_phone
    ? String(notif.recipient_phone).replace(/\D/g, '').slice(-10)
    : null;

  const targetId = notif.targetId || notif.metadata?.targetId || null;
  const category = notif.category || notif.metadata?.category || null;

  const notifPayload = {
    tag: notif.tag || 'TOWN_ALERT',
    title: notif.title || 'New Notification',
    message: notif.message || '',
    recipient_role: notif.recipient_role || 'public', // 'admin' | 'seller' | 'user' | 'public'
    recipient_phone: cleanPhone,
    is_read: false,
    metadata: {
      targetId: targetId ? String(targetId) : null,
      category,
      audioUrl: notif.metadata?.audioUrl || null,
      duration: notif.metadata?.duration || null,
      sellerPhone: notif.metadata?.sellerPhone || null,
      userPhone: notif.metadata?.userPhone || null,
      ...notif.metadata,
    },
    created_at: new Date().toISOString(),
  };

  // 1. Reactive in-memory push
  hyperlocalStore.addNotification(notifPayload);

  // 2. Persist to Supabase public.notifications
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
      console.warn('Network notice saving notification:', err);
      return notifPayload;
    }
  }

  return notifPayload;
}

// 👑 ADMIN ALERTS DISPATCHERS
export async function notifyAdminPendingApproval({ listingId, listingTitle, sellerName, sellerPhone, category, isEdit = false }) {
  return saveNotificationToDB({
    tag: isEdit ? 'EDIT_PROPOSAL' : 'PENDING_APPROVAL',
    title: isEdit ? `Edit Proposal: "${listingTitle}"` : `New Listing: "${listingTitle}"`,
    message: `${sellerName || 'Merchant'} (+91 ${sellerPhone || ''}) submitted a listing in ${category}. Tap to review.`,
    targetId: listingId,
    category,
    recipient_role: 'admin',
    recipient_phone: null,
    metadata: { listingId, sellerPhone, category, isEdit },
  });
}

export async function notifyAdminNewUserRegistration({ fullName, phone, activationPin }) {
  return saveNotificationToDB({
    tag: 'NEW_USER_PIN',
    title: `New Resident Join: ${fullName}`,
    message: `WhatsApp PIN (${activationPin}) pending manual 24-hour dispatch for +91 ${phone}.`,
    recipient_role: 'admin',
    recipient_phone: null,
    metadata: { phone, activationPin },
  });
}

export async function notifyAdminReportedListing({ listingId, listingTitle, reporterPhone, reason }) {
  return saveNotificationToDB({
    tag: 'FLAGGED_REPORT',
    title: `Listing Flagged: "${listingTitle || 'Item'}"`,
    message: `Reported by +91 ${reporterPhone} for: "${reason}". Review required.`,
    targetId: listingId,
    recipient_role: 'admin',
    recipient_phone: null,
    metadata: { listingId, reporterPhone, reason },
  });
}

// 🏪 SELLER / MERCHANT ALERTS DISPATCHERS
export async function notifySellerComment({ sellerPhone, listingId, listingTitle, commenterName, commentText, audioUrl = null, duration = null }) {
  const hasAudio = Boolean(audioUrl);
  return saveNotificationToDB({
    tag: hasAudio ? 'VOICE_INQUIRY' : 'USER_COMMENT',
    title: `Inquiry on "${listingTitle}"`,
    message: `${commenterName} sent a ${hasAudio ? `voice note (${duration || '0:15'})` : `message: "${commentText.slice(0, 70)}..."`}`,
    targetId: listingId,
    recipient_role: 'seller',
    recipient_phone: sellerPhone,
    metadata: { listingId, audioUrl, duration, commenterName },
  });
}

export async function notifySellerListingStatus({ sellerPhone, listingId, listingTitle, isApproved, feedbackText = '', audioUrl = null, duration = null, category = null }) {
  return saveNotificationToDB({
    tag: isApproved ? 'LISTING_APPROVED' : 'LISTING_REJECTED',
    title: isApproved ? `Listing Verified Live: "${listingTitle}"` : `Review Action Needed: "${listingTitle}"`,
    message: isApproved
      ? `Your listing is now verified and live across the town feed.`
      : feedbackText || `Listing could not be approved. Tap to view admin correction notes.`,
    targetId: listingId,
    category,
    recipient_role: 'seller',
    recipient_phone: sellerPhone,
    metadata: { listingId, isApproved, audioUrl, duration, category },
  });
}

export async function notifySellerInterest({ sellerPhone, listingId, listingTitle, newCount }) {
  return saveNotificationToDB({
    tag: 'INTEREST_ALERT',
    title: `New Interest on "${listingTitle}"`,
    message: `A resident saved your listing. Total saves: ${newCount} ⭐`,
    targetId: listingId,
    recipient_role: 'seller',
    recipient_phone: sellerPhone,
    metadata: { listingId, newCount },
  });
}

// 👤 RESIDENT / USER ALERTS DISPATCHERS
export async function notifyUserSellerReply({ userPhone, listingId, listingTitle, sellerName, replyText, audioUrl = null, duration = null }) {
  const isAudio = Boolean(audioUrl);
  return saveNotificationToDB({
    tag: 'SELLER_REPLY',
    title: `${sellerName || 'Merchant'} replied to your inquiry!`,
    message: `On "${listingTitle}": ${isAudio ? `🎤 Voice note reply (${duration || '0:15'})` : `"${replyText.slice(0, 80)}..."`}`,
    targetId: listingId,
    recipient_role: 'user',
    recipient_phone: userPhone,
    metadata: { listingId, audioUrl, duration, sellerName },
  });
}

export async function notifyUserDealUpdate({ userPhone, listingId, listingTitle, message, category }) {
  return saveNotificationToDB({
    tag: 'DEAL_UPDATE',
    title: `Price / Stock Update: "${listingTitle}"`,
    message: message || `An item you saved has updated pricing or availability.`,
    targetId: listingId,
    category,
    recipient_role: 'user',
    recipient_phone: userPhone,
    metadata: { listingId, category },
  });
}

/* ========================================================================= */
/* 📸 2. MULTIMEDIA UPLOAD PIPELINE (PHOTOS, VIDEOS, AUDIO)                  */
/* ========================================================================= */

/**
 * Upload Photos directly to Supabase Storage ('listing-images' bucket)
 */
export async function uploadListingImagesToStorage(files = [], options = {}) {
  if (!files || files.length === 0) return [];

  const existingUrls = files.filter((f) => typeof f === 'string' && f.startsWith('http'));
  const rawFiles = files.filter((f) => f && (f instanceof File || f instanceof Blob));

  if (rawFiles.length === 0) return existingUrls;

  try {
    let filesToUpload = rawFiles;
    try {
      filesToUpload = await compressMultipleImages(
        rawFiles,
        {
          maxWidth: options.maxWidth || 1200,
          maxHeight: options.maxHeight || 1200,
          quality: options.quality || 0.75,
        },
        options.onProgress
      );
    } catch (compressErr) {
      console.warn('Compression skipped, using raw files:', compressErr);
      filesToUpload = rawFiles;
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
        console.warn('Image upload catch:', err);
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

/**
 * Upload Videos directly to Supabase Storage ('listing-images' bucket under /videos/)
 */
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
      console.warn('Video upload error:', err);
    }
  }

  return uploadedVideos;
}

/**
 * Upload Voice Note to Supabase Storage ('listing-images' bucket under /voice-notes/)
 */
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
    console.warn('Voice note upload failed:', err);
    return URL.createObjectURL(audioBlobOrFile);
  }
}

/* ========================================================================= */
/* 📦 3. LISTING CRUD & PROPOSAL PIPELINE                                    */
/* ========================================================================= */

/**
 * Submit Seller Edit Proposal (Keeps live item active while storing diff in pending_changes)
 */
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

      // Alert Admin of Pending Edit Proposal
      await notifyAdminPendingApproval({
        listingId,
        listingTitle: proposedData.title || proposedData.name,
        sellerName: proposedData.sellerName,
        sellerPhone: proposedData.phone,
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

/**
 * Create New Listing Draft (Hidden from feed until approved by Admin)
 */
export async function createListingInDB(listingData) {
  const rawStock = String(listingData.stockCount || listingData.capacity || '').replace(/\D/g, '');
  const cleanImages = (listingData.images || listingData.image_urls || []).filter(
    (img) => typeof img === 'string' && img.startsWith('http')
  );
  const cleanVideos = (listingData.videos || []).filter(
    (v) => v?.url && typeof v.url === 'string' && v.url.startsWith('http')
  );

  const dbPayload = {
    title: listingData.title || listingData.name,
    description: listingData.description || '',
    category: listingData.category,
    sub_category: listingData.subCategory || listingData.sub_category || 'all',
    bucket_key: 'listings',
    price: listingData.price || 'Contact for Price',
    seller_name: listingData.sellerName || 'Verified Merchant',
    phone: listingData.phone || '',
    whatsapp: listingData.whatsapp || '',
    location_name: listingData.location || 'Alwar',
    lat: listingData.lat !== undefined && listingData.lat !== null ? Number(listingData.lat) : null,
    lng: listingData.lng !== undefined && listingData.lng !== null ? Number(listingData.lng) : null,
    timing: listingData.timing || listingData.activeHours || '09:00 AM - 09:00 PM',
    capacity: listingData.capacity || (rawStock ? `${rawStock} Units Available` : 'Ready Stock'),
    stock_count: rawStock ? parseInt(rawStock, 10) : null,
    image_url: cleanImages[0] || getCategoryFallback(listingData.category),
    image_urls: cleanImages,
    video_urls: cleanVideos.map((v) => v.url),
    videos: cleanVideos,
    is_active: false,
    has_pending_approval: true,
    pending_changes: listingData,
    admin_feedback: null,
    seller_feedback_reply: null,
    interest_count: 0,
    verification_badge: 'Pending Verification',
    created_at: new Date().toISOString(),
  };

  if (!supabase) {
    const fallbackItem = { id: `draft-${Date.now()}`, ...dbPayload };
    await notifyAdminPendingApproval({
      listingId: fallbackItem.id,
      listingTitle: dbPayload.title,
      sellerName: dbPayload.seller_name,
      sellerPhone: dbPayload.phone,
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

    // Alert Admin of New Listing Draft
    await notifyAdminPendingApproval({
      listingId: data.id,
      listingTitle: data.title,
      sellerName: data.seller_name,
      sellerPhone: data.phone,
      category: data.category,
      isEdit: false,
    });

    return { data, error: null };
  } catch (err) {
    console.error('Insert listing network catch:', err);
    return { data: null, error: err };
  }
}

/**
 * Admin Approves Changes (Sets is_active: true & notifies seller)
 */
export async function approveListingChanges(listingId, approvedData) {
  if (!supabase || !isValidDatabaseId(listingId)) return { success: true };
  try {
    const rawStock = String(approvedData.stockCount || approvedData.capacity || '').replace(/\D/g, '');

    const dbPayload = {
      title: approvedData.title,
      category: approvedData.category,
      sub_category: approvedData.subCategory || approvedData.sub_category || 'all',
      price: approvedData.price,
      description: approvedData.description,
      location_name: approvedData.location || approvedData.location_name || 'Alwar',
      lat: approvedData.lat !== undefined && approvedData.lat !== null ? Number(approvedData.lat) : null,
      lng: approvedData.lng !== undefined && approvedData.lng !== null ? Number(approvedData.lng) : null,
      timing: approvedData.timing || approvedData.activeHours || '09:00 AM - 09:00 PM',
      capacity: approvedData.capacity || (rawStock ? `${rawStock} Units Available` : 'Ready Stock'),
      stock_count: rawStock ? parseInt(rawStock, 10) : null,
      image_url: approvedData.image || approvedData.images?.[0] || getCategoryFallback(approvedData.category),
      image_urls: approvedData.images || approvedData.image_urls || [],
      video_urls: approvedData.video_urls || (approvedData.videos || []).map((v) => v.url),
      videos: approvedData.videos || [],
      is_active: true,
      has_pending_approval: false,
      pending_changes: null,
      admin_feedback: null,
      seller_feedback_reply: null,
      verification_badge: 'Verified Merchant',
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

    // Notify Merchant of Approval
    await notifySellerListingStatus({
      sellerPhone: approvedData.phone || data.phone,
      listingId,
      listingTitle: approvedData.title,
      isApproved: true,
      category: approvedData.category,
    });

    return { data, error: null };
  } catch (err) {
    console.error('Approve changes error:', err);
    return { data: null, error: err };
  }
}

/**
 * Admin Rejects Changes with Feedback Reason
 */
export async function rejectListingChanges(listingId, rejectionReason = '', sellerPhone = '') {
  if (!supabase || !isValidDatabaseId(listingId)) return { success: true };
  try {
    const reasonText = rejectionReason || 'Listing was not approved based on guidelines. Please review and resubmit.';
    const { data, error } = await supabase
      .from('listings')
      .update({
        pending_changes: null,
        has_pending_approval: false,
        admin_feedback: reasonText,
      })
      .eq('id', listingId)
      .select()
      .single();

    if (error) throw error;

    await dismissAdminNotificationsForListing(listingId);

    // Notify Merchant of Rejection / Action Needed
    await notifySellerListingStatus({
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

/**
 * Dismiss ONLY Admin Pending Review Notifications for a Listing (Preserves Seller Alerts)
 */
export async function dismissAdminNotificationsForListing(listingId) {
  if (!listingId) return;
  try {
    if (supabase) {
      await supabase
        .from('notifications')
        .delete()
        .eq('recipient_role', 'admin')
        .filter('metadata->>targetId', 'eq', String(listingId));
    }

    // Filter in-memory store so ONLY admin notifications are dismissed
    const current = hyperlocalStore.getNotifications() || [];
    const filtered = current.filter(
      (n) => !(n.recipient_role === 'admin' && String(n.targetId || n.metadata?.targetId) === String(listingId))
    );
    hyperlocalStore.setNotifications(filtered);
  } catch (err) {
    console.warn('Dismiss notification catch:', err);
  }
}

/**
 * Admin Sends Direct Feedback Note (Text or Voice) to Seller
 */
export async function sendAdminFeedbackToSeller(listingId, sellerPhone, feedbackPayload) {
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

/**
 * Seller Replies Back to Admin (Text or Voice)
 */
export async function sendSellerReplyToAdmin(listingId, sellerPhone, replyPayload) {
  if (!supabase || !listingId) return { success: true };
  try {
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
      tag: replyAudioUrl ? 'SELLER_VOICE_REPLY' : 'SELLER_FEEDBACK_REPLY',
      title: `Merchant Reply (+91 ${sellerPhone})`,
      message: replyText,
      targetId: listingId,
      recipient_role: 'admin',
      recipient_phone: null,
      metadata: {
        audioUrl: replyAudioUrl,
        duration: replyDuration,
        sellerPhone,
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

/**
 * Save Buyer Comment / Voice Note to DB & Alert Merchant
 */
export async function saveCommentToDB(listingId, comment, listingTitle = '', sellerPhone = '') {
  if (!supabase || !listingId || !isValidDatabaseId(listingId)) return null;
  try {
    const hasAudio = Boolean(comment.audioUrl);
    const dbPayload = {
      listing_id: String(listingId),
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

    // Notify Merchant of Inquiry
    if (sellerPhone) {
      await notifySellerComment({
        sellerPhone,
        listingId,
        listingTitle,
        commenterName: dbPayload.user_name,
        commentText: dbPayload.comment_text,
        audioUrl: dbPayload.audio_url,
        duration: dbPayload.audio_duration,
      });
    }

    return data;
  } catch (err) {
    console.warn('Network notice saving comment:', err);
    return null;
  }
}

/**
 * Save Seller Reply to DB & Alert Resident
 */
export async function saveReplyToDB(commentId, replyObj, listingTitle = '', buyerPhone = '') {
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

    // Notify Resident of Merchant Answer
    if (buyerPhone) {
      await notifyUserSellerReply({
        userPhone: buyerPhone,
        listingId: data?.listing_id || commentId,
        listingTitle: listingTitle || data?.listing_title || 'Listing',
        sellerName: 'Shopkeeper',
        replyText,
        audioUrl: updatePayload.seller_audio_url || null,
        duration: updatePayload.seller_audio_duration || null,
      });
    }

    return data;
  } catch (err) {
    console.warn('Network notice saving reply:', err);
    return null;
  }
}

/**
 * Update Interest Counter & Alert Seller
 */
export async function updateInterestCountInDB(listingId, newCount, listingTitle = '', sellerPhone = '') {
  if (!supabase || !listingId || !isValidDatabaseId(listingId)) return;
  try {
    const { error } = await supabase
      .from('listings')
      .update({ interest_count: Number(newCount) })
      .eq('id', listingId);

    if (error) console.warn('Update interest notice:', error.message);

    if (sellerPhone) {
      await notifySellerInterest({
        sellerPhone,
        listingId,
        listingTitle: listingTitle || 'Listing',
        newCount,
      });
    }
  } catch (err) {
    console.warn('Network notice updating interest:', err);
  }
}

/**
 * Report a Listing & Alert Admin
 */
export async function reportListing(listingId, reporterPhone, reason, listingTitle = '') {
  if (!supabase || !isValidDatabaseId(listingId)) return { success: true };
  try {
    const { data, error } = await supabase
      .from('listing_reports')
      .insert({
        listing_id: listingId,
        reporter_phone: reporterPhone,
        reason: reason,
      });

    // Alert Master Admin of Community Report
    await notifyAdminReportedListing({
      listingId,
      listingTitle,
      reporterPhone,
      reason,
    });

    return { data, error };
  } catch (err) {
    console.error('Report listing error:', err);
    return { data: null, error: err };
  }
}

/* ========================================================================= */
/* 🌐 5. FEED FETCHING, PUBLISHING & REMOVAL                                  */
/* ========================================================================= */

/**
 * Fetch Live Listings (Active Approved Listings for Public Feed)
 */
export async function fetchLiveListingsFromSupabase(selectedCity = 'Alwar') {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((row) => {
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
        category: row.category,
        subCategory: row.sub_category,
        bucketKey: row.bucket_key,
        title: row.title,
        name: row.title,
        description: row.description,
        price: row.price,
        rates: row.price,
        startingPackage: row.price,
        sellerName: row.seller_name,
        phone: row.phone,
        whatsapp: row.whatsapp,
        location: row.location_name,
        city: selectedCity,
        lat: row.lat,
        lng: row.lng,
        timing: row.timing || '09:00 AM - 09:00 PM',
        activeHours: row.timing || '09:00 AM - 09:00 PM',
        capacity: row.capacity || 'Ready Stock',
        stockCount: row.capacity || 'Ready Stock',
        image: rowImages[0],
        images: rowImages,
        image_urls: rowImages,
        videos: rowVideos,
        video_urls: rowVideoUrls.length > 0 ? rowVideoUrls : rowVideos.map((v) => (typeof v === 'string' ? v : v?.url)).filter(Boolean),
        interestCount: row.interest_count || 0,
        interest_count: row.interest_count || 0,
        has_pending_approval: row.has_pending_approval || false,
        pending_changes: row.pending_changes || null,
        admin_feedback: row.admin_feedback || null,
        seller_feedback_reply: row.seller_feedback_reply || null,
        is_active: row.is_active,
        createdAt: row.created_at,
      };
    });
  } catch (err) {
    console.warn('Supabase fetch error:', err);
    return null;
  }
}

/**
 * Universal Listing Publisher
 */
export async function publishHyperlocalListing(category, payload) {
  const finalCategory = (category || payload.category || 'property').toLowerCase();

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
    image: imageUrls[0],
    images: imageUrls,
    image_urls: imageUrls,
    videos: videoObjects,
    video_urls: videoUrls,
    timing: payload.timing || payload.activeHours || '09:00 AM - 09:00 PM',
    capacity: payload.capacity || payload.stockCount || 'Ready Stock',
    interestCount: Number(payload.interestCount || payload.interest_count || 0),
    interest_count: Number(payload.interestCount || payload.interest_count || 0),
    status: 'ACTIVE',
    createdAt: 'Just now',
  };

  await createListingInDB(formattedItem);

  const sliceMap = {
    property: 'propertyListings',
    advertising: 'advertisingProviders',
    community: 'communityDrives',
    construction: 'constructionListings',
    creators: 'creatorsListings',
    education: 'educationListings',
    fitness: 'fitnessListings',
    malls: 'mallsStores',
    market: 'marketProducts',
    medical: 'medicalListings',
    restaurants: 'restaurantsList',
    shaadi: 'shaadiVendors',
    'white-collar': 'whiteCollarListings',
    recommerce: 'reCommerceListings',
    transport: 'transportFirms',
    transporters: 'transportFirms',
    vehicles: 'vehiclesListings',
  };

  const targetSlice = sliceMap[finalCategory] || 'propertyListings';
  if (hyperlocalStore && typeof hyperlocalStore.addListing === 'function') {
    hyperlocalStore.addListing(targetSlice, formattedItem);
  }

  return formattedItem;
}

/**
 * Category Fallback Image URLs
 */
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
 * Delete Listing & Associated Threads/Notifications from DB
 */
export async function deleteListingFromDB(listingId) {
  if (!supabase || !listingId) return { success: false };

  try {
    await supabase.from('listing_threads').delete().eq('listing_id', listingId);
    await supabase.from('notifications').delete().filter('metadata->>targetId', 'eq', String(listingId));
    const { error } = await supabase.from('listings').delete().eq('id', listingId);
    if (error) throw error;

    return { success: true };
  } catch (err) {
    console.error('Delete listing error:', err);
    return { success: false, error: err.message };
  }
}