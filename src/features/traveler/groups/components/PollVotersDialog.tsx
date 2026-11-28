'use client';
import { useEffect, useState } from 'react';
import { fetchPollVoters, type PollVoter } from '../services/groupMessageToolsApi';
import type { GroupMessageApiDto } from '../services/travelGroupApi';
import { chatError } from './useMessenger';
import { metadataOf } from './MessageCard';
import { useChatDialog } from './useChatDialog';
export function PollVotersDialog({ message, onClose }: { message: GroupMessageApiDto; onClose: () => void }) {
  const ref = useChatDialog(onClose);
  const [voters, setVoters] = useState<PollVoter[]>([]), [loading, setLoading] = useState(true), [error, setError] = useState(''), [retry, setRetry] = useState(0);
  const metadata = metadataOf(message);
  const options = Array.isArray(metadata?.options) ? metadata.options : [];
  useEffect(() => { const abort = new AbortController();
    fetchPollVoters(message.groupId, message.messageId, abort.signal).then(result => { if (!abort.signal.aborted) { setVoters(result); setError(''); } })
      .catch(e => { if (!abort.signal.aborted) { setVoters([]); setError(chatError(e)); } }).finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [message.groupId, message.messageId, retry]);
  return <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="voters-title" className="pointer-events-auto fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"><div className="max-h-[80dvh] w-full max-w-sm space-y-3 overflow-y-auto rounded-2xl bg-white p-4 shadow-xl">
    <header className="flex items-center gap-3"><h2 id="voters-title" className="min-w-0 flex-1 text-sm font-bold">Người bình chọn</h2><button className="rounded-lg px-2 py-2 text-xs hover:bg-brand-lightTeal" onClick={onClose}>Đóng</button></header>
    <p className="break-words text-sm">{message.content}</p>{loading && <p role="status" className="text-xs">Đang tải…</p>}{error && <div role="alert" className="text-xs text-red-700">{error}<button className="ml-2 underline" onClick={() => { setLoading(true); setRetry(v => v + 1); }}>Thử lại</button></div>}
    {!loading && !error && !voters.length && <p className="text-xs text-brand-textSecondary">Chưa có ai bình chọn.</p>}
    {!error && voters.map(v => <div key={v.userId} className="flex min-w-0 gap-2 border-t border-brand-border py-2"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-lightTeal text-xs font-semibold" aria-hidden="true">{v.displayName.trim().slice(0, 1)}</span><div className="min-w-0"><p className="break-words text-xs font-semibold">{v.displayName}</p><p className="break-words text-xs text-brand-textSecondary">{options[v.optionIndex] && typeof options[v.optionIndex].text === 'string' ? options[v.optionIndex].text : `Lựa chọn ${v.optionIndex + 1}`}</p></div></div>)}
  </div></div>;
}
