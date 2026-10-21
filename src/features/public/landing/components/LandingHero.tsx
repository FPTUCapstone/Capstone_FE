/* eslint-disable @next/next/no-img-element */
'use client';

import Link from 'next/link';
import { ROUTES } from '@/lib/routes';
import { CENTRAL_DESTINATIONS } from '@/data/landingData';

interface LandingHeroProps {
  activeCity: 'danang' | 'hoian' | 'hue';
  onSelectCity: (city: 'danang' | 'hoian' | 'hue') => void;
}

const DESTINATION_HERO_IMAGES: Record<
  'danang' | 'hoian' | 'hue',
  { src: string; alt: string; caption: string }
> = {
  danang: {
    src: CENTRAL_DESTINATIONS[0].image,
    alt: 'Bãi biển Mỹ Khê và bán đảo Sơn Trà tại Đà Nẵng',
    caption: 'Đà Nẵng — Biển Mỹ Khê & Bán đảo Sơn Trà',
  },
  hoian: {
    src: CENTRAL_DESTINATIONS[1].image,
    alt: 'Phố cổ Hội An lung linh sắc đèn lồng bên sông Hoài',
    caption: 'Hội An — Di sản UNESCO bên sông Hoài',
  },
  hue: {
    src: CENTRAL_DESTINATIONS[2].image,
    alt: 'Quần thể Cố đô Huế và sông Hương thơ mộng',
    caption: 'Cố Đô Huế — Di tích triều Nguyễn & Sông Hương',
  },
};

export function LandingHero({ activeCity, onSelectCity }: LandingHeroProps) {
  const currentHero = DESTINATION_HERO_IMAGES[activeCity] || DESTINATION_HERO_IMAGES.danang;

  return (
    <section className="relative overflow-hidden min-h-[480px] lg:h-[540px] flex items-center bg-[#00152a] text-white">
      {/* Scenic Travel Photography Background with Graceful Multi-Layer Overlay */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          key={activeCity}
          src={currentHero.src}
          alt={currentHero.alt}
          className="h-full w-full object-cover object-center animate-in fade-in duration-700"
          loading="eager"
        />
        {/* Soft Multi-Directional Gradient Overlays for Guaranteed Text Legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#00152a]/95 via-[#00152a]/80 to-transparent sm:w-4/5 md:w-3/4 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#00152a] via-[#00152a]/40 to-transparent pointer-events-none" />
      </div>

      {/* Hero Content Container */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-8 w-full">
        <div className="max-w-2xl">
          {/* Calm Travel Eyebrow */}
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-500/15 px-3.5 py-1 text-xs font-bold text-teal-300 backdrop-blur-md mb-4">
            <span className="material-symbols-outlined text-sm" aria-hidden="true">
              explore
            </span>
            <span>Central Vietnam Travel Atlas • Da Nang - Hoi An - Hue</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-black tracking-tight text-white leading-[1.15] text-balance">
            Khám phá miền Trung theo cách của bạn
          </h1>

          {/* Supporting Copy */}
          <p className="mt-4 text-base sm:text-lg text-slate-200 leading-relaxed text-pretty max-w-xl">
            Tìm những điểm đến đáng nhớ, khám phá tour bản địa và lên lịch trình phù hợp với chuyến đi của bạn.
          </p>

          {/* Destination Switcher Quick Chips */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mr-1">
              Điểm đến:
            </span>
            <button
              type="button"
              onClick={() => onSelectCity('danang')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeCity === 'danang'
                  ? 'bg-[#007d6e] text-white shadow-md'
                  : 'bg-white/15 text-slate-200 hover:bg-white/25 backdrop-blur-md'
              }`}
            >
              Đà Nẵng
            </button>
            <button
              type="button"
              onClick={() => onSelectCity('hoian')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeCity === 'hoian'
                  ? 'bg-[#d97706] text-white shadow-md'
                  : 'bg-white/15 text-slate-200 hover:bg-white/25 backdrop-blur-md'
              }`}
            >
              Hội An
            </button>
            <button
              type="button"
              onClick={() => onSelectCity('hue')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeCity === 'hue'
                  ? 'bg-[#7c3aed] text-white shadow-md'
                  : 'bg-white/15 text-slate-200 hover:bg-white/25 backdrop-blur-md'
              }`}
            >
              Cố Đô Huế
            </button>
          </div>

          {/* Clear Travel CTAs */}
          <div className="mt-8 flex flex-wrap items-center gap-3.5">
            <Link
              href={ROUTES.plan}
              aria-label="Lập lịch trình"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#007d6e] px-6 py-3 text-sm font-bold text-white shadow-md shadow-teal-900/40 hover:bg-[#006b5f] transition-all cursor-pointer hover:scale-[1.01]"
            >
              <span>Lập lịch trình</span>
              <span className="material-symbols-outlined text-base" aria-hidden="true">
                calendar_month
              </span>
            </Link>

            <Link
              href={ROUTES.pois}
              aria-label="Khám phá điểm đến"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white/10 border border-white/25 px-6 py-3 text-sm font-bold text-white backdrop-blur-md shadow-xs hover:bg-white/20 hover:border-white/40 transition-all cursor-pointer hover:scale-[1.01]"
            >
              <span className="material-symbols-outlined text-base text-teal-300" aria-hidden="true">
                explore
              </span>
              <span>Khám phá điểm đến</span>
            </Link>

            <Link
              href={ROUTES.tours}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-300 hover:text-teal-200 transition-colors ml-1 py-2"
            >
              <span>Xem các tour bản địa</span>
              <span className="material-symbols-outlined text-sm" aria-hidden="true">
                arrow_forward
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Subtle Caption on Bottom Right */}
      <div className="hidden md:flex absolute bottom-4 right-8 z-10 items-center gap-2 rounded-full bg-black/40 px-3.5 py-1 text-[11px] font-medium text-slate-300 backdrop-blur-md border border-white/10 pointer-events-none">
        <span className="material-symbols-outlined text-sm text-teal-400" aria-hidden="true">
          photo_camera
        </span>
        <span>{currentHero.caption}</span>
      </div>
    </section>
  );
}
