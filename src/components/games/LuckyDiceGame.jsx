import React, { useState, useMemo } from 'react';
import { hyperlocalStore } from '../../store/hyperlocalStore';
import ActionButtons from '../common/ActionButtons';

// 🔊 Synthesized Audio Engine (Jump Clatter, Table Settle & Fanfare)
const playDiceAudio = (type = 'jump') => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (type === 'jump') {
      for (let i = 0; i < 6; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(280 + Math.random() * 320, now + i * 0.06);
        gain.gain.setValueAtTime(0.18, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.04);
      }
    } else if (type === 'settle') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.18);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
      if (navigator.vibrate) navigator.vibrate([30, 40]);
    } else if (type === 'advance') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.08);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'win') {
      [392.0, 523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.01, now + idx * 0.07);
        gain.gain.linearRampToValueAtTime(0.22, now + idx * 0.07 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.35);
      });
      if (navigator.vibrate) navigator.vibrate([40, 60, 100]);
    }
  } catch {}
};

// 🌟 STAGE 1: 14 LIFESTYLE & DISCOVERY CATEGORIES
const STAGE_1_CATEGORIES = [
  { id: 'restaurants', label: 'Food & Zayka', hindi: 'लजीज खान-पान', icon: '🍔', tag: 'FOOD & DINING', desc: 'Street food, cafes, thalis & dining spots' },
  { id: 'shaadi', label: 'Shaadi & Boutiques', hindi: 'शादी व पहनावा', icon: '👗', tag: 'WEDDING & ATTIRE', desc: 'Bridal wear, sherwanis, tailors & jewellery' },
  { id: 'market', label: 'Bazaar & Retail', hindi: 'बाजार व खरीदारी', icon: '🛍️', tag: 'LOCAL SHOPPING', desc: 'Footwear, garments, cosmetics & deals' },
  { id: 'sweets', label: 'Mithai & Bakery', hindi: 'मिठाई व बेकरी', icon: '🍯', tag: 'SWEET TREATS', desc: 'Pure ghee sweets, fresh cakes & namkeens' },
  { id: 'recommerce', label: 'Purana Samaan', hindi: 'पुराना सामान बचत', icon: '📦', tag: 'PRE-LOVED DEALS', desc: 'Pre-owned bikes, mobiles & furniture' },
  { id: 'fitness', label: 'Gym & Fitness', hindi: 'जिम व फिटनेस', icon: '💪', tag: 'HEALTH & GYM', desc: 'Gym memberships, sports turfs & yoga' },
  { id: 'malls', label: 'Malls & Hangouts', hindi: 'शॉपिंग मॉल व हैंगआउट', icon: '🏢', tag: 'FAMILY LEISURE', desc: 'Shopping malls, rooftop cafes & lounges' },
  { id: 'beauty', label: 'Salons & Parlours', hindi: 'ब्यूटी पार्लर व स्पा', icon: '💄', tag: 'BEAUTY & GROOMING', desc: 'Bridal makeover, hair spas & groom salons' },
  { id: 'creators', label: 'Photography & Studio', hindi: 'फोटो व वीडियो शूट', icon: '📸', tag: 'CREATIVE MEDIA', desc: 'Pre-wedding shoots, portfolios & studios' },
  { id: 'electronics', label: 'Mobiles & Gadgets', hindi: 'इलेक्ट्रॉनिक्स व फोन', icon: '📱', tag: 'TECH & GADGETS', desc: 'Smartphones, TV, audio & accessories' },
  { id: 'homedecor', label: 'Home Decor & Lights', hindi: 'घर सजावट व फर्नीचर', icon: '🛋️', tag: 'HOME STYLING', desc: 'Designer lights, sofas, curtains & decor' },
  { id: 'education', label: 'Hobbies & Classes', hindi: 'हॉबी, म्यूजिक व डांस', icon: '🎨', tag: 'SKILLS & HOBBIES', desc: 'Dance academies, art & music classes' },
  { id: 'festivals', label: 'Festival Specials', hindi: 'त्योहार व मेला ऑफर', icon: '🪔', tag: 'SEASONAL DEALS', desc: 'Seasonal melas, festive hampers & discounts' },
  { id: 'entertainment', label: 'Gaming & Fun Zones', hindi: 'गेमिंग व मनोरंजन', icon: '🎮', tag: 'ENTERTAINMENT', desc: 'VR zones, bowling, snooker & game cafes' },
];

