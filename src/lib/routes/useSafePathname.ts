import * as nextNavigation from 'next/navigation';

/**
 * Resilient hook to obtain the current URL pathname in Next.js App Router.
 *
 * Calls native `usePathname()` when available.
 * If running in an isolated test environment where `next/navigation` was mocked
 * without the `usePathname` export, or outside router context, gracefully falls back
 * to `window.location.pathname` or `'/'` without throwing an uncaught exception.
 */
export function useSafePathname(): string {
  try {
    const nav = nextNavigation as Record<string, unknown>;
    if (typeof nav?.usePathname === 'function') {
      const p = (nav.usePathname as () => string | null)();
      if (typeof p === 'string') return p;
    }
  } catch {
    // Vitest mock proxy throws if usePathname was not defined in vi.mock('next/navigation')
  }

  if (typeof window !== 'undefined' && window.location?.pathname) {
    return window.location.pathname;
  }

  return '/';
}
