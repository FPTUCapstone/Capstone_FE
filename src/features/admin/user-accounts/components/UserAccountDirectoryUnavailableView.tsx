import Link from 'next/link';

import { adminUserAccountsEn } from '@/features/admin/user-accounts/resources/en';

export function UserAccountDirectoryUnavailableView() {
  const copy = adminUserAccountsEn.directory;

  return (
    <div className="pb-16 text-[#1C2923]">
      <section className="mx-auto max-w-6xl">
        <header className="rounded-2xl border border-[#2A3B33] bg-[#1C2923] p-6 text-[#F7F6F2] shadow-sm sm:p-8">
          <p className="text-xs font-bold tracking-wider text-[#758B74] uppercase">{copy.eyebrow}</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{copy.title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#A3B3AB]">{copy.description}</p>
        </header>

        <section className="mt-6 rounded-2xl border border-[#F2D8B3] bg-[#FBF3E8] p-5 sm:p-6 text-[#1C2923]">
          <span className="inline-flex rounded-full border border-[#F2D8B3] bg-[#F7EBE5] px-3 py-1 text-xs font-bold text-[#8F5419]">
            {copy.pendingBadge}
          </span>
          <h2 className="mt-3 text-lg font-extrabold text-[#1C2923]">{copy.pendingTitle}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#4A5851]">
            {copy.pendingDescription}
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-[#E6E4DD] bg-[#FFFFFF] p-5 shadow-xs sm:p-6">
          <p id="account-controls-pending-desc" className="sr-only">
            {copy.pendingDescription}
          </p>
          <div className="grid gap-4 md:grid-cols-[1fr_14rem]">
            <label className="block text-sm font-bold text-[#1C2923]">
              {copy.searchLabel}
              <input
                aria-label={copy.searchLabel}
                aria-describedby="account-controls-pending-desc"
                disabled
                placeholder={copy.searchPlaceholder}
                type="search"
                className="mt-2 w-full rounded-xl border border-[#D8D5CC] bg-[#EDECE8] px-3 py-2.5 text-sm text-[#74827B] disabled:cursor-not-allowed"
              />
            </label>
            <label className="block text-sm font-bold text-[#1C2923]">
              {copy.statusFilterLabel}
              <select
                aria-label={copy.statusFilterLabel}
                aria-describedby="account-controls-pending-desc"
                disabled
                defaultValue=""
                className="mt-2 w-full rounded-xl border border-[#D8D5CC] bg-[#EDECE8] px-3 py-2.5 text-sm text-[#74827B] disabled:cursor-not-allowed"
              >
                <option value="">{copy.statusFilterPlaceholder}</option>
              </select>
            </label>
          </div>

          <div
            aria-label={copy.operationsLabel}
            className="mt-6 rounded-xl border border-dashed border-[#D8D5CC] bg-[#F7F6F2] p-4"
            role="region"
          >
            <p className="text-sm font-semibold text-[#4A5851]">{copy.operationsLabel}</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <button
                disabled
                aria-describedby="account-controls-pending-desc"
                type="button"
                className="rounded-xl border border-[#D8D5CC] bg-[#EDECE8] px-4 py-2.5 text-sm font-bold text-[#74827B] disabled:cursor-not-allowed"
              >
                {copy.lockUnavailableLabel}
              </button>
              <button
                disabled
                aria-describedby="account-controls-pending-desc"
                type="button"
                className="rounded-xl border border-[#D8D5CC] bg-[#EDECE8] px-4 py-2.5 text-sm font-bold text-[#74827B] disabled:cursor-not-allowed"
              >
                {copy.unlockUnavailableLabel}
              </button>
            </div>
          </div>

          <Link
            href="/admin"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#245747] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#1B4337] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#758B74]"
          >
            {copy.returnToDashboardLabel}
          </Link>
        </section>
      </section>
    </div>
  );
}
