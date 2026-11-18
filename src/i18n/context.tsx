'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { Locale, Messages, TranslationParams, I18nContextValue } from './types';
import viMessages from '@/messages/vi.json';
import enMessages from '@/messages/en.json';

const COOKIE_NAME = 'tripmate_locale';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

const dictionaries: Record<Locale, Messages> = {
  vi: viMessages as Messages,
  en: enMessages as Messages,
};

function readCookieLocale(): Locale | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=(vi|en)`));
  return (match?.[1] as Locale) || null;
}

function readStorageLocale(): Locale | null {
  if (typeof window === 'undefined') return null;
  try {
    const val = localStorage.getItem(COOKIE_NAME);
    if (val === 'vi' || val === 'en') return val;
  } catch {
    // Storage access may be restricted
  }
  return null;
}

function writeCookieLocale(locale: Locale) {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_NAME}=${locale}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  try {
    localStorage.setItem(COOKIE_NAME, locale);
  } catch {
    // Storage access may be restricted
  }
}

function resolveNestedKey(obj: unknown, keyPath: string): string | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  const parts = keyPath.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    return key in params ? String(params[key]) : `{${key}}`;
  });
}

const I18nContext = createContext<I18nContextValue | null>(null);

export interface I18nProviderProps {
  children: React.ReactNode;
  initialLocale?: Locale;
}

export function I18nProvider({ children, initialLocale = 'vi' }: I18nProviderProps) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  // Sync client preference on initial mount
  useEffect(() => {
    const saved = readCookieLocale() || readStorageLocale();
    if (saved && saved !== locale) {
      queueMicrotask(() => {
        setLocaleState(saved);
      });
      document.documentElement.lang = saved;
    } else {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const setLocale = useCallback(
    (nextLocale: Locale) => {
      setLocaleState(nextLocale);
      writeCookieLocale(nextLocale);
      if (typeof document !== 'undefined') {
        document.documentElement.lang = nextLocale;
      }
      try {
        router.refresh();
      } catch {
        // Router might not be available in isolated tests
      }
    },
    [router]
  );

  const t = useCallback(
    (key: string, params?: TranslationParams): string => {
      const activeDictionary = dictionaries[locale] || dictionaries.vi;
      let text = resolveNestedKey(activeDictionary, key);
      if (!text && locale !== 'vi') {
        // Fallback to Vietnamese
        text = resolveNestedKey(dictionaries.vi, key);
      }
      if (!text) {
        return key;
      }
      return interpolate(text, params);
    },
    [locale]
  );

  const contextValue = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t,
      messages: dictionaries[locale] || dictionaries.vi,
      hasProvider: true,
    }),
    [locale, setLocale, t]
  );

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Provide a safe fallback for unmounted/standalone test contexts
    const fallbackT = (key: string, params?: TranslationParams) => {
      const text = resolveNestedKey(dictionaries.vi, key) || key;
      return interpolate(text, params);
    };
    return {
      locale: 'vi',
      setLocale: () => {},
      t: fallbackT,
      messages: dictionaries.vi,
      hasProvider: false,
    };
  }
  return ctx;
}

export function useTranslation() {
  const { t, locale, setLocale, messages } = useI18n();
  return { t, locale, setLocale, messages };
}
