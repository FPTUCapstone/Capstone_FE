'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ActionButton } from '@/components/ui/ActionButton';
import { TextField } from '@/components/ui/FormControls';
import { CHANNEL_LABELS, EMPTY_CREDENTIALS, channelDate, type ChannelCredentials, type PaymentChannel } from './paymentChannel';
import { getChannel, submitChannel, verifyChannel } from './paymentChannelService';

const fields: { key: keyof ChannelCredentials; label: string; maxLength: number; secret?: boolean }[] = [
  { key: 'clientId', label: 'Client ID', maxLength: 500, secret: true },
  { key: 'apiKey', label: 'API Key', maxLength: 500, secret: true },
  { key: 'checksumKey', label: 'Checksum Key', maxLength: 500, secret: true },
  { key: 'beneficiaryAccountNumber', label: 'Số tài khoản nhận', maxLength: 50 },
  { key: 'beneficiaryAccountName', label: 'Tên chủ tài khoản', maxLength: 200 },
  { key: 'beneficiaryBankCode', label: 'Mã ngân hàng', maxLength: 20 },
];
export function PaymentSettingsScreen() {
  const [channel, setChannel] = useState<PaymentChannel | null>(null);
  const [form, setForm] = useState<ChannelCredentials>({ ...EMPTY_CREDENTIALS });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [retry, setRetry] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    getChannel(controller.signal).then((result) => { if (!controller.signal.aborted) setChannel(result); }).catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Chưa thể tải kênh.'); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [retry]);
  async function mutate(kind: 'save' | 'verify') {
    if (busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const next = kind === 'save' ? await submitChannel(Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim()])) as unknown as ChannelCredentials) : await verifyChannel();
      setChannel(next);
      if (kind === 'save') setForm({ ...EMPTY_CREDENTIALS });
      setNotice(kind === 'save' ? 'Đã lưu thông tin. Tiếp tục kiểm tra kết nối.' : next.status === 'Ready' ? 'Kênh đã sẵn sàng nhận thanh toán.' : 'Đã gửi kiểm tra kết nối. Kênh chưa sẵn sàng cho tới khi hoàn tất xác minh.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Chưa thể xử lý yêu cầu.');
      // Verification can persist ConnectionError even when the API returns failure.
      try { setChannel(await getChannel()); } catch { /* Preserve last known status; show original failure. */ }
    } finally { setBusy(false); }
  }
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const missing = fields.find(({ key }) => !form[key].trim());
    if (missing) { setError('Vui lòng điền đủ thông tin kết nối và tài khoản nhận.'); formRef.current?.querySelector<HTMLInputElement>(`[name="${missing.key}"]`)?.focus(); return; }
    void mutate('save');
  }
  return <div className="space-y-6" lang="vi">
    <header><h1 className="text-2xl font-bold text-brand-textPrimary">Kết nối thanh toán payOS</h1><p className="mt-2 text-sm text-brand-textSecondary">Kết nối kênh nhận tiền của doanh nghiệp trước khi gửi tour xét duyệt. Bạn vẫn có thể lưu tour nháp.</p></header>
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
    {notice && <p role="status" className="rounded-xl bg-brand-lightTeal p-4 text-sm text-brand-textPrimary">{notice}</p>}
    {loading ? <p role="status">Đang tải kênh thanh toán…</p> : !channel ? <ActionButton onClick={() => { setError(''); setLoading(true); setRetry((value) => value + 1); }}>Thử lại</ActionButton> : <>
      <section className="rounded-2xl border border-brand-border bg-white p-5 sm:p-6" aria-label="Trạng thái kênh">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-bold">{CHANNEL_LABELS[channel.status]}</h2><ActionButton variant="outline" disabled={busy} onClick={() => { setError(''); setLoading(true); setRetry((value) => value + 1); }}>Tải lại trạng thái</ActionButton></div>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          {([['Chủ tài khoản', channel.beneficiaryAccountName ?? 'Chưa cung cấp'], ['Tài khoản nhận', channel.beneficiaryAccountNumberMasked ?? 'Chưa cung cấp'], ['Mã ngân hàng', channel.beneficiaryBankCode ?? 'Chưa cung cấp'], ['Webhook đăng ký lúc', channelDate(channel.webhookRegisteredAt)], ['Kết nối lúc', channelDate(channel.connectedAt)], ['Kiểm tra gần nhất', channelDate(channel.lastVerifiedAt)]]).map(([label, value]) => <div key={label}><dt className="text-brand-textSecondary">{label}</dt><dd className="mt-1 break-words font-semibold">{value}</dd></div>)}
        </dl>
        {channel.status === 'PendingVerification' && <p className="mt-4 text-sm text-brand-textSecondary">Thông tin đang chờ xác minh. Việc lưu thông tin không đồng nghĩa đã được duyệt.</p>}
        {channel.status === 'Disabled' && <p className="mt-4 text-sm text-brand-textSecondary">Kênh đã bị vô hiệu hóa. Liên hệ bộ phận hỗ trợ để được hướng dẫn.</p>}
        {channel.allowedActions.includes('verify') && <ActionButton className="mt-4" loading={busy} onClick={() => void mutate('verify')}>Kiểm tra kết nối</ActionButton>}
      </section>
      {channel.allowedActions.includes('submit_credentials') && <form ref={formRef} onSubmit={save} className="rounded-2xl border border-brand-border bg-white p-5 sm:p-6">
        <h2 className="font-bold">Thông tin kênh và người nhận</h2>
        <p className="mt-2 text-sm text-brand-textSecondary">Lấy ba khóa từ cấu hình kênh payOS. Không nhập mật khẩu payOS, mật khẩu ngân hàng hoặc OTP. Khóa đã lưu sẽ không được hiển thị lại.</p>
        {channel.status === 'Ready' && <p className="mt-3 text-sm text-amber-800">Lưu thông tin mới sẽ đưa kênh về chờ xác minh. Hãy kiểm tra lại thông tin trước khi thay đổi.</p>}
        <fieldset disabled={busy} className="mt-5 grid min-w-0 gap-4 sm:grid-cols-2"><legend className="sr-only">Cấu hình kết nối</legend>{fields.map(({ key, label, maxLength, secret }) => <TextField key={key} name={key} label={label} type={secret ? 'password' : 'text'} value={form[key]} required maxLength={maxLength} autoComplete={secret ? 'new-password' : 'off'} spellCheck={false} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} />)}</fieldset>
        <ActionButton type="submit" loading={busy} className="mt-5">Lưu thông tin kết nối</ActionButton>
      </form>}
    </>}
  </div>;
}
