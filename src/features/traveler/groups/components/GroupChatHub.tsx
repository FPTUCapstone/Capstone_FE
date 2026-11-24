'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useWebSession } from '@/features/auth/session/useWebSession';
import type { AuthRole } from '@/features/auth/session/authSession';
import { ROUTES } from '@/lib/routes';
import { searchChatUsers, type ChatUser } from '../services/directChatApi';
import type { GroupMessageApiDto } from '../services/travelGroupApi';
import type { SplitBillData } from '../types/groupChatTypes';
import { useMessenger, chatError } from './useMessenger';
import { MessageCard } from './MessageCard';
import { useChatDialog } from './useChatDialog';
import { CreatePollModal } from './CreatePollModal';
import { CreateExpenseModal } from './CreateExpenseModal';
import { BroadcastModal } from './BroadcastModal';
import { VietQrModal } from './VietQrModal';

const control = 'rounded-xl border border-brand-border bg-white px-3 py-2 text-sm font-semibold text-brand-navy transition hover:bg-brand-lightTeal focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
const primaryControl = 'rounded-xl border border-brand-navy bg-brand-navy px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-teal focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
export function GroupChatHub() {
  const { context, status } = useWebSession();
  if (status === 'restoring') return <div role="status" className="p-8 text-center">Đang khôi phục phiên đăng nhập…</div>;
  if (!context) return <main className="mx-auto max-w-lg space-y-4 p-8 text-center"><h1 className="text-2xl font-bold">Trò chuyện TripMate</h1><p>Đăng nhập để xem nhóm của bạn và gửi tin nhắn riêng.</p><Link className={control} href={`${ROUTES.signIn}?returnTo=${encodeURIComponent(ROUTES.messages)}`}>Đăng nhập để trò chuyện</Link></main>;
  return <Messenger key={`${context.userId}:${context.role}`} userId={context.userId} role={context.role} name={context.fullName} />;
}

function NewConversation({ onClose, onOpen }: { onClose: () => void; onOpen: (userId: number, signal?: AbortSignal) => Promise<void> }) {
  const ref = useChatDialog(onClose);
  const lifetime = useRef(new AbortController());
  useEffect(() => { const abort = new AbortController(); lifetime.current = abort; return () => abort.abort(); }, []);
  const [query, setQuery] = useState(''); const [users, setUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(false); const [opening, setOpening] = useState(false); const [error, setError] = useState('');
  const [searchedFor, setSearchedFor] = useState('');
  useEffect(() => {
    const abort = new AbortController();
    const timer = setTimeout(async () => {
      setUsers([]); setError('');
      if (query.trim().length < 2) { setLoading(false); return; }
      setLoading(true);
      try { const rows = await searchChatUsers(query, abort.signal); if (!abort.signal.aborted) setUsers(rows); }
      catch (e) { if (!abort.signal.aborted) setError(chatError(e)); }
      finally { if (!abort.signal.aborted) { setLoading(false); setSearchedFor(query.trim()); } }
    }, 300);
    return () => { abort.abort(); clearTimeout(timer); };
  }, [query]);
  return <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="new-chat-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="max-h-[calc(100dvh-2rem)] w-full max-w-md space-y-4 overflow-y-auto rounded-3xl bg-white p-5 shadow-lg">
    <div className="flex items-center justify-between gap-3"><h2 id="new-chat-title" className="text-lg font-bold">Cuộc trò chuyện mới</h2><button className={control} onClick={onClose} aria-label="Đóng">×</button></div>
    <label className="block text-sm">Tìm người dùng<input autoComplete="off" maxLength={100} className="mt-2 w-full rounded-xl border border-brand-border p-3" value={query} onChange={e => { setQuery(e.target.value); setUsers([]); }} placeholder="Nhập ít nhất 2 ký tự tên" disabled={opening} /></label>
    <p className="text-xs text-brand-textSecondary">Chỉ hiển thị tên và ảnh đại diện. Không công khai email hoặc số điện thoại.</p>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}{query.trim().length >= 2 && (loading || searchedFor !== query.trim()) ? <p role="status">Đang tìm…</p> : query.trim().length >= 2 && !users.length && !error && <p className="text-sm">Không tìm thấy người dùng phù hợp.</p>}
    <ul className="divide-y divide-brand-border">{users.map(u => <li key={u.userId}><button className="w-full rounded-xl p-3 text-left hover:bg-brand-lightTeal disabled:opacity-50" disabled={opening} onClick={async () => { setOpening(true); setError(''); try { await onOpen(u.userId, lifetime.current.signal); if (!lifetime.current.signal.aborted) onClose(); } catch (e) { if (!lifetime.current.signal.aborted) setError(chatError(e)); } finally { if (!lifetime.current.signal.aborted) setOpening(false); } }}>{u.displayName}<span className="ml-2 text-xs text-brand-textSecondary">Nhắn tin</span></button></li>)}</ul>
  </div></div>;
}

