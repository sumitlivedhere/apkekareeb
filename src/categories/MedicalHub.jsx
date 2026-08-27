import React, { useState } from 'react';
import { getCategoryById } from '../data/taxonomyRegistry';
import CategoryListFreeBanner from '../components/common/CategoryListFreeBanner';

const DOCTOR_SPECIALTIES_GROUP = [
  { subId: 'doc-ortho-bones', label: '🦴 Bone & Fracture (हड्डी/जोड़)', docType: 'Orthopaedic' },
  { subId: 'doc-physician-diabetes', label: '🩺 Fever & Diabetes (शुगर/बुखार)', docType: 'MD Physician' },
  { subId: 'doc-gynae-maternity', label: '🤰 Maternity & Gynae (महिला रोग)', docType: 'Gynaecologist' },
  { subId: 'doc-pediatric-child', label: '👶 Child & Newborn (बाल रोग)', docType: 'Pediatrician' },
  { subId: 'doc-cardio-heart', label: '❤️ Heart & BP (हृदय रोग)', docType: 'Cardiologist' },
  { subId: 'doc-ent-specialist', label: '👂 Ear, Nose, Throat (कान-नाक-गला)', docType: 'ENT Specialist' },
  { subId: 'doc-skin-dermatology', label: '✨ Skin & Hair (चर्म रोग)', docType: 'Dermatologist' },
  { subId: 'doc-gastro-liver', label: '🧪 Stomach & Liver (पेट/गैस)', docType: 'Gastroenterologist' },
  { subId: 'doc-neuro-brain', label: '🧠 Brain & Nerves (दिमाग/नस)', docType: 'Neurologist' },
  { subId: 'doc-kidney-urology', label: '💧 Kidney & Stones (पथरी/किडनी)', docType: 'Urologist' },
  { subId: 'doc-dental-surgeons', label: '🦷 Dental & RCT (दांत का डॉक्टर)', docType: 'Dentist' },
  { subId: 'doc-eye-ophthalmology', label: '👁️ Eye & Cataract (आंख का डॉक्टर)', docType: 'Ophthalmologist' },
  { subId: 'doc-ayurveda-homeo', label: '🌿 Ayurveda & Nadi (आयुर्वेद)', docType: 'Vaidya' },
];

const EMERGENCY_HELPLINES = [
  { subId: 'emergency-ambulance-icu', label: '🚑 24x7 ICU Ambulance On-Call', desc: '15-min arrival with oxygen' },
  { subId: 'chemists-24x7-pharmacy', label: '💊 24-Hour Midnight Pharmacy', desc: 'Prescription home delivery' },
  { subId: 'diagnostic-pathology-xray', label: '🔬 Home Blood Sample Collection', desc: 'Report on WhatsApp' },
  { subId: 'home-nursing-oxygen-equip', label: '🫁 Emergency Oxygen Cylinder', desc: 'Hospital bed & BiPAP rental' },
];

