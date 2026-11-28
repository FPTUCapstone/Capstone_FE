'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { fetchImportantMessages, type ImportantMessagesPage } from '../services/groupMessageToolsApi';
import type { GroupMessageApiDto } from '../services/travelGroupApi';
import { chatError, type Thread } from './useMessenger';
import { useChatDialog } from './useChatDialog';
import { MessageCard, metadataOf } from './MessageCard';
import type { SplitBillData } from '../types/groupChatTypes';

interface Props {
  thread: Thread; userId: number; messages: unknown; busy: boolean; actionError?: string | null;
  onInteract: (message: GroupMessageApiDto, action: 'read' | 'present' | 'paid' | 'vote', index?: number) => Promise<void>;
  onQr: (data: SplitBillData, message: GroupMessageApiDto) => void;
  onEdit: (message: GroupMessageApiDto) => void; onVoters: (message: GroupMessageApiDto) => void;
}
export function GroupHighlights(props: Props) {
  const { thread, messages } = props;
  const [page, setPage] = useState<ImportantMessagesPage>({ items: [], nextBeforeMessageId: null });
  const [open, setOpen] = useState(false), [loading, setLoading] = useState(true), [error, setError] = useState('');
  const flight = useRef<AbortController | null>(null);
  const latestCursor = useRef<number | null>(null);
  const loadedPages = useRef(1);
  const openRef = useRef(false);
  const refresh = useCallback(async (older = false) => {
    if (older && latestCursor.current === null) return;
    flight.current?.abort(); const abort = new AbortController(); flight.current = abort;
    setLoading(true);
    try {
      const result = await fetchImportantMessages(thread.id, older ? latestCursor.current! : undefined, abort.signal);
      if (!older && openRef.current) {
        for (let n = 1; n < loadedPages.current && result.nextBeforeMessageId !== null && !abort.signal.aborted; n++) {
          const next = await fetchImportantMessages(thread.id, result.nextBeforeMessageId, abort.signal);
          result.items = [...result.items, ...next.items]; result.nextBeforeMessageId = next.nextBeforeMessageId;
        }
      }
      if (abort.signal.aborted) return;
      if (older) loadedPages.current++;
      latestCursor.current = result.nextBeforeMessageId;
      setPage(old => ({ items: older ? [...old.items, ...result.items.filter(m => !old.items.some(o => o.messageId === m.messageId))] : result.items, nextBeforeMessageId: result.nextBeforeMessageId })); setError('');
    } catch (e) { if (!abort.signal.aborted) { setError(chatError(e)); setPage({ items: [], nextBeforeMessageId: null }); latestCursor.current = null; } }
    finally { if (!abort.signal.aborted) setLoading(false); }
  }, [thread.id]);
  useEffect(() => { void refresh(); return () => flight.current?.abort(); }, [refresh, messages]);
  const latest = page.items[0];
  const latestData = latest ? metadataOf(latest) : null;
  const latestTitle = typeof latestData?.question === 'string' ? latestData.question
    : typeof latestData?.title === 'string' ? latestData.title : latest?.content;
  return <>
    <section aria-label="Nội dung quan trọng ghim trên cuộc trò chuyện" className="h-9 shrink-0 overflow-hidden border-b border-brand-border bg-brand-lightTeal text-brand-teal">
      <button type="button" aria-label="Bình chọn và thông báo nhóm" aria-haspopup="dialog" onClick={() => { openRef.current = true; setOpen(true); }} className="flex h-9 w-full min-w-0 items-center gap-1.5 px-2 text-left text-xs">
        <span className="material-symbols-outlined !text-[16px]" aria-hidden="true">push_pin</span><span className="shrink-0 font-semibold">Ghim</span>
        <span className="min-w-0 flex-1 truncate" title={page.items[0]?.content}>{latestTitle ?? (loading ? 'Đang tải…' : error ? 'Chưa tải được · Bấm thử lại' : 'Chưa có bình chọn hoặc thông báo')}</span>
        {page.items.length > 0 && <span className="shrink-0 rounded-full bg-white/70 px-1.5 text-[10px]" aria-label={page.nextBeforeMessageId === null ? page.items.length + ' nội dung quan trọng' : 'Có thêm nội dung quan trọng'}>{page.items.length}{page.nextBeforeMessageId !== null ? '+' : ''}</span>}
        <span className="material-symbols-outlined !text-[16px]" aria-hidden="true">chevron_right</span>
      </button>
    </section>
    {open && createPortal(<HighlightDialog {...props} page={page} loading={loading} error={error} onRefresh={refresh} onClose={() => { openRef.current = false; loadedPages.current = 1; setOpen(false); }} />, document.body)}
  </>;
}
function HighlightDialog({ page, loading, error, onRefresh, onClose, ...props }: Props & { page: ImportantMessagesPage; loading: boolean; error: string; onRefresh: (older?: boolean) => Promise<void>; onClose: () => void }) {
  const ref = useChatDialog(onClose);
  return <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="highlights-title" className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><div className="flex max-h-[85dvh] w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
    <header className="flex items-center gap-2 border-b border-brand-border p-3"><h2 id="highlights-title" className="min-w-0 flex-1 text-sm font-bold">Bình chọn và thông báo</h2><button aria-label="Làm mới nội dung quan trọng" className="grid size-9 shrink-0 place-items-center rounded-full hover:bg-brand-lightTeal disabled:opacity-40" disabled={loading} onClick={() => void onRefresh()}><span className="material-symbols-outlined !text-[18px]" aria-hidden="true">refresh</span></button><button className="rounded-lg px-2 py-2 text-xs hover:bg-brand-lightTeal" onClick={onClose}>Đóng</button></header>
    <div className="space-y-3 overflow-y-auto p-3">{(error || props.actionError) && <p role="alert" className="text-xs text-red-700">{error || props.actionError}</p>}{loading && <p role="status" className="text-xs">Đang tải…</p>}{!loading && !error && !page.items.length && <p className="text-xs text-brand-textSecondary">Chưa có bình chọn hoặc thông báo trong nhóm này.</p>}
      {page.items.map(message => <MessageCard key={message.messageId} compact message={message} thread={props.thread} userId={props.userId} busy={props.busy} onInteract={(m, action, index) => { void props.onInteract(m, action, index).then(() => onRefresh()); }} onQr={props.onQr} onEdit={m => { onClose(); props.onEdit(m); }} onVoters={m => { onClose(); props.onVoters(m); }} />)}
      {page.nextBeforeMessageId !== null && <button disabled={loading} className="w-full rounded-lg border border-brand-border py-2 text-xs disabled:opacity-40" onClick={() => void onRefresh(true)}>Xem nội dung trước</button>}
    </div>
  </div></div>;
}
