'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
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
  motionMode: 'full' | 'reduced';
  setMotionMode: (mode: 'full' | 'reduced') => void;
}

const SmoothScrollContext = createContext<SmoothScrollContextType>({
  lenis: null,
  scrollTo: () => {},
  motionMode: 'full',
  setMotionMode: () => {},
});

export function useSmoothScroll() {
  return useContext(SmoothScrollContext);
}

// Global store for Lenis instance to comply with React 19 rules without cascading renders
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

export function getEffectiveMotionPreference(): 'full' | 'reduced' {
  if (typeof window === 'undefined') return 'full';

  // 1. URL search parameter ?motion=full or ?motion=reduced (highest precedence for quick testing/sharing)
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const urlMotion = urlParams.get('motion');
    if (urlMotion === 'full' || urlMotion === 'reduced') {
      try {
        localStorage.setItem('tripmate_motion', urlMotion);
      } catch {}
      return urlMotion;
    }
  } catch {}

  // 2. LocalStorage setting explicitly chosen by user
  try {
    const stored = localStorage.getItem('tripmate_motion');
    if (stored === 'full' || stored === 'reduced') {
      return stored;
    }
  } catch {}

  // 3. Document dataset override (if set by application setting)
  if (document.documentElement?.dataset?.motion === 'full') return 'full';
  if (document.documentElement?.dataset?.motion === 'reduced') return 'reduced';

  // 4. Default: TripMate UI/UX default is FULL MOTION!
  // Both Lenis smooth scrolling with inertia and ScrollReveal item transitions are core brand experiences.
  // Full motion is the primary default experience across the entire website unless explicitly set to 'reduced'.
  return 'full';
}

interface SmoothScrollProviderProps {
  children: ReactNode;
}

