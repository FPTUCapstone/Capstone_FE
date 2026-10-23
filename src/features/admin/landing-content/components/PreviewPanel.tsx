import type { LandingContent, TourOption } from '../landingContent';
import { landingContentEn } from '../resources/en';

/** Display-only banner dates use the business date selected by Staff, not the browser's local timezone. */
function formatPreviewDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
}

/** Read-only rendering of the draft. It performs no requests and never touches the published version. */
export function PreviewPanel({ content, tours = [] }: { content: LandingContent; tours?: TourOption[] }) {
  const copy = landingContentEn.editor.preview;
  const { hero, destinations, featuredTourIds, banner } = content;
  const featuredTours = featuredTourIds.map((tourId) => tours.find((tour) => tour.tourId === tourId) ?? {
    tourId,
    title: tourId,
  });

  return (
    <section aria-label={copy.title} className="rounded-2xl border border-dashed border-[#98a2b3] bg-white p-5 sm:p-6">
      <h2 className="text-lg font-extrabold text-[#00152a]">{copy.title}</h2>
      <p className="mt-1 text-xs text-[#667085]">{copy.note}</p>

      <div className="mt-4 rounded-xl bg-[#00152a] p-5 text-white">
        {hero.backgroundImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hero.backgroundImage.url} alt="" className="mb-3 max-h-40 w-full rounded-lg object-cover" />
        )}
        <p className="text-xl font-extrabold">{hero.headline}</p>
        {hero.subHeadline && <p className="mt-1 text-sm text-[#d1e4ff]">{hero.subHeadline}</p>}
        {hero.ctaLabel && (
          <div className="mt-3">
            <p className="inline-block rounded-lg bg-[#71f8e4] px-3 py-1.5 text-sm font-bold text-[#00152a]">
              {hero.ctaLabel}
            </p>
            {hero.ctaTarget && <p className="mt-2 text-xs text-[#d1e4ff]">{copy.ctaTarget}: {hero.ctaTarget}</p>}
          </div>
        )}
      </div>

      {destinations.length > 0 && (
        <ul aria-label={copy.destinations} className="mt-4 grid gap-3 sm:grid-cols-2">
          {destinations.map((destination) => (
            <li key={destination.id} className="rounded-xl border border-[#eaecf0] p-3">
              {destination.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={destination.image.url}
                  alt={`${destination.name} destination image`}
                  className="mb-3 h-32 w-full rounded-lg object-cover"
                />
              )}
              <p className="font-bold text-[#1d2939]">{destination.name}</p>
              <p className="mt-1 text-sm text-[#475467]">{destination.description}</p>
            </li>
          ))}
        </ul>
      )}

      {featuredTours.length > 0 && (
        <section className="mt-4 rounded-xl border border-[#eaecf0] p-3">
          <h3 className="font-bold text-[#1d2939]">{copy.featuredTours}</h3>
          <ol aria-label={copy.featuredToursList} className="mt-2 list-inside list-decimal space-y-1 text-sm text-[#475467]">
            {featuredTours.map((tour) => <li key={tour.tourId}>{tour.title}</li>)}
          </ol>
        </section>
      )}

      {banner.image && (
        <section className="mt-4 overflow-hidden rounded-xl border border-[#eaecf0]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={banner.image.url} alt={copy.bannerImage} className="h-32 w-full object-cover" />
          <p className="p-3 text-sm text-[#475467]">
            {banner.link} · {formatPreviewDate(banner.displayStart)} – {formatPreviewDate(banner.displayEnd)}
          </p>
        </section>
      )}
    </section>
  );
}
