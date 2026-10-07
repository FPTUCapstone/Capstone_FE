import Link from 'next/link';

import { adminStaffEn } from '@/features/admin/staff/resources/en';
import { ROUTES } from '@/lib/routes';

export function StaffDashboardView() {
  const copy = adminStaffEn.staffDashboard;
  const availableModules = copy.modules.filter((module) => module.status === 'available');
  const pendingModules = copy.modules.filter((module) => module.status !== 'available');

  return (
    <div className="min-h-screen bg-[#f7f9fc] pb-16 text-[#191c1e]">
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 md:px-8 md:py-10">
        {/* Workspace Header */}
        <header className="mb-8 rounded-2xl border border-[#314863] bg-[#00152a] p-6 text-white shadow-md sm:p-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#314863] bg-[#102a43] px-3 py-1 text-xs font-bold tracking-wider text-[#71f8e4] uppercase">
                <span className="h-2 w-2 rounded-full bg-[#71f8e4]" aria-hidden="true" />
                <span>{copy.eyebrow}</span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                {copy.title}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#d1e4ff]">
                {copy.subtitle}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-[#314863] bg-[#102a43] px-3.5 py-2 text-xs font-bold text-[#71f8e4]">
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                  badge
                </span>
                <span>{copy.roleBadge}</span>
              </span>
              <Link
                href={ROUTES.admin.accountSecurity}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#006b5f] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#005048] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#71f8e4]"
              >
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                  lock_reset
                </span>
                <span>{copy.securityActionLabel}</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Honest Workspace Readiness Notice */}
        <section
          aria-label={copy.readinessBannerTitle}
          className="mb-8 rounded-2xl border border-[#cfe2f3] bg-[#eef6ff] p-4 sm:p-5"
        >
          <div className="flex items-start gap-3">
            <span
              className="material-symbols-outlined mt-0.5 text-[20px] text-[#004b87]"
              aria-hidden="true"
            >
              verified_user
            </span>
            <div>
              <h2 className="text-sm font-bold text-[#00152a]">{copy.readinessBannerTitle}</h2>
              <p className="mt-1 text-xs leading-relaxed text-[#344054]">
                {copy.readinessBannerBody}
              </p>
            </div>
          </div>
        </section>

        {/* Active Operational Modules */}
        <section aria-labelledby="staff-active-modules-heading" className="mb-10">
          <div className="mb-4">
            <h2
              id="staff-active-modules-heading"
              className="text-lg font-extrabold tracking-tight text-[#00152a] sm:text-xl"
            >
              {copy.availableSectionTitle}
            </h2>
            <p className="mt-1 text-xs text-[#475467] sm:text-sm">
              {copy.availableSectionSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableModules.map((module) => (
              <article
                key={module.id}
                className="flex flex-col justify-between rounded-2xl border border-[#d0d7de] bg-white p-5 shadow-xs transition hover:border-[#006b5f]"
              >
                <div>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-bold tracking-wider text-[#006b5f] uppercase">
                      {module.category}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                      {copy.statusBadges.available}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#00152a]">{module.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-[#475467] sm:text-sm">
                    {module.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-[#f2f4f7]">
                  <Link
                    href={module.href}
                    className="inline-flex w-full items-center justify-between rounded-xl bg-[#00152a] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#102a43] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006b5f]"
                  >
                    <span>{module.actionLabel}</span>
                    <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                      arrow_forward
                    </span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Scheduled & Pending Operational Modules */}
        <section aria-labelledby="staff-pending-modules-heading" className="mb-10">
          <div className="mb-4">
            <h2
              id="staff-pending-modules-heading"
              className="text-lg font-extrabold tracking-tight text-[#00152a] sm:text-xl"
            >
              {copy.pendingSectionTitle}
            </h2>
            <p className="mt-1 text-xs text-[#475467] sm:text-sm">
              {copy.pendingSectionSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingModules.map((module) => {
              const badgeLabel =
                module.status === 'pendingBackend'
                  ? copy.statusBadges.pendingBackend
                  : copy.statusBadges.scheduledBatch;

              return (
                <article
                  key={module.id}
                  className="flex flex-col justify-between rounded-2xl border border-[#e4e7ec] bg-[#fcfcfd] p-5"
                >
                  <div>
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-bold tracking-wider text-[#475467] uppercase">
                        {module.category}
                      </span>
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
                        {badgeLabel}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-[#1d2939]">{module.title}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-[#475467] sm:text-sm">
                      {module.description}
                    </p>
                  </div>

                  <div className="mt-5 border-t border-[#eaecf0] pt-3">
                    <p className="text-xs font-medium text-[#667085]">{module.availabilityNote}</p>
                    <button
                      type="button"
                      disabled
                      className="mt-3 inline-flex w-full cursor-not-allowed items-center justify-center rounded-xl border border-[#d0d7de] bg-[#f2f4f7] px-4 py-2 text-xs font-semibold text-[#667085]"
                    >
                      {copy.unavailableModuleLabel}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Operational Analytics Notice (Screen #36 alignment state) */}
        <section
          aria-labelledby="staff-analytics-notice-heading"
          className="rounded-2xl border border-[#d0d7de] bg-white p-5 sm:p-6"
        >
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2
                id="staff-analytics-notice-heading"
                className="text-base font-bold text-[#00152a]"
              >
                {copy.analyticsNoticeTitle}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-[#475467] sm:text-sm">
                {copy.analyticsNoticeBody}
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center rounded-full border border-[#cbd5e1] bg-[#f8fafc] px-3 py-1 text-xs font-semibold text-[#334155]">
              {copy.analyticsNoticeStatus}
            </span>
          </div>
        </section>
      </main>
    </div>
  );
}
