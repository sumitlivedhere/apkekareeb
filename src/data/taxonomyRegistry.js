/**
 * Master Hyperlocal Taxonomy Registry
 * Defines deterministic Category IDs and Subcategory IDs across database, store, and UI feeds.
 */

export const TAXONOMY_REGISTRY = [
 {
  id: 'kaarigar',
  name: 'Kaarigar & Mistri (कारीगर व मिस्त्री सेवा)',
  icon: '🛠️',
  bucketKey: 'kaarigarWorkers',
  subCategories: [
    { id: 'electricians-inverter', name: 'Electricians & Inverter Repair (बिजली मिस्त्री व इन्वर्टर)', icon: '⚡', tag: '₹150 VISIT' },
    { id: 'plumbers-water-motor', name: 'Plumbers & Water Motor Repair (नल मिस्त्री व मोटर)', icon: '🚰', tag: 'FAST ARRIVAL' },
    { id: 'ac-fridge-appliances', name: 'AC, Fridge & Washing Machine (एसी, फ्रिज व वाशिंग मशीन)', icon: '❄️', tag: 'GAS REFILL' },
    { id: 'ro-geyser-repair', name: 'RO Water Purifier & Geyser Fix (RO व गीजर रिपेयर)', icon: '🔧', tag: 'FILTER CHANGE' },
    { id: 'carpenters-furniture', name: 'Carpenters & Lock/Furniture Fix (बढ़ई व ताला रिपेयर)', icon: '🪚', tag: 'WOODWORK' },
    { id: 'rajmistri-tile-mason', name: 'Rajmistri, Tile & Plaster (राजमिस्त्री व टाइल कारीगर)', icon: '🧱', tag: 'DIHADI / THEKA' },
    { id: 'painters-polishers', name: 'House Painters & Polishers (पुताई मिस्त्री व पॉलिश)', icon: '🎨', tag: 'WALL FINISH' },
    { id: 'welders-fabricators', name: 'Welders & Gate/Grill Fabricators (वेल्डर व लोहा कारीगर)', icon: '⛓️', tag: 'ON-SITE WELD' },
    { id: 'locksmith-key-maker', name: 'Locksmith & Key Makers (ताला-चाबी व डुप्लीकेट चाबी)', icon: '🔑', tag: 'LOCKOUT HELP' },
    { id: 'mechanic-puncture', name: 'Roadside Bike/Car Mechanic & Puncture (मैकेनिक व पंचर)', icon: '🛞', tag: 'DOORSTEP' },
    { id: 'daily-wage-labor', name: 'Daily Wage Labor & Beldar Groups (दहाड़ी मजदूर व बेलदार)', icon: '👷', tag: 'DAILY DIHADI' },
  ],
},
  {
  id: 'property',
  name: 'Property & Real Estate (प्रॉपर्टी व रियल एस्टेट)',
  icon: '🏢',
  bucketKey: 'propertyListings',
  subCategories: [
    // 🔑 1. Rentals (किराये पर)
    { id: 'rent-rooms-homes-flats', name: 'Rooms, Homes & Flats on Rent (किराये का मकान, फ्लैट व रूम)', icon: '🔑', tag: '0% BROKERAGE' },
    { id: 'rent-shops-showrooms-godowns', name: 'Shops, Showrooms & Godowns on Rent (किराये की दुकान, शोरूम व गोदाम)', icon: '🏬', tag: 'COMMERCIAL RENT' },
    { id: 'pg-hostel-rooms', name: 'PG & Hostel Rooms (पीजी, हॉस्टल व रूम्स)', icon: '🛏️', tag: 'STUDENT / JOB' },

    // 🏡 2. For Sale (बिकाऊ प्रॉपर्टी)
    { id: 'house-for-sale', name: 'Houses & Kothis for Sale (बिकाऊ मकान, कोठी व विला)', icon: '🏡', tag: 'READY TO MOVE' },
    { id: 'plot-for-sale', name: 'Residential Plots for Sale (बिकाऊ आवासीय प्लॉट व जमीन)', icon: '📐', tag: 'RESIDENTIAL PLOT' },
    { id: 'shop-for-sale', name: 'Commercial Shops & Spaces for Sale (बिकाऊ दुकान व ऑफिस)', icon: '🏪', tag: 'COMMERCIAL SALE' },
    { id: 'uit-plots-land', name: 'UIT / JDA Plots & Land (UIT अनुमोदित प्लॉट व सेक्टर)', icon: '📑', tag: 'UIT / JDA PATTA' },
    { id: 'commercial-plottings', name: 'Commercial Plottings & Warehouse Land (कमर्शियल प्लॉटिंग व गोदाम भूमि)', icon: '🏗️', tag: 'HIGHWAY / MAIN ROAD' },
    { id: 'farmland-agriculture', name: 'Farmland & Agriculture Land (कृषि भूमि, खेत व फार्महाउस)', icon: '🌾', tag: 'BIGHA / ACRE' },

    // 🤝 3. Dealers, Legal & Finance (डीलर्स, सरकारी कार्य व लोन)
    { id: 'property-dealers-agents', name: 'Verified Property Dealers (प्रॉपर्टी डीलर्स व कंसल्टेंट)', icon: '🤝', tag: 'LOCAL AGENTS' },
    { id: 'registry-patta-clearance', name: 'Registry, Patta & Govt Clearance (रजिस्ट्री, पट्टा व नामांतरण)', icon: '⚖️', tag: 'LEGAL DESK' },
    { id: 'home-property-loans', name: 'Home & Property Loan Providers (होम लोन व मॉर्गेज)', icon: '🏦', tag: 'BANK LOANS' },
  ],
},
  {
  id: 'transporters',
  name: 'Transporters / Loading (ट्रांसपोर्ट व माल ढुलाई)',
  icon: '🚚',
  bucketKey: 'individualTransporters',
  subCategories: [
    { id: 'tata-ace-chota-hathi', name: 'Tata Ace / Chhota Hathi (छोटा हाथी - लोकल माल ढुलाई)', icon: '🚐', tag: '750 KG • FAST' },
    { id: 'bolero-maxi-pickup', name: 'Mahindra Bolero Pickup (बोलेरो पिकअप - मंडी व भारी माल)', icon: '🛻', tag: '1.5 TON PAYLOAD' },
    { id: 'loading-auto-3wheeler', name: '3-Wheeler Loading Auto / Ape (लोडिंग ऑटो - संकरी गलियां)', icon: '🛺', tag: '₹250 STARTING' },
    { id: 'e-loader-rickshaw', name: 'E-Loader Rickshaw (ई-लोडर - सस्ता व पर्यावरण अनुकूल)', icon: '⚡', tag: '₹150 LOCAL' },
    { id: 'packers-movers-shifting', name: 'Packers & Movers (घर व ऑफिस शिफ्टिंग - लेबर सहित)', icon: '📦', tag: 'HOUSE SHIFTING' },
    { id: 'tractor-trolley-construction', name: 'Tractor Trolley (ट्रैक्टर ट्रॉली - रेत, मलबा व कृषि माल)', icon: '🚜', tag: 'HEAVY LOAD' },
    { id: 'heavy-trucks-containers', name: 'Canter, 6/10-Tyre Trucks & Containers (केंटर व भारी ट्रक)', icon: '🚛', tag: 'INTERCITY / ALL INDIA' },
    { id: 'towing-crane-recovery', name: '24x7 Breakdown Towing & Recovery Crane (टोइंग क्रेन)', icon: '🚨', tag: 'EMERGENCY TOW' },
  ],
},
  {
  id: 'white-collar',
  name: 'Doctor / CA / Lawyer / Consultant (प्रोफेशनल्स व विशेषज्ञ)',
  icon: '👔',
  bucketKey: 'whiteCollarListings',
  subCategories: [
    // 🩺 1. Healthcare & Clinical Specialists
    { id: 'doctors-physicians-clinics', name: 'Doctors & Specialist Physicians (डॉक्टर व विशेषज्ञ क्लिनिक)', icon: '🩺', tag: 'MD / MBBS' },
    { id: 'dentists-dental-surgeons', name: 'Dentists & Dental Surgeons (दंत चिकित्सक व इंप्लांट)', icon: '🦷', tag: 'BDS / MDS' },
    { id: 'physiotherapy-rehab', name: 'Physiotherapists & Pain Rehab (फिजियोथेरेपिस्ट व रिहैब)', icon: '💆‍♂️', tag: 'BPT / MPT' },

    // 📊 2. Tax, Audit & Corporate Compliance
    { id: 'ca-cs-tax-auditors', name: 'Chartered Accountants & Tax Auditors (CA, CS व टैक्स कंसल्टेंट)', icon: '📊', tag: 'ICAI / GST / ITR' },
    { id: 'financial-wealth-insurance', name: 'Wealth, Mutual Funds & Insurance (फाइनेंशियल व इंश्योरेंस प्लानर)', icon: '📈', tag: 'AMFI / IRDAI' },
    { id: 'msme-subsidy-loan-consultants', name: 'MSME, PMEGP Subsidy & Project Reports (सब्सिडी व प्रोजेक्ट लोन)', icon: '🏦', tag: 'PROJECT LOANS' },

    // ⚖️ 3. Legal, Court & Documentation
    { id: 'advocates-legal-advisors', name: 'Advocates & Legal Advisors (वकील व कानूनी सलाहकार)', icon: '⚖️', tag: 'BAR COUNCIL' },
    { id: 'notary-affidavit-drafting', name: 'Notary Public & Agreement Drafting (नोटरी, शपथ पत्र व एग्रीमेंट)', icon: '📜', tag: 'STAMP & NOTARY' },

    // 📐 4. Architecture, Engineering & Tech
    { id: 'architects-interior-designers', name: 'Architects & 3D Interior Designers (आर्किटेक्ट व 3D डिजाइन)', icon: '📐', tag: 'COA APPROVED' },
    { id: 'civil-structural-valuers', name: 'Structural Engineers & Property Valuers (स्ट्रक्चर व संपत्ति मूल्यांकन)', icon: '🏗️', tag: 'GOVT APPROVED' },
    { id: 'career-visa-consultants', name: 'Career Counselors & Study Abroad Visa (करियर व वीजा कंसल्टेंट)', icon: '🎓', tag: 'CAREER & VISA' },
    { id: 'software-digital-agencies', name: 'Software Developers & Digital Marketing (सॉफ्टवेयर व डिजिटल मार्केटिंग)', icon: '💻', tag: 'TECH & MEDIA' },
  ],
},

// 🏋️ FITNESS, SPORTS & YOGA
  {
    id: 'fitness',
    name: 'Fitness, Sports & Yoga (जिम, स्पोर्ट्स व योग)',
    icon: '🏋️',
    bucketKey: 'fitnessListings',
    subCategories: [
      { id: 'gyms-crossfit', name: 'Unisex Gyms & CrossFit (जिम व फिटनेस सेंटर)', icon: '🏋️', tag: 'AIR CONDITIONED' },
      { id: 'yoga-meditation', name: 'Yoga Instructors & Meditation (योग व मेडिटेशन)', icon: '🧘', tag: 'DAILY SESSIONS' },
      { id: 'turf-badminton-courts', name: 'Box Cricket Turf & Badminton (टर्फ व बैडमिंटन कोर्ट)', icon: '🏏', tag: 'SLOT BOOKING' },
      { id: 'personal-trainers', name: 'Personal Trainers & Diet Coaches (पर्सनल फिटनेस कोच)', icon: '💪', tag: '1-ON-1 COACHING' },
      { id: 'martial-arts-karate', name: 'Karate, Boxing & Self-Defense (कराटे व बॉक्सिंग)', icon: '🥋', tag: 'SELF DEFENSE' },
      { id: 'dietitians-nutrition', name: 'Sports Nutritionists & Dietitians (डाइटिशियन)', icon: '🥗', tag: 'CUSTOM DIET' },
      { id: 'supplements-protein', name: 'Authentic Whey Protein & Supplements (सप्लीमेंट्स स्टोर)', icon: '🥤', tag: '100% GENUINE' },
      { id: 'sports-gear-cycles', name: 'Sports Goods & Geared Cycles (स्पोर्ट्स किट व साइकिल)', icon: '🚴', tag: 'EQUIPMENT' },
    ],
  },

  // 🎬 DIGITAL CREATORS & MEDIA
  {
    id: 'creators',
    name: 'Digital Creators & Freelancers (डिजिटल क्रिएटर्स व मीडिया)',
    icon: '🎬',
    bucketKey: 'creatorsListings',
    subCategories: [
      { id: 'reels-video-editors', name: 'Reels, Shorts & YouTube Video Editors (रील्स व वीडियो एडिटर)', icon: '✂️', tag: 'FAST TURNAROUND' },
      { id: 'cameramen-drone-pilots', name: 'Cine Videographers & Drone Pilots (कैमरामैन व 4K ड्रोन)', icon: '🎥', tag: '4K CINEMA' },
      { id: 'graphic-designers-branding', name: 'Thumbnails, Posters & Logo Designers (ग्राफिक व थंबनेल)', icon: '🎨', tag: 'CANVA / PS / AI' },
      { id: 'social-media-growth', name: 'Social Media Managers & Ad Campaigners (सोशल मीडिया ग्रोथ)', icon: '📈', tag: 'BUSINESS PROMO' },
      { id: 'podcast-creator-studios', name: 'Podcast, Chroma & Studio Rental (पॉडकास्ट व स्टूडियो)', icon: '🎙️', tag: 'HOURLY RENTAL' },
      { id: 'voiceover-dubbing-audio', name: 'Voiceover Artists & Sound Engineers (वॉइसओवर व ऑडियो)', icon: '🔊', tag: 'PRO VOICEOVER' },
      { id: 'content-script-writers', name: 'Script Writers & Ad Copywriters (स्क्रिप्ट व कॉपीराइटर)', icon: '✍️', tag: 'HINDI / ENGLISH' },
      { id: 'models-anchors-hosts', name: 'Event Anchors, Emcees & Local Creators (एंकर व इनफ्लुएंसर)', icon: '🎤', tag: 'EVENT HOST' },
    ],
  },

  // Restaurants
{
  id: 'restaurants',
  name: 'Restaurant / Cafe / Food (रेस्टोरेंट व कैफे)',
  icon: '🍔',
  bucketKey: 'restaurantsList',
  subCategories: [
    { id: 'pure-veg-family', name: 'Pure Veg & Family AC Dining (शुद्ध शाकाहारी रेस्टोरेंट)', icon: '🥗', tag: 'FAMILY AC' },
    { id: 'rooftop-cafes', name: 'Rooftop Cafes, Pizza & Youth Hangouts (रूफटॉप कैफे व पिज्जा)', icon: '☕', tag: 'VIBES & VIEW' },
    { id: 'highway-dhaba', name: 'Highway Dhabas & Dal Baati (हाईवे ढाबा व दाल बाटी)', icon: '🛞', tag: 'DESI MAKHAN' },
    { id: 'street-food-chaat', name: 'Street Food, Chaat & Pyaz Kachori (चाट, कचौड़ी व फास्ट फूड)', icon: '🥘', tag: 'LOCAL TASTE' },
    { id: 'bakeries-sweets', name: 'Bakeries, Cakes & Famous Kalakand (बेकरी, केक व मिठाई)', icon: '🍰', tag: 'FRESH BAKED' },
    { id: 'non-veg-mughlai', name: 'Mughlai, Non-Veg & Biryani (नॉन-वेज व मुगलाई)', icon: '🍗', tag: 'TANDOORI' },
    { id: 'late-night-eats', name: 'Late Night Cravings & 24x7 Food (देर रात का खाना)', icon: '🌙', tag: 'OPEN TILL 2 AM' },
    { id: 'daily-tiffin-thali', name: 'Daily Tiffin Service & Ghar Ki Thali (टिफिन सर्विस व थाली)', icon: '🍱', tag: 'MONTHLY TIFFIN' },
  ],
},
  {
    id: 'malls',
    name: 'Flagship Showrooms & Boutiques (प्रीमियम शोरूम व बुटीक)',
    icon: '💎',
    bucketKey: 'mallsStores',
    subCategories: [
      { id: 'aesthetic-streetwear', name: 'Aesthetic Streetwear & Concept Boutiques (ड्रिप, वेस्टर्न व ओवरसाइज़्ड)', icon: '🧥', tag: 'DRIP & VIBES' },
      { id: 'sneaker-kicks-lounges', name: 'Sneaker Lounges & Kicks Studios (स्नीकर्स, जॉर्डन व जूते)', icon: '👟', tag: 'LIMITED KICKS' },
      { id: 'designer-ethnic-couture', name: 'Designer Ethnic Couture & Bridal Lounges (लग्जरी लहंगे व साड़ियां)', icon: '🥻', tag: 'ROYAL COUTURE' },
      { id: 'apple-experiential-tech', name: 'Flagship Tech & Experience Lounges (एप्पल, साउंडबार व गैजेट्स)', icon: '📱', tag: 'TOUCH & FEEL' },
      { id: 'diamond-fine-jewels', name: 'Fine Jewellery & Diamond Studios (डायमंड व मॉडर्न ज्वेलरी)', icon: '💎', tag: 'FINE JEWELS' },
      { id: 'luxury-perfume-grooming', name: 'Luxury Perfumery & Aesthetic Salons (इम्पोर्टेड परफ्यूम व लाउंज)', icon: '✨', tag: 'FRAGRANCE' },
      { id: 'smart-living-lighting', name: 'Chandelier & Smart Living Galleries (झाड़-फानूस व लक्ज़री डेकोर)', icon: '🛋️', tag: 'AESTHETIC LIVING' },
      { id: 'watch-eyewear-studios', name: 'Luxury Watches & Designer Eyewear (ब्रांडेड घड़ियां व सनग्लासेस)', icon: '🕶️', tag: 'LUXURY EYEWEAR' },
    ],
  },
  // In src/data/taxonomyRegistry.js inside TAXONOMY_REGISTRY
{
  id: 'education',
  name: 'Education, Skills & Apprenticeships (शिक्षा, हुनर व ट्रेनी ट्रेनिंग)',
  icon: '🎓',
  bucketKey: 'educationListings',
  subCategories: [
    // 🎬 1. Creative Media, Video Editing & Photography
    { id: 'video-editing-reels-course', name: 'Reels, YouTube Video Editing & Motion (वीडियो व रील्स एडिटिंग)', icon: '✂️', tag: 'PREMIERE / AE / CAPCUT' },
    { id: 'photography-cinematography', name: 'DSLR Photography, Cine Lighting & Drone (कैमरा, लाइटिंग व ड्रोन)', icon: '📸', tag: 'PRACTICAL SHOOT' },
    
    // 👔 2. White-Collar Professional Apprenticeships & Traineeships
    { id: 'ca-tax-accounts-trainee', name: 'Junior Accountant & CA Office Trainee (अकाउंटेंट व टैक्स ट्रेनी)', icon: '📊', tag: 'GST / ITR / TALLY' },
    { id: 'advocate-legal-apprentice', name: 'Junior Advocate & Court Case Trainee (वकील जूनियरशिप व कोर्ट ट्रेनी)', icon: '⚖️', tag: 'COURT CHAMBER' },
    { id: 'architect-cad-draughtsman', name: 'AutoCAD, 3D Elevation & Draughtsman Trainee (आर्किटेक्ट ड्राफ्ट्समैन)', icon: '📐', tag: 'AUTOCAD & 3DS MAX' },
    { id: 'clinical-assistant-nursing', name: 'Doctor Clinic Assistant & Lab Trainee (क्लिनिक कंपाउंडर व लैब ट्रेनी)', icon: '🩺', tag: 'CLINICAL TRAINING' },

    // 🪡 3. Women Self-Employment & Vocational Skills
    { id: 'silai-cutting-boutique', name: 'Silai, Cutting, Tailoring & Boutique (सिलाई, कटाई व बुटीक ट्रेनिंग)', icon: '🪡', tag: 'GOVT CERTIFICATE' },
    { id: 'beauty-parlour-makeup', name: 'Beauty Parlour, Bridal Makeup & Hair (ब्यूटी पार्लर व मेकअप कोर्स)', icon: '💄', tag: 'PRACTICAL SALON' },
    { id: 'mehandi-design-classes', name: 'Bridal & Arabic Mehandi Art Classes (मेहंदी डिजाइन व ब्राइडल क्लास)', icon: '🌿', tag: '15-DAY CRASH' },
    { id: 'cooking-baking-culinary', name: 'Cooking, Baking & Cake Making (कुकिंग, बेकिंग व केक मेकिंग)', icon: '🎂', tag: 'HOME BAKER' },

    // 🔧 4. Technical Trades, Mechanics, Solar & Hardware
    { id: 'auto-mechanic-ev-training', name: 'Bike/Car Mechanic & EV Technician (ऑटोमोबाइल मैकेनिक व ईवी)', icon: '🏍️', tag: 'GARAGE WORKSHOP' },
    { id: 'solar-inverter-electrician', name: 'Solar Panel Installation & Inverter Wiring (सोलर रूफटॉप व वायरिंग)', icon: '☀️', tag: 'SOLAR ROOFTOP' },
    { id: 'mobile-laptop-repair', name: 'Mobile Hardware & Laptop Chip Repair (मोबाइल व लैपटॉप रिपेयरिंग)', icon: '📱', tag: 'CHIP LEVEL' },
    { id: 'ac-fridge-appliances-course', name: 'AC, Fridge, RO & Electrician Course (एसी, फ्रिज व इलेक्ट्रीशियन)', icon: '⚡', tag: 'LIVE APPLIANCES' },
    { id: 'painting-texture-polishing', name: 'Wall Painting, Texture & Wood Polish (पेंटर, टेक्सचर व पॉलिश)', icon: '🎨', tag: 'ON-SITE WORK' },
    { id: 'driving-school-licence', name: 'Motor Driving School & DL Training (कार ड्राइविंग स्कूल व लाइसेंस)', icon: '🚗', tag: 'DUAL CONTROL' },

    // 🎒 5. School Grades (6th - 10th) & Personal Tutors
    { id: 'school-tuition-6-10', name: 'Class 6th–10th Tuitions & Foundations (कक्षा 6 से 10 ट्यूशन)', icon: '🎒', tag: 'CBSE / RBSE' },
    { id: 'home-tutors-personal', name: '1-on-1 Home Tutors & Subject Teachers (होम ट्यूटर व पर्सनल शिक्षक)', icon: '🏠', tag: 'DOORSTEP 1:1' },

    // 🔬 6. Senior Secondary & Pre-College Entrances (11th - 12th)
    { id: 'neet-jee-science-11-12', name: 'NEET, JEE & 11th-12th Science (नीट, जेईई व 11वीं-12वीं साइंस)', icon: '🔬', tag: 'PCM / PCB' },
    { id: 'commerce-ca-foundation', name: '11th-12th Commerce & CA Foundation (कॉमर्स, सीए व टैली)', icon: '📈', tag: 'ACCOUNTS / ECO' },
    { id: 'arts-humanities-clat', name: '11th-12th Arts, CLAT & Law Entrance (कला वर्ग व कानून प्रवेश)', icon: '🏛️', tag: 'ARTS / CLAT' },

    // 🚩 7. Competitive Exams & Govt Recruitment
    { id: 'ssc-bank-railway-defense', name: 'SSC, Bank PO, Railway & Defense/NDA (एसएससी, बैंक व रेलवे)', icon: '🎖️', tag: 'CENTRAL GOVT' },
    { id: 'state-gov-rpsc-reet', name: 'RPSC RAS, REET, Police & Patwar (आरपीएससी, रीट व पुलिस भर्ती)', icon: '🚩', tag: 'STATE RECRUITMENT' },

    // 💻 8. Digital Skills, Coding & Spoken English
    { id: 'it-coding-computer-skills', name: 'Coding, Web Dev, Tally & RS-CIT (कंप्यूटर, कोडिंग व टैली)', icon: '💻', tag: '1:1 PC LAB' },
    { id: 'spoken-english-ielts', name: 'Spoken English, IELTS & Soft Skills (इंग्लिश स्पीकिंग व आयलेट्स)', icon: '🗣️', tag: 'STAGE GD' },
  ],
},
// In src/data/taxonomyRegistry.js inside TAXONOMY_REGISTRY
{
  id: 'construction',
  name: 'Construction (निर्माण कार्य)',
  icon: '🏗️',
  bucketKey: 'constructionListings',
  subCategories: [
    // Phase 1: Planning, Naksha & Vastu
    { id: 'architect-naksha', name: 'Architect & 2D/3D Naksha (आर्किटेक्ट व नक्शा)', icon: '📐', tag: 'PHASE 1' },
    { id: 'vastu-consultant', name: 'Vastu Consultant (वास्तु विशेषज्ञ व दिशा ज्ञान)', icon: '🧭', tag: 'PHASE 1' },
    { id: 'soil-testing-engineer', name: 'Soil Testing & Structure Engineer (मिट्टी जांच व स्ट्रक्चर)', icon: '🔬', tag: 'PHASE 1' },

    // Phase 2: Foundation, Structure & Raw Material
    { id: 'building-contractors', name: 'Civil Thekedar & Building Contractor (भवन ठेकेदार व लेबर)', icon: '🏗️', tag: 'PHASE 2' },
    { id: 'raw-materials', name: 'Cement, Saria, Bajri & Bricks (सीमेंट, सरिया, बजरी व ईंट)', icon: '🧱', tag: 'PHASE 2' },
    { id: 'water-tanker', name: 'Water Tanker for Curing (तराई हेतु मीठा पानी टैंकर)', icon: '💧', tag: 'PHASE 2' },
    { id: 'jcb-excavator', name: 'JCB, Excavators & Malba Disposal (जेसीबी खुदाई व मलबा)', icon: '🚜', tag: 'PHASE 2' },
    { id: 'iron-shuttering-welding', name: 'Saria Binding, Shuttering & Welding (सरिया, शटरिंग व वेल्डर)', icon: '⛓️', tag: 'PHASE 2' },

    // Phase 3: Concealed Piping & Electrical Wiring
    { id: 'plumbing-sanitary', name: 'Plumbing, Water Tanks & Sanitary (प्लंबर, पाइप व टंकी)', icon: '🚰', tag: 'PHASE 3' },
    { id: 'electrical-wiring', name: 'Conduit Wiring, Switches & Electricians (वायरिंग व इलेक्ट्रीशियन)', icon: '⚡', tag: 'PHASE 3' },

    // Phase 4: Flooring, Chokhat & Metal Fabrication
    { id: 'tile-marble-granite', name: 'Tiles, Marble, Granite & Floor Masons (टाइल, मार्बल व कारीगर)', icon: '🪨', tag: 'PHASE 4' },
    { id: 'woodwork-doors-windows', name: 'Wooden Chokhat, Doors & Carpenter (चौखट, दरवाजे व बढ़ई)', icon: '🚪', tag: 'PHASE 4' },
    { id: 'iron-gates-railings', name: 'Main Iron Gates, Grills & Railings (मेन गेट, ग्रिल व रेलिंग)', icon: '🛡️', tag: 'PHASE 4' },

    // Phase 5: Finishing, Interior & Move-in
    { id: 'paint-putty-waterproofing', name: 'Paint, Putty & Waterproofing (पेंट, पुट्टी व वाटरप्रूफिंग)', icon: '🎨', tag: 'PHASE 5' },
    { id: 'interior-modular-glass', name: 'Modular Kitchen, UPVC & False Ceiling (मॉड्यूलर किचन व ग्लास)', icon: '✨', tag: 'PHASE 5' },
    { id: 'furniture-appliances-setup', name: 'Furniture & New Home Setup (फर्नीचर व गृह उपकरण)', icon: '🛋️', tag: 'PHASE 5' },
    { id: 'cleaning-pest-control', name: 'Deep Cleaning & Anti-Termite Pest Control (दीमक रोकथाम व सफाई)', icon: '🧹', tag: 'PHASE 5' },
  ],
},

{
    id: 'shaadi',
    name: 'Shaadi & Wedding 360° (विवाह सेवा व शादी की तैयारी)',
    icon: '💍',
    bucketKey: 'shaadiVendors',
    subCategories: [
      { id: 'combo-offers', name: 'All-in-One Shaadi Combos (शादी कॉम्बो पैकेजेस - भारी छूट)', icon: '🎁', tag: 'MAX SAVINGS' },
      { id: 'wedding-stuff-buying', name: 'Wedding Stuff Buying (शादी खरीदारी - फर्नीचर, इलेक्ट्रॉनिक्स व ज्वेलरी)', icon: '🛍️', tag: 'WEDDING SHOPPING' },
      { id: 'function-wholesalers', name: 'Function Wholesalers (फंक्शन थोक बाजार - किराना, कपड़ा व डिस्पोजल)', icon: '📦', tag: 'WHOLESALE BULK' },
      { id: 'home-makeover-workers', name: 'Home Makeover Workers (घर का मेकओवर - कारीगर व मिस्त्री)', icon: '🏠', tag: 'INDIVIDUAL PROS' },
      { id: 'guest-management', name: 'Guest Management - Stays & Drivers (अतिथि प्रबंधन - होटल व गाड़ियां)', icon: '🏨', tag: 'STAYS & FLEET' },
      { id: 'marriage-gardens', name: 'Grand Marriage Gardens & Resorts (मैरिज गार्डन व वेन्यू)', icon: '🏰', tag: 'AC BANQUETS' },
      { id: 'halwai-caterers', name: 'Shahi Halwai & Catering (शाही हलवाई व भोजन व्यवस्था)', icon: '🍲', tag: 'DESI GHEE' },
      { id: 'tent-light-sound', name: 'Theme Decor, Mandap & DJ Sound (टेंट, मंडप व डीजे)', icon: '🎪', tag: 'COLD PYRO' },
      { id: 'photographers-cinematic', name: '4K Drone & Cinematic Shoots (फोटोग्राफी व ड्रोन शूट)', icon: '📸', tag: '4K CINEMATIC' },
      { id: 'bridal-makeup-mehendi', name: 'Bridal Makeup & Mehendi Artists (दुल्हन मेकअप व मेहंदी)', icon: '💄', tag: 'HD AIRBRUSH' },
      { id: 'baraat-rituals-pooja', name: 'Ghodi, Bagghi, Band & Pandit Ji (घोड़ी, बग्गी, साफा व पूजा)', icon: '🎺', tag: 'ROYAL SWAGAT' },
    ],
  },
  
  {
    id: 'festival',
    name: 'Festival Offers & Melas (त्योहारी ऑफर्स व मेले)',
    icon: '🎪',
    bucketKey: 'festivalOffers',
    themeColor: 'from-amber-500/20 via-[#1a0508] to-rose-500/20',
    subCategories: [
      { id: 'dhanteras-electronics-auto', name: 'Dhanteras Auto & Appliances (गाड़ी, टीवी व इलेक्ट्रॉनिक्स)', icon: '🚗', tag: 'DHANTERAS DEALS' },
      { id: 'gold-jewellery-bartan', name: 'Sarafa, Gold & Bartan Bazaar (सोना-चांदी व बर्तन बाजार)', icon: '🪙', tag: 'HALLMARK 916' },
      { id: 'sweets-dryfruits-hampers', name: 'Alwar Kalakand, Sweets & Hampers (अलवर कलाकंद व मिठाई)', icon: '🍬', tag: 'DESI GHEE' },
      { id: 'fashion-ethnic-beauty', name: 'Festive Lehariya, Ethnic & Beauty (लहरिया, कपड़े व पार्लर)', icon: '👘', tag: 'FESTIVE STYLE' },
      { id: 'lights-decor-diyas', name: 'Clay Diyas, LED Lights & Torans (दीये, लाइटिंग व सजावट)', icon: '🪔', tag: 'KUMHAR & LIGHTS' },
      { id: 'express-home-prep', name: 'Express Home Clean & Paint (घर की रंगाई व सफाई)', icon: '🧹', tag: 'EXPRESS PREP' },
      { id: 'city-melas-programs', name: 'Alwar Melas, Ramlila & Events (मेले, रामलीला व दर्शन गाइड)', icon: '🎡', tag: 'CITY EVENTS' },
      { id: 'flash-deals-clearance', name: 'Hope Circus Late-Night Deals (होप सर्कस नाइट बाजार)', icon: '⚡', tag: 'MIDNIGHT BAZAAR' },
    ],
  },

 {
    id: 'recommerce',
    name: 'Re-Commerce / Second Hand (पुराना बाज़ार व थ्रिफ्ट)',
    icon: '🛍️',
    bucketKey: 'reCommerceListings',
    subCategories: [
      { id: 'phones-gadgets', name: 'Used Mobiles & Tablets (पुराने मोबाइल व टैबलेट)', icon: '📱', tag: 'BILL & BOX' },
      { id: 'used-bikes-scooters', name: 'Used Bikes, Scooters & Cycles (बाइक, स्कूटी व साइकिल)', icon: '🏍️', tag: 'RC TRANSFER' },
      { id: 'home-furniture-appliances', name: 'Pre-Owned Sofas, Beds & Fridge (फर्नीचर व फ्रिज)', icon: '🛋️', tag: 'HOME UPGRADE' },
      { id: 'moving-out-sale', name: 'Moving Out & Relocation Clearance (घर खाली सेल)', icon: '📦', tag: 'DISTRESS SALE' },
      { id: 'student-books-notes', name: 'Exam Books, Notes & Study Tables (किताबें व नोट्स)', icon: '📚', tag: 'STUDENT DEALS' },
      { id: 'laptops-monitors', name: 'Used Laptops, PCs & Monitors (लैपटॉप व कंप्यूटर)', icon: '💻', tag: 'TESTED' },
      { id: 'kids-cycles-toys', name: 'Kids Cycles, Prams & Toys (बच्चों की साइकिल व खिलौने)', icon: '🧸', tag: 'OUTGROWN' },
      { id: 'fitness-gym-sports', name: 'Home Gym, Dumbbells & Cycles (जिम व स्पोर्ट्स सामान)', icon: '🏋️', tag: 'FITNESS' },
      { id: 'thrift-vintage', name: 'Vintage Items, Antiques & Curios (विंटेज व थ्रिफ्ट)', icon: '🏺', tag: 'RARE FINDS' },
      { id: 'giveaways-free', name: '₹0 Free Giveaways & Donations (मुफ्त सामान व दान)', icon: '🎁', tag: '₹0 FREE' },
    ],
  },
  {
    id: 'vehicles',
    name: 'Automobiles (ऑटोमोबाइल्स)',
    icon: '🏎️',
    bucketKey: 'listings',
    subCategories: [
      { id: 'car-showrooms', name: 'New Car & SUV Showrooms (कार व एसयूवी शोरूम)', icon: '🚘', tag: 'TEST DRIVE' },
      { id: 'bike-showrooms', name: 'Bikes, Sports & Cruisers (बाइक व सुपरबाइक्स)', icon: '🏍️', tag: 'HOT LAUNCH' },
      { id: 'scooters-hub', name: 'Family & Smart Scooters (स्कूटी व टू-व्हीलर)', icon: '🛵', tag: '60+ KM/L' },
      { id: 'electric-ev-hub', name: 'Electric EV Cars & Scooters (इलेक्ट्रिक वाहन)', icon: '⚡', tag: 'SUBSIDY' },
      { id: 'modifications-custom', name: 'Car & Bike Modification & Audio (मोडिफिकेशन व रैप)', icon: '✨', tag: 'CUSTOM' },
      { id: 'servicing-workshops', name: 'Car & Bike Servicing & Garages (वर्कशॉप व सर्विसिंग)', icon: '🔧', tag: 'EXPRESS FIX' },
      { id: 'loans-insurance', name: 'Vehicle Loans & Motor Insurance (कार लोन व बीमा)', icon: '📑', tag: '0% DOWNPAYMENT' },
      { id: 'commercial-pickups', name: 'Commercial Pickups & Trucks (पिकअप व भारी वाहन)', icon: '🚚', tag: 'HEAVY PAYLOAD' },
      { id: 'tractors-agri', name: 'Tractors & Farm Machinery (ट्रैक्टर व कृषि उपकरण)', icon: '🚜', tag: 'AGRI POWER' },
      { id: 'tyres-batteries-alloys', name: 'Tyres, Alloys & Batteries (टायर, अलॉय व बैटरी)', icon: '🛞', tag: 'EXIDE & MRF' },
      { id: 'roadside-assistance-towing', name: '24x7 Towing & Roadside Assistance (टोइंग व इमरजेंसी)', icon: '🚨', tag: '24x7 HELP' },
      { id: 'certified-exchange', name: 'Dealership Exchange & Certified Pre-Owned (एक्सचेंज मेला)', icon: '🔄', tag: 'EXCHANGE BONUS' },
    ],
  },
{
    id: 'electronics',
    name: 'Electronics & Gadgets (इलेक्ट्रॉनिक्स व गैजेट्स)',
    icon: '📱',
    bucketKey: 'listings',
    subCategories: [
      { id: 'smartphones-tablets', name: 'Smartphones & Tablets (मोबाइल व टैबलेट)' },
      { id: 'laptops-computers', name: 'Laptops & Computers (लैपटॉप व कंप्यूटर)' },
      { id: 'home-appliances', name: 'TV, AC & Home Appliances (टीवी, फ्रिज व एसी)' },
      { id: 'audio-wearables', name: 'Audio, Earbuds & Smartwatches (ईयरबड्स व घड़ियां)' },
      { id: 'cameras-cctv', name: 'Cameras & CCTV Security (कैमरा व सीसीटीवी)' },
      { id: 'printers-accessories', name: 'Printers & Accessories (प्रिंटर व कंप्यूटर पार्ट्स)' },
      { id: 'service-centers', name: 'Brand Service Centers (ऑथराइज्ड सर्विस सेंटर)' },
    ],
  },
  // Inside TAXONOMY_REGISTRY in src/data/taxonomyRegistry.js
{
  id: 'fashion',
  name: 'Fashion & Lifestyle (फैशन व लाइफस्टाइल)',
  icon: '✨',
  bucketKey: 'listings',
  subCategories: [
    { id: 'womens-ethnic', name: 'Sarees, Suits & Kurtis (साड़ी, सूट व कुर्ती)', icon: '🥻', tag: 'TRENDING' },
    { id: 'mens-ethnic', name: 'Kurta Pajama & Sherwani (कुर्ता पायजामा व शेरवानी)', icon: '🤵', tag: 'ROYAL' },
    { id: 'streetwear-western', name: 'Jeans, Oversized Tees & Western (जींस व वेस्टर्न)', icon: '👕', tag: 'YOUTH' },
    { id: 'footwear-sneakers', name: 'Sneakers, Sports Shoes & Mojaris (जूते व मोजड़ी)', icon: '👟', tag: 'HOT' },
    { id: 'bridal-festive', name: 'Bridal Lehengas & Sherwani Rent (ब्राइडल व रेंट)', icon: '👑', tag: 'WEDDING' },
    { id: 'boutiques-tailoring', name: 'Boutique Tailoring & Stitching (बुटीक व सिलाई)', icon: '✂️', tag: 'CUSTOM' },
    { id: 'accessories-bags', name: 'Watches, Perfumes, Bags & Eyewear (घड़ियां व चश्मे)', icon: '🕶️', tag: 'LUXURY' },
    { id: 'winterwear', name: 'Jackets, Blazers & Hoodies (जैकेट व ब्लेज़र)', icon: '🧥', tag: 'SEASONAL' },
    { id: 'kids-fashion', name: 'Kids Fancy & Daily Wear (बच्चों के कपड़े)', icon: '👶', tag: 'KIDS' },
    { id: 'preloved-thrift', name: 'Pre-Loved & Branded Thrift (थ्रिफ्ट व पुराना फैशन)', icon: '♻️', tag: 'DEALS' },
  ],
},

// 🏥 MEDICAL, HOSPITALS & HEALTHCARE
 
{
  id: 'medical',
  name: 'Medical, Hospitals & Doctors (चिकित्सा, डॉक्टर व अस्पताल)',
  icon: '🏥',
  bucketKey: 'medicalListings',
  subCategories: [
    // 🩺 1. Specialist Doctors (रोग व विशेषज्ञ अनुसार डॉक्टर)
    { id: 'doc-ortho-bones', name: 'Bones, Joints & Fractures (हड्डी, जोड़ व फ्रैक्चर - Ortho)', icon: '🦴', tag: 'BONES & JOINTS' },
    { id: 'doc-physician-diabetes', name: 'General Medicine & Diabetes (एमडी फिजिशियन, बुखार व शुगर)', icon: '🩺', tag: 'MD MEDICINE' },
    { id: 'doc-gynae-maternity', name: 'Women, Gynae & Maternity (महिला रोग, प्रसूति व बांझपन)', icon: '🤰', tag: 'GYNAECOLOGIST' },
    { id: 'doc-pediatric-child', name: 'Child Specialists & Newborn (शिशु व बाल रोग विशेषज्ञ - Pediatric)', icon: '👶', tag: 'CHILD SPECIALIST' },
    { id: 'doc-cardio-heart', name: 'Heart Specialists & Cardiology (हृदय व बीपी रोग - Cardiologist)', icon: '❤️', tag: 'CARDIOLOGIST' },
    { id: 'doc-ent-specialist', name: 'Ear, Nose, Throat & Sinus (कान, नाक व गला - ENT Specialist)', icon: '👂', tag: 'ENT SURGEON' },
    { id: 'doc-skin-dermatology', name: 'Skin, Hair & Allergy (त्वचा, बाल व चर्म रोग - Dermatologist)', icon: '✨', tag: 'DERMATOLOGY' },
    { id: 'doc-gastro-liver', name: 'Stomach, Liver & Acidity (पेट, लिवर व गैस रोग - Gastro)', icon: '🧪', tag: 'GASTROENTEROLOGY' },
    { id: 'doc-neuro-brain', name: 'Brain, Nerve & Spine (दिमाग, नस व रीढ़ - Neurologist)', icon: '🧠', tag: 'NEUROLOGY' },
    { id: 'doc-kidney-urology', name: 'Kidney, Stones & Urine (किडनी, पथरी व पेशाब रोग - Urology)', icon: '💧', tag: 'UROLOGY' },
    { id: 'doc-dental-surgeons', name: 'Dentists & Root Canal (दंत चिकित्सक व रूट कैनाल - BDS/MDS)', icon: '🦷', tag: 'DENTAL' },
    { id: 'doc-eye-ophthalmology', name: 'Eye Surgeons & Cataract (नेत्र विशेषज्ञ व मोतियाबिंद)', icon: '👁️', tag: 'EYE SPECIALIST' },
    { id: 'doc-ayurveda-homeo', name: 'Ayurveda & Homeopathy (आयुर्वेद, पंचकर्म व होम्योपैथी)', icon: '🌿', tag: 'AYUSH' },

    // 🏥 2. Emergency, Facilities & Home Care
    { id: 'emergency-ambulance-icu', name: '24x7 Emergency, ICU & Ambulance (24 घंटे इमरजेंसी व एम्बुलेंस)', icon: '🚨', tag: '24x7 EMERGENCY' },
    { id: 'multi-specialty-hospitals', name: 'Hospitals & Nursing Homes (मल्टी-स्पेशलिटी अस्पताल व नर्सिंग होम)', icon: '🏥', tag: 'CASHLESS RGHS/AB' },
    { id: 'chemists-24x7-pharmacy', name: '24x7 Medical Stores & Pharmacy (24 घंटे मेडिकल स्टोर व दवाएं)', icon: '💊', tag: '24x7 OPEN' },
    { id: 'diagnostic-pathology-xray', name: 'Pathology Labs & MRI/X-Ray (जांच लैब, ब्लड टेस्ट व एमआरआई)', icon: '🔬', tag: 'HOME SAMPLE' },
    { id: 'home-nursing-oxygen-equip', name: 'Home Nursing & Oxygen Cylinders (होम नर्सिंग, ऑक्सीजन व बेड)', icon: '🫁', tag: 'DOORSTEP CARE' },
  ],
},

  {
    id: 'furniture',
    name: 'Furniture & Decor (फर्नीचर व इंटीरियर)',
    icon: '🛋️',
    bucketKey: 'listings',
    subCategories: [
      { id: 'modular-kitchen', name: 'Modular Kitchen & Wardrobes (मॉड्यूलर किचन व काम)' },
      { id: 'interior-decorators', name: 'Interior Decorators & Designers (इंटीरियर डेकोरेटर्स)' },
      { id: 'glass-aluminium', name: 'Glass, Aluminium & UPVC (ग्लास व एल्युमिनियम वर्क)' },
      { id: 'sofas-living', name: 'Sofas, Recliners & Living (सोफा व बैठक)' },
      { id: 'beds-wardrobes', name: 'Beds, Almirah & Woodwork (बेड व अलमारी)' },
      { id: 'dining-tables', name: 'Dining, Study & Office Desks (डाइनिंग व टेबल)' },
      { id: 'home-decor-curtains', name: 'Curtains, Blinds & Wallpaper (पर्दे व वॉलपेपर)' },
    ],
  },
  {
    id: 'market',
    name: 'Market & Retail (लोकल बाज़ार व डील्स)',
    icon: '🛒',
    bucketKey: 'marketProducts',
    subCategories: [
      { id: 'new-openings', name: 'New Openings & Launches (नई दुकानें व उद्घाटन)' },
      { id: 'sales-clearance', name: 'Mega Sales & Clearance (सेल व भारी छूट)' },
      { id: 'special-deals', name: 'Special Deals & Offers (खास ऑफर्स व डील्स)' },
      { id: 'wholesalers', name: 'Wholesalers & Bulk Supply (थोक विक्रेता व मंडी)' },
      { id: 'brand-showrooms', name: 'Brand Showrooms & Outlets (ब्रांडेड शोरूम)' },
      { id: 'miscellaneous', name: 'Miscellaneous Retail (अन्य बाज़ार स्टोर्स)' },
    ],
  },

  
{
  id: 'advertising',
  name: 'Advertising & Space Exchange (विज्ञापन, स्पेस एक्सचेंज व प्रचार)',
  icon: '📢',
  bucketKey: 'advertisingProviders',
  subCategories: [
    // 🏡 1. Private Ad Space Exchange & Brand Space-Wanted
    { id: 'private-space-roof-walls', name: 'Rent Your Private Wall / Rooftop for Ads (अपनी छत या दीवार विज्ञापन हेतु किराये पर दें)', icon: '🏡', tag: 'EARN MONTHLY RENT' },
    { id: 'brands-seeking-ad-space', name: 'Brands Seeking Wall Paint & Rooftops (ब्रांड्स को विज्ञापन हेतु दीवार/छत चाहिए)', icon: '🎯', tag: 'FREE PAINT + RENT' },
    
    // 🏙️ 2. Hoardings, UIT Unipoles & TownHub In-App Ads
    { id: 'uit-vacant-hoardings-unipoles', name: 'Available UIT & Prime Chowk Hoardings (यूआईटी व चौराहे के खाली होर्डिंग्स)', icon: '🏙️', tag: 'UIT / PRIVATE VACANT' },
    { id: 'townhub-inapp-featured', name: 'TownHub App Top Banner & Featured Spotlight (टाउनहब ऐप पर स्पॉन्सर विज्ञापन)', icon: '📱', tag: 'IN-APP BANNER' },

    // 📰 3. Newspaper Classifieds, Wall Painters & Printing
    { id: 'newspaper-classifieds-agents', name: 'Newspaper Classifieds & Display Ad Agents (अखबार विज्ञापन व क्लासिफाइड एजेंट)', icon: '📰', tag: 'BHASKAR / PATRIKA' },
    { id: 'wall-pillar-commercial-painters', name: 'Wall, Shutter & Pillar Commercial Painters (दीवार, शटर व पिलर पेंटर कारीगर)', icon: '🎨', tag: 'COMMERCIAL ARTIST' },
    { id: 'flex-banner-standees', name: 'Flex Printing, Star Flex & Standees (फ्लैक्स, बैनर व स्टेंडी प्रिंटिंग)', icon: '🖨️', tag: 'SAME-DAY PRINT' },
    { id: 'led-acrylic-glow-signboards', name: '3D Acrylic Letters & LED Glow Signs (एलईडी ग्लो साइन व 3D लेटर)', icon: '✨', tag: 'SHOP FRONT' },

    // 🔊 4. Audio Broadcasts, LED Vans & Social Media
    { id: 'autorickshaw-loudspeaker-promo', name: 'Auto/E-Rickshaw Loudspeaker Audio Promo (ऑटो व ई-रिक्शा लाउडस्पीकर प्रचार)', icon: '📢', tag: 'AUDIO ANNOUNCEMENT' },
    { id: 'led-display-video-vans', name: 'LED Video Display Vans & Roadshows (एलईडी वीडियो प्रचार वैन व स्क्रीन)', icon: '🚛', tag: 'MOBILE ROADSHOW' },
    { id: 'local-influencer-reels-digital', name: 'Local Influencers, Instagram Reels & WhatsApp (लोकल इन्फ्लुएंसर व रील्स)', icon: '🤳', tag: 'VIRAL LOCAL REACH' },
  ],
},

{
  id: 'community',
  name: 'Social Welfare & Community Seva (समाज सेवा व जन कल्याण)',
  icon: '🤝',
  bucketKey: 'communityDrives',
  subCategories: [
    // 🩸 1. Emergency Blood & Medical Aid
    { id: 'emergency-blood-donors', name: 'Emergency Blood Donors & Blood Banks (रक्तदान व ब्लड बैंक)', icon: '🩸', tag: '24x7 EMERGENCY' },
    { id: 'free-medical-eye-camps', name: 'Free Eye Camps, Health & Medicines (मुफ्त नेत्र व स्वास्थ्य शिविर)', icon: '👁️', tag: 'FREE MEDICAL' },
    { id: 'divyang-elderly-seva', name: 'Divyang, Wheelchair & Old Age Seva (दिव्यांग व वृद्धाश्रम सेवा)', icon: '🦽', tag: 'DIVYANG & ELDERS' },

    // 🐄 2. Gau Seva & Animal/Bird Rescue
    { id: 'gau-seva-gaushalas', name: 'Gaushalas, Gau Seva & Green Fodder (गौशाला, हरा चारा व सेवा)', icon: '🐄', tag: 'GAU SEVA' },
    { id: 'animal-rescue-birds', name: 'Injured Animal Rescue, Treatment & Parinde (पशु-पक्षी रेस्क्यू व परिंडे)', icon: '🐕', tag: 'ANIMAL RESCUE' },

    // 🍲 3. Food, Clothes & Direct Relief
    { id: 'roti-bank-food-seva', name: 'Roti Bank, Annakshetra & Leftover Food (रोटी बैंक व भोजन सेवा)', icon: '🍲', tag: 'FREE FOOD SEVA' },
    { id: 'clothes-blanket-donation', name: 'Clothes, Blanket & Winter Relief (वस्त्र, कम्बल व शीतकालीन सेवा)', icon: '🧥', tag: 'CLOTHES DONATION' },

    // 📚 4. Education, Environment & Social Support
    { id: 'free-books-slum-education', name: 'Free Book Banks & Slum Pathshalas (मुफ्त पुस्तक बैंक व पाठशाला)', icon: '📚', tag: 'FREE EDUCATION' },
    { id: 'paryavaran-jal-piyau', name: 'Tree Plantation & Water Piyau Seva (पौधारोपण व प्याऊ सेवा)', icon: '🌱', tag: 'ENVIRONMENT' },
    { id: 'samuhik-vivah-aid', name: 'Samuhik Vivah & Kanya Vivah Aid (सामूहिक विवाह व कन्यादान सहायता)', icon: '🙏', tag: 'MARRIAGE AID' },
  ],
},
];

export function getCategoryById(catId) {
  return TAXONOMY_REGISTRY.find((c) => c.id === catId) || TAXONOMY_REGISTRY[0];
}

// In src/data/taxonomyRegistry.js:
export function sanitizeSubCategoryId(catId, subCatId) {
  const cat = getCategoryById(catId);
  const target = String(subCatId || '').toLowerCase().trim();
  
  // ✅ Keep 'all' or empty subcategories intact instead of forcing them to 'flats'
  if (!target || target === 'all' || target === 'general') {
    return 'all';
  }
  
  const match = cat.subCategories.find(
    (s) => s.id === target || target === s.id || target.includes(s.id)
  );
  
  return match ? match.id : target;
}