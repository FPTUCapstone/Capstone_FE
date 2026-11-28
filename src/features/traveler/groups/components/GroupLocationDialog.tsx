'use client';

import { useEffect, useRef, useState } from 'react';
import { AuthStorage } from '@/features/auth/session/authSession';
import { fetchChatMembers, type ChatMember } from '../services/travelGroupApi';
import {
  clearGroupLocation, fetchGroupLocations, fetchGroupLocationSharing, publishGroupLocation, setGroupLocationSharing,
  type GroupLocation,
} from '../services/groupLocationApi';
import { useChatDialog } from './useChatDialog';
import type { Thread } from './useMessenger';

export interface GroupLocationDialogProps { thread: Thread; onClose: () => void }
const intervalMs = 15_000;
const freshnessMs = 120_000;
const button = 'min-h-11 rounded-xl border border-brand-border px-3 py-2 text-sm font-semibold text-brand-teal hover:bg-brand-lightTeal focus-visible:outline-2 focus-visible:outline-brand-teal';
type Phase = 'idle' | 'starting' | 'sharing' | 'stopping';
const message = (error: unknown) => error instanceof Error ? error.message : 'Không thể kết nối máy chủ. Vui lòng thử lại.';

// A group switch tears down the old sender and starts with fresh, unchecked consent.
export function GroupLocationDialog(props: GroupLocationDialogProps) {
  const group = props.thread.group;
  const eligible = props.thread.kind === 'group' && !props.thread.chatGroup && group?.status === 'Active'
    && group.groupId === props.thread.id && Number.isSafeInteger(group.itineraryId) && group.itineraryId > 0
    && AuthStorage.getContext()?.role === 'Traveler';
  return eligible ? <LocationDialog key={props.thread.key} groupId={props.thread.id} groupName={props.thread.title} onClose={props.onClose} />
    : <UnavailableDialog onClose={props.onClose} />;
}

function UnavailableDialog({ onClose }: { onClose: () => void }) {
  const ref = useChatDialog(onClose);
  return <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="gps-unavailable-title" className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 text-brand-textPrimary">
    <div className="w-full max-w-sm space-y-3 rounded-2xl border border-brand-border bg-white p-4 shadow-xl">
      <h2 id="gps-unavailable-title" className="text-base font-bold">Vị trí nhóm</h2>
      <p role="alert" className="text-sm">Vị trí chỉ dành cho tài khoản Traveler đang hoạt động và là thành viên của nhóm du lịch theo lịch trình đang hoạt động. Trưởng nhóm cũng phải đáp ứng điều kiện này.</p>
      <button type="button" className={button} onClick={onClose}>Đóng</button>
    </div>
  </div>;
}

