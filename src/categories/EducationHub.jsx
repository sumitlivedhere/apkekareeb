import React, { useState } from 'react';
import { getCategoryById } from '../data/taxonomyRegistry';
import CategoryListFreeBanner from '../components/common/CategoryListFreeBanner';
const LEARNING_CAREER_TRACKS = [
  {
    trackId: 'media-creator-training',
    title: '1. Media, Video Editing & Photography (वीडियो एडिटिंग व कैमरा ट्रेनिंग)',
    subtitle: 'Learn short-form Reels editing, After Effects, DaVinci color grading, DSLR cine lighting & 4K drone shoots',
    badge: 'CREATOR & MEDIA',
    subIds: ['video-editing-reels-course', 'photography-cinematography'],
  },
  {
    trackId: 'white-collar-apprenticeships',
    title: '2. Professional Apprenticeships & Chamber Trainees (सीनियर प्रोफेशनल्स के अधीन ट्रेनी)',
    subtitle: 'Hands-on training under practicing CAs, Senior Advocates, CoA Architects & Doctor Clinics for real market experience',
    badge: 'CHAMBER TRAINEE',
    subIds: ['ca-tax-accounts-trainee', 'advocate-legal-apprentice', 'architect-cad-draughtsman', 'clinical-assistant-nursing'],
  },
  {
    trackId: 'vocational-self-employment',
    title: '3. Vocational, Beauty & Self-Employment (सिलाई, ब्यूटी पार्लर, मेहंदी व बेकिंग)',
    subtitle: 'Hands-on masterclasses for opening your own parlour, boutique, home bakery, or freelance artist career',
    badge: 'SELF EMPLOYMENT',
    subIds: ['silai-cutting-boutique', 'beauty-parlour-makeup', 'mehandi-design-classes', 'cooking-baking-culinary'],
  },
  {
    trackId: 'technical-trades-mechanics',
    title: '4. Technical Trades, Solar & Mechanics (मैकेनिक, मोबाइल, सोलर व ड्राइविंग)',
    subtitle: 'Live garage training for EV/petrol bikes, chip-level phone repair, solar rooftop installation, AC repair & driving school',
    badge: 'HANDS-ON TRADES',
    subIds: ['auto-mechanic-ev-training', 'solar-inverter-electrician', 'mobile-laptop-repair', 'ac-fridge-appliances-course', 'painting-texture-polishing', 'driving-school-licence'],
  },
  {
    trackId: 'school-foundations',
    title: '5. School Grades & 1-on-1 Home Tutors (कक्षा 6 से 10 व होम ट्यूटर)',
    subtitle: 'CBSE / RBSE board target batches, mathematics & science concept clarity & verified home tutors',
    badge: 'CLASS 6 TO 10',
    subIds: ['school-tuition-6-10', 'home-tutors-personal'],
  },
  {
    trackId: 'senior-secondary-entrance',
    title: '6. 11th-12th Boards & Pre-College Entrances (11वीं-12वीं, नीट व जेईई)',
    subtitle: 'NEET Medical, IIT-JEE Science, Commerce CA Foundation & CLAT Law entrance preparation',
    badge: '11TH-12TH & ENTRANCE',
    subIds: ['neet-jee-science-11-12', 'commerce-ca-foundation', 'arts-humanities-clat'],
  },
  {
    trackId: 'govt-recruitment-exams',
    title: '7. Govt Recruitment & Job Selection (सरकारी नौकरी व भर्ती परीक्षा)',
    subtitle: 'SSC CGL, Banking, Railway, NDA/Army, RPSC RAS, REET Teacher, Rajasthan Police & Patwar',
    badge: 'GOVT RECRUITMENT',
    subIds: ['ssc-bank-railway-defense', 'state-gov-rpsc-reet'],
  },
  {
    trackId: 'it-english-career',
    title: '8. Digital Skills, Coding & Spoken English (कंप्यूटर, कोडिंग व इंग्लिश)',
    subtitle: 'RS-CIT, Tally Prime, Web Development, Python, stage public speaking & IELTS Band 8.0',
    badge: 'CAREER & TECH',
    subIds: ['it-coding-computer-skills', 'spoken-english-ielts'],
  },
];

