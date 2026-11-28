'use client';

import { useEffect, useRef, useState } from 'react';
import { AuthStorage } from '@/features/auth/session/authSession';
import { fetchChatMembers, type ChatMember } from '../services/travelGroupApi';
import { fetchChatGroupMembers } from '../services/chatGroupMembersApi';
import { getPendingChatGroupLeave, hasPendingGroupLeave, leaveChatGroup, leaveTravelGroup } from '../services/groupLeaveApi';
import { dissolveMessengerGroup, removeMessengerGroupMember, renameMessengerGroup } from '../services/groupManagementApi';
import { chatError, type Thread } from './useMessenger';
import { useChatDialog } from './useChatDialog';

interface GroupDetailsDialogProps { thread: Thread; onClose: () => void; onInvite?: () => void; onLocation?: () => void; onLeft?: () => void; onChanged?: () => void; startLeaving?: boolean }
type ManagementPanel = { key: string; action: 'rename' | 'dissolve' } | { key: string; action: 'remove'; member: ChatMember };
const button = 'min-h-11 rounded-xl border border-brand-border px-3 py-2 text-sm font-semibold text-brand-teal hover:bg-brand-lightTeal focus-visible:outline-2 focus-visible:outline-brand-teal';
export function GroupDetailsDialog({ thread, onClose, onInvite, onLocation, onLeft, onChanged, startLeaving = false }: GroupDetailsDialogProps) {
  const leaving = useRef(false);
  const restoreFocus = useRef(true);
  const managementRef = useRef<HTMLElement>(null);
  const [saving, setSaving] = useState(false);
  const [confirmationKey, setConfirmationKey] = useState<string | null>(() => startLeaving ? thread.key : null);
  const [leaveError, setLeaveError] = useState<{ key: string; message: string } | null>(null);
  const [replacement, setReplacement] = useState<{ key: string; actorId: number; userId: number | null } | null>(null);
  const ref = useChatDialog(() => { if (!leaving.current) onClose(); }, () => restoreFocus.current);
  const [management, setManagement] = useState<ManagementPanel | null>(null);
  const [name, setName] = useState('');
  const [managementError, setManagementError] = useState<{ key: string; message: string } | null>(null);
  const [renamed, setRenamed] = useState<{ key: string; title: string } | null>(null);
  const [managementNotice, setManagementNotice] = useState<{ key: string; message: string } | null>(null);
  const lifecycle = useRef({ active: true });
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{ key: string; revision: number; members: ChatMember[]; error: string; loading: boolean } | null>(null);
  const { id, key, kind, chatGroup } = thread;
  useEffect(() => {
    const current = { active: true };
    lifecycle.current = current;
    return () => { current.active = false; };
  }, [key]);
  useEffect(() => {
    const abort = new AbortController();
    if (kind !== 'group') {
      return () => abort.abort();
    }
    const request = chatGroup ? fetchChatGroupMembers(id, abort.signal) : fetchChatMembers(id);
    request.then(members => {
      if (!abort.signal.aborted) setResult({ key, revision, members, error: '', loading: false });
    }).catch(error => {
      if (!abort.signal.aborted) setResult({ key, revision, members: [], error: chatError(error), loading: false });
    });
    return () => abort.abort();
  }, [id, key, kind, chatGroup, revision]);
  const current = kind !== 'group' ? { members: [], error: 'Cuộc trò chuyện này không phải nhóm.', loading: false }
    : result?.key === key && result.revision === revision ? result : null;
  const closed = thread.isClosed === true || thread.group?.status === 'Closed';
  const title = renamed?.key === key ? renamed.title : thread.title;
  const owner = AuthStorage.getContext();
  const pendingChatLeave = chatGroup ? getPendingChatGroupLeave(id) : null;
  const ownMember = current && !current.loading && !current.error
    ? current.members.find(member => member.memberId === owner?.userId) : undefined;
  const canManage = kind === 'group' && !closed && owner?.status === 'Active' && ownMember?.isHost === true
    && (!!chatGroup || owner.role === 'Traveler');
  const canInvite = canManage && !chatGroup && !!onInvite;
  const panel = management?.key === key ? management : null;
  useEffect(() => {
    if (!panel || !canManage) return;
    const section = managementRef.current;
    if (!section) return;
    const target = panel.action === 'rename' ? section.querySelector<HTMLInputElement>('input') : section;
    target?.focus({ preventScroll: true });
    section.scrollIntoView?.({ block: 'start', behavior: 'auto' });
  }, [panel, canManage]);
  const nameLimit = chatGroup ? 100 : 150;
  const trimmedName = name.trim();
  const nameError = !trimmedName ? 'Nhập tên nhóm.' : trimmedName.length > nameLimit ? `Tên nhóm tối đa ${nameLimit} ký tự.` : '';
  const independentHost = !!chatGroup && (ownMember?.isHost ?? (pendingChatLeave?.replacementHostUserId != null));
  const replacementHostUserId = independentHost
    ? replacement?.key === key && replacement.actorId === owner?.userId ? replacement.userId : pendingChatLeave?.replacementHostUserId ?? null
    : null;
  const eligibleHosts = current && !current.loading && !current.error
    ? current.members.filter(member => member.memberId !== owner?.userId && !member.isHost && member.canReceiveHost === true) : [];
  const retryingLeave = hasPendingGroupLeave(id, chatGroup ? 'chat' : 'travel', replacementHostUserId);
  const canLeave = kind === 'group' && !closed && owner?.status === 'Active'
    && (chatGroup ? !!ownMember || pendingChatLeave !== null
      : owner.role === 'Traveler' && (retryingLeave || (thread.group?.status === 'Active' && !!ownMember)));
  const canConfirmLeave = canLeave && (!chatGroup || retryingLeave || (!!ownMember
    && (!independentHost || eligibleHosts.some(member => member.memberId === replacementHostUserId))));
  const canOfferLeave = kind === 'group' && !closed && owner?.status === 'Active'
    && (chatGroup || owner.role === 'Traveler' && (thread.group?.status === 'Active' || retryingLeave));
  const confirming = confirmationKey === key;
  function openManagement(next: ManagementPanel) {
    if (leaving.current || !canManage || (next.action === 'dissolve' && !chatGroup)) return;
    setManagement(next);
    setConfirmationKey(null);
    setManagementError(null);
    setManagementNotice(null);
    if (next.action === 'rename') setName(title);
  }
  async function confirmManagement() {
    if (leaving.current || !canManage || !panel || (panel.action === 'dissolve' && !chatGroup)) return;
    const currentOwner = AuthStorage.getContext();
    if (!currentOwner || currentOwner.userId !== owner?.userId || currentOwner.status !== 'Active'
      || (!chatGroup && currentOwner.role !== 'Traveler')) return;
    if (panel.action === 'rename' && nameError) {
      setManagementError({ key, message: nameError });
      return;
    }
    if (panel.action === 'remove' && !current?.members.some(member => member.memberId === panel.member.memberId
      && member.memberId !== currentOwner.userId && !member.isHost)) {
      setManagementError({ key, message: 'Thành viên này không còn đủ điều kiện để xóa. Hãy tải lại danh sách thành viên.' });
      return;
    }
    const requestLifecycle = lifecycle.current;
    leaving.current = true;
    setSaving(true);
    setManagementError(null);
    let succeeded = false;
    try {
      if (panel.action === 'rename') await renameMessengerGroup(thread, trimmedName);
      else if (panel.action === 'remove') await removeMessengerGroupMember(thread, panel.member.memberId);
      else await dissolveMessengerGroup(thread);
      succeeded = true;
    } catch (error) {
      if (requestLifecycle.active) setManagementError({ key, message: chatError(error) });
    } finally {
      leaving.current = false;
      if (lifecycle.current.active) setSaving(false);
    }
    if (!succeeded || !requestLifecycle.active || AuthStorage.getContext()?.userId !== currentOwner.userId) return;
    setManagement(null);
    if (panel.action === 'remove') {
      setManagementNotice({ key, message: `Đã xóa “${panel.member.displayName}” khỏi nhóm.` });
      setRevision(value => value + 1);
      onChanged?.();
    } else if (panel.action === 'rename') {
      setRenamed({ key, title: trimmedName });
      setManagementNotice({ key, message: 'Đã đổi tên nhóm.' });
      onChanged?.();
    } else {
      onChanged?.();
      onClose();
    }
  }
  async function confirmLeave() {
    if (leaving.current || !canConfirmLeave || !confirming) return;
    const currentOwner = AuthStorage.getContext();
    if (!currentOwner || currentOwner.userId !== owner?.userId || currentOwner.status !== 'Active'
      || (!chatGroup && currentOwner.role !== 'Traveler')) return;
    const requestLifecycle = lifecycle.current;
    leaving.current = true;
    setSaving(true);
    setLeaveError(null);
    let succeeded = false;
    try {
      if (chatGroup) await leaveChatGroup(id, replacementHostUserId);
      else await leaveTravelGroup(id);
      succeeded = true;
    } catch (error) {
      if (requestLifecycle.active) setLeaveError({ key, message: chatError(error) });
    } finally {
      leaving.current = false;
      if (lifecycle.current.active) setSaving(false);
    }
    if (succeeded && requestLifecycle.active && AuthStorage.getContext()?.userId === currentOwner.userId) {
      restoreFocus.current = false;
      onLeft?.();
      onClose();
    }
  }
  return <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="group-details-title" aria-busy={saving} className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 text-brand-textPrimary">
    <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-brand-border bg-white shadow-xl">
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-brand-border p-4">
        <div className="min-w-0"><h2 id="group-details-title" className="text-base font-bold">Thông tin nhóm</h2><p className="mt-1 break-words text-sm text-brand-textSecondary">{title}</p></div>
        <button type="button" className={`${button} shrink-0 disabled:opacity-50`} disabled={saving} onClick={() => { if (!leaving.current) onClose(); }} aria-label="Đóng thông tin nhóm">Đóng</button>
      </header>
      <div className="min-h-0 space-y-4 overflow-y-auto p-4">
        {closed && <p role="status" className="text-sm text-brand-textSecondary">Nhóm đã đóng. Lịch sử trò chuyện được giữ lại.</p>}
        {canInvite && <button type="button" className={`${button} w-full`} disabled={saving} onClick={() => { if (!leaving.current) onInvite?.(); }}>Mã mời / QR vào nhóm</button>}
        {canManage && <section ref={managementRef} tabIndex={-1} className="space-y-3 rounded-xl border border-brand-border p-3 focus-visible:outline-2 focus-visible:outline-brand-teal" aria-labelledby="group-management-title"
          aria-describedby={panel && panel.action !== 'rename' ? 'group-management-confirmation' : undefined}>
          <h3 id="group-management-title" className="text-sm font-semibold">Quản lý nhóm</h3>
          {!chatGroup && <p className="text-xs leading-relaxed text-brand-textSecondary">Nhóm du lịch đóng theo vòng đời chuyến đi; không giải tán tại đây để giữ lịch sử và quyền truy cập lịch trình.</p>}
          {!panel ? <div className="flex flex-wrap gap-2">
            <button type="button" className={button} disabled={saving} onClick={() => openManagement({ key, action: 'rename' })}>Đổi tên nhóm</button>
            {chatGroup && <button type="button" className={`${button} border-red-200 text-red-700 hover:bg-red-50`} disabled={saving} onClick={() => openManagement({ key, action: 'dissolve' })}>Giải tán nhóm</button>}
          </div> : <form className="space-y-3" noValidate onSubmit={event => { event.preventDefault(); void confirmManagement(); }}>
            {panel.action === 'rename' ? <div className="space-y-2">
              <label htmlFor="group-management-name" className="block text-sm font-semibold">Tên nhóm</label>
              <input id="group-management-name" className={`${button} w-full bg-white text-brand-textPrimary`} value={name} required maxLength={nameLimit} disabled={saving}
                aria-invalid={!!nameError} aria-describedby={`group-management-name-help${nameError ? ' group-management-name-error' : ''}`}
                onChange={event => { if (!leaving.current) setName(event.target.value); }} />
              <p id="group-management-name-help" className="text-xs text-brand-textSecondary">Tên bắt buộc, tối đa {nameLimit} ký tự; khoảng trắng đầu và cuối sẽ được bỏ.</p>
              {nameError && <p id="group-management-name-error" className="text-sm text-red-700">{nameError}</p>}
            </div> : panel.action === 'remove' ? <div id="group-management-confirmation" className="space-y-2 break-words text-sm">
              <p>Xóa “{panel.member.displayName}” khỏi nhóm “{title}”?</p>
              <p className="text-brand-textSecondary">Thành viên này sẽ mất quyền truy cập trò chuyện của nhóm.</p>
            </div> : <div id="group-management-confirmation" className="space-y-2 break-words text-sm">
              <p>Giải tán nhóm “{title}”?</p>
              <p className="text-brand-textSecondary">Nhóm sẽ đóng và không thể tiếp tục trò chuyện. Lịch sử trò chuyện vẫn được giữ lại. Thao tác này không hủy bất kỳ booking (đặt chỗ) hay lịch trình nào.</p>
            </div>}
            {managementError?.key === key && <div className="space-y-2">
              <p role="alert" className="text-sm text-red-700">{managementError.message}</p>
              <button type="button" className={button} disabled={saving} onClick={() => {
                if (leaving.current) return;
                setRevision(value => value + 1);
                onChanged?.();
              }}>Tải lại thông tin nhóm</button>
            </div>}
            {saving && <p role="status" className="text-sm text-brand-textSecondary">Đang lưu… Vui lòng chờ xác nhận.</p>}
            <div className="flex flex-wrap gap-2">
              <button type="button" className={button} disabled={saving} onClick={() => { if (!leaving.current) { setManagement(null); setManagementError(null); } }}>Hủy</button>
              <button type="submit" className={`${button} disabled:opacity-50`} disabled={saving || (panel.action === 'rename' && !!nameError)}
                aria-describedby={panel.action === 'rename' ? undefined : 'group-management-confirmation'}>
                {panel.action === 'rename' ? 'Lưu tên nhóm' : panel.action === 'remove' ? 'Xác nhận xóa thành viên' : 'Xác nhận giải tán nhóm'}
              </button>
            </div>
          </form>}
          {managementNotice?.key === key && <p role="status" className="break-words text-sm text-brand-textSecondary">{managementNotice.message}</p>}
        </section>}
        <section aria-labelledby="group-members-title">
          <h3 id="group-members-title" className="text-sm font-semibold">Thành viên{current && !current.loading && !current.error ? ` (${current.members.length})` : ''}</h3>
          {!current || current.loading ? <p role="status" className="mt-3 text-sm text-brand-textSecondary">Đang tải thành viên…</p>
            : current.error ? <div role="alert" className="mt-3 space-y-2 text-sm text-red-700"><p>{current.error}</p><button type="button" className={button} disabled={saving} onClick={() => setRevision(value => value + 1)}>Thử lại</button></div>
              : <><ul className="mt-3 space-y-2">{current.members.map(member => <li key={member.memberId} className="flex flex-wrap items-center gap-3 rounded-xl border border-brand-border p-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-lightTeal font-semibold text-brand-teal" aria-hidden="true">{member.displayName.trim().slice(0, 1).toLocaleUpperCase('vi')}</span>
                <span className="min-w-0 flex-1 break-words text-sm font-medium">{member.displayName}</span>
                {member.isHost && <span className="shrink-0 text-xs text-brand-textSecondary">Trưởng nhóm</span>}
                {canManage && member.memberId !== owner?.userId && !member.isHost && <button type="button" className={`${button} disabled:opacity-50`} disabled={saving}
                  aria-label={`Xóa ${member.displayName} khỏi nhóm`} onClick={() => openManagement({ key, action: 'remove', member })}>Xóa khỏi nhóm</button>}
              </li>)}</ul>{!current.members.length && <p className="mt-3 text-sm text-brand-textSecondary">Chưa có thành viên để hiển thị.</p>}</>}
        </section>
        {kind === 'group' && !chatGroup && onLocation && <section className="rounded-xl bg-brand-lightTeal p-3" aria-labelledby="group-location-title">
          <h3 id="group-location-title" className="text-sm font-semibold text-brand-teal">Chia sẻ vị trí trong nhóm</h3>
          <p className="mt-1 text-xs leading-relaxed text-brand-textSecondary">Thành viên Traveler đang hoạt động trong nhóm này có thể xem vị trí bạn tự nguyện chia sẻ. Tắt chia sẻ hoặc đưa ứng dụng xuống nền để ngừng gửi vị trí.</p>
          <button type="button" className={button} disabled={saving || closed} onClick={() => { if (!leaving.current && !closed) onLocation?.(); }}>Thiết lập và xem vị trí</button>
        </section>}
      </div>
        {canOfferLeave && <section className="max-h-[55dvh] shrink-0 space-y-3 overflow-y-auto border-t border-brand-border p-4" aria-labelledby="group-leave-title">
          <h3 id="group-leave-title" className="sr-only">Rời nhóm</h3>
          {!current && <p role="status" className="text-xs text-brand-textSecondary">Đang xác nhận tư cách thành viên…</p>}
          {confirming ? <>
            <p id="group-leave-confirmation" className="break-words text-sm">Bạn có chắc muốn rời nhóm “{title}”?</p>
            {retryingLeave && !saving && <p className="text-xs leading-relaxed text-brand-textSecondary">Yêu cầu trước chưa được xác nhận. Thử lại sẽ dùng cùng mã yêu cầu để xác nhận kết quả.</p>}
            <p className="text-xs leading-relaxed text-brand-textSecondary">Sau khi rời, bạn mất quyền truy cập trò chuyện của nhóm này.</p>
            {!chatGroup && thread.group?.hostUserId === owner?.userId && <p className="text-xs leading-relaxed text-brand-textSecondary">Nếu bạn là trưởng nhóm khi rời, quyền trưởng nhóm sẽ tự động chuyển cho thành viên đang hoạt động tham gia sớm nhất; nếu cùng thời điểm, chọn người có ID nhỏ nhất. Nếu không còn thành viên đang hoạt động, nhóm sẽ đóng và các lời mời còn hiệu lực sẽ hết hạn.</p>}
            {independentHost && <div className="space-y-2">
              <label htmlFor="group-leave-replacement" className="block text-sm font-semibold">Chọn trưởng nhóm thay thế</label>
              <p className="text-xs leading-relaxed text-brand-textSecondary">Bạn phải chọn một thành viên đang hoạt động nhận quyền trưởng nhóm trước khi rời.</p>
              <select id="group-leave-replacement" className={`${button} w-full bg-white`} disabled={saving || closed}
                value={replacementHostUserId ?? ''} onChange={event => {
                  if (leaving.current || !owner) return;
                  setReplacement({ key, actorId: owner.userId, userId: event.target.value ? Number(event.target.value) : null });
                  setLeaveError(null);
                }}>
                <option value="">Chọn thành viên</option>
                {eligibleHosts.map(member => <option key={member.memberId} value={member.memberId}>{member.displayName}</option>)}
                {retryingLeave && replacementHostUserId !== null && !eligibleHosts.some(member => member.memberId === replacementHostUserId)
                  && <option value={replacementHostUserId}>Người đã chọn trong yêu cầu trước (ID {replacementHostUserId})</option>}
              </select>
              {!eligibleHosts.length && !retryingLeave && <p role="status" className="text-sm text-brand-textSecondary">Chưa có thành viên đủ điều kiện. Hãy thêm một thành viên đang hoạt động vào nhóm, rồi chọn người thay thế trước khi rời.</p>}
            </div>}
            {leaveError?.key === key && <p role="alert" className="text-sm text-red-700">{leaveError.message}</p>}
            {saving && <p role="status" className="text-sm text-brand-textSecondary">Đang rời nhóm… Vui lòng chờ xác nhận.</p>}
            <div className="flex flex-wrap gap-2">
              <button type="button" autoFocus className={`${button} disabled:opacity-50`} disabled={saving} onClick={() => { if (!leaving.current) setConfirmationKey(null); }}>Hủy</button>
              <button type="button" className={`${button} disabled:opacity-50`} disabled={saving || !canConfirmLeave} aria-describedby="group-leave-confirmation" onClick={() => { void confirmLeave(); }}>{saving ? 'Đang rời nhóm…' : 'Xác nhận rời nhóm'}</button>
            </div>
          </> : <button type="button" className={`${button} w-full border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50`} disabled={saving || !canLeave} onClick={() => { if (!leaving.current) { setManagement(null); setConfirmationKey(key); } }}>Rời nhóm</button>}
        </section>}
    </div>
  </div>;
}
