import { PasswordRecoveryFlow } from '@/components/auth/PasswordRecoveryFlow';
import BrandLogo from '@/components/BrandLogo';
import HeroPanel from '@/components/HeroPanel';

export function PublicPasswordRecoveryPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr] xl:grid-cols-[1.2fr_1fr]">
      <HeroPanel
        title={
          <>
            Khôi phục tài khoản{' '}
            <span className="text-brand-brightTeal">TripMate</span>
          </>
        }
        description="Nhận mã xác nhận qua email và tạo mật khẩu mới chỉ trong vài bước đơn giản."
      />

      <main className="relative flex items-center justify-center bg-brand-surface p-6 sm:p-10 lg:p-12 xl:p-16">
        <div
          aria-label="TripMate brand"
          className="absolute top-6 left-6 flex items-center space-x-2.5 lg:hidden"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-navy to-brand-navyContainer text-white shadow-md">
            <BrandLogo size={22} />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-brand-navy">
            TripMate
          </span>
        </div>

        <div className="w-full max-w-[480px] pt-20 lg:pt-0">
          <div className="rounded-3xl border border-slate-100 bg-brand-card p-8 shadow-card-lg sm:p-10">
            <PasswordRecoveryFlow />
          </div>

          <p className="mt-6 text-center text-[11px] leading-relaxed text-slate-400">
            Mã xác nhận chỉ có hiệu lực trong thời gian ngắn.
            <br />© 2026 TripMate — Hành trình của bạn, công nghệ của chúng tôi.
          </p>
        </div>
      </main>
    </div>
  );
}
