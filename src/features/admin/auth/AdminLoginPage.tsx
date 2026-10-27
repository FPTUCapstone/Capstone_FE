import Link from 'next/link';

import BrandLogo from '@/components/brand/BrandIcon';
import { AdminSignInForm } from '@/features/admin/auth/AdminSignInForm';
import { adminStaffEn } from '@/features/admin/staff/resources/en';
import { ROUTES } from '@/lib/routes';

interface AdminLoginPageProps {
  returnUrl?: string;
}

const featureCards = [
  {
    icon: 'admin_panel_settings',
    title: 'Control Center',
    desc: 'Quản trị hệ thống toàn diện',
    iconBg: 'bg-[#245747]/60',
    position: 'top-0 left-0 animate-float-1',
  },
  {
    icon: 'verified',
    title: 'Tour Moderation',
    desc: 'Kiểm duyệt & phê duyệt tour',
    iconBg: 'bg-[#758B74]/40',
    position: 'top-16 right-0 animate-float-2',
  },
  {
    icon: 'history_edu',
    title: 'Audit Logs',
    desc: 'Theo dõi mọi hoạt động hệ thống',
    iconBg: 'bg-[#A3B3AB]/30',
    position: 'bottom-0 left-12 animate-float-3',
  },
];

const stats = [
  { value: '24/7', label: 'Giám sát hệ thống', color: 'text-[#A3B3AB]' },
  { value: '100%', label: 'Kiểm soát truy cập', color: 'text-[#A3B3AB]' },
  { value: '15ph', label: 'Phiên bảo mật', color: 'text-[#758B74]' },
];

export function AdminLoginPage({ returnUrl }: AdminLoginPageProps) {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr] xl:grid-cols-[1.2fr_1fr]">
      {/* Hero Panel */}
      <aside className="relative hidden lg:flex admin-hero-bg text-white overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-40" />
        <div className="absolute -top-32 -right-24 w-[420px] h-[420px] bg-[#245747]/50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-16 w-[360px] h-[360px] bg-[#758B74]/25 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          {/* Brand Header */}
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/15">
              <BrandLogo size={24} />
            </div>
            <span className="text-2xl font-extrabold tracking-tight">TripMate</span>
            <span className="rounded bg-[#245747] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#E8EFEA] border border-[#758B74]/40">
              Admin
            </span>
          </div>

          {/* Main Hero Content */}
          <div className="space-y-10 max-w-xl">
            <div className="space-y-5">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold tracking-wide backdrop-blur-sm">
                <span className="material-symbols-outlined text-[16px] text-[#A3B3AB]">
                  shield
                </span>
                ADMINISTRATION WORKSPACE
              </span>
              <h1 className="text-5xl xl:text-6xl font-extrabold leading-[1.1] tracking-tight">
                Quản trị{' '}
                <span className="text-[#758B74]">TripMate</span>
              </h1>
              <p className="text-lg text-white/70 leading-relaxed max-w-md">
                {adminStaffEn.login.description}
              </p>
            </div>

            {/* Floating feature cards */}
            <div className="relative h-56">
              {featureCards.map((card) => (
                <div
                  key={card.title}
                  className={`absolute w-72 bg-white/8 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-2xl ${card.position}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.iconBg}`}>
                      <span className="material-symbols-outlined text-white text-[22px]">
                        {card.icon}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-bold">{card.title}</div>
                      <div className="text-xs text-white/50">{card.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer stats */}
          <div className="grid grid-cols-3 gap-6 max-w-lg">
            {stats.map((s) => (
              <div key={s.label}>
                <div className={`text-3xl font-extrabold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-white/55 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Form Panel */}
      <main className="flex items-center justify-center p-6 sm:p-10 lg:p-12 xl:p-16 bg-brand-surface relative">
        <div className="absolute top-6 left-6 lg:hidden flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#1C2923] flex items-center justify-center shadow-md text-white">
            <BrandLogo size={22} />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-brand-navy">
            TripMate
          </span>
          <span className="rounded bg-[#245747] px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-[#E8EFEA]">
            Admin
          </span>
        </div>

        <div className="absolute top-6 right-6">
          <Link
            href={ROUTES.signIn}
            className="text-sm font-semibold text-[#758B74] hover:text-[#245747] transition-colors"
          >
            {adminStaffEn.login.backLabel}
          </Link>
        </div>

        <div className="w-full max-w-[480px]">
          <div className="bg-brand-card rounded-3xl shadow-card-lg p-8 sm:p-10 border border-slate-100">
            <div className="mb-8">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#245747]">
                {adminStaffEn.login.eyebrow}
              </p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-brand-navy">
                {adminStaffEn.login.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-brand-textSecondary">
                {adminStaffEn.login.description}
              </p>
            </div>
            <AdminSignInForm returnUrl={returnUrl} />
          </div>

          <p className="mt-6 text-center text-[11px] text-slate-400 leading-relaxed">
            Phiên đăng nhập quản trị có thời hạn 15 phút vì lý do bảo mật.
            <br />© 2026 TripMate — Administration Workspace
          </p>
        </div>
      </main>
    </div>
  );
}
