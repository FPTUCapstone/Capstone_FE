'use client';

/* eslint-disable @next/next/no-img-element */

import { publicSearchCopy, type SearchLocale } from '../resources/publicSearch';

interface TourEditorialHeroProps {
  onExploreClick?: () => void;
  locale?: SearchLocale;
}

export function TourEditorialHero({ onExploreClick, locale = 'vi' }: TourEditorialHeroProps) {
  const copy = publicSearchCopy(locale).hero;
  function handleScrollDown() {
    if (onExploreClick) {
      onExploreClick();
      return;
    }
    const target = document.getElementById('tours-discovery-workspace');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  }

  return (
    <section
      aria-label={copy.label}
      className="relative mb-8 overflow-hidden rounded-3xl bg-slate-950 shadow-md min-h-[260px] md:h-[280px] lg:h-[300px] flex items-center"
    >
      {/* Background travel image with responsive crop */}
      <img
        src="https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1600&q=80"
        alt={copy.image}
        className="absolute inset-0 h-full w-full object-cover object-center brightness-90 filter"
        loading="eager"
      />

      {/* Layered gradient overlay for crisp text contrast */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-slate-900/30"
      />

      {/* Editorial Content */}
      <div className="relative z-10 w-full px-6 py-8 sm:px-10 lg:px-12 flex flex-col justify-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-950/60 px-3.5 py-1 text-xs font-bold text-teal-300 backdrop-blur-xs mb-3 w-fit">
          <span className="material-symbols-outlined text-sm">explore</span>
          <span>{copy.badge}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-white tracking-tight max-w-2xl">
          {copy.title} <span className="text-teal-400">{copy.emphasis}</span>
        </h1>

        <p className="mt-2 text-xs sm:text-sm lg:text-base text-slate-200/90 max-w-xl leading-relaxed">
          {copy.description}
        </p>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={handleScrollDown}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#103B39] px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-md transition hover:bg-[#174B4A] active:scale-98"
          >
            <span>{copy.action}</span>
            <span className="material-symbols-outlined text-sm">arrow_downward</span>
          </button>
        </div>
      </div>
    </section>
  );
}
