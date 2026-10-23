import Link from 'next/link';

import { adminDashboardEn, type AdminDashboardModule, type AdminModuleStatus } from './resources/en';

const statusTone: Record<AdminModuleStatus, string> = {
  available: 'border-[#71f8e4]/50 bg-[#71f8e4]/10 text-[#71f8e4]',
  pendingIntegration: 'border-amber-300/50 bg-amber-300/10 text-amber-200',
  pendingSpecification: 'border-[#b0c9e8]/50 bg-[#b0c9e8]/10 text-[#d1e4ff]',
};

function ModuleCard({ module }: { module: AdminDashboardModule }) {
  const titleId = `admin-module-${module.id}`;

  return (
    <li>
      <article
        aria-labelledby={titleId}
        className="flex h-full flex-col rounded-2xl border border-[#314863] bg-[#102a43] p-5 shadow-md"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <span className="material-symbols-outlined text-2xl text-[#71f8e4]" aria-hidden="true">
            {module.icon}
          </span>
          <span
            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wide ${statusTone[module.status]}`}
          >
            {adminDashboardEn.statusLabels[module.status]}
          </span>
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[#b0c9e8]">{module.category}</p>
        <h3 id={titleId} className="mt-1 text-lg font-bold text-white">
          {module.title}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-[#d1e4ff]">{module.description}</p>
        {module.status === 'available' && module.href ? (
          <Link
            href={module.href}
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#006b5f] px-4 text-sm font-bold text-white transition-colors hover:bg-[#005048] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#71f8e4]"
          >
            {module.actionLabel ?? adminDashboardEn.openModuleLabel}
          </Link>
        ) : (
          <p className="mt-4 rounded-xl border border-[#314863] bg-[#00152a] px-3 py-2.5 text-xs text-[#b0c9e8]">
            {module.availabilityNote}
          </p>
        )}
      </article>
    </li>
  );
}

export function AdminDashboard() {
  return (
    <div className="min-h-screen bg-[#00152a] pb-24 text-[#eff1f4] md:pb-12">
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10">
        <header className="mb-8 border-b border-[#314863] pb-6">
          <p className="mb-1 font-mono text-xs font-bold uppercase tracking-wider text-[#71f8e4]">
            {adminDashboardEn.eyebrow}
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
            {adminDashboardEn.title}
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-[#b0c9e8]">{adminDashboardEn.subtitle}</p>
        </header>

        <section
          aria-labelledby="admin-readiness-title"
          className="mb-8 flex items-start gap-3 rounded-2xl border border-[#314863] bg-[#102a43] p-4"
        >
          <span className="material-symbols-outlined text-2xl text-[#71f8e4]" aria-hidden="true">
            info
          </span>
          <div>
            <h2 id="admin-readiness-title" className="text-sm font-bold text-white">
              {adminDashboardEn.readinessTitle}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-[#b0c9e8]">{adminDashboardEn.readinessBody}</p>
          </div>
        </section>

        <section aria-labelledby="admin-modules-title">
          <h2 id="admin-modules-title" className="mb-4 text-base font-bold text-white">
            {adminDashboardEn.modulesHeading}
          </h2>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-3">
            {adminDashboardEn.modules.map((module) => (
              <ModuleCard key={module.id} module={module} />
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
