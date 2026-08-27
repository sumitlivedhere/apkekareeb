// 🎨 Multi-Theme High-Resolution WhatsApp Story Canvas Generator

const THEMES = {
  dhamaka: {
    bg1: '#1e1b4b',
    bg2: '#0f172a',
    accent: '#f59e0b',
    badgeBg: '#dc2626',
    badgeText: '🔥 DHAMAKA LOCAL DEAL',
    tagColor: '#fbbf24',
  },
  royal: {
    bg1: '#31102f',
    bg2: '#020617',
    accent: '#ec4899',
    badgeBg: '#9333ea',
    badgeText: '👑 EXCLUSIVE BOUTIQUE PICK',
    tagColor: '#f472b6',
  },
  verified: {
    bg1: '#062d29',
    bg2: '#020617',
    accent: '#10b981',
    badgeBg: '#059669',
    badgeText: '✓ 100% VERIFIED TOWN SERVICE',
    tagColor: '#34d399',
  },
};

export function generateDynamicStatusPoster(item, themeKey = 'dhamaka', selectedCity = 'Alwar') {
  return new Promise((resolve) => {
    const theme = THEMES[themeKey] || THEMES.dhamaka;
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');

    // 1. Background Gradient
    const bg = ctx.createLinearGradient(0, 0, 1080, 1920);
    bg.addColorStop(0, theme.bg1);
    bg.addColorStop(0.45, theme.bg2);
    bg.addColorStop(1, '#000000');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1080, 1920);

    // 2. Ambient Glow Orbs
    ctx.save();
    const glow = ctx.createRadialGradient(540, 200, 50, 540, 200, 600);
    glow.addColorStop(0, `${theme.accent}33`);
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(540, 200, 600, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3. Top Banner
    ctx.fillStyle = theme.badgeBg;
    drawRoundedRect(ctx, 90, 80, 900, 70, 24, true);
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(theme.badgeText, 540, 126);

    // 4. Town Branding
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 44px sans-serif';
    ctx.fillText('AAPKE KAREEB • आपके करीब', 540, 200);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 26px sans-serif';
    ctx.fillText(`📍 ${selectedCity} का अपना डिजिटल बाज़ार • No Middlemen`, 540, 245);

    // 5. Product Image Card
    const rawImg =
      (Array.isArray(item.images) && item.images[0]) ||
      (Array.isArray(item.image_urls) && item.image_urls[0]) ||
      item.image ||
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=700';

    const imgSrc = typeof rawImg === 'string' ? rawImg : rawImg?.url || '';
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imgSrc;

    const renderCard = () => {
      // Category Tag
      const cat = String(item.subCategory || item.category || 'SPECIAL OFFER').toUpperCase();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      drawRoundedRect(ctx, 90, 1140, 900, 56, 16, true);
      ctx.fillStyle = theme.tagColor;
      ctx.font = '900 24px sans-serif';
      ctx.fillText(`⚡ ${cat}`, 540, 1177);

      // Title (Auto-wrapped)
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 52px sans-serif';
      const lines = wrapText(ctx, item.title || item.name || 'Special Listing', 880);
      let textY = 1270;
      lines.slice(0, 2).forEach((line) => {
        ctx.fillText(line, 540, textY);
        textY += 64;
      });

      // Price Banner
      const priceStr = String(item.price || item.deal_price || item.rent || 'Best Price');
      ctx.fillStyle = theme.accent;
      drawRoundedRect(ctx, 240, textY + 20, 600, 100, 28, true);
      ctx.fillStyle = '#020617';
      ctx.font = '900 54px sans-serif';
      ctx.fillText(priceStr, 540, textY + 88);

      // Contact & Merchant Box
      const seller = item.sellerName || item.provider_name || 'Verified Member';
      const phone = String(item.phone || item.contact || '9876543210').replace(/\D/g, '').slice(-10);

      const boxY = 1530;
      ctx.fillStyle = '#0f172a';
      drawRoundedRect(ctx, 90, boxY, 900, 210, 32, true, true, `${theme.accent}66`);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '800 30px sans-serif';
      ctx.fillText(`👤 ${seller} • Direct Deal`, 540, boxY + 60);

      ctx.fillStyle = '#10b981';
      ctx.font = '900 46px sans-serif';
      ctx.fillText(`📞 WhatsApp / Call: +91 ${phone}`, 540, boxY + 135);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '700 24px sans-serif';
      ctx.fillText(`📍 ${item.location || selectedCity}`, 540, boxY + 180);

      // Footer Call to Action
      ctx.fillStyle = '#64748b';
      ctx.font = '700 24px sans-serif';
      ctx.fillText('🔗 Aapke Kareeb पर पूरा कैटलॉग देखें • लोकल दुकानदारों का समर्थन करें', 540, 1830);

      canvas.toBlob((blob) => {
        resolve({ blob, dataUrl: canvas.toDataURL('image/png') });
      }, 'image/png');
    };

    img.onload = () => {
      ctx.save();
      drawRoundedRect(ctx, 90, 290, 900, 810, 36, false);
      ctx.clip();
      ctx.drawImage(img, 90, 290, 900, 810);
      ctx.restore();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 6;
      drawRoundedRect(ctx, 90, 290, 900, 810, 36, false, true);

      renderCard();
    };

    img.onerror = () => {
      ctx.fillStyle = '#1e293b';
      drawRoundedRect(ctx, 90, 290, 900, 810, 36, true);
      renderCard();
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