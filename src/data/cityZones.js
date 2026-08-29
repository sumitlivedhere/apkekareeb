/**
 * Alwar Hyperlocal Geographic Centroid & Colony Registry
 * Ultra-Granular Micro-Lattice (100+ Pinpoint Localities & Enclaves)
 * 100% Free: High-Precision Haversine Distance + Nominatim Resolver
 */

export const CITY_ZONES = {
  // ═════════════════════════════════════════════════════════════════
  // 1. RANJEET NAGAR, STATION ROAD & DAUDPUR CORRIDOR
  // ═════════════════════════════════════════════════════════════════
  'Ranjeet Nagar (Main Road)': {
    lat: 27.5702,
    lng: 76.6278,
    hindi: 'रणजीत नगर मुख्य मार्ग',
    landmark: 'Ranjeet Nagar Main Market & Daudpur Link',
  },
  'Ranjeet Nagar (A-Block)': {
    lat: 27.5714,
    lng: 76.6269,
    hindi: 'रणजीत नगर (ए-ब्लॉक)',
    landmark: 'Ranjeet Nagar A-Block, near Scheme 8',
  },
  'Ranjeet Nagar (B-Block)': {
    lat: 27.5691,
    lng: 76.6289,
    hindi: 'रणजीत नगर (बी-ब्लॉक)',
    landmark: 'Ranjeet Nagar B-Block, near Dashrath Nagar',
  },
  'Dashrath Nagar': {
    lat: 27.5695,
    lng: 76.6302,
    hindi: 'दशरथ नगर',
    landmark: 'Dashrath Nagar Residential Enclave',
  },
  'Lajpat Nagar': {
    lat: 27.5645,
    lng: 76.6205,
    hindi: 'लाजपत नगर',
    landmark: 'Lajpat Nagar, near Station Road',
  },
  'Anand Nagar': {
    lat: 27.5630,
    lng: 76.6240,
    hindi: 'आनंद नगर',
    landmark: 'Anand Nagar Colony',
  },
  'Shanti Kunj': {
    lat: 27.5645,
    lng: 76.6225,
    hindi: 'शांति कुंज',
    landmark: 'Shanti Kunj Residential Area',
  },
  'Alwar Junction (Station Road)': {
    lat: 27.5684,
    lng: 76.6231,
    hindi: 'अलवर जंक्शन (स्टेशन रोड)',
    landmark: 'Railway Station Circulating Area & Booking Office',
  },
  'Station Road Market': {
    lat: 27.5668,
    lng: 76.6218,
    hindi: 'स्टेशन रोड मार्केट',
    landmark: 'Station Road Commercial Market & Hotels',
  },
  'Daudpur (Phatak Road)': {
    lat: 27.5610,
    lng: 76.6095,
    hindi: 'दाउदपुर (फाटक रोड)',
    landmark: 'Daudpur Railway Crossing & Market',
  },
  'Daudpur (West Enclave)': {
    lat: 27.5622,
    lng: 76.6074,
    hindi: 'दाउदपुर (पश्चिम कॉलोनी)',
    landmark: 'Daudpur West Colony near Scheme 1',
  },
  'Arya Nagar': {
    lat: 27.5635,
    lng: 76.6085,
    hindi: 'आर्य नगर',
    landmark: 'Arya Nagar Residential Sector',
  },

  // ═════════════════════════════════════════════════════════════════
  // 2. UIT SCHEMES 1 TO 10, BASANT VIHAR & VAISHALI NAGAR
  // ═════════════════════════════════════════════════════════════════
  'Scheme 1 (Main Market)': {
    lat: 27.5621,
    lng: 76.6105,
    hindi: 'स्कीम 1 (मार्केट)',
    landmark: 'UIT Scheme 1 Commercial Center',
  },
  'Scheme 1 (Housing Sector)': {
    lat: 27.5638,
    lng: 76.6118,
    hindi: 'स्कीम 1 (आवासीय)',
    landmark: 'Scheme 1 Parks & Housing Rows',
  },
  'Scheme 2 (Commercial Market)': {
    lat: 27.5654,
    lng: 76.6142,
    hindi: 'स्कीम 2 (मार्केट)',
    landmark: 'UIT Scheme 2 Main Market & Shopping Complex',
  },
  'Scheme 2 (A-Block)': {
    lat: 27.5665,
    lng: 76.6131,
    hindi: 'स्कीम 2 (ए-ब्लॉक)',
    landmark: 'Scheme 2 Community Center & A-Block',
  },
  'Scheme 2 (B-Block)': {
    lat: 27.5642,
    lng: 76.6155,
    hindi: 'स्कीम 2 (बी-ब्लॉक)',
    landmark: 'Scheme 2 B-Block, near Raghu Marg',
  },
  'Scheme 3 (Main Market)': {
    lat: 27.5688,
    lng: 76.6189,
    hindi: 'स्कीम 3 (मार्केट)',
    landmark: 'Scheme 3 Shopping Center & Main Park',
  },
  'Scheme 3 (Ext / Basant Vihar Border)': {
    lat: 27.5699,
    lng: 76.6181,
    hindi: 'स्कीम 3 (एक्सटेंशन)',
    landmark: 'Scheme 3 North Extension',
  },
  'Basant Vihar (Sector A)': {
    lat: 27.5695,
    lng: 76.6175,
    hindi: 'बसंत विहार (सेक्टर ए)',
    landmark: 'Basant Vihar Sector A Housing Area',
  },
  'Basant Vihar (Sector B)': {
    lat: 27.5708,
    lng: 76.6162,
    hindi: 'बसंत विहार (सेक्टर बी)',
    landmark: 'Basant Vihar Sector B Enclave',
  },
  'Scheme 4 (Shopping Complex)': {
    lat: 27.5712,
    lng: 76.6215,
    hindi: 'स्कीम 4 (शॉपिंग कॉम्प्लेक्स)',
    landmark: 'UIT Scheme 4 Commercial Area',
  },
  'Scheme 4 (Housing Block)': {
    lat: 27.5728,
    lng: 76.6202,
    hindi: 'स्कीम 4 (आवासीय ब्लॉक)',
    landmark: 'Scheme 4 Hospital Link & Residences',
  },
  'Scheme 5 / Raghu Marg': {
    lat: 27.5640,
    lng: 76.6170,
    hindi: 'स्कीम 5 / रघु मार्ग',
    landmark: 'Raghu Marg Commercial Connecting Street',
  },
  'Scheme 7 (Jail Road)': {
    lat: 27.5745,
    lng: 76.6235,
    hindi: 'स्कीम 7 (जेल रोड)',
    landmark: 'UIT Scheme 7, Jail Road Corridor',
  },
  'Scheme 8 (East Blocks)': {
    lat: 27.5775,
    lng: 76.6268,
    hindi: 'स्कीम 8 (पूर्व)',
    landmark: 'Scheme 8 Housing Blocks & Park Area',
  },
  'Scheme 8 (West / Jail Chauraha)': {
    lat: 27.5761,
    lng: 76.6248,
    hindi: 'स्कीम 8 (पश्चिम)',
    landmark: 'Scheme 8 Jail Chauraha Crossing',
  },
  'Scheme 10 (Ambedkar Nagar)': {
    lat: 27.5842,
    lng: 76.6321,
    hindi: 'स्कीम 10 (अम्बेडकर नगर)',
    landmark: 'UIT Scheme 10 Central Park Area',
  },
  'Scheme 10 (Extension)': {
    lat: 27.5861,
    lng: 76.6342,
    hindi: 'स्कीम 10 (एक्सटेंशन)',
    landmark: 'Scheme 10 North Extension Blocks',
  },
  'Vaishali Nagar (A-Block)': {
    lat: 27.5780,
    lng: 76.6180,
    hindi: 'वैशाली नगर (ए-ब्लॉक)',
    landmark: 'Vaishali Nagar A-Block, Alwar Club Road',
  },
  'Vaishali Nagar (B-Block)': {
    lat: 27.5795,
    lng: 76.6165,
    hindi: 'वैशाली नगर (बी-ब्लॉक)',
    landmark: 'Vaishali Nagar B-Block Residential Area',
  },
  'Shastri Nagar': {
    lat: 27.5662,
    lng: 76.6120,
    hindi: 'शास्त्री नगर',
    landmark: 'Shastri Nagar Residential Colony',
  },
  'Gyan Vihar': {
    lat: 27.5815,
    lng: 76.6350,
    hindi: 'ज्ञान विहार',
    landmark: 'Gyan Vihar Colony',
  },
  'Mangal Vihar': {
    lat: 27.5760,
    lng: 76.6210,
    hindi: 'मंगल विहार',
    landmark: 'Mangal Vihar Residential Block',
  },
  'Panchwati': {
    lat: 27.5735,
    lng: 76.6160,
    hindi: 'पंचवटी',
    landmark: 'Panchwati Enclave',
  },
  'Vijay Nagar (Phase 1)': {
    lat: 27.5830,
    lng: 76.6250,
    hindi: 'विजय नगर (फेज 1)',
    landmark: 'Vijay Nagar Phase 1 Housing Blocks',
  },
  'Vijay Nagar (Phase 2)': {
    lat: 27.5848,
    lng: 76.6232,
    hindi: 'विजय नगर (फेज 2)',
    landmark: 'Vijay Nagar Phase 2 Colony',
  },
  'Karamchari Colony': {
    lat: 27.5710,
    lng: 76.6150,
    hindi: 'कर्मचारी कॉलोनी',
    landmark: 'Karamchari Colony near Basant Vihar',
  },
  'Vivekanand Nagar': {
    lat: 27.5802,
    lng: 76.6205,
    hindi: 'विवेकानंद नगर',
    landmark: 'Vivekanand Nagar Residential Sector',
  },

  // ═════════════════════════════════════════════════════════════════
  // 3. CORE HERITAGE, DOWNTOWN BAZARS & CIVIL LINES
  // ═════════════════════════════════════════════════════════════════
  'Hope Circus (Main Circle)': {
    lat: 27.5530,
    lng: 76.6068,
    hindi: 'होप सर्कस (मुख्य चौराहा)',
    landmark: 'Hope Circus Monument & Fountain',
  },
  'Bazaza Bazar': {
    lat: 27.5538,
    lng: 76.6059,
    hindi: 'बजाजा बाज़ार',
    landmark: 'Cloth Market & Bazaza Gali',
  },
  'Munshi Bazar': {
    lat: 27.5524,
    lng: 76.6074,
    hindi: 'मुंशी बाज़ार',
    landmark: 'Munshi Bazar Retail Complex',
  },
  'Sarafa Bazar': {
    lat: 27.5512,
    lng: 76.6052,
    hindi: 'सराफा बाज़ार',
    landmark: 'Jewellery & Gold Merchant Market',
  },
  'Tripolia Bazar': {
    lat: 27.5505,
    lng: 76.6045,
    hindi: 'त्रिपोलिया बाज़ार',
    landmark: 'Tripolia Mahadev Temple & Bazar',
  },
  'Malakhera Gate / Bazar': {
    lat: 27.5482,
    lng: 76.6061,
    hindi: 'मालाखेड़ा गेट व बाज़ार',
    landmark: 'Malakhera Gate Entrance & Market',
  },
  'Kedalganj': {
    lat: 27.5518,
    lng: 76.6080,
    hindi: 'केदारगंज',
    landmark: 'Kedalganj Grain & Wholesale Market',
  },
  'Purana Katla': {
    lat: 27.5535,
    lng: 76.6088,
    hindi: 'पुराना कटला',
    landmark: 'Purana Katla Wholesale Shops',
  },
  'Ghanta Ghar (Clock Tower)': {
    lat: 27.5545,
    lng: 76.6049,
    hindi: 'घंटा घर',
    landmark: 'Old City Clock Tower Area',
  },
  'Ladia Mohalla': {
    lat: 27.5560,
    lng: 76.6035,
    hindi: 'लड़िया मोहल्ला',
    landmark: 'Ladia Traditional Enclave',
  },
  'City Palace (Old Collectorate)': {
    lat: 27.5552,
    lng: 76.5995,
    hindi: 'सिटी पैलेस परिसर',
    landmark: 'City Palace & Moosi Maharani Chhatri Area',
  },
  'Church Road': {
    lat: 27.5565,
    lng: 76.6185,
    hindi: 'चर्च रोड',
    landmark: 'Church Road, Head Post Office & Convent',
  },
  'Company Bagh (Nehru Park)': {
    lat: 27.5580,
    lng: 76.6245,
    hindi: 'कंपनी बाग (नेहरू पार्क)',
    landmark: 'Company Garden / Nehru Park & Stadium',
  },
  'Bhagat Singh Circle': {
    lat: 27.5575,
    lng: 76.6165,
    hindi: 'भगत सिंह सर्किल',
    landmark: 'Bhagat Singh Chowk Crossing',
  },
  'Ambedkar Circle': {
    lat: 27.5615,
    lng: 76.6192,
    hindi: 'अम्बेडकर सर्किल',
    landmark: 'District Courts & Ambedkar Circle',
  },
  'Nagli Circle': {
    lat: 27.5590,
    lng: 76.6110,
    hindi: 'नंगली सर्किल',
    landmark: 'Nagli Circle Crossing & Ashoka Talkies',
  },
  'Manu Marg (Commercial)': {
    lat: 27.5595,
    lng: 76.6154,
    hindi: 'मनु मार्ग (व्यापारिक)',
    landmark: 'Manu Marg Commercial Corridor',
  },
  'Manu Marg (Hospital Road)': {
    lat: 27.5582,
    lng: 76.6138,
    hindi: 'मनु मार्ग (हॉस्पिटल रोड)',
    landmark: 'General Hospital Link & Clinics',
  },
  'Moti Doongri (Palace Area)': {
    lat: 27.5562,
    lng: 76.6285,
    hindi: 'मोती डूंगरी (पैलेस)',
    landmark: 'Moti Doongri Palace & Hill Base',
  },
  'Moti Doongri (Collectorate Colony)': {
    lat: 27.5548,
    lng: 76.6262,
    hindi: 'मोती डूंगरी (कलेक्ट्रेट कॉलोनी)',
    landmark: 'Collectorate Administrative Colony',
  },
  'Civil Lines (Officers Colony)': {
    lat: 27.5510,
    lng: 76.6180,
    hindi: 'सिविल लाइन्स (ऑफिसर्स कॉलोनी)',
    landmark: 'Civil Lines Residential Quarter',
  },
  'Kailash Nagar': {
    lat: 27.5550,
    lng: 76.6210,
    hindi: 'कैलाश नगर',
    landmark: 'Kailash Nagar Residential Area',
  },

  // ═════════════════════════════════════════════════════════════════
  // 4. SOUTH ALWAR, KALA KUAN, BUDH VIHAR & HKM NAGAR
  // ═════════════════════════════════════════════════════════════════
  'Kala Kuan (Main Market)': {
    lat: 27.5489,
    lng: 76.6087,
    hindi: 'काला कुआं (मार्केट)',
    landmark: 'Kala Kuan Commercial Market & Phatak',
  },
  'Kala Kuan (Housing Board Sector 1)': {
    lat: 27.5475,
    lng: 76.6068,
    hindi: 'काला कुआं (सेक्टर 1)',
    landmark: 'Housing Board Sector 1 Blocks',
  },
  'Housing Board (Sector 2 & 3)': {
    lat: 27.5465,
    lng: 76.6052,
    hindi: 'हाउसिंग बोर्ड (सेक्टर 2 व 3)',
    landmark: 'Housing Board Residential Colony',
  },
  'Budh Vihar (Phase 1)': {
    lat: 27.5412,
    lng: 76.6025,
    hindi: 'बुध विहार (फेज 1)',
    landmark: 'Budh Vihar Phase 1 Central Park',
  },
  'Budh Vihar (Phase 2)': {
    lat: 27.5395,
    lng: 76.6042,
    hindi: 'बुध विहार (फेज 2)',
    landmark: 'Budh Vihar Phase 2 Housing',
  },
  'Budh Vihar (DPS / Bypass Road)': {
    lat: 27.5428,
    lng: 76.6005,
    hindi: 'बुध विहार (डीपीएस रोड)',
    landmark: 'Delhi Public School Road Corridor',
  },
  'Hasan Khan Mewati Nagar (Sector 1)': {
    lat: 27.5385,
    lng: 76.5982,
    hindi: 'हसन खां मेवाती नगर (सेक्टर 1)',
    landmark: 'HKM Nagar Sector 1 Market',
  },
  'Hasan Khan Mewati Nagar (Sector 2)': {
    lat: 27.5368,
    lng: 76.5965,
    hindi: 'हसन खां मेवाती नगर (सेक्टर 2)',
    landmark: 'HKM Nagar Sector 2 Housing Blocks',
  },
  'Hasan Khan Mewati Nagar (Sector 3)': {
    lat: 27.5350,
    lng: 76.5948,
    hindi: 'हसन खां मेवाती नगर (सेक्टर 3)',
    landmark: 'HKM Nagar Sector 3 Extension',
  },
  'Moti Nagar (Central)': {
    lat: 27.5450,
    lng: 76.6110,
    hindi: 'मोती नगर (मध्य)',
    landmark: 'Moti Nagar Residential Layout',
  },
  'Moti Nagar (Extension)': {
    lat: 27.5435,
    lng: 76.6128,
    hindi: 'मोती नगर (एक्सटेंशन)',
    landmark: 'Moti Nagar South Extension',
  },
  'Malviya Nagar (South Sector)': {
    lat: 27.5470,
    lng: 76.6165,
    hindi: 'मालवीय नगर (दक्षिण)',
    landmark: 'Malviya Nagar Sector near Moti Doongri',
  },
  'Aravali Vihar (Thana Area)': {
    lat: 27.5430,
    lng: 76.6190,
    hindi: 'अरावली विहार (थाना क्षेत्र)',
    landmark: 'Aravali Vihar Police Station Link',
  },
  'Aravali Vihar (Residential)': {
    lat: 27.5415,
    lng: 76.6212,
    hindi: 'अरावली विहार (आवासीय)',
    landmark: 'Aravali Vihar Housing Blocks',
  },
  'Jyoti Nagar': {
    lat: 27.5350,
    lng: 76.6050,
    hindi: 'ज्योति नगर',
    landmark: 'Jyoti Nagar Bypass Colony',
  },
  'Sanjay Colony': {
    lat: 27.5460,
    lng: 76.6015,
    hindi: 'संजय कॉलोनी',
    landmark: 'Sanjay Colony near Kala Kuan',
  },
  'Indira Colony': {
    lat: 27.5442,
    lng: 76.6040,
    hindi: 'इंदिरा कॉलोनी',
    landmark: 'Indira Colony Enclave',
  },
  'Rajiv Gandhi Nagar': {
    lat: 27.5372,
    lng: 76.6080,
    hindi: 'राजीव गांधी नगर',
    landmark: 'Rajiv Gandhi Nagar Sector',
  },

  // ═════════════════════════════════════════════════════════════════
  // 5. NORTH-EAST, SHIVAJI PARK, NEB, SURYA NAGAR & SHALIMAR
  // ═════════════════════════════════════════════════════════════════
  'Kali Mori (Flyover / Junction)': {
    lat: 27.5765,
    lng: 76.6325,
    hindi: 'काली मोरी (फ्लाईओवर)',
    landmark: 'Kali Mori Overbridge & Crossing',
  },
  'Kali Mori (Mandi Road)': {
    lat: 27.5750,
    lng: 76.6310,
    hindi: 'काली मोरी (मंडी रोड)',
    landmark: 'Krishi Upaj Mandi Link Road',
  },
  'Tijara Phatak / Overbridge': {
    lat: 27.5732,
    lng: 76.6295,
    hindi: 'तिजारा फाटक',
    landmark: 'Tijara Phatak Overbridge Road',
  },
  'Shivaji Park (Sector 1 & 2)': {
    lat: 27.5742,
    lng: 76.6385,
    hindi: 'शिवाजी पार्क (सेक्टर 1 व 2)',
    landmark: 'Shivaji Park Community Center & Market',
  },
  'Shivaji Park (Sector 3 & 4)': {
    lat: 27.5758,
    lng: 76.6402,
    hindi: 'शिवाजी पार्क (सेक्टर 3 व 4)',
    landmark: 'Shivaji Park Residential Blocks',
  },
  'Subhash Nagar': {
    lat: 27.5721,
    lng: 76.6419,
    hindi: 'सुभाष नगर',
    landmark: 'Subhash Nagar Housing Sector',
  },
  'NEB Colony (Main Market)': {
    lat: 27.5762,
    lng: 76.6451,
    hindi: 'एन.ई.बी. कॉलोनी (मार्केट)',
    landmark: 'NEB Colony Main Market & Thana',
  },
  'NEB Colony (Sector Blocks)': {
    lat: 27.5748,
    lng: 76.6468,
    hindi: 'एन.ई.बी. कॉलोनी (आवासीय)',
    landmark: 'NEB Housing Area',
  },
  'NEB Extension (Block 3/33)': {
    lat: 27.5772,
    lng: 76.6485,
    hindi: 'एन.ई.बी. एक्सटेंशन',
    landmark: 'NEB Extension Housing Enclaves',
  },
  'Ashok Vihar (NEB Side)': {
    lat: 27.5800,
    lng: 76.6380,
    hindi: 'अशोक विहार',
    landmark: 'Ashok Vihar Colony near NEB',
  },
  'Transport Nagar (Logistics Hub)': {
    lat: 27.5812,
    lng: 76.6521,
    hindi: 'ट्रांसपोर्ट नगर (लॉजिस्टिक्स)',
    landmark: 'Alwar Goods Terminal & Transport Offices',
  },
  'Transport Nagar (Workshop Area)': {
    lat: 27.5828,
    lng: 76.6542,
    hindi: 'ट्रांसपोर्ट नगर (वर्कशॉप)',
    landmark: 'Commercial Vehicle Workshops',
  },
  'Surya Nagar (T-Point)': {
    lat: 27.5891,
    lng: 76.6412,
    hindi: 'सूर्य नगर (टी-पॉइंट)',
    landmark: 'Surya Nagar T-Point Junction',
  },
  'Surya Nagar (Delhi Road Link)': {
    lat: 27.5912,
    lng: 76.6430,
    hindi: 'सूर्य नगर (दिल्ली रोड)',
    landmark: 'Surya Nagar Extension',
  },
  'Shalimar (Genesis Complex)': {
    lat: 27.5954,
    lng: 76.6482,
    hindi: 'शालीमार (जेनेसिस)',
    landmark: 'Shalimar Genesis Commercial & Residential',
  },
  'Shalimar (Housing Blocks)': {
    lat: 27.5970,
    lng: 76.6505,
    hindi: 'शालीमार (हाउसिंग)',
    landmark: 'Shalimar Housing Enclave',
  },
  'Delhi Road Commercial Corridor': {
    lat: 27.5910,
    lng: 76.6450,
    hindi: 'दिल्ली रोड कॉरिडोर',
    landmark: 'Delhi Highway Automobile & Retail Hub',
  },
  'Itarana / Cantonment Area': {
    lat: 27.5670,
    lng: 76.6540,
    hindi: 'इटाराना / छावनी क्षेत्र',
    landmark: 'Military Cantonment & Itarana Road',
  },

  // ═════════════════════════════════════════════════════════════════
  // 6. INDUSTRIAL CORRIDORS & OUTSKIRTS
  // ═════════════════════════════════════════════════════════════════
  'MIA (Matsya Ind. Area - North)': {
    lat: 27.5250,
    lng: 76.6650,
    hindi: 'एम.आई.ए. (उत्तर जोन)',
    landmark: 'MIA North Manufacturing Hub',
  },
  'MIA (Matsya Ind. Area - South)': {
    lat: 27.5185,
    lng: 76.6720,
    hindi: 'एम.आई.ए. (दक्षिण जोन)',
    landmark: 'MIA South Heavy Industries',
  },
  'MIA (Old Phase)': {
    lat: 27.5210,
    lng: 76.6680,
    hindi: 'एम.आई.ए. (ओल्ड फेज)',
    landmark: 'MIA Commercial & Engineering Block',
  },
  'Town Center': {
    lat: 27.5530,
    lng: 76.6346,
    hindi: 'टाउन सेंटर',
    landmark: 'Alwar Central Urban Zone',
  },
};

