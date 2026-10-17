import { TAXONOMY_REGISTRY } from '../data/taxonomyRegistry';
import { CITY_ZONES } from '../data/cityZones';
import { parseNumericPrice } from '../store/hyperlocalStore';

// 🔥 Quick-Tap Trending Searches for Alwar
export const TRENDING_SEARCH_CHIPS = [
  { label: 'Plumber / मिस्त्री', query: 'Plumber', icon: '🛠️', category: 'kaarigar' },
  { label: '2 BHK Flat', query: '2 BHK Flat', icon: '🏢', category: 'property' },
  { label: 'Newly Open', query: 'Newly Open', icon: '🎊', category: 'market' },
  { label: 'Sariska Safari', query: 'Sariska', icon: '🎡', category: 'travel' },
  { label: 'Doctor / Clinic', query: 'Doctor', icon: '🏥', category: 'medical' },
  { label: 'Box Cricket Turf', query: 'Turf', icon: '🏏', category: 'travel' },
  { label: 'Restaurants & Cafe', query: 'Restaurant', icon: '🍽️', category: 'restaurants' },
  { label: 'Tempo / Loader', query: 'Tempo', icon: '🚚', category: 'transporters' },
];

// 🎯 Specific Term-Level Synonym Expansion (Maps Hindi/Hinglish/English to the exact service only, NOT the whole category)
const SPECIFIC_TERM_SYNONYMS = {
  plumber: ['plumber', 'plumbing', 'pipe', 'nal', 'tap', 'leakage', 'water tank', 'sanitary', 'प्लंबर', 'नल'],
  नल: ['plumber', 'plumbing', 'pipe', 'nal', 'tap', 'प्लंबर'],
  प्लंबर: ['plumber', 'plumbing', 'pipe', 'nal', 'प्लंबर'],

  electrician: ['electrician', 'electrical', 'wiring', 'inverter', 'switchboard', 'mcb', 'bijli', 'इलेक्ट्रीशियन', 'बिजली'],
  bijli: ['electrician', 'electrical', 'wiring', 'inverter', 'bijli', 'बिजली'],
  बिजली: ['electrician', 'electrical', 'wiring', 'inverter', 'bijli', 'बिजली'],

  carpenter: ['carpenter', 'woodwork', 'door repair', 'cupboard', 'badhai', 'बढ़ई', 'कारपेंटर'],
  badhai: ['carpenter', 'woodwork', 'badhai', 'बढ़ई'],

  painter: ['painter', 'painting', 'putty', 'whitewash', 'wall paint', 'asian paints', 'पेंटर', 'पुताई'],
  ac: ['ac repair', 'air conditioner', 'split ac', 'window ac', 'gas filling', 'cooling'],
  ro: ['ro', 'water purifier', 'kent', 'aquaguard', 'filter'],
  cctv: ['cctv', 'camera', 'security camera', 'dvr'],
  welder: ['welder', 'welding', 'iron gate', 'grill', 'fabrication', 'वेल्डिंग'],
  mason: ['mason', 'rajmistri', 'tile mistri', 'plaster', 'brickwork', 'राजमिस्त्री', 'चुनाई'],
  rajmistri: ['mason', 'rajmistri', 'tile', 'plaster', 'राजमिस्त्री'],

  flat: ['flat', 'apartment', 'bhk', '1bhk', '2bhk', '3bhk', 'फ्लैट'],
  bhk: ['bhk', '1bhk', '2bhk', '3bhk', 'flat', 'apartment', 'house', 'room'],
  plot: ['plot', 'land', 'bigha', 'sq yd', 'gaj', 'patta', 'uit', 'residential plot', 'प्लॉट', 'जमीन'],
  jameen: ['plot', 'land', 'bigha', 'agricultural', 'जमीन'],
  pg: ['pg', 'hostel', 'paying guest', 'student room', 'tiffin', 'पीजी', 'हॉस्टल'],
  hostel: ['pg', 'hostel', 'paying guest', 'room', 'हॉस्टल'],
  shop: ['shop', 'commercial', 'showroom', 'godown', 'office space', 'dukan', 'दुकान'],
  dukan: ['shop', 'commercial', 'showroom', 'dukan', 'दुकान'],
  rent: ['rent', 'rental', 'lease', 'kiraya', 'kiraye', 'किराये', 'किराया'],
  kiraya: ['rent', 'rental', 'kiraya', 'किराये'],

  sariska: ['sariska', 'safari', 'tiger', 'gypsy', 'kankwari', 'pandupol', 'सरिस्का', 'सफारी'],
  safari: ['sariska', 'safari', 'tiger', 'gypsy', 'wildlife', 'सफारी'],
  siliserh: ['siliserh', 'boating', 'speed boat', 'jet ski', 'lake', 'सिलीसेढ़'],
  boating: ['boating', 'boat', 'jet ski', 'siliserh', 'lake', 'बोटिंग'],
  turf: ['turf', 'box cricket', 'pickleball', 'football', 'arena', 'cricket'],
  cricket: ['turf', 'box cricket', 'cricket'],
  resort: ['resort', 'pool', 'farm stay', 'farmhouse', 'camping', 'day out', 'रिसॉर्ट'],

  tempo: ['tempo', 'loader', 'chota hathi', 'pickup', 'bolero pickup', 'bajaj maxima', 'goods', 'टेम्पो', 'लोडिंग'],
  loader: ['tempo', 'loader', 'chota hathi', 'pickup', 'loading', 'लोडिंग'],
  packers: ['packers', 'movers', 'shifting', 'relocation', 'household shifting', 'पैकर्स'],
  truck: ['truck', 'mini truck', 'transport', 'cargo', 'container', 'ट्रक'],

  doctor: ['doctor', 'dr', 'clinic', 'hospital', 'physician', 'specialist', 'md', 'mbbs', 'डॉक्टर', 'क्लिनिक'],
  डॉक्टर: ['doctor', 'dr', 'clinic', 'hospital', 'physician', 'डॉक्टर'],
  dentist: ['dentist', 'dental', 'tooth', 'rct', 'दांत', 'डेंटिस्ट'],
  lab: ['lab', 'pathology', 'blood test', 'diagnostic', 'xray', 'ultrasound', 'जांच'],
  chemist: ['chemist', 'pharmacy', 'medical store', 'medicine', 'dawai', 'दवाई'],

  restaurant: ['restaurant', 'dining', 'thali', 'dhaba', 'bhojnalaya', 'dinner', 'lunch', 'food', 'रेस्टोरेंट', 'ढाबा'],
  cafe: ['cafe', 'coffee', 'pizza', 'burger', 'fast food', 'bakery', 'कैफे'],
  tiffin: ['tiffin', 'mess', 'home food', 'thali', 'टिफिन'],

  gym: ['gym', 'fitness', 'workout', 'weights', 'crossfit', 'trainer', 'जिम'],
  yoga: ['yoga', 'zumba', 'aerobics', 'meditation', 'योगा'],

  coaching: ['coaching', 'institute', 'classes', 'neet', 'jee', 'ssc', 'ras', 'tuition', 'कोचिंग'],
  library: ['library', 'study room', 'reading room', 'desk', 'लाइब्रेरी'],

  car: ['car', 'suv', 'sedan', 'hatchback', 'bolero', 'scorpio', 'swift', 'dzire', 'alto', 'thar', 'creta', 'कार', 'गाड़ी'],
  bike: ['bike', 'motorcycle', 'scooty', 'scooter', 'activa', 'splendor', 'bullet', 'बाइक', 'स्कूटी'],
};

