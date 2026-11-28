'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { getApiBase } from '@/lib/apiBase';
import { fetchFriendships } from '../services/friendshipsApi';
import { searchChatUsers, type ChatUser } from '../services/directChatApi';
import { chatRequest, TravelGroupHttpError, type GroupConversation } from '../services/travelGroupApi';
import { createChatGroup, type ChatGroupConversation } from '../services/chatGroupApi';
import { useChatDialog } from './useChatDialog';
import { chatError } from './useMessenger';

const control = 'rounded-xl border border-brand-border px-3 py-2 text-sm font-semibold text-brand-teal disabled:opacity-40';
interface Trip { itineraryId: number; title: string | null; canManage: boolean }
export function CreateGroupDialog({ userId, canCreateTravel, onClose, onChatCreated, onTravelCreated }: { userId: number; canCreateTravel: boolean; onClose: () => void; onChatCreated: (group: ChatGroupConversation) => void; onTravelCreated: (group: GroupConversation) => void }) {
  const ref = useChatDialog(onClose);
  const [kind, setKind] = useState<'chat' | 'travel'>('chat');
  const [name, setName] = useState('');
  const maxNameLength = kind === 'travel' ? 150 : 100;
  const [query, setQuery] = useState('');
  const [people, setPeople] = useState<ChatUser[]>([]);
  const [selected, setSelected] = useState<ChatUser[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripId, setTripId] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const lifetime = useRef<AbortController | null>(null);
  const flight = useRef(false);
  const attempt = useRef<{ signature: string; key: string } | null>(null);
  useEffect(() => { const abort = new AbortController(); lifetime.current = abort; return () => abort.abort(); }, []);
  useEffect(() => {
    const abort = new AbortController();
    const load = async () => {
      try {
        if (kind === 'chat') {
          const rows = query.trim().length >= 2 ? await searchChatUsers(query, abort.signal) : (await fetchFriendships(abort.signal)).filter(row => row.status === 'Accepted');
          if (!abort.signal.aborted) setPeople(rows.filter(row => row.userId !== userId));
        } else {
          const data = await chatRequest<{ items: Trip[]; totalCount: number }>(`${getApiBase()}/itineraries?page=${page}&pageSize=20`, 'GET', undefined, abort.signal);
          if (!Array.isArray(data.items) || !Number.isSafeInteger(data.totalCount)) throw Error('Invalid itinerary response');
          if (!abort.signal.aborted) { setTrips(old => page === 1 ? data.items.filter(row => row.canManage) : [...old, ...data.items.filter(row => row.canManage)]); setHasMore(page * 20 < data.totalCount); }
        }
      } catch (e) { if (!abort.signal.aborted) setError(chatError(e)); }
      finally { if (!abort.signal.aborted) setLoading(false); }
    };
    const timer = setTimeout(() => void load(), kind === 'chat' && query ? 300 : 0);
    return () => { abort.abort(); clearTimeout(timer); };
  }, [kind, query, page, revision, userId]);
  const changeKind = (value: 'chat' | 'travel') => { if (busy) return; setKind(value); setError(''); setLoading(true); setPage(1); };
  const submit = async () => {
    if (flight.current) return;
    if (!name.trim() || name.trim().length > maxNameLength) { setError(`Tên nhóm cần từ 1 đến ${maxNameLength} ký tự.`); return; }
    if (kind === 'chat' && (selected.length < 2 || selected.length > 49)) { setError('Chọn từ 2 đến 49 người khác để tạo nhóm chat.'); return; }
    if (kind === 'travel' && !tripId) { setError('Chọn lịch trình của bạn để tạo nhóm du lịch.'); return; }
    const signature = JSON.stringify({ kind, name: name.trim(), ids: selected.map(p => p.userId).sort((a,b) => a-b), tripId });
    if (attempt.current?.signature !== signature) attempt.current = { signature, key: crypto.randomUUID() };
    flight.current = true; setBusy(true); setError('');
    const signal = lifetime.current?.signal;
    try {
      if (kind === 'chat') {
        const group = await createChatGroup(name.trim(), selected.map(p => p.userId), attempt.current.key, signal);
        if (!signal?.aborted) { onChatCreated(group); onClose(); }
      } else {
        const group = await chatRequest<{ groupId: number; groupName: string; itineraryId: number; hostUserId: number }>(`${getApiBase()}/travel-groups`, 'POST', { itineraryId: Number(tripId), groupName: name.trim() }, signal, { 'Idempotency-Key': attempt.current.key });
        if (!Number.isSafeInteger(group.groupId) || group.groupId <= 0) throw Error('Invalid group response');
        if (!signal?.aborted) { onTravelCreated({ ...group, itineraryTitle: trips.find(t => String(t.itineraryId) === tripId)?.title ?? 'Lịch trình', itinerarySourceType: 'Manual', memberCount: 1, status: 'Active', lastMessage: null, lastMessageAtUtc: null, unreadCount: 0 }); onClose(); }
      }
    } catch(e) { if (!signal?.aborted) {
      const message = e instanceof TravelGroupHttpError && e.status === 400 && kind === 'chat'
        ? 'Một hoặc nhiều người được chọn hiện không thể tham gia. Hãy tìm và chọn lại.'
        : e instanceof TravelGroupHttpError && e.status === 404 && kind === 'travel'
        ? 'Lịch trình này không còn khả dụng hoặc bạn không có quyền quản lý. Hãy tải lại danh sách.'
        : e instanceof TravelGroupHttpError && e.status === 409
        ? 'Yêu cầu tạo nhóm đang xung đột. Hãy tải lại danh sách nhóm trước khi thử lại.' : chatError(e);
      setError(message);
    } }
    finally { flight.current = false; if (!signal?.aborted) setBusy(false); }
  };
  return <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="create-group-title" className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><form className="flex max-h-[85dvh] w-full max-w-sm flex-col rounded-2xl bg-white shadow-xl" onSubmit={e => { e.preventDefault(); void submit(); }}>
    <header className="flex items-center justify-between gap-3 border-b border-brand-border p-4"><h2 id="create-group-title" className="text-base font-bold">Tạo nhóm mới</h2><button type="button" className={control} onClick={onClose} aria-label="Đóng tạo nhóm">Đóng</button></header>
    <div className="space-y-4 overflow-y-auto p-4">
      <div className="flex flex-wrap gap-2"><button type="button" className={`${control} ${kind === 'chat' ? 'bg-brand-lightTeal' : ''}`} aria-pressed={kind === 'chat'} disabled={busy} onClick={() => changeKind('chat')}>Nhóm chat</button>{canCreateTravel && <button type="button" className={`${control} ${kind === 'travel' ? 'bg-brand-lightTeal' : ''}`} aria-pressed={kind === 'travel'} disabled={busy} onClick={() => changeKind('travel')}>Nhóm du lịch</button>}</div>
      <label className="block text-sm font-semibold">Tên nhóm<input required maxLength={maxNameLength} disabled={busy} value={name} onChange={e => setName(e.target.value)} className="mt-2 w-full rounded-xl border border-brand-border p-2.5 font-normal" /></label>
      {kind === 'chat' ? <><p className="text-xs text-brand-textSecondary">Bạn là trưởng nhóm. Chọn ít nhất 2 người khác; tối đa 50 người tính cả bạn.</p><label className="block text-sm">Tìm người tham gia<input disabled={busy} value={query} maxLength={100} onChange={e => { setQuery(e.target.value); setPeople([]); setLoading(true); setError(''); }} placeholder="Tên người dùng (ít nhất 2 ký tự)" className="mt-2 w-full rounded-xl border border-brand-border p-3" /></label><p className="text-xs text-brand-textSecondary">Đã chọn {selected.length}/49</p><div className="flex flex-wrap gap-2">{selected.map(person => <button type="button" key={person.userId} className={`${control} max-w-full truncate`} disabled={busy} aria-label={`Bỏ chọn ${person.displayName}`} onClick={() => setSelected(old => old.filter(p => p.userId !== person.userId))}>{person.displayName} ×</button>)}</div><ul className="space-y-2">{people.map(person => <li key={person.userId}><label className="flex items-center gap-3 rounded-xl border border-brand-border p-3 text-sm"><input type="checkbox" checked={selected.some(p => p.userId === person.userId)} disabled={busy || (selected.length >= 49 && !selected.some(p => p.userId === person.userId))} onChange={e => setSelected(old => e.target.checked ? [...old.filter(p => p.userId !== person.userId),person] : old.filter(p => p.userId !== person.userId))} /><span className="min-w-0 break-words">{person.displayName}</span></label></li>)}</ul>{!loading && !people.length && !error && <p className="text-sm text-brand-textSecondary">{query.trim().length >= 2 ? 'Không tìm thấy người phù hợp.' : 'Chưa có bạn bè. Nhập tên để tìm người đang hoạt động.'}</p>}</> : <><p className="text-xs text-brand-textSecondary">Nhóm này liên kết với một lịch trình bạn sở hữu. Tạo xong, bạn có thể chia sẻ mã mời cho người cùng chuyến đi.</p><label className="block text-sm">Lịch trình<select required value={tripId} disabled={busy} onChange={e => setTripId(e.target.value)} className="mt-2 w-full rounded-xl border border-brand-border p-3"><option value="">Chọn lịch trình</option>{trips.map(trip => <option key={trip.itineraryId} value={trip.itineraryId}>{trip.title || `Lịch trình #${trip.itineraryId}`}</option>)}</select></label>{hasMore && <button type="button" className={control} disabled={loading || busy} onClick={() => { setLoading(true); setPage(old => old + 1); }}>Tải thêm lịch trình</button>}{!loading && !trips.length && !error && <p className="text-sm">Chưa có lịch trình phù hợp. <Link href="/plan" className="text-brand-teal underline">Lập lịch trình mới</Link></p>}</>}
      {loading && <p role="status" className="text-sm">Đang tải…</p>}{error && <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}<button type="button" className="ml-2 underline" disabled={busy} onClick={() => { setError(''); setLoading(true); setRevision(v=>v+1); }}>Tải lại danh sách</button></div>}
    </div><footer className="flex justify-end gap-2 border-t border-brand-border p-4"><button type="button" className={control} onClick={onClose}>Hủy</button><button type="submit" disabled={busy} className="rounded-xl bg-brand-teal px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Đang tạo…' : 'Tạo nhóm'}</button></footer>
  </form></div>;
}
