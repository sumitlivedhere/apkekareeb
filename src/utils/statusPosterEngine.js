// src/utils/statusPosterEngine.js

const THEMES = {
  dhamaka: {
    bg1: '#1a0d2e',
    bg2: '#0b0614',
    accent: '#f59e0b',
    headerBg: '#dc2626',
    headerText: '🔥 AAPKE KAREEB • SPECIAL LOCAL DEAL',
    tagColor: '#fbbf24',
  },
  royal: {
    bg1: '#2a0928',
    bg2: '#080108',
    accent: '#ec4899',
    headerBg: '#7e22ce',
    headerText: '👑 AAPKE KAREEB • EXCLUSIVE TOWN PICK',
    tagColor: '#f472b6',
  },
  verified: {
    bg1: '#04231e',
    bg2: '#010c0a',
    accent: '#10b981',
    headerBg: '#047857',
    headerText: '✓ AAPKE KAREEB • 100% VERIFIED MERCHANT',
    tagColor: '#34d399',
  },
};

/**
 * 🖼️ CORS-Safe Image Loader for HTML5 Canvas
 */
async function loadCanvasImage(url) {
  if (!url) return null;

  try {
    const res = await fetch(url, { mode: 'cors' });
    if (res.ok) {
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = objectUrl;
      });
      return { img, objectUrl };
    }
  } catch {}

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve({ img, objectUrl: null });
    img.onerror = () => {
      const fallback = new Image();
      fallback.onload = () => resolve({ img: fallback, objectUrl: null });
      fallback.onerror = () => resolve(null);
      fallback.src = url;
    };
    img.src = url;
  });
}

/**
 * 🎨 Multi-Theme 9:16 High-Resolution Poster Generator
 */
export async function generateDynamicStatusPoster(item, themeKey = 'dhamaka', selectedCity = 'Alwar') {
  const theme = THEMES[themeKey] || THEMES.dhamaka;
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');

  // 1. Dark Gradient Background
  const bg = ctx.createLinearGradient(0, 0, 0, 1920);
  bg.addColorStop(0, theme.bg1);
  bg.addColorStop(0.55, theme.bg2);
  bg.addColorStop(1, '#000000');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1080, 1920);

  // 2. Ambient Color Glow
  ctx.save();
  const aura = ctx.createRadialGradient(540, 300, 30, 540, 300, 650);
  aura.addColorStop(0, `${theme.accent}25`);
  aura.addColorStop(1, 'transparent');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(540, 300, 650, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 3. One Single Unified Top Header Badge
  ctx.fillStyle = theme.headerBg;
  drawRoundedRect(ctx, 90, 80, 900, 105, 26, true);
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 34px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(theme.headerText, 540, 134);

  ctx.fillStyle = '#fef08a';
  ctx.font = '700 22px sans-serif';
  ctx.fillText(`📍 ${selectedCity} • लोकल डिजिटल बाज़ार • 0% कमिशन`, 540, 166);

  // 4. Product Photo Box (Aspect Ratio Cover)
  const rawImg =
    (Array.isArray(item?.images) && item?.images[0]) ||
    (Array.isArray(item?.image_urls) && item?.image_urls[0]) ||
    item?.image ||
    item?.photo ||
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=700';

  const imgSrc = typeof rawImg === 'string' ? rawImg : rawImg?.url || '';
  const loaded = await loadCanvasImage(imgSrc);

  const imgBoxX = 90;
  const imgBoxY = 215;
  const imgBoxW = 900;
  const imgBoxH = 780;

  if (loaded?.img) {
    drawImageCover(ctx, loaded.img, imgBoxX, imgBoxY, imgBoxW, imgBoxH, 32);
    if (loaded.objectUrl) URL.revokeObjectURL(loaded.objectUrl);
  } else {
    ctx.fillStyle = '#1e293b';
    drawRoundedRect(ctx, imgBoxX, imgBoxY, imgBoxW, imgBoxH, 32, true);
    ctx.fillStyle = theme.accent;
    ctx.font = '900 110px sans-serif';
    ctx.fillText('🛍️', 540, imgBoxY + 430);
  }

  // 5. Sequential Flow Below Image (No Text Overlapping)
  let curY = 1030;

  // Category Tag Pill
  const cat = String(item?.subCategory || item?.category || 'LOCAL DEAL').toUpperCase();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  drawRoundedRect(ctx, 120, curY, 840, 52, 16, true);
  ctx.fillStyle = theme.tagColor;
  ctx.font = '900 23px sans-serif';
  ctx.fillText(`⚡ ${cat}`, 540, curY + 35);
  curY += 75;

  // Title (Max 2 lines, clean wrapped)
  const rawTitle = item?.title || item?.name || 'Special Listing';
  const titleLines = wrapText(ctx, rawTitle, 860, '900 44px sans-serif').slice(0, 2);
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 44px sans-serif';
  titleLines.forEach((line) => {
    ctx.fillText(line, 540, curY + 40);
    curY += 56;
  });

  curY += 15;

  // Auto-Scaling Dynamic Price Tag
  const priceStr = String(item?.price || item?.deal_price || item?.rent || item?.rates || 'Best Rate');
  const priceFontSize = getFittingFontSize(ctx, priceStr, 46, 24, 780);
  ctx.font = `900 ${priceFontSize}px sans-serif`;
  const textWidth = ctx.measureText(priceStr).width;
  const pricePillW = Math.min(860, Math.max(460, textWidth + 80));
  const pricePillX = (1080 - pricePillW) / 2;
  const pricePillH = 86;

  ctx.fillStyle = theme.accent;
  drawRoundedRect(ctx, pricePillX, curY, pricePillW, pricePillH, 26, true);
  ctx.fillStyle = '#020617';
  ctx.fillText(priceStr, 540, curY + 58);

  curY += pricePillH + 25;

  // Clean Seller Name
  let cleanSeller = (item?.sellerName || item?.provider_name || item?.driverName || '').trim();
  if (!cleanSeller || cleanSeller === rawTitle) {
    cleanSeller = rawTitle.includes('(') ? rawTitle.split('(')[0].trim() : 'Verified Merchant';
  }
  if (cleanSeller.length > 30) cleanSeller = cleanSeller.slice(0, 28) + '...';

  const phone = String(item?.phone || item?.contact || '9876543210').replace(/\D/g, '').slice(-10);

  // Contact Box
  const boxH = 190;
  ctx.fillStyle = '#0f172a';
  drawRoundedRect(ctx, 90, curY, 900, boxH, 28, true, true, `${theme.accent}55`);

  ctx.fillStyle = '#38bdf8';
  ctx.font = '800 28px sans-serif';
  ctx.fillText(`👤 ${cleanSeller} • डायरेक्ट डील`, 540, curY + 52);

  ctx.fillStyle = '#10b981';
  ctx.font = '900 44px sans-serif';
  ctx.fillText(`📞 WhatsApp / Call: +91 ${phone}`, 540, curY + 115);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '700 22px sans-serif';
  ctx.fillText(`📍 ${item?.location || selectedCity} • 0% कमिशन`, 540, curY + 158);

  // 6. Direct 1-Tap Link Footer Watermark
  const domain = window.location.origin.includes('localhost')
    ? 'https://apkekareeb.vercel.app'
    : window.location.origin;
  const cleanUrl = `${domain}/?id=${encodeURIComponent(item?.id || '')}`;

  ctx.fillStyle = '#fbbf24';
  ctx.font = '900 24px sans-serif';
  ctx.fillText(`🔗 Direct Link: ${cleanUrl}`, 540, 1845);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve({ blob, dataUrl: canvas.toDataURL('image/png') });
    }, 'image/png');
  });
}