// Broad queries that intentionally ask for an entire category
const BROAD_CATEGORY_QUERIES = {
  kaarigar: ['kaarigar', 'karigar', 'mistri', 'कारीगर', 'मिस्त्री'],
  property: ['property', 'real estate', 'प्रॉपर्टी'],
  market: ['newly open', 'new open', 'new store', 'new business', 'नए खुले'],
  travel: ['fun', 'travel', 'tourism', 'tourist', 'fun & travel', 'घूमना', 'मनोरंजन', 'पर्यटन'],
  transporters: ['transporter', 'transporters', 'transport', 'ट्रांसपोर्ट'],
  malls: ['mall', 'malls', 'showroom', 'मॉल', 'शोरूम'],
  restaurants: ['food', 'restaurants', 'खाना'],
  medical: ['medical', 'healthcare', 'hospital', 'मेडिकल', 'अस्पताल'],
  fitness: ['fitness', 'फिटनेस'],
  education: ['education', 'school', 'स्कूल', 'शिक्षा'],
  shaadi: ['shaadi', 'shadi', 'wedding', 'event', 'events', 'शादी'],
  vehicles: ['vehicle', 'vehicles', 'वाहन'],
  creators: ['creator', 'creators', 'artist', 'artists', 'कलाकार'],
  advertising: ['advertising', 'ads', 'flex', 'printing', 'प्रचार', 'विज्ञापन'],
  construction: ['construction', 'building material', 'निर्माण'],
  recommerce: ['recommerce', 'purana bazaar', 'second hand', '2nd hand', 'पुराना सामान'],
  festival: ['festival', 'mela', 'offer', 'offers', 'त्योहार', 'मेला'],
  community: ['community', 'ngo', 'social work', 'जनसेवा'],
  'white-collar': ['job', 'jobs', 'consultant', 'consultants', 'naukri', 'नौकरी', 'रोजगार'],
  electronics: ['electronics', 'इलेक्ट्रॉनिक्स'],
  fashion: ['fashion', 'clothes', 'boutique', 'कपड़े', 'फैशन'],
  furniture: ['furniture', 'decor', 'फर्नीचर'],
};

