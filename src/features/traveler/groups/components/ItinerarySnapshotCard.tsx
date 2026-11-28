'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { fetchItinerarySnapshot, type ItinerarySnapshot } from '../services/itinerarySharesApi';
import { chatError } from './useMessenger';
import { useChatDialog } from './useChatDialog';

export function ItinerarySnapshotCard({ shareId }: { shareId: string }) {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" onClick={() => setOpen(true)} className="flex w-full items-start gap-2 rounded-xl border border-brand-border bg-white p-3 text-left text-brand-textPrimary hover:bg-brand-lightTeal">
      <span className="material-symbols-outlined !text-[20px] text-brand-teal" aria-hidden="true">route</span>
      <span><span className="block text-sm font-semibold">Lịch trình được chia sẻ</span><span className="text-xs text-brand-textSecondary">Xem bản sao chỉ đọc</span></span>
    </button>
    {open && createPortal(<SnapshotDialog shareId={shareId} onClose={() => setOpen(false)} />, document.body)}
  </>;
}
function SnapshotDialog({ shareId, onClose }: { shareId: string; onClose: () => void }) {
  const ref = useChatDialog(onClose);
  const [result, setResult] = useState<{ data?: ItinerarySnapshot; error?: string; retry: number } | null>(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const abort = new AbortController();
    fetchItinerarySnapshot(shareId, abort.signal).then(data => { if (!abort.signal.aborted) setResult({ data, retry }); })
      .catch(error => { if (!abort.signal.aborted) setResult({ error: chatError(error), retry }); });
    return () => abort.abort();
  }, [shareId, retry]);
  const current = result?.retry === retry ? result : null;
  const time = (date: string | null) => date === null ? 'Chưa có thời gian' : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(date));
  return <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="itinerary-snapshot-title" className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div className="flex max-h-[85dvh] w-full max-w-sm flex-col rounded-2xl bg-white text-brand-textPrimary shadow-xl">
      <header className="flex items-center gap-3 border-b border-brand-border p-4"><h2 id="itinerary-snapshot-title" className="min-w-0 flex-1 text-base font-bold">Lịch trình được chia sẻ</h2><button className="min-h-10 rounded-xl border border-brand-border px-3 text-sm" onClick={onClose}>Đóng</button></header>
      <div className="min-h-0 space-y-3 overflow-y-auto p-4">
        {!current ? <p role="status">Đang tải bản chia sẻ…</p> : current.error ? <div role="alert" className="space-y-3 text-sm"><p>{current.error}</p><button className="rounded-xl border border-brand-border px-3 py-2" onClick={() => setRetry(n => n + 1)}>Thử lại</button></div> : current.data && <>
          <h3 className="break-words text-base font-semibold">{current.data.title}</h3><p className="text-xs text-brand-textSecondary">Bản sao chỉ đọc · Phiên bản {current.data.itineraryVersion} · Chia sẻ {time(current.data.sharedAtUtc)}</p>
          {!current.data.items.length && <p className="text-sm">Lịch trình này chưa có điểm dừng.</p>}
          <ol className="space-y-3">{current.data.items.map((item, i) => <li key={`${item.sequenceNo}:${i}`} className="rounded-xl border border-brand-border p-3"><p className="break-words text-sm font-semibold">{item.sequenceNo}. {item.name}</p><p className="mt-1 text-xs text-brand-textSecondary">{time(item.arrivalUtc)} – {time(item.departureUtc)}</p>{item.address && <p className="mt-1 break-words text-xs">{item.address}</p>}</li>)}</ol>
        </>}
      </div>
    </div>
  </div>;
}
