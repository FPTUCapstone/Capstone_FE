'use client';

import Link from 'next/link';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { ROUTES } from '@/lib/routes';

export function AboutCtaSection() {
  return (
    <section className="py-16 sm:py-24 bg-[#00152a] text-white px-4 sm:px-8 relative overflow-hidden border-t border-slate-800">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] rounded-full bg-teal-500/15 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <ScrollReveal animation="fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-500/15 px-3.5 py-1 text-xs font-bold text-teal-300 backdrop-blur-md mb-4">
            <span className="material-symbols-outlined text-sm" aria-hidden="true">
              luggage
            </span>
            <span>Khởi đầu chuyến đi của bạn</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight text-balance">
            Sẵn sàng khám phá miền Trung cùng TripMate?
          </h2>

          <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed text-pretty">
            Bắt đầu lên lịch trình tham quan tự động hoặc khám phá kho dữ liệu điểm đến di sản
            tại Đà Nẵng, Hội An và Cố Đô Huế ngay hôm nay.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href={ROUTES.plan}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#007d6e] hover:bg-[#006b5f] text-white text-sm font-bold px-7 py-3 shadow-lg shadow-teal-900/50 transition cursor-pointer"
            >
              <span>Lập lịch trình ngay</span>
              <span className="material-symbols-outlined text-base" aria-hidden="true">
                calendar_month
              </span>
            </Link>

            <Link
              href={ROUTES.pois}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold px-7 py-3 border border-white/20 transition cursor-pointer backdrop-blur-xs"
            >
              <span className="material-symbols-outlined text-base text-teal-300" aria-hidden="true">
                explore
              </span>
              <span>Khám phá điểm đến</span>
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
