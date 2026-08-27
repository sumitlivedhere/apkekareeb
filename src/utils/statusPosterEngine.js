// src/utils/statusPosterEngine.js

const THEMES = {
  dhamaka: {
    bg1: '#180e29',
    bg2: '#090514',
    accent: '#f59e0b',
    badgeBg: '#dc2626',
    badgeText: '🔥 DHAMAKA LOCAL OFFER',
    tagColor: '#fbbf24',
    textColor: '#ffffff',
  },
  royal: {
    bg1: '#260b24',
    bg2: '#080108',
    accent: '#ec4899',
    badgeBg: '#7e22ce',
    badgeText: '👑 EXCLUSIVE TOWN PICK',
    tagColor: '#f472b6',
    textColor: '#ffffff',
  },
  verified: {
    bg1: '#04231e',
    bg2: '#010c0a',
    accent: '#10b981',
    badgeBg: '#047857',
    badgeText: '✓ 100% VERIFIED MERCHANT',
    tagColor: '#34d399',
    textColor: '#ffffff',
  },
};

export function generateDynamicStatusPoster(item, themeKey = 'dhamaka', selectedCity = 'Alwar') {
  return new Promise((resolve) => {
    const theme = THEMES[themeKey] || THEMES.dhamaka;
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920; // 9:16 vertical HD
    const ctx = canvas.getContext('2d');

    // 1. Dark Gradient Background
    const bg = ctx.createLinearGradient(0, 0, 0, 1920);
    bg.addColorStop(0, theme.bg1);
    bg.addColorStop(0.5, theme.bg2);
    bg.addColorStop(1, '#000000');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1080, 1920);

    // 2. Ambient Color Aura
    ctx.save();
    const aura = ctx.createRadialGradient(540, 320, 50, 540, 320, 700);
    aura.addColorStop(0, `${theme.accent}30`);
    aura.addColorStop(1, 'transparent');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(540, 320, 700, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3. Top Banner
    ctx.fillStyle = theme.badgeBg;
    drawRoundedRect(ctx, 120, 90, 840, 68, 20, true);
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(theme.badgeText, 540, 136);

    // 4. App Branding
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 46px sans-serif';
    ctx.fillText('AAPKE KAREEB • आपके करीब', 540, 215);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '700 28px sans-serif';
    ctx.fillText(`📍 ${selectedCity} का अपना डिजिटल बाज़ार`, 540, 262);

    // 5. Product Image Card
    const rawImg =
      (Array.isArray(item?.images) && item?.images[0]) ||
      (Array.isArray(item?.image_urls) && item?.image_urls[0]) ||
      item?.image ||
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=700';

    const imgSrc = typeof rawImg === 'string' ? rawImg : rawImg?.url || '';
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imgSrc;

    const renderPosterBody = () => {
      // Category Tag
      const cat = String(item?.subCategory || item?.category || 'SPECIAL DEAL').toUpperCase();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      drawRoundedRect(ctx, 100, 1140, 880, 56, 16, true);
      ctx.fillStyle = theme.tagColor;
      ctx.font = '900 24px sans-serif';
      ctx.fillText(`⚡ ${cat}`, 540, 1177);

      // Main Title
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 52px sans-serif';
      const lines = wrapText(ctx, item?.title || item?.name || 'Special Listing', 860);
      let textY = 1265;
      lines.slice(0, 2).forEach((line) => {
        ctx.fillText(line, 540, textY);
        textY += 66;
      });

      // Price Tag Banner
      const priceStr = String(item?.price || item?.deal_price || item?.rent || 'Best Rate');
      ctx.fillStyle = theme.accent;
      drawRoundedRect(ctx, 220, textY + 20, 640, 105, 30, true);
      ctx.fillStyle = '#020617';
      ctx.font = '900 54px sans-serif';
      ctx.fillText(priceStr, 540, textY + 92);

      // Contact Details Card
      const seller = item?.sellerName || item?.provider_name || 'Verified Merchant';
      const phone = String(item?.phone || item?.contact || '9876543210').replace(/\D/g, '').slice(-10);

      const boxY = 1530;
      ctx.fillStyle = '#0f172a';
      drawRoundedRect(ctx, 90, boxY, 900, 210, 32, true, true, `${theme.accent}66`);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '800 30px sans-serif';
      ctx.fillText(`👤 ${seller} • डायरेक्ट डील`, 540, boxY + 62);

      ctx.fillStyle = '#10b981';
      ctx.font = '900 48px sans-serif';
      ctx.fillText(`📞 WhatsApp / Call: +91 ${phone}`, 540, boxY + 135);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '700 24px sans-serif';
      ctx.fillText(`📍 ${item?.location || selectedCity} • 0% कमिशन`, 540, boxY + 182);

      // Footer Watermark
      ctx.fillStyle = '#64748b';
      ctx.font = '700 26px sans-serif';
      ctx.fillText('🔗 Aapke Kareeb ऐप पर पूरा कैटलॉग देखें • लोकल दुकानदारों का समर्थन करें', 540, 1835);

      canvas.toBlob((blob) => {
        resolve({ blob, dataUrl: canvas.toDataURL('image/png') });
      }, 'image/png');
    };

    img.onload = () => {
      ctx.save();
      drawRoundedRect(ctx, 100, 300, 880, 800, 36, false);
      ctx.clip();
      ctx.drawImage(img, 100, 300, 880, 800);
      ctx.restore();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 6;
      drawRoundedRect(ctx, 100, 300, 880, 800, 36, false, true);

      renderPosterBody();
    };

    img.onerror = () => {
      ctx.fillStyle = '#1e293b';
      drawRoundedRect(ctx, 100, 300, 880, 800, 36, true);
      renderPosterBody();
    };
  });
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
    ctx.lineWidth = 4;
    ctx.stroke();
  }
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
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