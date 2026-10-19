'use client';

import Link from 'next/link';
import { ROUTES } from '@/lib/routes';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { LandingEyebrow } from './LandingEyebrow';
import { JourneyCanvas } from './JourneyCanvas';

interface LandingHeroProps {
  activeCity: 'danang' | 'hoian' | 'hue';
  onSelectCity: (city: 'danang' | 'hoian' | 'hue') => void;
}

export function LandingHero({ activeCity, onSelectCity }: LandingHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(0,125,110,0.12),rgba(255,255,255,0))] px-4 py-14 sm:px-8 md:py-20 lg:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(420px,0.85fr)]">
        {/* Left Hero Content */}
        <div className="relative z-10 max-w-2xl">
          {/* Eyebrow */}
          <ScrollReveal animation="fade-down" delay={50}>
            <LandingEyebrow icon="explore" className="mb-5">
              Central Vietnam Travel Atlas • Da Nang - Hoi An - Hue
            </LandingEyebrow>
          </ScrollReveal>

          {/* Main Headline */}
          <ScrollReveal animation="fade-up" delay={120}>
            <h1 className="text-4xl font-black leading-[1.08] tracking-[-0.03em] text-[#00152a] sm:text-5xl md:text-6xl text-balance">
              Khám phá Miền Trung với{' '}
              <span className="text-[#007d6e] inline-block">Lịch trình Tối ưu Thông minh.</span>
            </h1>
          </ScrollReveal>

          {/* Subtitle / Lead Copy */}
          <ScrollReveal animation="fade-up" delay={200}>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg text-pretty">
              Nền tảng du lịch thông minh Miền Trung kết hợp thuật toán tối ưu đa ràng buộc (CSP) và giám sát thời gian thực.
              Tự động điều phối một ngày trọn vẹn theo sở thích của bạn — từ giờ mở cửa di tích đến thời khắc hoàng hôn biển tuyệt đẹp.
            </p>
          </ScrollReveal>

          {/* Interactive 3-Pill Destination Switcher */}
          <ScrollReveal animation="fade-up" delay={280}>
            <div className="mt-7 flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs max-w-fit">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2.5">
                Điểm đến:
              </span>
              <button
                type="button"
                onClick={() => onSelectCity('danang')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer btn-press ${
                  activeCity === 'danang'
                    ? 'bg-[#007d6e] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Đà Nẵng
              </button>
              <button
                type="button"
                onClick={() => onSelectCity('hoian')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer btn-press ${
                  activeCity === 'hoian'
                    ? 'bg-[#d97706] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Hội An
              </button>
              <button
                type="button"
                onClick={() => onSelectCity('hue')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer btn-press ${
                  activeCity === 'hue'
                    ? 'bg-[#7c3aed] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Cố Đô Huế
              </button>
            </div>
          </ScrollReveal>

          {/* Exactly 2 Dominant CTAs */}
          <ScrollReveal animation="fade-up" delay={360}>
            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <Link
                href={ROUTES.plan}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#007d6e] px-6 py-3 text-sm font-bold text-white shadow-md shadow-teal-700/25 hover:bg-[#006b5f] transition-all cursor-pointer btn-press"
              >
                <span>Lập hành trình của bạn</span>
                <span className="material-symbols-outlined text-base">bolt</span>
              </Link>
              <a
                href="#destinations"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white border border-slate-300 px-6 py-3 text-sm font-bold text-slate-800 shadow-xs hover:bg-slate-50 hover:border-slate-400 transition-all cursor-pointer btn-press"
              >
                <span className="material-symbols-outlined text-base text-[#007d6e]">explore</span>
                <span>Khám phá điểm đến</span>
              </a>
            </div>
          </ScrollReveal>

          {/* Web & Mobile Platform Note */}
          <ScrollReveal animation="fade-up" delay={440}>
            <div className="mt-8 flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/70 p-3.5 text-xs leading-relaxed text-slate-600 backdrop-blur-xs max-w-lg">
              <span className="material-symbols-outlined text-xl text-[#007d6e] shrink-0" aria-hidden="true">
                devices
              </span>
              <p>
                <strong>Đồng bộ trải nghiệm:</strong> Lên lịch trình và chọn tour trên Web; dẫn đường GPS và vé QR điện tử đồng hành trên Mobile.
              </p>
            </div>
          </ScrollReveal>
        </div>

        {/* Right Hero: Journey Canvas */}
        <ScrollReveal animation="zoom-in" delay={180} duration={850}>
          <JourneyCanvas activeCity={activeCity} onSelectCity={onSelectCity} />
        </ScrollReveal>
      </div>
    </section>
  );
}
