/**
 * 🌟 Aapke Kareeb • Unified WhatsApp Share & 9:16 Story Poster Generator
 */

export function buildShareCopy(item, selectedCity = 'Alwar') {
  if (!item) return '';

  const rawTitle = (item.title || item.name || 'लोकल ऑफर').trim();
  const price = (item.price || item.deal_price || item.rent || item.rates || '').trim();
  const location = (item.location || selectedCity).trim();
  const phone = String(item.phone || item.contact || '').replace(/\D/g, '').slice(-10);
  const cat = String(item.category || item.category_id || '').toLowerCase();

  // Clean seller name
  let seller = (item.sellerName || item.provider_name || item.driverName || '').trim();
  if (!seller || seller === rawTitle) {
    seller = rawTitle.includes('(') ? rawTitle.split('(')[0].trim() : 'Verified Merchant';
  }

  const cleanCity = String(selectedCity).replace(/\s*Tehsil/i, '').trim();
  
  // Use live domain to ensure WhatsApp renders it as a blue clickable link
  const domain = window.location.origin.includes('localhost')
    ? 'https://apkekareeb.vercel.app'
    : window.location.origin;
    
  const itemUrl = `${domain}/?id=${encodeURIComponent(item.id || '')}`;

  // 1. Property & Rentals
  if (cat.includes('property') || cat.includes('makaan') || cat.includes('plot') || cat.includes('rent')) {
    return `🏡 *[${cleanCity}] प्रॉपर्टी अपडेट*

📌 *${rawTitle}*
💰 *दाम / किराया:* ${price || 'बातचीत अनुसार'}
📍 *लोकेशन:* ${location}
👤 *संपर्क:* ${seller}
${phone ? `📞 *कॉल / WhatsApp:* +91 ${phone}\n` : ''}
_Aapke Kareeb • ${cleanCity} का अपना डिजिटल बाज़ार_

👇 *फोटो व पूरी डिटेल के लिए नीचे दिए गए ब्लू लिंक पर क्लिक करें:*
${itemUrl}`;
  }

  // 2. Kaarigar & Doorstep Services
  if (cat.includes('kaarigar') || cat.includes('mistri') || cat.includes('service') || cat.includes('plumb') || cat.includes('electric')) {
    return `🛠️ *[${cleanCity}] कारीगर / मिस्त्री सेवा*

🔧 *${rawTitle}*
⚡ *चार्ज:* ${price || 'किफायती दरें'}
📍 *उपलब्ध क्षेत्र:* ${location}
👤 *कारीगर:* ${seller}
${phone ? `📞 *संपर्क:* +91 ${phone}\n` : ''}
_Aapke Kareeb • 0% कमिशन लोकल सर्विस_

👇 *रेट लिस्ट व प्रोफाइल देखने के लिए नीचे दिए गए ब्लू लिंक पर क्लिक करें:*
${itemUrl}`;
  }

  // 3. Second Hand / ReCommerce
  if (cat.includes('recommerce') || cat.includes('purana') || cat.includes('used') || cat.includes('second')) {
    return `📦 *[${cleanCity}] पुराना सामान अर्जेंट सेल*

🏷️ *${rawTitle}*
💰 *रेट:* ${price || 'बेस्ट रेट'}
📍 *पिकअप:* ${location}
👤 *विक्रेता:* ${seller}
${phone ? `📞 *संपर्क:* +91 ${phone}\n` : ''}
_Aapke Kareeb • अपने मोहल्ले में खरीदें और बेचें_

👇 *फोटो व कंडीशन देखने के लिए नीचे दिए गए ब्लू लिंक पर क्लिक करें:*
${itemUrl}`;
  }

  // 4. Default: Showrooms, Retail, Food, Creators & Local Deals
  return `🔥 *[${cleanCity}] स्पेशल लोकल ऑफर!*

✨ *${rawTitle}*
🏷️ *ऑफर प्राइस:* ${price || 'Best Deal'}
📍 *स्टोर:* ${seller}, ${location}
${phone ? `📞 *संपर्क:* +91 ${phone}\n` : ''}
_Aapke Kareeb • वोकल फॉर लोकल ${cleanCity}_

👇 *फोटो, वीडियो व स्टोर देखने के लिए नीचे दिए गए ब्लू लिंक पर क्लिक करें:*
${itemUrl}`;
}

export async function shareListingToWhatsApp(item, selectedCity = 'Alwar') {
  if (!item) return;
  const messageText = buildShareCopy(item, selectedCity);

  if (navigator.share) {
    try {
      await navigator.share({
        title: item.title || 'Aapke Kareeb',
        text: messageText,
      });
      return;
    } catch {}
  }

  window.open(`https://wa.me/?text=${encodeURIComponent(messageText)}`, '_blank');
}