function Messenger({ userId, role, name }: { userId: number; role: AuthRole; name: string }) {
  const chat = useMessenger(userId, role);
  const [filter, setFilter] = useState<'all' | 'group' | 'direct'>('all'); const [query, setQuery] = useState('');
  const [messageSearch, setMessageSearch] = useState(''); const [showSearch, setShowSearch] = useState(false);
  const [detail, setDetail] = useState(false); const [actions, setActions] = useState(false);
  const [modal, setModal] = useState<'poll' | 'expense' | 'broadcast' | 'rollcall' | 'new' | null>(null);
  const [qr, setQr] = useState<{ data: SplitBillData; message: GroupMessageApiDto } | null>(null);
  const [rollTitle, setRollTitle] = useState(''); const [rollError, setRollError] = useState('');
  const stream = useRef<HTMLDivElement>(null); const tail = useRef<HTMLDivElement>(null); const nearBottom = useRef(true);
  const closed = chat.selected?.group?.status === 'Closed';
  const cannotSend = closed || chat.blocked;
  const canManageGroupNotices = role === 'TourOperator' || (chat.selected?.kind === 'group' && chat.selected.group?.hostUserId === userId);
  const toolMenuItems: readonly ['poll' | 'expense' | 'broadcast' | 'rollcall', string][] = canManageGroupNotices
    ? [['poll', 'Tạo bình chọn'], ['expense', 'Chia tiền (VietQR)'], ['broadcast', 'Phát thông báo nhóm'], ['rollcall', 'Tạo điểm danh']]
    : [['poll', 'Tạo bình chọn'], ['expense', 'Chia tiền (VietQR)']];
  const threads = useMemo(() => chat.threads.filter(t => (filter === 'all' || t.kind === filter) && t.title.toLocaleLowerCase('vi').includes(query.trim().toLocaleLowerCase('vi'))).sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '') || a.key.localeCompare(b.key)), [chat.threads, filter, query]);
  const visible = useMemo(() => chat.messages.filter(m => m.content.toLocaleLowerCase('vi').includes(messageSearch.trim().toLocaleLowerCase('vi'))), [chat.messages, messageSearch]);
  const lastId = chat.messages.at(-1)?.messageId;
  useEffect(() => { if (nearBottom.current && !messageSearch) tail.current?.scrollIntoView?.({ behavior: 'smooth', block: 'end' }); }, [lastId, messageSearch]);
  const submit = (event: FormEvent) => { event.preventDefault(); nearBottom.current = true; void chat.send('text', chat.draft); };
  const finishModal = async (type: string, content: string, data: object) => chat.send(type, content, data);
  return <div className="flex h-[calc(100dvh-1rem)] min-h-96 overflow-hidden bg-brand-surface text-brand-textPrimary">
    <aside className={`w-full shrink-0 flex-col border-r border-brand-border bg-white md:flex md:w-80 lg:w-96 ${detail ? 'hidden' : 'flex'}`}>
      <div className="space-y-3 border-b border-brand-border p-4"><div className="flex items-center justify-between gap-2"><h1 className="text-xl font-bold">Trò chuyện</h1><Link className="text-sm text-brand-teal underline" href={ROUTES.myItineraries}>Lịch trình</Link></div><button className={`${control} w-full`} onClick={() => setModal('new')}>Cuộc trò chuyện mới</button><input aria-label="Tìm hội thoại đã tải" className="w-full rounded-xl border border-brand-border p-3 text-sm" placeholder="Tìm hội thoại đã tải…" value={query} onChange={e => setQuery(e.target.value)} /><div className="flex gap-2">{([['all', 'Tất cả'], ['group', 'Nhóm'], ['direct', 'Riêng tư']] as const).map(([value, label]) => <button key={value} aria-pressed={filter === value} className={`${control} ${filter === value ? 'ring-2 ring-brand-teal' : ''}`} onClick={() => setFilter(value)}>{label}</button>)}</div></div>
      <div className="min-h-0 flex-1 overflow-y-auto">{chat.loading && <p role="status" className="p-5">Đang tải hội thoại…</p>}{chat.listError && <div role="alert" className="space-y-2 p-4 text-sm text-red-700"><p>{chat.listError}</p><button className={control} onClick={() => void chat.refresh()}>Thử tải lại</button></div>}{!chat.loading && !chat.listError && !threads.length && <p className="p-6 text-sm text-brand-textSecondary">{query ? 'Không tìm thấy hội thoại phù hợp trong danh sách đã tải.' : 'Chưa có cuộc trò chuyện. Tham gia nhóm hoặc bắt đầu tin nhắn riêng.'}</p>}
        {threads.map(t => <button key={t.key} aria-label={`Mở ${t.title}`} aria-current={t.key === chat.selected?.key ? 'true' : undefined} className={`flex w-full min-w-0 items-start gap-3 border-b border-brand-border p-4 text-left hover:bg-brand-lightTeal ${chat.selected?.key === t.key ? 'bg-brand-lightTeal' : ''}`} onClick={() => { chat.select(t); setDetail(true); setMessageSearch(''); setShowSearch(false); setActions(false); nearBottom.current = true; }}><span className="rounded-xl bg-brand-surface p-3" aria-hidden="true"><span className="material-symbols-outlined">{t.kind === 'direct' ? 'person' : 'groups'}</span></span><span className="min-w-0 flex-1"><span className="block truncate font-semibold">{t.title}</span><span className="mt-1 block truncate text-xs text-brand-textSecondary">{t.preview ?? 'Chưa có tin nhắn'}</span><span className="mt-1 block text-xs text-brand-textSecondary">{t.kind === 'direct' ? 'Tin riêng' : t.group?.itinerarySourceType === 'BookedTour' ? 'Nhóm tour' : 'Nhóm lịch trình'}{t.group?.status === 'Closed' ? ' · Đã đóng' : ''}</span></span>{t.unread > 0 && <span aria-label={`${t.unread} tin chưa đọc`} className="rounded-full bg-brand-teal px-2 py-1 text-xs font-bold text-white">{t.unread}</span>}</button>)}{chat.hasMoreThreads && <button className={`${control} m-4`} onClick={() => void chat.loadMoreThreads()}>Tải thêm hội thoại</button>}
      </div>
    </aside>
    <main className={`min-w-0 flex-1 flex-col bg-brand-surface md:flex ${detail ? 'flex' : 'hidden'}`}>
      {chat.selected ? <>
        <header className="flex items-center gap-3 border-b border-brand-border bg-white p-4"><button className={`${control} md:hidden`} aria-label="Quay lại danh sách" onClick={() => setDetail(false)}>←</button><div className="min-w-0 flex-1"><h2 className="truncate font-bold">{chat.selected.title}</h2><p className="text-xs text-brand-textSecondary">{chat.selected.kind === 'group' ? `${chat.selected.group?.memberCount} thành viên` : 'Tin nhắn riêng 1–1'}</p></div><button className={control} onClick={() => setShowSearch(s => !s)} aria-label="Tìm trong tin nhắn đã tải">Tìm</button></header>
        {showSearch && <div className="flex gap-2 border-b border-brand-border p-3"><input className="min-w-0 flex-1 rounded-xl border border-brand-border bg-white p-2 text-sm" placeholder="Tìm trong các tin đã tải…" value={messageSearch} onChange={e => setMessageSearch(e.target.value)} /><button className={control} onClick={() => { setMessageSearch(''); setShowSearch(false); }} aria-label="Đóng tìm kiếm">×</button></div>}
        {chat.error && <div role="alert" className="flex flex-wrap items-center gap-3 border-b border-red-200 bg-red-50 p-3 text-sm text-red-800"><p className="min-w-0 flex-1">{chat.error}</p><button className={control} onClick={() => chat.select(chat.selected!)}>Tải lại tin nhắn</button>{chat.needsSignIn && <Link className="underline" href={`${ROUTES.signIn}?returnTo=${encodeURIComponent(ROUTES.messages)}`}>Đăng nhập lại</Link>}</div>}
        {closed && <p className="border-b border-brand-border bg-brand-lightTeal p-3 text-sm">Nhóm đã đóng. Bạn chỉ có thể xem lịch sử.</p>}
        <div ref={stream} role="log" aria-label="Tin nhắn" aria-live="polite" className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4" onScroll={() => { const el = stream.current; if (el) nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120; }}>
          {chat.hasOlder && <button className={control} disabled={chat.loadingOlder} onClick={chat.loadOlder}>{chat.loadingOlder ? 'Đang tải…' : 'Tải tin nhắn trước'}</button>}{chat.loadingMessages ? <p role="status">Đang tải tin nhắn…</p> : !visible.length && <p className="p-5 text-center text-sm text-brand-textSecondary">{messageSearch ? 'Không có tin phù hợp trong các tin đã tải.' : chat.error ? 'Chưa tải được lịch sử trò chuyện.' : 'Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện.'}</p>}{visible.map(m => <MessageCard key={m.messageId} message={m} thread={chat.selected!} userId={userId} busy={chat.busy} onInteract={(message, action, index) => void chat.interact(message, action, index)} onQr={(data, message) => setQr({ data, message })} />)}<div ref={tail} />
        </div>
        <div className="relative border-t border-brand-border bg-white p-3">{actions && chat.selected.kind === 'group' && <div className="absolute bottom-full left-3 mb-2 max-h-72 min-w-56 overflow-y-auto rounded-2xl border border-brand-border bg-white p-2 shadow-lg">{toolMenuItems.map(([value, label]) => <button key={value} className="block w-full rounded-xl p-3 text-left text-sm hover:bg-brand-lightTeal disabled:opacity-50" disabled={chat.busy || cannotSend || (value === 'expense' && !chat.members.length)} onClick={() => { setModal(value); setActions(false); }}>{label}</button>)}</div>}
          <form onSubmit={submit} className="flex items-end gap-2">{chat.selected.kind === 'group' && <button type="button" className={control} aria-expanded={actions} aria-label="Thêm tiện ích" disabled={chat.busy || cannotSend} onClick={() => setActions(s => !s)}>+</button>}<label className="min-w-0 flex-1"><span className="sr-only">Nội dung tin nhắn</span><textarea rows={1} className="max-h-32 min-h-11 w-full resize-y rounded-xl border border-brand-border p-3 text-sm" placeholder="Nhập tin nhắn..." maxLength={4000} value={chat.draft} disabled={cannotSend} onChange={e => chat.setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); if (chat.draft.trim() && !chat.busy && !cannotSend && !chat.loadingMessages) void chat.send('text', chat.draft); } }} /></label><button className={primaryControl} aria-label="Gửi tin nhắn" disabled={!chat.draft.trim() || chat.busy || cannotSend || chat.loadingMessages}>{chat.busy ? 'Đang gửi…' : 'Gửi'}</button></form><p className="mt-1 text-right text-[11px] text-brand-textSecondary">{chat.draft.length}/4000 · Enter gửi, Shift+Enter xuống dòng</p>
        </div>
      </> : <div className="flex h-full items-center justify-center p-8 text-center text-brand-textSecondary">Chọn một cuộc trò chuyện hoặc bắt đầu tin nhắn riêng.</div>}
    </main>
    {modal === 'new' && <NewConversation onClose={() => setModal(null)} onOpen={chat.openDirect} />}
    {modal === 'poll' && <CreatePollModal onClose={() => setModal(null)} onSubmit={data => finishModal('poll', data.question, data)} apiError={chat.error ?? undefined} />}
    {modal === 'broadcast' && <BroadcastModal onClose={() => setModal(null)} onSubmit={data => finishModal('broadcast', data.title, data)} apiError={chat.error ?? undefined} />}
    {modal === 'expense' && <CreateExpenseModal onClose={() => setModal(null)} currentUserName={name} memberCount={chat.members.length} apiError={chat.error ?? undefined} onSubmit={data => { const sorted = [...chat.members].sort((a, b) => a.memberId - b.memberId); const base = Math.floor(data.totalAmount / sorted.length); const remainder = data.totalAmount % sorted.length; return finishModal('split_bill', data.title, { ...data, participantNames: sorted.map(m => m.displayName), participants: sorted.map((m, i) => ({ userId: m.memberId, displayName: m.displayName, amount: base + (i < remainder ? 1 : 0) })) }); }} />}
    {modal === 'rollcall' && <RollCallDialog onClose={() => setModal(null)} busy={chat.busy} error={chat.error} title={rollTitle} onTitle={setRollTitle} localError={rollError} onLocalError={setRollError} onSubmit={() => finishModal('roll_call', rollTitle, { title: rollTitle.trim(), totalMembers: chat.selected?.group?.memberCount })} />}
    {qr && <VietQrModal data={qr.data} apiError={chat.error ?? undefined} isPaid={chat.messages.some(m => 'paidUserIds' in m && m.messageId === qr.message.messageId && m.paidUserIds.includes(userId))} onClose={() => setQr(null)} onMarkPaid={async () => { await chat.interact(qr.message, 'paid'); }} />}
  </div>;
}

function RollCallDialog({ onClose, busy, error, title, onTitle, localError, onLocalError, onSubmit }: { onClose: () => void; busy: boolean; error: string | null | undefined; title: string; onTitle: (v: string) => void; localError: string; onLocalError: (v: string) => void; onSubmit: () => Promise<boolean> }) {
  const ref = useChatDialog(onClose);
  return <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="roll-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><form className="w-full max-w-md space-y-4 rounded-3xl bg-white p-5" onSubmit={async e => { e.preventDefault(); if (!title.trim()) { onLocalError('Vui lòng nhập tiêu đề điểm danh.'); return; } if (await onSubmit()) { onClose(); onTitle(''); } }}><h2 id="roll-title" className="text-lg font-bold">Tạo điểm danh</h2><label className="block">Tiêu đề<input className="mt-2 w-full rounded-xl border border-brand-border p-3" maxLength={200} value={title} onChange={e => { onTitle(e.target.value); onLocalError(''); }} /></label>{(localError || error) && <p role="alert" className="text-sm text-red-700">{localError || error}</p>}<div className="flex justify-end gap-2"><button type="button" className={control} onClick={onClose}>Hủy</button><button className={control} disabled={busy}>Tạo điểm danh</button></div></form></div>;
}
