'use client';

import { useState } from 'react';
import Link from 'next/link';

import { adminStaffEn } from '@/features/admin/staff/resources/en';
import { ROUTES } from '@/lib/routes';
import { StaffAnalyticsTabView } from './StaffAnalyticsTabView';
import { DashboardMainTabs, type DashboardTab } from '@/features/admin/shared/components/tabs/DashboardMainTabs';

export function StaffDashboardView() {
  const copy = adminStaffEn.staffDashboard;
  const availableModules = copy.modules.filter((module) => module.status === 'available');
  const pendingModules = copy.modules.filter((module) => module.status !== 'available');

  const [activeTab, setActiveTab] = useState<DashboardTab>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('tab') === 'analytics' || params.get('analytics') === '1' || params.get('preview') === '1'
        ? 'analytics'
        : 'overview';
    }
    return 'overview';
  });

  return (
    <div className="pb-16 text-[#1C2923]">
      <div className="mx-auto max-w-7xl">
        {/* Workspace Header - Forest Charcoal Authority */}
        <header className="mb-6 rounded-2xl border border-[#2A3B33] bg-[#1C2923] p-6 text-[#F7F6F2] shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#758B74] bg-[#273830] px-3 py-1 text-xs font-bold tracking-wider text-[#E8EFE9] uppercase">
                <span className="h-2 w-2 rounded-full bg-[#758B74]" aria-hidden="true" />
                <span>{copy.eyebrow}</span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#FFFFFF] sm:text-3xl">
                {copy.title}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#A3B3AB]">
                {copy.subtitle}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-[#758B74] bg-[#273830] px-3.5 py-2 text-xs font-bold text-[#E8EFE9]">
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                  badge
                </span>
                <span>{copy.roleBadge}</span>
              </span>
              <Link
                href={ROUTES.admin.accountSecurity}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#245747] border border-[#758B74] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#1B4337] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#758B74]"
              >
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                  lock_reset
                </span>
                <span>{copy.securityActionLabel}</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Dashboard Main Tabs (Overview | Analytics) */}
        <DashboardMainTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          overviewLabel={copy.tabs.overview}
          analyticsLabel={copy.tabs.analytics}
          badgeLabel={copy.analyticsBadge}
        />

        {activeTab === 'overview' ? (
          <div id="panel-overview" role="tabpanel" aria-labelledby="tab-overview">
            {/* Honest Workspace Readiness Notice - Sage Green Calm */}
            <section
              aria-label={copy.readinessBannerTitle}
              className="mb-8 rounded-2xl border border-[#BCE0CD] bg-[#E7F2EC] p-4 sm:p-5"
            >
              <div className="flex items-start gap-3">
                <span
                  className="material-symbols-outlined mt-0.5 text-[20px] text-[#1B5E3C]"
                  aria-hidden="true"
                >
                  verified_user
                </span>
                <div>
                  <h2 className="text-sm font-bold text-[#1C2923]">{copy.readinessBannerTitle}</h2>
                  <p className="mt-1 text-xs leading-relaxed text-[#4A5851]">
                    {copy.readinessBannerBody}
                  </p>
                </div>
              </div>
            </section>

            {/* Active Operational Modules - Surface Card with Forest CTAs */}
            <section aria-labelledby="staff-active-modules-heading" className="mb-10">
              <div className="mb-4">
                <h2
                  id="staff-active-modules-heading"
                  className="text-lg font-extrabold tracking-tight text-[#1C2923] sm:text-xl"
                >
                  {copy.availableSectionTitle}
                </h2>
                <p className="mt-1 text-xs text-[#4A5851] sm:text-sm">
                  {copy.availableSectionSubtitle}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {availableModules.map((module) => (
                  <article
                    key={module.id}
                    className="flex flex-col justify-between rounded-2xl border border-[#E6E4DD] bg-[#FFFFFF] p-5 shadow-xs transition hover:border-[#758B74] hover:shadow-sm"
                  >
                    <div>
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] font-bold tracking-wider text-[#245747] uppercase">
                          {module.category}
                        </span>
                        <span className="rounded-full border border-[#BCE0CD] bg-[#E7F2EC] px-2.5 py-0.5 text-[11px] font-semibold text-[#1B5E3C]">
                          {copy.statusBadges.available}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-[#1C2923]">{module.title}</h3>
                      <p className="mt-2 text-xs leading-relaxed text-[#4A5851] sm:text-sm">
                        {module.description}
                      </p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-[#F0EFEA]">
                      <Link
                        href={module.href}
                        className="inline-flex w-full items-center justify-between rounded-xl bg-[#245747] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#1B4337] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#758B74]"
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

            {/* Scheduled & Pending Operational Modules - Warm Minimal Subdued */}
            <section aria-labelledby="staff-pending-modules-heading" className="mb-10">
              <div className="mb-4">
                <h2
                  id="staff-pending-modules-heading"
                  className="text-lg font-extrabold tracking-tight text-[#1C2923] sm:text-xl"
                >
                  {copy.pendingSectionTitle}
                </h2>
                <p className="mt-1 text-xs text-[#4A5851] sm:text-sm">
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
                      className="flex flex-col justify-between rounded-2xl border border-[#E6E4DD] bg-[#FFFFFF]/70 p-5 shadow-2xs"
                    >
                      <div>
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] font-bold tracking-wider text-[#74827B] uppercase">
                            {module.category}
                          </span>
                          <span className="rounded-full border border-[#F2D8B3] bg-[#FBF3E8] px-2.5 py-0.5 text-[11px] font-semibold text-[#8F5419]">
                            {badgeLabel}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-[#1C2923]">{module.title}</h3>
                        <p className="mt-2 text-xs leading-relaxed text-[#4A5851] sm:text-sm">
                          {module.description}
                        </p>
                      </div>

                      <div className="mt-5 border-t border-[#F0EFEA] pt-3">
                        <p className="text-xs font-medium text-[#74827B]">{module.availabilityNote}</p>
                        <button
                          type="button"
                          disabled
                          className="mt-3 inline-flex w-full cursor-not-allowed items-center justify-center rounded-xl border border-[#D8D5CC] bg-[#EDECE8] px-4 py-2 text-xs font-semibold text-[#74827B]"
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
              className="rounded-2xl border border-[#E6E4DD] bg-[#FFFFFF] p-5 sm:p-6 shadow-xs"
            >
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h2
                    id="staff-analytics-notice-heading"
                    className="text-base font-bold text-[#1C2923]"
                  >
                    {copy.analyticsNoticeTitle}
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-[#4A5851] sm:text-sm">
                    {copy.analyticsNoticeBody}
                  </p>
                </div>
                <span className="inline-flex shrink-0 items-center rounded-full border border-[#D8D5CC] bg-[#F0EFEA] px-3 py-1 text-xs font-semibold text-[#4A5851]">
                  {copy.analyticsNoticeStatus}
                </span>
              </div>
            </section>
          </div>
        ) : (
          <div id="panel-analytics" role="tabpanel" aria-labelledby="tab-analytics">
            <StaffAnalyticsTabView />
          </div>
        )}
      </div>
    </div>
  );
}
