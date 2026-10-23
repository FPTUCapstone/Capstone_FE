import { tourModerationEn } from '../resources/en';

export const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006b5f]';

export function DemoModeBanner() {
  return (
    <aside
      aria-label={tourModerationEn.demoBanner.label}
      className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
    >
      <span className="material-symbols-outlined text-xl text-amber-700" aria-hidden="true">
        science
      </span>
      <p>
        <strong className="font-bold">{tourModerationEn.demoBanner.label}. </strong>
        {tourModerationEn.demoBanner.body}
      </p>
    </aside>
  );
}

export function PendingIntegrationNotice({ body }: { body: string }) {
  return (
    <section
      role="status"
      aria-labelledby="tour-moderation-pending-title"
      className="rounded-2xl border border-[#c3c6ce] bg-white p-6 text-center shadow-xs sm:p-8"
    >
      <span className="material-symbols-outlined mb-2 text-3xl text-[#006b5f]" aria-hidden="true">
        cloud_off
      </span>
      <h2 id="tour-moderation-pending-title" className="text-lg font-bold text-[#00152a]">
        {tourModerationEn.pendingIntegration.title}
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-sm text-[#43474d]">{body}</p>
    </section>
  );
}
