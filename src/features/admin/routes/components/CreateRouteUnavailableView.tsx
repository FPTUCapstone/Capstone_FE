import Link from 'next/link';

import { adminRoutesEn } from '@/features/admin/routes/resources/en';

export function CreateRouteUnavailableView() {
  const copy = adminRoutesEn.create;
  const formCopy = copy.form;

  return (
    <div className="pb-16 text-[#1C2923]">
      <section className="mx-auto max-w-4xl">
        <header className="rounded-2xl border border-[#2A3B33] bg-[#1C2923] p-6 text-[#F7F6F2] shadow-sm sm:p-8">
          <p className="text-xs font-bold tracking-wider text-[#758B74] uppercase">{copy.eyebrow}</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{copy.title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#A3B3AB]">{copy.description}</p>
        </header>

        <section className="mt-6 rounded-2xl border border-[#F2D8B3] bg-[#FBF3E8] p-5 sm:p-6 text-[#1C2923]">
          <span className="inline-flex rounded-full border border-[#F2D8B3] bg-[#F7EBE5] px-3 py-1 text-xs font-bold text-[#8F5419]">
            {copy.pendingBadge}
          </span>
          <p className="mt-2 text-sm leading-relaxed text-[#4A5851]">
            {copy.pendingDescription}
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-[#E6E4DD] bg-[#FFFFFF] p-6 shadow-xs sm:p-8">
          <p id="route-controls-pending-desc" className="sr-only">
            {copy.pendingDescription}
          </p>
          <form aria-label={copy.title} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="route-origin" className="block text-sm font-bold text-[#1C2923]">
                  {formCopy.originLabel}
                </label>
                <select
                  id="route-origin"
                  aria-describedby="route-controls-pending-desc"
                  disabled
                  defaultValue=""
                  className="mt-2 w-full rounded-xl border border-[#D8D5CC] bg-[#EDECE8] px-3.5 py-2.5 text-sm text-[#74827B] disabled:cursor-not-allowed"
                >
                  <option value="">{formCopy.originPlaceholder}</option>
                </select>
              </div>
              <div>
                <label htmlFor="route-destination" className="block text-sm font-bold text-[#1C2923]">
                  {formCopy.destinationLabel}
                </label>
                <select
                  id="route-destination"
                  aria-describedby="route-controls-pending-desc"
                  disabled
                  defaultValue=""
                  className="mt-2 w-full rounded-xl border border-[#D8D5CC] bg-[#EDECE8] px-3.5 py-2.5 text-sm text-[#74827B] disabled:cursor-not-allowed"
                >
                  <option value="">{formCopy.destinationPlaceholder}</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="route-mode" className="block text-sm font-bold text-[#1C2923]">
                  {formCopy.modeLabel}
                </label>
                <select
                  id="route-mode"
                  aria-describedby="route-controls-pending-desc"
                  disabled
                  defaultValue="driving"
                  className="mt-2 w-full rounded-xl border border-[#D8D5CC] bg-[#EDECE8] px-3.5 py-2.5 text-sm text-[#74827B] disabled:cursor-not-allowed"
                >
                  <option value="driving">{formCopy.modeOptions.driving}</option>
                  <option value="motorcycle">{formCopy.modeOptions.motorcycle}</option>
                  <option value="transit">{formCopy.modeOptions.transit}</option>
                  <option value="walking">{formCopy.modeOptions.walking}</option>
                </select>
              </div>
              <div>
                <label htmlFor="route-distance" className="block text-sm font-bold text-[#1C2923]">
                  {formCopy.distanceLabel}
                </label>
                <input
                  id="route-distance"
                  aria-describedby="route-controls-pending-desc"
                  disabled
                  placeholder={formCopy.distancePlaceholder}
                  type="number"
                  step="0.1"
                  className="mt-2 w-full rounded-xl border border-[#D8D5CC] bg-[#EDECE8] px-3.5 py-2.5 text-sm text-[#74827B] disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label htmlFor="route-duration" className="block text-sm font-bold text-[#1C2923]">
                  {formCopy.durationLabel}
                </label>
                <input
                  id="route-duration"
                  aria-describedby="route-controls-pending-desc"
                  disabled
                  placeholder={formCopy.durationPlaceholder}
                  type="number"
                  className="mt-2 w-full rounded-xl border border-[#D8D5CC] bg-[#EDECE8] px-3.5 py-2.5 text-sm text-[#74827B] disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label htmlFor="route-note" className="block text-sm font-bold text-[#1C2923]">
                {formCopy.noteLabel}
              </label>
              <textarea
                id="route-note"
                aria-describedby="route-controls-pending-desc"
                disabled
                rows={3}
                placeholder={formCopy.notePlaceholder}
                className="mt-2 w-full rounded-xl border border-[#D8D5CC] bg-[#EDECE8] px-3.5 py-2.5 text-sm text-[#74827B] disabled:cursor-not-allowed"
              />
            </div>

            <div
              role="region"
              aria-label={formCopy.mapPreviewLabel}
              className="rounded-xl border border-dashed border-[#D8D5CC] bg-[#F7F6F2] p-5"
            >
              <p className="text-xs font-bold tracking-wide text-[#4A5851] uppercase">
                {formCopy.mapPreviewLabel}
              </p>
              <p className="mt-1 text-sm font-semibold text-[#1C2923]">
                {formCopy.mapPreviewPendingTitle}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[#74827B]">
                {formCopy.mapPreviewPendingDescription}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#F0EFEA] pt-6">
              <Link
                href="/admin/routes"
                className="inline-flex items-center justify-center rounded-xl border border-[#D8D5CC] bg-white px-4 py-2.5 text-sm font-bold text-[#1C2923] shadow-xs transition hover:bg-[#F0EFEA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#758B74]"
              >
                {copy.backToDirectoryLabel}
              </Link>
              <button
                disabled
                aria-describedby="route-controls-pending-desc"
                type="button"
                className="inline-flex items-center justify-center rounded-xl border border-[#D8D5CC] bg-[#EDECE8] px-5 py-2.5 text-sm font-bold text-[#74827B] shadow-2xs disabled:cursor-not-allowed"
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
