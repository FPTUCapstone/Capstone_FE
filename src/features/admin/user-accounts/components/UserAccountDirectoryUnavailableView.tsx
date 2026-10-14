import Link from 'next/link';

import { adminUserAccountsEn } from '@/features/admin/user-accounts/resources/en';

export function UserAccountDirectoryUnavailableView() {
  const copy = adminUserAccountsEn.directory;

  return (
    <main className="min-h-screen bg-[#f7f9fc] px-4 py-8 text-[#191c1e] sm:px-6 md:px-8 md:py-10">
      <section className="mx-auto max-w-6xl">
        <header className="rounded-2xl border border-[#314863] bg-[#00152a] p-6 text-white shadow-md sm:p-8">
          <p className="text-xs font-bold tracking-wider text-[#71f8e4] uppercase">{copy.eyebrow}</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">{copy.title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#d1e4ff]">{copy.description}</p>
        </header>

        <section className="mt-6 rounded-2xl border border-[#cfe2f3] bg-[#eef6ff] p-5 sm:p-6">
          <span className="inline-flex rounded-full bg-[#d7f7f1] px-3 py-1 text-xs font-bold text-[#005048]">
            {copy.pendingBadge}
          </span>
          <h2 className="mt-3 text-lg font-extrabold text-[#00152a]">{copy.pendingTitle}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#344054]">
            {copy.pendingDescription}
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-[#d0d7de] bg-white p-5 shadow-sm sm:p-6">
          <p id="account-controls-pending-desc" className="sr-only">
            {copy.pendingDescription}
          </p>
          <div className="grid gap-4 md:grid-cols-[1fr_14rem]">
            <label className="block text-sm font-bold text-[#1d2939]">
              {copy.searchLabel}
              <input
                aria-label={copy.searchLabel}
                aria-describedby="account-controls-pending-desc"
                disabled
                placeholder={copy.searchPlaceholder}
                type="search"
                className="mt-2 w-full rounded-xl border border-[#d0d7de] bg-[#f2f4f7] px-3 py-2.5 text-sm text-[#667085] disabled:cursor-not-allowed"
              />
            </label>
            <label className="block text-sm font-bold text-[#1d2939]">
              {copy.statusFilterLabel}
              <select
                aria-label={copy.statusFilterLabel}
                aria-describedby="account-controls-pending-desc"
                disabled
                defaultValue=""
                className="mt-2 w-full rounded-xl border border-[#d0d7de] bg-[#f2f4f7] px-3 py-2.5 text-sm text-[#667085] disabled:cursor-not-allowed"
              >
                <option value="">{copy.statusFilterPlaceholder}</option>
              </select>
            </label>
          </div>

          <div
            aria-label={copy.operationsLabel}
            className="mt-6 rounded-xl border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-4"
            role="region"
          >
            <p className="text-sm font-semibold text-[#334155]">{copy.operationsLabel}</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <button
                disabled
                aria-describedby="account-controls-pending-desc"
                type="button"
                className="rounded-xl border border-[#d0d7de] bg-[#f2f4f7] px-4 py-2.5 text-sm font-bold text-[#667085] disabled:cursor-not-allowed"
              >
                {copy.lockUnavailableLabel}
              </button>
              <button
                disabled
                aria-describedby="account-controls-pending-desc"
                type="button"
                className="rounded-xl border border-[#d0d7de] bg-[#f2f4f7] px-4 py-2.5 text-sm font-bold text-[#667085] disabled:cursor-not-allowed"
              >
                {copy.unlockUnavailableLabel}
              </button>
            </div>
          </div>

          <Link
            href="/admin"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#006b5f] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#005048] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006b5f]"
          >
            {copy.returnToDashboardLabel}
          </Link>
        </section>
      </section>
    </main>
  );
}
