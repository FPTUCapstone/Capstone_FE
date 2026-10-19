'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

import { PublicNavigation } from '@/components/navigation/PublicNavigation';
import { ROUTES } from '@/lib/routes';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { LandingHero } from './components/LandingHero';
import { CentralVietnamShowcase } from './components/CentralVietnamShowcase';
import { CspSimulatorSection } from './components/CspSimulatorSection';
import { WeatherReroutingSection } from './components/WeatherReroutingSection';
import { FeaturedToursSection } from './components/FeaturedToursSection';
import { ComparisonMatrixSection } from './components/ComparisonMatrixSection';
import { PartnerEcosystemSection } from './components/PartnerEcosystemSection';
import { MobileAppShowcaseSection } from './components/MobileAppShowcaseSection';
import { FaqSection } from './components/FaqSection';
import { FinalCtaSection } from './components/FinalCtaSection';

export function LandingPage() {
  const [activeCity, setActiveCity] = useState<'danang' | 'hoian' | 'hue'>('danang');
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setShowScrollTop(window.scrollY > 400);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function handleSelectCity(city: 'danang' | 'hoian' | 'hue') {
    setActiveCity(city);
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="min-h-screen bg-[#f4f7fc] text-[#0F1B2D] font-sans antialiased selection:bg-teal-100 selection:text-teal-900 relative">
      {/* Route-Aware Public Header Navigation with Scroll Progress */}
      <PublicNavigation isLanding={true} />

      <main>
        {/* 1. Hero Section with Journey Canvas */}
        <LandingHero activeCity={activeCity} onSelectCity={handleSelectCity} />

        {/* 2. Central Vietnam Destination Showcase */}
        <CentralVietnamShowcase onSelectCity={handleSelectCity} />

        {/* 3. Interactive CSP Simulator Section */}
        <CspSimulatorSection selectedCity={activeCity} onCityChange={handleSelectCity} />

        {/* 4. Weather Rerouting & Traveler Review Showcase */}
        <WeatherReroutingSection />

        {/* 5. Verified Curated Tours */}
        <FeaturedToursSection />

        {/* 6. Comparison Matrix with TripAdvisor, Klook, Google Maps */}
        <ComparisonMatrixSection />

        {/* 7. Partner Ecosystem Section */}
        <PartnerEcosystemSection />

        {/* 8. Mobile App Companion Showcase */}
        <MobileAppShowcaseSection />

        {/* 9. FAQ Section */}
        <FaqSection />

        {/* 10. Final Horizon CTA Section */}
        <FinalCtaSection />
      </main>

      {/* Comprehensive Footer */}
      <footer className="border-t border-slate-200 bg-white text-slate-600 px-4 py-12 sm:px-8">
        <ScrollReveal animation="fade-up">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-slate-200">
              {/* Col 1: Brand & Enterprise info */}
              <div className="md:col-span-2">
                <div className="flex items-center gap-2 text-[#00152a] font-black text-xl">
                  <span className="material-symbols-outlined text-2xl text-[#007d6e]">explore</span>
                  <span>TripMate Platform</span>
                </div>
                <p className="mt-3 text-xs sm:text-sm text-slate-500 leading-relaxed max-w-md">
                  Nền tảng công nghệ du lịch thông minh Miền Trung Việt Nam.
                  Kết nối du khách với mạng lưới trải nghiệm bản địa chuẩn xác, minh bạch với cơ chế ký quỹ Escrow an toàn.
                </p>
                <div className="mt-4 space-y-2 text-xs text-slate-500">
                  <p className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-[#007d6e]">support_agent</span>
                    <span>Tổng đài Chăm sóc Khách hàng: <strong className="text-slate-800">1900 8899</strong> | Email: <strong className="text-slate-800">hotro@tripmate.vn</strong></span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-[#007d6e]">verified</span>
                    <span>Giấy phép Lữ hành Quốc tế: <strong className="text-slate-700">48-0128/2026/SDL-GPLHQT</strong></span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-[#007d6e]">location_on</span>
                    <span>Trụ sở chính: Tòa nhà FPT Complex, Đường Nam Kỳ Khởi Nghĩa, Quận Ngũ Hành Sơn, TP. Đà Nẵng</span>
                  </p>
                </div>
              </div>

              {/* Col 2: Navigation Links */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 mb-3">Tính năng Nổi bật</h4>
                <ul className="space-y-2 text-xs">
                  <li><a href="#destinations" className="hover:text-[#007d6e] transition">Điểm đến Miền Trung</a></li>
                  <li><a href="#csp-simulator" className="hover:text-[#007d6e] transition">Lập lịch trình thông minh</a></li>
                  <li><a href="#weather-rerouting" className="hover:text-[#007d6e] transition">Cứu nguy thời tiết tức thì</a></li>
                  <li><Link href={ROUTES.tours} className="hover:text-[#007d6e] transition">Tour kiểm duyệt bản địa</Link></li>
                  <li><a href="#mobile-app" className="hover:text-[#007d6e] transition">Ứng dụng di động TripMate</a></li>
                  <li><a href="#faq" className="hover:text-[#007d6e] transition">Câu hỏi thường gặp</a></li>
                </ul>
              </div>

              {/* Col 3: Portal Links */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 mb-3">Cổng Dịch vụ &amp; Đối tác</h4>
                <ul className="space-y-2 text-xs">
                  <li><Link href={ROUTES.partner.register} className="hover:text-[#007d6e] transition">Đăng ký Đối tác Lữ hành</Link></li>
                  <li><Link href={ROUTES.partner.application} className="hover:text-[#007d6e] transition">Tra cứu Hồ sơ Đối tác</Link></li>
                  <li><Link href={ROUTES.admin.login} className="hover:text-[#007d6e] transition">Cổng Quản trị Viên (Admin Portal)</Link></li>
                  <li><Link href={ROUTES.signIn} className="hover:text-[#007d6e] transition">Đăng nhập Du khách</Link></li>
                  <li><a href="#terms" className="hover:text-[#007d6e] transition">Chính sách Bảo mật &amp; Escrow</a></li>
                </ul>
              </div>
            </div>

            {/* Bottom Copyright */}
            <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
              <p>© 2026 TripMate Technologies Vietnam. Tất cả các quyền được bảo lưu.</p>
              <div className="flex items-center gap-4">
                <span>Đà Nẵng • Hội An • Cố Đô Huế</span>
                <span className="inline-flex items-center gap-1.5 text-emerald-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Hệ thống vận hành ổn định
                </span>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </footer>

      {/* Floating Back to Top Button */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-[#007d6e] text-white shadow-xl hover:bg-[#006b5f] flex items-center justify-center transition-all duration-300 hover:scale-110 cursor-pointer animate-in fade-in zoom-in-75 border-2 border-white/40 btn-press"
          aria-label="Cuộn lên đầu trang"
        >
          <span className="material-symbols-outlined text-2xl">arrow_upward</span>
        </button>
      )}
    </div>
  );
}
