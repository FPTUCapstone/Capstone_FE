import type { LandingContent } from '../landingContent';
import { landingContentEn } from '../resources/en';

/** Read-only rendering of the draft. It performs no requests and never touches the published version. */
export function PreviewPanel({ content }: { content: LandingContent }) {
  const copy = landingContentEn.editor.preview;
  const { hero, destinations, banner } = content;

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
          <p className="mt-3 inline-block rounded-lg bg-[#71f8e4] px-3 py-1.5 text-sm font-bold text-[#00152a]">
            {hero.ctaLabel}
          </p>
        )}
      </div>

      {destinations.length > 0 && (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {destinations.map((destination) => (
            <li key={destination.id} className="rounded-xl border border-[#eaecf0] p-3">
              <p className="font-bold text-[#1d2939]">{destination.name}</p>
              <p className="mt-1 text-sm text-[#475467]">{destination.description}</p>
            </li>
          ))}
        </ul>
      )}

      {banner.image && (
        <p className="mt-4 text-sm text-[#475467]">
          {banner.link} · {banner.displayStart} – {banner.displayEnd}
        </p>
      )}
    </section>
  );
}
