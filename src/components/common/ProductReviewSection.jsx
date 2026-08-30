import React, { useState, useRef } from 'react';
import { getCurrentUserProfile } from '../../services/authService';
import {
  hyperlocalStore,
  useListingReviews,
  useListingRatingStats,
} from '../../store/hyperlocalStore';
import { uploadVoiceNoteToStorage, notifySellerNewReview } from '../../services/listingService';
import { compressImage } from '../../utils/imageCompressor';
import { compressVideo } from '../../utils/videoCompressor';
import {
  getOptimizedVoiceStream,
  createOptimizedMediaRecorder,
} from '../../utils/audioCompressor';
import VoiceNotePlayer from './VoiceNotePlayer';

export default function ProductReviewSection({
  listingId,
  listingTitle = 'Product',
  sellerName = 'Seller',
  sellerPhone = '',
}) {
  const user = getCurrentUserProfile();
  const reviews = useListingReviews(listingId);
  const stats = useListingRatingStats(listingId, 4.8);

  const cleanSellerPhone = sellerPhone
    ? String(sellerPhone).replace(/\D/g, '').slice(-10)
    : null;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [commentText, setCommentText] = useState('');

  // Media attachments
  const [attachedPhotos, setAttachedPhotos] = useState([]);
  const [attachedVideo, setAttachedVideo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 🎙️ Voice Review State
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [recordedVoice, setRecordedVoice] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  const filePhotoInputRef = useRef(null);
  const fileVideoInputRef = useRef(null);

  // Permanent verified user check
  const isPermanentUser = Boolean(
    user &&
      (user.verification_tier === 'verified_resident' ||
        user.verification_tier === 'verified_merchant' ||
        user.is_verified === true)
  );

  const userPhone = user?.phone
    ? String(user.phone).replace(/\D/g, '').slice(-10)
    : null;
  const isOwner = Boolean(userPhone && cleanSellerPhone && userPhone === cleanSellerPhone);
  const hasAlreadyReviewed = reviews.some(
    (r) => String(r.phone || '').replace(/\D/g, '').slice(-10) === userPhone
  );

  // 📷 Photo Selection with WebP Compression
  const handlePhotoSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      const compressedPreviews = await Promise.all(
        files.slice(0, 4).map(async (file) => {
          const compressed = await compressImage(file, {
            maxWidth: 1280,
            maxHeight: 1280,
            quality: 0.78,
          });
          return {
            file: compressed,
            previewUrl: URL.createObjectURL(compressed),
          };
        })
      );

      setAttachedPhotos((prev) => [...prev, ...compressedPreviews].slice(0, 4));
    } catch {
      const rawPreviews = files.slice(0, 4).map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      }));
      setAttachedPhotos((prev) => [...prev, ...rawPreviews].slice(0, 4));
    }
    e.target.value = '';
  };

  const handleRemovePhoto = (idx) => {
    setAttachedPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  // 🎬 Video Selection & 30-Second Validation
  const handleVideoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressVideo(file, { maxDuration: 30 });
      setAttachedVideo({
        file: compressed.file,
        previewUrl: compressed.url || compressed.previewUrl,
        duration: compressed.duration,
      });
    } catch (err) {
      alert(err.message || 'Video must be 30 seconds or shorter.');
    }
    e.target.value = '';
  };

  // 🎙️ Voice Recording Handlers
  const startVoiceReview = async () => {
    try {
      const stream = await getOptimizedVoiceStream();
      audioChunksRef.current = [];
      const mediaRecorder = createOptimizedMediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordSeconds((p) => p + 1);
      }, 1000);
    } catch {
      alert('Microphone permission denied.');
    }
  };

  const stopVoiceReview = () => {
    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder) return;

    mediaRecorder.onstop = () => {
      clearInterval(timerRef.current);
      const audioBlob = new Blob(audioChunksRef.current, {
        type: mediaRecorder.mimeType || 'audio/webm',
      });
      const durationStr = `0:${recordSeconds < 10 ? '0' : ''}${recordSeconds}`;

      setRecordedVoice({
        blob: audioBlob,
        previewUrl: URL.createObjectURL(audioBlob),
        duration: durationStr,
      });

      mediaRecorder.stream.getTracks().forEach((t) => t.stop());
      setIsRecording(false);
      setRecordSeconds(0);
    };

    mediaRecorder.stop();
  };

  const cancelVoiceReview = () => {
    if (mediaRecorderRef.current) {
      clearInterval(timerRef.current);
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      mediaRecorderRef.current = null;
      setIsRecording(false);
      setRecordSeconds(0);
      setRecordedVoice(null);
    }
  };

  // 📝 Review Submission Handler
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!user) {
      setErrorMessage('Please login with your mobile number to submit a review.');
      return;
    }

    if (isOwner) {
      setErrorMessage('You cannot review your own business listing.');
      return;
    }

    if (!isPermanentUser) {
      setErrorMessage('🔒 Verified permanent resident status required. Please verify your 6-digit WhatsApp PIN in Profile.');
      return;
    }

    if (!commentText.trim() && !recordedVoice && attachedPhotos.length === 0) {
      setErrorMessage('Please provide a comment, voice review, or photo.');
      return;
    }

    setIsSubmitting(true);

    try {
      let uploadedAudioUrl = null;
      if (recordedVoice?.blob) {
        uploadedAudioUrl = await uploadVoiceNoteToStorage(recordedVoice.blob);
      }

      const photoUrls = attachedPhotos.map((p) => p.previewUrl);

      const res = await hyperlocalStore.addListingReview(listingId, {
        rating,
        comment: commentText.trim(),
        photos: photoUrls,
        video: attachedVideo ? attachedVideo.previewUrl : null,
        audioUrl: uploadedAudioUrl || recordedVoice?.previewUrl,
        audioDuration: recordedVoice?.duration,
      });

      if (res.success) {
        // Dispatch real-time alert to seller
        if (cleanSellerPhone) {
          notifySellerNewReview({
            sellerPhone: cleanSellerPhone,
            listingId,
            listingTitle,
            reviewerName: user?.full_name || 'Verified Resident',
            rating,
            hasMedia: attachedPhotos.length > 0 || Boolean(attachedVideo) || Boolean(recordedVoice),
          });
        }

        setSuccessMessage('🎉 Thank you! Your review has been published.');
        setIsFormOpen(false);
        setCommentText('');
        setAttachedPhotos([]);
        setAttachedVideo(null);
        setRecordedVoice(null);
      } else {
        setErrorMessage(res.message || 'Failed to submit review.');
      }
    } catch (err) {
      setErrorMessage('Error submitting review: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-4 pt-4 border-t border-slate-800 text-slate-100 font-sans select-none">
      <input
        type="file"
        ref={filePhotoInputRef}
        onChange={handlePhotoSelect}
        accept="image/*"
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={fileVideoInputRef}
        onChange={handleVideoSelect}
        accept="video/*"
        className="hidden"
      />

      {/* 🌟 1. Ratings & Reviews Overview Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3 shadow-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-100 flex items-center space-x-1.5">
              <span>⭐</span>
              <span>Customer Ratings & Reviews</span>
            </h3>
            <p className="text-[10px] text-slate-400">
              Verified resident feedback for {sellerName}
            </p>
          </div>

          {!hasAlreadyReviewed && (
            <button
              type="button"
              onClick={() => {
                if (!user) {
                  alert('Please sign in first.');
                  return;
                }
                if (!isPermanentUser) {
                  alert(
                    '🔒 Tier 2 Verified Resident status required. Enter your 6-digit WhatsApp PIN on the Profile page.'
                  );
                  return;
                }
                setIsFormOpen(true);
              }}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer active:scale-95 transition"
            >
              ★ Write a Review
            </button>
          )}
        </div>

        {/* Breakdown Grid */}
        <div className="grid grid-cols-12 gap-3 items-center pt-1">
          <div className="col-span-4 text-center border-r border-slate-800 pr-2">
            <span className="text-3xl font-black text-amber-400 block">
              {stats.averageRating}
            </span>
            <div className="flex justify-center text-amber-400 text-xs my-0.5">
              {'★'.repeat(Math.min(5, Math.max(1, Math.round(stats.averageRating))))}
              {'☆'.repeat(Math.max(0, 5 - Math.min(5, Math.max(1, Math.round(stats.averageRating)))))}
            </div>
            <span className="text-[10px] text-slate-400 block">
              {stats.totalReviews} {stats.totalReviews === 1 ? 'Rating' : 'Ratings'}
            </span>
          </div>

          <div className="col-span-8 space-y-1 text-[9.5px]">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = stats.breakdown[star] || 0;
              const pct =
                stats.totalReviews > 0
                  ? (count / stats.totalReviews) * 100
                  : star === 5
                  ? 85
                  : star === 4
                  ? 15
                  : 0;
              return (
                <div key={star} className="flex items-center space-x-2">
                  <span className="w-5 font-bold text-slate-400">{star} ★</span>
                  <div className="h-1.5 flex-1 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-6 text-right font-mono text-slate-500">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs font-bold text-center">
          {successMessage}
        </div>
      )}

      {/* 🌟 2. Write Review Form Drawer / Modal */}
      {isFormOpen && (
        <div className="p-4 bg-slate-900 border border-amber-400/50 rounded-3xl space-y-3.5 shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-black text-amber-300 uppercase">
              Write a Product Review
            </h4>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>

          {errorMessage && (
            <div className="p-2.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-bold text-center">
              ⚠️ {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmitReview} className="space-y-3 text-xs">
            {/* Star Rating Selection */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">
                Select Star Rating *
              </label>
              <div className="flex items-center space-x-1.5 text-2xl cursor-pointer">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition transform active:scale-125 focus:outline-none"
                  >
                    <span
                      className={
                        (hoverRating || rating) >= star
                          ? 'text-amber-400'
                          : 'text-slate-700'
                      }
                    >
                      ★
                    </span>
                  </button>
                ))}
                <span className="text-xs font-black text-amber-300 ml-2">
                  {rating === 5
                    ? 'Excellent'
                    : rating === 4
                    ? 'Very Good'
                    : rating === 3
                    ? 'Average'
                    : rating === 2
                    ? 'Poor'
                    : 'Terrible'}
                </span>
              </div>
            </div>

            {/* Detailed Comment Input */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">
                Detailed Review *
              </label>
              <textarea
                rows={3}
                required
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Share details about quality, pricing, delivery, or experience..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Multimedia Proof Toolbar */}
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 block">
                Add Multimedia Proof (Photos, 30s Video, Voice Note):
              </span>

              <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                <button
                  type="button"
                  onClick={() => filePhotoInputRef.current?.click()}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl font-bold text-[10px] flex items-center space-x-1 cursor-pointer"
                >
                  <span>📷</span>
                  <span>Photos ({attachedPhotos.length}/4)</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileVideoInputRef.current?.click()}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 rounded-xl font-bold text-[10px] flex items-center space-x-1 cursor-pointer"
                >
                  <span>🎬</span>
                  <span>{attachedVideo ? `Video (${attachedVideo.duration}s)` : '30s Video'}</span>
                </button>

                {!isRecording ? (
                  <button
                    type="button"
                    onClick={startVoiceReview}
                    className="px-3 py-1.5 bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 rounded-xl font-bold text-[10px] flex items-center space-x-1 cursor-pointer"
                  >
                    <span>🎙️</span>
                    <span>{recordedVoice ? `Voice Note (${recordedVoice.duration})` : 'Voice Note'}</span>
                  </button>
                ) : (
                  <div className="flex items-center space-x-2 bg-rose-500/20 border border-rose-500/40 px-3 py-1 rounded-xl animate-pulse">
                    <span className="text-rose-300 font-bold text-[10px]">
                      Recording 0:{recordSeconds < 10 ? '0' : ''}{recordSeconds}
                    </span>
                    <button
                      type="button"
                      onClick={stopVoiceReview}
                      className="px-2 py-0.5 bg-emerald-500 text-slate-950 font-black text-[9px] rounded-lg"
                    >
                      Done
                    </button>
                    <button
                      type="button"
                      onClick={cancelVoiceReview}
                      className="text-slate-400 hover:text-white text-[9px]"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Photo Previews */}
              {attachedPhotos.length > 0 && (
                <div className="flex items-center space-x-2 pt-1 overflow-x-auto">
                  {attachedPhotos.map((p, idx) => (
                    <div
                      key={idx}
                      className="relative w-12 h-12 rounded-lg border border-slate-700 overflow-hidden shrink-0"
                    >
                      <img
                        src={p.previewUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute top-0.5 right-0.5 w-4 h-4 bg-rose-600 text-white rounded-full flex items-center justify-center text-[9px] font-black"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Voice Review Preview */}
              {recordedVoice && (
                <div className="pt-1">
                  <VoiceNotePlayer
                    audioUrl={recordedVoice.previewUrl}
                    duration={recordedVoice.duration}
                    senderName="Your Voice Review"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer active:scale-95 transition disabled:opacity-40"
            >
              {isSubmitting ? 'Publishing Review...' : '✓ Submit Verified Review'}
            </button>
          </form>
        </div>
      )}

      {/* 🌟 3. Verified Customer Reviews Feed */}
      <div className="space-y-3">
        {reviews.length === 0 ? (
          <div className="text-center py-6 bg-slate-900/50 rounded-2xl border border-slate-800 text-xs text-slate-500">
            No customer reviews yet. Be the first verified resident to review!
          </div>
        ) : (
          reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] flex items-center justify-center">
                    {(rev.userName || 'U').charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <span className="font-bold text-slate-100 block leading-tight">
                      {rev.userName}
                    </span>
                    <span className="text-[9px] text-emerald-400 font-bold">
                      ✓ Verified Resident
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-amber-400 text-xs font-bold">
                    {'★'.repeat(Math.min(5, Math.max(1, rev.rating)))}
                  </span>
                  <span className="text-[9px] text-slate-500 block font-mono">
                    {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {rev.comment && (
                <p className="text-slate-200 text-[11px] leading-relaxed break-words">
                  {rev.comment}
                </p>
              )}

              {/* Photo Gallery Grid */}
              {rev.photos && rev.photos.length > 0 && (
                <div className="flex items-center space-x-2 pt-1 overflow-x-auto">
                  {rev.photos.map((imgUrl, i) => (
                    <img
                      key={i}
                      src={imgUrl}
                      alt="Review attachment"
                      className="w-14 h-14 object-cover rounded-xl border border-slate-800"
                    />
                  ))}
                </div>
              )}

              {/* Video Attachment */}
              {rev.video && (
                <video
                  src={rev.video}
                  controls
                  playsInline
                  className="max-h-40 rounded-xl border border-slate-800 mt-1"
                />
              )}

              {/* Voice Review Player */}
              {rev.audioUrl && (
                <div className="pt-1">
                  <VoiceNotePlayer
                    audioUrl={rev.audioUrl}
                    duration={rev.audioDuration}
                    senderName={`${rev.userName}'s Audio Note`}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}