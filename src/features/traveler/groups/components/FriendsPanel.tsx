'use client';

import { useEffect, useRef, useState } from 'react';
import { searchChatUsers, type ChatUser } from '../services/directChatApi';
import { fetchFriendships, changeFriendship, type Friendship, type FriendshipAction } from '../services/friendshipsApi';
import { useChatDialog } from './useChatDialog';
import { chatError } from './useMessenger';

const button = 'inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-xl border border-brand-border px-3 py-2 text-xs font-semibold text-brand-teal hover:bg-brand-lightTeal focus-visible:outline-2 focus-visible:outline-brand-teal disabled:opacity-50';
interface FriendsPanelProps { userId: number; onClose: () => void; onOpen: (id: number) => Promise<void> }
export function FriendsPanel(props: FriendsPanelProps) {
  return <FriendsPanelContent key={props.userId} {...props} />;
}
function FriendsPanelContent({ userId, onClose, onOpen }: FriendsPanelProps) {
  const ref = useChatDialog(onClose);
  const [rows, setRows] = useState<Friendship[]>([]);
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [tab, setTab] = useState<'friends' | 'requests' | 'find'>('friends');
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [searching, setSearching] = useState(false);
  const [listError, setListError] = useState('');
  const [searchError, setSearchError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState<number | null>(null);
  const [revision, setRevision] = useState(0);
  const lifetime = useRef<AbortController | null>(null);
  const flight = useRef(false);
  useEffect(() => {
    const abort = new AbortController(); lifetime.current = abort;
    return () => { abort.abort(); flight.current = false; };
  }, [userId]);
  useEffect(() => {
    const abort = new AbortController();
    fetchFriendships(abort.signal).then(data => { if (!abort.signal.aborted) { setRows(data); setLoaded(true); setListError(''); } })
      .catch(e => { if (!abort.signal.aborted) { setLoaded(false); setListError(chatError(e)); } })
      .finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [revision, userId]);
  useEffect(() => {
    const abort = new AbortController();
    const shouldSearch = tab === 'find' && query.trim().length >= 2;
    const timer = setTimeout(async () => {
      if (!shouldSearch) return;
      try { const result = await searchChatUsers(query, abort.signal); if (!abort.signal.aborted) setUsers(result); }
      catch (e) { if (!abort.signal.aborted) setSearchError(chatError(e)); }
      finally { if (!abort.signal.aborted) setSearching(false); }
    }, 300);
    return () => { abort.abort(); clearTimeout(timer); };
  }, [query, revision, tab, userId]);
  const refresh = () => {
    setLoading(true); setActionError(''); setListError(''); setSearchError(''); setUsers([]);
    setSearching(tab === 'find' && query.trim().length >= 2);
    setRevision(v => v + 1);
  };
  const act = async (id: number, action: FriendshipAction | 'message') => {
    if (flight.current || (action !== 'message' && (!loaded || loading))) return;
    const owner = lifetime.current;
    flight.current = true; setBusy(id); setActionError('');
    try {
      if (action === 'message') await onOpen(id);
      else { await changeFriendship(id, action, owner?.signal); if (!owner?.signal.aborted) refresh(); }
    } catch (e) { if (!owner?.signal.aborted) setActionError(chatError(e)); }
    finally { if (lifetime.current === owner && !owner?.signal.aborted) { flight.current = false; setBusy(null); } }
  };
  const error = actionError || (tab === 'find' ? searchError || listError : listError);
  const listed = tab === 'find' ? users : rows.filter(row => tab === 'friends' ? row.status === 'Accepted' : row.status === 'Pending');
  return <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="friends-title" className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 text-sm sm:p-4"><div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-sm flex-col rounded-2xl bg-white shadow-xl">
    <header className="flex shrink-0 items-center justify-between gap-2 border-b border-brand-border p-4"><h2 id="friends-title" className="min-w-0 text-base font-bold">Bạn bè và lời mời</h2><div className="flex shrink-0 gap-1"><button className={button} disabled={loading || busy !== null} onClick={refresh} aria-label="Tải lại bạn bè"><span className="material-symbols-outlined text-lg" aria-hidden="true">refresh</span></button><button className={button} onClick={onClose} aria-label="Đóng bạn bè"><span className="material-symbols-outlined text-lg" aria-hidden="true">close</span></button></div></header>
    <div className="grid shrink-0 grid-cols-3 gap-2 px-4 py-3">{([['friends', 'Bạn bè'], ['requests', 'Lời mời'], ['find', 'Tìm người']] as const).map(([value, label]) => <button className={`${button} ${tab === value ? 'bg-brand-lightTeal' : ''}`} aria-pressed={tab === value} key={value} onClick={() => { setTab(value); setActionError(''); setUsers([]); setSearchError(''); setSearching(value === 'find' && query.trim().length >= 2); }}>{label}</button>)}</div>
    {tab === 'find' && <label className="px-4">Tên người dùng<input autoFocus maxLength={100} className="mt-2 w-full rounded-xl border border-brand-border p-3" placeholder="Nhập ít nhất 2 ký tự tên" value={query} onChange={e => { setQuery(e.target.value); setUsers([]); setSearching(e.target.value.trim().length >= 2); setActionError(''); setSearchError(''); }} /><span className="mt-2 block text-xs text-brand-textSecondary">Chỉ tìm tài khoản đang hoạt động. Email và số điện thoại được giữ riêng tư.</span></label>}
    {error && <div role="alert" className="mx-4 mt-3 rounded-xl bg-red-50 p-3 text-red-800">{error}<button className={`${button} mt-2 w-full`} disabled={loading || busy !== null} onClick={refresh}>Thử lại</button></div>}
    <div className="min-h-0 overflow-y-auto p-4">{loading || searching ? <p role="status">Đang tải…</p> : <><ul className="space-y-2">{listed.map(person => {
      const relation = rows.find(row => row.userId === person.userId);
      const incoming = relation?.status === 'Pending' && relation.requestedByUserId !== userId;
      return <li key={person.userId} className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-3 rounded-xl border border-brand-border p-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-lightTeal font-bold text-brand-teal" aria-hidden="true">{person.displayName.trim().slice(0, 1).toLocaleUpperCase('vi')}</span><div className="min-w-0"><p className="break-words font-semibold">{person.displayName}</p>{relation?.status === 'Pending' && <p className="text-xs text-brand-textSecondary">{incoming ? 'Muốn kết bạn với bạn' : 'Đã gửi lời mời'}</p>}</div><div className="col-span-2 flex flex-wrap justify-end gap-2">
        <button className={button} disabled={busy !== null} onClick={() => void act(person.userId, 'message')}>Nhắn tin</button>
        {!relation && loaded && !loading && !error && <button className={button} disabled={busy !== null} onClick={() => void act(person.userId, 'request')}>Kết bạn</button>}
        {incoming && <><button className={button} disabled={busy !== null || !loaded || loading} onClick={() => void act(person.userId, 'accept')}>Chấp nhận</button><button className={button} disabled={busy !== null || !loaded || loading} onClick={() => void act(person.userId, 'decline')}>Từ chối</button></>}
        {relation?.status === 'Pending' && !incoming && <button className={button} disabled={busy !== null || !loaded || loading} onClick={() => void act(person.userId, 'cancel')}>Hủy lời mời</button>}
        {relation?.status === 'Accepted' && <button className={button} disabled={busy !== null || !loaded || loading} onClick={() => { if (window.confirm(`Hủy kết bạn với ${person.displayName}? Lịch sử tin nhắn vẫn được giữ.`)) void act(person.userId, 'remove'); }}>Hủy kết bạn</button>}
      </div></li>;
    })}</ul>{!listed.length && !error && <p className="py-5 text-center text-brand-textSecondary">{tab === 'find' ? query.trim().length < 2 ? 'Tìm tên để gửi lời mời hoặc bắt đầu trò chuyện.' : 'Không tìm thấy người phù hợp.' : tab === 'requests' ? 'Bạn chưa có lời mời kết bạn.' : 'Chưa có bạn bè. Tìm người để kết nối cùng chuyến đi.'}</p>}</> }</div>
  </div></div>;
}