export default function EducationHub({
  selectedCity = 'Alwar',
  onSelectSubCategory,
  onSelectEducationCategory,
  onPostClick,
  onBack,
}) {
  const categoryConfig = getCategoryById('education');
  const [activeTrack, setActiveTrack] = useState('all');

  const handleSelect = (subId, catName) => {
    if (typeof onSelectSubCategory === 'function') {
      onSelectSubCategory(subId);
    } else if (typeof onSelectEducationCategory === 'function') {
      onSelectEducationCategory(subId, catName);
    }
  };

  const visibleTracks = activeTrack === 'all'
    ? LEARNING_CAREER_TRACKS
    : LEARNING_CAREER_TRACKS.filter((t) => t.trackId === activeTrack);

  return (
    <div className="p-3.5 space-y-4 animate-fade-in text-slate-100 pb-16">
      
      {/* 🌟 1. HERO HEADER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 p-4 border border-indigo-500/40 shadow-2xl">
        <div className="absolute -top-12 -right-12 w-44 h-44 bg-indigo-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>

        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[10px] font-black uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
              <span>Learning & Apprenticeship Directory • {selectedCity}</span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white mt-1 flex items-center space-x-1.5">
              <span>🎓 Education, Skills & Traineeships</span>
            </h2>
            <p className="text-[11px] text-indigo-200/80 font-medium">
              Video Editing, CA/Law Trainees, Silai, Parlour, Mechanics, Solar, Tutors & Academic Coachings in {selectedCity}
            </p>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="text-xs bg-white/10 hover:bg-white/20 text-indigo-100 px-3 py-1.5 rounded-xl font-bold backdrop-blur-md active:scale-95 transition cursor-pointer border border-white/10 shrink-0"
          >
            ← Town Hub
          </button>
        </div>

        {/* Quick Highlights Strip */}
        <div className="grid grid-cols-4 gap-2 mt-3 pt-2.5 border-t border-white/10 text-center">
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-fuchsia-300">✂️ Editing/Media</div>
            <div className="text-[8px] text-slate-400 font-semibold">Practical Studio</div>
          </div>
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-amber-300">💼 Traineeship</div>
            <div className="text-[8px] text-slate-400 font-semibold">CA, Law, Doctor</div>
          </div>
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-pink-300">🪡 Silai/Parlour</div>
            <div className="text-[8px] text-slate-400 font-semibold">Self-Employed</div>
          </div>
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-emerald-300">0% Cut</div>
            <div className="text-[8px] text-slate-400 font-semibold">Direct Teacher Fees</div>
          </div>
        </div>
      </div>

      {/* 🌟 2. TRACK SELECTOR CHIPS */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">
            Explore Learning & Career Paths
          </span>
          <span className="text-[10px] text-slate-400 font-semibold">
            {categoryConfig.subCategories.length} Specialties
          </span>
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTrack('all')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-black shrink-0 transition cursor-pointer ${
              activeTrack === 'all'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md scale-105'
                : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
            }`}
          >
            ⚡ All 8 Tracks
          </button>

          {LEARNING_CAREER_TRACKS.map((track) => (
            <button
              key={track.trackId}
              type="button"
              onClick={() => setActiveTrack(track.trackId)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-black shrink-0 transition cursor-pointer ${
                activeTrack === track.trackId
                  ? 'bg-indigo-400 text-slate-950 shadow-md scale-105'
                  : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
              }`}
            >
              {track.badge}
            </button>
          ))}
        </div>
      </div>

      {/* 🌟 3. SECTIONS LIST */}
      <div className="space-y-4">
        {visibleTracks.map((track) => (
          <section
            key={track.trackId}
            className="bg-slate-900/90 rounded-3xl p-3.5 border border-slate-800 shadow-md space-y-2.5"
          >
            <div className="px-1 border-b border-slate-800 pb-2 flex items-start justify-between">
              <div>
                <h3 className="text-xs font-black text-white">{track.title}</h3>
                <p className="text-[10px] text-slate-400 font-medium">{track.subtitle}</p>
              </div>
              <span className="text-[8px] font-black px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 shrink-0 ml-2">
                {track.badge}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {track.subIds.map((subId) => {
                const sub = categoryConfig.subCategories.find((s) => s.id === subId);
                if (!sub) return null;

                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => handleSelect(sub.id, sub.name)}
                    className="p-3 bg-slate-950/80 hover:bg-slate-850 rounded-2xl text-left transition cursor-pointer flex items-center justify-between border border-slate-800 hover:border-indigo-500/50 shadow-sm group active:scale-[0.98]"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl p-2 bg-slate-900 rounded-xl border border-slate-800 group-hover:border-indigo-500/40 shadow-inner shrink-0">
                        {sub.icon || '🎓'}
                      </span>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-black text-slate-100 group-hover:text-indigo-300 transition-colors leading-tight">
                            {sub.name.split('(')[0]}
                          </span>
                        </div>
                        <div className="text-[9px] text-slate-400 font-medium mt-0.5 truncate">
                          {sub.name.match(/\((.*?)\)/)?.[1] || 'ट्रेनिंग व बैच'}
                        </div>
                      </div>
                    </div>

                    <span className="text-xs font-black text-indigo-400 group-hover:translate-x-1 transition-transform shrink-0 ml-2">
                      ➔
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* 🌟 4. VIEW ALL BUTTON */}
      <button
        type="button"
        onClick={() => handleSelect('all', 'All Education & Vocational Skills')}
        className="w-full py-3.5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 hover:from-slate-850 hover:to-slate-800 text-indigo-300 border border-indigo-500/30 rounded-2xl text-center text-xs font-black active:scale-95 transition cursor-pointer shadow-md"
      >
        🌟 View All Education & Vocational Directory ({categoryConfig.subCategories.length} Categories)
      </button>

      {/* 🌟 5. INTERACTIVE LIST FREE WIDGET */}
      <CategoryListFreeBanner
        category="property"
        selectedCity={selectedCity}
        onPostClick={onPostClick}
      />
    </div>
  );
}