// 🌟 STAGE 2: DYNAMIC SUBCATEGORIES (14 Category Suites)
const SUBCATEGORIES_MAP = {
  restaurants: [
    { id: 'chaat_kachori', label: 'Chaat & Famous Kachori', hindi: 'चाट व कचौड़ी', icon: '🥟', perk: 'Local street chaat, golgappe & pyaz kachori' },
    { id: 'cafes_shakes', label: 'Cozy Cafes & Burgers', hindi: 'कैफे व शेक्स', icon: '🥤', perk: 'Cold coffee, loaded burgers & pizza combos' },
    { id: 'family_thali', label: 'Unlimited Family Thali', hindi: 'शाही थाली व ढाबा', icon: '🍛', perk: 'Pure vegetarian thali & family dinner specials' },
    { id: 'south_chinese', label: 'Dosa & Chinese Platters', hindi: 'डोसा व चाइनीज', icon: '🍜', perk: 'Crispy dosas, noodles & momo platters' },
    { id: 'late_night', label: 'Late Night Takeaway', hindi: 'नाइट मंचिज', icon: '🌙', perk: 'Midnight rolls, parathas & tea points' },
    { id: 'icecream_sundae', label: 'Sundaes & Falooda', hindi: 'आइसक्रीम व फालूदा', icon: '🍨', perk: 'Waffle cones, fruit shakes & royal falooda' },
  ],
  shaadi: [
    { id: 'bridal_lehenga', label: 'Bridal Lehengas', hindi: 'दुल्हन लहंगा व साड़ियां', icon: '👑', perk: 'Heavy embroidery lehengas on purchase/rent' },
    { id: 'sherwani_rent', label: 'Sherwani & Indo-Western', hindi: 'शेरवानी व कोट किराया', icon: '🤵', perk: 'Royal groom sherwanis & matching safas' },
    { id: 'boutique_tailoring', label: 'Designer Suit Boutique', hindi: 'बुटीक स्टिचिंग', icon: '✂️', perk: 'Custom cut designer blouse & suit stitching' },
    { id: 'bridal_jewel', label: 'Kundan & Polki Sets', hindi: 'शादी के गहने व चूड़ा', icon: '💍', perk: 'Bridal jewellery sets, mathapatti & chuda' },
    { id: 'makeup_makeover', label: 'Bridal Makeover Suite', hindi: 'ब्राइडल ब्यूटी पार्लर', icon: '💄', perk: 'HD & Airbrush wedding makeup packages' },
    { id: 'safas_pagdi', label: 'Barat Safas & Turbans', hindi: 'साफा, पगड़ी व माला', icon: '🪶', perk: 'Barat royal safa styling and welcome malas' },
  ],
  market: [
    { id: 'garments_ethnic', label: 'Kurti & Ethnic Wear', hindi: 'कुर्ती व रेडीमेड कपड़े', icon: '👗', perk: 'Festive kurti sets & cotton dailywear' },
    { id: 'mens_fashion', label: 'Jeans & Casual Shirts', hindi: 'मेंस शर्ट्स व जींस', icon: '👕', perk: 'Trending streetwear & formal trousers' },
    { id: 'footwear_juttis', label: 'Mojari & Sports Shoes', hindi: 'मोजड़ी व स्पोर्ट्स शूज', icon: '👟', perk: 'Handmade Rajasthani juttis & sneakers' },
    { id: 'cosmetics_perfume', label: 'Cosmetics & Attar', hindi: 'मेकअप व परफ्यूम', icon: '✨', perk: 'Original branded cosmetics & local attar' },
    { id: 'handbags_wallets', label: 'Bags & Leather Belts', hindi: 'हैंडबैग व वॉलेट्स', icon: '👜', perk: 'Party clutches, office bags & travel wallets' },
    { id: 'watches_glasses', label: 'Watches & Sunglasses', hindi: 'घड़ी व चश्मे', icon: '🕶️', perk: 'Trending wristwatches & UV protection shades' },
  ],
  sweets: [
    { id: 'pure_ghee_mithai', label: 'Desi Ghee Kalakand & Ladoo', hindi: 'देसी घी कलाकंद व लड्डू', icon: '🥮', perk: 'Famous town kalakand, besan & motichoor' },
    { id: 'fresh_bakery_cakes', label: 'Custom Birthday Cakes', hindi: 'फ्रेश केक व पेस्ट्री', icon: '🎂', perk: '100% eggless cream & photo fondant cakes' },
    { id: 'namkeen_farsan', label: 'Bikaneri Bhujia & Mixture', hindi: 'नमकीन, भुजिया व मठरी', icon: '🥨', perk: 'Freshly fried sev, bhujia, chivda & snacks' },
    { id: 'dryfruits_gift', label: 'Dryfruit Gift Boxes', hindi: 'ड्राई फ्रूट्स गिफ्ट पैक', icon: '🥜', perk: 'Premium roasted cashews, almonds & raisins' },
    { id: 'cookies_rusks', label: 'Bakery Rusks & Biscuits', hindi: 'टोस्ट, रस्क व कुकीज', icon: '🍪', perk: 'Handcrafted jeera biscuits & butter cookies' },
    { id: 'hot_jalebi', label: 'Rabdi Jalebi & Imarti', hindi: 'रबड़ी जलेबी व इमरती', icon: '🍮', perk: 'Crispy hot jalebis dipped in thick rabdi' },
  ],
  recommerce: [
    { id: 'bikes_scooters', label: 'Inspected Used Bikes', hindi: 'पुरानी बाइक व स्कूटी', icon: '🏍️', perk: 'Direct owner tested scooters with RC papers' },
    { id: 'refurb_phones', label: 'Smartphones Under ₹8K', hindi: 'सेकंड हैंड मोबाइल', icon: '📲', perk: 'Quality tested Android & iPhones with warranty' },
    { id: 'used_sofas_beds', label: 'Pre-owned Beds & Sofas', hindi: 'पुराना फर्नीचर व बेड', icon: '🛋️', perk: 'Solid Sheesham wood double beds & sofa sets' },
    { id: 'tvs_fridges', label: 'Used LED TVs & Coolers', hindi: 'कूलर, फ्रिज व टीवी', icon: '📺', perk: 'Working condition appliances with home delivery' },
    { id: 'bicycles_gear', label: 'Gear Bicycles & Kids Rides', hindi: 'साइकिल व बच्चों की गाड़ी', icon: '🚲', perk: 'Mountain gear cycles and infant strollers' },
    { id: 'laptops_pcs', label: 'Student Laptops & Monitors', hindi: 'लैपटॉप व कंप्यूटर', icon: '💻', perk: 'Refurbished student laptops under ₹15,000' },
  ],
  fitness: [
    { id: 'gym_weightlifting', label: 'Heavy Iron Gym Pass', hindi: 'जिम व वेटलिफ्टिंग', icon: '🏋️', perk: 'Monthly pass with modern imported machines' },
    { id: 'box_cricket_turf', label: 'Night Box Cricket Turf', hindi: 'बॉक्स क्रिकेट टर्फ', icon: '🏏', perk: 'Floodlit artificial turf for squad matches' },
    { id: 'yoga_mindfulness', label: 'Morning Yoga Batches', hindi: 'योग व मेडिटेशन', icon: '🧘', perk: 'Flexibility, pranayam and weight-loss batches' },
    { id: 'protein_diet', label: 'Whey Protein & Diet Bars', hindi: 'सप्लीमेंट्स व डाइट', icon: '🥛', perk: 'Verified brand protein and peanut butters' },
    { id: 'zumba_aerobics', label: 'Zumba & Dance Cardio', hindi: 'जुम्बा व डांस फिटनेस', icon: '💃', perk: 'High calorie burning fun music sessions' },
    { id: 'swimming_pool', label: 'Swimming Pool Passes', hindi: 'स्वीमिंग पूल स्लॉट्स', icon: '🏊', perk: 'Hygienic clean pool with coaching batches' },
  ],
  malls: [
    { id: 'rooftop_dining', label: 'Rooftop Lounge Dining', hindi: 'रूफटॉप कैफे व व्यू', icon: '🌇', perk: 'Sunset evening view with mocktails & platters' },
    { id: 'brand_showrooms', label: 'Mall Brand Outlets', hindi: 'मॉल ब्रांडेड शोरूम्स', icon: '🏬', perk: 'Fashion mall retail sales and vouchers' },
    { id: 'study_workspace', label: 'Cozy Workspace Lounges', hindi: 'स्टडी कैफे व वाई-फाई', icon: '📖', perk: 'Peaceful reading spots with Wi-Fi & tea' },
    { id: 'cinema_multiplex', label: 'Multiplex Cinema Deals', hindi: 'सिनेमा व पॉपकॉर्न', icon: '🍿', perk: 'Recliner seats and couple combo passes' },
    { id: 'kids_play_arena', label: 'Kids Indoor Soft Play', hindi: 'बच्चों का प्ले जोन', icon: '🎠', perk: 'Trampolines, slides & safe toddler games' },
    { id: 'dessert_parlours', label: 'Late Night Dessert Bars', hindi: 'चॉकलेट व वाफल', icon: '🧇', perk: 'Belgian waffles, sizzling brownies & shakes' },
  ],
  beauty: [
    { id: 'hair_spa_keratin', label: 'Hair Keratin & Smoothening', hindi: 'हेयर स्पा व केराटिन', icon: '💇', perk: 'Deep conditioning & hair smoothing therapy' },
    { id: 'glow_facial_cleanup', label: 'Hydra Facial & Cleanup', hindi: 'हाइड्रा फेशियल व ग्लो', icon: '🧖', perk: 'Instant party glow and skin detox sessions' },
    { id: 'nail_art_extensions', label: 'Gel Nail Art & Lash', hindi: 'नेल आर्ट व एक्सटेंशन', icon: '💅', perk: 'Trendy chrome nails and lash extensions' },
    { id: 'grooming_mens_salon', label: 'Groom Shave & Styling', hindi: 'मेंस ग्रूमिंग सैलून', icon: '💈', perk: 'Beard shaping, hair fade and face bleach' },
    { id: 'mehendi_art', label: 'Bridal Mehendi Designers', hindi: 'मेहंदी डिजाइनर्स', icon: '🌿', perk: 'Arabic, portrait & traditional dark henna' },
    { id: 'body_polishing_spa', label: 'Full Body Polishing Spa', hindi: 'बॉडी पॉलिशिंग व मसाज', icon: '🧴', perk: 'Aromatherapy massage & herbal body wraps' },
  ],
  creators: [
    { id: 'pre_wedding_video', label: 'Cinematic Pre-Wedding', hindi: 'प्री-वेडिंग वीडियो शूट', icon: '🎥', perk: 'Drone shots, costume change & 4K teaser' },
    { id: 'maternity_baby', label: 'Maternity & Newborn Shoot', hindi: 'बेबी व मेटरनिटी फोटो', icon: '👶', perk: 'Cute props, studio lighting & memory albums' },
    { id: 'catalog_product', label: 'Product Catalog Shoot', hindi: 'प्रोडक्ट फोटोशूट', icon: '📦', perk: 'Amazon/Instagram ready white background shots' },
    { id: 'event_videography', label: 'Birthday & Party Shoots', hindi: 'बर्थडे व इवेंट कवरेज', icon: '🎉', perk: 'Traditional video recording with instant reels' },
    { id: 'portfolio_modeling', label: 'Model Portfolio Headshots', hindi: 'मॉडलिंग पोर्टफोलियो', icon: '📷', perk: 'Outdoor natural light fashion portraits' },
    { id: 'custom_frames_album', label: 'Photo Framing & Albums', hindi: 'फोटो फ्रेम व एल्बम', icon: '🖼️', perk: 'Canvas prints, acrylic frames & flush albums' },
  ],
  electronics: [
    { id: 'smart_accessories', label: 'Earbuds & Powerbanks', hindi: 'ईयरबड्स व चार्जर', icon: '🎧', perk: 'TWS earbuds, fast adapters & braided cables' },
    { id: 'phone_repair_screen', label: 'Instant Screen Repair', hindi: 'मोबाइल स्क्रीन मरम्मत', icon: '🛠️', perk: 'Same-day folder & battery replacement' },
    { id: 'smart_tv_audio', label: 'Smart 4K TVs & Soundbars', hindi: 'स्मार्ट टीवी व साउंडबार', icon: '📺', perk: 'Branded LED TVs with wall mount service' },
    { id: 'home_coolers_fans', label: 'Heavy Desert Coolers', hindi: 'कूलर, पंखे व गीजर', icon: '💨', perk: 'Copper motor coolers and heating geysers' },
    { id: 'smartwatches_bands', label: 'Bluetooth Calling Watches', hindi: 'स्मार्टवॉच व बैंड्स', icon: '⌚', perk: 'Amoled display watches with fitness sensors' },
    { id: 'laptops_printers', label: 'Printers, Inks & Routers', hindi: 'प्रिंटर व वाई-फाई राउटर', icon: '🖨️', perk: 'Home office Wi-Fi setup & laser printers' },
  ],
  homedecor: [
    { id: 'designer_curtains', label: 'Custom Curtains & Blinds', hindi: 'पर्दे व रोलर ब्लाइंड्स', icon: '🪟', perk: 'Blackout velvet curtains with measurement' },
    { id: 'decorative_lights', label: 'Chandeliers & Warm Lights', hindi: 'झूमर व फैंसी लाइट्स', icon: '💡', perk: 'Crystal chandeliers and ceiling LED fixtures' },
    { id: 'wooden_furniture', label: 'Solid Wood Coffee Tables', hindi: 'सोफा व सेंटर टेबल', icon: '🪵', perk: 'Teak wood dining sets, chairs & wardrobes' },
    { id: 'wallpapers_paint', label: '3D Wallpapers & Textures', hindi: '3D वॉलपेपर व पेंट', icon: '🎨', perk: 'Waterproof floral & modern geometric wall sheets' },
    { id: 'bedsheets_quilts', label: 'Jaipuri Razai & Bedsheets', hindi: 'जयपुरी रजाई व चादरें', icon: '🛏️', perk: 'Pure cotton block print bedsheets & dohars' },
    { id: 'indoor_plants_pots', label: 'Ceramic Pots & Bonsai', hindi: 'गमले व इनडोर पौधे', icon: '🪴', perk: 'Air-purifying plants with decorative planters' },
  ],
  education: [
    { id: 'dance_academy', label: 'Kathak & Western Dance', hindi: 'डांस क्लासेज', icon: '💃', perk: 'Hip hop, zumba and classical dance batches' },
    { id: 'music_guitar_piano', label: 'Guitar, Piano & Vocals', hindi: 'गिटार व गायन सीखें', icon: '🎸', perk: 'Beginner friendly music instrument lessons' },
    { id: 'drawing_calligraphy', label: 'Fine Arts & Sketching', hindi: 'ड्राइंग व पेंटिंग क्लास', icon: '🖌️', perk: 'Canvas acrylic painting and calligraphy' },
    { id: 'spoken_english', label: 'Spoken English & Debate', hindi: 'इंग्लिश स्पीकिंग कोर्स', icon: '🗣️', perk: 'Personality development and interview prep' },
    { id: 'coding_robotics', label: 'Kids Coding & Robotics', hindi: 'कोडिंग व रोबोटिक्स', icon: '🤖', perk: 'Python, game design and STEM kit projects' },
    { id: 'martial_karate', label: 'Karate & Self Defense', hindi: 'कराटे व आत्मरक्षा', icon: '🥋', perk: 'Discipline, fitness and belt certification' },
  ],
  festivals: [
    { id: 'festive_mithai_box', label: 'Premium Festive Hampers', hindi: 'त्योहारी मिठाई गिफ्ट पैक', icon: '🎁', perk: 'Assorted sweets with decorative dryfruit boxes' },
    { id: 'festive_diya_decor', label: 'Handcrafted Rangoli & Diyas', hindi: 'दीये, तोरण व सजावट', icon: '🪔', perk: 'Clay painted diyas, bandhanwars & lights' },
    { id: 'festive_ethnic_sets', label: 'Special Occasion Kurtas', hindi: 'त्योहारी कुर्ता-पजामा', icon: '👘', perk: 'Silk blend kurtas & festive jacket sets' },
    { id: 'puja_samagri_kits', label: 'Complete Puja Kits', hindi: 'हवन व पूजा सामग्री', icon: '📿', perk: 'Pure gangajal, dhoop, agarbatti & brass idols' },
    { id: 'fireworks_crackers', label: 'Green Festive Crackers', hindi: 'ग्रीन पटाखे व फुलझड़ी', icon: '🎆', perk: 'Eco-friendly sparkles and colorful fountains' },
    { id: 'festive_melas_food', label: 'Festival Food Stalls', hindi: 'मेला खान-पान', icon: '🎡', perk: 'Live jalebi, kulfi and festive street snacks' },
  ],
  entertainment: [
    { id: 'vr_gaming_arcade', label: 'VR Motion Simulator', hindi: 'VR व 9D राइड गेमिंग', icon: '🥽', perk: 'Virtual rollercoasters and interactive shooters' },
    { id: 'snooker_pool_club', label: 'French Snooker & 8-Ball', hindi: 'स्नूकर व पूल टेबल', icon: '🎱', perk: 'Air-conditioned international size pool tables' },
    { id: 'bowling_alley', label: 'Ten-Pin Bowling Strikes', hindi: 'बाउलिंग एली', icon: '🎳', perk: 'Glow in the dark bowling pins and shoes' },
    { id: 'ps5_esports_cafe', label: 'PS5 & FIFA Gaming Lounge', hindi: 'PS5 व फीफा कैफे', icon: '🕹️', perk: '4K TV screens, FIFA, Tekken and racing wheels' },
    { id: 'boardgames_cafe', label: 'Board Games & Chai Point', hindi: 'बोर्ड गेम्स व चाय', icon: '♟️', perk: 'Chess, Catan, Jenga with snacks and tea' },
    { id: 'trampoline_park', label: 'Foam Pit Trampoline Jump', hindi: 'ट्रैम्पोलिन पार्क', icon: '🤸', perk: 'Dunk hoops, obstacle courses and foam jumps' },
  ],
};

