import Link from 'next/link';

import { adminRoutesEn } from '@/features/admin/routes/resources/en';

export function CreateRouteUnavailableView() {
  const copy = adminRoutesEn.create;
  const formCopy = copy.form;

  return (
    <main className="min-h-screen bg-[#f7f9fc] px-4 py-8 text-[#191c1e] sm:px-6 md:px-8 md:py-10">
      <section className="mx-auto max-w-4xl">
        <header className="rounded-2xl border border-[#314863] bg-[#00152a] p-6 text-white shadow-md sm:p-8">
          <p className="text-xs font-bold tracking-wider text-[#71f8e4] uppercase">{copy.eyebrow}</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">{copy.title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#d1e4ff]">{copy.description}</p>
        </header>

        <section className="mt-6 rounded-2xl border border-[#cfe2f3] bg-[#eef6ff] p-5 sm:p-6">
          <span className="inline-flex rounded-full bg-[#d7f7f1] px-3 py-1 text-xs font-bold text-[#005048]">
            {copy.pendingBadge}
          </span>
          <p className="mt-2 text-sm leading-relaxed text-[#344054]">
            {copy.pendingDescription}
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-[#d0d7de] bg-white p-6 shadow-sm sm:p-8">
          <p id="route-controls-pending-desc" className="sr-only">
            {copy.pendingDescription}
          </p>
          <form aria-label={copy.title} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="route-origin" className="block text-sm font-bold text-[#1d2939]">
                  {formCopy.originLabel}
                </label>
                <select
                  id="route-origin"
                  aria-describedby="route-controls-pending-desc"
                  disabled
                  defaultValue=""
                  className="mt-2 w-full rounded-xl border border-[#d0d7de] bg-[#f2f4f7] px-3.5 py-2.5 text-sm text-[#667085] disabled:cursor-not-allowed"
                >
                  <option value="">{formCopy.originPlaceholder}</option>
                </select>
              </div>
              <div>
                <label htmlFor="route-destination" className="block text-sm font-bold text-[#1d2939]">
                  {formCopy.destinationLabel}
                </label>
                <select
                  id="route-destination"
                  aria-describedby="route-controls-pending-desc"
                  disabled
                  defaultValue=""
                  className="mt-2 w-full rounded-xl border border-[#d0d7de] bg-[#f2f4f7] px-3.5 py-2.5 text-sm text-[#667085] disabled:cursor-not-allowed"
                >
                  <option value="">{formCopy.destinationPlaceholder}</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="route-mode" className="block text-sm font-bold text-[#1d2939]">
                  {formCopy.modeLabel}
                </label>
                <select
                  id="route-mode"
                  aria-describedby="route-controls-pending-desc"
                  disabled
                  defaultValue="driving"
                  className="mt-2 w-full rounded-xl border border-[#d0d7de] bg-[#f2f4f7] px-3.5 py-2.5 text-sm text-[#667085] disabled:cursor-not-allowed"
                >
                  <option value="driving">{formCopy.modeOptions.driving}</option>
                  <option value="motorcycle">{formCopy.modeOptions.motorcycle}</option>
                  <option value="transit">{formCopy.modeOptions.transit}</option>
                  <option value="walking">{formCopy.modeOptions.walking}</option>
                </select>
              </div>
              <div>
                <label htmlFor="route-distance" className="block text-sm font-bold text-[#1d2939]">
                  {formCopy.distanceLabel}
                </label>
                <input
                  id="route-distance"
                  aria-describedby="route-controls-pending-desc"
                  disabled
                  placeholder={formCopy.distancePlaceholder}
                  type="number"
                  step="0.1"
                  className="mt-2 w-full rounded-xl border border-[#d0d7de] bg-[#f2f4f7] px-3.5 py-2.5 text-sm text-[#667085] disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label htmlFor="route-duration" className="block text-sm font-bold text-[#1d2939]">
                  {formCopy.durationLabel}
                </label>
                <input
                  id="route-duration"
                  aria-describedby="route-controls-pending-desc"
                  disabled
                  placeholder={formCopy.durationPlaceholder}
                  type="number"
                  className="mt-2 w-full rounded-xl border border-[#d0d7de] bg-[#f2f4f7] px-3.5 py-2.5 text-sm text-[#667085] disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label htmlFor="route-note" className="block text-sm font-bold text-[#1d2939]">
                {formCopy.noteLabel}
              </label>
              <textarea
                id="route-note"
                aria-describedby="route-controls-pending-desc"
                disabled
                rows={3}
                placeholder={formCopy.notePlaceholder}
                className="mt-2 w-full rounded-xl border border-[#d0d7de] bg-[#f2f4f7] px-3.5 py-2.5 text-sm text-[#667085] disabled:cursor-not-allowed"
              />
            </div>

            <div
              role="region"
              aria-label={formCopy.mapPreviewLabel}
              className="rounded-xl border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-5"
            >
              <p className="text-xs font-bold tracking-wide text-[#475467] uppercase">
                {formCopy.mapPreviewLabel}
              </p>
              <p className="mt-1 text-sm font-semibold text-[#1e293b]">
                {formCopy.mapPreviewPendingTitle}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[#64748b]">
                {formCopy.mapPreviewPendingDescription}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#e4e7ec] pt-6">
              <Link
                href="/admin/routes"
                className="inline-flex items-center justify-center rounded-xl border border-[#d0d7de] bg-white px-4 py-2.5 text-sm font-bold text-[#344054] shadow-sm transition hover:bg-[#f8fafc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006b5f]"
              >
                {copy.backToDirectoryLabel}
              </Link>
              <button
                disabled
                aria-describedby="route-controls-pending-desc"
                type="button"
                className="inline-flex items-center justify-center rounded-xl border border-[#d0d7de] bg-[#f2f4f7] px-5 py-2.5 text-sm font-bold text-[#667085] shadow-sm disabled:cursor-not-allowed"
              >
                {formCopy.submitDisabledLabel}
              </button>
            </div>
          </form>
        </section>
      </section>
    </main>
  );
}
