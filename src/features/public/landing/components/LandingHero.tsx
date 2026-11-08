/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useLayoutEffect, useRef, useState, useCallback, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(SplitText);
}

/**
 * Hook to execute layout effects on client while avoiding SSR warnings.
 */
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

interface LandingHeroProps {
  activeCity?: 'danang' | 'hoian' | 'hue';
  onSelectCity?: (city: 'danang' | 'hoian' | 'hue') => void;
}

/**
 * Detects system reduced-motion preference via matchMedia.
 */
function getSystemReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/**
 * Detects network Save-Data constraint via NetworkInformation API.
 */
function getSystemSaveData(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nav = navigator as any;
    return nav.connection?.saveData === true;
  } catch {
    return false;
  }
}

/**
 * Subscribes to changes in prefers-reduced-motion media query.
 */
function subscribeReducedMotion(callback: () => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  try {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', callback);
      return () => mediaQuery.removeEventListener('change', callback);
    } else if (typeof (mediaQuery as unknown as { addListener: (cb: () => void) => void }).addListener === 'function') {
      (mediaQuery as unknown as { addListener: (cb: () => void) => void }).addListener(callback);
      return () => (mediaQuery as unknown as { removeListener: (cb: () => void) => void }).removeListener(callback);
    }
  } catch {
    // Graceful fallback
  }
  return () => {};
}

/**
 * Returns client snapshot of prefers-reduced-motion state.
 */
function getReducedMotionSnapshot(): boolean {
  return getSystemReducedMotion();
}

/**
 * Returns SSR snapshot of prefers-reduced-motion state.
 */
function getReducedMotionServerSnapshot(): boolean {
  return false;
}

/**
 * Subscribes to resize and media query changes for video eligibility.
 */
function subscribeVideoEligibility(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const cleanups: (() => void)[] = [];
  try {
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', callback);
        cleanups.push(() => mediaQuery.removeEventListener('change', callback));
      } else if (typeof (mediaQuery as unknown as { addListener: (cb: () => void) => void }).addListener === 'function') {
        (mediaQuery as unknown as { addListener: (cb: () => void) => void }).addListener(callback);
        cleanups.push(() => (mediaQuery as unknown as { removeListener: (cb: () => void) => void }).removeListener(callback));
      }
    }
  } catch {
    // Ignore matchMedia errors
  }

  window.addEventListener('resize', callback);
  cleanups.push(() => window.removeEventListener('resize', callback));

  return () => {
    cleanups.forEach((fn) => fn());
  };
}

/**
 * Returns client snapshot determining video eligibility.
 */
function getVideoEligibilitySnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  const reduced = getSystemReducedMotion();
  const saveData = getSystemSaveData();
  const isDesktopOrTablet = window.innerWidth >= 768;
  return !reduced && !saveData && isDesktopOrTablet;
}

/**
 * Returns SSR snapshot determining video eligibility.
 */
function getVideoEligibilityServerSnapshot(): boolean {
  return false;
}

/**
 * Modern Explorer Da Nang Homepage Hero — Cinematic Da Nang Travel Enhancement.
 *
 * Coordinated Enhancements:
 * A. Cinematic Masked Line Reveal for Headline via GSAP SplitText
 * B. Son Tra Cinematic Aerial Drone Video Background with instant-loading image poster fallback
 */