// 🌟 STAGE 3: 10 REFINED DISCOVERY LENSES (Trending, Close, Cost Effective, Premium, etc.)
const STAGE_3_DISCOVERY_LENSES = [
  {
    id: 'trending',
    label: 'Trending Now in Town',
    hindi: 'शहर में सबसे ज्यादा ट्रेंडिंग',
    icon: '📈',
    tag: 'HOT TREND',
    perk: 'Most popular & actively inquired deals right now',
    filterFn: (items) => [...items].sort((a, b) => Number(b.interestCount || 0) - Number(a.interestCount || 0)),
  },
  {
    id: 'close',
    label: 'Super Close (< 800m Walk)',
    hindi: 'पैदल दूरी पर (नजदीकी दुकान)',
    icon: '📍',
    tag: 'WALKING RADAR',
    perk: 'Nearby spots reachable within a 5-10 min walk',
    filterFn: (items) => items.filter((i) => !i.distance || i.distance.includes('0.') || i.distance.includes('800m')),
  },
  {
    id: 'cost_effective',
    label: 'Cost-Effective & Budget',
    hindi: 'किफायती दाम, ज्यादा बचत',
    icon: '🪙',
    tag: 'MAX SAVINGS',
    perk: 'Under ₹200 / best value-for-money offers',
    filterFn: (items) => items.filter((i) => {
      const p = String(i.price || '').toLowerCase();
      return p.includes('₹') || p.includes('free') || p.includes('off') || p.includes('combo');
    }),
  },
  {
    id: 'premium',
    label: 'Premium & Royal Select',
    hindi: 'प्रीमियम व लक्जरी क्लास',
    icon: '👑',
    tag: 'ROYAL SELECT',
    perk: 'Top-tier luxury, superior finish & exclusive craftsmanship',
    filterFn: (items) => items.filter((i) => {
      const text = (i.title + ' ' + (i.description || '')).toLowerCase();
      return text.includes('premium') || text.includes('royal') || text.includes('special') || text.includes('designer') || text.includes('pure');
    }),
  },
  {
    id: 'combo_bundle',
    label: 'Exclusive Combo Package',
    hindi: 'स्पेशल कॉम्बो व बंडल पैक',
    icon: '🍱',
    tag: 'COMBO PACK',
    perk: 'Multi-item bundled package offered together at special price',
    filterFn: (items) => items.filter((i) => {
      const text = (i.title + ' ' + (i.description || '')).toLowerCase();
      return text.includes('combo') || text.includes('pack') || text.includes('thali') || text.includes('bundle') || text.includes('set');
    }),
  },
  {
    id: 'top_rated',
    label: 'Top Rated & Loved (4.8+ ⭐)',
    hindi: 'ग्राहकों का सबसे पसंदीदा',
    icon: '🌟',
    tag: 'HIGH TRUST',
    perk: 'Consistently high-rated stores with trusted reputation',
    filterFn: (items) => [...items].sort((a, b) => Number(b.rating || 5) - Number(a.rating || 5)),
  },
  {
    id: 'ready_stock',
    label: 'Ready Stock / Instant Walk-In',
    hindi: 'तुरंत उपलब्ध / नो वेटिंग',
    icon: '⚡',
    tag: 'READY TODAY',
    perk: 'In-stock items ready for immediate purchase or takeaway',
    filterFn: (items) => items.filter((i) => Boolean(i.capacity) || Boolean(i.stockCount) || i.is_active !== false),
  },
  {
    id: 'town_legend',
    label: 'Landmark Town Legend',
    hindi: 'दशकों पुरानी मशहूर दुकान',
    icon: '🏆',
    tag: 'ICONIC GEM',
    perk: 'Generations of trusted heritage and local fame in town',
    filterFn: (items) => items.filter((i) => {
      const text = (i.title + ' ' + (i.description || '')).toLowerCase();
      return text.includes('famous') || text.includes('legend') || text.includes('old') || text.includes('authentic') || text.includes('purana');
    }),
  },
  {
    id: 'heavy_discount',
    label: 'Flat Price Slash / Discount',
    hindi: 'सीधी भारी छूट डील',
    icon: '🏷️',
    tag: 'PRICE SLASH',
    perk: 'Direct discount off regular rates with high value benefit',
    filterFn: (items) => items.filter((i) => {
      const desc = String(i.description || '').toLowerCase();
      return desc.includes('discount') || desc.includes('off') || desc.includes('%') || desc.includes('छूट');
    }),
  },
  {
    id: 'fresh_discovery',
    label: 'Fresh Arrival & New in Town',
    hindi: 'नया और अनोखा कलेक्शन',
    icon: '✨',
    tag: 'NEW ARRIVAL',
    perk: 'Fresh seasonal batch & latest collection additions',
    filterFn: (items) => items.filter((i) => Boolean(i.isNew) || Boolean(i.is_featured)),
  },
];

