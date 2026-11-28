'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { joinTravelGroup, type JoinTravelGroupResponse } from '../services/travelGroupApi';
import { chatError } from './useMessenger';
import { useChatDialog } from './useChatDialog';

interface JoinGroupDialogProps { onClose: () => void; onJoined: (group: JoinTravelGroupResponse, signal?: AbortSignal) => void | Promise<void> }
export function JoinGroupDialog({ onClose, onJoined }: JoinGroupDialogProps) {
  const ref = useChatDialog(onClose);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [joined, setJoined] = useState<JoinTravelGroupResponse | null>(null);
  const alive = useRef(true);
  const lifetime = useRef<AbortController | null>(null);
  const flight = useRef(false);
  const retry = useRef<{ code: string; key: string } | null>(null);
  useEffect(() => {
    const abort = new AbortController(); lifetime.current = abort; alive.current = true;
    return () => { alive.current = false; abort.abort(); };
  }, []);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (flight.current) return;
    const normalized = code.trim().toUpperCase();
    if (!/^[a-z0-9]{8}$/i.test(normalized)) {
      setError('Mã mời phải gồm 8 chữ cái hoặc chữ số.');
      return;
    }
    if (retry.current?.code !== normalized) retry.current = { code: normalized, key: crypto.randomUUID() };
    flight.current = true; setBusy(true); setError('');
    let confirmed = joined;
    try {
      confirmed ??= await joinTravelGroup(normalized, { idempotencyKey: retry.current.key });
      if (!alive.current) return;
      setJoined(confirmed);
      await onJoined(confirmed, lifetime.current?.signal);
      if (alive.current) onClose();
    } catch (failure) {
      if (alive.current) setError(confirmed ? 'Đã tham gia nhóm. Chưa thể mở cuộc trò chuyện; vui lòng thử lại.' : chatError(failure));
    } finally {
      flight.current = false;
      if (alive.current) setBusy(false);
    }
  };
  return <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="join-group-title" className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 text-brand-textPrimary">
    <div className="max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto rounded-2xl border border-brand-border bg-white p-4 shadow-xl sm:p-5">
      <header className="flex items-center justify-between gap-3"><h2 id="join-group-title" className="text-base font-bold">Nhập mã mời</h2><button type="button" aria-label="Đóng nhập mã mời" className="min-h-11 rounded-xl px-3 text-sm text-brand-teal focus-visible:outline-2 focus-visible:outline-brand-teal" onClick={onClose}>Đóng</button></header>
      <p className="mt-2 text-sm text-brand-textSecondary">Nhập mã do trưởng nhóm gửi để tham gia nhóm du lịch.</p>
      <form className="mt-4 space-y-4" onSubmit={submit}>
        <label className="block text-sm font-semibold">Mã mời<input autoFocus autoComplete="off" spellCheck={false} maxLength={8} value={code} disabled={busy || !!joined} onChange={event => { setCode(event.target.value); setError(''); }} className="mt-2 min-h-11 w-full rounded-xl border border-brand-border px-3 py-2 font-mono tracking-widest focus-visible:outline-2 focus-visible:outline-brand-teal disabled:opacity-60" aria-describedby="join-group-hint" /></label>
        <p id="join-group-hint" className="text-xs text-brand-textSecondary">Mã gồm 8 chữ cái hoặc chữ số.</p>
        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={busy} className="min-h-11 w-full rounded-xl bg-brand-teal px-4 py-2 text-sm font-semibold text-white hover:bg-brand-brightTeal focus-visible:outline-2 focus-visible:outline-brand-teal disabled:opacity-60">{busy ? 'Đang tham gia…' : joined ? 'Mở nhóm đã tham gia' : 'Tham gia nhóm'}</button>
      </form>
    </div>
  </div>;
}
