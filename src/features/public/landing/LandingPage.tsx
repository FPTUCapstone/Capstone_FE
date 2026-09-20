'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

import { PublicNavigation } from '@/components/navigation/PublicNavigation';
import { ROUTES } from '@/lib/routes';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { CentralVietnamShowcase } from './components/CentralVietnamShowcase';
import { CspSimulatorSection } from './components/CspSimulatorSection';
import { WeatherReroutingSection } from './components/WeatherReroutingSection';
import { FeaturedToursSection } from './components/FeaturedToursSection';
import { ComparisonMatrixSection } from './components/ComparisonMatrixSection';
import { PartnerEcosystemSection } from './components/PartnerEcosystemSection';
import { MobileAppShowcaseSection } from './components/MobileAppShowcaseSection';
import { FaqSection } from './components/FaqSection';

export function LandingPage() {
  const [heroCity, setHeroCity] = useState<'danang' | 'hoian' | 'hue'>('danang');
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setShowScrollTop(window.scrollY > 400);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function handleSelectAndScroll(city: 'danang' | 'hoian' | 'hue') {
    setHeroCity(city);
    window.dispatchEvent(new CustomEvent('tripmate:select-city', { detail: city }));
    const target = document.getElementById('csp-simulator');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="min-h-screen bg-[#f4f7fc] text-[#0F1B2D] font-sans antialiased selection:bg-teal-100 selection:text-teal-900 relative">
      {/* Public Header Navigation */}
      <PublicNavigation />

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-slate-200 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(0,125,110,0.12),rgba(255,255,255,0))] px-4 py-16 sm:px-8 md:py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(420px,0.85fr)]">
            
            {/* Left Hero Content */}
            <div className="relative z-10 max-w-2xl">
              {/* Pill Badge */}
              <ScrollReveal animation="fade-down" delay={50}>
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#9edbd2] bg-white/90 px-3.5 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-[#007d6e] shadow-xs backdrop-blur-md">
                  <span className="material-symbols-outlined text-base" aria-hidden="true">explore</span>
                  <span>Central Vietnam Smart Travel • Da Nang - Hoi An - Hue</span>
                </div>
              </ScrollReveal>

              {/* Main Headline */}
              <ScrollReveal animation="fade-up" delay={150}>
                <h1 className="text-4xl font-black leading-[1.08] tracking-[-0.03em] text-[#00152a] sm:text-5xl md:text-6xl">
                  Khám phá Miền Trung với <span className="text-[#007d6e] inline-block">Lịch trình Tối ưu Thông minh.</span>
                </h1>
              </ScrollReveal>

              {/* Subtitle */}
              <ScrollReveal animation="fade-up" delay={250}>
                <p className="mt-6 text-base leading-relaxed text-slate-600 sm:text-lg">
                  Nền tảng du lịch thông minh hàng đầu Miền Trung Việt Nam tích hợp thuật toán tối ưu đa ràng buộc (CSP) 
                  và cơ chế phản ứng thời gian thực. Tự động thiết kế một ngày du lịch hoàn hảo theo sở thích, khung giờ mở cửa, 
                  đón hoàng hôn biển và hỗ trợ cứu nguy lộ trình khi thời tiết thay đổi.
                </p>
              </ScrollReveal>

              {/* Quick Search / Action Widget with Interactive City Buttons */}
              <ScrollReveal animation="fade-up" delay={350}>
                <div className="mt-8 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-md flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                  <div className="flex-1 flex flex-col gap-1.5 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span className="material-symbols-outlined text-sm text-[#007d6e]">location_on</span>
                      <span>Điểm đến trải nghiệm:</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setHeroCity('danang')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          heroCity === 'danang'
                            ? 'bg-[#007d6e] text-white shadow-xs'
                            : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        Đà Nẵng
                      </button>
                      <button
                        type="button"
                        onClick={() => setHeroCity('hoian')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          heroCity === 'hoian'
                            ? 'bg-[#d97706] text-white shadow-xs'
                            : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        Hội An
                      </button>
                      <button
                        type="button"
                        onClick={() => setHeroCity('hue')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          heroCity === 'hue'
                            ? 'bg-[#7c3aed] text-white shadow-xs'
                            : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        Huế
                      </button>
                    </div>
                  </div>

                  <div className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 hidden md:flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-slate-400 text-lg">schedule</span>
                    <div className="text-left min-w-0">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Khung giờ</p>
                      <p className="text-xs font-bold text-slate-800">1 Ngày Trọn Vẹn</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectAndScroll(heroCity)}
                    className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#007d6e] px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-700/25 hover:bg-[#006b5f] transition-all cursor-pointer active:scale-95"
                  >
                    <span>Khám phá {heroCity === 'danang' ? 'Đà Nẵng' : heroCity === 'hoian' ? 'Hội An' : 'Huế'}</span>
                    <span className="material-symbols-outlined text-base">bolt</span>
                  </button>
                </div>
              </ScrollReveal>

              {/* Secondary Buttons & Highlights */}
              <ScrollReveal animation="fade-up" delay={450}>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Link
                    href={ROUTES.pois}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-50 border border-teal-200 px-5 py-2 text-xs font-bold text-[#007d6e] shadow-xs hover:bg-teal-100 transition"
                  >
                    <span className="material-symbols-outlined text-base text-[#007d6e]">explore</span>
                    <span>Khám phá Điểm đến</span>
                  </Link>
                  <a
                    href="#tours"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 px-5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition"
                  >
                    <span className="material-symbols-outlined text-base text-[#007d6e]">storefront</span>
                    <span>Khám phá Tour bản địa</span>
                  </a>
                  <a
                    href="#weather-rerouting"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 px-5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition"
                  >
                    <span className="material-symbols-outlined text-base text-sky-600">thunderstorm</span>
                    <span>Cứu nguy Thời tiết Thông minh</span>
                  </a>
                </div>
              </ScrollReveal>

              {/* Web & Mobile Platform Note */}
              <ScrollReveal animation="fade-up" delay={550}>
                <div className="mt-8 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 p-3.5 text-xs leading-relaxed text-slate-600 backdrop-blur-xs">
                  <span className="material-symbols-outlined text-xl text-[#007d6e] shrink-0" aria-hidden="true">devices</span>
                  <p>
                    <strong>Đồng bộ Đa Nền tảng:</strong> Lập kế hoạch và đặt tour tiện lợi trên Web; 
                    dẫn đường GPS, bản đồ ngoại tuyến và vé QR điện tử đồng hành trên ứng dụng Mobile.
                  </p>
                </div>
              </ScrollReveal>
            </div>

            {/* Right Hero Bento Card (Glassmorphic Visual with Clickable Cities) */}
            <ScrollReveal animation="zoom-in" delay={200} duration={850}>
              <div className="relative min-h-[480px] overflow-hidden rounded-[2.5rem] bg-[#00283a] p-6 text-white shadow-[0_28px_70px_rgba(0,40,58,0.3)] sm:p-8 flex flex-col justify-between border border-white/10 card-hover-lift">
                {/* Decorative Ambient Shapes */}
                <div className="absolute -right-24 -top-16 h-80 w-80 rounded-full border border-[#71f8e4]/30 pointer-events-none animate-float-gentle" />
                <div className="absolute -right-2 top-20 h-80 w-80 rounded-full border border-white/15 pointer-events-none" />
                <svg className="absolute inset-0 h-full w-full opacity-25 pointer-events-none" viewBox="0 0 520 440" fill="none" aria-hidden="true">
                  <path d="M78 405C101 330 171 314 194 247C218 177 174 126 223 64C250 30 303 29 347 42" stroke="#71F8E4" strokeWidth="4" strokeLinecap="round" strokeDasharray="8 12" />
                  <circle cx="80" cy="401" r="8" fill="#EB5B49" />
                  <circle cx="194" cy="247" r="8" fill="#71F8E4" />
                  <circle cx="347" cy="42" r="8" fill="#71F8E4" />
                </svg>

                {/* Top Status */}
                <div className="relative z-10 flex items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#71f8e4]">Trung tâm Giám sát Hành trình Trực tuyến</p>
                    <h3 className="mt-1 text-xl font-black">Miền Trung: Đà Nẵng • Hội An • Cố Đô Huế</h3>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-400/20 text-teal-300 text-xs font-bold border border-teal-400/30 animate-pulse-subtle">
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                    <span>Trực tuyến 24/7</span>
                  </div>
                </div>

                {/* Destination Bento List */}
                <div className="relative z-10 space-y-2.5 my-4">
                  {/* Da Nang Item */}
                  <div
                    onClick={() => handleSelectAndScroll('danang')}
                    className="flex items-center justify-between p-3.5 rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md hover:bg-white/20 hover:border-teal-400/50 transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined rounded-xl bg-white/10 p-2 text-[#71f8e4] group-hover:scale-110 transition-transform">waves</span>
                      <div>
                        <h4 className="font-extrabold text-sm flex items-center gap-1.5">
                          <span>Đà Nẵng (Da Nang)</span>
                          <span className="material-symbols-outlined text-xs text-teal-300 opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                        </h4>
                        <p className="text-[11px] text-[#d1e4ff]">Biển Mỹ Khê, Bán đảo Sơn Trà &amp; Cầu Rồng</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-teal-300 bg-teal-500/20 px-2 py-0.5 rounded-md">48 POIs</span>
                  </div>

                  {/* Hoi An Item */}
                  <div
                    onClick={() => handleSelectAndScroll('hoian')}
                    className="flex items-center justify-between p-3.5 rounded-2xl border border-[#eb5b49] bg-[#eb5b49]/20 backdrop-blur-md hover:bg-[#eb5b49]/30 transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined rounded-xl bg-white/10 p-2 text-amber-300 group-hover:scale-110 transition-transform">festival</span>
                      <div>
                        <h4 className="font-extrabold text-sm flex items-center gap-1.5">
                          <span>Hội An (Hoi An)</span>
                          <span className="material-symbols-outlined text-xs text-amber-300 opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                        </h4>
                        <p className="text-[11px] text-[#d1e4ff]">Phố cổ đèn lồng, Chùa Cầu &amp; Rừng dừa Bảy Mẫu</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-md">36 POIs</span>
                  </div>

                  {/* Hue Item */}
                  <div
                    onClick={() => handleSelectAndScroll('hue')}
                    className="flex items-center justify-between p-3.5 rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md hover:bg-white/20 hover:border-purple-400/50 transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined rounded-xl bg-white/10 p-2 text-purple-300 group-hover:scale-110 transition-transform">account_balance</span>
                      <div>
                        <h4 className="font-extrabold text-sm flex items-center gap-1.5">
                          <span>Cố Đô Huế (Hue)</span>
                          <span className="material-symbols-outlined text-xs text-purple-300 opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                        </h4>
                        <p className="text-[11px] text-[#d1e4ff]">Đại Nội Hoàng thành, Lăng tẩm &amp; Sông Hương</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-md">42 POIs</span>
                  </div>
                </div>

                {/* Bottom Metric Highlight */}
                <div className="relative z-10 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-teal-300">speed</span>
                    <span>Tối ưu Lịch trình: <strong>&lt; 3.0 giây</strong></span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-teal-300">shield</span>
                    <span>Bảo chứng: <strong>100% Escrow</strong></span>
                  </span>
                </div>
              </div>
            </ScrollReveal>

          </div>
        </section>

        {/* Stats Bar */}
        <section className="bg-white border-b border-slate-200 py-8 px-4 sm:px-8">
          <div className="mx-auto max-w-7xl grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <ScrollReveal animation="fade-up" delay={0} className="p-4">
              <p className="text-3xl sm:text-4xl font-black text-[#00152a]">126+</p>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Điểm đến đã chuẩn hóa GIS</p>
            </ScrollReveal>
            <ScrollReveal animation="fade-up" delay={100} className="p-4">
              <p className="text-3xl sm:text-4xl font-black text-[#007d6e]">50+</p>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Tour Operator Đã Kiểm Duyệt</p>
            </ScrollReveal>
            <ScrollReveal animation="fade-up" delay={200} className="p-4">
              <p className="text-3xl sm:text-4xl font-black text-[#00152a]">&lt; 3s</p>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Phản hồi Cứu nguy Thời tiết Tức thì</p>
            </ScrollReveal>
            <ScrollReveal animation="fade-up" delay={300} className="p-4">
              <p className="text-3xl sm:text-4xl font-black text-[#007d6e]">98%</p>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Độ Khả thi Lịch trình Thực tế</p>
            </ScrollReveal>
          </div>
        </section>

        {/* 1. Central Vietnam Destination Showcase */}
        <CentralVietnamShowcase />

        {/* 2. Interactive CSP Simulator Section */}
        <CspSimulatorSection />

        {/* 3. Weather Rerouting & FSM Showcase */}
        <WeatherReroutingSection />

        {/* 4. Verified Curated Tours */}
        <FeaturedToursSection />

        {/* 5. Comparison Matrix with TripAdvisor, Klook, Google Maps */}
        <ComparisonMatrixSection />

        {/* 6. Partner Ecosystem Section */}
        <PartnerEcosystemSection />

        {/* 7. Mobile App Companion Showcase */}
        <MobileAppShowcaseSection />

        {/* 8. FAQ Section */}
        <FaqSection />

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
                  Nền tảng công nghệ du lịch thông minh hàng đầu Miền Trung Việt Nam. 
                  Kết nối du khách với mạng lưới trải nghiệm bản địa chuẩn xác, minh bạch với cơ chế ký quỹ Escrow an toàn tuyệt đối.
                </p>
                <div className="mt-4 space-y-2 text-xs text-slate-500">
                  <p className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-[#007d6e]">support_agent</span>
                    <span>Tổng đài Chăm sóc Khách hàng 24/7: <strong className="text-slate-800">1900 8899</strong> | Email: <strong className="text-slate-800">hotro@tripmate.vn</strong></span>
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
                  <li><a href="#tours" className="hover:text-[#007d6e] transition">Tour kiểm duyệt bản địa</a></li>
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
          className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-[#007d6e] text-white shadow-xl hover:bg-[#006b5f] flex items-center justify-center transition-all duration-300 hover:scale-110 cursor-pointer animate-in fade-in zoom-in-75 border-2 border-white/40"
          aria-label="Cuộn lên đầu trang"
        >
          <span className="material-symbols-outlined text-2xl">arrow_upward</span>
        </button>
      )}
    </div>
  );
}
