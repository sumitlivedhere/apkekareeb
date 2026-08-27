import React from 'react';
import { getCategoryById } from '../data/taxonomyRegistry';
import CategoryListFreeBanner from '../components/common/CategoryListFreeBanner';

const PROFESSIONAL_COUNCILS = [
  {
    councilId: 'healthcare',
    title: '1. Healthcare, Doctors & Clinical Specialists (चिकित्सा व स्वास्थ्य विशेषज्ञ)',
    subtitle: 'MD Physicians, Pediatricians, Dentists, Physiotherapists & Clinical Laboratories',
    badge: 'MCI / DENTAL COUNCIL',
    color: 'border-blue-500/40 text-blue-300',
    subIds: ['doctors-physicians-clinics', 'dentists-dental-surgeons', 'physiotherapy-rehab'],
  },
  {
    councilId: 'finance-tax',
    title: '2. Chartered Accountants, Tax & Business Subsidies (CA, टैक्स व सब्सिडी)',
    subtitle: 'GST filing, ITR audits, Company registrations, PMEGP MSME project loans & investments',
    badge: 'ICAI / AMFI CERTIFIED',
    color: 'border-emerald-500/40 text-emerald-300',
    subIds: ['ca-cs-tax-auditors', 'financial-wealth-insurance', 'msme-subsidy-loan-consultants'],
  },
  {
    councilId: 'legal-advisory',
    title: '3. Legal Advisory, Advocates & Documentation (वकील, कोर्ट व नोटरी)',
    subtitle: 'District/High court advocates, civil & revenue litigation, agreements, notary & title search',
    badge: 'BAR COUNCIL OF INDIA',
    color: 'border-amber-500/40 text-amber-300',
    subIds: ['advocates-legal-advisors', 'notary-affidavit-drafting'],
  },
  {
    councilId: 'engineering-tech',
    title: '4. Architects, Engineers & Digital Agencies (आर्किटेक्ट, स्ट्रक्चर व आईटी)',
    subtitle: 'CoA approved architects, government approved valuers, visa consultants & software developers',
    badge: 'COA / TECH REGISTERED',
    color: 'border-cyan-500/40 text-cyan-300',
    subIds: ['architects-interior-designers', 'civil-structural-valuers', 'career-visa-consultants', 'software-digital-agencies'],
  },
];

export default function WhiteCollarHub({
  selectedCity = 'Alwar',
  onSelectSubCategory,
  onSelectWhiteCollarCategory,
  onPostClick,
  
  onBack,
}) {
  const categoryConfig = getCategoryById('white-collar');

  const handleSelect = (subId, catName) => {
    if (typeof onSelectSubCategory === 'function') {
      onSelectSubCategory(subId);
    } else if (typeof onSelectWhiteCollarCategory === 'function') {
      onSelectWhiteCollarCategory(subId, catName);
    }
  };

  return (
    <div className="p-3.5 space-y-4 animate-fade-in text-slate-100 pb-16">
      
      {/* 🌟 1. EXECUTIVE CORPORATE HERO BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 p-4 border border-indigo-500/40 shadow-2xl">
        <div className="absolute -top-12 -right-12 w-44 h-44 bg-indigo-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>

        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[10px] font-black uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></span>
              <span>Verified Professionals • {selectedCity}</span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white mt-1 flex items-center space-x-1.5">
              <span>👔 Professionals & Consultants</span>
            </h2>
            <p className="text-[11px] text-indigo-200/80 font-medium">
              Verified Doctors, CAs, Advocates, Architects, Valuers & Digital Consultants in {selectedCity}
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

        {/* Professional Standards Strip */}
        <div className="grid grid-cols-4 gap-2 mt-3 pt-2.5 border-t border-white/10 text-center">
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-indigo-300">🎓 Degrees</div>
            <div className="text-[8px] text-slate-400 font-semibold">Verified Credentials</div>
          </div>
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-emerald-300">⚖️ Chamber</div>
            <div className="text-[8px] text-slate-400 font-semibold">Clinic & Office</div>
          </div>
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-amber-300">0% Cut</div>
            <div className="text-[8px] text-slate-400 font-semibold">Direct Consultation</div>
          </div>
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-cyan-300">⚡ Timings</div>
            <div className="text-[8px] text-slate-400 font-semibold">Live Availability</div>
          </div>
        </div>
      </div>

      {/* 🌟 2. STRUCTURED PROFESSIONAL COUNCILS */}
      <div className="space-y-4">
        {PROFESSIONAL_COUNCILS.map((council) => (
          <section
            key={council.councilId}
            className="bg-slate-900/90 rounded-3xl p-3.5 border border-slate-800 shadow-md space-y-2.5"
          >
            <div className="px-1 border-b border-slate-800 pb-2 flex items-start justify-between">
              <div>
                <h3 className="text-xs font-black text-white">{council.title}</h3>
                <p className="text-[10px] text-slate-400 font-medium">{council.subtitle}</p>
              </div>
              <span className="text-[8px] font-black px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 shrink-0 ml-2">
                {council.badge}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {council.subIds.map((subId) => {
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
                        {sub.icon || '👔'}
                      </span>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-black text-slate-100 group-hover:text-indigo-300 transition-colors leading-tight">
                            {sub.name.split('(')[0]}
                          </span>
                        </div>
                        <div className="text-[9px] text-slate-400 font-medium mt-0.5 truncate">
                          {sub.name.match(/\((.*?)\)/)?.[1] || 'परामर्श व सेवा'}
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

      {/* 🌟 3. VIEW ALL BUTTON */}
      <button
        type="button"
        onClick={() => handleSelect('all', 'All Professionals')}
        className="w-full py-3.5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 hover:from-slate-850 hover:to-slate-800 text-indigo-300 border border-indigo-500/30 rounded-2xl text-center text-xs font-black active:scale-95 transition cursor-pointer shadow-md"
      >
        🌟 View All Professionals Directory ({categoryConfig.subCategories.length} Specialties)
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