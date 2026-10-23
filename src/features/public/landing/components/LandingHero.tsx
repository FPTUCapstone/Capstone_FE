/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes';
import { CENTRAL_DESTINATIONS } from '@/data/landingData';

interface LandingHeroProps {
  activeCity: 'danang' | 'hoian' | 'hue';
  onSelectCity: (city: 'danang' | 'hoian' | 'hue') => void;
}

const CITIES: Array<'danang' | 'hoian' | 'hue'> = ['danang', 'hoian', 'hue'];
const AUTO_ROTATE_INTERVAL_MS = 8000;

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
  const [prevActiveCity, setPrevActiveCity] = useState(activeCity);
  const [currentCity, setCurrentCity] = useState<'danang' | 'hoian' | 'hue'>(activeCity);
  const [isPaused, setIsPaused] = useState(false);
  const [isIntersecting, setIsIntersecting] = useState(true);
  const sectionRef = useRef<HTMLElement>(null);

  // Synchronize internal state during render when activeCity prop changes from parent (React pattern)
  if (prevActiveCity !== activeCity) {
    setPrevActiveCity(activeCity);
    setCurrentCity(activeCity);
  }

  // Pause auto-rotation when the Hero is scrolled out of viewport
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // 8-second auto-rotation cycle (Option 1: Scoped to Hero)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Respect reduced motion preference (WCAG 2.2.2)
    const mediaQuery =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;
    if (mediaQuery?.matches) return;

    if (isPaused || !isIntersecting) return;

    const timer = setInterval(() => {
      setCurrentCity((prev) => {
        const nextIdx = (CITIES.indexOf(prev) + 1) % CITIES.length;
        return CITIES[nextIdx];
      });
    }, AUTO_ROTATE_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [isPaused, isIntersecting, currentCity]);

  // Manual city selection resets cycle and notifies parent
  const handleUserSelectCity = useCallback(
    (city: 'danang' | 'hoian' | 'hue') => {
      setCurrentCity(city);
      onSelectCity(city);
    },
    [onSelectCity]
  );

  const currentHero = DESTINATION_HERO_IMAGES[currentCity] || DESTINATION_HERO_IMAGES.danang;

  return (
    <section
      ref={sectionRef}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      aria-roledescription="carousel"
      aria-label="Khám phá điểm đến miền Trung"
      className="relative overflow-hidden min-h-[480px] lg:h-[540px] flex items-center bg-[#00152a] text-white"
    >
      {/* Scenic Travel Photography Background with Graceful Multi-Layer Overlay & Cinematic Crossfade */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {CITIES.map((city) => {
          const hero = DESTINATION_HERO_IMAGES[city];
          const isActive = currentCity === city;
          return (
            <img
              key={city}
              src={hero.src}
              alt={hero.alt}
              aria-hidden={!isActive}
              className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 z-[1]' : 'opacity-0 z-0 pointer-events-none'
              }`}
              loading={city === 'danang' ? 'eager' : 'lazy'}
            />
          );
        })}
        {/* Soft Multi-Directional Gradient Overlays for Guaranteed Text Legibility */}
        <div className="absolute inset-0 z-[2] bg-gradient-to-r from-[#00152a]/95 via-[#00152a]/80 to-transparent sm:w-4/5 md:w-3/4 pointer-events-none" />
        <div className="absolute inset-0 z-[2] bg-gradient-to-t from-[#00152a] via-[#00152a]/40 to-transparent pointer-events-none" />
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

          {/* Destination Switcher Quick Chips with Active Indicator */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mr-1">
              Điểm đến:
            </span>
            <button
              type="button"
              onClick={() => handleUserSelectCity('danang')}
              aria-pressed={currentCity === 'danang'}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentCity === 'danang'
                  ? 'bg-[#007d6e] text-white shadow-md'
                  : 'bg-white/15 text-slate-200 hover:bg-white/25 backdrop-blur-md'
              }`}
            >
              Đà Nẵng
            </button>
            <button
              type="button"
              onClick={() => handleUserSelectCity('hoian')}
              aria-pressed={currentCity === 'hoian'}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentCity === 'hoian'
                  ? 'bg-[#d97706] text-white shadow-md'
                  : 'bg-white/15 text-slate-200 hover:bg-white/25 backdrop-blur-md'
              }`}
            >
              Hội An
            </button>
            <button
              type="button"
              onClick={() => handleUserSelectCity('hue')}
              aria-pressed={currentCity === 'hue'}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentCity === 'hue'
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

            <Link
              href={ROUTES.about}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors ml-1 py-2"
            >
              <span>Tìm hiểu TripMate</span>
              <span className="material-symbols-outlined text-sm" aria-hidden="true">
                info
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Subtle Caption on Bottom Right with Carousel Indicators */}
      <div className="hidden md:flex absolute bottom-4 right-8 z-10 items-center gap-3 rounded-full bg-black/45 px-3.5 py-1.5 text-[11px] font-medium text-slate-200 backdrop-blur-md border border-white/15 shadow-sm">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {CITIES.map((city) => (
            <span
              key={city}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                currentCity === city ? 'w-4 bg-teal-400' : 'w-1.5 bg-white/40'
              }`}
            />
          ))}
        </div>
        <span className="h-3 w-px bg-white/20" aria-hidden="true" />
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm text-teal-400" aria-hidden="true">
            photo_camera
          </span>
          <span>{currentHero.caption}</span>
        </div>
      </div>
    </section>
  );
}
