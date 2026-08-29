/**
 * Hyperlocal Category Form Schema & Dynamic Specification Registry
 * Provides category-specific field definitions, adaptive pricing models,
 * custom specifications, and contextual seller guidance across all verticals.
 */

export const CATEGORY_FORM_SCHEMAS = {
  // ── 1. RETAIL & GENERAL MARKET ─────────────────────────────────
  market: {
    categoryName: 'Town Marketplace & Kirana',
    isService: false,
    pricing: {
      priceLabel: 'Selling / Offer Price (बिक्री मूल्य)',
      pricePlaceholder: 'e.g. 450 or 120 / Kg',
      showOriginalPrice: true,
      priceTypes: ['Fixed Price', 'Per Kg / Weight', 'Per Pack / Box', 'Special Combo Offer'],
      defaultTiming: '09:00 AM - 09:30 PM',
    },
    specifications: [
      {
        key: 'stock_status',
        label: 'Stock Availability (उपलब्धता)',
        type: 'select',
        options: ['Ready Stock in Shop', 'Limited Stock (1-2 Left)', 'Made to Order', 'Pre-Order (1 Day)'],
        default: 'Ready Stock in Shop',
      },
      {
        key: 'condition',
        label: 'Item Condition (स्थिति)',
        type: 'select',
        options: ['Brand New / Fresh Stock', 'Packaged & Sealed', 'Handcrafted / Freshly Prepared'],
        default: 'Brand New / Fresh Stock',
      },
      {
        key: 'delivery_option',
        label: 'Delivery & Pickup (डिलीवरी सुविधा)',
        type: 'select',
        options: ['Shop Pickup & Home Delivery', 'Shop Pickup Only', 'Free Local Home Delivery'],
        default: 'Shop Pickup & Home Delivery',
      },
    ],
    guidance: {
      step1Title: 'Product & Shop Basics',
      titleLabel: 'Product / Deal Title *',
      titlePlaceholder: 'e.g. Pure Desi Ghee Sweets & Dry Fruit Box',
      titleHelp: 'Mention the brand, item name, and pack size or variant.',
      sellerLabel: 'Shop / Business Name *',
      sellerPlaceholder: 'e.g. Bikaner Sweets & Namkeen Bhandar',
      photoHelp: 'Upload clear front photos of the product packaging and price tag.',
      bulletPlaceholders: [
        'Fresh quality guarantee & preparation date',
        'Ingredients / Material details & weight options',
        'Special festival or bulk purchase discount',
        'Home delivery available across local colonies in Alwar',
      ],
    },
  },

  // ── 2. FASHION, APPAREL & FOOTWEAR ─────────────────────────────
  fashion: {
    categoryName: 'Fashion & Clothing Studio',
    isService: false,
    pricing: {
      priceLabel: 'Outfit / Dress Price (कपड़ों का मूल्य)',
      pricePlaceholder: 'e.g. 1499',
      showOriginalPrice: true,
      priceTypes: ['Fixed Offer Price', 'Starting From', 'Rental Charge (Per Day)', 'Stitching / Making Fee'],
      defaultTiming: '10:00 AM - 09:30 PM',
    },
    specifications: [
      {
        key: 'gender_category',
        label: 'Category (श्रेणी)',
        type: 'select',
        options: ['Women Ethnic & Party Wear', 'Men Wear & Kurta Sets', 'Kids Wear', 'Bridal & Groom Couture'],
        default: 'Women Ethnic & Party Wear',
      },
      {
        key: 'sizes_available',
        label: 'Available Sizes (उपलब्ध साइज़)',
        type: 'text',
        placeholder: 'e.g. S, M, L, XL, XXL or Free Size (Custom Fit)',
      },
      {
        key: 'fabric_type',
        label: 'Fabric & Material (कपड़ा प्रकार)',
        type: 'text',
        placeholder: 'e.g. Pure Georgette, Silk, Cotton, Velvet',
      },
      {
        key: 'alteration_service',
        label: 'Fitting & Alteration (फिटिंग सुविधा)',
        type: 'select',
        options: ['Free In-Shop Fitting & Alteration', 'Custom Made to Measure', 'Standard Ready Size'],
        default: 'Free In-Shop Fitting & Alteration',
      },
    ],
    guidance: {
      step1Title: 'Garment & Boutique Details',
      titleLabel: 'Outfit / Garment Name *',
      titlePlaceholder: 'e.g. Pure Georgette Hand-Embroidered Anarkali Suit',
      titleHelp: 'Include fabric, pattern, and occasion (party, wedding, casual).',
      sellerLabel: 'Boutique / Store Name *',
      sellerPlaceholder: 'e.g. Royal Rajputana Boutique',
      photoHelp: 'Upload mannequin view, fabric close-up, and embroidery details.',
      bulletPlaceholders: [
        'Pure authentic fabric with high-grade lining & finishing',
        'Free sizing alteration & custom fitting service in-store',
        'Matching dupatta and bottom wear included in set',
        'Exchange policy & color variant options available',
      ],
    },
  },

  // ── 3. ELECTRONICS, APPLIANCES & REPAIRS ───────────────────────
  electronics: {
    categoryName: 'Electronics & Mobile Hub',
    isService: false,
    pricing: {
      priceLabel: 'Product Price / Repair Estimate (मूल्य)',
      pricePlaceholder: 'e.g. 12999 or 350 (Repairing)',
      showOriginalPrice: true,
      priceTypes: ['Fixed Offer Price', 'Starting From', 'Repair Service Charge', 'Exchange Price'],
      defaultTiming: '10:00 AM - 09:00 PM',
    },
    specifications: [
      {
        key: 'device_condition',
        label: 'Condition (स्थिति)',
        type: 'select',
        options: ['Brand New (Sealed Pack)', 'Open Box / Certified Refurbished', 'Pre-Owned (Gently Used)'],
        default: 'Brand New (Sealed Pack)',
      },
      {
        key: 'warranty_period',
        label: 'Warranty (वारंटी)',
        type: 'text',
        placeholder: 'e.g. 1 Year Brand Warranty + 6 Months Shop Guarantee',
      },
      {
        key: 'bill_and_box',
        label: 'Box & Accessories (बॉक्स व बिल)',
        type: 'select',
        options: ['Original GST Bill & Full Box Included', 'Original Bill Only', 'Device + Charger Only'],
        default: 'Original GST Bill & Full Box Included',
      },
    ],
    guidance: {
      step1Title: 'Device Specs & Warranty',
      titleLabel: 'Product Model & Storage *',
      titlePlaceholder: 'e.g. Samsung 43-inch 4K Smart LED TV (2025 Model)',
      titleHelp: 'State exact brand, model number, screen size, or RAM/Storage.',
      sellerLabel: 'Electronics Shop Name *',
      sellerPlaceholder: 'e.g. Alwar Digital World',
      photoHelp: 'Upload photo of device screen on, model sticker, and accessories box.',
      bulletPlaceholders: [
        '100% genuine product with official brand warranty & GST bill',
        'Same-day installation & doorstep demo in Alwar city',
        'Old device exchange bonus & zero down-payment EMI available',
        'Complimentary high-speed HDMI cable & wall mount bracket included',
      ],
    },
  },

  // ── 4. KAARIGAR & ON-SITE TRADES ───────────────────────────────
  kaarigar: {
    categoryName: 'Kaarigar & Craftsmen Services',
    isService: true,
    pricing: {
      priceLabel: 'Visiting / Inspection Fee (विज़िटिंग शुल्क)',
      pricePlaceholder: 'e.g. 150 (Visiting & Fault Check)',
      showOriginalPrice: false,
      priceTypes: ['Fixed Visit Charge', 'Per Hour Rate', 'Per Point / Task Rate', 'Free Quote / Inspection'],
      defaultTiming: '08:00 AM - 08:30 PM',
    },
    specifications: [
      {
        key: 'experience_years',
        label: 'Work Experience (अनुभव)',
        type: 'select',
        options: ['1-3 Years', '3-5 Years', '5-10 Years', '10+ Years (Master / Ustad)'],
        default: '5-10 Years',
      },
      {
        key: 'response_time',
        label: 'Arrival Time (पहुंचने का समय)',
        type: 'select',
        options: ['Within 30 Mins (Emergency Visit)', 'Within 1-2 Hours', 'Same Day Visit', 'Scheduled Time Only'],
        default: 'Within 30 Mins (Emergency Visit)',
      },
      {
        key: 'tools_provided',
        label: 'Tools & Equipment (उपकरण)',
        type: 'select',
        options: ['Full Commercial Power Kit Owned', 'All Required Tools Brought', 'Basic Hand Tools'],
        default: 'Full Commercial Power Kit Owned',
      },
      {
        key: 'service_guarantee',
        label: 'Work Guarantee (काम की गारंटी)',
        type: 'text',
        placeholder: 'e.g. 30 Days Free Rework Guarantee on all repairs',
      },
    ],
    guidance: {
      step1Title: 'Master Craftsman Profile',
      titleLabel: 'Skill & Service Speciality *',
      titlePlaceholder: 'e.g. Sharma Ji - Expert Concealed Wiring & Inverter Repair',
      titleHelp: 'Mention your name, trade specialty, and local service coverage.',
      sellerLabel: 'Craftsman / Agency Name *',
      sellerPlaceholder: 'e.g. Sharma Electricals & Home Services',
      photoHelp: 'Upload your visiting card, professional toolkit, and photos of ongoing work.',
      bulletPlaceholders: [
        'Concealed wiring, short-circuit fixing & MCB panel repair',
        '30-day service warranty with free rework support',
        'Quick 30-minute reach across local schemes and colonies',
        'Genuine ISI-certified spare parts provided at market rate',
      ],
    },
  },

  // ── 5. TRANSPORTERS, LOADERS & PACKERS ─────────────────────────
  transporters: {
    categoryName: 'Transporters, Loaders & Moving',
    isService: true,
    pricing: {
      priceLabel: 'Base Trip / Loader Fare (किराया)',
      pricePlaceholder: 'e.g. 450 (Local Trip) or 18 / Km',
      showOriginalPrice: false,
      priceTypes: ['Local Trip Base Fare', 'Per KM Rate (Outstation)', 'Full Day Vehicle Booking', 'Packers & Movers Package'],
      defaultTiming: '24 Hours Service Available',
    },
    specifications: [
      {
        key: 'vehicle_type',
        label: 'Vehicle Model (गाड़ी का प्रकार)',
        type: 'select',
        options: [
          'Tata Ace (Chota Hathi) Open Body',
          'Tata Ace Closed Container',
          'Mahindra Bolero Maxi Truck (1.7T)',
          'Eicher 14ft / 17ft Heavy Loader',
          '3-Wheeler Loading Auto',
        ],
        default: 'Tata Ace (Chota Hathi) Open Body',
      },
      {
        key: 'permit_type',
        label: 'Permit & Route (परमिट)',
        type: 'select',
        options: ['Rajasthan All-District Permit', 'All India National Permit (Delhi/NCR/Jaipur)', 'Alwar Local City Only'],
        default: 'Rajasthan All-District Permit',
      },
      {
        key: 'labor_support',
        label: 'Loading Labor (मजदूर / हम्माल)',
        type: 'select',
        options: ['Driver Only (Self Loading)', '1 Loading Helper Provided', 'Full Packing & Moving Labor Team'],
        default: '1 Loading Helper Provided',
      },
    ],
    guidance: {
      step1Title: 'Fleet & Route Details',
      titleLabel: 'Service & Vehicle Offering *',
      titlePlaceholder: 'e.g. Alwar Express 1.5-Ton Tata Ace Loader Service',
      titleHelp: 'Mention vehicle model, payload capacity, and operating routes.',
      sellerLabel: 'Transport Firm / Driver Name *',
      sellerPlaceholder: 'e.g. Alwar Roadways & Goods Carrier',
      photoHelp: 'Upload photos showing the vehicle front with number plate and cargo bed.',
      bulletPlaceholders: [
        'Clean, waterproof container/tarpaulin cover for cargo safety',
        'Experienced driver with zero damage record',
        'Available 24x7 for urgent household and industrial goods moving',
        'Transparent meter/trip pricing with zero hidden charges',
      ],
    },
  },

  // ── 6. PROPERTY, REAL ESTATE & RENTALS ─────────────────────────
  property: {
    categoryName: 'Property, Rentals & Commercial Hub',
    isService: false,
    pricing: {
      priceLabel: 'Monthly Rent / Sale Price (किराया / कीमत)',
      pricePlaceholder: 'e.g. 7500 / Month or 45 Lakhs',
      showOriginalPrice: false,
      priceTypes: ['Monthly Rent', 'Outright Sale Demand', 'Lease Amount (Annual)', 'PG Bed / Room Rate'],
      defaultTiming: '09:00 AM - 08:00 PM',
    },
    specifications: [
      {
        key: 'property_type',
        label: 'Property Type (प्रॉपर्टी प्रकार)',
        type: 'select',
        options: [
          '2 BHK Flat / Apartment',
          '1 BHK Independent Floor',
          '3 BHK Luxury House / Villa',
          'Commercial Shop / Showroom',
          'Residential Plot / Land',
          'Hostel / Single PG Room',
        ],
        default: '2 BHK Flat / Apartment',
      },
      {
        key: 'furnishing_status',
        label: 'Furnishing (फर्निशिंग)',
        type: 'select',
        options: ['Fully Furnished (AC, Bed, RO, Sofa)', 'Semi-Furnished (Wardrobes, Fans, Lights)', 'Unfurnished (Raw)'],
        default: 'Semi-Furnished (Wardrobes, Fans, Lights)',
      },
      {
        key: 'tenant_preference',
        label: 'Tenant Preference (किरायेदार पसंद)',
        type: 'select',
        options: ['Family Only', 'Working Professionals / Bachelors', 'Students (Girls/Boys)', 'Anyone Welcome'],
        default: 'Family Only',
      },
      {
        key: 'carpet_area',
        label: 'Area Size (क्षेत्रफल)',
        type: 'text',
        placeholder: 'e.g. 120 Gaj or 1100 Sq.Ft.',
      },
    ],
    guidance: {
      step1Title: 'Property & Location Details',
      titleLabel: 'Property Listing Title *',
      titlePlaceholder: 'e.g. Spacious 2 BHK Semi-Furnished Flat near Kala Kuan Market',
      titleHelp: 'State BHK, floor number, society/colony name, and proximity to landmarks.',
      sellerLabel: 'Owner / Broker Name *',
      sellerPlaceholder: 'e.g. Direct Property Owner / Verma Properties',
      photoHelp: 'Upload well-lit photos of the living room, kitchen, bathroom, and building front.',
      bulletPlaceholders: [
        '24-hour sweet water supply, power backup & dedicated bike/car parking',
        'Walking distance to market, school, hospital & bank ATMs',
        'Spacious modular kitchen with chimney and exhaust setup',
        'Direct owner dealing with zero brokerage / transparent agreement terms',
      ],
    },
  },

  // ── 7. MEDICAL, DOCTORS & CLINICS ──────────────────────────────
  medical: {
    categoryName: 'Medical, Clinics & Health Care',
    isService: true,
    pricing: {
      priceLabel: 'Consultation Fee (परामर्श शुल्क)',
      pricePlaceholder: 'e.g. 300 (OPD Checkup)',
      showOriginalPrice: false,
      priceTypes: ['OPD Consultation Fee', 'Treatment Package', 'Diagnostic Test Fee', 'Home Visit Fee'],
      defaultTiming: '10:00 AM - 02:00 PM & 05:00 PM - 08:30 PM',
    },
    specifications: [
      {
        key: 'doctor_degree',
        label: 'Qualifications & Degree (डिग्री)',
        type: 'text',
        placeholder: 'e.g. MBBS, MD (Medicine), BAMS, BDS (Gold Medalist)',
      },
      {
        key: 'experience_years',
        label: 'Clinical Experience (अनुभव)',
        type: 'select',
        options: ['3-5 Years Experience', '5-10 Years Experience', '10-20 Years Senior Consultant', '20+ Years Veteran Specialist'],
        default: '10-20 Years Senior Consultant',
      },
      {
        key: 'emergency_availability',
        label: 'Emergency Support (आपातकालीन सेवा)',
        type: 'select',
        options: ['24x7 Emergency Call On-Duty', 'Clinic Working Hours Only', 'Home Visit Available on Request'],
        default: 'Clinic Working Hours Only',
      },
    ],
    guidance: {
      step1Title: 'Doctor & Clinic Credentials',
      titleLabel: 'Doctor / Clinic Speciality *',
      titlePlaceholder: 'e.g. Dr. K.K. Sharma - Senior Child & Newborn Specialist Clinic',
      titleHelp: 'Mention Doctor Name, Speciality, and Clinic Landmark.',
      sellerLabel: 'Clinic / Hospital Name *',
      sellerPlaceholder: 'e.g. Sharma Child Care & Vaccination Center',
      photoHelp: 'Upload clinic signboard, doctor chamber, and sanitized waiting hall photos.',
      bulletPlaceholders: [
        'Specialist consultation for pediatric, chronic & seasonal health issues',
        'Fully sanitized chamber with modern diagnostic equipment',
        'Advance appointment booking to avoid long waiting times',
        'Emergency phone consultation available for registered patients',
      ],
    },
  },

  // ── 8. EDUCATION, TUTORS & COACHING ────────────────────────────
  education: {
    categoryName: 'Education, Tutors & Coaching Hub',
    isService: true,
    pricing: {
      priceLabel: 'Monthly Tuition / Course Fee (फीस)',
      pricePlaceholder: 'e.g. 1500 / Month or 12000 (Full Course)',
      showOriginalPrice: true,
      priceTypes: ['Monthly Tuition Fee', 'Full Year Package', 'Per Subject Rate', 'Hourly Doubt Session'],
      defaultTiming: '06:30 AM - 08:00 PM',
    },
    specifications: [
      {
        key: 'classes_covered',
        label: 'Target Classes (कक्षाएं)',
        type: 'select',
        options: [
          'Class 9th & 10th (CBSE / RBSE)',
          'Class 11th & 12th Science (PCM / PCB)',
          'Class 11th & 12th Commerce & Arts',
          'Primary & Middle (Class 1st to 8th)',
          'Competitive Exams (REET / Police / SSC / Bank)',
          'Spoken English & Computer Diploma',
        ],
        default: 'Class 9th & 10th (CBSE / RBSE)',
      },
      {
        key: 'batch_type',
        label: 'Batch Format (बैच प्रकार)',
        type: 'select',
        options: ['1-on-1 Personal Home Tutor', 'Small Batch (8-12 Students)', 'Institute Classroom Batch', 'Live Online Coaching'],
        default: 'Small Batch (8-12 Students)',
      },
      {
        key: 'demo_policy',
        label: 'Free Demo Class (डेमो सुविधा)',
        type: 'select',
        options: ['2 Days Free Demo Class Available', '1 Day Free Trial', 'Direct Admission Only'],
        default: '2 Days Free Demo Class Available',
      },
    ],
    guidance: {
      step1Title: 'Faculty & Course Profile',
      titleLabel: 'Course / Coaching Program Title *',
      titlePlaceholder: 'e.g. Target 95%+ Mathematics & Science Batch for Class 10th',
      titleHelp: 'Highlight the subject, board, faculty name, and target exam year.',
      sellerLabel: 'Institute / Tutor Name *',
      sellerPlaceholder: 'e.g. Verma Science Academy / Er. Rohit Verma',
      photoHelp: 'Upload classroom setup, whiteboard lectures, and previous student scorecards.',
      bulletPlaceholders: [
        'Concept-based chapter-wise lectures with weekly Sunday test series',
        'Printed study material, formula sheets & previous 10-year question banks',
        'Special 1-on-1 doubt clearing classes before board examinations',
        '2 days free demo class with zero advance commitment',
      ],
    },
  },

  // ── 9. VEHICLES & AUTOMOBILES ──────────────────────────────────
  vehicles: {
    categoryName: 'Vehicles, Used Bikes & Automobiles',
    isService: false,
    pricing: {
      priceLabel: 'Selling Demand Price (मांग मूल्य)',
      pricePlaceholder: 'e.g. 48000 (Bike) or 3.25 Lakhs (Car)',
      showOriginalPrice: false,
      priceTypes: ['Demand Price (Negotiable on Spot)', 'Fixed Price (Final)', 'Down Payment (EMI Finance Available)'],
      defaultTiming: '09:00 AM - 08:30 PM',
    },
    specifications: [
      {
        key: 'model_year',
        label: 'Model Manufacturing Year (मॉडल वर्ष)',
        type: 'select',
        options: ['2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017 & Older'],
        default: '2022',
      },
      {
        key: 'ownership_serial',
        label: 'Owner Serial (स्वामित्व)',
        type: 'select',
        options: ['1st Owner (Single Hand Driven)', '2nd Owner', '3rd Owner'],
        default: '1st Owner (Single Hand Driven)',
      },
      {
        key: 'fuel_type',
        label: 'Fuel Type (ईंधन)',
        type: 'select',
        options: ['Petrol', 'Diesel', 'CNG + Petrol', 'Electric (EV)'],
        default: 'Petrol',
      },
      {
        key: 'km_driven',
        label: 'Kilometers Driven (चली हुई दूरी)',
        type: 'text',
        placeholder: 'e.g. 24,000 KM (Genuine meter reading)',
      },
    ],
    guidance: {
      step1Title: 'Vehicle Specs & RC Details',
      titleLabel: 'Vehicle Make, Model & Variant *',
      titlePlaceholder: 'e.g. Hero Splendor Plus BS6 (2022) - 1st Owner Super Clean',
      titleHelp: 'Mention Brand, Exact Model, Variant, and Registration District.',
      sellerLabel: 'Seller / Auto Deal Name *',
      sellerPlaceholder: 'e.g. Direct Owner / City Auto Deals Alwar',
      photoHelp: 'Upload 360-degree exterior views, speedometer odometer reading, and tires.',
      bulletPlaceholders: [
        'Single hand driven with timely authorized showroom service history',
        'Valid insurance, pollution certificate & all original transfer documents ready',
        'Both tires in 85%+ condition, smooth engine & zero accident guarantee',
        'Spot RC transfer assistance & transparent on-table price negotiation',
      ],
    },
  },

  // ── 10. SHAADI & EVENT VENDORS ─────────────────────────────────
  shaadi: {
    categoryName: 'Shaadi, Events & Marriage Services',
    isService: true,
    pricing: {
      priceLabel: 'Package / Booking Price (पैकेज दर)',
      pricePlaceholder: 'e.g. 25000 (Full Event Setup)',
      showOriginalPrice: true,
      priceTypes: ['Full Event Package Rate', 'Per Plate / Per Guest Rate', 'Per Day Rental Rate', 'Custom Quote on Consultation'],
      defaultTiming: '09:00 AM - 10:00 PM',
    },
    specifications: [
      {
        key: 'vendor_trade',
        label: 'Service Vertical (सेवा प्रकार)',
        type: 'select',
        options: [
          'Bridal Makeup & Groom Styling',
          'Wedding Photography & Cinematic Video',
          'Catering & Traditional Halwai Service',
          'Decoration, Mandap & Theme Setup',
          'DJ, Sound & Dhol Troupe',
          'Band, Baaja & Royal Ghodi/Bagghi',
        ],
        default: 'Wedding Photography & Cinematic Video',
      },
      {
        key: 'advance_token_required',
        label: 'Advance Booking Token (एडवांस बुकिंग)',
        type: 'text',
        placeholder: 'e.g. 20% Advance to lock wedding date',
      },
      {
        key: 'crew_capacity',
        label: 'Team Size (टीम क्षमता)',
        type: 'select',
        options: ['Full Professional Team Provided', '2-4 Specialist Crew', 'Sole Master Professional'],
        default: 'Full Professional Team Provided',
      },
    ],
    guidance: {
      step1Title: 'Vendor Portfolio & Package',
      titleLabel: 'Event Service Package Title *',
      titlePlaceholder: 'e.g. Royal Cinematic Wedding Photography & Drone 4K Package',
      titleHelp: 'Include your studio name, key inclusions (Drone, Teaser, Album), and date availability.',
      sellerLabel: 'Vendor / Studio Business Name *',
      sellerPlaceholder: 'e.g. Mahawar Wedding Films & Events',
      photoHelp: 'Upload sample portraits, stage setups, and high-resolution event shots.',
      bulletPlaceholders: [
        '4K Cinematic Teaser, traditional video, candid photography & luxury photobook album',
        'High-end Sony FX3 / A7IV cameras with professional prime lighting & drone shoot',
        'Delivery of edited highlights & teaser reels within 15 days of wedding',
        'Custom packages available for Haldi, Mehendi, Sangeet & Reception nights',
      ],
    },
  },
};

