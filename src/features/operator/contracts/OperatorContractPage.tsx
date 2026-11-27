'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { PartnerShell } from '@/components/layout/PartnerShell';
import { ActionButton } from '@/components/ui/ActionButton';
import { useWebSession } from '@/features/auth/session/useWebSession';
import { PartnerWorkspaceLayout } from '@/features/operator/common/components/PartnerWorkspaceLayout';
import { PageContentContainer } from '@/features/operator/common/components/PageContentContainer';
import { webRefresh } from '@/lib/authApi';
import { ROUTES } from '@/lib/routes';
import { SignaturePad } from './SignaturePad';
import { contractDateTime, contractDocumentUrl, getContractPdf, getCurrentContract, OperatorContractError, prepareContract, requestSigningChallenge, signContract, type ContractChallenge, type OperatorContract } from './operatorContracts';

function message(reason: unknown) { return reason instanceof OperatorContractError ? reason.message : 'Chưa thể xử lý hợp đồng. Vui lòng thử lại.'; }

export function OperatorContractPage() {
  const { context } = useWebSession();
  const isWorkspace = context?.onboardingState === undefined || context?.onboardingState === 'Active';
  const [contract, setContract] = useState<OperatorContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [signerTitle, setSignerTitle] = useState('');
  const [signerCapacity, setSignerCapacity] = useState('');
  const [signature, setSignature] = useState<Blob | null>(null);
  const [confirmedName, setConfirmedName] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [challenge, setChallenge] = useState<ContractChallenge | null>(null);
  const [otp, setOtp] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const [pdf, setPdf] = useState<{ key: string; url: string } | null>(null);
  const [pdfError, setPdfError] = useState('');
  const [pdfReload, setPdfReload] = useState(0);
  const [resetEpoch, setResetEpoch] = useState(0);
  const [pollPaused, setPollPaused] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState('');
  const lock = useRef(false);
  const operationKey = useRef<string | null>(null);
  const pollCount = useRef(0);
  const loadGeneration = useRef(0);
  const refreshedSignedContract = useRef<string | null>(null);

  const apply = useCallback((next: OperatorContract) => {
    setContract(next); setSignerName(next.signerName); setSignerTitle(next.signerTitle); setSignerCapacity(next.signerCapacity);
    setSignature(null); setConfirmedName(''); setAccepted(false); setChallenge(null); setOtp('');
    operationKey.current = null; setResetEpoch((value) => value + 1);
  }, []);
  const load = useCallback(async (signal?: AbortSignal) => {
    const generation = ++loadGeneration.current;
    try { const next = await getCurrentContract(signal); if (!signal?.aborted && generation === loadGeneration.current) apply(next); }
    catch (reason) { if (!signal?.aborted && generation === loadGeneration.current) setError(message(reason)); }
    finally { if (!signal?.aborted && generation === loadGeneration.current) setLoading(false); }
  }, [apply]);
  useEffect(() => {
    const controller = new AbortController(); const generation = ++loadGeneration.current;
    void getCurrentContract(controller.signal)
      .then((next) => { if (!controller.signal.aborted && generation === loadGeneration.current) apply(next); })
      .catch((reason) => { if (!controller.signal.aborted && generation === loadGeneration.current) setError(message(reason)); })
      .finally(() => { if (!controller.signal.aborted && generation === loadGeneration.current) setLoading(false); });
    return () => controller.abort();
  }, [apply]);

  useEffect(() => {
    if (contract?.documentState !== 'Processing' || pollPaused) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      if (++pollCount.current >= 30) { setPollPaused(true); return; }
      void load(controller.signal);
    }, 2000);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [contract, load, pollPaused]);
  useEffect(() => {
    if (!challenge) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [challenge]);

  const kind = contract?.status === 'Signed' ? 'signed' : 'unsigned';
  const contractId = contract?.id;
  const pdfKey = contract && (contract.documentState === 'Ready' || contract.status === 'Signed')
    ? `${contract.id}:${kind}:${contract.signedDocumentSha256 ?? contract.unsignedDocumentSha256}` : null;
  useEffect(() => {
    if (!pdfKey || !contractId) return;
    const controller = new AbortController(); let url: string | null = null;
    void getContractPdf(contractId, kind, controller.signal).then((blob) => {
      if (controller.signal.aborted) return;
      url = URL.createObjectURL(blob); setPdf({ key: pdfKey, url }); setPdfError('');
    }).catch((reason) => { if (!controller.signal.aborted) setPdfError(message(reason)); });
    return () => { controller.abort(); if (url) URL.revokeObjectURL(url); };
  }, [pdfKey, contractId, kind, pdfReload]);
  const pdfUrl = pdf?.key === pdfKey ? pdf.url : null;

  const refreshSession = useCallback(async () => {
    try { await webRefresh(); setSessionReady(true); setSessionError(''); }
    catch { setSessionError('Hợp đồng đã ký nhưng chưa làm mới được phiên đăng nhập. Vui lòng thử lại hoặc đăng nhập lại.'); }
  }, []);
  useEffect(() => {
    if (contract?.status !== 'Signed' || refreshedSignedContract.current === contract.id) return;
    refreshedSignedContract.current = contract.id;
    void refreshSession();
  }, [contract?.id, contract?.status, refreshSession]);
  useEffect(() => {
    if (!contract || contract.status === 'Signed') return;
    const controller = new AbortController();
    const check = () => {
      if (document.visibilityState === 'hidden' || lock.current) return;
      void getCurrentContract(controller.signal).then((next) => {
        if (!controller.signal.aborted && (next.id !== contract.id || next.status !== contract.status || next.acceptedContentSha256 !== contract.acceptedContentSha256)) apply(next);
      }).catch(() => { /* The explicit refresh action retains error/retry UX when connectivity returns. */ });
    };
    window.addEventListener('focus', check);
    document.addEventListener('visibilitychange', check);
    return () => { controller.abort(); window.removeEventListener('focus', check); document.removeEventListener('visibilitychange', check); };
  }, [contract, apply]);

  async function recover(reason: unknown, signing = false) {
    if (reason instanceof OperatorContractError && (reason.status === 409 || (signing && reason.status >= 500))) {
      try {
        const current = await getCurrentContract();
        if (current.status === 'Signed' || reason.status === 409) { apply(current); if (current.status === 'Signed') { setError(''); return; } }
      } catch { /* Keep the original failure and retry key when the final result remains unknown. */ }
    }
    setError(message(reason));
  }
  async function prepare(event: FormEvent) {
    event.preventDefault();
    if (!contract?.canPrepare || lock.current || !signerName.trim() || !signerTitle.trim() || !signerCapacity.trim()) return;
    lock.current = true; setBusy(true); setError('');
    try { apply(await prepareContract(contract.id, { signerName: signerName.trim(), signerTitle: signerTitle.trim(), signerCapacity: signerCapacity.trim(), rowVersion: contract.rowVersion })); pollCount.current = 0; setPollPaused(false); }
    catch (reason) { await recover(reason); }
    finally { lock.current = false; setBusy(false); }
  }
  const expiresAt = challenge ? Date.parse(challenge.expiresAtUtc) : 0;
  const resendAt = challenge ? Date.parse(challenge.resendAtUtc) : 0;
  const otpValid = challenge !== null && Number.isFinite(expiresAt) && now < expiresAt;
  const resendSeconds = challenge ? Math.max(0, Math.ceil((resendAt - now) / 1000)) : 0;
  async function sendOtp() {
    if (!contract?.canSign || !contract.acceptedContentSha256 || lock.current || resendSeconds > 0) return;
    lock.current = true; setBusy(true); setError('');
    try {
      const next = await requestSigningChallenge(contract.id, { expectedContentSha256: contract.acceptedContentSha256, rowVersion: contract.rowVersion });
      setChallenge(next); setOtp(''); setNow(Date.now()); operationKey.current = null;
      setContract((current) => current ? { ...current, rowVersion: next.rowVersion } : current);
    } catch (reason) { await recover(reason); }
    finally { lock.current = false; setBusy(false); }
  }
  const updateSignature = useCallback((blob: Blob | null) => { setSignature(blob); operationKey.current = null; }, []);
  const canSubmit = contract?.canSign && contract.status === 'PendingSignature' && contract.documentState === 'Ready' &&
    !!contract.acceptedContentSha256 && !!pdfUrl && accepted && signature !== null && confirmedName.trim() === contract.signerName.trim() && otpValid && /^\d{6}$/.test(otp);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit || !contract || !signature || !challenge || !contract.acceptedContentSha256 || lock.current) return;
    lock.current = true; setBusy(true); setError('');
    operationKey.current ??= crypto.randomUUID();
    try {
      const result = await signContract(contract.id, { expectedContentSha256: contract.acceptedContentSha256, rowVersion: challenge.rowVersion,
        signerName: confirmedName.trim(), acceptedTerms: true, consentVersion: contract.otpPolicy.consentVersion, challengeId: challenge.challengeId, otp, idempotencyKey: operationKey.current }, signature);
      if (result.status !== 'Signed') throw new OperatorContractError(503);
      apply(result);
    } catch (reason) { await recover(reason, true); }
    finally { lock.current = false; setBusy(false); }
  }
  function reload() { setError(''); pollCount.current = 0; setPollPaused(false); void load(); }

  const pageContent = (
    <div className="space-y-6">
      {loading && <p role="status">Đang tải hợp đồng…</p>}
      {error && <div role="alert" className="rounded-xl border border-error bg-white p-4 text-error">{error}</div>}
      {!loading && !contract && <ActionButton variant="outline" onClick={reload}>Thử lại</ActionButton>}
      {contract && <>
        <section className="rounded-2xl border border-brand-border bg-white p-5 sm:p-7">
          <p className="text-sm text-brand-textSecondary">{contract.companyName} · Phiên bản {contract.templateVersion}</p>
          <h2 className="mt-2 text-2xl font-bold text-brand-textPrimary">{contract.title}</h2>
          <p className="mt-2 text-sm">{contract.status === 'Signed' ? 'Hợp đồng đã ký thành công.' : contract.status === 'Voided' ? 'Hợp đồng này đã bị thu hồi, không thể ký.' : 'Hồ sơ đã được duyệt. Bạn cần hoàn tất ký hợp đồng trước khi sử dụng chức năng kinh doanh.'}</p>
          {contract.status === 'Signed' && <p className="mt-2 text-sm">Ngày ký: {contractDateTime(contract.signedAtUtc)}</p>}
        </section>
        {contract.canPrepare && contract.status === 'PendingSignature' && <form onSubmit={prepare} className="space-y-4 rounded-2xl border border-brand-border bg-white p-5 sm:p-7">
          <h3 className="text-xl font-bold">Thông tin người có thẩm quyền ký</h3>
          <p className="text-sm text-brand-textSecondary">Tự xác nhận thông tin đại diện và căn cứ ký. Thông tin liên hệ trong hồ sơ không tự chứng minh thẩm quyền đại diện. Thông tin đã xác nhận sẽ được ghi vào bản hợp đồng để bạn đọc trước khi ký.</p>
          <label className="block text-sm font-semibold">Họ tên người đại diện<input required maxLength={150} value={signerName} disabled={busy} onChange={(event) => setSignerName(event.target.value)} className="mt-2 block min-h-11 w-full rounded-xl border border-brand-border px-3" /></label>
          <label className="block text-sm font-semibold">Chức vụ<input required maxLength={150} value={signerTitle} disabled={busy} onChange={(event) => setSignerTitle(event.target.value)} className="mt-2 block min-h-11 w-full rounded-xl border border-brand-border px-3" /></label>
          <label className="block text-sm font-semibold">Tư cách đại diện hoặc căn cứ ủy quyền<textarea required maxLength={500} value={signerCapacity} disabled={busy} onChange={(event) => setSignerCapacity(event.target.value)} className="mt-2 block min-h-24 w-full rounded-xl border border-brand-border p-3" /></label>
          <ActionButton type="submit" loading={busy}>Xác nhận thông tin và tạo hợp đồng</ActionButton>
        </form>}
        {contract.documentState === 'Processing' && <section className="space-y-3 rounded-2xl border border-brand-border bg-white p-5"><p role="status">Đang tạo bản hợp đồng từ thông tin đã xác nhận. Bạn có thể quay lại sau.</p>{pollPaused && <p>Đã tạm dừng cập nhật tự động. Dùng nút bên dưới để kiểm tra kết quả.</p>}<ActionButton variant="outline" onClick={reload} disabled={busy}>Kiểm tra lại</ActionButton></section>}
        {contract.documentState === 'Failed' && <section className="space-y-3 rounded-2xl border border-brand-border bg-white p-5"><p role="alert">Chưa tạo được tài liệu hợp đồng. Vui lòng thử tải lại hoặc liên hệ hỗ trợ; tài khoản vẫn chưa được kích hoạt.</p><ActionButton variant="outline" onClick={reload}>Tải lại trạng thái</ActionButton></section>}
        {pdfKey && <section className="space-y-4 rounded-2xl border border-brand-border bg-white p-5 sm:p-7">
          <h3 className="text-xl font-bold">Nội dung hợp đồng {contract.status === 'Signed' ? 'đã ký' : 'cần ký'}</h3>
          <dl className="grid gap-3 text-sm sm:grid-cols-2"><div><dt>Người ký</dt><dd className="font-semibold">{contract.signerName}</dd></div><div><dt>Chức vụ</dt><dd className="font-semibold">{contract.signerTitle}</dd></div><div className="sm:col-span-2"><dt>Tư cách đại diện</dt><dd>{contract.signerCapacity}</dd></div></dl>
          {pdfUrl ? <><iframe title="Nội dung hợp đồng" src={pdfUrl} className="h-[65vh] min-h-96 w-full rounded-xl border border-brand-border" /><a href={pdfUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-semibold text-primary underline">Mở PDF toàn màn hình</a></> : !pdfError && <p role="status">Đang tải PDF riêng tư…</p>}
          {pdfError && <div role="alert"><p>{pdfError}</p><ActionButton variant="outline" onClick={() => setPdfReload((value) => value + 1)}>Tải lại PDF</ActionButton></div>}
          <a href={contractDocumentUrl(contract.id, kind)} download className="inline-flex min-h-11 items-center rounded-xl border border-brand-border px-4 text-sm font-semibold">{kind === 'signed' ? 'Tải hợp đồng đã ký' : 'Tải hợp đồng chưa ký'}</a>
          <details className="text-xs text-brand-textSecondary"><summary className="min-h-11 cursor-pointer py-3">Thông tin đối chiếu phiên bản</summary><p className="break-all">Mã hợp đồng: {contract.id} · SHA256 nội dung: {contract.acceptedContentSha256}</p></details>
        </section>}
        {contract.canSign && contract.status === 'PendingSignature' && contract.documentState === 'Ready' && <form onSubmit={submit} className="space-y-5 rounded-2xl border border-brand-border bg-white p-5 sm:p-7">
          <h3 className="text-xl font-bold">Xác nhận ký hợp đồng</h3>
          <label className="flex gap-3 text-sm"><input type="checkbox" checked={accepted} disabled={busy || !pdfUrl} onChange={(event) => { setAccepted(event.target.checked); operationKey.current = null; }} className="mt-1 size-4 shrink-0" /><span>Tôi đã đọc toàn bộ hợp đồng đúng phiên bản hiển thị, có thẩm quyền đại diện và đồng ý ký nội dung này.</span></label>
          <label className="block text-sm font-semibold">Họ tên xác nhận ký<input autoComplete="name" required maxLength={150} value={confirmedName} disabled={busy} onChange={(event) => { setConfirmedName(event.target.value); operationKey.current = null; }} className="mt-2 block min-h-11 w-full rounded-xl border border-brand-border px-3" /></label>
          {confirmedName.trim() && confirmedName.trim() !== contract.signerName.trim() && <p className="text-sm text-error">Họ tên phải khớp người đại diện ghi trên hợp đồng.</p>}
          <SignaturePad key={`${contract.id}:${contract.acceptedContentSha256}:${resetEpoch}`} onChange={updateSignature} disabled={busy || !pdfUrl} />
          <div className="space-y-3 border-t border-brand-border pt-5">
            <p className="text-sm">OTP được gửi tới email tài khoản để xác nhận lần ký này. Mã có hiệu lực {Math.floor(contract.otpPolicy.timeToLiveSeconds / 60)} phút, tối đa {contract.otpPolicy.maxFailedAttempts} lần nhập sai.</p>
            <ActionButton type="button" variant="outline" onClick={() => void sendOtp()} disabled={busy || resendSeconds > 0 || !pdfUrl}>{challenge ? `Gửi lại OTP${resendSeconds > 0 ? ` sau ${resendSeconds}s` : ''}` : 'Gửi OTP qua email'}</ActionButton>
            {challenge && <><p role="status" className="text-sm">Đã gửi mã tới {challenge.maskedEmail}. Hết hạn lúc {contractDateTime(challenge.expiresAtUtc)}.</p>{!otpValid && <p className="text-sm text-error">OTP đã hết hạn. Vui lòng yêu cầu mã mới.</p>}</>}
            <label className="block text-sm font-semibold">Mã OTP<input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={otp} disabled={busy || !challenge} onChange={(event) => { setOtp(event.target.value.replace(/\D/g, '').slice(0, 6)); operationKey.current = null; }} className="mt-2 block min-h-11 w-full max-w-xs rounded-xl border border-brand-border px-3" /></label>
          </div>
          <ActionButton type="submit" disabled={!canSubmit} loading={busy}>Xác nhận ký hợp đồng</ActionButton>
        </form>}
        {contract.status === 'Signed' && <section className="space-y-3 rounded-2xl border border-brand-border bg-white p-5">{sessionError && <p role="alert">{sessionError}</p>}{sessionReady ? <Link href={ROUTES.partner.dashboard} className="inline-flex min-h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-white">Vào trang quản lý</Link> : <ActionButton variant="outline" onClick={() => void refreshSession()}>Làm mới phiên đăng nhập</ActionButton>}</section>}
      </>}
    </div>
  );

  if (isWorkspace) {
    return (
      <PartnerWorkspaceLayout activeTab="contract" operatorName={context?.fullName ?? undefined}>
        <PageContentContainer>{pageContent}</PageContentContainer>
      </PartnerWorkspaceLayout>
    );
  }
  return (
    <PartnerShell title="Hợp đồng đối tác" description="Kiểm tra nội dung hợp đồng và xác nhận chữ ký của người có thẩm quyền.">
      {pageContent}
    </PartnerShell>
  );
}
