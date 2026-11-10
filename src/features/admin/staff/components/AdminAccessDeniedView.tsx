import Link from 'next/link';

import { adminStaffEn } from '@/features/admin/staff/resources/en';
import { ROUTES } from '@/lib/routes';

export type RequiredAdministrationRole = 'Administrator' | 'Staff';

export function AdminAccessDeniedView({
  requiredRole = 'Administrator',
  requiredRoles,
  description,
}: {
  requiredRole?: RequiredAdministrationRole;
  /** DAILY-PAYOUT-TRANSFER plan Task 3a: a route that allows either role (UC-72). When set,
   * the viewer has neither role at all, so there is no "return to your own dashboard" link —
   * only the sign-in link is shown. */
  requiredRoles?: RequiredAdministrationRole[];
  description?: string;
}) {
  const dual = (requiredRoles?.length ?? 0) > 0;
  const copy = dual
    ? adminStaffEn.eitherAccessDenied
    : requiredRole === 'Staff'
      ? adminStaffEn.staffAccessDenied
      : adminStaffEn.accessDenied;
  const returnHref = requiredRole === 'Staff'
    ? ROUTES.admin.dashboard
    : ROUTES.admin.staffDashboard;
  const returnLabel = requiredRole === 'Staff'
    ? adminStaffEn.staffAccessDenied.returnToAdminButton
    : adminStaffEn.accessDenied.returnToStaffButton;

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-4 py-12 md:px-8">
      <section
        aria-labelledby="admin-access-denied-title"
        className="w-full rounded-2xl border border-[#DCE2DD] bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold tracking-wide text-amber-800">
          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
            lock
          </span>
          <span>{copy.eyebrow}</span>
        </div>

        <h1
          id="admin-access-denied-title"
          className="text-xl font-extrabold tracking-tight text-[#1C2928] sm:text-2xl"
        >
          {copy.title}
        </h1>

        <p className="mt-2 text-sm leading-relaxed text-[#5B6E69]">
          {description ?? copy.description}
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {!dual && (
            <Link
              href={returnHref}
              className="inline-flex items-center justify-center rounded-xl bg-[#174B4A] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#103B39] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#174B4A]"
            >
              {returnLabel}
            </Link>
          )}
          <Link
            href={ROUTES.admin.login}
            className="inline-flex items-center justify-center rounded-xl border border-[#DCE2DD] bg-white px-4 py-2.5 text-sm font-semibold text-[#1e293b] transition hover:bg-[#f8fafc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1C2928]"
          >
            {copy.returnToAdminSignInButton}
          </Link>
        </div>
      </section>
    </main>
  );
}
