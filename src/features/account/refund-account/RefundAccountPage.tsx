'use client';

import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react';
import { ActionButton } from '@/components/ui/ActionButton';
import { useWebSession } from '@/features/auth/session/useWebSession';

type RefundAccount = { bankCode: string; accountNumber: string; accountHolder: string };
const EMPTY: RefundAccount = { bankCode: '', accountNumber: '', accountHolder: '' };
const API = '/api/v1/traveler/refund-account';

function parseAccount(value: unknown): RefundAccount | null {
  if (value === null) return null;
  if (!value || typeof value !== 'object') throw new Error('Invalid account');
  const source = value as Record<string, unknown>;
  if (typeof source.bankCode !== 'string' || typeof source.accountNumber !== 'string' || typeof source.accountHolder !== 'string') throw new Error('Invalid account');
  return { bankCode: source.bankCode, accountNumber: source.accountNumber, accountHolder: source.accountHolder };
}

export function RefundAccountPage() {
  const { status, context } = useWebSession();
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading');
  const [form, setForm] = useState<RefundAccount>(EMPTY);
  const [saved, setSaved] = useState<RefundAccount | null>(null);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const isTraveler = status === 'authenticated' && context?.role === 'Traveler';
  const identityEpoch = useRef(0);
  useLayoutEffect(() => {
    identityEpoch.current += 1;
    return () => { identityEpoch.current += 1; };
  }, [isTraveler, context?.userId]);

  useEffect(() => {
    if (!isTraveler) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setPhase('loading');
      setSaving(false); setFeedback(null); setError(null);
      void fetch(API, { cache: 'no-store', signal: controller.signal })
        .then(async response => {
          if (!response.ok) throw new Error('Unavailable');
          return parseAccount(await response.json());
        })
        .then(account => {
          if (controller.signal.aborted) return;
          setSaved(account); setForm(account ?? EMPTY); setLoadedUserId(String(context?.userId)); setPhase('ready');
        })
        .catch(() => { if (!controller.signal.aborted) setPhase('error'); });
    }, 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [isTraveler, context?.userId, revision]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isTraveler || saving || phase !== 'ready' || loadedUserId !== String(context?.userId)) return;
    const account = { bankCode: form.bankCode.trim(), accountNumber: form.accountNumber.trim(), accountHolder: form.accountHolder.trim() };
    setFeedback(null); setError(null);
    if (!account.bankCode || !account.accountNumber || !account.accountHolder) { setError('Vui lòng điền đầy đủ thông tin tài khoản.'); return; }
    setSaving(true);
    const saveEpoch = identityEpoch.current;
    try {
      const response = await fetch(API, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(account), credentials: 'same-origin' });
      if (saveEpoch !== identityEpoch.current) return;
      if (!response.ok) {
        setError(response.status === 400 ? 'Thông tin tài khoản chưa hợp lệ. Vui lòng kiểm tra lại.' : 'Chưa thể lưu tài khoản. Vui lòng thử lại.');
        return;
      }
      setForm(account); setSaved(account); setFeedback('Đã lưu tài khoản nhận hoàn tiền.');
    } catch { if (saveEpoch === identityEpoch.current) setError('Chưa thể kết nối. Vui lòng thử lại.'); }
    finally { if (saveEpoch === identityEpoch.current) setSaving(false); }
  }

  if (!isTraveler || phase === 'loading' || (phase === 'ready' && loadedUserId !== String(context?.userId))) return <p role="status" className="py-12 text-center text-sm text-[#5B6E69]">Đang tải tài khoản nhận hoàn tiền…</p>;
  if (phase === 'error') return <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-800"><p>Chưa thể tải tài khoản nhận hoàn tiền.</p><button type="button" onClick={() => setRevision(value => value + 1)} className="mt-3 font-semibold underline">Thử lại</button></div>;

  return (
    <section className="rounded-2xl border border-[#DCE2DD] bg-white p-5 shadow-sm sm:p-6">
      <h1 className="text-xl font-bold text-[#1C2928]">Tài khoản nhận hoàn tiền</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#5B6E69]">Lưu một lần để dùng cho các yêu cầu hoàn tiền mới. Hãy kiểm tra đúng ngân hàng, số tài khoản và tên chủ tài khoản trước khi lưu.</p>
      <div className="mt-5 rounded-xl border border-[#DCE2DD] bg-[#F7F9F8] p-4 text-sm text-[#5B6E69]">
        {saved ? <p>Tài khoản đã lưu sẽ được tự động dùng cho hồ sơ hoàn tiền mới.</p> : <p>Bạn chưa lưu tài khoản nhận hoàn tiền.</p>}
        <p className="mt-1">Khi lưu, hồ sơ đang chờ thông tin nhận tiền sẽ được cập nhật. Hồ sơ đã xác nhận tài khoản hoặc đã chuyển tiền vẫn giữ nguyên.</p>
      </div>
      <form onSubmit={event => void save(event)} className="mt-6 space-y-5">
        <fieldset disabled={saving} className="grid gap-5 disabled:opacity-60 sm:grid-cols-2">
          <legend className="sr-only">Thông tin tài khoản ngân hàng</legend>
          <label className="block text-sm font-semibold text-[#1C2928]">Ngân hàng / mã ngân hàng
            <input value={form.bankCode} onChange={event => setForm(value => ({ ...value, bankCode: event.target.value }))} required maxLength={20} placeholder="Ví dụ: VCB" autoComplete="off" className="mt-2 w-full rounded-xl border border-[#DCE2DD] px-3 py-3 font-normal outline-none focus:ring-2 focus:ring-[#174B4A]" />
          </label>
          <label className="block text-sm font-semibold text-[#1C2928]">Số tài khoản
            <input value={form.accountNumber} onChange={event => setForm(value => ({ ...value, accountNumber: event.target.value }))} required maxLength={50} inputMode="numeric" autoComplete="off" className="mt-2 w-full rounded-xl border border-[#DCE2DD] px-3 py-3 font-normal outline-none focus:ring-2 focus:ring-[#174B4A]" />
          </label>
          <label className="block text-sm font-semibold text-[#1C2928] sm:col-span-2">Tên chủ tài khoản
            <input value={form.accountHolder} onChange={event => setForm(value => ({ ...value, accountHolder: event.target.value }))} required maxLength={200} autoComplete="off" placeholder="Tên chủ tài khoản tại ngân hàng" className="mt-2 w-full rounded-xl border border-[#DCE2DD] px-3 py-3 font-normal outline-none focus:ring-2 focus:ring-[#174B4A]" />
          </label>
        </fieldset>
        {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>}
        {feedback && <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{feedback}</p>}
        <div className="flex flex-wrap justify-end gap-3">
          <ActionButton type="button" variant="outline" disabled={saving} onClick={() => { setForm(saved ?? EMPTY); setError(null); setFeedback(null); }}>Hủy thay đổi</ActionButton>
          <ActionButton type="submit" variant="primary" disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu tài khoản'}</ActionButton>
        </div>
      </form>
    </section>
  );
}
