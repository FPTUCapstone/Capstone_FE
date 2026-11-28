'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { useWebSession } from '@/features/auth/session/useWebSession';
import type { AuthRole } from '@/features/auth/session/authSession';
import { ROUTES } from '@/lib/routes';
import { searchChatUsers, type ChatUser } from '../services/directChatApi';
import { fetchGroupConversations, type GroupMessageApiDto } from '../services/travelGroupApi';
import type { SplitBillData } from '../types/groupChatTypes';
import { useMessenger, chatError, groupThread, type Thread } from './useMessenger';
import { MessageCard } from './MessageCard';
import { useChatDialog } from './useChatDialog';
import { CreatePollModal } from './CreatePollModal';
import { CreateExpenseModal } from './CreateExpenseModal';
import { BroadcastModal } from './BroadcastModal';
import { VietQrModal } from './VietQrModal';
import { FriendsPanel } from './FriendsPanel';
import { CreateGroupDialog } from './CreateGroupDialog';
import { GroupInvitationDialog } from './GroupInvitationDialog';
import { GroupDetailsDialog } from './GroupDetailsDialog';
import { JoinGroupDialog } from './JoinGroupDialog';
import { GroupHighlights } from './GroupHighlights';
import { EditGroupMessageDialog } from './EditGroupMessageDialog';
import { PollVotersDialog } from './PollVotersDialog';
import { ShareItineraryDialog } from './ShareItineraryDialog';
import { GroupLocationDialog } from './GroupLocationDialog';
import { itineraryShareId } from '../services/itinerarySharesApi';

const control = 'rounded-xl border border-brand-border bg-white px-3 py-2 text-sm font-semibold text-brand-navy transition hover:bg-brand-lightTeal focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
const primaryControl = 'rounded-xl border border-brand-navy bg-brand-navy px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-teal focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
export function GroupChatHub({ dock = false, onOpenChange }: { dock?: boolean; onOpenChange?: (open: boolean) => void } = {}) {
  const { context, status } = useWebSession();
  if (dock && (status === 'restoring' || !context)) return null;
  if (status === 'restoring') return <div role="status" className="p-8 text-center">Đang khôi phục phiên đăng nhập…</div>;
  if (!context) return <main className="mx-auto max-w-lg space-y-4 p-8 text-center"><h1 className="text-2xl font-bold">Trò chuyện TripMate</h1><p>Đăng nhập để xem nhóm của bạn và gửi tin nhắn riêng.</p><Link className={control} href={`${ROUTES.signIn}?returnTo=${encodeURIComponent(ROUTES.messages)}`}>Đăng nhập để trò chuyện</Link></main>;
  return <Messenger key={`${context.userId}:${context.role}`} userId={context.userId} role={context.role} name={context.fullName} dock={dock} onOpenChange={onOpenChange} />;
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
  return <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="new-chat-title" className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="max-h-[calc(100dvh-2rem)] w-full max-w-md space-y-4 overflow-y-auto rounded-3xl bg-white p-5 shadow-lg">
    <div className="flex items-center justify-between gap-3"><h2 id="new-chat-title" className="text-lg font-bold">Cuộc trò chuyện mới</h2><button className={control} onClick={onClose} aria-label="Đóng">×</button></div>
    <label className="block text-sm">Tìm người dùng<input autoComplete="off" maxLength={100} className="mt-2 w-full rounded-xl border border-brand-border p-3" value={query} onChange={e => { setQuery(e.target.value); setUsers([]); }} placeholder="Nhập ít nhất 2 ký tự tên" disabled={opening} /></label>
    <p className="text-xs text-brand-textSecondary">Chỉ hiển thị tên và ảnh đại diện. Không công khai email hoặc số điện thoại.</p>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}{query.trim().length >= 2 && (loading || searchedFor !== query.trim()) ? <p role="status">Đang tìm…</p> : query.trim().length >= 2 && !users.length && !error && <p className="text-sm">Không tìm thấy người dùng phù hợp.</p>}
    <ul className="divide-y divide-brand-border">{users.map(u => <li key={u.userId}><button className="w-full rounded-xl p-3 text-left hover:bg-brand-lightTeal disabled:opacity-50" disabled={opening} onClick={async () => { setOpening(true); setError(''); try { await onOpen(u.userId, lifetime.current.signal); if (!lifetime.current.signal.aborted) onClose(); } catch (e) { if (!lifetime.current.signal.aborted) setError(chatError(e)); } finally { if (!lifetime.current.signal.aborted) setOpening(false); } }}>{u.displayName}<span className="ml-2 text-xs text-brand-textSecondary">Nhắn tin</span></button></li>)}</ul>
  </div></div>;
}

