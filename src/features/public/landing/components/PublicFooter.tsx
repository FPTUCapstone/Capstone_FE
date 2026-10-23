'use client';

import Link from 'next/link';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { ROUTES } from '@/lib/routes';

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-800 bg-[#00152a] text-slate-300 px-4 py-14 sm:px-8">
      <ScrollReveal animation="fade-up">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-800/80">
            {/* Col 1: TripMate Brand & Contact info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <BrandLogo size={26} />
              </div>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
                Nền tảng công nghệ du lịch thông minh Miền Trung Việt Nam.
                Kết nối du khách với mạng lưới trải nghiệm bản địa chuẩn xác, minh bạch với cơ chế ký quỹ an toàn.
              </p>
              <div className="space-y-2 text-xs text-slate-400 pt-2">
                <p className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-[#007d6e]" aria-hidden="true">
                    support_agent
                  </span>
                  <span>Hỗ trợ: <strong className="text-white">1900 8899</strong> | <strong className="text-white">hotro@tripmate.vn</strong></span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-[#007d6e]" aria-hidden="true">
                    location_on
                  </span>
                  <span>Trụ sở vận hành: <strong className="text-white">Đà Nẵng, Việt Nam</strong></span>
                </p>
              </div>
            </div>

            {/* Col 2: Dịch vụ & Trải nghiệm */}
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-white mb-4">
                Dịch vụ &amp; Trải nghiệm
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li>
                  <Link href={ROUTES.pois} className="hover:text-teal-300 transition">
                    Khám phá điểm đến Miền Trung
                  </Link>
                </li>
                <li>
                  <Link href={ROUTES.tours} className="hover:text-teal-300 transition">
                    Tour kiểm duyệt bản địa
                  </Link>
                </li>
                <li>
                  <Link href={ROUTES.plan} className="hover:text-teal-300 transition">
                    Lập lịch trình thông minh (CSP)
                  </Link>
                </li>
                <li>
                  <Link href={ROUTES.about} className="hover:text-teal-300 transition">
                    Về TripMate &amp; Sứ mệnh
                  </Link>
                </li>
                <li>
                  <Link href={`${ROUTES.about}#planning`} className="hover:text-teal-300 transition">
                    Cách thức hoạt động
                  </Link>
                </li>
                <li>
                  <Link href={`${ROUTES.about}#weather`} className="hover:text-teal-300 transition">
                    Ứng phó thời tiết linh hoạt
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Hỗ trợ & Khách hàng */}
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-white mb-4">
                Hỗ trợ &amp; Điều hướng
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li>
                  <Link href={`${ROUTES.about}#faq`} className="hover:text-teal-300 transition">
                    Câu hỏi thường gặp (FAQ)
                  </Link>
                </li>
                <li>
                  <Link href={`${ROUTES.about}#mobile`} className="hover:text-teal-300 transition">
                    Ứng dụng di động TripMate
                  </Link>
                </li>
                <li>
                  <Link href={ROUTES.signIn} className="hover:text-teal-300 transition">
                    Đăng nhập du khách
                  </Link>
                </li>
                <li>
                  <Link href={ROUTES.admin.login} className="hover:text-teal-300 transition">
                    Cổng quản trị viên
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: Hợp tác cùng TripMate (Guest Partner Onboarding Hub) */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-lg text-teal-400" aria-hidden="true">
                    handshake
                  </span>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-white">
                    Hợp tác cùng TripMate
                  </h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Dành cho doanh nghiệp lữ hành và nhà tổ chức trải nghiệm bản địa tại Đà Nẵng, Hội An, Huế.
                </p>
              </div>

              <div className="pt-4 space-y-2">
                <Link
                  href={ROUTES.partner.register}
                  className="inline-flex items-center justify-center gap-1.5 w-full rounded-xl bg-[#007d6e] hover:bg-[#006b5f] text-white text-xs font-bold py-2.5 px-4 shadow-sm transition"
                >
                  <span>Trở thành đối tác</span>
                  <span className="material-symbols-outlined text-sm" aria-hidden="true">
                    arrow_forward
                  </span>
                </Link>

                <Link
                  href={ROUTES.signIn}
                  className="inline-flex items-center justify-center gap-1.5 w-full rounded-xl border border-slate-700 bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold py-2 px-4 transition"
                >
                  <span>Đăng nhập đối tác</span>
                </Link>

                <div className="text-center pt-1">
                  <Link
                    href={ROUTES.partner.application}
                    className="text-[11px] text-slate-400 hover:text-teal-300 transition inline-flex items-center gap-1"
                  >
                    <span>Tra cứu hồ sơ đăng ký</span>
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
            <p>© 2026 TripMate Technologies Vietnam. Tất cả các quyền được bảo lưu.</p>
            <div className="flex items-center gap-4">
              <span>Đà Nẵng • Hội An • Cố Đô Huế</span>
              <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Hệ thống vận hành ổn định
              </span>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </footer>
  );
}