// Metadata for Category Intent Cards
export const CATEGORY_SYNONYMS = {
  kaarigar: {
    title: 'Kaarigar & Mistri',
    hindi: 'कारीगर व मिस्त्री सेवा',
    icon: '🛠️',
    keywords: ['kaarigar', 'mistri', 'plumber', 'electrician', 'carpenter', 'painter', 'ac repair', 'ro', 'welder', 'rajmistri', 'कारीगर', 'मिस्त्री', 'प्लंबर'],
  },
  property: {
    title: 'Property & Real Estate',
    hindi: 'प्रॉपर्टी व रियल एस्टेट',
    icon: '🏢',
    keywords: ['property', 'flat', 'bhk', '2 bhk', '3 bhk', 'rent', 'house', 'villa', 'plot', 'land', 'shop', 'pg', 'hostel', 'प्रॉपर्टी', 'मकान', 'फ्लैट', 'प्लॉट'],
  },
  market: {
    title: 'Newly Open',
    hindi: 'नए खुले व्यापार व स्टोर (प्रचार)',
    icon: '🎊',
    keywords: ['newly open', 'new open', 'new shop', 'new store', 'grand opening', 'launch', 'नए खुले', 'नया स्टोर'],
  },
  travel: {
    title: 'Fun & Travel',
    hindi: 'घूमना-फिरना, मनोरंजन व पर्यटन',
    icon: '🎡',
    keywords: ['fun', 'travel', 'tourism', 'sariska', 'safari', 'siliserh', 'boating', 'turf', 'box cricket', 'resort', 'pool', 'bala quila', 'bhangarh', 'घूमना', 'सरिस्का', 'रिसॉर्ट'],
  },
  transporters: {
    title: 'Transporters / Loading',
    hindi: 'ट्रांसपोर्ट व माल ढुलाई',
    icon: '🚚',
    keywords: ['transporter', 'transport', 'loading', 'loader', 'tempo', 'chota hathi', 'pickup', 'truck', 'packers', 'movers', 'ट्रांसपोर्ट', 'टेम्पो', 'लोडिंग'],
  },
  malls: {
    title: 'Malls & Showrooms',
    hindi: 'मॉल्स व रिटेल शोरूम',
    icon: '🛍️',
    keywords: ['mall', 'malls', 'showroom', 'supermarket', 'retail', 'मॉल', 'शोरूम'],
  },
  restaurants: {
    title: 'Restaurants & Food',
    hindi: 'रेस्टोरेंट व खान-पान',
    icon: '🍽️',
    keywords: ['restaurant', 'food', 'cafe', 'dhaba', 'thali', 'pizza', 'bakery', 'cake', 'sweet', 'kalakand', 'tiffin', 'रेस्टोरेंट', 'कैफे', 'ढाबा', 'टिफिन'],
  },
  medical: {
    title: 'Doctors & Healthcare',
    hindi: 'चिकित्सा व डॉक्टर सेवा',
    icon: '🏥',
    keywords: ['doctor', 'hospital', 'clinic', 'medical', 'dentist', 'chemist', 'pharmacy', 'lab', 'blood test', 'xray', 'डॉक्टर', 'अस्पताल', 'मेडिकल'],
  },
  fitness: {
    title: 'Gym & Fitness',
    hindi: 'जिम व फिटनेस सेंटर',
    icon: '🏋️',
    keywords: ['gym', 'fitness', 'workout', 'yoga', 'zumba', 'crossfit', 'trainer', 'जिम', 'योगा'],
  },
  education: {
    title: 'Coaching & Schools',
    hindi: 'कोचिंग व शिक्षण संस्थान',
    icon: '📚',
    keywords: ['education', 'coaching', 'school', 'tuition', 'library', 'neet', 'jee', 'computer', 'कोचिंग', 'स्कूल', 'लाइब्रेरी'],
  },
  shaadi: {
    title: 'Shaadi & Events',
    hindi: 'शादी व इवेंट्स',
    icon: '💍',
    keywords: ['shaadi', 'wedding', 'marriage garden', 'tent', 'caterer', 'halwai', 'photographer', 'dj', 'makeup', 'parlour', 'शादी', 'मैरिज गार्डन'],
  },
  vehicles: {
    title: 'Cars & Two-Wheelers',
    hindi: 'गाड़ी व बाइक बाज़ार',
    icon: '🚗',
    keywords: ['vehicle', 'car', 'bike', 'scooty', 'bolero', 'scorpio', 'swift', 'tractor', 'taxi', 'cab', 'गाड़ी', 'कार', 'बाइक'],
  },
  creators: {
    title: 'Artists & Creators',
    hindi: 'स्थानीय कलाकार व रचनाकार',
    icon: '🎨',
    keywords: ['creator', 'artist', 'youtuber', 'influencer', 'video editor', 'singer', 'anchor', 'कलाकार'],
  },
  advertising: {
    title: 'Flex, Hoardings & Ads',
    hindi: 'प्रचार व विज्ञापन',
    icon: '📢',
    keywords: ['advertising', 'flex', 'banner', 'hoarding', 'printing', 'visiting card', 'led board', 'प्रचार', 'फ्लेक्स'],
  },
  construction: {
    title: 'Building & Construction',
    hindi: 'भवन निर्माण सामग्री',
    icon: '🏗️',
    keywords: ['construction', 'cement', 'bajri', 'bricks', 'sariya', 'tiles', 'marble', 'hardware', 'jcb', 'contractor', 'सीमेंट', 'मार्बल', 'ठेकेदार'],
  },
  recommerce: {
    title: 'Purana Bazaar / 2nd Hand',
    hindi: 'पुराना सामान खरीद-बिक्री',
    icon: '♻️',
    keywords: ['recommerce', 'purana bazaar', 'second hand', '2nd hand', 'used', 'old item', 'पुराना सामान'],
  },
  festival: {
    title: 'Festival Offers & Melas',
    hindi: 'त्योहार व मेला ऑफर्स',
    icon: '🪔',
    keywords: ['festival', 'offer', 'mela', 'diwali', 'holi', 'sale', 'discount', 'त्योहार', 'मेला'],
  },
  community: {
    title: 'Community Drives',
    hindi: 'सामाजिक पहल व जनसेवा',
    icon: '🤝',
    keywords: ['community', 'ngo', 'blood donation', 'gaushala', 'charity', 'bhandara', 'जनसेवा'],
  },
  'white-collar': {
    title: 'Jobs & Consultants',
    hindi: 'रोजगार व पेशेवर सलाहकार',
    icon: '💼',
    keywords: ['job', 'jobs', 'vacancy', 'ca', 'gst', 'lawyer', 'advocate', 'loan', 'insurance', 'नौकरी', 'वकील', 'सीए'],
  },
  electronics: {
    title: 'Electronics & Mobile',
    hindi: 'इलेक्ट्रॉनिक्स व मोबाइल',
    icon: '📱',
    keywords: ['electronics', 'mobile', 'iphone', 'samsung', 'laptop', 'computer', 'tv', 'fridge', 'cooler', 'मोबाइल', 'लैपटॉप'],
  },
  fashion: {
    title: 'Clothes & Boutique',
    hindi: 'कपड़े व फैशन बुटीक',
    icon: '👗',
    keywords: ['fashion', 'clothes', 'boutique', 'saree', 'suit', 'kurti', 'lehenga', 'tailor', 'shoes', 'jewellery', 'कपड़े', 'बुटीक'],
  },
  furniture: {
    title: 'Furniture & Decor',
    hindi: 'फर्नीचर व सजावट',
    icon: '🪑',
    keywords: ['furniture', 'sofa', 'bed', 'mattress', 'dining table', 'chair', 'almirah', 'modular kitchen', 'फर्नीचर', 'सोफा'],
  },
};

