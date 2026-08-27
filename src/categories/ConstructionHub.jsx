import React, { useState } from 'react';
import { getCategoryById } from '../data/taxonomyRegistry';
import CategoryListFreeBanner from '../components/common/CategoryListFreeBanner';

const CONSTRUCTION_STEPS = [
  {
    stepId: 'phase-1',
    stepNumber: 'Phase 1',
    stepTitle: 'Planning, Naksha & Vastu (नक्शा, प्लानिंग व वास्तु)',
    stepSubtitle: 'Before digging: Map approval, 3D elevation, structural design & Vastu alignment',
    colorTheme: 'from-amber-500/20 to-orange-500/10 border-amber-500/40 text-amber-300',
    subIds: ['architect-naksha', 'vastu-consultant', 'soil-testing-engineer'],
  },
  {
    stepId: 'phase-2',
    stepNumber: 'Phase 2',
    stepTitle: 'Foundation, Structure & Raw Material (नींव, ठेकेदार व सामग्री)',
    stepSubtitle: 'Excavation, civil contractors, cement/saria supplies, water tankers & shuttering',
    colorTheme: 'from-orange-500/20 to-amber-500/10 border-orange-500/40 text-orange-300',
    subIds: ['building-contractors', 'raw-materials', 'water-tanker', 'jcb-excavator', 'iron-shuttering-welding'],
  },
  {
    stepId: 'phase-3',
    stepNumber: 'Phase 3',
    stepTitle: 'Plumbing, Piping & Electrical Wiring (प्लंबिंग व बिजली फिटिंग)',
    stepSubtitle: 'Concealed CPVC water lines, roof conduit electrical pipes, switches & drainage',
    colorTheme: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/40 text-cyan-300',
    subIds: ['plumbing-sanitary', 'electrical-wiring'],
  },
  {
    stepId: 'phase-4',
    stepNumber: 'Phase 4',
    stepTitle: 'Flooring, Chokhat & Safety Fabrication (फर्श, चौखट व मेन गेट)',
    stepSubtitle: 'Marble/tile floor fitting, hardwood door frames, main gates & stair railings',
    colorTheme: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/40 text-emerald-300',
    subIds: ['tile-marble-granite', 'woodwork-doors-windows', 'iron-gates-railings'],
  },
  {
    stepId: 'phase-5',
    stepNumber: 'Phase 5',
    stepTitle: 'Paint, Finishing, Interior & Setup (पुताई, इंटीरियर व गृह प्रवेश)',
    stepSubtitle: 'Wall putty, waterproofing, modular kitchen, false ceiling, furniture & cleaning',
    colorTheme: 'from-purple-500/20 to-pink-500/10 border-purple-500/40 text-purple-300',
    subIds: ['paint-putty-waterproofing', 'interior-modular-glass', 'furniture-appliances-setup', 'cleaning-pest-control'],
  },
];

