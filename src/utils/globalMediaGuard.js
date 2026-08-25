// src/utils/globalMediaGuard.js

const OFFLINE_IMAGE_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" fill="%23090d16"><rect width="600" height="400" fill="%23090d16"/><rect x="20" y="20" width="560" height="360" rx="20" fill="none" stroke="%23334155" stroke-dasharray="8 8" stroke-width="2"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-size="36">🖼️</text><text x="50%" y="58%" dominant-baseline="middle" text-anchor="middle" fill="%23fbbf24" font-family="sans-serif" font-size="16" font-weight="900">IMAGE NOT AVAILABLE</text><text x="50%" y="67%" dominant-baseline="middle" text-anchor="middle" fill="%2364748b" font-family="sans-serif" font-size="12" font-weight="600">फ़ोटो लोड नहीं हो सकी</text></svg>`;

const OFFLINE_VIDEO_POSTER = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" fill="%23090d16"><rect width="600" height="400" fill="%23090d16"/><rect x="20" y="20" width="560" height="360" rx="20" fill="none" stroke="%2306b6d4" stroke-dasharray="8 8" stroke-width="2"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-size="36">🎬</text><text x="50%" y="58%" dominant-baseline="middle" text-anchor="middle" fill="%2322d3ee" font-family="sans-serif" font-size="16" font-weight="900">VIDEO NOT AVAILABLE</text><text x="50%" y="67%" dominant-baseline="middle" text-anchor="middle" fill="%2364748b" font-family="sans-serif" font-size="12" font-weight="600">वीडियो अनुपलब्ध है</text></svg>`;

export function installGlobalMediaGuard() {
  if (typeof window === 'undefined') return;

  // Use capture phase (true) to intercept resource errors before component-level handlers
  window.addEventListener(
    'error',
    (event) => {
      const target = event.target;
      if (!target) return;

      // 1. Intercept broken <img> tags anywhere in the application
      if (target.tagName === 'IMG') {
        if (target.dataset.hasFailed === 'true') {
          event.preventDefault();
          event.stopImmediatePropagation();
          return;
        }

        // Lock element to halt recursive error firing
        target.dataset.hasFailed = 'true';
        target.onerror = null;
        target.src = OFFLINE_IMAGE_SVG;
        target.style.objectFit = 'contain';
        target.style.backgroundColor = '#020617';

        event.preventDefault();
        event.stopImmediatePropagation();
      }

      // 2. Intercept broken <video> tags
      if (target.tagName === 'VIDEO') {
        if (target.dataset.hasFailed === 'true') {
          event.preventDefault();
          event.stopImmediatePropagation();
          return;
        }

        target.dataset.hasFailed = 'true';
        target.onerror = null;
        target.poster = OFFLINE_VIDEO_POSTER;
        target.style.backgroundColor = '#020617';

        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );
}