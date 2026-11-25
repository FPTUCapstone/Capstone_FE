import Link from 'next/link';

import { PageHeader } from '@/components/layout/PageHeader';
import { adminRoutesEn } from '@/features/admin/routes/resources/en';

export function RouteDirectoryUnavailableView() {
  const copy = adminRoutesEn.directory;

  return (
    <div className="pb-16 text-[#1C2928]">
      <section className="mx-auto max-w-6xl">
        <PageHeader
          eyebrow={copy.eyebrow}
          title={copy.title}
          description={copy.description}
          actions={
            <Link
              href="/admin/routes/create"
              className="inline-flex items-center justify-center rounded-xl bg-[#103B39] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#174B4A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#174B4A]"
            >
              {copy.createRouteButton}
            </Link>
          }
        />

        <section className="mt-6 rounded-2xl border border-[#F2D8B3] bg-[#FBF3E8] p-5 sm:p-6 text-[#1C2928]">
          <span className="inline-flex rounded-full border border-[#F2D8B3] bg-[#F7EBE5] px-3 py-1 text-xs font-bold text-[#8F5419]">
            {copy.pendingBadge}
          </span>
          <h2 className="mt-3 text-lg font-extrabold text-[#1C2928]">{copy.pendingTitle}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#5B6E69]">
            {copy.pendingDescription}
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-[#DCE2DD] bg-[#FFFFFF] p-5 shadow-xs sm:p-6">
          <p id="route-controls-pending-desc" className="sr-only">
            {copy.pendingDescription}
          </p>
          <div className="grid gap-4 md:grid-cols-[1fr_14rem]">
            <label className="block text-sm font-bold text-[#1C2928]">
              {copy.searchLabel}
              <input
                aria-label={copy.searchLabel}
                aria-describedby="route-controls-pending-desc"
                disabled
                placeholder={copy.searchPlaceholder}
                type="search"
                className="mt-2 w-full rounded-xl border border-[#DCE2DD] bg-[#F7F5EF] px-3 py-2.5 text-sm text-[#5B6E69] disabled:cursor-not-allowed"
              />
            </label>
            <label className="block text-sm font-bold text-[#1C2928]">
              {copy.filterLabel}
              <select
                aria-label={copy.filterLabel}
                aria-describedby="route-controls-pending-desc"
                disabled
                defaultValue=""
                className="mt-2 w-full rounded-xl border border-[#DCE2DD] bg-[#F7F5EF] px-3 py-2.5 text-sm text-[#5B6E69] disabled:cursor-not-allowed"
              >
                <option value="">{copy.filterPlaceholder}</option>
              </select>
            </label>
          </div>

          <div className="mt-6 rounded-xl border border-dashed border-[#DCE2DD] bg-[#F7F5EF] p-8 text-center">
            <h3 className="text-base font-bold text-[#5B6E69]">{copy.emptyTitle}</h3>
            <p className="mt-1 text-sm text-[#5B6E69]">{copy.emptyDescription}</p>
          </div>

          <div className="mt-6">
            <Link
              href="/admin"
              className="inline-flex items-center justify-center rounded-xl bg-[#174B4A] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#103B39] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B6E69]"
            >
              {copy.returnToDashboardLabel}
            </Link>
          </div>
        </section>
      </section>
    </div>
  );
}
