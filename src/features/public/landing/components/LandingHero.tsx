/* eslint-disable @next/next/no-img-element */
'use client';

import Link from 'next/link';
import { ROUTES } from '@/lib/routes';

interface LandingHeroProps {
  activeCity?: 'danang' | 'hoian' | 'hue';
  onSelectCity?: (city: 'danang' | 'hoian' | 'hue') => void;
}

/**
 * Modern Explorer Da Nang Homepage Hero — Full-Bleed Edge-to-Edge Architecture.
 *
 * User Direction Updates:
 * 1. Full-bleed edge-to-edge: Fills the entire section horizontally without card borders or outer margins.
 * 2. Natural, crystal-clear photography: Removed milky white overlays so the vibrant turquoise ocean,
 *    Son Tra mountain, and sunny coastline are sharp and vivid.
 * 3. Soft, delicate local scrim ensures dark navy text is 100% legible without washing out the photo.
 * 4. Responsive 2-line headline rhythm ("Đà Nẵng, nơi" / "hành trình bắt đầu.") across all screens.
 */
export function LandingHero({ activeCity = 'danang', onSelectCity }: LandingHeroProps) {
  // Preserve callback compatibility if needed by parent
  if (activeCity !== 'danang' && onSelectCity) {
    // Graceful no-op to maintain type and prop interface without unexpected state mutations
  }

  return (
    <section
      aria-label="Đà Nẵng — Nơi hành trình bắt đầu"
      className="relative w-full overflow-hidden min-h-[580px] sm:min-h-[660px] lg:h-[780px] xl:h-[840px] flex items-center bg-[#F8F6F1]"
    >
      {/* Layer 1 (z-0): Full-Bleed Edge-to-Edge Da Nang Photography */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/landing/hero-danang-sontra.jpg"
          alt="Toàn cảnh bán đảo Sơn Trà và vịnh biển Đà Nẵng dưới ánh nắng sớm"
          className="h-full w-full object-cover object-[70%_center] sm:object-[68%_center] lg:object-[center_55%] transition-transform duration-1000 ease-out will-change-transform"
          loading="eager"
          fetchPriority="high"
        />
      </div>

      {/* Layer 2 (z-10): Ultra-Delicate, Natural Scrim (Not milky, crisp image preservation) */}
      {/* Desktop: Gentle soft light gradient on the left 42% only, fading completely into vivid natural scenery */}
      <div
        className="absolute inset-0 z-10 hidden md:block bg-gradient-to-r from-white/75 via-white/35 via-38% to-transparent"
        aria-hidden="true"
      />
      {/* Mobile: Soft light top-left gradient maintaining legibility without clouding the landscape */}
      <div
        className="absolute inset-0 z-10 md:hidden bg-gradient-to-b from-white/85 via-white/50 via-55% to-transparent"
        aria-hidden="true"
      />
      {/* Subtle bottom grounding gradient */}
      <div
        className="absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-t from-black/15 to-transparent pointer-events-none"
        aria-hidden="true"
      />

      {/* Layer 3 (z-20): Editorial Content Layer Directly Over Image */}
      <div className="relative z-20 mx-auto w-full max-w-[1680px] px-5 sm:px-12 md:px-16 lg:px-20 xl:px-24 py-12 sm:py-16 lg:py-24">
        <div className="max-w-xl lg:max-w-2xl xl:max-w-3xl">
          {/* Eyebrow Label */}
          <div className="inline-flex items-center gap-2 self-start rounded-full bg-white/90 backdrop-blur-md px-3.5 py-1.5 border border-white/80 shadow-xs">
            <span className="h-2 w-2 rounded-full bg-[#007D6E] animate-pulse" aria-hidden="true" />
            <span className="font-[family-name:var(--font-manrope)] text-[11px] sm:text-xs font-bold uppercase tracking-[0.16em] text-[#006B5F]">
              TripMate · Khám phá miền Trung
            </span>
          </div>

          {/* Display Headline — Bricolage Grotesque (Natural 2-line break on all viewports) */}
          <h1 className="mt-4 sm:mt-6 font-[family-name:var(--font-bricolage)] text-[32px] sm:text-5xl md:text-[56px] lg:text-[66px] xl:text-[74px] font-extrabold tracking-[-0.035em] leading-[1.12] sm:leading-[1.08] text-[#00152A] drop-shadow-[0_1px_2px_rgba(255,255,255,0.6)]">
            Đà Nẵng, nơi <br />
            hành trình bắt đầu.
          </h1>

          {/* Supporting Description — Manrope */}
          <p className="mt-4 sm:mt-6 font-[family-name:var(--font-manrope)] text-sm sm:text-lg md:text-xl font-medium leading-[1.6] text-slate-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)] max-w-xl">
            Khám phá những điểm đến đáng nhớ, trải nghiệm tour bản địa và lên lịch trình phù hợp với chuyến đi của bạn.
          </p>

          {/* Two Prominent Contrasting CTA Buttons */}
          <div className="mt-6 sm:mt-9 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            {/* Primary CTA: Solid TripMate Teal with arrow */}
            <Link
              href={ROUTES.plan}
              className="group inline-flex min-h-[48px] sm:min-h-[54px] items-center justify-center gap-2.5 rounded-xl bg-[#007D6E] px-7 sm:px-8 py-3.5 text-sm sm:text-base font-bold text-white shadow-lg shadow-[#007D6E]/30 hover:bg-[#006B5F] hover:shadow-xl hover:shadow-[#007D6E]/40 transition-all duration-200 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
              aria-label="Lập lịch trình cho chuyến đi của bạn"
            >
              <span>Lập lịch trình</span>
              <span
                className="material-symbols-outlined text-lg transition-transform duration-200 group-hover:translate-x-1"
                aria-hidden="true"
              >
                arrow_forward
              </span>
            </Link>

            {/* Secondary CTA: Clean Dark Navy Button */}
            <Link
              href={ROUTES.tours}
              className="inline-flex min-h-[48px] sm:min-h-[54px] items-center justify-center gap-2 rounded-xl bg-white/90 hover:bg-[#00152A] text-[#00152A] hover:text-white border border-white/80 px-7 sm:px-8 py-3.5 text-sm sm:text-base font-bold backdrop-blur-md shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
              aria-label="Khám phá các tour du lịch bản địa"
            >
              <span>Khám phá tour</span>
              <span className="material-symbols-outlined text-lg opacity-70" aria-hidden="true">
                explore
              </span>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="mt-7 sm:mt-10 pt-4 flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-semibold text-slate-800 border-t border-slate-900/15 max-w-lg">
            <div className="inline-flex items-center gap-1.5 rounded-md bg-white/60 px-2 py-1 backdrop-blur-xs">
              <span className="material-symbols-outlined text-base text-[#007D6E]" aria-hidden="true">
                verified
              </span>
              <span>Tour xác thực bản địa</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-md bg-white/60 px-2 py-1 backdrop-blur-xs">
              <span className="material-symbols-outlined text-base text-[#007D6E]" aria-hidden="true">
                map
              </span>
              <span>Lịch trình tối ưu thời gian</span>
            </div>
          </div>
        </div>
      </div>

      {/* Layer 4: Discreet Photo Credit Tag on Bottom Right */}
      <div className="hidden md:flex absolute bottom-6 right-8 z-20 items-center gap-2 rounded-full bg-white/85 backdrop-blur-md px-4 py-2 text-[11px] sm:text-xs font-semibold text-slate-800 border border-white/80 shadow-md">
        <span className="material-symbols-outlined text-sm text-[#007D6E]" aria-hidden="true">
          location_on
        </span>
        <span>Bán đảo Sơn Trà & Chùa Linh Ứng · Đà Nẵng</span>
      </div>
    </section>
  );
}
