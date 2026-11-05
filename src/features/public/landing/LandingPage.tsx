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
import { EditorialSectionNav } from './components/EditorialSectionNav';
import { EditorialJournalRail } from './components/EditorialJournalRail';

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
  const [activeSection, setActiveSection] = useState<string>('destinations');
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setShowScrollTop(window.scrollY > 400);

      const sectionIds = ['destinations', 'how-it-works', 'tours', 'final-cta'];
      const scrollPos = window.scrollY + 320;

      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const id = sectionIds[i];
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop;
          if (scrollPos >= top) {
            setActiveSection(id);
            break;
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function handleSelectCity(city: 'danang' | 'hoian' | 'hue') {
    setActiveCity(city);
  }

  function scrollToSection(id: string) {
    const el = document.getElementById(id);
    if (el) {
      if (scrollTo) {
        scrollTo(el, { offset: -80 });
      } else {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  function scrollToTop() {
    if (scrollTo) {
      scrollTo(0);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f7fc] text-[#0F1B2D] font-sans antialiased selection:bg-teal-100 selection:text-teal-900 relative overflow-x-clip">
      <main>
        {/* 1. Calm Editorial Scenic Travel Hero */}
        <LandingHero
          activeCity={activeCity}
          onSelectCity={handleSelectCity}
        />

        {/* 2. Editorial 3-Column Discovery Area (Bounded Rails) */}
        <div className="relative w-full max-w-[1880px] mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex items-start justify-center gap-3 xl:gap-4 2xl:gap-6">
            
            {/* Left Rail: Numbered Section Navigation */}
            <EditorialSectionNav
              activeSection={activeSection}
              onNavigate={scrollToSection}
            />

            {/* Center Column: Preserved Landing Sections */}
            <div className="flex-1 min-w-0 max-w-[1440px] space-y-0">
              <CentralVietnamShowcase activeCity={activeCity} onSelectCity={handleSelectCity} />

              <div id="how-it-works">
                <HowItWorksPreviewSection />
              </div>

              <FeaturedToursSection />
            </div>

            {/* Right Rail: Travel Journal Vignettes */}
            <EditorialJournalRail
              activeCity={activeCity}
              onSelectCity={handleSelectCity}
            />
          </div>
        </div>

        {/* 3. Final Horizon CTA Section (100% Edge-to-Edge Full-Bleed) */}
        <div id="final-cta" className="w-full">
          <FinalCtaSection />
        </div>
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
