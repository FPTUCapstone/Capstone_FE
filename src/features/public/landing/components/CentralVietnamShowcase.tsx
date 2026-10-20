/* eslint-disable @next/next/no-img-element */
'use client';

import type { KeyboardEvent } from 'react';
import { CENTRAL_DESTINATIONS } from '@/data/landingData';
import { EditorialTextReveal, CardReveal } from '@/components/ui/ScrollReveal';

interface CentralVietnamShowcaseProps {
  activeCity?: 'danang' | 'hoian' | 'hue';
  onSelectCity?: (city: 'danang' | 'hoian' | 'hue') => void;
}

export function CentralVietnamShowcase({ activeCity, onSelectCity }: CentralVietnamShowcaseProps) {
  function handleSelectCity(cityId: string) {
    if (onSelectCity && (cityId === 'danang' || cityId === 'hoian' || cityId === 'hue')) {
      onSelectCity(cityId);
    }
    window.dispatchEvent(new CustomEvent('tripmate:select-city', { detail: cityId }));
    const section = document.getElementById('csp-simulator');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  }

  function handleCardKeyDown(e: KeyboardEvent<HTMLDivElement>, cityId: string) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelectCity(cityId);
    }
  }

  return (
    <section
      id="destinations"
      className="scroll-mt-20 py-10 sm:py-14 lg:py-16 bg-gradient-to-b from-[#F8F6F1] via-[#FAF9F5] to-white px-4 sm:px-8 border-b border-stone-200 relative overflow-hidden"
    >
      {/* 1. Ambient Dual Diffused Glow Orbs */}
      <div className="absolute top-1/4 -left-24 w-[460px] h-[460px] rounded-full bg-gradient-to-br from-[#007D6E]/15 via-teal-400/5 to-transparent blur-3xl pointer-events-none animate-orb-1" />
      <div className="absolute bottom-10 -right-24 w-[500px] h-[500px] rounded-full bg-gradient-to-tl from-[#D97706]/15 via-amber-400/5 to-transparent blur-3xl pointer-events-none animate-orb-2" />

      {/* 2. Central Vietnam Heritage Road & Topographic River Contours */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none opacity-85">
        <svg
          viewBox="0 0 1440 600"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-cover animate-river-drift"
          preserveAspectRatio="none"
        >
          {/* Topographic River Curves & Central Heritage Road (Đà Nẵng - Hội An - Huế) */}
          {/* Soft Luminous Underglow for the Main Road */}
          <path
            d="M-50,220 C220,180 420,310 720,240 C1020,170 1260,280 1500,210"
            stroke="url(#heritageRiverGrad1)"
            strokeWidth="7"
            strokeLinecap="round"
            opacity="0.25"
          />
          {/* Crisp, Defined Heritage Route Line */}
          <path
            d="M-50,220 C220,180 420,310 720,240 C1020,170 1260,280 1500,210"
            stroke="url(#heritageRiverGrad1)"
            strokeWidth="2.5"
            strokeDasharray="9 7"
            strokeLinecap="round"
            className="animate-dash-flow"
          />
          {/* Secondary Topographic River Contours */}
          <path
            d="M-80,270 C200,330 460,210 750,300 C1060,380 1280,250 1520,310"
            stroke="url(#heritageRiverGrad2)"
            strokeWidth="1.6"
            strokeDasharray="4 6"
            opacity="0.65"
          />
          <path
            d="M-40,320 C240,250 500,360 820,290 C1100,230 1320,350 1480,270"
            stroke="url(#heritageRiverGrad3)"
            strokeWidth="1.3"
            opacity="0.45"
          />

          <defs>
            <linearGradient id="heritageRiverGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#007D6E" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#D97706" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.85" />
            </linearGradient>
            <linearGradient id="heritageRiverGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#007D6E" stopOpacity="0.55" />
              <stop offset="50%" stopColor="#004D40" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#D97706" stopOpacity="0.55" />
            </linearGradient>
            <linearGradient id="heritageRiverGrad3" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0F172A" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#007D6E" stopOpacity="0.35" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* 3. Subtle GIS Coordinate Beacons behind the 3 Destination Cards */}
      <div className="absolute inset-0 pointer-events-none max-w-7xl mx-auto px-4 sm:px-8 hidden md:block">
        <div className="grid grid-cols-3 gap-6 lg:gap-8 h-full items-center">
          {/* Beacon 1: Đà Nẵng GIS Coordinate */}
          <div className="relative h-full flex flex-col justify-end pb-3 opacity-40">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#007D6E]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#007D6E] animate-ping" />
              <span>GIS 16.0544°N, 108.2022°E</span>
            </div>
          </div>
          {/* Beacon 2: Hội An GIS Coordinate */}
          <div className="relative h-full flex flex-col justify-end pb-3 opacity-40">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#D97706]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] animate-ping" style={{ animationDelay: '800ms' }} />
              <span>GIS 15.8801°N, 108.3380°E</span>
            </div>
          </div>
          {/* Beacon 3: Huế GIS Coordinate */}
          <div className="relative h-full flex flex-col justify-end pb-3 opacity-40">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#7C3AED]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] animate-ping" style={{ animationDelay: '1600ms' }} />
              <span>GIS 16.4637°N, 107.5909°E</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl relative z-10">
        {/* Section Header: Editorial Stagger Hierarchy */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 pb-8 border-b border-stone-200">
          <div>
            <EditorialTextReveal delay={40} duration={400}>
              <div className="flex items-center gap-2 text-xs font-medium text-[#6E543C] mb-2.5">
                <span className="material-symbols-outlined text-sm text-[#007d6e]" aria-hidden="true">
                  location_on
                </span>
                <span className="text-xs font-semibold text-[#6E543C]">
                  Không gian văn hóa &amp; Di sản Miền Trung
                </span>
                <span className="text-[#A39A8D] font-mono text-[11px] hidden sm:inline">
                  · 16.0544° N, 108.2022° E
                </span>
              </div>
            </EditorialTextReveal>

            <EditorialTextReveal delay={120} duration={480}>
              <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#121E28] tracking-tight text-balance">
                Ba Điểm Đến Biểu Tượng Miền Trung
              </h2>
            </EditorialTextReveal>

            <EditorialTextReveal delay={200} duration={480}>
              <p className="mt-2.5 text-[#556370] text-sm sm:text-base max-w-2xl leading-relaxed text-pretty">
                Hệ sinh thái điểm đến tại Đà Nẵng, Hội An và Cố Đô Huế được chuẩn hóa tọa độ GIS,
                giờ hoạt động thực tế và nhịp đi lại tối ưu theo thời điểm trong ngày.
              </p>
            </EditorialTextReveal>
          </div>

          <EditorialTextReveal delay={260} duration={450}>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-[#556370] bg-[#EFECE4] border border-[#E5E0D8] px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xs">
                <span className="material-symbols-outlined text-sm text-[#007d6e]" aria-hidden="true">
                  verified
                </span>
                <span>Hệ thống GIS chuẩn hóa</span>
              </span>
            </div>
          </EditorialTextReveal>
        </div>

        {/* Destination Cards Grid with Staggered CardReveal */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {CENTRAL_DESTINATIONS.map((dest, index) => {
            const isCurrentActive = activeCity === dest.id;
            const isHue = dest.id === 'hue';

            return (
              <CardReveal
                key={dest.id}
                delay={index * 140}
                duration={700}
                className="h-full"
              >
                <div
                  role="button"
                  tabIndex={0}
                  aria-label={`Chọn điểm đến ${dest.name}`}
                  onKeyDown={(e) => handleCardKeyDown(e, dest.id)}
                  onClick={() => handleSelectCity(dest.id)}
                  className="relative h-full group cursor-pointer focus-visible:outline-none"
                >
                  {/* Dynamic Soft Heritage Glow standing directly behind the card */}
                  <div
                    className={`absolute -inset-2 sm:-inset-3 rounded-3xl transition-all duration-700 pointer-events-none blur-2xl ${
                      dest.id === 'danang'
                        ? 'bg-gradient-to-br from-teal-500/25 via-sky-400/18 to-emerald-300/10 animate-orb-1'
                        : dest.id === 'hoian'
                        ? 'bg-gradient-to-br from-amber-500/28 via-orange-400/18 to-yellow-300/10 animate-orb-2'
                        : 'bg-gradient-to-br from-purple-500/25 via-violet-400/18 to-indigo-300/10 animate-orb-1'
                    } ${
                      isCurrentActive
                        ? 'opacity-85 scale-[1.03] blur-2xl'
                        : 'opacity-35 group-hover:opacity-75 group-hover:scale-[1.02]'
                    }`}
                  />

                  <div
                    className={`relative z-10 h-full rounded-2xl border bg-white overflow-hidden shadow-2xs hover:shadow-xl hover:-translate-y-2 transition-all duration-500 ease-out flex flex-col focus-visible:ring-2 focus-visible:ring-[#007d6e] ${
                      isCurrentActive
                        ? 'border-[#007d6e] ring-2 ring-[#007d6e]/20 shadow-md'
                        : 'border-stone-200/90 hover:border-teal-400/70'
                    }`}
                  >
                  {/* Active City Pulse Badge */}
                  {isCurrentActive && (
                    <div className="absolute top-3.5 left-1/2 -translate-x-1/2 z-10">
                      <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold bg-[#004D40]/90 backdrop-blur-md text-emerald-200 shadow-md border border-emerald-400/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Điểm đến đang chọn
                      </span>
                    </div>
                  )}

                  {/* Card Image & Header */}
                  <div className="relative aspect-16/10 overflow-hidden bg-slate-100">
                    <img
                      src={dest.image}
                      alt={dest.name}
                      loading="lazy"
                      decoding="async"
                      className={`w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out ${
                        isHue ? 'scale-[1.15] origin-bottom' : ''
                      }`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none" />

                    {/* Top Left Badge */}
                    <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-white/95 text-slate-900 backdrop-blur-md shadow-xs">
                        {dest.badge}
                      </span>
                    </div>

                    {/* Top Right Verified GIS Badge */}
                    <div className="absolute top-3.5 right-3.5 flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold bg-black/60 text-white/95 backdrop-blur-md">
                      <span className="material-symbols-outlined text-xs text-teal-300" aria-hidden="true">
                        pin_drop
                      </span>
                      <span>Tọa độ thực</span>
                    </div>

                    {/* City Name on Bottom of Image */}
                    <div className="absolute bottom-3.5 left-4 right-4">
                      <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{dest.name}</h3>
                      <p className="text-xs text-slate-200 font-medium mt-0.5">{dest.tagline}</p>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between gap-5">
                    <div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {dest.description}
                      </p>

                      {/* Top POIs List */}
                      <div className="mt-4 pt-3.5 border-t border-[#F0ECE3]">
                        <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                          Điểm đến tiêu biểu:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {dest.topPois.map((poi) => (
                            <span
                              key={poi}
                              className="px-2 py-0.5 rounded-md bg-stone-100 text-slate-700 text-[11px] font-medium hover:bg-teal-50 hover:text-[#007d6e] transition-colors"
                            >
                              {poi}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Card Footer Stats & Link */}
                    <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        <span className="relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50/80 border border-teal-200/60 text-[#006B5F] shadow-2xs group-hover:border-teal-300 transition-colors">
                          <span className="material-symbols-outlined text-sm text-[#007d6e]" aria-hidden="true">
                            pin_drop
                          </span>
                          <strong className="font-bold text-[#004D40]">{dest.poisCount}</strong>
                          <span>POIs</span>
                        </span>
                        <span className="relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50/80 border border-amber-200/60 text-amber-800 shadow-2xs group-hover:border-amber-300 transition-colors">
                          <span className="material-symbols-outlined text-sm text-amber-600" aria-hidden="true">
                            confirmation_number
                          </span>
                          <strong className="font-bold text-amber-900">{dest.toursCount}</strong>
                          <span>Tours</span>
                        </span>
                      </div>

                      <button
                        type="button"
                        aria-label={`Lập lịch cho ${dest.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectCity(dest.id);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#007d6e] group-hover:translate-x-1 transition-transform cursor-pointer"
                      >
                        <span>Lập lịch CSP</span>
                        <span className="material-symbols-outlined text-sm" aria-hidden="true">
                          arrow_forward
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </CardReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
