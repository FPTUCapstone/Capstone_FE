'use client';

import { useState, useEffect } from 'react';
import { PageTransition } from '@/components/navigation/PageTransition';
import { useSmoothScroll } from '@/components/providers/SmoothScrollProvider';
import { LandingHero } from './components/LandingHero';
import { CentralVietnamShowcase } from './components/CentralVietnamShowcase';
import { HowItWorksPreviewSection } from './components/HowItWorksPreviewSection';
import { FeaturedToursSection } from './components/FeaturedToursSection';
import { FinalCtaSection } from './components/FinalCtaSection';
import { PublicFooter } from './components/PublicFooter';

export function LandingPage() {
  return (
    <PageTransition>
      <LandingContent />
    </PageTransition>
  );
}

function LandingContent() {
  const { scrollTo } = useSmoothScroll();
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
    scrollTo(0);
  }

  return (
    <div className="min-h-screen bg-[#f4f7fc] text-[#0F1B2D] font-sans antialiased selection:bg-teal-100 selection:text-teal-900 relative overflow-x-clip">
      <main>
        {/* 1. Calm Editorial Scenic Travel Hero */}
        <LandingHero
          activeCity={activeCity}
          onSelectCity={handleSelectCity}
        />

        {/* 2. Central Vietnam Destination Showcase */}
        <CentralVietnamShowcase activeCity={activeCity} onSelectCity={handleSelectCity} />

        {/* 3. Three-Step How It Works Guide */}
        <HowItWorksPreviewSection />

        {/* 4. Verified Curated Tours */}
        <FeaturedToursSection />

        {/* 5. Final Horizon CTA Section */}
        <FinalCtaSection />
      </main>

      {/* Shared Editorial Public Footer */}
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