export function LandingHero({ activeCity = 'danang', onSelectCity }: LandingHeroProps) {
  // Preserve callback compatibility if needed by parent
  if (activeCity !== 'danang' && onSelectCity) {
    // Graceful no-op to maintain type and prop interface without unexpected state mutations
  }

  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const eyebrowRef = useRef<HTMLDivElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const ctaContainerRef = useRef<HTMLDivElement>(null);
  const trustContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );

  const isVideoEligible = useSyncExternalStore(
    subscribeVideoEligibility,
    getVideoEligibilitySnapshot,
    getVideoEligibilityServerSnapshot
  );

  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const userPausedRef = useRef(false);

  // 1. Playback Lifecycle: Handle Autoplay, Viewport Intersections & Document Visibility
  useEffect(() => {
    if (!isVideoEligible) return;

    const videoEl = videoRef.current;
    const sectionEl = sectionRef.current;
    if (!videoEl || !sectionEl) return;

    // Safe playback helpers
    const safePlay = () => {
      try {
        if (typeof videoEl.play === 'function') {
          const promise = videoEl.play();
          if (promise && typeof promise.then === 'function') {
            promise
              .then(() => setIsVideoPlaying(true))
              .catch(() => {
                // Graceful autoplay policy fallback; retains poster silently
                setIsVideoPlaying(false);
              });
          } else {
            setIsVideoPlaying(true);
          }
        }
      } catch {
        setIsVideoPlaying(false);
      }
    };

    const safePause = () => {
      try {
        if (typeof videoEl.pause === 'function') {
          videoEl.pause();
        }
      } catch {}
      setIsVideoPlaying(false);
    };

    // Safely check IntersectionObserver availability
    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (!entry) return;

          if (entry.isIntersecting && entry.intersectionRatio >= 0.15) {
            if (!userPausedRef.current && document.visibilityState === 'visible') {
              safePlay();
            }
          } else {
            safePause();
          }
        },
        { threshold: [0, 0.15, 0.5] }
      );

      observer.observe(sectionEl);
    }

    // Document visibility change handler
    const handleVisibilityChange = () => {
      if (document.hidden) {
        safePause();
      } else {
        if (!userPausedRef.current) {
          safePlay();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (observer) {
        observer.disconnect();
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      setIsVideoPlaying(false);
      setIsVideoReady(false);
    };
  }, [isVideoEligible]);

  // Accessible User Playback Toggle
  const togglePlayback = useCallback(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (isVideoPlaying) {
      try {
        videoEl.pause();
      } catch {}
      userPausedRef.current = true;
      setIsVideoPlaying(false);
    } else {
      userPausedRef.current = false;
      try {
        const promise = videoEl.play();
        if (promise && typeof promise.then === 'function') {
          promise
            .then(() => setIsVideoPlaying(true))
            .catch(() => {});
        } else {
          setIsVideoPlaying(true);
        }
      } catch {}
    }
  }, [isVideoPlaying]);

  // 3. Cinematic Editorial Masked Line Reveal & Entrance Choreography
  useIsomorphicLayoutEffect(() => {
    if (isReducedMotion) return;

    const headlineEl = headlineRef.current;
    const eyebrowEl = eyebrowRef.current;
    const descEl = descRef.current;
    const ctaEl = ctaContainerRef.current;
    const trustEl = trustContainerRef.current;
    const containerEl = sectionRef.current;

    if (!headlineEl || !containerEl) return;

    let hasEntranceFinished = false;

    // Use gsap.context for scoped, leak-free animation cleanup
    const ctx = gsap.context(() => {
      try {
        new SplitText(headlineEl, {
          type: 'lines',
          mask: 'lines',
          linesClass: 'editorial-split-line',
          autoSplit: true,
          onSplit: (instance) => {
            if (!hasEntranceFinished) {
              // During initial entrance, return timeline animation with 0.35s delay
              return gsap.from(instance.lines, {
                y: 24,
                opacity: 0,
                duration: 0.75,
                stagger: 0.13,
                ease: 'power3.out',
                delay: 0.35,
              });
            } else {
              // After initial entrance, keep lines rendered in their settled state upon reflow
              gsap.set(instance.lines, { y: 0, opacity: 1 });
            }
          },
        });

        const tl = gsap.timeline({
          onComplete: () => {
            hasEntranceFinished = true;
          },
        });

        // Stage 1: Eyebrow subtle upward entrance (0.05 - 0.55s)
        if (eyebrowEl) {
          tl.fromTo(
            eyebrowEl,
            { y: 12, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' },
            0.05
          );
        }

        // Stage 3: Supporting description soft fade-in (0.95 - 1.45s)
        if (descEl) {
          tl.fromTo(
            descEl,
            { y: 14, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' },
            0.95
          );
        }

        // Stage 4: CTA buttons coordinated reveal (1.1 - 1.6s)
        if (ctaEl && ctaEl.children.length > 0) {
          tl.fromTo(
            ctaEl.children,
            { y: 12, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.45, stagger: 0.1, ease: 'power2.out' },
            1.1
          );
        }

        // Stage 5: Trust indicators gentle fade (1.25 - 1.75s)
        if (trustEl) {
          tl.fromTo(
            trustEl,
            { y: 10, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.45, ease: 'power2.out' },
            1.25
          );
        }
      } catch {
        // Fallback: If SplitText or GSAP encounter an issue, guarantee full visibility
        gsap.set([headlineEl, eyebrowEl, descEl, ctaEl, trustEl], { opacity: 1, y: 0 });
      }
    }, containerEl);

    return () => {
      ctx.revert();
    };
  }, [isReducedMotion]);

  return (
    <section
      ref={sectionRef}
      aria-label="Đà Nẵng — Nơi hành trình bắt đầu"
      className="relative w-full overflow-hidden min-h-[580px] sm:min-h-[660px] lg:h-[780px] xl:h-[840px] flex items-center bg-[#F8F6F1]"
    >
      {/* Layer 0 (z-0): Full-Bleed Edge-to-Edge Static Da Nang Poster (Instant LCP & Fallback) */}
      <div className="absolute inset-0 z-0">
        <img
          data-testid="hero-poster"
          src="/images/landing/hero-danang-sontra.jpg"
          alt="Toàn cảnh bán đảo Sơn Trà và vịnh biển Đà Nẵng dưới ánh nắng sớm"
          className="h-full w-full object-cover object-[70%_center] sm:object-[68%_center] lg:object-[center_55%] transition-transform duration-1000 ease-out will-change-transform"
          loading="eager"
          fetchPriority="high"
        />
      </div>

      {/* Layer 1 (z-5): Cinematic Son Tra Background Video (Lazy mounted & progressive transition) */}
      {isVideoEligible && (
        <div className="absolute inset-0 z-5 overflow-hidden pointer-events-none" aria-hidden="true">
          <video
            ref={videoRef}
            data-testid="hero-video"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onCanPlay={() => setIsVideoReady(true)}
            onPlaying={() => {
              setIsVideoReady(true);
              setIsVideoPlaying(true);
            }}
            className={`h-full w-full object-cover object-[70%_center] sm:object-[68%_center] lg:object-[center_55%] transition-opacity duration-700 ease-out ${
              isVideoReady && isVideoPlaying ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <source src="/videos/landing/hero-danang-sontra.webm" type="video/webm" />
            <source src="/videos/landing/hero-danang-sontra.mp4" type="video/mp4" />
          </video>
        </div>
      )}

      {/* Layer 2 (z-10): Ultra-Delicate, Natural Scrim (Not milky, crisp image preservation) */}
      {/* Desktop: Gentle soft light gradient on the left 42% only, fading completely into vivid natural scenery */}
      <div
        className="absolute inset-0 z-10 hidden md:block bg-gradient-to-r from-white/75 via-white/35 via-38% to-transparent pointer-events-none"
        aria-hidden="true"
      />
      {/* Mobile: Soft light top-left gradient maintaining legibility without clouding the landscape */}
      <div
        className="absolute inset-0 z-10 md:hidden bg-gradient-to-b from-white/85 via-white/50 via-55% to-transparent pointer-events-none"
        aria-hidden="true"
      />
      {/* Subtle bottom grounding gradient */}
      <div
        className="absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-t from-black/15 to-transparent pointer-events-none"
        aria-hidden="true"
      />

      {/* Layer 3 (z-20): Editorial Content Layer Directly Over Image/Video */}
      <div className="relative z-20 mx-auto w-full max-w-[1680px] px-5 sm:px-12 md:px-16 lg:px-20 xl:px-24 py-12 sm:py-16 lg:py-24">
        <div className="max-w-xl lg:max-w-2xl xl:max-w-3xl">
          {/* Eyebrow Label */}
          <div
            ref={eyebrowRef}
            className="inline-flex items-center gap-2 self-start rounded-full bg-white/90 backdrop-blur-md px-3.5 py-1.5 border border-white/80 shadow-xs"
          >
            <span className="h-2 w-2 rounded-full bg-[#007D6E] animate-pulse" aria-hidden="true" />
            <span className="font-[family-name:var(--font-manrope)] text-[11px] sm:text-xs font-bold uppercase tracking-[0.16em] text-[#006B5F]">
              TripMate · Khám phá miền Trung
            </span>
          </div>

          {/* Display Headline — Bricolage Grotesque with Cinematic Masked Line Reveal */}
          <h1
            ref={headlineRef}
            className="mt-4 sm:mt-6 font-[family-name:var(--font-bricolage)] text-[32px] sm:text-5xl md:text-[56px] lg:text-[66px] xl:text-[74px] font-extrabold tracking-[-0.035em] leading-[1.12] sm:leading-[1.08] text-[#00152A] drop-shadow-[0_1px_2px_rgba(255,255,255,0.6)]"
          >
            Đà Nẵng, nơi <br />
            hành trình bắt đầu.
          </h1>

          {/* Supporting Description — Manrope */}
          <p
            ref={descRef}
            className="mt-4 sm:mt-6 font-[family-name:var(--font-manrope)] text-sm sm:text-lg md:text-xl font-medium leading-[1.6] text-slate-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)] max-w-xl"
          >
            Khám phá những điểm đến đáng nhớ, trải nghiệm tour bản địa và lên lịch trình phù hợp với chuyến đi của bạn.
          </p>

          {/* Two Prominent Contrasting CTA Buttons */}
          <div
            ref={ctaContainerRef}
            className="mt-6 sm:mt-9 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4"
          >
            {/* Primary CTA: Solid TripMate Teal with arrow */}
            <Link
              href={ROUTES.plan}
              className="group inline-flex min-h-[48px] sm:min-h-[54px] items-center justify-center gap-2.5 rounded-xl bg-[#007D6E] px-7 sm:px-8 py-3.5 text-sm sm:text-base font-bold text-white shadow-lg shadow-[#007D6E]/30 hover:bg-[#006B5F] hover:shadow-xl hover:shadow-[#007D6E]/40 transition-all duration-200 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
            >
              <span>Lập lịch trình</span>
              <span
                className="material-symbols-outlined text-lg transition-transform duration-200 group-hover:translate-x-1"
                aria-hidden="true"
              >
                arrow_forward
              </span>
            </Link>

            {/* Secondary CTA: Clean Dark Navy Button */}
            <Link
              href={ROUTES.tours}
              className="inline-flex min-h-[48px] sm:min-h-[54px] items-center justify-center gap-2 rounded-xl bg-white/90 hover:bg-[#00152A] text-[#00152A] hover:text-white border border-white/80 px-7 sm:px-8 py-3.5 text-sm sm:text-base font-bold backdrop-blur-md shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
            >
              <span>Khám phá tour</span>
              <span className="material-symbols-outlined text-lg opacity-70" aria-hidden="true">
                explore
              </span>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div
            ref={trustContainerRef}
            className="mt-7 sm:mt-10 pt-4 flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-semibold text-slate-800 border-t border-slate-900/15 max-w-lg"
          >
            <div className="inline-flex items-center gap-1.5 rounded-md bg-white/60 px-2 py-1 backdrop-blur-xs">
              <span className="material-symbols-outlined text-base text-[#007D6E]" aria-hidden="true">
                verified
              </span>
              <span>Tour xác thực bản địa</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-md bg-white/60 px-2 py-1 backdrop-blur-xs">
              <span className="material-symbols-outlined text-base text-[#007D6E]" aria-hidden="true">
                map
              </span>
              <span>Lịch trình tối ưu thời gian</span>
            </div>
          </div>
        </div>
      </div>

      {/* Layer 4: Location Badge & Accessible Video Playback Controls on Bottom Right */}
      <div className="hidden md:flex absolute bottom-6 right-8 z-20 items-center gap-3">
        {isVideoEligible && (
          <button
            type="button"
            data-testid="hero-playback-toggle"
            onClick={togglePlayback}
            aria-label={isVideoPlaying ? 'Tạm dừng video nền' : 'Phát video nền'}
            className="group inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/85 hover:bg-white text-slate-800 hover:text-[#007D6E] backdrop-blur-md border border-white/80 shadow-md transition-all duration-200 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#007D6E] focus-visible:ring-offset-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg" aria-hidden="true">
              {isVideoPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>
        )}

        <div className="flex items-center gap-2 rounded-full bg-white/85 backdrop-blur-md px-4 py-2 text-[11px] sm:text-xs font-semibold text-slate-800 border border-white/80 shadow-md">
          <span className="material-symbols-outlined text-sm text-[#007D6E]" aria-hidden="true">
            location_on
          </span>
          <span>Bán đảo Sơn Trà & Chùa Linh Ứng · Đà Nẵng</span>
        </div>
      </div>
    </section>
  );
}
