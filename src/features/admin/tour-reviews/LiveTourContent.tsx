import { FactChip, ServiceList } from './components/TourFacts';
import { tourModerationEn } from './resources/en';
import type { TourReviewDetail } from './services/tourModerationApi';
import { TourReviewDecisionPanel } from './TourReviewDecisionPanel';
import type { ApprovalOutcome } from './services/approvalFeedback';
import { formatDisplayDate, formatDisplayDateTime, formatVnd } from './utils/format';

const copy = tourModerationEn.detail;
const live = tourModerationEn.detailLive;

function optionalPrice(label: string, amount: number | null): string | null {
  return amount === null ? null : `${label}: ${formatVnd(amount)}`;
}

/** Screen 14 backed by the real review detail: shows every input of the five-item checklist. */
export function LiveTourContent({ tour, onApprovalOutcome }: {
  tour: TourReviewDetail;
  onApprovalOutcome: (outcome: ApprovalOutcome) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      <div className="space-y-8 lg:col-span-8">
        <section aria-labelledby="tour-overview-title" className="rounded-2xl border border-[#DCE2DD] bg-white p-6 shadow-xs">
          <dl className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <FactChip label={copy.facts.price} value={formatVnd(tour.priceVnd)} />
            <FactChip label={copy.facts.duration} value={live.durationDays(tour.durationDays)} />
            <FactChip
              label={copy.facts.capacity}
              value={tour.capacity === null ? tourModerationEn.format.unavailable : live.capacity(tour.capacity)}
            />
            <FactChip
              label={copy.facts.departure}
              value={tour.departureAtUtc ? formatDisplayDate(tour.departureAtUtc) : tourModerationEn.live.noDeparture}
            />
          </dl>
          <h2 id="tour-overview-title" className="mb-2 text-base font-bold text-[#1C2928]">
            {copy.overviewTitle}
          </h2>
          <p className="mb-4 whitespace-pre-line text-sm leading-relaxed text-[#5B6E69]">
            {tour.overview ?? tourModerationEn.format.unavailable}
          </p>
          <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-[#5B6E69]">{copy.categoryLabel}</dt>
              <dd className="text-[#1C2928]">{tour.category ?? tourModerationEn.format.unavailable}</dd>
            </div>
            <div>
              <dt className="font-semibold text-[#5B6E69]">{copy.imagesLabel}</dt>
              <dd className="text-[#1C2928]">{tour.imageCount}</dd>
            </div>
          </dl>
          {tour.highlights ? (
            <div className="mt-4">
              <h3 className="mb-1 text-sm font-bold text-[#1C2928]">{live.highlightsTitle}</h3>
              <p className="whitespace-pre-line text-sm text-[#5B6E69]">{tour.highlights}</p>
            </div>
          ) : null}
          {tour.travellerRequirements ? (
            <div className="mt-4">
              <h3 className="mb-1 text-sm font-bold text-[#1C2928]">{live.requirementsTitle}</h3>
              <p className="whitespace-pre-line text-sm text-[#5B6E69]">{tour.travellerRequirements}</p>
            </div>
          ) : null}
        </section>

        <section aria-labelledby="tour-images-title" className="rounded-2xl border border-[#DCE2DD] bg-white p-6 shadow-xs">
          <h2 id="tour-images-title" className="mb-4 text-base font-bold text-[#1C2928]">
            {live.imagesTitle}
          </h2>
          {tour.images.length === 0 ? (
            <p className="text-sm text-[#5B6E69]">{live.noImages}</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {tour.images.map((image, index) => (
                <li key={`${image.url}-${index}`} className="overflow-hidden rounded-xl border border-[#DCE2DD] bg-[#F7F5EF]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt={image.altText}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="aspect-4/3 w-full object-cover"
                  />
                  <p className="px-2 py-1 text-[11px] text-[#5B6E69]">
                    {image.isPrimary ? <strong className="font-bold text-[#174B4A]">{live.primaryImage}. </strong> : null}
                    {image.caption ?? image.altText}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="grid grid-cols-1 gap-6 rounded-2xl border border-[#DCE2DD] bg-white p-6 shadow-xs sm:grid-cols-2">
          <ServiceList title={copy.includedTitle} items={tour.includedServices} emptyLabel={live.noneListed} />
          <ServiceList title={copy.excludedTitle} items={tour.excludedServices} emptyLabel={live.noneListed} />
          <div className="sm:col-span-2">
            <h3 className="mb-2 text-sm font-bold text-[#1C2928]">{copy.cancellationTitle}</h3>
            {tour.cancellationRules.length === 0 ? (
              <p className="text-sm text-[#5B6E69]">{live.noCancellationRules}</p>
            ) : (
              <ul className="list-disc space-y-1 pl-5 text-sm text-[#5B6E69]">
                {tour.cancellationRules.map((rule) => (
                  <li key={rule.daysBeforeDeparture}>{live.cancellationRule(rule.daysBeforeDeparture, rule.feePercent)}</li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section aria-labelledby="tour-schedules-title" className="rounded-2xl border border-[#DCE2DD] bg-white p-6 shadow-xs">
          <h2 id="tour-schedules-title" className="mb-3 text-base font-bold text-[#1C2928]">
            {live.schedulesTitle}
          </h2>
          {tour.schedules.length === 0 ? (
            <p className="text-sm text-[#5B6E69]">{tourModerationEn.live.noDeparture}</p>
          ) : (
            <ul className="space-y-3">
              {tour.schedules.map((schedule) => (
                <li key={schedule.startAtUtc} className="rounded-xl border border-[#DCE2DD] bg-[#F7F5EF] p-3 text-sm">
                  <p className="font-mono text-xs font-bold text-[#1C2928]">
                    {formatDisplayDateTime(schedule.startAtUtc)} → {formatDisplayDateTime(schedule.endAtUtc)}
                  </p>
                  <p className="mt-1 text-[#5B6E69]">
                    {live.capacity(schedule.capacity)}
                    {schedule.meetingPoint ? ` · ${live.meetingPoint}: ${schedule.meetingPoint}` : ''}
                  </p>
                  <p className="mt-1 text-xs text-[#5B6E69]">
                    {[
                      optionalPrice(live.adultPrice, schedule.adultPrice),
                      optionalPrice(live.childPrice, schedule.childPrice),
                      optionalPrice(live.infantPrice, schedule.infantPrice),
                    ]
                      .filter((part): part is string => part !== null)
                      .join(' · ')}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="tour-itinerary-title" className="rounded-2xl border border-[#DCE2DD] bg-white p-6 shadow-xs">
          <h2 id="tour-itinerary-title" className="mb-4 text-lg font-bold text-[#1C2928]">
            {copy.itineraryTitle}
          </h2>
          {tour.itinerary.length === 0 ? (
            <p className="text-sm text-[#5B6E69]">{live.noItinerary}</p>
          ) : (
            <ol className="space-y-3">
              {tour.itinerary.map((stop) => (
                <li key={`${stop.dayNo}-${stop.sequenceNo}`} className="rounded-xl border border-[#DCE2DD] bg-[#F7F5EF] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-bold text-[#1C2928]">
                      Day {stop.dayNo} · {stop.poiName}
                    </h3>
                    <span className="rounded-md bg-[#DCE2DD] px-2 py-1 font-mono text-xs font-bold text-[#1C2928]">
                      {stop.plannedTime ?? tourModerationEn.format.unavailable}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#5B6E69]">{live.stayMinutes(stop.stayMinutes)}</p>
                  {stop.notes ? <p className="mt-2 text-sm leading-relaxed text-[#5B6E69]">{stop.notes}</p> : null}
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <div className="space-y-6 lg:col-span-4">
        <section aria-labelledby="tour-operator-title" className="rounded-2xl border border-[#DCE2DD] bg-white p-5 shadow-xs">
          <h2 id="tour-operator-title" className="mb-2 text-xs font-bold uppercase tracking-wider text-[#5B6E69]">
            {copy.operatorCardTitle}
          </h2>
          <p className="text-sm font-bold text-[#1C2928]">{tour.operatorName}</p>
          <p className="mt-1 text-xs text-[#5B6E69]">{copy.submittedOn(formatDisplayDateTime(tour.submittedAtUtc))}</p>
          {tour.submissionNote && (
            <div className="mt-3 rounded-xl border border-[#DCE2DD] bg-[#F7F5EF] p-3 text-xs text-[#1C2928]">
              <p className="font-bold text-[#5B6E69]">{live.submissionNoteLabel}</p>
              <p className="mt-1 whitespace-pre-line">{tour.submissionNote}</p>
            </div>
          )}
        </section>
        <TourReviewDecisionPanel liveTourId={tour.id} onApprovalOutcome={onApprovalOutcome} />
      </div>
    </div>
  );
}
