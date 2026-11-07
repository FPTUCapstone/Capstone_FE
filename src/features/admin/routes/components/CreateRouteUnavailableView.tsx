import Link from 'next/link';

import { adminRoutesEn } from '@/features/admin/routes/resources/en';

export function CreateRouteUnavailableView() {
  const copy = adminRoutesEn.create;
  const formCopy = copy.form;

  return (
    <div className="pb-16 text-[#1C2928]">
      <section className="mx-auto max-w-4xl">
        <header className="rounded-2xl border border-[#103B39] bg-[#1C2928] p-6 text-[#F7F5EF] shadow-sm sm:p-8">
          <p className="text-xs font-bold tracking-wider text-[#5B6E69] uppercase">{copy.eyebrow}</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{copy.title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#5B6E69]">{copy.description}</p>
        </header>

        <section className="mt-6 rounded-2xl border border-[#F2D8B3] bg-[#FBF3E8] p-5 sm:p-6 text-[#1C2928]">
          <span className="inline-flex rounded-full border border-[#F2D8B3] bg-[#F7EBE5] px-3 py-1 text-xs font-bold text-[#8F5419]">
            {copy.pendingBadge}
          </span>
          <p className="mt-2 text-sm leading-relaxed text-[#5B6E69]">
            {copy.pendingDescription}
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-[#DCE2DD] bg-[#FFFFFF] p-6 shadow-xs sm:p-8">
          <p id="route-controls-pending-desc" className="sr-only">
            {copy.pendingDescription}
          </p>
          <form aria-label={copy.title} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="route-origin" className="block text-sm font-bold text-[#1C2928]">
                  {formCopy.originLabel}
                </label>
                <select
                  id="route-origin"
                  aria-describedby="route-controls-pending-desc"
                  disabled
                  defaultValue=""
                  className="mt-2 w-full rounded-xl border border-[#DCE2DD] bg-[#F7F5EF] px-3.5 py-2.5 text-sm text-[#5B6E69] disabled:cursor-not-allowed"
                >
                  <option value="">{formCopy.originPlaceholder}</option>
                </select>
              </div>
              <div>
                <label htmlFor="route-destination" className="block text-sm font-bold text-[#1C2928]">
                  {formCopy.destinationLabel}
                </label>
                <select
                  id="route-destination"
                  aria-describedby="route-controls-pending-desc"
                  disabled
                  defaultValue=""
                  className="mt-2 w-full rounded-xl border border-[#DCE2DD] bg-[#F7F5EF] px-3.5 py-2.5 text-sm text-[#5B6E69] disabled:cursor-not-allowed"
                >
                  <option value="">{formCopy.destinationPlaceholder}</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="route-mode" className="block text-sm font-bold text-[#1C2928]">
                  {formCopy.modeLabel}
                </label>
                <select
                  id="route-mode"
                  aria-describedby="route-controls-pending-desc"
                  disabled
                  defaultValue="driving"
                  className="mt-2 w-full rounded-xl border border-[#DCE2DD] bg-[#F7F5EF] px-3.5 py-2.5 text-sm text-[#5B6E69] disabled:cursor-not-allowed"
                >
                  <option value="driving">{formCopy.modeOptions.driving}</option>
                  <option value="motorcycle">{formCopy.modeOptions.motorcycle}</option>
                  <option value="transit">{formCopy.modeOptions.transit}</option>
                  <option value="walking">{formCopy.modeOptions.walking}</option>
                </select>
              </div>
              <div>
                <label htmlFor="route-distance" className="block text-sm font-bold text-[#1C2928]">
                  {formCopy.distanceLabel}
                </label>
                <input
                  id="route-distance"
                  aria-describedby="route-controls-pending-desc"
                  disabled
                  placeholder={formCopy.distancePlaceholder}
                  type="number"
                  step="0.1"
                  className="mt-2 w-full rounded-xl border border-[#DCE2DD] bg-[#F7F5EF] px-3.5 py-2.5 text-sm text-[#5B6E69] disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label htmlFor="route-duration" className="block text-sm font-bold text-[#1C2928]">
                  {formCopy.durationLabel}
                </label>
                <input
                  id="route-duration"
                  aria-describedby="route-controls-pending-desc"
                  disabled
                  placeholder={formCopy.durationPlaceholder}
                  type="number"
                  className="mt-2 w-full rounded-xl border border-[#DCE2DD] bg-[#F7F5EF] px-3.5 py-2.5 text-sm text-[#5B6E69] disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label htmlFor="route-note" className="block text-sm font-bold text-[#1C2928]">
                {formCopy.noteLabel}
              </label>
              <textarea
                id="route-note"
                aria-describedby="route-controls-pending-desc"
                disabled
                rows={3}
                placeholder={formCopy.notePlaceholder}
                className="mt-2 w-full rounded-xl border border-[#DCE2DD] bg-[#F7F5EF] px-3.5 py-2.5 text-sm text-[#5B6E69] disabled:cursor-not-allowed"
              />
            </div>

            <div
              role="region"
              aria-label={formCopy.mapPreviewLabel}
              className="rounded-xl border border-dashed border-[#DCE2DD] bg-[#F7F5EF] p-5"
            >
              <p className="text-xs font-bold tracking-wide text-[#5B6E69] uppercase">
                {formCopy.mapPreviewLabel}
              </p>
              <p className="mt-1 text-sm font-semibold text-[#1C2928]">
                {formCopy.mapPreviewPendingTitle}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[#5B6E69]">
                {formCopy.mapPreviewPendingDescription}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#F7F5EF] pt-6">
              <Link
                href="/admin/routes"
                className="inline-flex items-center justify-center rounded-xl border border-[#DCE2DD] bg-white px-4 py-2.5 text-sm font-bold text-[#1C2928] shadow-xs transition hover:bg-[#F7F5EF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B6E69]"
              >
                {copy.backToDirectoryLabel}
              </Link>
              <button
                disabled
                aria-describedby="route-controls-pending-desc"
                type="button"
                className="inline-flex items-center justify-center rounded-xl border border-[#DCE2DD] bg-[#F7F5EF] px-5 py-2.5 text-sm font-bold text-[#5B6E69] shadow-2xs disabled:cursor-not-allowed"
              >
                {formCopy.submitDisabledLabel}
              </button>
            </div>
          </form>
        </section>
      </section>
    </div>
  );
}
