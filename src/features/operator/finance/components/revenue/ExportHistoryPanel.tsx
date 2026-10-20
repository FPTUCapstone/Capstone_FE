'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { financeEn } from '../../resources/en';
import { formatFinanceDateTime } from '../../utils/financeFormat';
import {
  downloadRevenueExport,
  getRevenueExportHistory,
} from '../../services/operatorRevenueService';
import type { RevenueExportRecord, RevenueExportStatus } from '../../types/revenueLifecycle';

const POLL_INTERVAL_MS = 10_000;

const STATUS_BADGE: Record<RevenueExportStatus, { label: keyof typeof financeEn.exportHistory; className: string }> = {
  Queued: { label: 'statusQueued', className: 'bg-slate-100 text-slate-600' },
  Processing: { label: 'statusProcessing', className: 'bg-blue-50 text-blue-700' },
  Ready: { label: 'statusReady', className: 'bg-emerald-50 text-emerald-700' },
  Failed: { label: 'statusFailed', className: 'bg-rose-50 text-rose-700' },
  Expired: { label: 'statusExpired', className: 'bg-slate-100 text-slate-400' },
};

interface ExportHistoryPanelProps {
  isDemo?: boolean;
  demoActorUserId?: number | string;
  /** Bump this from the parent right after a create-export action to force an immediate refresh. */
  refreshToken: number;
}

export function ExportHistoryPanel({
  isDemo = false,
  demoActorUserId,
  refreshToken,
}: ExportHistoryPanelProps) {
  const [items, setItems] = useState<RevenueExportRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    const result = await getRevenueExportHistory({ isDemo, demoActorUserId });
    if (!isMountedRef.current) return;
    // A failed fetch (network error, expired session, 5xx) must never be mistaken for "no
    // exports yet": the backend reports failure via errorMessage with items left empty, so the
    // caller must branch on it instead of rendering items unconditionally.
    if (result.errorMessage) {
      setLoadError(result.errorMessage);
      setItems([]);
    } else {
      setLoadError(null);
      setItems(result.items);
    }
    setIsLoading(false);
  }, [isDemo, demoActorUserId]);

  // refreshToken intentionally forces this effect to re-run even when isDemo/demoActorUserId
  // have not changed, so a just-created export shows up without waiting for the next poll.
  useEffect(() => {
    void load();
  }, [load, refreshToken]);

  // Poll only while something is still Queued/Processing; stop as soon as nothing is pending.
  useEffect(() => {
    const hasPending = items.some(
      (item) => item.status === 'Queued' || item.status === 'Processing'
    );
    if (!hasPending) return;

    const intervalId = setInterval(() => {
      void load();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [items, load]);

  const handleDownload = async (record: RevenueExportRecord) => {
    if (!record.fileName) return;
    setDownloadError(null);
    setDownloadingId(record.id);
    try {
      const result = await downloadRevenueExport(record.id, record.fileName);
      if (!result.success) {
        setDownloadError(result.message || financeEn.messages.MSG106);
      }
    } finally {
      if (isMountedRef.current) setDownloadingId(null);
    }
  };

  return (
    <section
      aria-label={financeEn.exportHistory.title}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs"
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-sm font-bold text-[#00152A]">{financeEn.exportHistory.title}</h3>
          <p className="text-xs text-slate-500">{financeEn.exportHistory.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[14px]">refresh</span>
          {financeEn.exportHistory.refreshBtn}
        </button>
      </div>

      {downloadError && (
        <div
          role="alert"
          className="mt-3 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700"
        >
          <span className="material-symbols-outlined text-[16px]">error</span>
          <span>{downloadError}</span>
        </div>
      )}

      {loadError && (
        <div
          role="alert"
          className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">error</span>
            <span>{loadError}</span>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="shrink-0 font-semibold underline hover:no-underline"
          >
            {financeEn.exportHistory.refreshBtn}
          </button>
        </div>
      )}

      {isLoading ? (
        <p className="mt-4 text-xs text-slate-400" role="status">
          {financeEn.revenue.lastUpdatedPrefix}…
        </p>
      ) : loadError ? null : items.length === 0 ? (
        <div className="my-8 flex flex-col items-center justify-center text-center text-slate-400">
          <span className="material-symbols-outlined text-3xl">folder_off</span>
          <p className="mt-2 text-xs">{financeEn.exportHistory.empty}</p>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
            <thead className="bg-slate-50 font-semibold text-slate-700">
              <tr>
                <th scope="col" className="px-4 py-3">
                  {financeEn.exportHistory.colRequested}
                </th>
                <th scope="col" className="px-4 py-3">
                  {financeEn.exportHistory.colStatus}
                </th>
                <th scope="col" className="px-4 py-3">
                  {financeEn.exportHistory.colExpires}
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  {financeEn.exportHistory.colActions}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-600">
              {items.map((item) => {
                const badge = STATUS_BADGE[item.status];
                const canDownload = item.status === 'Ready' && Boolean(item.downloadUrl);
                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5">{formatFinanceDateTime(item.requestedAtUtc)}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${badge.className}`}
                      >
                        {financeEn.exportHistory[badge.label]}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {item.expiresAtUtc ? formatFinanceDateTime(item.expiresAtUtc) : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {canDownload && (
                        <button
                          type="button"
                          onClick={() => void handleDownload(item)}
                          disabled={downloadingId === item.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#006B5F]/30 bg-[#006B5F]/5 px-3 py-1.5 text-[11px] font-semibold text-[#006B5F] transition-colors hover:bg-[#006B5F]/10 disabled:opacity-50"
                        >
                          <span aria-hidden="true" className="material-symbols-outlined text-[14px]">download</span>
                          {downloadingId === item.id
                            ? financeEn.exportHistory.downloadingBtn
                            : financeEn.exportHistory.downloadBtn}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
