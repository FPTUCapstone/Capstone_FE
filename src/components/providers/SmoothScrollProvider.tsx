'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import Lenis from 'lenis';

interface SmoothScrollContextType {
  lenis: Lenis | null;
  scrollTo: (
    target: string | number | HTMLElement,
    options?: { offset?: number; duration?: number; immediate?: boolean }
  ) => void;
}

const SmoothScrollContext = createContext<SmoothScrollContextType>({
  lenis: null,
  scrollTo: () => {},
});

export function useSmoothScroll() {
  return useContext(SmoothScrollContext);
}

// External store for Lenis instance to comply with React 19 rules without cascading renders
let globalLenis: Lenis | null = null;
const listeners = new Set<() => void>();

function notifyLenisListeners() {
  listeners.forEach((listener) => listener());
}

function subscribeLenis(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getLenisSnapshot() {
  return globalLenis;
}

function getServerSnapshot() {
  return null;
}

interface SmoothScrollProviderProps {
  children: ReactNode;
}

export function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  const lenis = useSyncExternalStore(subscribeLenis, getLenisSnapshot, getServerSnapshot);
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // 1. Accessibility & Environment: Bypass if reduced motion is requested (unless force-motion is explicitly enabled)
    const prefersReduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)')?.matches;
    const forceMotion =
      typeof document !== 'undefined' &&
      (document.documentElement.dataset.forceMotion === 'true' ||
        document.documentElement.dataset.motion === 'enabled');

    if (
      typeof window === 'undefined' ||
      typeof ResizeObserver === 'undefined' ||
      (prefersReduced && !forceMotion)
    ) {
      return;
    }

    // 2. Instantiate scoped Lenis instance with luxurious editorial glide physics
    const instance = new Lenis({
      duration: 1.05, // 1.05s continuous silky momentum deceleration
      easing: (t: number) => 1 - Math.pow(1 - t, 3), // continuous cubic ease-out without discrete stepped stopping
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.1, // comfortable natural wheel sensitivity
      touchMultiplier: 1.5,
      syncTouch: false, // Maintain 100% native touch momentum on mobile touchscreens
      infinite: false,
      autoResize: true,
      respectReducedMotion: !forceMotion, // Allow smooth scroll momentum when forceMotion is active
    });

    lenisRef.current = instance;
    globalLenis = instance;
    if (typeof window !== 'undefined') {
      (window as unknown as { __lenis?: Lenis }).__lenis = instance;
    }
    notifyLenisListeners();

    // Reset Lenis scroll registers to top on fresh mount/reload if no anchor target hash is present
    if (typeof window !== 'undefined' && !window.location.hash) {
      instance.scrollTo(0, { immediate: true });
    }

    // 3. Single centralized RequestAnimationFrame loop
    let rafId: number;
    function onRaf(time: number) {
      instance.raf(time);
      rafId = requestAnimationFrame(onRaf);
    }
    rafId = requestAnimationFrame(onRaf);

    // 4. Intercept anchor link navigation (e.g. #destinations, #csp-simulator) for smooth gliding
    function handleAnchorClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;
      const href = target.getAttribute('href');
      if (href && href.startsWith('#') && href.length > 1) {
        const targetElement = document.querySelector(href);
        if (targetElement) {
          e.preventDefault();
          instance.scrollTo(targetElement as HTMLElement, { offset: -80, duration: 0.9 });
        }
      }
    }

    document.addEventListener('click', handleAnchorClick, { passive: false });

    // 5. Cleanup on unmount (navigation away or component destruction)
    return () => {
      document.removeEventListener('click', handleAnchorClick);
      cancelAnimationFrame(rafId);
      instance.destroy();
      lenisRef.current = null;
      globalLenis = null;
      if (typeof window !== 'undefined') {
        delete (window as unknown as { __lenis?: Lenis }).__lenis;
      }
      notifyLenisListeners();
    };
  }, []);

  function handleScrollTo(
    target: string | number | HTMLElement,
    options?: { offset?: number; duration?: number; immediate?: boolean }
  ) {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(target, options);
    } else if (typeof window !== 'undefined') {
      if (typeof target === 'string') {
        const el = document.querySelector(target);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else if (typeof target === 'number') {
        window.scrollTo({ top: target, behavior: 'smooth' });
      } else if (target instanceof HTMLElement) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  return (
    <SmoothScrollContext.Provider
      value={{
        lenis,
        scrollTo: handleScrollTo,
      }}
    >
      {children}
    </SmoothScrollContext.Provider>
  );
}