function Messenger({ userId, role, name, dock = false, onOpenChange }: { userId: number; role: AuthRole; name: string; dock?: boolean; onOpenChange?: (open: boolean) => void }) {
  const [dockView, setDockView] = useState<'closed' | 'chat'>('closed');
  const [listOpen, setListOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [minimized, setMinimized] = useState<Thread[]>([]);
  const listRef = useRef<HTMLElement>(null);
  const pendingSearchFocus = useRef(false);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const stream = useRef<HTMLDivElement>(null); const tail = useRef<HTMLDivElement>(null); const nearBottom = useRef(true);
  const openingAbort = useRef<AbortController | null>(null);
  useEffect(() => () => openingAbort.current?.abort(), []);
  useEffect(() => () => { if (dock) onOpenChange?.(false); }, [dock, onOpenChange]);
  const chat = useMessenger(userId, role, !dock || dockView === 'chat', !dock);
  useEffect(() => {
    if (!dock) return;
    const toggle = () => { window.dispatchEvent(new Event('tripmate:open-messenger')); openingAbort.current?.abort(); setListOpen(old => !old); };
    window.addEventListener('tripmate:toggle-messenger', toggle);
    return () => window.removeEventListener('tripmate:toggle-messenger', toggle);
  }, [dock]);
  useEffect(() => {
    if (!dock || !listOpen) return;
    const outside = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Element && !listRef.current?.contains(target) && !target.closest('[data-messenger-toggle]')) { openingAbort.current?.abort(); setListOpen(false); }
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || document.querySelector('[role="dialog"][aria-modal="true"]')) return;
      event.preventDefault(); openingAbort.current?.abort(); setListOpen(false);
      document.querySelector<HTMLElement>('[data-messenger-toggle]')?.focus();
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [dock, listOpen]);
  useEffect(() => {
    if (!dock) return;
    window.dispatchEvent(new CustomEvent('tripmate:messenger-state', { detail: { expanded: listOpen, unread: chat.threads.reduce((sum, thread) => sum + thread.unread, 0) } }));
  }, [dock, listOpen, chat.threads]);
  useEffect(() => {
    if (!dock) return;
    const support = (event: Event) => {
      const isOpen = (event as CustomEvent<{ open?: boolean }>).detail?.open === true;
      setSupportOpen(isOpen);
      if (!isOpen) return;
      setListOpen(false);
      if (dockView === 'chat' && chat.selected) setMinimized(old => [...old.filter(t => t.key !== chat.selected!.key), chat.selected!].slice(-5));
      setDockView('closed');
    };
    window.addEventListener('tripmate:support-state', support);
    window.dispatchEvent(new Event('tripmate:request-support-state'));
    return () => window.removeEventListener('tripmate:support-state', support);
  }, [dock, dockView, chat.selected]);
  const visibleMinimized = useMemo(() => {
    if (chat.loading) return minimized;
    return minimized.flatMap(thread => {
      const current = chat.threads.find(item => item.key === thread.key);
      return current ? [current] : [];
    });
  }, [minimized, chat.threads, chat.loading]);
  const openThread = (thread: Thread) => {
    if (dock) window.dispatchEvent(new Event('tripmate:open-messenger'));
    openingAbort.current?.abort();
    if (dock && dockView === 'chat' && chat.selected && chat.selected.key !== thread.key) {
      const current = chat.selected;
      setMinimized(old => [...(chat.loading ? old : old.filter(t => chat.threads.some(item => item.key === t.key))).filter(t => t.key !== current.key && t.key !== thread.key), current].slice(-5));
    }
    setMinimized(old => old.filter(t => t.key !== thread.key));
    chat.select(thread); setEmojiOpen(false); setDetail(true); setListOpen(false); setDockView('chat'); setMessageSearch(''); setShowSearch(false); setActions(false); nearBottom.current = true;
  };
  const minimize = () => {
    if (chat.selected) {
      const current = chat.selected;
      setMinimized(old => [...(chat.loading ? old : old.filter(t => chat.threads.some(item => item.key === t.key))).filter(t => t.key !== current.key), current].slice(-5));
    }
    setDockView('closed');
  };

  const [filter, setFilter] = useState<'all' | 'unread' | 'group' | 'direct'>('all');
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [locationThread, setLocationThread] = useState<Thread | null>(null);
  const [shareThread, setShareThread] = useState<Thread | null>(null);
  const pendingShareOperations = useRef(new Map<string, string>());
  const shareRequestIdFor = (operationId: string) => {
    const requestId = pendingShareOperations.current.get(operationId) ?? crypto.randomUUID();
    pendingShareOperations.current.set(operationId, requestId);
    return requestId;
  };
  const [invitationGroup, setInvitationGroup] = useState<number | null>(null);
  const [groupDetailsOpen, setGroupDetailsOpen] = useState(false);
  const [leaveRequested, setLeaveRequested] = useState(false);
  const [joinGroupOpen, setJoinGroupOpen] = useState(false);
  const [editing, setEditing] = useState<GroupMessageApiDto | null>(null);
  const [voters, setVoters] = useState<GroupMessageApiDto | null>(null);
  const [createGroupOpen, setCreateGroupOpen] = useState(false); const [query, setQuery] = useState('');
  const [people, setPeople] = useState<ChatUser[]>([]);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [peopleError, setPeopleError] = useState('');
  const [openingPerson, setOpeningPerson] = useState<number | null>(null);
  const openingRef = useRef(false);
  useEffect(() => {
    const abort = new AbortController();
    const timer = setTimeout(async () => {
      if (query.trim().length < 2) return;
      setPeopleLoading(true);
      try { const rows = await searchChatUsers(query, abort.signal); if (!abort.signal.aborted) setPeople(rows); }
      catch (error) { if (!abort.signal.aborted) setPeopleError(chatError(error)); }
      finally { if (!abort.signal.aborted) setPeopleLoading(false); }
    }, 300);
    return () => { abort.abort(); clearTimeout(timer); };
  }, [query]);
  const [messageSearch, setMessageSearch] = useState(''); const [showSearch, setShowSearch] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [detail, setDetail] = useState(false); const [actions, setActions] = useState(false);
  const [modal, setModal] = useState<'poll' | 'expense' | 'broadcast' | 'rollcall' | 'new' | null>(null);
  const [qr, setQr] = useState<{ data: SplitBillData; message: GroupMessageApiDto } | null>(null);
  const [rollTitle, setRollTitle] = useState(''); const [rollError, setRollError] = useState('');
  const hasDialog = shareThread !== null || locationThread !== null || groupDetailsOpen || joinGroupOpen || editing !== null || voters !== null || invitationGroup !== null || createGroupOpen || friendsOpen || modal !== null || qr !== null;
  useEffect(() => {
    if (!pendingSearchFocus.current) return;
    if (supportOpen || (dock && !listOpen)) {
      pendingSearchFocus.current = false;
      return;
    }
    if (hasDialog) return;
    // Focus only after React has revealed the picker and removed the dialog.
    // This also handles /messages, where returning to the list changes detail.
    const input = listRef.current?.querySelector<HTMLInputElement>('input');
    if (!input || input.getClientRects().length === 0) return;
    input.focus({ preventScroll: true });
    if (document.activeElement === input) pendingSearchFocus.current = false;
  }, [dock, listOpen, detail, hasDialog, supportOpen]);
  useEffect(() => {
    if (dock) onOpenChange?.(dockView !== 'closed' || listOpen || visibleMinimized.length > 0 || friendsOpen || createGroupOpen || invitationGroup !== null || groupDetailsOpen || joinGroupOpen || editing !== null || voters !== null || modal !== null || locationThread !== null || shareThread !== null);
  }, [dock, dockView, listOpen, visibleMinimized.length, onOpenChange, friendsOpen, createGroupOpen, invitationGroup, groupDetailsOpen, joinGroupOpen, editing, voters, modal, locationThread, shareThread]);
  const closed = chat.selected?.isClosed === true || chat.selected?.group?.status === 'Closed';
  const cannotSend = closed || chat.blocked;
  useEffect(() => { if (closed) { setActions(false); setEmojiOpen(false); } }, [closed]);
  const canManageGroupNotices = role === 'TourOperator' || (chat.selected?.kind === 'group' && chat.selected.group?.hostUserId === userId);
  const toolMenuItems: readonly ['poll' | 'expense' | 'broadcast' | 'rollcall', string][] = canManageGroupNotices
    ? [['poll', 'Tạo bình chọn'], ['expense', 'Chia tiền (VietQR)'], ['broadcast', 'Phát thông báo nhóm'], ['rollcall', 'Tạo điểm danh']]
    : [['poll', 'Tạo bình chọn'], ['expense', 'Chia tiền (VietQR)']];
  const threads = useMemo(() => chat.threads.filter(t => (filter === 'all' || (filter === 'unread' ? t.unread > 0 : t.kind === filter)) && t.title.toLocaleLowerCase('vi').includes(query.trim().toLocaleLowerCase('vi'))).sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '') || a.key.localeCompare(b.key)), [chat.threads, filter, query]);
  const visible = useMemo(() => chat.messages.filter(m => m.content.toLocaleLowerCase('vi').includes(messageSearch.trim().toLocaleLowerCase('vi'))), [chat.messages, messageSearch]);
  useEffect(() => {
    const resize = () => {
      const textarea = composerRef.current;
      if (!textarea) return;
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(Math.max(textarea.scrollHeight + 2, 40), Math.max(80, Math.min(window.innerHeight * 0.45, 360, (textarea.closest('main')?.clientHeight || 440) - 150)))}px`;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [chat.draft, dockView]);
  const lastId = chat.messages.at(-1)?.messageId;
  useEffect(() => { if (nearBottom.current && !messageSearch) tail.current?.scrollIntoView?.({ behavior: 'smooth', block: 'end' }); }, [lastId, messageSearch]);
  const submit = (event: FormEvent) => { event.preventDefault(); nearBottom.current = true; void chat.send('text', chat.draft); };
  const headerControl = dock ? 'grid h-8 w-5 shrink-0 place-items-center rounded-full text-brand-teal hover:bg-brand-lightTeal focus-visible:outline-2 max-sm:min-h-11 max-sm:min-w-8' : control;
  const composerControl = dock ? 'grid size-8 shrink-0 place-items-center rounded-full text-brand-teal hover:bg-brand-lightTeal focus-visible:outline-2' : control;
  const finishModal = async (type: string, content: string, data: object) => chat.send(type, content, data);
  return <div className={dock ? 'pointer-events-none fixed inset-0 z-40 font-sans text-sm leading-relaxed text-brand-textPrimary' : 'mx-auto flex h-[calc(100dvh-7rem)] min-h-0 max-w-[1440px] overflow-hidden rounded-2xl border border-brand-border bg-white font-sans text-sm leading-relaxed text-brand-textPrimary shadow-sm sm:my-4 sm:h-[calc(100dvh-8rem)]'}>
    <aside data-messenger-picker={listOpen ? "open" : "closed"} id={dock ? "tripmate-messenger-picker" : undefined} onKeyDown={event => { if (dock && event.key === 'Escape') { setListOpen(false); document.querySelector<HTMLElement>('[data-messenger-toggle]')?.focus(); } }} ref={listRef} hidden={dock && !listOpen} aria-label="Danh sách trò chuyện" className={dock ? `pointer-events-auto fixed right-2 top-20 z-20 max-h-[calc(100dvh-10rem)] w-[360px] max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-2xl border border-brand-border bg-white shadow-xl ${listOpen ? 'flex' : 'hidden'}` : `w-full shrink-0 flex-col border-r border-brand-border bg-white md:flex md:w-80 lg:w-96 ${detail ? 'hidden' : 'flex'}`}>
      <div className="space-y-2 border-b border-brand-border p-3">
        <div className="flex items-center gap-3">
          {dock ? <button className="grid size-10 shrink-0 place-items-center rounded-full text-brand-teal hover:bg-brand-lightTeal" onClick={() => { openingAbort.current?.abort(); setListOpen(false); }} aria-label="Quay lại trang đang xem"><span className="material-symbols-outlined" aria-hidden="true">arrow_back</span></button> : <Link className="grid size-10 shrink-0 place-items-center rounded-full text-brand-teal hover:bg-brand-lightTeal" href={role === 'TourOperator' ? '/partner' : ROUTES.myItineraries} aria-label="Quay lại TripMate"><span className="material-symbols-outlined" aria-hidden="true">arrow_back</span></Link>}
          <h1 className="min-w-0 flex-1 text-xl font-bold tracking-tight">Tin nhắn</h1>
          <button className="grid size-10 shrink-0 place-items-center rounded-full text-brand-teal hover:bg-brand-lightTeal" onClick={() => setModal('new')} aria-label="Cuộc trò chuyện mới"><span className="material-symbols-outlined" aria-hidden="true">edit_square</span></button>
        </div>
        <label className="flex items-center gap-2 rounded-full bg-brand-surface px-3 text-brand-textSecondary"><span className="material-symbols-outlined !text-[18px] leading-none" aria-hidden="true">search</span><span className="sr-only">Tìm hội thoại đã tải</span><input className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none" placeholder="Tìm người hoặc cuộc trò chuyện…" value={query} onChange={e => { setQuery(e.target.value); setPeople([]); setPeopleError(''); setPeopleLoading(e.target.value.trim().length >= 2); }} /></label>
        <div className="flex gap-1 overflow-x-auto" aria-label="Lọc hội thoại">{([['all', 'Tất cả'], ['unread', 'Chưa đọc'], ['group', 'Nhóm'], ['direct', 'Riêng tư']] as const).map(([value, label]) => <button key={value} aria-pressed={filter === value} className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold transition ${filter === value ? 'bg-brand-lightTeal text-brand-teal' : 'text-brand-textSecondary hover:bg-brand-surface'}`} onClick={() => setFilter(value)}>{label}</button>)}</div>
        <div className="flex items-center gap-1 border-t border-brand-border pt-2" aria-label="Tiện ích hội thoại">
          <button title="Tạo nhóm mới" aria-label="Tạo nhóm mới" className="flex min-h-9 min-w-0 flex-1 items-center justify-center gap-1 rounded-lg px-1 text-xs font-semibold text-brand-teal hover:bg-brand-lightTeal max-sm:min-h-11" onClick={() => setCreateGroupOpen(true)}><span className="material-symbols-outlined !text-[18px]" aria-hidden="true">group_add</span><span>Tạo nhóm</span></button>
          <button title="Bạn bè và lời mời" aria-label="Bạn bè và lời mời" className="flex min-h-9 min-w-0 flex-1 items-center justify-center gap-1 rounded-lg px-1 text-xs font-semibold text-brand-teal hover:bg-brand-lightTeal max-sm:min-h-11" onClick={() => setFriendsOpen(true)}><span className="material-symbols-outlined !text-[18px]" aria-hidden="true">contacts</span><span>Bạn bè</span></button>
          {role === 'Traveler' && <button title="Nhập mã mời nhóm du lịch" aria-label="Nhập mã mời nhóm du lịch" className="flex min-h-9 min-w-0 flex-1 items-center justify-center gap-1 rounded-lg px-1 text-xs font-semibold text-brand-teal hover:bg-brand-lightTeal max-sm:min-h-11" onClick={() => setJoinGroupOpen(true)}><span className="material-symbols-outlined !text-[18px]" aria-hidden="true">login</span><span>Nhập mã mời</span></button>}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">{chat.loading && <p role="status" className="p-5">Đang tải hội thoại…</p>}{chat.listError && <div role="alert" className="space-y-2 p-4 text-sm text-red-700"><p>{chat.listError}</p><button className={control} onClick={() => void chat.refresh()}>Thử tải lại</button></div>}{!chat.loading && !chat.listError && !threads.length && <p className="p-6 text-sm text-brand-textSecondary">{query ? 'Không tìm thấy hội thoại phù hợp trong danh sách đã tải.' : filter === 'unread' ? 'Bạn đã đọc hết tin nhắn trong danh sách đã tải.' : filter === 'group' ? 'Chưa có hội thoại nhóm trong danh sách đã tải.' : filter === 'direct' ? 'Chưa có tin nhắn riêng. Tìm người để bắt đầu trò chuyện.' : 'Chưa có cuộc trò chuyện. Tham gia nhóm hoặc bắt đầu tin nhắn riêng.'}</p>}
        {query.trim().length >= 2 && <section className="border-b border-brand-border p-3" aria-label="Người dùng tìm thấy"><h2 className="mb-2 text-xs font-semibold text-brand-textSecondary">Người dùng</h2>{peopleLoading && <p role="status" className="py-2 text-xs">Đang tìm người…</p>}{peopleError && <p role="alert" className="text-xs text-red-700">{peopleError}</p>}{!peopleLoading && !peopleError && people.length === 0 && <p className="text-xs text-brand-textSecondary">Không tìm thấy người dùng phù hợp.</p>}{people.map(person => <button key={person.userId} className="flex w-full items-center gap-3 rounded-xl p-3 text-left text-sm hover:bg-brand-lightTeal disabled:opacity-50" disabled={openingPerson !== null} onClick={async () => {
          if (openingRef.current) return;
          openingRef.current = true; setOpeningPerson(person.userId); setPeopleError('');
          const previous = chat.selected;
          const abort = new AbortController(); openingAbort.current = abort;
          try { await chat.openDirect(person.userId, abort.signal); if (abort.signal.aborted) return; if (dock && dockView === 'chat' && previous) setMinimized(old => [...old.filter(t => t.key !== previous.key && t.direct?.otherUserId !== person.userId), ...(previous.direct?.otherUserId === person.userId ? [] : [previous])].slice(-5)); setDetail(true); setListOpen(false); setDockView('chat'); }
          catch (error) { if (!abort.signal.aborted) setPeopleError(chatError(error)); }
          finally { openingRef.current = false; setOpeningPerson(null); }
        }}><span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-lightTeal font-semibold text-brand-teal" aria-hidden="true">{person.displayName.trim().slice(0, 1)}</span><span className="min-w-0 flex-1 truncate font-semibold">{person.displayName}</span><span className="text-xs text-brand-textSecondary">Nhắn tin</span></button>)}</section>}
        {threads.map(t => <button key={t.key} aria-label={`Mở ${t.title}`} aria-current={t.key === chat.selected?.key ? 'true' : undefined} className={`flex w-[calc(100%_-_1rem)] min-w-0 items-start gap-3 mx-2 my-1 rounded-xl p-3 text-left hover:bg-brand-lightTeal ${chat.selected?.key === t.key ? 'bg-brand-lightTeal' : ''}`} onClick={() => openThread(t)}><span className="grid size-12 shrink-0 place-items-center rounded-full bg-brand-lightTeal text-brand-teal" aria-hidden="true"><span className="material-symbols-outlined">{t.kind === 'direct' ? 'person' : 'groups'}</span></span><span className="min-w-0 flex-1"><span className="flex items-center gap-2"><span className="min-w-0 flex-1 truncate text-sm font-semibold">{t.title}</span>{t.updatedAt && Number.isFinite(Date.parse(t.updatedAt)) && <time className="shrink-0 text-[11px] text-brand-textSecondary" dateTime={t.updatedAt}>{new Intl.DateTimeFormat('vi', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit' }).format(new Date(t.updatedAt))}</time>}</span><span className="mt-1 block truncate text-xs text-brand-textSecondary">{t.preview && itineraryShareId(t.preview) ? 'Đã chia sẻ lịch trình' : t.preview ?? 'Chưa có tin nhắn'}</span><span className="mt-1 block text-xs text-brand-textSecondary">{t.kind === 'direct' ? 'Tin riêng' : t.chatGroup ? 'Nhóm chat' : t.group?.itinerarySourceType === 'BookedTour' ? 'Nhóm tour' : 'Nhóm lịch trình'}{t.group?.status === 'Closed' ? ' · Đã đóng' : ''}</span></span>{t.unread > 0 && <span aria-label={`${t.unread} tin chưa đọc`} className="rounded-full bg-brand-teal px-2 py-1 text-xs font-bold text-white">{t.unread}</span>}</button>)}{chat.hasMoreThreads && <button className={`${control} m-4`} onClick={() => void chat.loadMoreThreads()}>Tải thêm hội thoại</button>}
      </div>
    </aside>
    <main hidden={dock && dockView !== 'chat'} aria-label={dock ? 'Cửa sổ trò chuyện' : undefined} className={dock ? `pointer-events-auto fixed bottom-20 right-2 sm:bottom-2 sm:right-20 h-[440px] max-h-[calc(100dvh-10rem)] w-[327px] max-w-[calc(100vw-1.5rem)] sm:max-w-[calc(100vw-6rem)] min-w-0 flex-col overflow-hidden rounded-2xl border border-brand-border bg-brand-surface shadow-xl ${dockView === 'chat' ? 'flex' : 'hidden'}` : `min-w-0 flex-1 flex-col bg-brand-surface md:flex ${detail ? 'flex' : 'hidden'}`}>
      {chat.selected ? <>
        <header className={`flex items-center border-b border-brand-border bg-white ${dock ? 'gap-1 px-2 py-1.5' : 'gap-3 p-4'}`}><button className={`${control} md:hidden`} aria-label="Quay lại danh sách" onClick={() => { setDetail(false); if (dock) { setListOpen(true); setDockView('closed'); } }}>←</button><button type="button" aria-label={chat.selected.kind === 'group' ? 'Thông tin nhóm và thành viên' : 'Thông tin cuộc trò chuyện'} disabled={chat.selected.kind !== 'group'} onClick={() => { setLeaveRequested(false); setGroupDetailsOpen(true); }} className="min-w-0 flex-1 rounded-lg py-1 text-left hover:bg-brand-lightTeal disabled:hover:bg-transparent"><h2 className={`truncate font-semibold ${dock ? 'text-[13px]' : ''}`}>{chat.selected.title}</h2><p className="text-[11px] text-brand-textSecondary">{chat.selected.kind === 'group' ? `${chat.selected.group?.memberCount} thành viên · Xem nhóm` : 'Tin nhắn riêng 1–1'}</p></button>{dock && <><button className={headerControl} aria-label="Thu nhỏ cuộc trò chuyện" onClick={minimize}>−</button><button className={headerControl} aria-label="Đóng cuộc trò chuyện" onClick={() => { setMinimized(old => old.filter(t => t.key !== chat.selected?.key)); setDockView('closed'); }}>×</button></>}<button className={headerControl} onClick={() => setShowSearch(s => !s)} aria-label="Tìm trong tin nhắn đã tải">{dock ? <span className="material-symbols-outlined !text-[16px] leading-none" aria-hidden="true">search</span> : 'Tìm'}</button></header>
        {showSearch && <div className="flex gap-2 border-b border-brand-border p-3"><input className="min-w-0 flex-1 rounded-xl border border-brand-border bg-white p-2 text-sm" placeholder="Tìm trong các tin đã tải…" value={messageSearch} onChange={e => setMessageSearch(e.target.value)} /><button className={control} onClick={() => { setMessageSearch(''); setShowSearch(false); }} aria-label="Đóng tìm kiếm">×</button></div>}
        {chat.error && <div role="alert" className="flex flex-wrap items-center gap-3 border-b border-red-200 bg-red-50 p-3 text-sm text-red-800"><p className="min-w-0 flex-1">{chat.error}</p><button className={control} onClick={() => chat.select(chat.selected!)}>Tải lại tin nhắn</button>{chat.needsSignIn && <Link className="underline" href={`${ROUTES.signIn}?returnTo=${encodeURIComponent(ROUTES.messages)}`}>Đăng nhập lại</Link>}</div>}
        {closed && <p className="border-b border-brand-border bg-brand-lightTeal p-3 text-sm">Nhóm đã đóng. Bạn chỉ có thể xem lịch sử.</p>}
        {(!dock || dockView === 'chat') && chat.selected.kind === 'group' && !chat.selected.chatGroup && <GroupHighlights key={chat.selected.key} thread={chat.selected} userId={userId} messages={chat.messages} busy={chat.busy} actionError={chat.error} onInteract={chat.interact} onQr={(data, message) => setQr({ data, message })} onEdit={setEditing} onVoters={setVoters} />}
        <div ref={stream} role="log" aria-label="Tin nhắn" aria-live="polite" className={`min-h-0 flex-1 overflow-x-hidden overflow-y-auto ${dock ? 'space-y-1.5 p-2' : 'space-y-4 p-4'}`} onScroll={() => { const el = stream.current; if (el) nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120; }}>
          {chat.hasOlder && <button className={control} disabled={chat.loadingOlder} onClick={chat.loadOlder}>{chat.loadingOlder ? 'Đang tải…' : 'Tải tin nhắn trước'}</button>}{chat.loadingMessages ? <p role="status">Đang tải tin nhắn…</p> : !visible.length && <p className="p-5 text-center text-sm text-brand-textSecondary">{messageSearch ? 'Không có tin phù hợp trong các tin đã tải.' : chat.error ? 'Chưa tải được lịch sử trò chuyện.' : 'Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện.'}</p>}{visible.map(m => <MessageCard compact={dock} key={m.messageId} message={m} thread={chat.selected!} userId={userId} busy={chat.busy} onEdit={setEditing} onVoters={setVoters} onInteract={(message, action, index) => void chat.interact(message, action, index)} onQr={(data, message) => setQr({ data, message })} />)}<div ref={tail} />
        </div>
        <div className="relative border-t border-brand-border bg-white px-2 py-1.5">{emojiOpen && <div role="group" aria-label="Chọn biểu tượng cảm xúc" className="absolute bottom-full right-3 z-10 mb-2 grid grid-cols-4 gap-1 rounded-2xl border border-brand-border bg-white p-2 shadow-lg">{['😀', '😊', '❤️', '👍', '🎉', '😂', '🙏', '✈️'].map(emoji => <button key={emoji} type="button" className="grid size-10 place-items-center rounded-lg text-xl hover:bg-brand-lightTeal" aria-label={`Chèn ${emoji}`} disabled={chat.draft.length + emoji.length > 4000 || cannotSend || chat.busy} onClick={() => { chat.setDraft(chat.draft + emoji); setEmojiOpen(false); composerRef.current?.focus(); }}>{emoji}</button>)}</div>}{actions && <div className="absolute bottom-full left-3 mb-2 max-h-72 min-w-56 overflow-y-auto rounded-2xl border border-brand-border bg-white p-2 shadow-lg"><button type="button" className="flex w-full items-center gap-2 rounded-xl p-3 text-left text-sm hover:bg-brand-lightTeal" onClick={() => { setShareThread(chat.selected); setActions(false); }}><span className="material-symbols-outlined !text-[18px]" aria-hidden="true">route</span>Chia sẻ lịch trình</button>{role === 'Traveler' && chat.selected.kind === 'group' && !chat.selected.chatGroup && !closed && chat.selected.group?.hostUserId === userId && <button type="button" className="flex w-full items-center gap-2 rounded-xl p-3 text-left text-sm hover:bg-brand-lightTeal" onClick={() => { setInvitationGroup(chat.selected!.id); setActions(false); }}><span className="material-symbols-outlined !text-[18px]" aria-hidden="true">qr_code</span>Mã mời / QR vào nhóm</button>}{role === 'Traveler' && chat.selected.kind === 'group' && !chat.selected.chatGroup && <button type="button" className="flex w-full items-center gap-2 rounded-xl p-3 text-left text-sm hover:bg-brand-lightTeal" onClick={() => { setLocationThread(chat.selected); setActions(false); }}><span className="material-symbols-outlined !text-[18px]" aria-hidden="true">location_on</span>Chia sẻ và xem vị trí nhóm</button>}{chat.selected.kind === 'group' && (chat.selected.chatGroup || role === 'Traveler') && <button type="button" className="flex w-full items-center gap-2 rounded-xl border-t border-brand-border p-3 text-left text-sm text-red-700 hover:bg-red-50" onClick={() => { setLeaveRequested(true); setGroupDetailsOpen(true); setActions(false); }}><span className="material-symbols-outlined !text-[18px]" aria-hidden="true">logout</span>Rời nhóm</button>}{chat.selected.kind === 'group' && !chat.selected.chatGroup ? toolMenuItems.map(([value, label]) => <button key={value} className="block w-full rounded-xl p-3 text-left text-sm hover:bg-brand-lightTeal disabled:opacity-50" disabled={chat.busy || cannotSend || (value === 'expense' && !chat.members.length)} onClick={() => { setModal(value); setActions(false); }}>{label}</button>) : <><button type="button" className="block w-full rounded-xl p-3 text-left text-sm hover:bg-brand-lightTeal" onClick={() => { setEmojiOpen(true); setActions(false); }}>Biểu tượng cảm xúc</button><button type="button" className="block w-full rounded-xl p-3 text-left text-sm hover:bg-brand-lightTeal" onClick={() => { setCreateGroupOpen(true); setActions(false); }}>Tạo nhóm mới</button></>}</div>}
          <form onSubmit={submit} className="flex items-end gap-2">{<button type="button" className={`${composerControl} mb-1`} aria-expanded={actions} aria-label="Thêm tiện ích" disabled={chat.busy || cannotSend} onClick={() => setActions(s => !s)}><span className="material-symbols-outlined !text-[20px] leading-none" aria-hidden="true">add_circle</span></button>}<div className="relative min-w-0 flex-1"><label className="block"><span className="sr-only">Nội dung tin nhắn</span><textarea ref={composerRef} rows={1} className="block h-10 min-h-10 w-full resize-none overflow-x-hidden overflow-y-auto rounded-2xl border border-brand-border pl-3 pr-10 py-2 text-sm leading-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" placeholder="Nhập tin nhắn..." maxLength={4000} value={chat.draft} disabled={cannotSend} onChange={e => chat.setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); if (chat.draft.trim() && !chat.busy && !cannotSend && !chat.loadingMessages) void chat.send('text', chat.draft); } }} /></label><button type="button" className="absolute bottom-1 right-1 grid size-8 place-items-center rounded-full text-brand-teal hover:bg-brand-lightTeal disabled:opacity-40" aria-label="Biểu tượng cảm xúc" aria-expanded={emojiOpen} disabled={cannotSend || chat.busy || chat.loadingMessages} onClick={() => setEmojiOpen(old => !old)}><span className="material-symbols-outlined !text-[20px] leading-none" aria-hidden="true">sentiment_satisfied</span></button></div><button className={dock ? 'mb-1 grid size-8 shrink-0 place-items-center rounded-full bg-brand-teal text-white transition disabled:opacity-40' : primaryControl} aria-label="Gửi tin nhắn" disabled={!chat.draft.trim() || chat.busy || cannotSend || chat.loadingMessages}>{dock ? <span className="material-symbols-outlined text-xl" aria-hidden="true">{chat.busy ? 'hourglass_empty' : 'send'}</span> : chat.busy ? 'Đang gửi…' : 'Gửi'}</button></form>
        </div>
      </> : <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center"><span className="grid size-20 place-items-center rounded-full bg-brand-lightTeal text-brand-teal"><span className="material-symbols-outlined text-4xl" aria-hidden="true">forum</span></span><h2 className="text-xl font-bold">Kết nối cùng bạn đồng hành</h2><p className="max-w-sm text-sm text-brand-textSecondary">Chọn một cuộc trò chuyện để tiếp tục, hoặc tìm người bạn muốn nhắn tin.</p><button className={primaryControl} onClick={() => setModal('new')}>Bắt đầu trò chuyện</button></div>}
    </main>
    {dock && !supportOpen && <div className={`pointer-events-auto fixed bottom-[76px] right-2 flex max-h-[round(down,max(56px,calc(100dvh_-_160px)),56px)] snap-y snap-mandatory flex-col overflow-y-auto overflow-x-hidden overscroll-contain px-2 ${dockView === 'chat' ? 'max-sm:hidden' : ''}`} aria-label="Cuộc trò chuyện thu nhỏ">{visibleMinimized.map(thread => <div key={thread.key} className="relative h-14 w-12 shrink-0 snap-start py-1"><button className="grid size-12 shrink-0 place-items-center rounded-full border-2 border-brand-border bg-brand-teal font-bold text-white shadow-lg" aria-label={`Mở lại ${thread.title}`} title={thread.title} onClick={() => openThread(thread)}>{thread.title.trim().slice(0, 1)}{(chat.threads.find(t => t.key === thread.key)?.unread ?? 0) > 0 && <span className="absolute -left-1 -top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[10px] leading-4 text-white">{chat.threads.find(t => t.key === thread.key)?.unread}</span>}</button><button className="absolute -right-1 top-0 flex size-5 items-center justify-center rounded-full border border-brand-border bg-white p-0 text-brand-textPrimary" aria-label={`Đóng ô thu nhỏ ${thread.title}`} onClick={() => setMinimized(old => old.filter(t => t.key !== thread.key))}><svg aria-hidden="true" width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3L3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg></button></div>)}</div>}
    {hasDialog && createPortal(<div className="pointer-events-auto">
    {shareThread && <ShareItineraryDialog key={shareThread.key} thread={shareThread} requestIdFor={shareRequestIdFor} onConfirmed={operationId => { pendingShareOperations.current.delete(operationId); }} onClose={() => setShareThread(null)} onShared={() => { if (chat.selected?.key === shareThread.key) chat.select(shareThread); void chat.refresh(); }} />}
    {locationThread && <GroupLocationDialog key={locationThread.key} thread={locationThread} onClose={() => setLocationThread(null)} />}
    {groupDetailsOpen && chat.selected?.kind === 'group' && <GroupDetailsDialog key={chat.selected.key} thread={chat.selected} startLeaving={leaveRequested} onChanged={() => { void chat.refresh(); }} onClose={() => setGroupDetailsOpen(false)} onLeft={() => {
      const key = chat.selected!.key;
      pendingSearchFocus.current = true;
      chat.forgetThread(key); setMinimized(old => old.filter(thread => thread.key !== key));
      setGroupDetailsOpen(false); setDockView('closed'); setDetail(false); setListOpen(true);
      void chat.refresh();
    }} onLocation={role === 'Traveler' && !chat.selected.chatGroup ? () => { setGroupDetailsOpen(false); setLocationThread(chat.selected); } : undefined} onInvite={() => { setGroupDetailsOpen(false); setInvitationGroup(chat.selected!.id); }} />}
    {joinGroupOpen && <JoinGroupDialog onClose={() => setJoinGroupOpen(false)} onJoined={async (joined, signal) => {
      let cursor: number | undefined;
      for (let count = 0; count < 100; count++) {
        const page = await fetchGroupConversations(cursor, signal);
        if (signal?.aborted) return;
        const group = page.items.find(g => g.groupId === joined.groupId);
        if (group) { openThread(groupThread(group)); void chat.refresh(); return; }
        if (page.nextBeforeGroupId === null) break;
        if (cursor !== undefined && page.nextBeforeGroupId >= cursor) break;
        cursor = page.nextBeforeGroupId;
      }
      throw new Error('Joined conversation is not available yet.');
    }} />}
    {editing && <EditGroupMessageDialog key={`${editing.groupId}:${editing.messageId}`} message={editing} onClose={() => setEditing(null)} onSaved={message => { chat.applyEditedMessage(message); setEditing(null); }} />}
    {voters && <PollVotersDialog key={`${voters.groupId}:${voters.messageId}`} message={voters} onClose={() => setVoters(null)} />}
    {invitationGroup !== null && <GroupInvitationDialog key={invitationGroup} groupId={invitationGroup} onClose={() => setInvitationGroup(null)} />}
    {createGroupOpen && <CreateGroupDialog userId={userId} canCreateTravel={role === 'Traveler'} onClose={() => setCreateGroupOpen(false)} onChatCreated={group => { if (dock && dockView === 'chat' && chat.selected) setMinimized(old => [...old.filter(t => t.key !== chat.selected!.key), chat.selected!].slice(-5)); chat.openChatGroup(group); setMessageSearch(''); setShowSearch(false); setEmojiOpen(false); setActions(false); setDetail(true); setListOpen(false); setDockView('chat'); }} onTravelCreated={group => openThread(groupThread(group))} />}
    {friendsOpen && <FriendsPanel userId={userId} onClose={() => setFriendsOpen(false)} onOpen={async (id) => { await chat.openDirect(id); setMessageSearch(''); setShowSearch(false); setEmojiOpen(false); setActions(false); setDetail(true); setListOpen(false); setDockView('chat'); setFriendsOpen(false); }} />}
    {modal === 'new' && <NewConversation onClose={() => setModal(null)} onOpen={async (id, signal) => { await chat.openDirect(id, signal); if (!signal?.aborted) { setMessageSearch(''); setShowSearch(false); setEmojiOpen(false); setActions(false); setDetail(true); setListOpen(false); setDockView('chat'); } }} />}
    {modal === 'poll' && <CreatePollModal onClose={() => setModal(null)} onSubmit={data => finishModal('poll', data.question, data)} apiError={chat.error ?? undefined} />}
    {modal === 'broadcast' && <BroadcastModal onClose={() => setModal(null)} onSubmit={data => finishModal('broadcast', data.title, data)} apiError={chat.error ?? undefined} />}
    {modal === 'expense' && <CreateExpenseModal onClose={() => setModal(null)} currentUserName={name} memberCount={chat.members.length} apiError={chat.error ?? undefined} onSubmit={data => { const sorted = [...chat.members].sort((a, b) => a.memberId - b.memberId); const base = Math.floor(data.totalAmount / sorted.length); const remainder = data.totalAmount % sorted.length; return finishModal('split_bill', data.title, { ...data, participantNames: sorted.map(m => m.displayName), participants: sorted.map((m, i) => ({ userId: m.memberId, displayName: m.displayName, amount: base + (i < remainder ? 1 : 0) })) }); }} />}
    {modal === 'rollcall' && <RollCallDialog onClose={() => setModal(null)} busy={chat.busy} error={chat.error} title={rollTitle} onTitle={setRollTitle} localError={rollError} onLocalError={setRollError} onSubmit={() => finishModal('roll_call', rollTitle, { title: rollTitle.trim(), totalMembers: chat.selected?.group?.memberCount })} />}
    {qr && <VietQrModal data={qr.data} apiError={chat.error ?? undefined} isPaid={chat.messages.some(m => 'paidUserIds' in m && m.messageId === qr.message.messageId && m.paidUserIds.includes(userId))} onClose={() => setQr(null)} onMarkPaid={async () => { await chat.interact(qr.message, 'paid'); }} />}
    </div>, document.body)}
  </div>;
}

function RollCallDialog({ onClose, busy, error, title, onTitle, localError, onLocalError, onSubmit }: { onClose: () => void; busy: boolean; error: string | null | undefined; title: string; onTitle: (v: string) => void; localError: string; onLocalError: (v: string) => void; onSubmit: () => Promise<boolean> }) {
  const ref = useChatDialog(onClose);
  return <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="roll-title" className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><form className="w-full max-w-md space-y-4 rounded-3xl bg-white p-5" onSubmit={async e => { e.preventDefault(); if (!title.trim()) { onLocalError('Vui lòng nhập tiêu đề điểm danh.'); return; } if (await onSubmit()) { onClose(); onTitle(''); } }}><h2 id="roll-title" className="text-lg font-bold">Tạo điểm danh</h2><label className="block">Tiêu đề<input className="mt-2 w-full rounded-xl border border-brand-border p-3" maxLength={200} value={title} onChange={e => { onTitle(e.target.value); onLocalError(''); }} /></label>{(localError || error) && <p role="alert" className="text-sm text-red-700">{localError || error}</p>}<div className="flex justify-end gap-2"><button type="button" className={control} onClick={onClose}>Hủy</button><button className={control} disabled={busy}>Tạo điểm danh</button></div></form></div>;
}