// 🎲 CASINO RED 3D DICE WITH INSET BLACK PIPS
function CasinoRedDice({ faceNumber, isJumping }) {
  const pipsLayout = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  };

  const activePips = pipsLayout[faceNumber] || [4];

  return (
    <div className={`relative flex flex-col items-center justify-center cursor-pointer group select-none ${isJumping ? 'dice-jump-physics' : 'hover:scale-105 active:scale-95'}`}>
      <div className={`w-28 h-6 rounded-full bg-black/60 blur-md transition-all duration-300 ${isJumping ? 'scale-50 opacity-20 translate-y-16' : 'scale-100 opacity-70 translate-y-3'}`} />

      <div className="relative w-32 h-32 rounded-3xl bg-gradient-to-br from-red-500 via-red-600 to-rose-950 border-[3.5px] border-red-400/80 shadow-[0_20px_45px_rgba(225,29,72,0.5),inset_0_4px_12px_rgba(255,255,255,0.4),inset_0_-8px_16px_rgba(0,0,0,0.8)] p-3 flex items-center justify-center -mt-6">
        <span className="absolute top-2 left-3 w-8 h-3 rounded-full bg-white/40 blur-[0.8px] rotate-[-25deg] pointer-events-none" />

        <div className="grid grid-cols-3 grid-rows-3 gap-2 w-full h-full p-2 bg-gradient-to-b from-red-600 to-red-800 rounded-2xl shadow-inner border border-red-700/60">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((idx) => {
            const isFilled = activePips.includes(idx);
            return (
              <div key={idx} className="flex items-center justify-center">
                {isFilled && (
                  <span className="w-4 h-4 rounded-full bg-gradient-to-b from-black to-slate-950 border border-slate-800 shadow-[inset_0_2px_4px_rgba(0,0,0,1),0_1px_2px_rgba(255,255,255,0.3)] block" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <span className="mt-4 text-[10px] font-black uppercase text-amber-300 bg-amber-950/80 border border-amber-400/40 px-3 py-1 rounded-full tracking-wider shadow-lg animate-pulse">
        👆 Tap Red Dice to Roll!
      </span>
    </div>
  );
}

export default function LuckyDiceGame({ selectedCity = 'Alwar', onBack }) {
  // Steps: 1 (Category - 14) | 2 (Subcategory) | 3 (Discovery Lens - 10) | 4 (Matched Deals)
  const [currentStep, setCurrentStep] = useState(1);
  const [isJumping, setIsJumping] = useState(false);
  const [dicePipScore, setDicePipScore] = useState(1);

  const [stage1Idx, setStage1Idx] = useState(0);
  const [stage2Idx, setStage2Idx] = useState(0);
  const [stage3Idx, setStage3Idx] = useState(0);

  const [lockedCategory, setLockedCategory] = useState(null);
  const [lockedSubcategory, setLockedSubcategory] = useState(null);
  const [lockedDiscoveryLens, setLockedDiscoveryLens] = useState(null);

  const availableSubcategories = useMemo(() => {
    const catId = lockedCategory?.id || STAGE_1_CATEGORIES[stage1Idx].id;
    return SUBCATEGORIES_MAP[catId] || SUBCATEGORIES_MAP.restaurants;
  }, [lockedCategory, stage1Idx]);

  // 🎲 Direct Tap on Dice triggers Jump & Random Roll
  const handleTapDice = () => {
    if (isJumping) return;
    setIsJumping(true);
    playDiceAudio('jump');

    let cycle = 0;
    const interval = setInterval(() => {
      setDicePipScore(Math.floor(Math.random() * 6) + 1);

      if (currentStep === 1) {
        setStage1Idx(Math.floor(Math.random() * STAGE_1_CATEGORIES.length));
      } else if (currentStep === 2) {
        setStage2Idx(Math.floor(Math.random() * availableSubcategories.length));
      } else if (currentStep === 3) {
        setStage3Idx(Math.floor(Math.random() * STAGE_3_DISCOVERY_LENSES.length));
      }

      cycle++;
      if (cycle >= 10) {
        clearInterval(interval);
        setIsJumping(false);
        playDiceAudio('settle');
      }
    }, 60);
  };

  // Lock Selection and Advance to Next Stage
  const handleConfirmStep = () => {
    playDiceAudio('advance');

    if (currentStep === 1) {
      setLockedCategory(STAGE_1_CATEGORIES[stage1Idx]);
      setStage2Idx(0);
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setLockedSubcategory(availableSubcategories[stage2Idx]);
      setStage3Idx(0);
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setLockedDiscoveryLens(STAGE_3_DISCOVERY_LENSES[stage3Idx]);
      setCurrentStep(4);
      playDiceAudio('win');
    }
  };

  // Query Database & apply Stage 1 + Stage 2 + Stage 3 Discovery Filter Logic
  const matchedOffers = useMemo(() => {
    if (currentStep !== 4) return [];
    const allListings = hyperlocalStore.getAllListings() || [];
    const city = (selectedCity || '').toLowerCase().trim();

    let pool = allListings.filter((item) => {
      if (!item || !item.id) return false;
      const c = (item.city || '').toLowerCase().trim();
      const loc = (item.location || '').toLowerCase().trim();
      return !city || c === city || loc.includes(city);
    });

    // 1. Filter by Stage 1 Category
    if (lockedCategory?.id) {
      const catMatches = pool.filter((item) => item.category === lockedCategory.id);
      if (catMatches.length > 0) pool = catMatches;
    }

    // 2. Filter by Stage 2 Subcategory keywords
    if (lockedSubcategory?.label) {
      const subKeyword = lockedSubcategory.label.toLowerCase();
      const subMatches = pool.filter((item) => {
        const sub = (item.subCategory || item.sub_category || '').toLowerCase();
        const title = (item.title || item.name || '').toLowerCase();
        const desc = (item.description || '').toLowerCase();
        return sub.includes(subKeyword) || title.includes(subKeyword) || desc.includes(subKeyword);
      });
      if (subMatches.length > 0) pool = subMatches;
    }

    // 3. Apply Stage 3 Discovery Filter / Sorting Function
    if (lockedDiscoveryLens?.filterFn) {
      try {
        const refined = lockedDiscoveryLens.filterFn(pool);
        if (refined && refined.length > 0) pool = refined;
      } catch {}
    }

    if (pool.length === 0) {
      pool = allListings.filter((item) => item && item.id);
    }

    return pool.slice(0, 3);
  }, [currentStep, lockedCategory, lockedSubcategory, lockedDiscoveryLens, selectedCity]);

  const handleRestart = () => {
    setCurrentStep(1);
    setLockedCategory(null);
    setLockedSubcategory(null);
    setLockedDiscoveryLens(null);
    setStage1Idx(0);
    setStage2Idx(0);
    setStage3Idx(0);
    setDicePipScore(1);
  };

  const currentActiveOutcome =
    currentStep === 1
      ? STAGE_1_CATEGORIES[stage1Idx]
      : currentStep === 2
      ? availableSubcategories[stage2Idx]
      : STAGE_3_DISCOVERY_LENSES[stage3Idx];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-3.5 select-none relative overflow-hidden">
      
      {/* 🌟 Animations */}
      <style>{`
        @keyframes redDiceJumpPhysics {
          0% { transform: translateY(0px) rotate(0deg) scale(1); }
          30% { transform: translateY(-75px) rotate(-180deg) scale(1.18); }
          65% { transform: translateY(-40px) rotate(-320deg) scale(0.95); }
          85% { transform: translateY(8px) rotate(-355deg) scale(1.05); }
          100% { transform: translateY(0px) rotate(-360deg) scale(1); }
        }
        @keyframes shimmerGoldStrip {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .dice-jump-physics {
          animation: redDiceJumpPhysics 0.6s cubic-bezier(0.2, 0.8, 0.3, 1) forwards;
        }
        .vip-gold-pass {
          background: linear-gradient(135deg, rgba(245,158,11,0.18) 0%, rgba(251,191,36,0.35) 50%, rgba(245,158,11,0.18) 100%);
          background-size: 200% 200%;
          animation: shimmerGoldStrip 3.5s ease infinite;
        }
      `}</style>

      {/* Top Header Bar */}
      <header className="flex items-center justify-between z-10 shrink-0 pb-2 border-b border-slate-800">
        <button
          type="button"
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 text-amber-300 font-black text-xs flex items-center justify-center cursor-pointer active:scale-90"
        >
          ←
        </button>

        <div className="text-center">
          <span className="text-[9.5px] font-black uppercase text-red-400 tracking-wider block">
            🎲 CASINO RED DICE
          </span>
          <span className="text-xs font-black text-slate-100">3-Stage Intent Matcher • {selectedCity}</span>
        </div>

        <button
          type="button"
          onClick={handleRestart}
          className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300 cursor-pointer active:scale-90"
        >
          Reset 🔄
        </button>
      </header>

      {/* 🌟 3-Step Match Ribbon Indicator */}
      <div className="grid grid-cols-3 gap-1.5 z-10 py-2.5 shrink-0">
        <div
          className={`p-2 rounded-2xl border text-center transition-all ${
            currentStep === 1
              ? 'border-red-400 bg-red-950/40 shadow-md scale-[1.02]'
              : lockedCategory
              ? 'border-emerald-500/80 bg-emerald-950/40'
              : 'border-slate-800 bg-slate-900/50 opacity-40'
          }`}
        >
          <span className="text-[7.5px] font-black uppercase text-slate-400 block">1. Category (14)</span>
          <span className="text-xs font-black text-slate-100 truncate block mt-0.5">
            {lockedCategory ? `${lockedCategory.icon} ${lockedCategory.label.split(' ')[0]}` : 'Roll Dice...'}
          </span>
        </div>

        <div
          className={`p-2 rounded-2xl border text-center transition-all ${
            currentStep === 2
              ? 'border-cyan-400 bg-cyan-950/40 shadow-md scale-[1.02]'
              : lockedSubcategory
              ? 'border-emerald-500/80 bg-emerald-950/40'
              : 'border-slate-800 bg-slate-900/50 opacity-40'
          }`}
        >
          <span className="text-[7.5px] font-black uppercase text-slate-400 block">2. Subcategory</span>
          <span className="text-xs font-black text-slate-100 truncate block mt-0.5">
            {lockedSubcategory ? `${lockedSubcategory.icon} ${lockedSubcategory.label.split(' ')[0]}` : 'Waiting...'}
          </span>
        </div>

        <div
          className={`p-2 rounded-2xl border text-center transition-all ${
            currentStep === 3
              ? 'border-amber-400 bg-amber-950/40 shadow-md scale-[1.02]'
              : lockedDiscoveryLens
              ? 'border-emerald-500/80 bg-emerald-950/40'
              : 'border-slate-800 bg-slate-900/50 opacity-40'
          }`}
        >
          <span className="text-[7.5px] font-black uppercase text-slate-400 block">3. Discovery Lens</span>
          <span className="text-xs font-black text-slate-100 truncate block mt-0.5">
            {lockedDiscoveryLens ? `${lockedDiscoveryLens.icon} ${lockedDiscoveryLens.label.split(' ')[0]}` : 'Waiting...'}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🌟 ROLLING STAGE (STEPS 1, 2 & 3: TAP DICE TO JUMP & ROLL)                */}
      {/* ========================================================================= */}
      {currentStep <= 3 && (
        <div className="relative flex-1 flex flex-col items-center justify-between my-auto py-2 z-10">
          
          {/* Directive Text */}
          <div className="text-center space-y-1">
            <span className="text-[10px] font-black uppercase px-3 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-red-300">
              {currentStep === 1
                ? 'Step 1 of 3: Tap Dice for 14 Categories'
                : currentStep === 2
                ? `Step 2 of 3: Tap Dice for ${lockedCategory?.label} Subcategories`
                : 'Step 3 of 3: Tap Dice for Discovery Angle (Trending, Budget, Close)'}
            </span>
            <h2 className="text-base font-black text-slate-100 tracking-tight pt-0.5">
              Tap the Red Dice to Roll!
            </h2>
            <p className="text-xs text-slate-400">
              Roll freely until you land on what you desire, then accept & continue.
            </p>
          </div>

          {/* 🎲 The Interactive Big Red Casino Dice */}
          <div onClick={handleTapDice} className="my-auto py-4">
            <CasinoRedDice faceNumber={dicePipScore} isJumping={isJumping} />
          </div>

          {/* Current Settled Outcome Ping Card */}
          <div className="w-full max-w-xs bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-red-400/60 rounded-3xl p-3.5 text-center shadow-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-red-500 text-white">
                {currentStep === 1 ? '14 CATEGORIES' : currentStep === 2 ? 'SUBCATEGORY' : 'DISCOVERY LENS (10)'}
              </span>
              <span className="text-[10px] font-black text-red-400 font-mono">
                PIP #{dicePipScore}
              </span>
            </div>

            <div className="space-y-0.5">
              <div className="text-2xl">{currentActiveOutcome.icon}</div>
              <h3 className="text-base font-black text-slate-100 leading-tight">
                {currentActiveOutcome.label}
              </h3>
              <p className="text-xs font-bold text-red-300">
                {currentActiveOutcome.hindi}
              </p>
            </div>

            <p className="text-[10.5px] text-slate-300 bg-slate-950/80 p-2 rounded-xl border border-slate-800">
              ✨ {currentActiveOutcome.perk || currentActiveOutcome.desc}
            </p>
          </div>

          {/* Action Decision Buttons */}
          <div className="w-full max-w-xs grid grid-cols-2 gap-2 pt-2">
            <button
              type="button"
              onClick={handleTapDice}
              disabled={isJumping}
              className="py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-red-300 border border-red-500/40 font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition cursor-pointer flex items-center justify-center space-x-1"
            >
              <span>🎲</span>
              <span>Re-roll (फिर घुमाएं)</span>
            </button>

            <button
              type="button"
              onClick={handleConfirmStep}
              disabled={isJumping}
              className="py-3 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-500 hover:from-emerald-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl active:scale-95 transition cursor-pointer flex items-center justify-center space-x-1"
            >
              <span>✓ Accept (यह सही है)</span>
              <span>➔</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🌟 STEP 4: REVEAL REAL MATCHED BUSINESS OFFERS & DEALS                    */}
      {/* ========================================================================= */}
      {currentStep === 4 && (
        <div className="relative flex-1 flex flex-col justify-between z-10 py-1 space-y-3">
          
          {/* Top Golden VIP Discovery Pass */}
          <div className="vip-gold-pass p-4 rounded-3xl border-2 border-amber-400/90 text-slate-950 shadow-2xl text-center space-y-1 relative overflow-hidden">
            <span className="text-[8.5px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-slate-950 text-amber-300 shadow">
              🎟️ VIP BUSINESS DEAL MATCH
            </span>
            <h3 className="text-sm font-black leading-tight pt-1">
              {lockedCategory?.label} ➔ {lockedSubcategory?.label}
            </h3>
            <p className="text-[10px] font-bold text-slate-900">
              Matched Lens: {lockedDiscoveryLens?.label} ({lockedDiscoveryLens?.hindi}) in {selectedCity}
            </p>
          </div>

          {/* Matched Listings Stream */}
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-270px)] scrollbar-none pr-0.5">
            {matchedOffers.map((item) => {
              const gallery = Array.isArray(item.images) && item.images.length > 0 ? item.images : item.image ? [item.image] : ['https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=700'];
              const photo = typeof gallery[0] === 'string' ? gallery[0] : gallery[0]?.url;

              return (
                <div
                  key={item.id}
                  className="bg-slate-900/95 border-2 border-red-400/40 hover:border-red-400 rounded-3xl p-3.5 space-y-3 shadow-xl transition"
                >
                  <div className="flex items-start space-x-3">
                    <img
                      src={photo}
                      alt={item.title || item.name}
                      className="w-20 h-20 rounded-2xl object-cover border border-slate-700 shrink-0"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=700';
                      }}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                          {item.subCategory || lockedSubcategory?.label || 'LIVE DEAL'}
                        </span>
                        <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-amber-400 text-slate-950">
                          {item.price || item.rates || 'Best Value'}
                        </span>
                      </div>

                      <h4 className="font-black text-slate-100 text-sm truncate mt-1">
                        {item.title || item.name}
                      </h4>

                      {(item.sellerName || item.agencyName) && (
                        <p className="text-[10px] text-amber-300 font-bold truncate">
                          👤 {item.sellerName || item.agencyName}
                        </p>
                      )}
                    </div>
                  </div>

                  {item.description && (
                    <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                      {item.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800 pt-2 font-medium">
                    <span>📍 {item.location || selectedCity}</span>
                    <span className="text-cyan-300 font-bold">Matched: {lockedDiscoveryLens?.tag}</span>
                  </div>

                  <ActionButtons
                    phone={item.phone || item.contact || '9876543210'}
                    whatsapp={item.whatsapp || item.phone || item.contact || '919876543210'}
                    message={`Namaste! Maine TownHub Casino Red Dice Match mein aapka offer "${item.title || item.name}" (${lockedSubcategory?.label} • ${lockedDiscoveryLens?.label}) dekha. Kya yeh abhi available hai?`}
                  />
                </div>
              );
            })}
          </div>

          {/* Reset Control */}
          <div className="pt-1 shrink-0">
            <button
              type="button"
              onClick={handleRestart}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-500 via-rose-500 to-red-600 text-white font-black text-xs uppercase tracking-wider shadow-xl active:scale-95 transition cursor-pointer"
            >
              🎲 Roll Red Dice Again (नया पासा मैच बनाएं)
            </button>
          </div>
        </div>
      )}

    </div>
  );
}