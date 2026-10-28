'use client';

import { useState } from 'react';
import Link from 'next/link';

import { adminDashboardEn, type AdminDashboardModule, type AdminModuleStatus } from './resources/en';
import { AdminAnalyticsTabView } from '@/features/admin/shared/components/analytics/AdminAnalyticsTabView';
import { DashboardMainTabs, type DashboardTab } from '@/features/admin/shared/components/tabs/DashboardMainTabs';

const statusTone: Record<AdminModuleStatus, string> = {
  available: 'border-[#BCE0CD] bg-[#E7F2EC] text-[#1B5E3C]',
  pendingIntegration: 'border-[#F2D8B3] bg-[#FBF3E8] text-[#8F5419]',
  pendingSpecification: 'border-[#D2D1CC] bg-[#EDECE8] text-[#515553]',
};

function ModuleCard({ module }: { module: AdminDashboardModule }) {
  const titleId = `admin-module-${module.id}`;

  return (
    <li>
      <article
        aria-labelledby={titleId}
        className="flex h-full flex-col rounded-2xl border border-[#E6E4DD] bg-[#FFFFFF] p-5 shadow-xs transition hover:border-[#758B74] hover:shadow-sm"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <span
            className={`material-symbols-outlined text-2xl ${
              module.status === 'available'
                ? 'text-[#245747]'
                : module.status === 'pendingIntegration'
                ? 'text-[#B87558]'
                : 'text-[#74827B]'
            }`}
            aria-hidden="true"
          >
            {module.icon}
          </span>
          <span
            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wide ${statusTone[module.status]}`}
          >
            {adminDashboardEn.statusLabels[module.status]}
          </span>
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[#4A5851]">{module.category}</p>
        <h3 id={titleId} className="mt-1 text-lg font-bold text-[#1C2923]">
          {module.title}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-[#4A5851]">{module.description}</p>
        {module.status === 'available' && module.href ? (
          <Link
            href={module.href}
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#245747] px-4 text-sm font-bold text-white transition-colors hover:bg-[#1B4337] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#758B74]"
          >
            {module.actionLabel ?? adminDashboardEn.openModuleLabel}
          </Link>
        ) : (
          <p className="mt-4 rounded-xl border border-[#E6E4DD] bg-[#F7F6F2] px-3 py-2.5 text-xs text-[#74827B]">
            {module.availabilityNote}
          </p>
        )}
      </article>
    </li>
  );
}

export function AdminDashboard() {
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
    <div className="pb-24 text-[#1C2923] md:pb-12">
      <main className="mx-auto max-w-7xl">
        <header className="mb-6 rounded-2xl border border-[#2A3B33] bg-[#1C2923] p-6 text-[#F7F6F2] shadow-sm md:p-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="mb-1 font-mono text-xs font-bold uppercase tracking-wider text-[#758B74]">
                {adminDashboardEn.eyebrow}
              </p>
              <h1 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
                {adminDashboardEn.title}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#A3B3AB]">
                {adminDashboardEn.subtitle}
              </p>
            </div>
          </div>
        </header>

        {/* Dashboard Main Tabs (Overview | Analytics) */}
        <DashboardMainTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          overviewLabel={adminDashboardEn.tabs.overview}
          analyticsLabel={adminDashboardEn.tabs.analytics}
          badgeLabel={adminDashboardEn.analyticsBadge}
        />

        {activeTab === 'overview' ? (
          <div id="panel-overview" role="tabpanel" aria-labelledby="tab-overview">
            <section
              aria-labelledby="admin-readiness-title"
              className="mb-8 flex items-start gap-3 rounded-2xl border border-[#BCE0CD] bg-[#E7F2EC] p-4 text-[#1C2923]"
            >
              <span className="material-symbols-outlined text-2xl text-[#1B5E3C]" aria-hidden="true">
                info
              </span>
              <div>
                <h2 id="admin-readiness-title" className="text-sm font-bold text-[#1C2923]">
                  {adminDashboardEn.readinessTitle}
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-[#4A5851]">
                  {adminDashboardEn.readinessBody}
                </p>
              </div>
            </section>

            <section aria-labelledby="admin-modules-title">
              <h2 id="admin-modules-title" className="mb-4 text-base font-bold text-[#1C2923]">
                {adminDashboardEn.modulesHeading}
              </h2>
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-3">
                {adminDashboardEn.modules.map((module) => (
                  <ModuleCard key={module.id} module={module} />
                ))}
              </ul>
            </section>
          </div>
        ) : (
          <div id="panel-analytics" role="tabpanel" aria-labelledby="tab-analytics">
            <AdminAnalyticsTabView />
          </div>
        )}
      </main>
    </div>
  );
}
