import { TAXONOMY_REGISTRY } from '../data/taxonomyRegistry';
import { CITY_ZONES } from '../data/cityZones';
import { parseNumericPrice } from '../store/hyperlocalStore';

// 🔥 Quick-Tap Trending Searches for Alwar
export const TRENDING_SEARCH_CHIPS = [
  { label: 'Plumber / मिस्त्री', query: 'Plumber', icon: '🛠️', category: 'kaarigar' },
  { label: '2 BHK Flat', query: '2 BHK Flat', icon: '🏢', category: 'property' },
  { label: 'Newly Open', query: 'Newly Open', icon: '🎊', category: 'market' },
  { label: 'Sariska / Fun', query: 'Sariska', icon: '🎡', category: 'travel' },
  { label: 'Doctors & Clinics', query: 'Doctor', icon: '🏥', category: 'medical' },
  { label: 'Box Cricket Turf', query: 'Turf', icon: '🏏', category: 'travel' },
  { label: 'Restaurants & Cafe', query: 'Restaurant', icon: '🍽️', category: 'restaurants' },
  { label: 'Tempo / Loader', query: 'Tempo', icon: '🚚', category: 'transporters' },
];

// 🧠 Bilingual (English + Hindi + Hinglish) Category & Subcategory Intent Dictionary
export const CATEGORY_SYNONYMS = {
  kaarigar: {
    title: 'Kaarigar & Mistri',
    hindi: 'कारीगर व मिस्त्री सेवा',
    icon: '🛠️',
    keywords: [
      'kaarigar', 'karigar', 'mistri', 'plumber', 'plumbing', 'nal', 'pipe', 'water tank',
      'electrician', 'bijli', 'wiring', 'inverter', 'carpenter', 'badhai', 'woodwork',
      'painter', 'painting', 'putty', 'ac repair', 'air conditioner', 'fridge repair',
      'washing machine repair', 'ro service', 'water purifier', 'cctv', 'welder', 'welding',
      'mason', 'rajmistri', 'tile mistri', 'mechanic', 'solar', 'pest control', 'cleaning',
      'कारीगर', 'मिस्त्री', 'प्लंबर', 'नल', 'इलेक्ट्रीशियन', 'बिजली', 'बढ़ई', 'पेंटर', 'एसी रिपेयर', 'राजमिस्त्री',
    ],
  },
  property: {
    title: 'Property & Real Estate',
    hindi: 'प्रॉपर्टी व रियल एस्टेट',
    icon: '🏢',
    keywords: [
      'property', 'real estate', 'flat', 'apartment', '1 bhk', '2 bhk', '3 bhk', '4 bhk',
      '1bhk', '2bhk', '3bhk', 'rent', 'kiraya', 'kiraye', 'rental', 'house', 'makan', 'ghar',
      'villa', 'kothi', 'independent house', 'plot', 'land', 'jameen', 'zameen', 'bigha',
      'patta', 'uit plot', 'commercial', 'shop for rent', 'dukan', 'showroom space', 'office space',
      'godown', 'warehouse', 'pg', 'hostel', 'boys pg', 'girls pg', 'room for rent',
      'प्रॉपर्टी', 'मकान', 'घर', 'फ्लैट', 'किराये', 'प्लॉट', 'जमीन', 'कोठी', 'दुकान', 'पीजी', 'हॉस्टल',
    ],
  },
  market: {
    title: 'Newly Open',
    hindi: 'नए खुले व्यापार व स्टोर (प्रचार)',
    icon: '🎊',
    keywords: [
      'newly open', 'new open', 'new shop', 'new store', 'new business', 'grand opening',
      'inauguration', 'launch', 'spotlight', 'new showroom', 'new cafe', 'featured business',
      'नया स्टोर', 'नई दुकान', 'नया व्यापार', 'उद्घाटन', 'नए खुले',
    ],
  },
  travel: {
    title: 'Fun & Travel',
    hindi: 'घूमना-फिरना, मनोरंजन व पर्यटन',
    icon: '🎡',
    keywords: [
      'fun', 'travel', 'tourism', 'tourist', 'activity', 'activities', 'adventure',
      'sariska', 'safari', 'tiger reserve', 'gypsy', 'siliserh', 'boating', 'speed boat',
      'jet ski', 'lake', 'bala quila', 'fort', 'bhangarh', 'garbhaji', 'pandupol',
      'moosi maharani', 'turf', 'box cricket', 'cricket turf', 'pickleball', 'football turf',
      'gaming', 'arcade', 'bowling', 'water park', 'resort', 'pool', 'swimming pool',
      'farm stay', 'farmhouse', 'camping', 'bonfire', 'day out', 'weekend', 'tour',
      'tour operator', 'guide', 'sightseeing', 'picnic',
      'घूमना', 'मनोरंजन', 'पर्यटन', 'सरिस्का', 'सफारी', 'सिलीसेढ़', 'बोटिंग', 'बाला किला', 'भानगढ़', 'रिसॉर्ट', 'पूल', 'क्रिकेट', 'टूर',
    ],
  },
  transporters: {
    title: 'Transporters / Loading',
    hindi: 'ट्रांसपोर्ट व माल ढुलाई',
    icon: '🚚',
    keywords: [
      'transporter', 'transport', 'loading', 'loader', 'tempo', 'chota hathi', 'pickup',
      'bolero pickup', 'truck', 'mini truck', 'packers', 'movers', 'shifting', 'relocation',
      'cargo', 'freight', 'logistics', 'bajaj maxima', 'goods carrier', 'maal dhulai',
      'ट्रांसपोर्ट', 'लोडिंग', 'टेम्पो', 'ट्रक', 'पैकर्स', 'मूवर्स', 'शिफ्टिंग', 'माल ढुलाई', 'छोटा हाथी',
    ],
  },
  malls: {
    title: 'Malls & Showrooms',
    hindi: 'मॉल्स व रिटेल शोरूम',
    icon: '🛍️',
    keywords: [
      'mall', 'malls', 'showroom', 'retail', 'supermarket', 'hypermarket', 'brand store',
      'shopping center', 'complex', 'franchise', 'multibrand', 'outlet',
      'मॉल', 'शोरूम', 'सुपरमार्केट', 'शॉपिंग',
    ],
  },
  restaurants: {
    title: 'Restaurants & Food',
    hindi: 'रेस्टोरेंट व खान-पान',
    icon: '🍽️',
    keywords: [
      'restaurant', 'food', 'cafe', 'coffee', 'dhaba', 'bhojnalaya', 'thali', 'dinner',
      'lunch', 'breakfast', 'fast food', 'pizza', 'burger', 'momos', 'chaat', 'sweets',
      'mithai', 'kalakand', 'alwar mawa', 'bakery', 'cake', 'pastry', 'tiffin', 'mess',
      'home food', 'ice cream', 'juice', 'family restaurant', 'rooftop',
      'रेस्टोरेंट', 'खाना', 'कैफे', 'ढाबा', 'थाली', 'टिफिन', 'बेकरी', 'केक', 'मिठाई', 'कलाकंद', 'फास्ट फूड',
    ],
  },
  medical: {
    title: 'Doctors & Healthcare',
    hindi: 'चिकित्सा व डॉक्टर सेवा',
    icon: '🏥',
    keywords: [
      'doctor', 'hospital', 'clinic', 'medical', 'healthcare', 'dentist', 'dental',
      'orthopedic', 'pediatrician', 'child specialist', 'gynecologist', 'skin specialist',
      'dermatologist', 'eye specialist', 'ent', 'physician', 'surgeon', 'physiotherapy',
      'chemist', 'pharmacy', 'medicine', 'dawai', 'pathology', 'lab', 'blood test',
      'xray', 'ultrasound', 'mri', 'ct scan', 'ambulance', 'nursing', 'ayurvedic', 'homeopathic',
      'डॉक्टर', 'अस्पताल', 'क्लिनिक', 'मेडिकल', 'दवाई', 'डेंटिस्ट', 'दांत', 'लैब', 'जांच', 'एम्बुलेंस',
    ],
  },
  fitness: {
    title: 'Gym & Fitness',
    hindi: 'जिम व फिटनेस सेंटर',
    icon: '🏋️',
    keywords: [
      'gym', 'fitness', 'workout', 'yoga', 'zumba', 'aerobics', 'crossfit', 'personal trainer',
      'weight loss', 'bodybuilding', 'mma', 'boxing', 'martial arts', 'karate', 'swimming',
      'जिम', 'फिटनेस', 'योगा', 'जुम्बा', 'कसरत',
    ],
  },
  education: {
    title: 'Coaching & Schools',
    hindi: 'कोचिंग व शिक्षण संस्थान',
    icon: '📚',
    keywords: [
      'education', 'coaching', 'school', 'college', 'tuition', 'home tutor', 'library',
      'study room', 'reading room', 'neet', 'jee', 'iit', 'ras', 'ias', 'ssc', 'bank exam',
      'reet', 'computer course', 'tally', 'coding', 'spoken english', 'ielts', 'dance class',
      'music class', 'guitar', 'drawing', 'abacus', 'play school', ' preschool',
      'कोचिंग', 'स्कूल', 'ट्यूशन', 'लाइब्रेरी', 'पढ़ाई', 'कंप्यूटर',
    ],
  },
  shaadi: {
    title: 'Shaadi & Events',
    hindi: 'शादी व इवेंट्स',
    icon: '💍',
    keywords: [
      'shaadi', 'shadi', 'wedding', 'marriage', 'marriage garden', 'banquet hall', 'resort wedding',
      'tent house', 'caterer', 'catering', 'halwai', 'photographer', 'pre wedding', 'videographer',
      'drone', 'dj', 'band', 'ghodi', 'dhol', 'makeup artist', 'bridal makeup', 'beauty parlour',
      'salon', 'mehendi', 'choreographer', 'event planner', 'decorator', 'flower decoration',
      'sherwani', 'lehenga', 'invitation card',
      'शादी', 'विवाह', 'मैरिज गार्डन', 'टेंट', 'हलवाई', 'कैटरिंग', 'फोटोग्राफर', 'डीजे', 'बैंड', 'मेकअप', 'पार्लर',
    ],
  },
  vehicles: {
    title: 'Cars & Two-Wheelers',
    hindi: 'गाड़ी व बाइक बाज़ार',
    icon: '🚗',
    keywords: [
      'vehicle', 'vehicles', 'car', 'cars', 'bike', 'motorcycle', 'scooty', 'scooter',
      'activa', 'splendor', 'bullet', 'royal enfield', 'bolero', 'scorpio', 'thar', 'swift',
      'dzire', 'alto', 'wagonr', 'creta', 'brezza', 'tractor', 'e-rickshaw', 'auto',
      'second hand car', 'used car', 'used bike', 'car rental', 'taxi', 'cab', 'self drive',
      'गाड़ी', 'कार', 'बाइक', 'स्कूटी', 'बोलेरो', 'स्विफ्ट', 'ट्रैक्टर', 'टैक्सी',
    ],
  },
  creators: {
    title: 'Artists & Creators',
    hindi: 'स्थानीय कलाकार व रचनाकार',
    icon: '🎨',
    keywords: [
      'creator', 'artist', 'youtuber', 'influencer', 'vlogger', 'video editor', 'reel maker',
      'graphic designer', 'singer', 'musician', 'anchor', 'emcee', 'poet', 'painter artist',
      'sketch', 'handicraft', 'pottery', 'studio', 'podcast',
      'कलाकार', 'क्रिएटर', 'यूट्यूबर', 'सिंगर', 'डिजाइनर',
    ],
  },
  advertising: {
    title: 'Flex, Hoardings & Ads',
    hindi: 'प्रचार व विज्ञापन',
    icon: '📢',
    keywords: [
      'advertising', 'ads', 'flex', 'banner', 'hoarding', 'printing', 'digital printing',
      'visiting card', 'pamphlet', 'brochure', 'led board', 'glow sign', 'acrylic board',
      'auto branding', 'wall painting', 'social media marketing', 'prachar',
      'प्रचार', 'विज्ञापन', 'फ्लेक्स', 'बैनर', 'होर्डिंग', 'प्रिंटिंग',
    ],
  },
  construction: {
    title: 'Building & Construction',
    hindi: 'भवन निर्माण सामग्री',
    icon: '🏗️',
    keywords: [
      'construction', 'building material', 'cement', 'bajri', 'rodi', 'sand', 'bricks',
      'eent', 'tmt bar', 'sariya', 'iron', 'steel', 'tiles', 'marble', 'granite', 'kota stone',
      'sanitary', 'pipes', 'hardware', 'plywood', 'glass', 'aluminium', 'upvc', 'jcb',
      'contractor', 'thekedar', 'architect', 'civil engineer',
      'निर्माण', 'सीमेंट', 'बजरी', 'रोड़ी', 'ईंट', 'सरिया', 'टाइल्स', 'मार्बल', 'हार्डवेयर', 'ठेकेदार',
    ],
  },
  recommerce: {
    title: 'Purana Bazaar / 2nd Hand',
    hindi: 'पुराना सामान खरीद-बिक्री',
    icon: '♻️',
    keywords: [
      'recommerce', 'purana bazaar', 'second hand', '2nd hand', 'used', 'old item', 'purana',
      'refurbished', 'olx', 'sell old', 'buy used', 'second hand mobile', 'used furniture',
      'पुराना सामान', 'सेकंड हैंड', 'पुराना बाज़ार',
    ],
  },
  festival: {
    title: 'Festival Offers & Melas',
    hindi: 'त्योहार व मेला ऑफर्स',
    icon: '🪔',
    keywords: [
      'festival', 'offer', 'mela', 'diwali', 'holi', 'rakhi', 'navratri', 'eid', 'christmas',
      'sale', 'discount', 'combo offer', 'bumper sale', 'exhibition', 'bazaar',
      'त्योहार', 'मेला', 'ऑफर', 'दिवाली', 'होली', 'सेल', 'छूट',
    ],
  },
  community: {
    title: 'Community Drives',
    hindi: 'सामाजिक पहल व जनसेवा',
    icon: '🤝',
    keywords: [
      'community', 'ngo', 'social work', 'blood donation', 'tree plantation', 'cleanliness',
      'gaushala', 'animal rescue', 'charity', 'langar', 'bhandara', 'free camp', 'volunteer',
      'सामाजिक', 'जनसेवा', 'रक्तदान', 'गौशाला', 'भंडारा', 'सेवा',
    ],
  },
  'white-collar': {
    title: 'Jobs & Consultants',
    hindi: 'रोजगार व पेशेवर सलाहकार',
    icon: '💼',
    keywords: [
      'job', 'jobs', 'vacancy', 'hiring', 'recruitment', 'naukri', 'rozgar', 'part time',
      'full time', 'work from home', 'ca', 'chartered accountant', 'gst', 'itr', 'tax',
      'lawyer', 'advocate', 'vakeel', 'notary', 'legal', 'consultant', 'loan', 'home loan',
      'insurance', 'lic', 'real estate agent', 'vastu', 'astrologer', 'pandit',
      'नौकरी', 'रोजगार', 'वकील', 'सीए', 'लोन', 'बीमा', 'सलाहकार',
    ],
  },
  electronics: {
    title: 'Electronics & Mobile',
    hindi: 'इलेक्ट्रॉनिक्स व मोबाइल',
    icon: '📱',
    keywords: [
      'electronics', 'mobile', 'smartphone', 'iphone', 'samsung', 'vivo', 'oppo', 'xiaomi',
      'laptop', 'computer', 'pc', 'printer', 'tv', 'smart tv', 'led tv', 'fridge', 'refrigerator',
      'ac', 'cooler', 'washing machine', 'microwave', 'geyser', 'inverter battery', 'speaker',
      'headphones', 'accessories', 'mobile repair',
      'इलेक्ट्रॉनिक्स', 'मोबाइल', 'लैपटॉप', 'कंप्यूटर', 'टीवी', 'फ्रिज', 'कूलर', 'बैटरी',
    ],
  },
  fashion: {
    title: 'Clothes & Boutique',
    hindi: 'कपड़े व फैशन बुटीक',
    icon: '👗',
    keywords: [
      'fashion', 'clothes', 'clothing', 'garments', 'boutique', 'saree', 'suit', 'salwar',
      'kurti', 'lehenga', 'menswear', 'shirt', 'jeans', 'trouser', ' ethnic wear', 'kids wear',
      'tailor', 'stitching', 'silai', 'shoes', 'footwear', 'sandals', 'jewellery', 'artificial jewellery',
      'cosmetics', 'bags', 'watches',
      'कपड़े', 'फैशन', 'बुटीक', 'साड़ी', 'सूट', 'कुर्ती', 'टेलर', 'सिलाई', 'जूते', 'ज्वेलरी',
    ],
  },
  furniture: {
    title: 'Furniture & Decor',
    hindi: 'फर्नीचर व सजावट',
    icon: '🪑',
    keywords: [
      'furniture', 'decor', 'home decor', 'sofa', 'sofa set', 'bed', 'double bed', 'palang',
      'mattress', 'gadda', 'dining table', 'chair', 'office chair', 'almirah', 'wardrobe',
      'dressing table', 'center table', 'modular kitchen', 'curtains', 'parde', 'carpet',
      'wallpaper', 'interior designer',
      'फर्नीचर', 'सोफा', 'पलंग', 'गद्दा', 'अलमारी', 'कुर्सी', 'पर्दे', 'सजावट',
    ],
  },
};

