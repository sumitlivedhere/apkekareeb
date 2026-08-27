/**
 * 🌟 Context-Aware WhatsApp Copywriter & 9:16 Story Poster Generator
 * Formats tailored local copy based on category & fixes URL duplication.
 */

export function buildShareCopy(item, selectedCity = 'Alwar') {
  if (!item) return '';

  const title = (item.title || item.name || 'लोकल ऑफर').trim();
  const price = (item.price || item.deal_price || item.rent || item.rates || '').trim();
  const location = (item.location || selectedCity).trim();
  const seller = (item.sellerName || item.provider_name || item.driverName || 'लोकल विक्रेता').trim();
  const phone = String(item.phone || item.contact || '').replace(/\D/g, '').slice(-10);
  const cat = String(item.category || item.category_id || '').toLowerCase();
  
  // Clean single URL
  const itemUrl = `${window.location.origin}/?id=${encodeURIComponent(item.id || '')}`;

  // 1. Property / Rentals / Plots
  if (cat.includes('property') || cat.includes('makaan') || cat.includes('plot') || cat.includes('rent')) {
    return `🏡 *[${selectedCity}] नया मकान / प्रॉपर्टी अपडेट*

📌 *${title}*
💰 *दाम / किराया:* ${price || 'बातचीत अनुसार'}
📍 *लोकेशन:* ${location}
👤 *संपर्क:* ${seller} (0% ब्रोकरेज • डायरेक्ट डील)
${phone ? `📞 *कॉल / WhatsApp:* +91 ${phone}\n` : ''}
👉 *फोटो, लोकेशन व पूरी डिटेल यहाँ देखें:*
${itemUrl}

_Aapke Kareeb • ${selectedCity} का अपना डिजिटल बाज़ार_`;
  }

  // 2. Kaarigar / Skilled Trade & Repair Services
  if (cat.includes('kaarigar') || cat.includes('mistri') || cat.includes('service') || cat.includes('plumb') || cat.includes('electric')) {
    return `🛠️ *[${selectedCity}] कुशल कारीगर / मिस्त्री सेवा*

🔧 *${title}*
⚡ *विज़िटिंग चार्ज / रेट:* ${price || 'किफायती दरें'}
📍 *उपलब्ध क्षेत्र:* ${location}
👤 *कारीगर:* ${seller}
${phone ? `📞 *सीधे कॉल करें:* +91 ${phone}\n` : ''}
👉 *रेट लिस्ट, अनुभव व रिव्यु देखें:*
${itemUrl}

_0% कमिशन • सीधे कारीगर को डायरेक्ट पेमेंट करें_`;
  }

  // 3. Second Hand / ReCommerce
  if (cat.includes('recommerce') || cat.includes('purana') || cat.includes('used') || cat.includes('second')) {
    return `📦 *[${selectedCity}] पुराना सामान अर्जेंट सेल*

🏷️ *${title}*
💰 *डिमांड रेट:* ${price || 'बेस्ट रेट'}
📍 *पिकअप लोकेशन:* ${location}
👤 *विक्रेता:* ${seller}
${phone ? `📞 *खरीदने के लिए संपर्क:* +91 ${phone}\n` : ''}
👉 *ओरिजिनल फोटो व कंडीशन यहाँ देखें:*
${itemUrl}

_Aapke Kareeb • अपने मोहल्ले में सीधे खरीदें और बेचें_`;
  }

  // 4. Vehicles / Automobiles / Showrooms
  if (cat.includes('vehicle') || cat.includes('auto') || cat.includes('car') || cat.includes('bike')) {
    return `🚗 *[${selectedCity}] गाड़ी / वाहन सेल अपडेट*

✨ *${title}*
🏷️ *डिमांड / ऑन-रोड प्राइस:* ${price || 'बेस्ट डील'}
📍 *शोरूम / लोकेशन:* ${seller}, ${location}
${phone ? `📞 *टेस्ट ड्राइव / पूछताछ:* +91 ${phone}\n` : ''}
👉 *स्पेसिफिकेशन, फोटो व वीडियो देखें:*
${itemUrl}

_Aapke Kareeb • सीधे डीलर से बिना बिचौलिए के खरीदें_`;
  }

  // 5. Default: Retail, Fashion, Food, Gym & Local Deals
  return `🔥 *[${selectedCity}] स्पेशल लोकल ऑफर!*

✨ *${title}*
🏷️ *ऑफर प्राइस:* ${price || 'Best Deal'}
📍 *दुकान / स्टोर:* ${seller}, ${location}
${phone ? `📞 *कॉल / WhatsApp:* +91 ${phone}\n` : ''}
👉 *फोटो, वीडियो व पूरा विवरण देखें:*
${itemUrl}

_Aapke Kareeb • वोकल फॉर लोकल ${selectedCity}_`;
}

// 💬 1. Clean Native Share & WhatsApp Direct Intent (Prevents Double URL Bug)
export const shareListingToWhatsApp = async (item, selectedCity = 'Alwar') => {
  if (!item) return;

  const messageText = buildShareCopy(item, selectedCity);

  if (navigator.share) {
    try {
      // Pass URL inside text alone to prevent mobile browsers from appending duplicate links
      await navigator.share({
        title: item.title || 'Aapke Kareeb',
        text: messageText,
      });
      return;
    } catch {
      // User cancelled or unsupported; fall back to WhatsApp intent
    }
  }

  window.open(`https://wa.me/?text=${encodeURIComponent(messageText)}`, '_blank');
};

