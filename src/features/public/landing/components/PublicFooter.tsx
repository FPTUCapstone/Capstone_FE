'use client';

import Link from 'next/link';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { ROUTES } from '@/lib/routes';
import { useI18n } from '@/i18n';

export function PublicFooter() {
  const { locale, hasProvider } = useI18n();
  const isVi = !hasProvider || locale === 'vi';

  return (
    <footer className="border-t border-[#174B4A]/30 bg-[#0C2423] text-slate-300 px-4 py-14 sm:px-8">
      <ScrollReveal animation="fade-up">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-800/80">
            {/* Col 1: TripMate Brand & Contact info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <BrandLogo size={26} inverse />
              </div>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
                {isVi
                  ? 'Nền tảng công nghệ du lịch thông minh Miền Trung Việt Nam. Kết nối du khách với mạng lưới trải nghiệm bản địa chuẩn xác, minh bạch với cơ chế ký quỹ an toàn.'
                  : 'Smart travel technology platform for Central Vietnam. Connecting travelers with authentic local experiences, transparent pricing, and secure escrow guarantees.'}
              </p>
              <div className="space-y-2 text-xs text-slate-400 pt-2">
                <p className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-[#E8F0EA]" aria-hidden="true">
                    support_agent
                  </span>
                  <span>{isVi ? 'Hỗ trợ:' : 'Support:'} <strong className="text-white">1900 8899</strong> | <strong className="text-white">hotro@tripmate.vn</strong></span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-[#E8F0EA]" aria-hidden="true">
                    location_on
                  </span>
                  <span>{isVi ? 'Trụ sở vận hành:' : 'Headquarters:'} <strong className="text-white">{isVi ? 'Đà Nẵng, Việt Nam' : 'Da Nang, Vietnam'}</strong></span>
                </p>
              </div>
            </div>

            {/* Col 2: Dịch vụ & Trải nghiệm */}
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-white mb-4">
                {isVi ? 'Dịch vụ & Trải nghiệm' : 'Services & Experiences'}
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li>
                  <Link href={ROUTES.pois} className="hover:text-teal-300 transition">
                    {isVi ? 'Khám phá điểm đến Miền Trung' : 'Explore Central Vietnam'}
                  </Link>
                </li>
                <li>
                  <Link href={ROUTES.tours} className="hover:text-teal-300 transition">
                    {isVi ? 'Tour kiểm duyệt bản địa' : 'Verified Local Tours'}
                  </Link>
                </li>
                <li>
                  <Link href={ROUTES.plan} className="hover:text-teal-300 transition">
                    {isVi ? 'Lập lịch trình thông minh (AI)' : 'Smart Itinerary Planning'}
                  </Link>
                </li>
                <li>
                  <Link href={ROUTES.about} className="hover:text-teal-300 transition">
                    {isVi ? 'Về TripMate & Sứ mệnh' : 'About TripMate & Mission'}
                  </Link>
                </li>
                <li>
                  <Link href={`${ROUTES.about}#planning`} className="hover:text-teal-300 transition">
                    {isVi ? 'Cách thức hoạt động' : 'How It Works'}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Hỗ trợ & Khách hàng */}
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-white mb-4">
                {isVi ? 'Hỗ trợ & Điều hướng' : 'Support & Navigation'}
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li>
                  <Link href={`${ROUTES.about}#faq`} className="hover:text-teal-300 transition">
                    {isVi ? 'Câu hỏi thường gặp (FAQ)' : 'Frequently Asked Questions'}
                  </Link>
                </li>
                <li>
                  <Link href={ROUTES.signIn} className="hover:text-teal-300 transition">
                    {isVi ? 'Đăng nhập du khách' : 'Traveler Sign In'}
                  </Link>
                </li>
                <li>
                  <Link href={ROUTES.admin.login} className="hover:text-teal-300 transition">
                    {isVi ? 'Cổng quản trị viên' : 'Administrator Portal'}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: Hợp tác cùng TripMate (Guest Partner Onboarding Hub) */}
            <div className="rounded-2xl border border-white/10 bg-[#103B39]/70 p-5 backdrop-blur-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-lg text-teal-400" aria-hidden="true">
                    handshake
                  </span>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-white">
                    {isVi ? 'Hợp tác cùng TripMate' : 'Partner with TripMate'}
                  </h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {isVi
                    ? 'Dành cho doanh nghiệp lữ hành và nhà tổ chức trải nghiệm bản địa tại Đà Nẵng, Hội An, Huế.'
                    : 'For travel operators and local service providers in Da Nang, Hoi An, and Hue.'}
                </p>
              </div>

              <div className="pt-4 space-y-2">
                <Link
                  href={ROUTES.partner.register}
                  className="inline-flex items-center justify-center gap-1.5 w-full rounded-xl bg-[#174B4A] hover:bg-[#103B39] text-white text-xs font-bold py-2.5 px-4 shadow-sm transition border border-[#174B4A]/60"
                >
                  <span>{isVi ? 'Trở thành đối tác' : 'Become a Partner'}</span>
                  <span className="material-symbols-outlined text-sm" aria-hidden="true">
                    arrow_forward
                  </span>
                </Link>

                <Link
                  href={ROUTES.signIn}
                  className="inline-flex items-center justify-center gap-1.5 w-full rounded-xl border border-slate-700 bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold py-2 px-4 transition"
                >
                  <span>{isVi ? 'Đăng nhập đối tác' : 'Partner Sign In'}</span>
                </Link>

                <div className="text-center pt-1">
                  <Link
                    href={ROUTES.partner.application}
                    className="text-[11px] text-slate-400 hover:text-teal-300 transition inline-flex items-center gap-1"
                  >
                    <span>{isVi ? 'Tra cứu hồ sơ đăng ký' : 'Check Application Status'}</span>
                    <span className="material-symbols-outlined text-xs" aria-hidden="true">
                      open_in_new
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Copyright & Central Vietnam Regional Alignment */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>{isVi ? '© 2026 TripMate Technologies Vietnam. Tất cả các quyền được bảo lưu.' : '© 2026 TripMate Technologies Vietnam. All rights reserved.'}</p>
            <div className="flex items-center gap-4">
              <span>{isVi ? 'Đà Nẵng • Hội An • Cố Đô Huế' : 'Da Nang • Hoi An • Ancient Hue'}</span>
              <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {isVi ? 'Hệ thống vận hành ổn định' : 'All systems operational'}
              </span>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </footer>
  );
}
