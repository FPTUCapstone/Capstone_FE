import Link from 'next/link';

import { PasswordRecoveryFlow } from '@/components/auth/PasswordRecoveryFlow';
import BrandLogo from '@/components/brand/BrandIcon';
import { ROUTES } from '@/lib/routes';

export function AdminPasswordRecoveryPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-[440px_1fr] xl:grid-cols-[480px_1fr]">
      {/* Restrained Operational Side Panel */}
      <aside className="hidden lg:flex flex-col justify-between border-r border-white/10 bg-[#0F2928] p-12 text-white">
        <div className="flex items-center gap-2.5">
          <Link
            href={ROUTES.home}
            className="inline-flex items-center gap-2.5 text-white transition-opacity hover:opacity-90"
          >
            <BrandLogo size={24} inverse />
            <span className="text-xl font-extrabold tracking-tight">TripMate</span>
          </Link>
          <span className="rounded border border-white/20 bg-white/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-white/85">
            Admin
          </span>
        </div>

        <div className="space-y-6">
          <div className="space-y-2.5">
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-white">
              Admin account recovery
            </h1>
            <p className="text-sm leading-relaxed text-white/70">
              Reset your administrator password using the email address assigned to your account.
            </p>
          </div>

          <ul className="space-y-2.5 border-t border-white/10 pt-5 text-xs leading-relaxed text-white/65">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-white/50" aria-hidden="true" />
              <span>Verification codes are single-use and expire after 3 minutes.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-white/50" aria-hidden="true" />
              <span>Wait 60 seconds before requesting a new code for the same email.</span>
            </li>
          </ul>
        </div>

        <p className="text-xs text-white/45">
          TripMate Administration
        </p>
      </aside>

      {/* Operational Recovery Canvas */}
      <main className="relative flex flex-col items-center justify-center bg-[#F7F5EF] px-5 py-10 sm:px-10 lg:px-14">
        <div
          aria-label="TripMate Admin brand"
          className="absolute top-6 left-6 flex items-center gap-2 lg:hidden"
        >
          <BrandLogo size={22} className="text-[#103B39]" />
          <span className="text-lg font-extrabold tracking-tight text-[#103B39]">TripMate</span>
          <span className="rounded bg-[#174B4A] px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-[#E8F0EA]">
            Admin
          </span>
        </div>

        <div className="w-full max-w-[440px] pt-12 lg:pt-0">
          <div className="rounded-2xl border border-[#DCE2DD] bg-white p-6 shadow-soft sm:p-8">
            <PasswordRecoveryFlow admin />
          </div>

          <p className="mt-5 text-center text-xs text-[#5B6E69]">
            © 2026 TripMate — Administration
          </p>
        </div>
      </main>
    </div>
  );
}
