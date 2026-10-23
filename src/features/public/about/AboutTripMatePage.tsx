'use client';

import { useState, useEffect } from 'react';
import { PageTransition } from '@/components/navigation/PageTransition';
import { useSmoothScroll } from '@/components/providers/SmoothScrollProvider';
import { AboutHero } from './components/AboutHero';
import { CspSimulatorSection } from '@/features/public/landing/components/CspSimulatorSection';
import { WeatherReroutingSection } from '@/features/public/landing/components/WeatherReroutingSection';
import { MobileAppShowcaseSection } from '@/features/public/landing/components/MobileAppShowcaseSection';
import { PartnerEcosystemSection } from '@/features/public/landing/components/PartnerEcosystemSection';
import { FaqSection } from '@/features/public/landing/components/FaqSection';
import { AboutCtaSection } from './components/AboutCtaSection';
import { PublicFooter } from '@/features/public/landing/components/PublicFooter';

export function AboutTripMatePage() {
  return (
    <PageTransition>
      <AboutTripMateContent />
    </PageTransition>
  );
}

function AboutTripMateContent() {
  const { scrollTo } = useSmoothScroll();
  const [selectedCity, setSelectedCity] = useState<'danang' | 'hoian' | 'hue'>('danang');
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setShowScrollTop(window.scrollY > 400);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function scrollToTop() {
    scrollTo(0);
  }

  // Handle in-page hash anchor navigation on initial load
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const targetId = window.location.hash.replace('#', '');
      const element = document.getElementById(targetId);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#f4f7fc] text-[#0F1B2D] font-sans antialiased selection:bg-teal-100 selection:text-teal-900 relative overflow-x-clip">
      <main>
        {/* 1. About Hero with Story, Value Pillars & Anchor Nav */}
        <AboutHero />

        {/* 2. Smart Planning & Constraint Satisfaction Technology (#planning / #csp-simulator) */}
        <div id="planning" className="scroll-mt-20">
          <CspSimulatorSection
            selectedCity={selectedCity}
            onCityChange={(city) => setSelectedCity(city)}
          />
        </div>

        {/* 3. Weather Safety & Dynamic Rerouting (#weather / #weather-rerouting) */}
        <div id="weather" className="scroll-mt-20">
          <WeatherReroutingSection />
        </div>

        {/* 4. Mobile Experience & Offline Companion (#mobile / #mobile-app) */}
        <div id="mobile" className="scroll-mt-20">
          <MobileAppShowcaseSection />
        </div>

        {/* 5. Partner Ecosystem & Verified Operations (#partner / #partner-ecosystem) */}
        <div id="partner-ecosystem" className="scroll-mt-20">
          <PartnerEcosystemSection />
        </div>

        {/* 6. Comprehensive FAQ Accordion (#faq) */}
        <FaqSection />

        {/* 7. Final Action CTA */}
        <AboutCtaSection />
      </main>

      {/* Shared Public Footer */}
      <PublicFooter />

      {/* Floating Back to Top Button */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-[#007d6e] text-white shadow-xl hover:bg-[#006b5f] flex items-center justify-center transition-all duration-300 hover:scale-105 cursor-pointer animate-in fade-in zoom-in-75 border border-white/20"
          aria-label="Cuộn lên đầu trang"
        >
          <span className="material-symbols-outlined text-2xl">arrow_upward</span>
        </button>
      )}
    </div>
  );
}
