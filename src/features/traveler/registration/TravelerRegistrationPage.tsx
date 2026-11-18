'use client';

import BrandLogo from '@/components/registration/BrandLogo';
import HeroPanel from '@/components/registration/HeroPanel';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useI18n } from '@/i18n';
import { TravelerRegistrationForm } from './TravelerRegistrationForm';

export function TravelerRegistrationPage() {
  const { locale } = useI18n();
  const isVi = locale === 'vi';

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr] xl:grid-cols-[1.2fr_1fr] lg:items-start" lang={locale}>
      <HeroPanel />

      <main className="flex items-center justify-center p-6 sm:p-10 lg:p-12 xl:p-16 bg-brand-surface relative">
        {/* Top-right Language Switcher */}
        <div className="absolute top-6 right-6 z-10">
          <LanguageSwitcher variant="compact" />
        </div>

        <div className="absolute top-6 left-6 lg:hidden flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-navy to-brand-navyContainer flex items-center justify-center shadow-md text-white">
            <BrandLogo size={22} />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-brand-navy">
            TripMate
          </span>
        </div>

        <div className="w-full max-w-[480px] pt-16 sm:pt-20 lg:pt-0">
          <TravelerRegistrationForm />

          <p className="mt-6 text-center text-[11px] text-slate-400 leading-relaxed">
            {isVi
              ? 'Bằng việc đăng ký, bạn đã đồng ý với các điều khoản của TripMate.'
              : "By registering, you agree to TripMate's terms of service."}
            <br />
            {isVi
              ? '© 2026 TripMate — Hành trình của bạn, công nghệ của chúng tôi.'
              : '© 2026 TripMate — Your journey, our technology.'}
          </p>
        </div>
      </main>
    </div>
  );
}
