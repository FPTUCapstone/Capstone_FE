import Link from 'next/link';

import { adminStaffEn } from '@/features/admin/staff/resources/en';
import { ROUTES } from '@/lib/routes';

export function AdminAccessDeniedView() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-4 py-12 md:px-8">
      <section
        aria-labelledby="admin-access-denied-title"
        className="w-full rounded-2xl border border-[#d0d7de] bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold tracking-wide text-amber-800">
          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
            lock
          </span>
          <span>{adminStaffEn.accessDenied.eyebrow}</span>
        </div>

        <h1
          id="admin-access-denied-title"
          className="text-xl font-extrabold tracking-tight text-[#00152a] sm:text-2xl"
        >
          {adminStaffEn.accessDenied.title}
        </h1>

        <p className="mt-2 text-sm leading-relaxed text-[#475467]">
          {adminStaffEn.accessDenied.description}
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href={ROUTES.admin.staffDashboard}
            className="inline-flex items-center justify-center rounded-xl bg-[#006b5f] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#005048] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006b5f]"
          >
            {adminStaffEn.accessDenied.returnToStaffButton}
          </Link>
          <Link
            href={ROUTES.admin.login}
            className="inline-flex items-center justify-center rounded-xl border border-[#cbd5e1] bg-white px-4 py-2.5 text-sm font-semibold text-[#1e293b] transition hover:bg-[#f8fafc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00152a]"
          >
            {adminStaffEn.accessDenied.returnToAdminSignInButton}
          </Link>
        </div>
      </section>
    </main>
  );
}
