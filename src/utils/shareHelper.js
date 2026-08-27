// 💬 1. Native Web Share API & WhatsApp Direct Link Formatter
export const shareListingToWhatsApp = async (item, selectedCity = 'Alwar') => {
  if (!item) return;

  const title = item.title || item.name || 'लोकल ऑफर';
  const price = item.price || item.deal_price || item.rent || item.rates || 'Best Price';
  const phone = item.phone || item.contact || '';
  const seller = item.sellerName || item.provider_name || item.driverName || 'Verified Merchant';
  const location = item.location || selectedCity;
  const itemUrl = `${window.location.origin}/?id=${encodeURIComponent(item.id || '')}`;

  const messageText = `*${title}*
💰 *दाम / Price:* ${price}
📍 *लोकेशन:* ${location}
👤 *विक्रेता:* ${seller}
${phone ? `📞 *संपर्क:* +91 ${phone.replace(/\D/g, '').slice(-10)}\n` : ''}
⚡ *Aapke Kareeb पर पूरी जानकारी देखें व सीधे बात करें:*
${itemUrl}`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: `${title} • Aapke Kareeb`,
        text: messageText,
        url: itemUrl,
      });
      return;
    } catch {
      // User cancelled or unsupported; fallback to WhatsApp web link
    }
  }

  // Fallback: Direct WhatsApp intent
  window.open(`https://wa.me/?text=${encodeURIComponent(messageText)}`, '_blank');
};

// 🎨 2. 9:16 WhatsApp Status Pamphlet Generator
export const generateStatusPosterBlob = (item, selectedCity = 'Alwar') => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920; // 9:16 vertical story standard
    const ctx = canvas.getContext('2d');

    // 1. Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 1920);
    bgGrad.addColorStop(0, '#0f172a'); // slate-900
    bgGrad.addColorStop(0.5, '#020617'); // slate-950
    bgGrad.addColorStop(1, '#090d16');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1920);

    // 2. Decorative Ambient Orbs
    ctx.save();
    const glow1 = ctx.createRadialGradient(200, 300, 10, 200, 300, 450);
    glow1.addColorStop(0, 'rgba(245, 158, 11, 0.22)');
    glow1.addColorStop(1, 'transparent');
    ctx.fillStyle = glow1;
    ctx.beginPath();
    ctx.arc(200, 300, 450, 0, Math.PI * 2);
    ctx.fill();

    const glow2 = ctx.createRadialGradient(900, 1500, 10, 900, 1500, 450);
    glow2.addColorStop(0, 'rgba(6, 182, 212, 0.18)');
    glow2.addColorStop(1, 'transparent');
    ctx.fillStyle = glow2;
    ctx.beginPath();
    ctx.arc(900, 1500, 450, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3. Top Header App Brand
    ctx.fillStyle = '#f59e0b'; // amber-500
    ctx.font = '900 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('AAPKE KAREEB • आपके करीब', 540, 150);

    ctx.fillStyle = '#94a3b8'; // slate-400
    ctx.font = '700 32px sans-serif';
    ctx.fillText(`📍 ${selectedCity} का अपना लोकल डिजिटल बाज़ार`, 540, 210);

    // Header divider line
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(140, 260);
    ctx.lineTo(940, 260);
    ctx.stroke();

    // 4. Resolve & Draw Listing Photo
    const rawImg =
      (Array.isArray(item.images) && item.images[0]) ||
      (Array.isArray(item.image_urls) && item.image_urls[0]) ||
      item.image ||
      item.photo ||
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=700';

    const imgSrc = typeof rawImg === 'string' ? rawImg : rawImg?.url || '';

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imgSrc;

    const renderRemainingContent = () => {
      // 5. Category Tag Pill
      const catText = String(item.subCategory || item.category || 'SPECIAL OFFER').toUpperCase();
      ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
      roundRect(ctx, 100, 1130, 880, 60, 20, true, false);
      ctx.fillStyle = '#fbbf24';
      ctx.font = '900 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`✨ ${catText}`, 540, 1172);

      // 6. Main Listing Title
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 56px sans-serif';
      ctx.textAlign = 'center';
      const fullTitle = item.title || item.name || 'Special Listing';
      const titleLines = wrapText(ctx, fullTitle, 880);
      let textY = 1260;
      titleLines.slice(0, 2).forEach((line) => {
        ctx.fillText(line, 540, textY);
        textY += 70;
      });

      // 7. Big Price Badge
      const priceText = String(
        item.price || item.deal_price || item.rent || item.rates || 'Best Price'
      );
      ctx.fillStyle = '#f59e0b';
      roundRect(ctx, 240, textY + 20, 600, 110, 30, true, false);
      ctx.fillStyle = '#020617';
      ctx.font = '900 58px sans-serif';
      ctx.fillText(priceText, 540, textY + 98);

      // 8. Merchant / Direct Call Banner
      const sellerName = item.sellerName || item.provider_name || 'Verified Merchant';
      const phone = String(item.phone || item.contact || '9876543210')
        .replace(/\D/g, '')
        .slice(-10);

      const footerBoxY = 1540;
      ctx.fillStyle = '#0f172a';
      roundRect(ctx, 90, footerBoxY, 900, 210, 32, true, true, 'rgba(56, 189, 248, 0.3)');

      ctx.fillStyle = '#38bdf8'; // sky-400
      ctx.font = '800 32px sans-serif';
      ctx.fillText(`👤 ${sellerName} (Direct Deal • 0% Cut)`, 540, footerBoxY + 65);

      ctx.fillStyle = '#10b981'; // emerald-400
      ctx.font = '900 48px sans-serif';
      ctx.fillText(`📞 Call / WhatsApp: +91 ${phone}`, 540, footerBoxY + 140);

      // 9. Bottom App Watermark
      ctx.fillStyle = '#64748b';
      ctx.font = '700 28px sans-serif';
      ctx.fillText('🔗 Aapke Kareeb पर सभी ऑफर्स देखें • No Middlemen', 540, 1830);

      // Convert to blob
      canvas.toBlob((blob) => {
        resolve({ blob, dataUrl: canvas.toDataURL('image/png') });
      }, 'image/png');
    };

    img.onload = () => {
      // Draw image inside rounded card with subtle drop shadow
      ctx.save();
      roundRect(ctx, 100, 310, 880, 780, 36, false, false);
      ctx.clip();
      ctx.drawImage(img, 100, 310, 880, 780);
      ctx.restore();

      // Border around image
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 6;
      roundRect(ctx, 100, 310, 880, 780, 36, false, true);

      renderRemainingContent();
    };

    img.onerror = () => {
      // Fallback gray box if image fails to load
      ctx.fillStyle = '#1e293b';
      roundRect(ctx, 100, 310, 880, 780, 36, true, false);
      renderRemainingContent();
    };
  });
};

// Helper: Rounded Rectangle
function roundRect(ctx, x, y, width, height, radius = 10, fill = false, stroke = false, strokeColor = '#334155') {
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
    ctx.stroke();
  }
}

// Helper: Text wrap
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