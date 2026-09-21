import type { Metadata } from 'next';
import HeroPanel from '@/components/registration/HeroPanel';
import BrandLogo from '@/components/registration/BrandLogo';
import RegisterForm from '@/components/registration/RegisterForm';

export const metadata: Metadata = {
  title: 'Đăng ký Traveler | TripMate',
  description: 'Lên lịch trình thông minh & khám phá trọn vẹn chuyến đi',
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr] xl:grid-cols-[1.2fr_1fr] lg:items-start">
      {/* LEFT: HERO */}
      <HeroPanel />

      {/* RIGHT: FORM */}
      <main className="flex items-center justify-center p-6 sm:p-10 lg:p-12 xl:p-16 bg-brand-surface relative">
        {/* Mobile brand header (hidden on desktop) */}
        <div className="absolute top-6 left-6 lg:hidden flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-navy to-brand-navyContainer flex items-center justify-center shadow-md text-white">
            <BrandLogo size={22} />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-brand-navy">
            TripMate
          </span>
        </div>

        <div className="w-full max-w-[480px]">
          <RegisterForm />

          <p className="mt-6 text-center text-[11px] text-slate-400 leading-relaxed">
            Bằng việc đăng ký, bạn đã đồng ý với các điều khoản của TripMate.
            <br />© 2026 TripMate — Hành trình của bạn, công nghệ của chúng tôi.
          </p>
        </div>
      </main>
    </div>
  );
}