/**
 * Normalizes query text for consistent comparisons
 */
export function normalizeSearchText(str = '') {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 *Bounded Levenshtein distance for typo tolerance on tokens >= 4 chars
 */
function editDistance(a = '', b = '') {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  if (Math.abs(a.length - b.length) > 2) return 99;

  const matrix = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
}

function isFuzzyTokenMatch(queryToken, targetText) {
  if (!queryToken || !targetText) return false;
  if (targetText.includes(queryToken)) return true;
  if (queryToken.length < 4) return false;

  const targetWords = targetText.split(/\s+/);
  const maxAllowedDist = queryToken.length >= 6 ? 2 : 1;

  for (const word of targetWords) {
    if (word.length < 3) continue;
    if (word.startsWith(queryToken.slice(0, 3))) {
      if (editDistance(queryToken, word) <= maxAllowedDist) return true;
    }
  }
  return false;
}

/**
 * Extracts locality (colony) and max price constraints from natural queries
 * e.g., "2 bhk flat in budh vihar under 10000"
 */
export function parseQueryConstraints(rawQuery = '') {
  const clean = normalizeSearchText(rawQuery);
  let detectedZone = null;
  let maxBudget = null;

  // 1. Check Alwar colonies
  const zones = Object.keys(CITY_ZONES || {});
  for (const zone of zones) {
    const cleanZone = normalizeSearchText(zone);
    if (cleanZone && clean.includes(cleanZone)) {
      detectedZone = zone;
      break;
    }
  }

  // 2. Check budget ("under 10000", "below 5000")
  const budgetMatch = clean.match(/(?:under|below|upto|less than|तक)\s*₹?\s*(\d[\d,]*)/i);
  if (budgetMatch && budgetMatch[1]) {
    const val = parseInt(budgetMatch[1].replace(/,/g, ''), 10);
    if (!isNaN(val) && val > 0) maxBudget = val;
  }

  return { detectedZone, maxBudget };
}

/**
 * 🎯 Detects matching Categories & Subcategories for 1-Tap Smart Intent Routing
 */
export function detectSearchIntents(rawQuery = '') {
  const clean = normalizeSearchText(rawQuery);
  if (!clean) return [];

  const tokens = clean.split(' ').filter((t) => t.length >= 2);
  const intentMatches = [];

  Object.entries(CATEGORY_SYNONYMS).forEach(([catId, meta]) => {
    let score = 0;

    const catNameClean = normalizeSearchText(`${meta.title} ${meta.hindi}`);
    if (catNameClean.includes(clean)) score += 90;

    // Check synonym keywords
    for (const kw of meta.keywords) {
      const cleanKw = normalizeSearchText(kw);
      if (!cleanKw) continue;
      if (cleanKw === clean) {
        score += 100;
      } else if (clean.includes(cleanKw) || cleanKw.includes(clean)) {
        score += 65;
      } else {
        for (const tok of tokens) {
          if (tok.length >= 3 && (cleanKw.includes(tok) || isFuzzyTokenMatch(tok, cleanKw))) {
            score += 35;
          }
        }
      }
    }

    // Check subcategories in TAXONOMY_REGISTRY
    let matchedSubCategory = null;
    const taxCat = TAXONOMY_REGISTRY?.[catId];
    const subs = taxCat?.subCategories || taxCat?.subcategories || [];

    for (const sub of subs) {
      const subId = sub.id || sub.key || sub;
      const subName = typeof sub === 'string' ? sub : `${sub.name || ''} ${sub.hindiName || ''} ${sub.id || ''}`;
      const cleanSub = normalizeSearchText(subName);
      if (cleanSub && (cleanSub.includes(clean) || tokens.some((t) => t.length >= 3 && cleanSub.includes(t)))) {
        score += 75;
        if (!matchedSubCategory) {
          matchedSubCategory = {
            id: subId,
            name: (typeof sub === 'string' ? sub : sub.name || subId).split('(')[0].trim(),
          };
        }
      }
    }

    if (score > 0) {
      intentMatches.push({
        categoryId: catId,
        title: meta.title,
        hindi: meta.hindi,
        icon: meta.icon,
        subCategory: matchedSubCategory,
        score,
      });
    }
  });

  return intentMatches.sort((a, b) => b.score - a.score).slice(0, 4);
}

/**
 * 🔍 Scores a single listing against the search query + intent categories
 */
export function scoreListingMatch(item, rawQuery = '', matchedCategoryIds = new Set(), constraints = {}) {
  if (!item || item.is_active === false || item.has_pending_approval) return 0;

  const cleanQuery = normalizeSearchText(rawQuery);
  if (!cleanQuery) return 1;

  const stopWords = new Set(['in', 'at', 'near', 'for', 'on', 'the', 'and', 'alwar', 'under', 'below', 'में', 'के', 'पास']);
  const tokens = cleanQuery.split(' ').filter((t) => t.length >= 2 && !stopWords.has(t));
  if (tokens.length === 0) tokens.push(cleanQuery);

  const title = normalizeSearchText(item.title || item.name || '');
  const seller = normalizeSearchText(
    `${item.sellerName || ''} ${item.seller_name || ''} ${item.business_name || ''} ${item.providerName || ''} ${item.doctorName || ''}`
  );
  const category = normalizeSearchText(item.category || '');
  const subCategory = normalizeSearchText(
    `${item.subCategory || ''} ${item.sub_category || ''} ${item.trade || ''} ${item.profession || ''} ${item.cuisine || ''}`
  );
  const location = normalizeSearchText(`${item.location || ''} ${item.location_name || ''} ${item.landmark || ''}`);
  const description = normalizeSearchText(`${item.description || ''} ${item.deal_badge || ''} ${item.deal_details || ''} ${item.qualifications || ''}`);
  const priceStr = normalizeSearchText(String(item.price || item.rates || item.fee || ''));
  const phoneStr = String(item.phone || item.whatsapp || '');

  const fullHaystack = `${title} ${seller} ${category} ${subCategory} ${location} ${description} ${priceStr}`;

  let score = 0;

  // 1. Exact full phrase match
  if (title === cleanQuery) {
    score += 200;
  } else if (title.startsWith(cleanQuery)) {
    score += 150;
  } else if (title.includes(cleanQuery)) {
    score += 120;
  } else if (seller.includes(cleanQuery)) {
    score += 105;
  } else if (subCategory.includes(cleanQuery)) {
    score += 95;
  } else if (fullHaystack.includes(cleanQuery)) {
    score += 75;
  }

  // 2. Phone number search match
  const digitsOnly = cleanQuery.replace(/\D/g, '');
  if (digitsOnly.length >= 4 && phoneStr.includes(digitsOnly)) {
    score += 140;
  }

  // 3. Token-by-token scoring with fuzzy tolerance
  let matchedTokenCount = 0;
  for (const tok of tokens) {
    let tokenMatched = false;

    if (title.includes(tok)) {
      score += 55;
      tokenMatched = true;
    } else if (isFuzzyTokenMatch(tok, title)) {
      score += 40;
      tokenMatched = true;
    }

    if (seller.includes(tok)) {
      score += 45;
      tokenMatched = true;
    }

    if (subCategory.includes(tok) || category.includes(tok)) {
      score += 40;
      tokenMatched = true;
    }

    if (location.includes(tok)) {
      score += 35;
      tokenMatched = true;
    }

    if (description.includes(tok) || isFuzzyTokenMatch(tok, description)) {
      score += 25;
      tokenMatched = true;
    }

    if (tokenMatched) matchedTokenCount++;
  }

  // 4. Synonym / Intent Category Match (e.g., searching "मिस्त्री" or "नल" matches Kaarigar items)
  if (matchedCategoryIds.has(category)) {
    score += 45;
  }

  // If multiple tokens were typed and none matched directly or via category synonym, reject
  if (score === 0) return 0;
  if (tokens.length > 1 && matchedTokenCount === 0 && !matchedCategoryIds.has(category)) {
    return 0;
  }

  // 5. Locality Constraint Boost
  if (constraints.detectedZone) {
    const cleanZone = normalizeSearchText(constraints.detectedZone);
    if (location.includes(cleanZone)) {
      score += 50;
    }
  }

  // 6. Max Budget Constraint Filter
  if (constraints.maxBudget) {
    const numPrice = parseNumericPrice(String(item.price || item.rates || ''));
    if (numPrice > 0 && numPrice > constraints.maxBudget) {
      return 0;
    }
  }

  // 7. Quality & Promotion Tie-Breakers
  if (item.is_promoted || item.deal_type === 'PAID_PROMO') {
    score += 12;
  }
  if (Number(item.interestCount || 0) > 0) {
    score += Math.min(10, Number(item.interestCount || 0) * 0.2);
  }

  return score;
}

/**
 * 🚀 Master Unified Search Pipeline
 * Returns { intents, listings, totalCount, constraints }
 */
export function performUnifiedSearch(allListings = [], rawQuery = '', options = {}) {
  const {
    categoryFilter = 'all',
    localityFilter = 'all',
    sortBy = 'relevance',
    limit = 60,
  } = options;

  const cleanQuery = normalizeSearchText(rawQuery);
  const constraints = parseQueryConstraints(rawQuery);
  const intents = cleanQuery ? detectSearchIntents(rawQuery) : [];

  // Top intent category IDs (score >= 60) for semantic expansion
  const strongIntentCategoryIds = new Set(
    intents.filter((i) => i.score >= 60).map((i) => i.categoryId)
  );

  const scoredResults = [];

  for (const item of allListings) {
    if (!item || item.is_active === false || item.has_pending_approval) continue;

    // Optional explicit category filter
    if (categoryFilter && categoryFilter !== 'all') {
      if (String(item.category || '').toLowerCase() !== String(categoryFilter).toLowerCase()) {
        continue;
      }
    }

    // Optional explicit locality filter
    if (localityFilter && localityFilter !== 'all') {
      const locStr = `${item.location || ''} ${item.location_name || ''} ${item.landmark || ''}`.toLowerCase();
      if (!locStr.includes(localityFilter.toLowerCase())) {
        continue;
      }
    }

    if (!cleanQuery) {
      scoredResults.push({ item, score: 1 });
      continue;
    }

    const score = scoreListingMatch(item, rawQuery, strongIntentCategoryIds, constraints);
    if (score > 0) {
      scoredResults.push({ item, score });
    }
  }

  // Sort results
  scoredResults.sort((a, b) => {
    if (sortBy === 'price_asc') {
      const pA = parseNumericPrice(String(a.item.price || '')) || Infinity;
      const pB = parseNumericPrice(String(b.item.price || '')) || Infinity;
      return pA - pB;
    }
    if (sortBy === 'price_desc') {
      const pA = parseNumericPrice(String(a.item.price || '')) || 0;
      const pB = parseNumericPrice(String(b.item.price || '')) || 0;
      return pB - pA;
    }
    if (sortBy === 'popular') {
      return Number(b.item.interestCount || 0) - Number(a.item.interestCount || 0);
    }
    if (sortBy === 'rating') {
      return Number(b.item.rating || 5) - Number(a.item.rating || 5);
    }
    // Default: Relevance score descending
    if (b.score !== a.score) return b.score - a.score;
    return Number(b.item.interestCount || 0) - Number(a.item.interestCount || 0);
  });

  const finalListings = scoredResults.slice(0, limit).map((entry) => entry.item);

  return {
    intents,
    listings: finalListings,
    totalCount: scoredResults.length,
    constraints,
  };
}

// Backwards-compatible named exports
export function searchListings(allListings = [], query = '', options = {}) {
  return performUnifiedSearch(allListings, query, options).listings;
}

export function filterListingsByQuery(listings = [], query = '') {
  if (!query || !String(query).trim()) return listings;
  return performUnifiedSearch(listings, query, { limit: 200 }).listings;
}

export default {
  TRENDING_SEARCH_CHIPS,
  CATEGORY_SYNONYMS,
  normalizeSearchText,
  detectSearchIntents,
  scoreListingMatch,
  performUnifiedSearch,
  searchListings,
  filterListingsByQuery,
};