import { supabase } from './supabaseClient';
import { getCategoryById } from '../data/taxonomyRegistry';
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

/**
 * 1. Upload Photos directly to Supabase Storage ('listing-images' bucket)
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
 * 2. Upload Videos directly to Supabase Storage ('listing-images' bucket under /videos/)
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
 * 3. Upload Voice Note to Supabase Storage ('listing-images' bucket under /voice-notes/)
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

/**
 * 4. Submit Seller Edit Proposal (Strips Base64, keeps live item active while storing diff in pending_changes)
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
 * 5. Create New Listing Draft (is_active: false -> HIDDEN from town feed until Admin approves)
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
    return { data: { id: `draft-${Date.now()}`, ...dbPayload }, error: null };
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

    return { data, error: null };
  } catch (err) {
    console.error('Insert listing network catch:', err);
    return { data: null, error: err };
  }
}

/**
 * 6. Admin Approves Changes (Sets is_active: true & Clears Pending Flags & Feedback & Dismisses Admin Notifications)
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

    return { data, error: null };
  } catch (err) {
    console.error('Approve changes error:', err);
    return { data: null, error: err };
  }
}

/**
 * 7. Admin Rejects Changes with Optional Feedback Reason
 */
export async function rejectListingChanges(listingId, rejectionReason = '') {
  if (!supabase || !isValidDatabaseId(listingId)) return { success: true };
  try {
    const { data, error } = await supabase
      .from('listings')
      .update({
        pending_changes: null,
        has_pending_approval: false,
        admin_feedback: rejectionReason || 'Listing was not approved. Please review guidelines and resubmit.',
      })
      .eq('id', listingId);

    if (error) throw error;

    await dismissAdminNotificationsForListing(listingId);

    return { data, error: null };
  } catch (err) {
    console.error('Reject changes error:', err);
    return { data: null, error: err };
  }
}

/**
 * 8. Dismiss Admin Pending Review Notifications from Database & Local Store
 */
export async function dismissAdminNotificationsForListing(listingId) {
  if (!listingId) return;
  try {
    if (supabase) {
      await supabase
        .from('notifications')
        .delete()
        .or('recipient_role.eq.admin,tag.eq.NEW ENLISTMENT,tag.eq.EDIT PROPOSAL,tag.eq.SELLER FEEDBACK REPLY,tag.eq.SELLER VOICE REPLY')
        .filter('metadata->>targetId', 'eq', String(listingId));
    }

    hyperlocalStore.removeNotificationsForTarget(listingId);
  } catch (err) {
    console.warn('Dismiss notification catch:', err);
  }
}

/**
 * 9. Admin Sends Direct Issue/Feedback Note (Text or Voice Note) to Seller
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

    await saveNotificationToDB({
      tag: feedbackAudioUrl ? 'ADMIN VOICE NOTE' : 'ADMIN FEEDBACK',
      title: 'Action Needed on Your Listing',
      message: feedbackText,
      targetId: listingId,
      recipient_role: 'seller',
      recipient_phone: sellerPhone,
      metadata: {
        audioUrl: feedbackAudioUrl,
        duration: feedbackDuration,
        targetId: listingId,
      },
    });

    return { success: true };
  } catch (err) {
    console.error('Send feedback error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * 10. Seller Replies Back to Admin (Voice Note or Text)
 */