export const cityZones = CITY_ZONES;

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculates Great-Circle distance in meters using Haversine formula.
 */
export function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const EARTH_RADIUS_METERS = 6371000;
  const phi1 = toRadians(lat1);
  const phi2 = toRadians(lat2);
  const deltaPhi = toRadians(lat2 - lat1);
  const deltaLambda = toRadians(lon2 - lon1);

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_METERS * c);
}

/**
 * High-Precision Haversine Colony Resolver (Meter-level lattice matching)
 */
export function findNearestColony(lat, lng) {
  if (!lat || !lng) return 'Ranjeet Nagar (Main Road)';

  let minDistanceMeters = Infinity;
  let closestColony = 'Ranjeet Nagar (Main Road)';

  for (const [colonyName, data] of Object.entries(CITY_ZONES)) {
    if (!data.lat || !data.lng) continue;
    const distance = calculateDistanceMeters(lat, lng, data.lat, data.lng);

    if (distance < minDistanceMeters) {
      minDistanceMeters = distance;
      closestColony = colonyName;
    }
  }

  return closestColony;
}

/**
 * Returns full geographic details with formatted meter distance.
 */
export function findNearestColonyDetail(lat, lng) {
  if (!lat || !lng) {
    return {
      colony: 'Ranjeet Nagar',
      hindi: 'रणजीत नगर',
      landmark: 'Ranjeet Nagar, Alwar',
      distanceMeters: 0,
      formattedDistance: '0 m',
    };
  }

  let minDistanceMeters = Infinity;
  let closestData = null;
  let closestKey = 'Ranjeet Nagar (Main Road)';

  for (const [colonyName, data] of Object.entries(CITY_ZONES)) {
    if (!data.lat || !data.lng) continue;
    const distance = calculateDistanceMeters(lat, lng, data.lat, data.lng);

    if (distance < minDistanceMeters) {
      minDistanceMeters = distance;
      closestKey = colonyName;
      closestData = data;
    }
  }

  const cleanName = closestKey.split('(')[0].trim();
  const formattedDistance =
    minDistanceMeters < 1000
      ? `${minDistanceMeters} m`
      : `${(minDistanceMeters / 1000).toFixed(1)} km`;

  return {
    colony: cleanName,
    fullName: closestKey,
    hindi: closestData?.hindi || cleanName,
    landmark: closestData?.landmark || `${cleanName}, Alwar`,
    distanceMeters: minDistanceMeters,
    formattedDistance,
  };
}

