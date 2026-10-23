import { operatorApplicationQueueEn } from '../resources/en';

export const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006b5f]';

export function DemoModeBanner() {
  return (
    <aside
      aria-label={operatorApplicationQueueEn.demoBanner.label}
      className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
    >
      <span className="material-symbols-outlined text-xl text-amber-700" aria-hidden="true">
        science
      </span>
      <p>
        <strong className="font-bold">{operatorApplicationQueueEn.demoBanner.label}. </strong>
        {operatorApplicationQueueEn.demoBanner.body}
      </p>
    </aside>
  );
}

export function PendingIntegrationNotice() {
  return (
    <section
      role="status"
      aria-labelledby="operator-application-pending-title"
      className="rounded-2xl border border-[#c3c6ce] bg-white p-6 text-center shadow-xs sm:p-8"
    >
      <span className="material-symbols-outlined mb-2 text-3xl text-[#006b5f]" aria-hidden="true">
        cloud_off
      </span>
      <h2 id="operator-application-pending-title" className="text-lg font-bold text-[#00152a]">
        {operatorApplicationQueueEn.pendingIntegration.title}
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-sm text-[#43474d]">
        {operatorApplicationQueueEn.pendingIntegration.body}
      </p>
    </section>
  );
}