// Aliased fallbacks for related category aliases
CATEGORY_FORM_SCHEMAS['furniture'] = CATEGORY_FORM_SCHEMAS['market'];
CATEGORY_FORM_SCHEMAS['recommerce'] = CATEGORY_FORM_SCHEMAS['market'];
CATEGORY_FORM_SCHEMAS['fitness'] = CATEGORY_FORM_SCHEMAS['education'];
CATEGORY_FORM_SCHEMAS['creators'] = CATEGORY_FORM_SCHEMAS['shaadi'];
CATEGORY_FORM_SCHEMAS['white-collar'] = CATEGORY_FORM_SCHEMAS['kaarigar'];
CATEGORY_FORM_SCHEMAS['advertising'] = CATEGORY_FORM_SCHEMAS['market'];
CATEGORY_FORM_SCHEMAS['construction'] = CATEGORY_FORM_SCHEMAS['kaarigar'];

/**
 * Returns the resolved schema for any category id.
 * Falls back to the standard 'market' schema if unspecified.
 */
export function getListingSchema(category = 'market') {
  const cleanKey = String(category || 'market').toLowerCase().trim();
  return CATEGORY_FORM_SCHEMAS[cleanKey] || CATEGORY_FORM_SCHEMAS['market'];
}

export default CATEGORY_FORM_SCHEMAS;