/**
 * 100% Free Hybrid Reverse Geocoder (OpenStreetMap Nominatim + Haversine fallback)
 */
export async function reverseGeocodeFree(lat, lng) {
  if (!lat || !lng) return 'Ranjeet Nagar';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const detectedName = addr.suburb || addr.neighbourhood || addr.residential || addr.quarter || addr.city_district;

      if (detectedName && !detectedName.toLowerCase().includes('alwar') && !detectedName.toLowerCase().includes('rajasthan')) {
        for (const knownColony of Object.keys(CITY_ZONES)) {
          const cleanKnown = knownColony.split('(')[0].trim();
          if (
            detectedName.toLowerCase().includes(cleanKnown.toLowerCase()) ||
            cleanKnown.toLowerCase().includes(detectedName.toLowerCase())
          ) {
            return cleanKnown;
          }
        }
        return detectedName;
      }
    }
  } catch {
    // Silent fallback to local micro-lattice
  }

  const nearest = findNearestColony(lat, lng);
  return nearest.split('(')[0].trim();
}

/**
 * Resolves coordinates from a typed colony query string with fallback handling.
 */
export function resolveLocalityCoordinates(localityName = '', fallbackCity = 'Alwar') {
  if (!localityName || typeof localityName !== 'string') {
    return CITY_ZONES['Ranjeet Nagar (Main Road)'];
  }

  const cleanQuery = localityName.toLowerCase().trim();

  for (const [zoneKey, coords] of Object.entries(CITY_ZONES)) {
    if (zoneKey.toLowerCase() === cleanQuery || zoneKey.toLowerCase().startsWith(cleanQuery)) {
      return coords;
    }
  }

  for (const [zoneKey, coords] of Object.entries(CITY_ZONES)) {
    const cleanZone = zoneKey.toLowerCase();
    if (cleanQuery.includes(cleanZone) || cleanZone.includes(cleanQuery)) {
      return coords;
    }
  }

  return CITY_ZONES['Ranjeet Nagar (Main Road)'];
}

export default CITY_ZONES;
// Alias export for backward-compatibility
export const reverseGeocodeWithFallback = reverseGeocodeFree;