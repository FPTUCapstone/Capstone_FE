'use client';

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type ProviderLocale = 'vi' | 'en';

interface ProviderLocaleContextValue {
  locale: ProviderLocale;
  setLocale: (next: ProviderLocale) => void;
}

const STORAGE_KEY = 'tripmate_provider_locale';

const ProviderLocaleContext = createContext<ProviderLocaleContextValue | null>(null);

function readStoredLocale(defaultLocale: ProviderLocale): ProviderLocale {
  if (typeof window === 'undefined') return defaultLocale;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === 'vi' || raw === 'en') return raw;
  } catch {
    // Storage may be unavailable in restricted contexts
  }
  return defaultLocale;
}

export function ProviderLocaleProvider({
  children,
  defaultLocale = 'vi',
}: {
  children: ReactNode;
  defaultLocale?: ProviderLocale;
}) {
  const [locale, setLocaleState] = useState<ProviderLocale>(() => readStoredLocale(defaultLocale));

  const setLocale = useCallback((next: ProviderLocale) => {
    setLocaleState(next);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Ignore storage write errors
      }
    }
  }, []);

  return (
    <ProviderLocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </ProviderLocaleContext.Provider>
  );
}

/**
 * Returns the active workspace locale when rendered inside ProviderWorkspaceShell,
 * or falls back cleanly to `fallbackLocale` for standalone component renders/tests.
 */
export function useProviderLocale(fallbackLocale: ProviderLocale = 'vi'): ProviderLocaleContextValue {
  const ctx = useContext(ProviderLocaleContext);
  if (ctx) return ctx;
  return {
    locale: fallbackLocale,
    setLocale: () => {},
  };
}
