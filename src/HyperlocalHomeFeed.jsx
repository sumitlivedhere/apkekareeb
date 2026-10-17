import React, { useState } from 'react';

// 🏛️ Master 21 Local Alwar Categories Specification
const MASTER_CATEGORIES = [
  {
    id: 'kaarigar',
    name: 'Kaarigar & Mistri',
    hindiName: 'कारीगर व मिस्त्री सेवा',
    icon: '🛠️',
    hub: 'Verified Hub',
  },
  {
    id: 'property',
    name: 'Property & Real Estate',
    hindiName: 'प्रॉपर्टी व रियल एस्टेट',
    icon: '🏢',
    hub: 'Verified Hub',
  },
  {
    id: 'transporters',
    name: 'Transporters / Loading',
    hindiName: 'ट्रांसपोर्ट व माल ढुलाई',
    icon: '🚚',
    hub: 'Verified Hub',
  },
  {
    id: 'market',
    name: 'Newly Open',
    hindiName: 'नए खुले व्यापार व स्टोर (प्रचार)',
    icon: '🎊',
    hub: 'Business Spotlight',
  },

  {
    id: 'travel',
    name: 'Fun & Travel',
    hindiName: 'घूमना-फिरना, मनोरंजन व पर्यटन',
    icon: '🎡',
    hub: 'Tourism & Fun Hub',
  },

  {
    id: 'malls',
    name: 'Malls & Showrooms',
    hindiName: 'मॉल्स व रिटेल शोरूम',
    icon: '🛍️',
    hub: 'Verified Hub',
  },
  {
    id: 'restaurants',
    name: 'Restaurants & Food',
    hindiName: 'रेस्टोरेंट व खान-पान',
    icon: '🍽️',
    hub: 'Verified Hub',
  },
  {
    id: 'medical',
    name: 'Doctors & Healthcare',
    hindiName: 'चिकित्सा व डॉक्टर सेवा',
    icon: '🏥',
    hub: 'Verified Hub',
  },
  {
    id: 'fitness',
    name: 'Gym & Fitness',
    hindiName: 'जिम व फिटनेस सेंटर',
    icon: '🏋️',
    hub: 'Verified Hub',
  },
  {
    id: 'education',
    name: 'Coaching & Schools',
    hindiName: 'कोचिंग व शिक्षण संस्थान',
    icon: '📚',
    hub: 'Verified Hub',
  },
  {
    id: 'shaadi',
    name: 'Shaadi & Events',
    hindiName: 'शादी व इवेंट्स',
    icon: '💍',
    hub: 'Verified Hub',
  },
  {
    id: 'vehicles',
    name: 'Cars & Two-Wheelers',
    hindiName: 'गाड़ी व बाइक बाज़ार',
    icon: '🚗',
    hub: 'Verified Hub',
  },
  {
    id: 'creators',
    name: 'Artists & Creators',
    hindiName: 'स्थानीय कलाकार व रचनाकार',
    icon: '🎨',
    hub: 'Verified Hub',
  },
  {
    id: 'advertising',
    name: 'Flex, Hoardings & Ads',
    hindiName: 'प्रचार व विज्ञापन',
    icon: '📢',
    hub: 'Verified Hub',
  },
  {
    id: 'construction',
    name: 'Building & Construction',
    hindiName: 'भवन निर्माण सामग्री',
    icon: '🏗️',
    hub: 'Verified Hub',
  },
  {
    id: 'recommerce',
    name: 'Purana Bazaar / 2nd Hand',
    hindiName: 'पुराना सामान खरीद-बिक्री',
    icon: '♻️',
    hub: 'Verified Hub',
  },
  {
    id: 'festival',
    name: 'Festival Offers & Melas',
    hindiName: 'त्योहार व मेला ऑफर्स',
    icon: '🪔',
    hub: 'Verified Hub',
  },
  {
    id: 'community',
    name: 'Community Drives',
    hindiName: 'सामाजिक पहल व जनसेवा',
    icon: '🤝',
    hub: 'Verified Hub',
  },
  {
    id: 'white-collar',
    name: 'Jobs & Consultants',
    hindiName: 'रोजगार व पेशेवर सलाहकार',
    icon: '💼',
    hub: 'Verified Hub',
  },
  {
    id: 'electronics',
    name: 'Electronics & Mobile',
    hindiName: 'इलेक्ट्रॉनिक्स व मोबाइल',
    icon: '📱',
    hub: 'Verified Hub',
  },
  {
    id: 'fashion',
    name: 'Clothes & Boutique',
    hindiName: 'कपड़े व फैशन बुटीक',
    icon: '👗',
    hub: 'Verified Hub',
  },
  {
    id: 'furniture',
    name: 'Furniture & Decor',
    hindiName: 'फर्नीचर व सजावट',
    icon: '🪑',
    hub: 'Verified Hub',
  },
];