export default function ConstructionHub({
  selectedCity = 'Alwar',
  onSelectSubCategory,
  onSelectConstructionCategory,
  onPostClick,
  onBack,
}) {
  const categoryConfig = getCategoryById('construction');
  const [selectedPhase, setSelectedPhase] = useState('all');

  const handleSelect = (subId, catName) => {
    if (typeof onSelectSubCategory === 'function') {
      onSelectSubCategory(subId);
    } else if (typeof onSelectConstructionCategory === 'function') {
      onSelectConstructionCategory(subId, catName);
    }
  };

  const visibleSteps = selectedPhase === 'all'
    ? CONSTRUCTION_STEPS
    : CONSTRUCTION_STEPS.filter((s) => s.stepId === selectedPhase);

  return (
    <div className="p-4 space-y-5 animate-fade-in text-slate-100 pb-16">
      
      {/* 🌟 1. HERO HEADER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-950 via-slate-900 to-slate-950 p-5 border border-amber-500/40 shadow-2xl">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>

        <div className="relative z-10 flex items-start justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[10px] font-black uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
              <span>House Construction Roadmap • {selectedCity}</span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white flex items-center space-x-2">
              <span>🏗️ Construction</span>
              <span className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
                & Building Directory
              </span>
            </h2>
            <p className="text-xs text-amber-100/80 font-medium">
              Step-by-step local directory: from blueprint नक्शा to turnkey गृह प्रवेश
            </p>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="text-xs bg-white/10 hover:bg-white/20 text-amber-100 px-3.5 py-2 rounded-xl font-bold backdrop-blur-md active:scale-95 transition cursor-pointer border border-white/10 shrink-0"
          >
            ← Town Hub
          </button>
        </div>

        {/* Quick Value Metrics */}
        <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-white/10 text-center">
          <div className="bg-white/5 rounded-xl py-1.5 backdrop-blur-xs">
            <div className="text-xs font-black text-amber-300">📐 Naksha</div>
            <div className="text-[9px] text-slate-400 font-semibold">UIT Pass</div>
          </div>
          <div className="bg-white/5 rounded-xl py-1.5 backdrop-blur-xs">
            <div className="text-xs font-black text-orange-300">🧱 Material</div>
            <div className="text-[9px] text-slate-400 font-semibold">Dumper Supply</div>
          </div>
          <div className="bg-white/5 rounded-xl py-1.5 backdrop-blur-xs">
            <div className="text-xs font-black text-cyan-300">👷 Mistris</div>
            <div className="text-[9px] text-slate-400 font-semibold">Direct Labor</div>
          </div>
          <div className="bg-white/5 rounded-xl py-1.5 backdrop-blur-xs">
            <div className="text-xs font-black text-emerald-300">0% Cut</div>
            <div className="text-[9px] text-slate-400 font-semibold">Direct Rate</div>
          </div>
        </div>
      </div>

      {/* 🌟 2. HORIZONTAL PHASE SELECTOR PILLS */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider">
            Jump to Construction Stage
          </span>
          <span className="text-[10px] text-slate-400 font-semibold">
            {categoryConfig.subCategories.length} Total Specialties
          </span>
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedPhase('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black shrink-0 transition cursor-pointer ${
              selectedPhase === 'all'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md scale-105'
                : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
            }`}
          >
            ⚡ All 5 Phases (सभी चरण)
          </button>

          {CONSTRUCTION_STEPS.map((step) => (
            <button
              key={step.stepId}
              type="button"
              onClick={() => setSelectedPhase(step.stepId)}
              className={`px-3.5 py-2 rounded-xl text-xs font-black shrink-0 transition cursor-pointer ${
                selectedPhase === step.stepId
                  ? 'bg-amber-400 text-slate-950 shadow-md scale-105'
                  : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
              }`}
            >
              {step.stepNumber}
            </button>
          ))}
        </div>
      </div>

      {/* 🌟 3. ROOMY, SEQUENTIAL STEP-BY-STEP SECTIONS */}
      <div className="space-y-6">
        {visibleSteps.map((step) => (
          <section
            key={step.stepId}
            className="bg-slate-900/90 rounded-3xl p-4 border border-slate-800 shadow-lg space-y-3 relative overflow-hidden"
          >
            {/* Step Section Header */}
            <div className="border-b border-slate-800/80 pb-3 flex items-start justify-between">
              <div className="space-y-0.5">
                <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-400/30 text-amber-300 text-[10px] font-black uppercase">
                  {step.stepNumber}
                </div>
                <h3 className="text-sm font-black text-white pt-1">{step.stepTitle}</h3>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                  {step.stepSubtitle}
                </p>
              </div>
            </div>

            {/* Roomy Clickable Cards for This Phase */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {step.subIds.map((subId) => {
                const sub = categoryConfig.subCategories.find((s) => s.id === subId);
                if (!sub) return null;

                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => handleSelect(sub.id, sub.name)}
                    className="p-4 bg-slate-950/80 hover:bg-slate-850 rounded-2xl text-left transition cursor-pointer flex items-center justify-between border border-slate-800 hover:border-amber-500/50 shadow-sm group active:scale-[0.98]"
                  >
                    <div className="flex items-center space-x-3.5">
                      <span className="text-2xl p-2.5 bg-slate-900 rounded-2xl border border-slate-800 group-hover:border-amber-500/40 shadow-inner shrink-0">
                        {sub.icon || '🏗️'}
                      </span>
                      <div className="space-y-0.5">
                        <div className="text-xs font-black text-slate-100 group-hover:text-amber-300 transition-colors leading-tight">
                          {sub.name.split('(')[0]}
                        </div>
                        <div className="text-[10px] text-slate-400 font-semibold">
                          {sub.name.match(/\((.*?)\)/)?.[1] || 'सेवाएं व सामग्री'}
                        </div>
                      </div>
                    </div>

                    <span className="text-xs font-black text-amber-400 group-hover:translate-x-1 transition-transform shrink-0 ml-2">
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
        onClick={() => handleSelect('all', 'All Construction Services')}
        className="w-full py-3.5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 hover:from-slate-850 hover:to-slate-800 text-amber-300 border border-amber-500/30 rounded-2xl text-center text-xs font-black active:scale-95 transition cursor-pointer shadow-md"
      >
        🌟 View All Construction Directory ({categoryConfig.subCategories.length} Specialties)
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