'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { DemoModeBanner, PendingIntegrationNotice, focusRing } from './components/ModerationNotices';
import { isTourModerationDemoRequested } from './demo/tourModerationDemoMode';
import { tourModerationEn } from './resources/en';
import { getPendingTourPost } from './services/tourModerationService';
import type { PendingTourPost } from './types';
import { formatDisplayDate, formatDisplayDateTime, formatDisplayTime, formatVnd } from './utils/format';
import { buildTourQueueHref, parseTourQueueQuery } from './utils/queueQuery';
import { TourReviewDecisionPanel } from './TourReviewDecisionPanel';

const copy = tourModerationEn.detail;

function FactChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#DCE2DD] bg-[#F7F5EF] p-3">
      <dt className="block text-[11px] font-semibold text-[#5B6E69]">{label}</dt>
      <dd className="text-base font-bold text-[#1C2928]">{value}</dd>
    </div>
  );
}

function ServiceList({ title, items }: { title: string; items: readonly string[] }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-bold text-[#1C2928]">{title}</h3>
      <ul className="list-disc space-y-1 pl-5 text-sm text-[#5B6E69]">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function TourContent({ tour }: { tour: PendingTourPost }) {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      <div className="space-y-8 lg:col-span-8">
        <section aria-labelledby="tour-overview-title" className="rounded-2xl border border-[#DCE2DD] bg-white p-6 shadow-xs">
          <dl className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <FactChip label={copy.facts.price} value={formatVnd(tour.priceVnd)} />
            <FactChip label={copy.facts.duration} value={copy.durationHours(tour.durationHours)} />
            <FactChip label={copy.facts.capacity} value={copy.capacityTravelers(tour.capacity)} />
            <FactChip label={copy.facts.departure} value={formatDisplayDate(tour.departureAtUtc)} />
          </dl>
          <h2 id="tour-overview-title" className="mb-2 text-base font-bold text-[#1C2928]">
            {copy.overviewTitle}
          </h2>
          <p className="mb-4 text-sm leading-relaxed text-[#5B6E69]">{tour.overview}</p>
          <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
            <div>
              <dt className="font-semibold text-[#5B6E69]">{copy.categoryLabel}</dt>
              <dd className="text-[#1C2928]">{tour.category}</dd>
            </div>
            <div>
              <dt className="font-semibold text-[#5B6E69]">{copy.languagesLabel}</dt>
              <dd className="text-[#1C2928]">{tour.languages}</dd>
            </div>
            <div>
              <dt className="font-semibold text-[#5B6E69]">{copy.imagesLabel}</dt>
              <dd className="text-[#1C2928]">{tour.imageCount}</dd>
            </div>
          </dl>
        </section>

        <section className="grid grid-cols-1 gap-6 rounded-2xl border border-[#DCE2DD] bg-white p-6 shadow-xs sm:grid-cols-2">
          <ServiceList title={copy.includedTitle} items={tour.includedServices} />
          <ServiceList title={copy.excludedTitle} items={tour.excludedServices} />
          <div className="sm:col-span-2">
            <h3 className="mb-2 text-sm font-bold text-[#1C2928]">{copy.cancellationTitle}</h3>
            <p className="text-sm text-[#5B6E69]">{tour.cancellationPolicy}</p>
          </div>
        </section>

        <section aria-labelledby="tour-itinerary-title" className="rounded-2xl border border-[#DCE2DD] bg-white p-6 shadow-xs">
          <h2 id="tour-itinerary-title" className="mb-6 flex items-center gap-2 text-lg font-bold text-[#1C2928]">
            <span className="material-symbols-outlined text-[#174B4A]" aria-hidden="true">
              route
            </span>
            {copy.itineraryTitle}
          </h2>
          <div className="relative ml-2">
            <div aria-hidden="true" className="absolute bottom-8 left-[19px] top-4 z-0 w-[3px] bg-[#DCE2DD]" />
            <ol className="space-y-6">
            {tour.itinerary.map((stop, index) => (
              <li key={stop.id} className="relative z-10 flex items-start gap-4">
                <div
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-white bg-[#103B39] font-mono text-sm font-bold text-white shadow-xs"
                >
                  {index + 1}
                </div>
                <div className="flex-1 rounded-xl border border-[#DCE2DD] bg-[#F7F5EF] p-4">
                  <div className="mb-1 flex items-start justify-between gap-3">
                    <h3 className="text-base font-bold text-[#1C2928]">{stop.title}</h3>
                    <span className="rounded-md bg-[#DCE2DD] px-2 py-1 font-mono text-xs font-bold text-[#1C2928]">
                      {formatDisplayTime(stop.startsAtUtc)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-[#5B6E69]">{stop.description}</p>
                </div>
              </li>
            ))}
            </ol>
          </div>
        </section>
      </div>

      <div className="space-y-6 lg:col-span-4">
        <section aria-labelledby="tour-operator-title" className="rounded-2xl border border-[#DCE2DD] bg-white p-5 shadow-xs">
          <h2 id="tour-operator-title" className="mb-2 text-xs font-bold uppercase tracking-wider text-[#5B6E69]">
            {copy.operatorCardTitle}
          </h2>
          <p className="text-sm font-bold text-[#1C2928]">{tour.operatorName}</p>
          <p className="mt-1 text-xs text-[#5B6E69]">{copy.submittedOn(formatDisplayDateTime(tour.submittedAtUtc))}</p>
        </section>
        <TourReviewDecisionPanel />
      </div>
    </div>
  );
}

export function TourReview({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const demo = isTourModerationDemoRequested(searchParams.get('demo'));
  const backHref = buildTourQueueHref(parseTourQueueQuery(searchParams), demo);
  const result = getPendingTourPost(id, { demo });

  return (
    <div className="min-h-screen bg-[#F7F5EF] pb-24 text-[#1C2928] md:pb-12">
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10">
        <Link
          href={backHref}
          className={`mb-6 inline-flex min-h-11 items-center gap-1 rounded-lg text-sm font-bold text-[#174B4A] hover:underline ${focusRing}`}
        >
          <span className="material-symbols-outlined text-base" aria-hidden="true">
            arrow_back
          </span>
          {copy.backToQueue}
        </Link>

        {result.status === 'NO_BACKEND' ? (
          <>
            <h1 className="sr-only">{tourModerationEn.metadata.detailTitle}</h1>
            <PendingIntegrationNotice body={tourModerationEn.pendingIntegration.detailBody} />
          </>
        ) : result.status === 'NOT_FOUND' ? (
          <section role="status" className="rounded-2xl border border-[#DCE2DD] bg-white p-8 text-center shadow-xs">
            <h1 className="text-lg font-bold text-[#1C2928]">{copy.notFoundTitle}</h1>
            <p className="mt-1 text-sm text-[#5B6E69]">{copy.notFoundBody}</p>
          </section>
        ) : (
          <>
            <DemoModeBanner />
            <header className="mb-8 border-b border-[#DCE2DD] pb-6">
              <p className="text-xs font-bold uppercase tracking-wider text-[#174B4A]">{copy.eyebrow}</p>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#1C2928] md:text-3xl">
                {result.tour.tourName}
              </h1>
              <p className="mt-1 text-sm text-[#5B6E69]">
                <span className="font-semibold">{copy.operatorLabel}: </span>
                {result.tour.operatorName}
                <span aria-hidden="true"> · </span>
                <span className="font-semibold">{copy.locationLabel}: </span>
                {result.tour.location}
              </p>
            </header>
            <TourContent tour={result.tour} />
          </>
        )}
      </main>
    </div>
  );
}
