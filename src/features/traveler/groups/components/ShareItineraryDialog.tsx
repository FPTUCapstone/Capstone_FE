'use client';

import { useEffect, useRef, useState } from 'react';
import { listShareableItineraries, shareItinerary, type ShareableItineraryPage } from '../services/itinerarySharesApi';
import { chatError, type Thread } from './useMessenger';
import { useChatDialog } from './useChatDialog';

const button = 'min-h-10 rounded-xl border border-brand-border px-3 py-2 text-sm font-semibold text-brand-teal hover:bg-brand-lightTeal disabled:opacity-50';
export function ShareItineraryDialog({ thread, onClose, onShared, requestIdFor, onConfirmed }: { thread: Thread; onClose: () => void; onShared: () => void; requestIdFor: (operationId: string) => string; onConfirmed: (operationId: string) => void }) {
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const ref = useChatDialog(() => { if (!savingRef.current) onClose(); });
  const [page, setPage] = useState(1), [retry, setRetry] = useState(0);
  const [result, setResult] = useState<{ page: number; retry: number; data?: ShareableItineraryPage; error?: string } | null>(null);
  const [selected, setSelected] = useState<number | null>(null), [error, setError] = useState('');
  const lifetime = useRef<AbortController | null>(null);
  useEffect(() => { const abort = new AbortController(); lifetime.current = abort; return () => abort.abort(); }, []);
  useEffect(() => {
    const abort = new AbortController();
    listShareableItineraries(page, abort.signal).then(data => {
      if (!abort.signal.aborted) setResult({ page, retry, data });
    }).catch(e => { if (!abort.signal.aborted) setResult({ page, retry, error: chatError(e) }); });
    return () => abort.abort();
  }, [page, retry]);
  const current = result?.page === page && result.retry === retry ? result : null;
  const owned = current?.data?.items.filter(item => item.canManage) ?? [];
  const submit = async () => {
    if (selected === null || savingRef.current) return;
    const operationId = `${thread.key}:${selected}`;
    const requestId = requestIdFor(operationId);
    savingRef.current = true; setSaving(true); setError('');
    try {
      await shareItinerary({ itineraryId: selected, conversationId: thread.id,
        conversationKind: thread.kind === 'direct' ? 'direct' : thread.chatGroup ? 'chat_group' : 'travel_group',
        clientRequestId: requestId }, lifetime.current?.signal);
      onConfirmed(operationId);
      if (!lifetime.current?.signal.aborted) { onShared(); onClose(); }
    } catch (e) { if (!lifetime.current?.signal.aborted) setError(chatError(e)); }
    finally { savingRef.current = false; if (!lifetime.current?.signal.aborted) setSaving(false); }
  };
  return <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="share-itinerary-title" aria-busy={saving} className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div className="flex max-h-[85dvh] w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-white text-brand-textPrimary shadow-xl">
      <header className="flex items-center gap-3 border-b border-brand-border p-4"><h2 id="share-itinerary-title" className="min-w-0 flex-1 text-base font-bold">Chia sẻ lịch trình</h2><button className={button} disabled={saving} onClick={onClose}>Đóng</button></header>
      <div className="min-h-0 space-y-3 overflow-y-auto p-4">
        <p className="text-sm">Gửi đến <strong className="break-words">{thread.title}</strong></p>
        <p className="text-xs leading-relaxed text-brand-textSecondary">Người trong cuộc trò chuyện sẽ xem được bản sao chỉ đọc tại lúc gửi. Không kèm booking hay thanh toán. Sửa lịch trình gốc sau đó không thay đổi bản đã gửi.</p>
        {!current ? <p role="status">Đang tải lịch trình…</p> : current.error ? <div role="alert"><p>{current.error}</p><button className={button} onClick={() => setRetry(n => n + 1)}>Thử lại</button></div> : <>
          {!owned.length && <p className="text-sm text-brand-textSecondary">Trang này chưa có lịch trình do bạn sở hữu. Bạn có thể xem trang tiếp theo hoặc tạo lịch trình mới.</p>}
          <fieldset disabled={saving} className="space-y-2"><legend className="sr-only">Chọn lịch trình của bạn</legend>{owned.map(item => <label key={item.itineraryId} className="flex cursor-pointer items-start gap-3 rounded-xl border border-brand-border p-3 text-sm"><input type="radio" name="shared-itinerary" checked={selected === item.itineraryId} onChange={() => { setSelected(item.itineraryId); setError(''); }} className="mt-1 accent-brand-teal"/><span className="min-w-0 break-words"><span className="block font-semibold">{item.title || `Lịch trình #${item.itineraryId}`}</span><span className="text-xs text-brand-textSecondary">{item.stopCount} điểm dừng · Phiên bản {item.version}</span></span></label>)}</fieldset>
          <div className="flex justify-between gap-2"><button className={button} disabled={saving || page === 1} onClick={() => { setSelected(null); setPage(n => n - 1); }}>Trước</button><span className="self-center text-xs">Trang {page}</span><button className={button} disabled={saving || !current.data || page * current.data.pageSize >= current.data.totalCount} onClick={() => { setSelected(null); setPage(n => n + 1); }}>Tiếp</button></div>
        </>}
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      </div>
      <footer className="border-t border-brand-border p-4"><button type="button" className={`${button} w-full bg-brand-lightTeal`} disabled={selected === null || saving} onClick={() => void submit()}>{saving ? 'Đang chia sẻ…' : 'Gửi bản sao vào cuộc trò chuyện'}</button></footer>
    </div>
  </div>;
}
