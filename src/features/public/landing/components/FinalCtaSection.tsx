'use client';

import Link from 'next/link';
import { ROUTES } from '@/lib/routes';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { LandingEyebrow } from './LandingEyebrow';

export function FinalCtaSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#00152a] to-[#00283a] text-white py-20 sm:py-28 px-4 sm:px-8 border-t border-slate-800">
      {/* Ambient background glow */}
      <div className="absolute left-1/2 -top-24 -translate-x-1/2 h-96 w-96 rounded-full bg-teal-500/15 blur-3xl pointer-events-none" />
      <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        {/* Eyebrow */}
        <ScrollReveal animation="fade-down" delay={50}>
          <LandingEyebrow icon="rocket_launch" variant="dark" className="mb-6">
            Sẵn sàng cho chuyến đi tiếp theo?
          </LandingEyebrow>
        </ScrollReveal>

        {/* Headline */}
        <ScrollReveal animation="fade-up" delay={120}>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight text-balance">
            Bắt đầu hành trình Miền Trung{' '}
            <span className="text-teal-300">được tối ưu riêng cho bạn.</span>
          </h2>
        </ScrollReveal>

        {/* Subtitle */}
        <ScrollReveal animation="fade-up" delay={200}>
          <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed text-pretty">
            Không còn loay hoay sắp xếp thời gian hay lo sợ thời tiết làm hỏng kế hoạch.
            Trải nghiệm Đà Nẵng, Hội An và Cố Đô Huế theo cách thông minh, chủ động và trọn vẹn nhất.
          </p>
        </ScrollReveal>

        {/* CTA Pair */}
        <ScrollReveal animation="fade-up" delay={280}>
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={ROUTES.plan}
              className="w-full sm:w-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-teal-400 hover:bg-teal-300 px-8 py-3.5 text-sm font-black text-[#00152a] shadow-lg shadow-teal-400/25 transition-all cursor-pointer active:scale-95 btn-press"
            >
              <span>Lập hành trình ngay</span>
              <span className="material-symbols-outlined text-lg">bolt</span>
            </Link>
            <Link
              href={ROUTES.tours}
              className="w-full sm:w-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 px-8 py-3.5 text-sm font-bold text-white transition-all cursor-pointer btn-press"
            >
              <span className="material-symbols-outlined text-lg text-teal-300">explore</span>
              <span>Khám phá tour bản địa</span>
            </Link>
          </div>
        </ScrollReveal>

        {/* Grounded Trust Badges */}
        <ScrollReveal animation="fade-up" delay={360}>
          <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-teal-300">map</span>
              <span>Hệ tọa độ GIS chuẩn hóa</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-teal-300">qr_code_2</span>
              <span>Vé điện tử Dynamic QR</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-teal-300">verified_user</span>
              <span>Bảo chứng Escrow an toàn</span>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