export function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  const [motionMode, setMotionModeState] = useState<'full' | 'reduced'>(getEffectiveMotionPreference);
  const lenis = useSyncExternalStore(subscribeLenis, getLenisSnapshot, getServerSnapshot);
  const lenisRef = useRef<Lenis | null>(null);

  // Set motion preference helper exposed to context and window
  const setMotionMode = (mode: 'full' | 'reduced') => {
    try {
      localStorage.setItem('tripmate_motion', mode);
      window.dispatchEvent(new CustomEvent('tripmate_motion_change', { detail: mode }));
    } catch {}
    setMotionModeState(mode);
  };

  useEffect(() => {
    // Expose global console helper for developers and testers
    if (typeof window !== 'undefined') {
      (window as unknown as { __setTripMateMotion?: (mode: 'full' | 'reduced') => void }).__setTripMateMotion = setMotionMode;

      // Intercept direct localStorage.setItem calls in DevTools console to react immediately
      const originalSetItem = window.localStorage.setItem;
      window.localStorage.setItem = function (key: string, value: string) {
        originalSetItem.apply(this, [key, value]);
        if (key === 'tripmate_motion' && (value === 'full' || value === 'reduced')) {
          window.dispatchEvent(new CustomEvent('tripmate_motion_change', { detail: value }));
        }
      };
    }

    const handleMotionChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const newMode = (customEvent.detail === 'full' || customEvent.detail === 'reduced')
        ? customEvent.detail
        : getEffectiveMotionPreference();
      setMotionModeState(newMode);
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'tripmate_motion') {
        setMotionModeState(getEffectiveMotionPreference());
      }
    };

    const mediaQuery =
      typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;

    const handleMediaChange = () => {
      setMotionModeState(getEffectiveMotionPreference());
    };

    window.addEventListener('tripmate_motion_change', handleMotionChange);
    window.addEventListener('storage', handleStorage);
    mediaQuery?.addEventListener?.('change', handleMediaChange);

    return () => {
      window.removeEventListener('tripmate_motion_change', handleMotionChange);
      window.removeEventListener('storage', handleStorage);
      mediaQuery?.removeEventListener?.('change', handleMediaChange);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof ResizeObserver === 'undefined') {
      return;
    }

    if (typeof document !== 'undefined') {
      document.documentElement.dataset.motion = motionMode;
    }

    // Inform developer in DevTools console
    const osReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
    const isExplicitFull = typeof localStorage !== 'undefined' && localStorage.getItem('tripmate_motion') === 'full';
    console.log(
      `%c[TripMate Motion]%c Active: %c${motionMode.toUpperCase()}%c | OS prefers-reduced-motion: %c${osReduced}%c | User Opt-in: %c${isExplicitFull ? 'YES' : 'NO'}`,
      'color: #006B5F; font-weight: bold;',
      'color: inherit;',
      motionMode === 'full' ? 'color: #0E9F6E; font-weight: bold;' : 'color: #D97706; font-weight: bold;',
      'color: inherit;',
      osReduced ? 'color: #E02D4D; font-weight: bold;' : 'color: #0E9F6E; font-weight: bold;',
      'color: inherit;',
      isExplicitFull ? 'color: #0E9F6E; font-weight: bold;' : 'color: #64748B;'
    );

    // If reduced motion is requested, do not initialize Lenis
    if (motionMode === 'reduced') {
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
        globalLenis = null;
        delete (window as unknown as { __lenis?: Lenis }).__lenis;
        notifyLenisListeners();
      }
      return;
    }

    // Initialize Shared Global Lenis Instance
    const instance = new Lenis({
      duration: 1.05, // 1.05s continuous silky momentum deceleration
      easing: (t: number) => 1 - Math.pow(1 - t, 3), // continuous cubic ease-out
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.1, // natural comfortable wheel sensitivity
      touchMultiplier: 1.5,
      syncTouch: false, // Maintain native touch momentum on touchscreens
      infinite: false,
      autoResize: true,
      allowNestedScroll: true, // Native nested scrolling for operational tables, modals, dropdowns
      prevent: (node) => {
        // Protect nested scroll containers across Admin, Partner and Modals
        return (
          node.hasAttribute?.('data-lenis-prevent') ||
          !!node.closest?.('[data-lenis-prevent]') ||
          !!node.closest?.('[role="dialog"]') ||
          !!node.closest?.('.lenis-prevent') ||
          node.tagName === 'SELECT'
        );
      },
      respectReducedMotion: false, // Handled explicitly by motionMode above
    });

    lenisRef.current = instance;
    globalLenis = instance;
    (window as unknown as { __lenis?: Lenis }).__lenis = instance;
    notifyLenisListeners();

    // Reset scroll registers to top on fresh mount/reload if no hash target is present
    if (!window.location.hash) {
      instance.scrollTo(0, { immediate: true });
    }

    // Centralized RequestAnimationFrame loop
    let rafId: number;
    function onRaf(time: number) {
      instance.raf(time);
      rafId = requestAnimationFrame(onRaf);
    }
    rafId = requestAnimationFrame(onRaf);

    // Intercept anchor link navigation (#destinations, #csp-simulator)
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

    // Modal Scroll Lock Observer: pause Lenis when modal sets overflow: hidden on body, resume when unlocked
    let bodyObserver: MutationObserver | null = null;
    if (typeof MutationObserver !== 'undefined') {
      const checkAndSyncScrollLock = () => {
        if (!instance) return;
        const bodyOverflow = document.body?.style.overflow;
        const htmlOverflow = document.documentElement?.style.overflow;
        const isLocked =
          bodyOverflow === 'hidden' ||
          bodyOverflow === 'clip' ||
          htmlOverflow === 'hidden' ||
          htmlOverflow === 'clip' ||
          document.body?.classList.contains('overflow-hidden') ||
          document.documentElement?.classList.contains('overflow-hidden');

        if (isLocked) {
          if (!instance.isStopped) {
            instance.stop();
          }
        } else {
          if (instance.isStopped) {
            instance.start();
          }
        }
      };

      bodyObserver = new MutationObserver(checkAndSyncScrollLock);
      if (document.body) {
        bodyObserver.observe(document.body, { attributes: true, attributeFilter: ['style', 'class'] });
      }
      if (document.documentElement) {
        bodyObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'class'] });
      }

      checkAndSyncScrollLock();
    }

    return () => {
      bodyObserver?.disconnect();
      document.removeEventListener('click', handleAnchorClick);
      cancelAnimationFrame(rafId);
      instance.destroy();
      lenisRef.current = null;
      globalLenis = null;
      delete (window as unknown as { __lenis?: Lenis }).__lenis;
      notifyLenisListeners();
    };
  }, [motionMode]);

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
        motionMode,
        setMotionMode,
      }}
    >
      {children}
    </SmoothScrollContext.Provider>
  );
}
