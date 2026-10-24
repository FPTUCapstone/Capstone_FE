import type { AnalyticsStatus } from '@/features/admin/shared/types/analytics';

interface AnalyticsEmptyStateProps {
  status?: AnalyticsStatus;
  categoryName?: string;
}

export function AnalyticsEmptyState({
  status = 'DATA_SOURCE_NOT_CONNECTED',
  categoryName = 'Analytics',
}: AnalyticsEmptyStateProps) {
  if (status === 'LOADING') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-[#E6E4DD] bg-[#FFFFFF] p-8 text-center shadow-xs"
      >
        <span className="material-symbols-outlined animate-spin text-4xl text-[#758B74]" aria-hidden="true">
          progress_activity
        </span>
        <h3 className="mt-4 text-base font-bold text-[#1C2923]">Connecting to telemetry data...</h3>
        <p className="mt-1 text-xs text-[#74827B]">Retrieving business metrics and reporting logs.</p>
      </div>
    );
  }

  if (status === 'ERROR') {
    return (
      <div
        role="alert"
        className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-[#F2D8B3] bg-[#FBF3E8] p-8 text-center shadow-xs"
      >
        <span className="material-symbols-outlined text-4xl text-[#8F5419]" aria-hidden="true">
          error_outline
        </span>
        <span className="mt-3 inline-flex rounded-full border border-[#F2D8B3] bg-[#F7EBE5] px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#8F5419]">
          ERROR
        </span>
        <h3 className="mt-3 text-lg font-bold text-[#1C2923]">Unable to load analytics metrics</h3>
        <p className="mt-1 max-w-md text-xs leading-relaxed text-[#74827B]">
          The analytics reporting service encountered an error. Check backend connection status and try again.
        </p>
      </div>
    );
  }

  if (status === 'AUTHORIZATION_BLOCKED') {
    return (
      <div
        role="alert"
        className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-[#E6E4DD] bg-[#FFFFFF] p-8 text-center shadow-xs"
      >
        <span className="material-symbols-outlined text-4xl text-[#74827B]" aria-hidden="true">
          lock
        </span>
        <span className="mt-3 inline-flex rounded-full border border-[#D8D5CC] bg-[#EDECE8] px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#4A5851]">
          AUTHORIZATION_BLOCKED
        </span>
        <h3 className="mt-3 text-lg font-bold text-[#1C2923]">Access restricted</h3>
        <p className="mt-1 max-w-md text-xs leading-relaxed text-[#74827B]">
          Your administrative account does not have permission to inspect {categoryName} telemetry streams.
        </p>
      </div>
    );
  }

  if (status === 'NO_DATA') {
    return (
      <div
        role="status"
        className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-[#E6E4DD] bg-[#FFFFFF] p-8 text-center shadow-xs"
      >
        <span className="material-symbols-outlined text-4xl text-[#758B74]" aria-hidden="true">
          query_stats
        </span>
        <span className="mt-3 inline-flex rounded-full border border-[#D8D5CC] bg-[#EDECE8] px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#4A5851]">
          NO_DATA
        </span>
        <h3 className="mt-3 text-lg font-bold text-[#1C2923]">No data recorded for this time range</h3>
        <p className="mt-1 max-w-md text-xs leading-relaxed text-[#74827B]">
          No operational events or transactions were recorded for the selected window. Try selecting a broader period.
        </p>
      </div>
    );
  }

  // Default: DATA_SOURCE_NOT_CONNECTED
  return (
    <div
      role="status"
      className="flex min-h-[380px] flex-col items-center justify-center rounded-2xl border border-[#E6E4DD] bg-[#FFFFFF] p-8 text-center shadow-xs sm:p-12"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E8EFE9] text-[#245747]">
        <span className="material-symbols-outlined text-4xl" aria-hidden="true">
          hub
        </span>
      </div>

      <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#D8D5CC] bg-[#EDECE8] px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#4A5851]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#74827B]" aria-hidden="true" />
        <span>DATA_SOURCE_NOT_CONNECTED</span>
      </span>

      <h3 className="mt-3 text-xl font-bold text-[#1C2923]">No analytics data available</h3>

      <p className="mt-2 max-w-md text-sm leading-relaxed text-[#4A5851]">
        Analytics will appear here when a supported data source is connected.
      </p>

      <p className="mt-4 rounded-xl border border-[#E6E4DD] bg-[#F7F6F2] px-4 py-2.5 text-xs text-[#74827B]">
        {categoryName} metrics require backend reporting endpoints (UC-67 / Platform Analytics telemetry service).
      </p>
    </div>
  );
}