export async function sendSellerReplyToAdmin(listingId, sellerPhone, replyPayload) {
  if (!supabase || !listingId) return { success: true };
  try {
    const replyText =
      typeof replyPayload === 'string'
        ? replyPayload
        : replyPayload.text || 'Seller replied to admin note';
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
      tag: replyAudioUrl ? 'SELLER VOICE REPLY' : 'SELLER FEEDBACK REPLY',
      title: `Merchant Reply (${sellerPhone})`,
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

/**
 * 11. Save Buyer Comment / Voice Note to DB (Scoped to Seller)
 */
export async function saveCommentToDB(listingId, comment, listingTitle = '', sellerPhone = '') {
  if (!supabase || !listingId || !isValidDatabaseId(listingId)) return null;
  try {
    const hasAudio = Boolean(comment.audioUrl);
    const dbPayload = {
      listing_id: String(listingId),
      user_name: comment.userName || 'Local Buyer',
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

    await saveNotificationToDB({
      tag: hasAudio ? 'VOICE INQUIRY' : 'NEW COMMENT',
      title: `Inquiry on "${listingTitle || 'Listing'}"`,
      message: `${dbPayload.user_name} sent a ${hasAudio ? 'voice note' : 'message'}.`,
      targetId: listingId,
      recipient_role: 'seller',
      recipient_phone: sellerPhone || null,
      metadata: { targetId: listingId },
    });

    return data;
  } catch (err) {
    console.warn('Network notice saving comment:', err);
    return null;
  }
}

/**
 * 12. Save Seller Reply to DB (Scoped to Buyer)
 */
export async function saveReplyToDB(commentId, replyObj, listingTitle = '', buyerPhone = '') {
  if (!supabase || !commentId || !isValidDatabaseId(commentId)) return null;
  try {
    const isAudio = replyObj?.type === 'audio' || Boolean(replyObj?.audioUrl);
    const updatePayload = {
      seller_reply: isAudio ? (replyObj.text || '🎤 Voice Note Reply') : (typeof replyObj === 'string' ? replyObj : replyObj.text),
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

    await saveNotificationToDB({
      tag: 'SELLER REPLIED',
      title: `Reply on "${listingTitle || 'Listing'}"`,
      message: `Seller replied with a ${isAudio ? 'voice note' : 'message'}.`,
      targetId: commentId,
      recipient_role: 'buyer',
      recipient_phone: buyerPhone || null,
      metadata: { targetId: commentId },
    });

    return data;
  } catch (err) {
    console.warn('Network notice saving reply:', err);
    return null;
  }
}

/**
 * 13. Save In-App Notification with Explicit Role & Phone Scoping
 */
export async function saveNotificationToDB(notif) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert([
        {
          tag: notif.tag || 'INQUIRY',
          title: notif.title || 'New Message',
          message: notif.message || '',
          recipient_role: notif.recipient_role || 'public',
          recipient_phone: notif.recipient_phone || null,
          is_read: false,
          metadata: {
            targetId: notif.targetId,
            type: notif.type,
            category: notif.category,
            audioUrl: notif.metadata?.audioUrl || null,
            duration: notif.metadata?.duration || null,
            sellerPhone: notif.metadata?.sellerPhone || null,
          },
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) console.warn('Save notification notice:', error.message);
    return data;
  } catch (err) {
    console.warn('Network notice saving notification:', err);
    return null;
  }
}

/**
 * 14. Update Interest Counter
 */
export async function updateInterestCountInDB(listingId, newCount) {
  if (!supabase || !listingId || !isValidDatabaseId(listingId)) return;
  try {
    const { error } = await supabase
      .from('listings')
      .update({ interest_count: Number(newCount) })
      .eq('id', listingId);

    if (error) console.warn('Update interest notice:', error.message);
  } catch (err) {
    console.warn('Network notice updating interest:', err);
  }
}

/**
 * 15. Fetch Live Listings (ONLY Approved Active Listings for Public Town Feed)
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
 * 16. Universal Listing Publisher
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
 * 17. Report a listing
 */
export async function reportListing(listingId, reporterPhone, reason) {
  if (!supabase || !isValidDatabaseId(listingId)) return { success: true };
  try {
    const { data, error } = await supabase
      .from('listing_reports')
      .insert({
        listing_id: listingId,
        reporter_phone: reporterPhone,
        reason: reason,
      });

    return { data, error };
  } catch (err) {
    console.error('Report listing error:', err);
    return { data: null, error: err };
  }
}

/**
 * 18. Category Fallback Image URLs
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