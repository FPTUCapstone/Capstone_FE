'use client';

import { useEffect } from 'react';
import { useSafePathname } from '@/lib/routes/useSafePathname';
import { useSmoothScroll } from '@/components/providers/SmoothScrollProvider';

function safeScrollToTop(instant = true) {
  if (typeof window === 'undefined') return;

  if (typeof window.scrollTo === 'function') {
    // In JSDOM test environments without an explicit mock, bypass to keep test logs pristine
    if (
      typeof navigator !== 'undefined' &&
      navigator.userAgent.includes('jsdom') &&
      !('mock' in (window.scrollTo as unknown as Record<string, unknown>))
    ) {
      return;
    }

    try {
      if (instant) {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      } else {
        window.scrollTo(0, 0);
      }
    } catch {
      try {
        window.scrollTo(0, 0);
      } catch {
        // Safe fallback
      }
    }
  }
}

/**
 * ScrollResetHandler ensures that reloading any page or navigating to a new route
 * resets scroll position to the top (0, 0) instead of retaining the old scroll position.
 *
 * Mechanisms:
 * 1. Sets history.scrollRestoration = 'manual' to prevent browser from restoring past scroll offsets on reload.
 * 2. Listens to 'beforeunload' to reset scroll to (0, 0) before the browser snapshots scroll history.
 * 3. Immediately resets scroll to (0, 0) on mount / reload / route navigation if no specific anchor hash is targeted.
 * 4. Resets Lenis smooth scroll instance to (0, 0) immediately so inertia / animated scroll does not carry over across route transitions.
 */
export function ScrollResetHandler() {
  const pathname = useSafePathname();
  const { lenis } = useSmoothScroll();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Disable browser's automatic scroll restoration on reload
    if ('scrollRestoration' in window.history) {
      try {
        window.history.scrollRestoration = 'manual';
      } catch {
        // Safe catch for environments with restricted history manipulation
      }
    }

    // 2. Pre-emptively reset scroll on beforeunload so browser history snapshot records (0, 0)
    function handleBeforeUnload() {
      safeScrollToTop(false);
    }
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 3 & 4. Immediately ensure scroll is at the top on mount / reload / route change (if not targeting an anchor hash)
    if (!window.location.hash) {
      const activeLenis =
        lenis ??
        (typeof window !== 'undefined'
          ? (window as unknown as { __lenis?: { scrollTo: (t: number, o?: { immediate?: boolean }) => void } }).__lenis
          : undefined);

      if (activeLenis && typeof activeLenis.scrollTo === 'function') {
        activeLenis.scrollTo(0, { immediate: true });
      }
      safeScrollToTop(true);
    }
  }, [pathname, lenis]);

  return null;
}