export default function HyperlocalHomeFeed({
  onSelectCategory,
  selectedCity = 'Alwar',
  currentLocality = 'Kali Mori',
  onOpenSearch,
}) {
  const [speakingCatId, setSpeakingCatId] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(`${currentLocality}, ${selectedCity}`);
  const [isLocating, setIsLocating] = useState(false);

  // 🔊 Audio Pronunciation for Accessibility
  const handleSpeakCategory = (e, cat) => {
    e.stopPropagation();
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    setSpeakingCatId(cat.id);

    const textToSpeak = `${cat.hindiName || cat.name}, आपके करीब ${selectedCity}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'hi-IN';
    utterance.rate = 0.95;

    utterance.onend = () => setSpeakingCatId(null);
    utterance.onerror = () => setSpeakingCatId(null);

    window.speechSynthesis.speak(utterance);
  };

  // 🔄 GPS Pin Detection
  const handleDetectGPS = (e) => {
    e.stopPropagation();
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        setCurrentLocation(`GPS Pin (${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)})`);
      },
      () => {
        setIsLocating(false);
        setCurrentLocation(`${currentLocality}, ${selectedCity}`);
      },
      { timeout: 8000 }
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-5 space-y-5 select-none font-sans text-slate-100">
      {/* 📍 Top Hyperlocal Location & Search Bar Card */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#0e1720] border border-[#1d2b38] shadow-2xl space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 shadow-xs shadow-emerald-400 animate-pulse" />
              <span className="text-[10.5px] font-black uppercase text-amber-400 tracking-wider">
                AAPKE KAREEB • आपके करीब
              </span>
            </div>
            <div className="flex items-center space-x-1.5 pt-0.5">
              <span className="text-rose-500 text-sm">📍</span>
              <h2 className="text-sm sm:text-base font-black text-white truncate max-w-[200px] sm:max-w-xs">
                {currentLocation}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDetectGPS}
            disabled={isLocating}
            className="px-3 py-1.5 rounded-xl bg-[#142634] hover:bg-[#1a3246] border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-md active:scale-95 transition"
          >
            <span>{isLocating ? '⏳' : '🔄'}</span>
            <span>GPS Pin</span>
          </button>
        </div>

        {/* Global Search Bar */}
        <div
          onClick={() => onOpenSearch && onOpenSearch()}
          className="w-full bg-[#080e14] border border-[#223340] hover:border-amber-400/60 rounded-2xl px-3.5 py-3 flex items-center space-x-3 cursor-pointer transition shadow-inner group"
        >
          <span className="text-slate-400 text-sm group-hover:text-amber-400 transition">🔍</span>
          <span className="text-xs sm:text-sm text-slate-400 font-semibold truncate flex-1">
            Search Plumber, 2 BHK Flat, Bolero, Doctor, Cafe...
          </span>
          <span className="text-xs text-slate-500 font-mono hidden sm:inline">⌘K</span>
        </div>
      </div>

      {/* 🏛️ 100% Organic Category Grid (Zero Promotions / Ads) */}
      <div className="space-y-3.5 animate-fade-in">
        <div className="flex items-center justify-between px-1 pt-1">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🏛️</span>
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-100">
              ALL {selectedCity.toUpperCase()} CATEGORIES (सभी श्रेणियां)
            </h3>
          </div>
          <span className="px-3 py-1 rounded-full bg-[#14232e] border border-amber-400/40 text-amber-300 text-xs font-bold shadow-xs">
            {MASTER_CATEGORIES.length} Categories
          </span>
        </div>

        <div className="space-y-2.5">
          {MASTER_CATEGORIES.map((cat) => {
            const isSpeaking = speakingCatId === cat.id;

            return (
              <div
                key={cat.id}
                onClick={() => onSelectCategory && onSelectCategory(cat.id)}
                className="p-3.5 sm:p-4 rounded-3xl bg-[#0e1720] border border-[#1b2b38] hover:border-amber-400/60 shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center justify-between group active:scale-[0.99]"
              >
                <div className="flex items-center space-x-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-[#14232e] border border-[#223340] group-hover:border-amber-400/40 flex items-center justify-center text-xl shrink-0 shadow-inner transition">
                    {cat.icon}
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <h4 className="text-sm font-black text-white group-hover:text-amber-200 transition truncate">
                      {cat.name}
                    </h4>
                    <p className="text-xs font-bold text-amber-400 truncate">
                      {cat.hindiName}
                    </p>
                    <div className="flex items-center space-x-1 text-[10px] text-slate-400 pt-0.5">
                      <span className="text-rose-500">📍</span>
                      <span>{selectedCity} • {cat.hub}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handleSpeakCategory(e, cat)}
                    title="उच्चारण सुनें"
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center text-xs transition cursor-pointer border ${
                      isSpeaking
                        ? 'bg-amber-400 text-slate-950 border-amber-300 animate-bounce shadow-md'
                        : 'bg-[#14232e] hover:bg-[#1a2d3c] text-slate-300 border-[#223340]'
                    }`}
                  >
                    {isSpeaking ? '🔊' : '🔈'}
                  </button>

                  <button
                    type="button"
                    className="w-9 h-9 rounded-2xl bg-[#14232e] group-hover:bg-amber-400 group-hover:text-slate-950 text-slate-400 border border-[#223340] group-hover:border-amber-300 flex items-center justify-center text-sm font-bold transition shadow-xs group-hover:translate-x-0.5"
                  >
                    ➔
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}