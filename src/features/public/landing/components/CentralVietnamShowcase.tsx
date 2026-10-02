/* eslint-disable @next/next/no-img-element */
'use client';

import { CENTRAL_DESTINATIONS } from '@/data/landingData';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { LandingEyebrow } from './LandingEyebrow';

interface CentralVietnamShowcaseProps {
  onSelectCity?: (city: 'danang' | 'hoian' | 'hue') => void;
}

export function CentralVietnamShowcase({ onSelectCity }: CentralVietnamShowcaseProps) {
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

  return (
    <section id="destinations" className="scroll-mt-20 py-16 sm:py-24 bg-white px-4 sm:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <ScrollReveal animation="fade-up">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-slate-100">
            <div>
              <LandingEyebrow icon="location_on" className="mb-3">
                Điểm đến hàng đầu Miền Trung
              </LandingEyebrow>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#00152a] tracking-tight">
                Khám phá Ba Điểm Đến Biểu Tượng <span className="text-[#007d6e]">Miền Trung</span>
              </h2>
              <p className="mt-3 text-slate-500 text-sm sm:text-base max-w-2xl leading-relaxed text-pretty">
                Hệ sinh thái điểm đến phong phú tại Đà Nẵng, Hội An và Cố Đô Huế với các địa danh được chuẩn hóa tọa độ GIS,
                giờ hoạt động thực tế và khung giờ hoàng hôn lý tưởng.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full">
                Hệ thống GIS chuẩn hóa
              </span>
            </div>
          </div>
        </ScrollReveal>

        {/* Destination Cards Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {CENTRAL_DESTINATIONS.map((dest, index) => (
            <ScrollReveal
              key={dest.id}
              animation="fade-up"
              delay={index * 150}
              duration={750}
            >
              <div
                className="group relative h-full rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs hover:shadow-xl hover:border-teal-300 card-hover-lift transition-all duration-300 flex flex-col cursor-pointer"
                onClick={() => handleSelectCity(dest.id)}
              >
                {/* Card Image & Header */}
                <div className="relative aspect-16/10 overflow-hidden bg-slate-100">
                  <img
                    src={dest.image}
                    alt={dest.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Badge on Top Left */}
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/90 text-slate-900 backdrop-blur-md shadow-xs">
                      {dest.badge}
                    </span>
                  </div>

                  {/* Weather pill on Top Right */}
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-black/50 text-white backdrop-blur-md">
                    <span className="material-symbols-outlined text-sm text-amber-300">wb_sunny</span>
                    <span>{dest.temp}</span>
                  </div>

                  {/* City Name on Bottom of Image */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-2xl font-black text-white">{dest.name}</h3>
                    <p className="text-xs text-slate-200 font-medium mt-0.5">{dest.tagline}</p>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6 flex-1 flex flex-col justify-between gap-6">
                  <div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {dest.description}
                    </p>

                    {/* Top POIs List */}
                    <div className="mt-5">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2">
                        Điểm đến tiêu biểu:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {dest.topPois.map((poi) => (
                          <span
                            key={poi}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-medium hover:bg-teal-50 hover:text-[#007d6e] transition-colors"
                          >
                            {poi}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Stats & Link */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-[#007d6e]">pin_drop</span>
                        {dest.poisCount} POIs
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-[#007d6e]">confirmation_number</span>
                        {dest.toursCount} Tours
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectCity(dest.id);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#007d6e] group-hover:translate-x-1 transition-transform cursor-pointer"
                    >
                      <span>Lập lịch CSP</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