function LocationDialog({ groupId, groupName, onClose }: { groupId: number; groupName: string; onClose: () => void }) {
  const ref = useChatDialog(onClose);
  const actions = useRef<{ start: () => void; stop: () => void; refresh: () => void } | null>(null);
  const [consent, setConsent] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState('');
  const [cleanupNeeded, setCleanupNeeded] = useState(false);
  const [viewError, setViewError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [rows, setRows] = useState<GroupLocation[]>([]);
  const [members, setMembers] = useState<ChatMember[]>([]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const ownerId = AuthStorage.getContext()?.userId;
    const sameAccount = () => ownerId !== undefined && AuthStorage.getContext()?.userId === ownerId
      && AuthStorage.getContext()?.role === 'Traveler';
    let alive = true;
    let generation = 0;
    let active = false;
    let busy = false;
    let touched = false;
    let sessionVersion: string | null = null;
    let queue: Promise<unknown> = Promise.resolve();
    let reading = false;
    let readController: AbortController | null = null;
    const visible = () => document.visibilityState === 'visible';
    const current = (token: number) => alive && visible() && sameAccount() && active && token === generation;

    const refresh = async () => {
      if (!alive || !visible() || !sameAccount() || reading) return;
      reading = true;
      const controller = new AbortController();
      readController = controller;
      try {
        const [locations, names] = await Promise.all([fetchGroupLocations(groupId, controller.signal), fetchChatMembers(groupId)]);
        if (!alive || controller.signal.aborted || !visible() || !sameAccount()) return;
        setRows(locations.locations); setMembers(names); setNow(Date.now()); setLoaded(true); setViewError('');
      } catch (failure) {
        if (alive && !controller.signal.aborted) {
          setRows([]); setLoaded(true); setViewError(message(failure));
        }
      } finally {
        reading = false;
      }
    };

    const stop = (reason = '') => {
      active = false; generation += 1; sessionVersion = null;
      if (alive) { setConsent(false); setPhase('stopping'); setError(reason); }
      // Drain an in-flight enable/publish before clearing: a late PUT must never
      // recreate a coordinate after DELETE. Do not abort mutations with unknown outcomes.
      queue = queue.catch(() => undefined).then(async () => {
        if (!touched) return;
        if (!sameAccount()) {
          if (alive) setError('Tài khoản đã thay đổi. GPS đã dừng; đăng nhập lại tài khoản cũ để xóa vị trí trên máy chủ.');
          return;
        }
        let failed = false;
        try { await setGroupLocationSharing(groupId, false); } catch { failed = true; }
        // Still attempt DELETE when disabling fails; it also invalidates the old session.
        try { await clearGroupLocation(groupId); } catch { failed = true; }
        if (failed) {
          if (alive) { setCleanupNeeded(true); setError('Đã dừng GPS trên Web nhưng chưa xác nhận xóa vị trí trên máy chủ. Hãy thử dừng và xóa lại.'); }
        } else {
          touched = false;
          if (alive) setCleanupNeeded(false);
        }
      }).finally(() => {
        if (alive) { setPhase('idle'); void refresh(); }
      });
    };

    const locate = () => new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, failure => reject(new Error(failure.code === 1
        ? 'Bạn chưa cho phép truy cập vị trí. Hãy cấp quyền trong trình duyệt rồi thử lại.'
        : failure.code === 3 ? 'Lấy vị trí quá lâu. Hãy thử lại.' : 'Không lấy được vị trí hiện tại. Hãy thử lại.')),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10_000 });
    });
    const send = async (token: number) => {
      const position = await locate();
      if (!current(token)) return;
      const age = Date.now() - position.timestamp;
      if (!Number.isFinite(age) || age < 0 || age > intervalMs) throw new Error('Vị trí đã cũ. Hãy thử lấy vị trí mới.');
      if (!sessionVersion) {
        touched = true;
        const setting = await setGroupLocationSharing(groupId, true);
        if (!current(token)) return;
        sessionVersion = setting.sessionVersion;
      }
      if (!current(token) || !sessionVersion) return;
      // Enabling the session may have taken long enough for the GPS fix to expire.
      if (Date.now() - position.timestamp > intervalMs) throw new Error('Vị trí đã cũ. Hãy thử lấy vị trí mới.');
      await publishGroupLocation(groupId, {
        latitude: position.coords.latitude, longitude: position.coords.longitude, sessionVersion,
      });
      if (current(token)) { setPhase('sharing'); void refresh(); }
    };
    const tick = () => {
      if (!active || busy || !alive || !visible()) return;
      if (!sameAccount()) { stop('Tài khoản đã thay đổi. Hãy đóng và mở lại hộp thoại.'); return; }
      busy = true;
      const token = generation;
      queue = queue.catch(() => undefined).then(() => current(token) ? send(token) : undefined)
        .catch(failure => { if (current(token)) stop(message(failure)); })
        .finally(() => { busy = false; });
    };
    actions.current = {
      start: () => {
        if (!alive || active || !visible()) return;
        if (!sameAccount()) { setError('Phiên đăng nhập đã thay đổi. Hãy đóng và mở lại hộp thoại.'); return; }
        if (!window.isSecureContext || !navigator.geolocation) {
          setError('GPS cần trình duyệt hỗ trợ vị trí và kết nối HTTPS (hoặc localhost).'); return;
        }
        setError(''); setPhase('starting'); active = true; generation += 1; tick();
      },
      stop: () => stop(),
      refresh: () => { void refresh(); },
    };
    const visibility = () => {
      if (!visible()) {
        readController?.abort(); setRows([]); setConsent(false);
        if (active || touched) stop('Chia sẻ đã dừng vì trang bị ẩn. Cần đồng ý lại để tiếp tục.');
      } else { void refresh(); }
    };
    const pageHide = () => {
      readController?.abort(); setRows([]); setConsent(false);
      if (active || touched) stop('Chia sẻ đã dừng vì trang bị ẩn. Cần đồng ý lại để tiếp tục.');
    };
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('pagehide', pageHide);
    const unsubscribe = AuthStorage.subscribe(() => {
      if (!sameAccount()) {
        readController?.abort(); setRows([]);
        stop('Tài khoản đã thay đổi. Hãy đóng và mở lại hộp thoại.');
      }
    });
    const timer = window.setInterval(() => { tick(); void refresh(); }, intervalMs);
    const clock = window.setInterval(() => setNow(Date.now()), 1000);
    const initial = new AbortController();
    void fetchGroupLocationSharing(groupId, initial.signal).catch(failure => {
      if (alive && !initial.signal.aborted) setError(message(failure));
    });
    void refresh();
    return () => {
      alive = false; actions.current = null; initial.abort(); readController?.abort();
      window.clearInterval(timer); window.clearInterval(clock); document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('pagehide', pageHide);
      unsubscribe();
      stop();
    };
  }, [groupId]);

  const freshRows = rows.filter(row => {
    const age = now - Date.parse(row.recordedAtUtc);
    return age >= 0 && age <= freshnessMs && members.some(member => member.memberId === row.userId);
  });
  const sharing = phase === 'sharing' || phase === 'starting';
  return <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="group-gps-title" className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 text-brand-textPrimary">
    <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-brand-border bg-white shadow-xl">
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-brand-border p-4">
        <div className="min-w-0"><h2 id="group-gps-title" className="text-base font-bold">Vị trí nhóm</h2>{groupName && <p className="mt-1 break-words text-sm text-brand-textSecondary">{groupName}</p>}</div>
        <button type="button" className={`${button} shrink-0`} onClick={onClose} aria-label="Đóng vị trí nhóm">Đóng</button>
      </header>
      <div className="min-h-0 space-y-4 overflow-y-auto p-4">
        <section aria-labelledby="gps-consent-title" className="space-y-3 rounded-xl bg-brand-lightTeal p-3">
          <h3 id="gps-consent-title" className="text-sm font-semibold">Chia sẻ GPS từ Web</h3>
          <p id="gps-consent-description" className="text-sm text-brand-textSecondary">Các thành viên Traveler đang hoạt động trong cùng nhóm du lịch theo lịch trình đang hoạt động, bao gồm trưởng nhóm đủ điều kiện, sẽ thấy tọa độ của bạn. Cập nhật mỗi 15 giây khi hộp thoại và trang đang mở. Đóng hộp thoại hoặc ẩn trang sẽ dừng và gửi yêu cầu xóa vị trí. Không tự tiếp tục khi quay lại.</p>
          <label className="flex min-h-11 items-start gap-2 text-sm"><input type="checkbox" className="mt-1 size-4 accent-brand-teal focus-visible:outline-2 focus-visible:outline-brand-teal" checked={consent} disabled={phase !== 'idle'} aria-describedby="gps-consent-description" onChange={event => setConsent(event.target.checked)} />Tôi đồng ý chia sẻ vị trí với nhóm này.</label>
          <p role="status" className="text-sm">{phase === 'sharing' ? 'Đang chia sẻ vị trí.' : phase === 'starting' ? 'Đang lấy và gửi vị trí mới…' : phase === 'stopping' ? 'Đang dừng và xóa vị trí…' : 'Web chưa chia sẻ vị trí.'}</p>
          {sharing ? <button type="button" className={`${button} w-full`} onClick={() => actions.current?.stop()}>Dừng và xóa vị trí</button>
            : <button type="button" className={`${button} w-full disabled:opacity-50`} disabled={!consent || phase !== 'idle'} onClick={() => actions.current?.start()}>Bắt đầu chia sẻ vị trí</button>}
          {cleanupNeeded && <button type="button" className={`${button} w-full disabled:opacity-50`} disabled={phase !== 'idle'} onClick={() => actions.current?.stop()}>Dừng và xóa lại trên máy chủ</button>}
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        </section>
        <section aria-labelledby="gps-members-title" className="space-y-3">
          <div className="flex items-center justify-between gap-2"><h3 id="gps-members-title" className="text-sm font-semibold">Vị trí thành viên</h3><button type="button" className={button} onClick={() => actions.current?.refresh()}>Làm mới</button></div>
          <p className="text-sm text-brand-textSecondary">Chỉ hiển thị tọa độ được ghi nhận trong 2 phút gần đây. Thời gian bên dưới là lúc máy chủ nhận vị trí.</p>
          {viewError ? <p role="alert" className="text-sm text-red-700">{viewError}</p> : !loaded ? <p role="status" className="text-sm">Đang tải vị trí…</p>
            : !freshRows.length ? <p className="text-sm text-brand-textSecondary">Chưa có vị trí mới được chia sẻ.</p>
              : <ul className="space-y-2">{freshRows.map(row => <li key={row.userId} className="space-y-1 break-words rounded-xl border border-brand-border p-3 text-sm">
                <p className="font-semibold">{members.find(member => member.memberId === row.userId)?.displayName}</p>
                <p>Vĩ độ: {row.latitude.toFixed(6)} · Kinh độ: {row.longitude.toFixed(6)}</p>
                <time dateTime={row.recordedAtUtc} className="block text-xs text-brand-textSecondary">{new Date(row.recordedAtUtc).toLocaleString('vi-VN')}</time>
                <a className="inline-block min-h-8 py-1 text-xs font-semibold text-brand-teal underline underline-offset-2" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${row.latitude},${row.longitude}`)}`} target="_blank" rel="noopener noreferrer">Xem vị trí trên bản đồ</a>
              </li>)}</ul>}
        </section>
      </div>
    </div>
  </div>;
}