/**
 * Backward-compatible blob generator
 */
export async function generateStatusPosterBlob(item, selectedCity = 'Alwar') {
  const result = await generateDynamicStatusPoster(item, 'dhamaka', selectedCity);
  return { blob: result.blob, dataUrl: result.dataUrl };
}

// 🛠️ Canvas Helpers

function drawImageCover(ctx, img, x, y, w, h, radius = 28) {
  ctx.save();
  drawRoundedRect(ctx, x, y, w, h, radius, false);
  ctx.clip();

  const imgRatio = img.naturalWidth / (img.naturalHeight || 1);
  const targetRatio = w / h;
  let sWidth, sHeight, sx, sy;

  if (imgRatio > targetRatio) {
    sHeight = img.naturalHeight;
    sWidth = img.naturalHeight * targetRatio;
    sx = (img.naturalWidth - sWidth) / 2;
    sy = 0;
  } else {
    sWidth = img.naturalWidth;
    sHeight = img.naturalWidth / targetRatio;
    sx = 0;
    sy = (img.naturalHeight - sHeight) / 2;
  }

  ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, w, h);
  ctx.restore();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 4;
  drawRoundedRect(ctx, x, y, w, h, radius, false, true);
}

function drawRoundedRect(ctx, x, y, width, height, radius = 16, fill = false, stroke = false, strokeColor = '#334155') {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
}

function getFittingFontSize(ctx, text, maxFontSize, minFontSize, maxWidth, fontWeight = '900') {
  let size = maxFontSize;
  ctx.font = `${fontWeight} ${size}px sans-serif`;
  while (ctx.measureText(text).width > maxWidth && size > minFontSize) {
    size -= 2;
    ctx.font = `${fontWeight} ${size}px sans-serif`;
  }
  return size;
}

function wrapText(ctx, text, maxWidth, fontStyle = '900 44px sans-serif') {
  ctx.font = fontStyle;
  const words = String(text || '').split(' ');
  const lines = [];
  let currentLine = words[0] || '';

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}