// 🎨 2. 9:16 High-Resolution WhatsApp Story Poster Generator
export const generateStatusPosterBlob = (item, selectedCity = 'Alwar') => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920; // 9:16 vertical standard
    const ctx = canvas.getContext('2d');

    // 1. Dark Modern Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 1920);
    bgGrad.addColorStop(0, '#1e1b4b'); // deep indigo
    bgGrad.addColorStop(0.4, '#0f172a'); // slate-900
    bgGrad.addColorStop(1, '#020617'); // slate-950
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1920);

    // 2. Ambient Color Aura
    ctx.save();
    const glow1 = ctx.createRadialGradient(240, 280, 20, 240, 280, 500);
    glow1.addColorStop(0, 'rgba(245, 158, 11, 0.28)');
    glow1.addColorStop(1, 'transparent');
    ctx.fillStyle = glow1;
    ctx.beginPath();
    ctx.arc(240, 280, 500, 0, Math.PI * 2);
    ctx.fill();

    const glow2 = ctx.createRadialGradient(840, 1400, 20, 840, 1400, 500);
    glow2.addColorStop(0, 'rgba(6, 182, 212, 0.22)');
    glow2.addColorStop(1, 'transparent');
    ctx.fillStyle = glow2;
    ctx.beginPath();
    ctx.arc(840, 1400, 500, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3. Top Header App Brand
    ctx.fillStyle = '#dc2626'; // Red Badge
    roundRect(ctx, 120, 80, 840, 68, 20, true);
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🔥 DHAMAKA LOCAL OFFER', 540, 126);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 46px sans-serif';
    ctx.fillText('AAPKE KAREEB • आपके करीब', 540, 208);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '700 28px sans-serif';
    ctx.fillText(`📍 ${selectedCity} का अपना लोकल डिजिटल बाज़ार`, 540, 255);

    // 4. Resolve & Draw Listing Photo
    const rawImg =
      (Array.isArray(item?.images) && item?.images[0]) ||
      (Array.isArray(item?.image_urls) && item?.image_urls[0]) ||
      item?.image ||
      item?.photo ||
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=700';

    const imgSrc = typeof rawImg === 'string' ? rawImg : rawImg?.url || '';

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imgSrc;

    const renderRemainingContent = () => {
      // 5. Category Tag Pill
      const catText = String(item?.subCategory || item?.category || 'SPECIAL OFFER').toUpperCase();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      roundRect(ctx, 100, 1140, 880, 56, 16, true);
      ctx.fillStyle = '#fbbf24';
      ctx.font = '900 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`⚡ ${catText}`, 540, 1177);

      // 6. Main Listing Title
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 52px sans-serif';
      const fullTitle = item?.title || item?.name || 'Special Listing';
      const titleLines = wrapText(ctx, fullTitle, 860);
      let textY = 1265;
      titleLines.slice(0, 2).forEach((line) => {
        ctx.fillText(line, 540, textY);
        textY += 66;
      });

      // 7. Big Price Badge
      const priceText = String(
        item?.price || item?.deal_price || item?.rent || item?.rates || 'Best Price'
      );
      ctx.fillStyle = '#f59e0b';
      roundRect(ctx, 220, textY + 20, 640, 105, 30, true);
      ctx.fillStyle = '#020617';
      ctx.font = '900 54px sans-serif';
      ctx.fillText(priceText, 540, textY + 92);

      // 8. Merchant / Direct Call Banner
      const sellerName = item?.sellerName || item?.provider_name || 'Verified Merchant';
      const phone = String(item?.phone || item?.contact || '9876543210')
        .replace(/\D/g, '')
        .slice(-10);

      const footerBoxY = 1530;
      ctx.fillStyle = '#0f172a';
      roundRect(ctx, 90, footerBoxY, 900, 210, 32, true, true, 'rgba(245, 158, 11, 0.4)');

      ctx.fillStyle = '#38bdf8'; // sky-400
      ctx.font = '800 30px sans-serif';
      ctx.fillText(`👤 ${sellerName} • डायरेक्ट डील (0% कमिशन)`, 540, footerBoxY + 62);

      ctx.fillStyle = '#10b981'; // emerald-400
      ctx.font = '900 48px sans-serif';
      ctx.fillText(`📞 WhatsApp / Call: +91 ${phone}`, 540, footerBoxY + 135);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '700 24px sans-serif';
      ctx.fillText(`📍 ${item?.location || selectedCity}`, 540, footerBoxY + 182);

      // 9. Bottom App Watermark
      ctx.fillStyle = '#64748b';
      ctx.font = '700 26px sans-serif';
      ctx.fillText('🔗 Aapke Kareeb ऐप पर पूरा कैटलॉग देखें • No Middlemen', 540, 1835);

      // Output Blob & DataUrl
      canvas.toBlob((blob) => {
        resolve({ blob, dataUrl: canvas.toDataURL('image/png') });
      }, 'image/png');
    };

    img.onload = () => {
      ctx.save();
      roundRect(ctx, 100, 300, 880, 800, 36, false);
      ctx.clip();
      ctx.drawImage(img, 100, 300, 880, 800);
      ctx.restore();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 6;
      roundRect(ctx, 100, 300, 880, 800, 36, false, true);

      renderRemainingContent();
    };

    img.onerror = () => {
      ctx.fillStyle = '#1e293b';
      roundRect(ctx, 100, 300, 880, 800, 36, true);
      renderRemainingContent();
    };
  });
};

// 🛠️ Helper: Canvas Rounded Rectangle
function roundRect(ctx, x, y, width, height, radius = 16, fill = false, stroke = false, strokeColor = '#334155') {
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

// 🛠️ Helper: Text Wrap
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