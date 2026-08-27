/**
 * TownHub High-Speed Optimistic Video Processor
 * - Instant (<100ms) Canvas Poster / Thumbnail Extractor
 * - Smart Fast-Path: Bypasses JS re-encoding if already within mobile stream limits (< 25MB)
 * - Ultra-Fast Stepped Frame Compressor fallback
 */

/**
 * Extracts metadata and a high-resolution first-frame poster in <100ms
 */
export function getVideoMetadataAndPoster(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    const blobUrl = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(0.5, (video.duration || 1) / 2);
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(video.videoWidth || 720, 720);
        canvas.height = Math.round(
          (canvas.width * (video.videoHeight || 1280)) / (video.videoWidth || 720)
        );
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const posterUrl = canvas.toDataURL('image/jpeg', 0.8);

        const duration = video.duration || 0;
        const mins = Math.floor(duration / 60);
        const secs = Math.floor(duration % 60);

        URL.revokeObjectURL(blobUrl);

        resolve({
          duration,
          durationStr: `${mins}:${secs < 10 ? '0' : ''}${secs}`,
          durationSec: Math.round(duration),
          width: video.videoWidth,
          height: video.videoHeight,
          posterUrl,
          sizeBytes: file.size,
          sizeMb: (file.size / (1024 * 1024)).toFixed(1),
        });
      } catch (err) {
        URL.revokeObjectURL(blobUrl);
        reject(err);
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      reject(new Error('Invalid or unreadable video file.'));
    };

    video.src = blobUrl;
  });
}

/**
 * Optimistic Fast-Path Processor
 */
export async function processVideoOptimistic(file, onProgress = () => {}) {
  const meta = await getVideoMetadataAndPoster(file);

  // 1. FAST-PATH: File is under 25MB (Instant pass-through)
  if (file.size <= 25 * 1024 * 1024) {
    onProgress(100);
    return {
      file,
      url: URL.createObjectURL(file),
      previewUrl: URL.createObjectURL(file),
      posterUrl: meta.posterUrl,
      durationStr: meta.durationStr,
      durationSec: meta.durationSec,
      sizeBytes: file.size,
      sizeMb: meta.sizeMb,
      isFastPath: true,
    };
  }

  // 2. Transcoding Path for larger clips
  return new Promise(async (resolve, reject) => {
    let videoUrl = null;
    try {
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      videoUrl = URL.createObjectURL(file);
      video.src = videoUrl;

      await new Promise((res) => {
        video.onloadeddata = res;
      });

      const maxDim = 720;
      let outWidth = video.videoWidth;
      let outHeight = video.videoHeight;
      if (outWidth > maxDim || outHeight > maxDim) {
        if (outWidth > outHeight) {
          outHeight = Math.round((outHeight * maxDim) / outWidth);
          outWidth = maxDim;
        } else {
          outWidth = Math.round((outWidth * maxDim) / outHeight);
          outHeight = maxDim;
        }
      }
      outWidth = outWidth % 2 === 0 ? outWidth : outWidth - 1;
      outHeight = outHeight % 2 === 0 ? outHeight : outHeight - 1;

      const canvas = document.createElement('canvas');
      canvas.width = outWidth;
      canvas.height = outHeight;
      const ctx = canvas.getContext('2d', { alpha: false });

      const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
        ? 'video/webm;codecs=vp8'
        : 'video/webm';

      const stream = canvas.captureStream(24);
      const recorder = new MediaRecorder(stream, {
        mimeType: mime,
        videoBitsPerSecond: 1200000,
      });

      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        URL.revokeObjectURL(videoUrl);
        const compressedBlob = new Blob(chunks, { type: mime });
        const compressedFile = new File([compressedBlob], `opt_${file.name.replace(/\.[^/.]+$/, '')}.webm`, {
          type: mime,
        });

        resolve({
          file: compressedFile,
          url: URL.createObjectURL(compressedBlob),
          previewUrl: URL.createObjectURL(compressedBlob),
          posterUrl: meta.posterUrl,
          durationStr: meta.durationStr,
          durationSec: meta.durationSec,
          sizeBytes: compressedBlob.size,
          sizeMb: (compressedBlob.size / (1024 * 1024)).toFixed(1),
          isFastPath: false,
        });
      };

      video.playbackRate = 2.5;
      recorder.start();
      video.play();

      const renderLoop = () => {
        if (!video.paused && !video.ended) {
          ctx.drawImage(video, 0, 0, outWidth, outHeight);
          const pct = Math.min(99, Math.round((video.currentTime / meta.duration) * 100));
          onProgress(pct);
          requestAnimationFrame(renderLoop);
        }
      };
      renderLoop();

      video.onended = () => {
        onProgress(100);
        recorder.stop();
      };
    } catch (err) {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      reject(err);
    }
  });
}

/**
 * Validates and compresses video for product reviews / reels
 */
export async function compressVideo(file, options = {}) {
  const { maxDuration = 30 } = options;
  const processed = await processVideoOptimistic(file);

  if (processed.durationSec > maxDuration + 1) {
    throw new Error(`Video duration is ${processed.durationSec}s. Maximum allowed is ${maxDuration} seconds.`);
  }

  return {
    file: processed.file,
    url: processed.url || processed.previewUrl,
    previewUrl: processed.previewUrl || processed.url,
    posterUrl: processed.posterUrl,
    duration: processed.durationSec,
  };
}