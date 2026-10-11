import Link from 'next/link';

import { adminRoutesEn } from '@/features/admin/routes/resources/en';

interface UpdateRouteUnavailableViewProps {
  routeId: number;
}

export function UpdateRouteUnavailableView({ routeId }: UpdateRouteUnavailableViewProps) {
  const copy = adminRoutesEn.update;

  return (
    <main className="min-h-screen bg-[#f7f9fc] px-4 py-8 text-[#191c1e] sm:px-6 md:px-8 md:py-10">
      <section className="mx-auto max-w-4xl rounded-2xl border border-[#d0d7de] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-bold tracking-wider text-[#006b5f] uppercase">{copy.eyebrow}</p>
        <span className="mt-3 inline-flex rounded-full bg-[#eef6ff] px-3 py-1 text-xs font-bold text-[#004b87]">
          {copy.pendingBadge}
        </span>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-[#00152a] sm:text-3xl">
          {copy.title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#475467]">{copy.pendingDescription}</p>

        <dl className="mt-6 rounded-xl border border-[#d0d7de] bg-[#f8fafc] p-4">
          <dt className="text-xs font-bold tracking-wide text-[#475467] uppercase">
            {copy.requestedRouteIdLabel}
          </dt>
          <dd className="mt-1 text-base font-extrabold text-[#00152a]">{routeId}</dd>
        </dl>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#e4e7ec] pt-6">
          <Link
            href="/admin/routes"
            className="inline-flex items-center justify-center rounded-xl border border-[#d0d7de] bg-white px-4 py-2.5 text-sm font-bold text-[#344054] shadow-sm transition hover:bg-[#f8fafc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006b5f]"
          >
            {copy.backToDirectoryLabel}
          </Link>
          <button
            disabled
            type="button"
            className="inline-flex items-center justify-center rounded-xl border border-[#d0d7de] bg-[#f2f4f7] px-5 py-2.5 text-sm font-bold text-[#667085] shadow-sm disabled:cursor-not-allowed"
          >
            {copy.submitDisabledLabel}
          </button>
        </div>
      </section>
    </main>
  );
}
