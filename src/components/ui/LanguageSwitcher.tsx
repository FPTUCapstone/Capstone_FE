'use client';

import React from 'react';
import { useI18n } from '@/i18n';
import type { Locale } from '@/i18n';

export interface LanguageSwitcherProps {
  variant?: 'compact' | 'segmented' | 'select' | 'dropdown';
  className?: string;
  showLabels?: boolean;
}

export function LanguageSwitcher({
  variant = 'compact',
  className = '',
  showLabels = false,
}: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useI18n();

  const handleSelect = (nextLocale: Locale) => {
    if (nextLocale !== locale) {
      setLocale(nextLocale);
    }
  };

  if (variant === 'segmented') {
    return (
      <div
        role="group"
        aria-label={t('common.language.title')}
        className={`inline-flex items-center rounded-xl border border-[#DCE2DD] bg-[#F7F5EF] p-1 ${className}`}
      >
        <button
          type="button"
          onClick={() => handleSelect('vi')}
          aria-pressed={locale === 'vi'}
          className={`flex min-h-[36px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
            locale === 'vi'
              ? 'bg-[#174B4A] text-white shadow-xs'
              : 'text-[#5B6E69] hover:text-[#1C2928]'
          }`}
        >
          <span className="text-[14px]">🇻🇳</span>
          <span>Tiếng Việt</span>
        </button>
        <button
          type="button"
          onClick={() => handleSelect('en')}
          aria-pressed={locale === 'en'}
          className={`flex min-h-[36px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
            locale === 'en'
              ? 'bg-[#174B4A] text-white shadow-xs'
              : 'text-[#5B6E69] hover:text-[#1C2928]'
          }`}
        >
          <span className="text-[14px]">🇬🇧</span>
          <span>English</span>
        </button>
      </div>
    );
  }

  if (variant === 'select') {
    return (
      <div className={`relative inline-block ${className}`}>
        <label htmlFor="language-select-input" className="sr-only">
          {t('common.language.selectLanguage')}
        </label>
        <select
          id="language-select-input"
          value={locale}
          onChange={(e) => handleSelect(e.target.value as Locale)}
          className="min-h-[40px] appearance-none rounded-xl border border-[#DCE2DD] bg-white py-2 pl-3 pr-8 text-xs font-semibold text-[#1C2928] hover:border-[#174B4A] focus:border-[#174B4A] focus:outline-none focus:ring-1 focus:ring-[#174B4A]"
        >
          <option value="vi">Tiếng Việt (Mặc định)</option>
          <option value="en">English</option>
        </select>
        <span
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#5B6E69]"
          aria-hidden="true"
        >
          ▼
        </span>
      </div>
    );
  }

  // Default 'compact' pill toggle
  return (
    <div
      role="group"
      aria-label={t('common.language.displayLanguage')}
      className={`inline-flex items-center rounded-lg border border-[#DCE2DD] bg-white/80 p-0.5 text-xs font-semibold text-[#1C2928] shadow-2xs backdrop-blur-xs transition hover:border-[#5B6E69] ${className}`}
    >
      <button
        type="button"
        onClick={() => handleSelect('vi')}
        aria-label="Chuyển sang Tiếng Việt"
        aria-pressed={locale === 'vi'}
        className={`rounded-md px-2 py-1 text-[11px] font-bold transition ${
          locale === 'vi'
            ? 'bg-[#174B4A] text-white'
            : 'text-[#5B6E69] hover:text-[#1C2928] hover:bg-[#F7F5EF]'
        }`}
      >
        VI
      </button>
      <span className="text-[#DCE2DD]" aria-hidden="true">
        |
      </span>
      <button
        type="button"
        onClick={() => handleSelect('en')}
        aria-label="Switch to English"
        aria-pressed={locale === 'en'}
        className={`rounded-md px-2 py-1 text-[11px] font-bold transition ${
          locale === 'en'
            ? 'bg-[#174B4A] text-white'
            : 'text-[#5B6E69] hover:text-[#1C2928] hover:bg-[#F7F5EF]'
        }`}
      >
        EN
      </button>
      {showLabels && (
        <span className="ml-1.5 text-[11px] text-[#5B6E69]">
          {locale === 'vi' ? 'Tiếng Việt' : 'English'}
        </span>
      )}
    </div>
  );
}