/**
 * Normalizes text into clean lowercase space-separated words
 */
export function normalizeSearchText(str = '') {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'•|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Bounded Levenshtein distance for typo tolerance on words >= 5 chars
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

/**
 * 🔒 Word-Boundary Safe Token Matcher
 * Prevents "ac" from matching "space" or "car" from matching "carpenter"
 */
function matchesWordInField(token = '', fieldWords = [], rawFieldText = '') {
  if (!token || !rawFieldText) return { matched: false, type: null };

  // Multi-word synonym phrase (e.g. "water tank", "box cricket", "2 bhk")
  if (token.includes(' ')) {
    const paddedField = ` ${rawFieldText} `;
    if (paddedField.includes(` ${token} `)) {
      return { matched: true, type: 'exact' };
    }
    return { matched: false, type: null };
  }

  for (const word of fieldWords) {
    if (!word) continue;
    // 1. Exact word match
    if (word === token) {
      return { matched: true, type: 'exact' };
    }
    // 2. Prefix match ONLY if token is >= 4 chars (e.g. "plumb" matches "plumber", but "car" does NOT match "carpenter")
    if (token.length >= 4 && word.startsWith(token)) {
      return { matched: true, type: 'prefix' };
    }
    // 3. Singular/plural match (e.g. "flats" <-> "flat", "doctors" <-> "doctor")
    if (token.length >= 4 && word.length >= 4) {
      if (token === `${word}s` || word === `${token}s`) {
        return { matched: true, type: 'exact' };
      }
    }
    // 4. Typo-tolerant fuzzy match ONLY on words >= 5 chars sharing the first 3 letters
    if (token.length >= 5 && word.length >= 5 && word.slice(0, 3) === token.slice(0, 3)) {
      if (editDistance(token, word) <= 1) {
        return { matched: true, type: 'fuzzy' };
      }
    }
  }

  return { matched: false, type: null };
}

/**
 * Extracts locality (colony) and max price constraints from natural queries
 */
export function parseQueryConstraints(rawQuery = '') {
  const clean = normalizeSearchText(rawQuery);
  let detectedZone = null;
  let maxBudget = null;

  const zones = Object.keys(CITY_ZONES || {});
  for (const zone of zones) {
    const cleanZone = normalizeSearchText(zone);
    if (cleanZone && ` ${clean} `.includes(` ${cleanZone} `)) {
      detectedZone = zone;
      break;
    }
  }

  const budgetMatch = clean.match(/(?:under|below|upto|less than|तक)\s*₹?\s*(\d[\d,]*)/i);
  if (budgetMatch && budgetMatch[1]) {
    const val = parseInt(budgetMatch[1].replace(/,/g, ''), 10);
    if (!isNaN(val) && val > 0) maxBudget = val;
  }

  return { detectedZone, maxBudget };
}

/**
 * 🎯 Detects matching Categories & Subcategories for the Top Intent Cards
 */
export function detectSearchIntents(rawQuery = '') {
  const clean = normalizeSearchText(rawQuery);
  if (!clean) return [];

  const tokens = clean.split(' ').filter((t) => t.length >= 2);
  const intentMatches = [];

  Object.entries(CATEGORY_SYNONYMS).forEach(([catId, meta]) => {
    let score = 0;

    const catWords = normalizeSearchText(`${meta.title} ${meta.hindi}`).split(' ');
    if (matchesWordInField(clean, catWords, normalizeSearchText(`${meta.title} ${meta.hindi}`)).matched) {
      score += 90;
    }

    for (const kw of meta.keywords) {
      const cleanKw = normalizeSearchText(kw);
      const kwWords = cleanKw.split(' ');
      if (cleanKw === clean) {
        score += 100;
      } else if (tokens.some((tok) => matchesWordInField(tok, kwWords, cleanKw).matched)) {
        score += 50;
      }
    }

    let matchedSubCategory = null;
    const taxCat = TAXONOMY_REGISTRY?.[catId];
    const subs = taxCat?.subCategories || taxCat?.subcategories || [];

    for (const sub of subs) {
      const subId = sub.id || sub.key || sub;
      const subName = typeof sub === 'string' ? sub : `${sub.name || ''} ${sub.hindiName || ''} ${sub.id || ''}`;
      const cleanSub = normalizeSearchText(subName);
      const subWords = cleanSub.split(' ');

      if (
        cleanSub &&
        (cleanSub.includes(clean) || tokens.some((t) => t.length >= 3 && matchesWordInField(t, subWords, cleanSub).matched))
      ) {
        score += 75;
        if (!matchedSubCategory) {
          matchedSubCategory = {
            id: subId,
            name: (typeof sub === 'string' ? sub : sub.name || subId).split('(')[0].trim(),
          };
        }
      }
    }

    if (score >= 50) {
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

  return intentMatches.sort((a, b) => b.score - a.score).slice(0, 3);
}

/**
 * 🔍 Strict Precision Listing Scorer
 * Only returns > 0 if the listing ACTUALLY matches the user's specific query terms.
 * Never dumps unrelated items from the same category!
 */
export function scoreListingMatch(item, rawQuery = '', constraints = {}) {
  if (!item || item.is_active === false || item.has_pending_approval) return 0;

  const cleanQuery = normalizeSearchText(rawQuery);
  if (!cleanQuery) return 1;

  // Normalize listing fields and pre-split into word arrays for fast boundary checks
  const titleText = normalizeSearchText(item.title || item.name || '');
  const titleWords = titleText.split(' ');

  const subCatText = normalizeSearchText(
    `${item.subCategory || ''} ${item.sub_category || ''} ${item.trade || ''} ${item.profession || ''} ${item.cuisine || ''} ${item.propertyType || ''}`
  );
  const subCatWords = subCatText.split(' ');

  const sellerText = normalizeSearchText(
    `${item.sellerName || ''} ${item.seller_name || ''} ${item.business_name || ''} ${item.providerName || ''} ${item.doctorName || ''}`
  );
  const sellerWords = sellerText.split(' ');

  const locationText = normalizeSearchText(`${item.location || ''} ${item.location_name || ''} ${item.landmark || ''}`);
  const locationWords = locationText.split(' ');

  const descText = normalizeSearchText(
    `${item.description || ''} ${item.deal_badge || ''} ${item.deal_details || ''} ${item.qualifications || ''}`
  );
  const descWords = descText.split(' ');

  const itemCat = normalizeSearchText(item.category || '');
  const phoneStr = String(item.phone || item.whatsapp || '');

  // Check Max Budget Filter first
  if (constraints.maxBudget) {
    const numPrice = parseNumericPrice(String(item.price || item.rates || ''));
    if (numPrice > 0 && numPrice > constraints.maxBudget) {
      return 0;
    }
  }

  // 1. Check if the user typed a broad category-level query (e.g. "Newly Open", "Fun & Travel", "Kaarigar", "Property")
  const broadQueriesForItemCat = BROAD_CATEGORY_QUERIES[itemCat] || [];
  const isBroadCategoryQuery = broadQueriesForItemCat.some((bq) => normalizeSearchText(bq) === cleanQuery);

  // 2. Phone number search match
  const digitsOnly = cleanQuery.replace(/\D/g, '');
  if (digitsOnly.length >= 5 && phoneStr.includes(digitsOnly)) {
    return 200;
  }

  // 3. Remove stop words & detected zone words so we can score the core search terms
  let remainingQuery = cleanQuery;
  if (constraints.detectedZone) {
    const cleanZone = normalizeSearchText(constraints.detectedZone);
    remainingQuery = remainingQuery.replace(cleanZone, ' ').trim();
  }

  const stopWords = new Set([
    'in', 'at', 'near', 'for', 'on', 'the', 'and', 'or', 'of', 'to', 'with',
    'alwar', 'under', 'below', 'upto', 'best', 'top', 'new', 'में', 'के', 'पास', 'का', 'की',
  ]);

  const queryTokens = remainingQuery
    .split(' ')
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !stopWords.has(t));

  // If the query was ONLY a locality name (e.g. "Budh Vihar" or "Scheme 2")
  if (queryTokens.length === 0 && constraints.detectedZone) {
    const cleanZone = normalizeSearchText(constraints.detectedZone);
    return ` ${locationText} `.includes(` ${cleanZone} `) ? 100 : 0;
  }

  // If user typed a broad category name (like "Newly Open" or "Kaarigar"), return items of that category
  if (isBroadCategoryQuery) {
    return 80 + (item.is_promoted ? 15 : 0);
  }

  if (queryTokens.length === 0) return 0;

  let totalScore = 0;
  let matchedTokensCount = 0;

  // Exact full-phrase bonus
  if (` ${titleText} `.includes(` ${cleanQuery} `)) {
    totalScore += 120;
  } else if (` ${subCatText} `.includes(` ${cleanQuery} `)) {
    totalScore += 90;
  } else if (` ${sellerText} `.includes(` ${cleanQuery} `)) {
    totalScore += 85;
  }

  // 4. Score each token (and its specific synonyms, NOT whole category!)
  for (const tok of queryTokens) {
    const candidateTerms = [tok, ...(SPECIFIC_TERM_SYNONYMS[tok] || [])];
    let bestTokenScore = 0;

    for (const term of candidateTerms) {
      const cleanTerm = normalizeSearchText(term);
      if (!cleanTerm) continue;

      const isOriginalToken = cleanTerm === tok;
      const weightMultiplier = isOriginalToken ? 1.0 : 0.85;

      // Check Title (Highest Priority)
      const titleMatch = matchesWordInField(cleanTerm, titleWords, titleText);
      if (titleMatch.matched) {
        const pts = titleMatch.type === 'exact' ? 70 : titleMatch.type === 'prefix' ? 55 : 40;
        bestTokenScore = Math.max(bestTokenScore, Math.round(pts * weightMultiplier));
      }

      // Check Subcategory / Trade / Profession (High Priority)
      const subMatch = matchesWordInField(cleanTerm, subCatWords, subCatText);
      if (subMatch.matched) {
        const pts = subMatch.type === 'exact' ? 65 : 50;
        bestTokenScore = Math.max(bestTokenScore, Math.round(pts * weightMultiplier));
      }

      // Check Seller / Business Name
      const sellerMatch = matchesWordInField(cleanTerm, sellerWords, sellerText);
      if (sellerMatch.matched) {
        const pts = sellerMatch.type === 'exact' ? 60 : 45;
        bestTokenScore = Math.max(bestTokenScore, Math.round(pts * weightMultiplier));
      }

      // Check Location
      const locMatch = matchesWordInField(cleanTerm, locationWords, locationText);
      if (locMatch.matched) {
        bestTokenScore = Math.max(bestTokenScore, Math.round(45 * weightMultiplier));
      }

      // Check Description (Only exact or prefix word matches)
      const descMatch = matchesWordInField(cleanTerm, descWords, descText);
      if (descMatch.matched && descMatch.type !== 'fuzzy') {
        const pts = descMatch.type === 'exact' ? 35 : 25;
        bestTokenScore = Math.max(bestTokenScore, Math.round(pts * weightMultiplier));
      }
    }

    if (bestTokenScore > 0) {
      matchedTokensCount++;
      totalScore += bestTokenScore;
    }
  }

  // 🔒 STRICT PRECISION GATE:
  // 1. If 0 tokens matched, immediately return 0 (no category-wide fallback!)
  if (matchedTokensCount === 0) return 0;

  // 2. For multi-word queries (e.g. "2 BHK Flat" or "AC Repair"), require at least 75% of tokens to match
  const requiredMatches = queryTokens.length <= 2 ? queryTokens.length : Math.ceil(queryTokens.length * 0.75);
  if (matchedTokensCount < requiredMatches) {
    return 0;
  }

  // 5. Locality Constraint Filter: If user specified a colony in query, require or strongly boost it
  if (constraints.detectedZone) {
    const cleanZone = normalizeSearchText(constraints.detectedZone);
    if (` ${locationText} `.includes(` ${cleanZone} `)) {
      totalScore += 60;
    } else {
      return 0; // Exclude listings from other colonies when user explicitly searched a colony
    }
  }

  // 6. Small tie-breaker for promoted/popular items ONLY among genuinely matching listings
  if (item.is_promoted || item.deal_type === 'PAID_PROMO') {
    totalScore += 8;
  }
  if (Number(item.interestCount || 0) > 0) {
    totalScore += Math.min(5, Number(item.interestCount || 0) * 0.1);
  }

  return totalScore;
}

/**
 * 🚀 Master Unified Search Pipeline
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

  const scoredResults = [];

  for (const item of allListings) {
    if (!item || item.is_active === false || item.has_pending_approval) continue;

    if (categoryFilter && categoryFilter !== 'all') {
      if (String(item.category || '').toLowerCase() !== String(categoryFilter).toLowerCase()) {
        continue;
      }
    }

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

    const score = scoreListingMatch(item, rawQuery, constraints);
    if (score > 0) {
      scoredResults.push({ item, score });
    }
  }

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