export default function MedicalHub({
  selectedCity = 'Alwar',
  onSelectSubCategory,
  onSelectMedicalCategory,
  onBack,
  onPostClick,
}) {
  const categoryConfig = getCategoryById('medical');
  const [activeTab, setActiveTab] = useState('doctors'); // 'doctors' | 'hospitals' | 'all'

  const handleSelect = (subId, catName) => {
    if (typeof onSelectSubCategory === 'function') {
      onSelectSubCategory(subId);
    } else if (typeof onSelectMedicalCategory === 'function') {
      onSelectMedicalCategory(subId, catName);
    }
  };

  const doctorSubIds = DOCTOR_SPECIALTIES_GROUP.map((d) => d.subId);
  const facilitySubIds = ['emergency-ambulance-icu', 'multi-specialty-hospitals', 'chemists-24x7-pharmacy', 'diagnostic-pathology-xray', 'home-nursing-oxygen-equip'];

  const displayedSubs = activeTab === 'doctors'
    ? categoryConfig.subCategories.filter((s) => doctorSubIds.includes(s.id))
    : activeTab === 'hospitals'
    ? categoryConfig.subCategories.filter((s) => facilitySubIds.includes(s.id))
    : categoryConfig.subCategories;

  return (
    <div className="p-3.5 space-y-4 animate-fade-in text-slate-100 pb-16">
      
      {/* 🌟 1. HERO HEADER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-950 via-slate-900 to-cyan-950 p-4 border border-red-500/40 shadow-2xl">
        <div className="absolute -top-12 -right-12 w-44 h-44 bg-red-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>

        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-red-500/20 border border-red-400/30 text-red-300 text-[10px] font-black uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping"></span>
              <span>Doctor OPD & Clinic Directory • {selectedCity}</span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white mt-1 flex items-center space-x-1.5">
              <span>🏥 Doctors & Medical Clinics</span>
            </h2>
            <p className="text-[11px] text-red-200/80 font-medium">
              Private Clinics, Specialist MD/MS Doctors, Hospitals & 24x7 Pharmacies in {selectedCity}
            </p>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="text-xs bg-white/10 hover:bg-white/20 text-red-100 px-3 py-1.5 rounded-xl font-bold backdrop-blur-md active:scale-95 transition cursor-pointer border border-white/10 shrink-0"
          >
            ← Town Hub
          </button>
        </div>

        {/* Quick Value Metrics */}
        <div className="grid grid-cols-4 gap-2 mt-3 pt-2.5 border-t border-white/10 text-center">
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-red-300">🩺 13+</div>
            <div className="text-[8px] text-slate-400 font-semibold">Specialties</div>
          </div>
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-cyan-300">₹200–₹400</div>
            <div className="text-[8px] text-slate-400 font-semibold">OPD Fee Range</div>
          </div>
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-emerald-300">RGHS / AB</div>
            <div className="text-[8px] text-slate-400 font-semibold">Cashless Support</div>
          </div>
          <div className="bg-white/5 rounded-xl py-1 backdrop-blur-xs">
            <div className="text-xs font-black text-amber-300">0% Cut</div>
            <div className="text-[8px] text-slate-400 font-semibold">Direct Doctor OPD</div>
          </div>
        </div>
      </div>

      {/* 🌟 2. FAST EMERGENCY SOS STRIP */}
      <section className="bg-gradient-to-r from-red-950/70 via-slate-900 to-rose-950/70 p-3.5 rounded-3xl border border-red-500/50 shadow-lg space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-1.5">
            <span className="text-sm">🚨</span>
            <h3 className="text-xs font-black text-red-300 uppercase tracking-wide">
              Emergency Services & Fast Response
            </h3>
          </div>
          <span className="text-[9px] font-bold text-amber-300 animate-pulse">24x7 Available</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {EMERGENCY_HELPLINES.map((sos, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelect(sos.subId, sos.label)}
              className="p-2.5 bg-slate-950/90 hover:bg-slate-900 rounded-2xl text-left transition cursor-pointer border border-red-500/30 hover:border-red-400 flex items-center justify-between active:scale-95 shadow-sm"
            >
              <div className="space-y-0.5">
                <div className="text-[11px] font-black text-slate-100 leading-tight">
                  {sos.label}
                </div>
                <div className="text-[9px] text-slate-400 font-medium">{sos.desc}</div>
              </div>
              <span className="text-xs text-red-400 font-black ml-1">➔</span>
            </button>
          ))}
        </div>
      </section>

      {/* 🌟 3. SPECIALTY & SYMPTOM SHORTCUTS GRID */}
      <section className="bg-slate-900/90 rounded-3xl p-3.5 border border-slate-800 shadow-md space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-xs font-black text-white">Find Doctors by Symptom / Organ (लक्षण व रोग अनुसार डॉक्टर)</h3>
            <p className="text-[10px] text-slate-400">Select organ or health condition for direct specialist clinic OPD</p>
          </div>
          <span className="text-[9px] font-bold text-cyan-300">1-Tap Filter</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
          {DOCTOR_SPECIALTIES_GROUP.map((spec) => (
            <button
              key={spec.subId}
              type="button"
              onClick={() => handleSelect(spec.subId, spec.label)}
              className="p-2.5 bg-slate-950/80 hover:bg-slate-850 rounded-2xl text-left transition cursor-pointer border border-slate-800 hover:border-red-500/50 shadow-sm flex items-center justify-between active:scale-95"
            >
              <div className="space-y-0.5">
                <div className="text-[11px] font-black text-slate-100 leading-tight">
                  {spec.label}
                </div>
                <div className="text-[9px] text-red-400 font-bold">{spec.docType}</div>
              </div>
              <span className="text-xs text-red-400 font-black ml-1">➔</span>
            </button>
          ))}
        </div>
      </section>

      {/* 🌟 4. TAB CONTROLLER: DOCTOR CLINICS VS HOSPITALS & LABS */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2 bg-slate-900 p-1 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('doctors')}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
              activeTab === 'doctors'
                ? 'bg-red-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🩺 Specialist Doctors ({doctorSubIds.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('hospitals')}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
              activeTab === 'hospitals'
                ? 'bg-red-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🏥 Hospitals & Pharmacy ({facilitySubIds.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
              activeTab === 'all'
                ? 'bg-red-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All
          </button>
        </div>

        {/* Subcategories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {displayedSubs.map((sub) => (
            <button
              key={sub.id}
              type="button"
              onClick={() => handleSelect(sub.id, sub.name)}
              className="p-3.5 bg-slate-900/90 hover:bg-slate-850 text-white rounded-2xl text-left font-bold shadow-sm hover:scale-[1.01] active:scale-95 transition cursor-pointer flex items-center justify-between border border-slate-800 hover:border-red-500/50"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl p-2 bg-slate-950 rounded-xl border border-slate-800 shadow-inner">
                  {sub.icon || '🩺'}
                </span>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-black text-slate-100">{sub.name.split('(')[0]}</span>
                    {sub.tag && (
                      <span className="text-[8px] font-black px-1.5 py-0.2 rounded-md bg-red-500/20 text-red-300 border border-red-400/30">
                        {sub.tag}
                      </span>
                    )}
                  </div>
                  <div className="text-[9px] text-slate-400 font-semibold mt-0.5 truncate">
                    {sub.name.match(/\((.*?)\)/)?.[1] || 'क्लिनिक'}
                  </div>
                </div>
              </div>

              <span className="text-xs font-black text-red-400 shrink-0 ml-2">➔</span>
            </button>
          ))}
        </div>
      </div>

      {/* 🌟 5. INTERACTIVE LIST FREE WIDGET */}
      <CategoryListFreeBanner
        category="property"
        selectedCity={selectedCity}
        onPostClick={onPostClick}
      />
    </div>
  );
}