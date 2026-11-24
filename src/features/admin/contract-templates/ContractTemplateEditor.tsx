'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { ActionButton } from '@/components/ui/ActionButton';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { formatTripDateTime } from '@/features/trips/utils/formatTripDate';
import { ROUTES } from '@/lib/routes';
import { canPublishTemplate, documentUrl, templateStatusLabel, type ContractTemplateDetail } from './contractTemplates';
import { createVersion, getTemplate, publishTemplate, requestPreview, updateTemplate, validateTemplateUpload } from './contractTemplatesService';

export function ContractTemplateEditor({ id }: { id: string }) {
  const [template, setTemplate] = useState<ContractTemplateDetail | null>(null);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File>();
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openedPreviewRevision, setOpenedPreviewRevision] = useState<number | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [newId, setNewId] = useState<string>();
  const [pollPaused, setPollPaused] = useState(false);
  const operationKey = useRef<string | null>(null);
  const submitLock = useRef(false);
  const pollCount = useRef(0);
  const loadGeneration = useRef(0);

  const apply = useCallback((next: ContractTemplateDetail) => {
    setTemplate(next); setTitle(next.title); setFile(undefined);
    setOpenedPreviewRevision(null); setAcknowledged(false); operationKey.current = null;
    pollCount.current = 0; setPollPaused(false);
  }, []);
  const load = useCallback(async (signal?: AbortSignal) => {
    const generation = ++loadGeneration.current;
    try { const next = await getTemplate(id, signal); if (!signal?.aborted && generation === loadGeneration.current) apply(next); }
    catch (reason) { if (!signal?.aborted && generation === loadGeneration.current) setError(message(reason)); }
    finally { if (!signal?.aborted && generation === loadGeneration.current) setLoading(false); }
  }, [id, apply]);
  useEffect(() => {
    const controller = new AbortController();
    const generation = ++loadGeneration.current;
    void getTemplate(id, controller.signal)
      .then((next) => { if (!controller.signal.aborted && generation === loadGeneration.current) apply(next); })
      .catch((reason) => { if (!controller.signal.aborted && generation === loadGeneration.current) setError(message(reason)); })
      .finally(() => { if (!controller.signal.aborted && generation === loadGeneration.current) setLoading(false); });
    return () => controller.abort();
  }, [id, apply]);

  useEffect(() => {
    if (!template || template.renderState !== 'Processing' || pollPaused || busy) return;
    let active = true;
    const timer = setTimeout(() => {
      if (++pollCount.current > 30) { setPollPaused(true); return; }
      void getTemplate(id).then((next) => {
        if (!active) return;
        setTemplate(next);
        if (next.draftRevision !== template.draftRevision || next.sourceSha256 !== template.sourceSha256) {
          setOpenedPreviewRevision(null); setAcknowledged(false);
        }
      }).catch(() => { if (active) { setError('Chưa thể cập nhật trạng thái PDF. Hãy tải lại.'); setPollPaused(true); } });
    }, 2000);
    return () => { active = false; clearTimeout(timer); };
  }, [template, id, pollPaused, busy]);

  const draft = template?.status === 'Draft';
  const dirty = !!template && (title !== template.title || !!file);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  async function mutate(action: () => Promise<ContractTemplateDetail>, success: string) {
    if (submitLock.current) return;
    submitLock.current = true; setBusy(true); setError(''); setNotice('');
    try { apply(await action()); setNotice(success); setConfirming(false); }
    catch (reason) { setError(message(reason)); setConfirming(false); }
    finally { submitLock.current = false; setBusy(false); }
  }
  async function save(event: FormEvent) {
    event.preventDefault(); if (!template || !draft || !title.trim()) return;
    const invalid = file ? validateTemplateUpload(file) : null;
    if (invalid) { setError(invalid); return; }
    await mutate(() => updateTemplate(template, title, file), 'Đã lưu bản nháp. Hãy tạo lại PDF xem trước trước khi công bố.');
  }
  function publish() {
    if (!template || !canPublishTemplate(template) || dirty || !acknowledged || openedPreviewRevision !== template.draftRevision) return;
    operationKey.current ??= crypto.randomUUID();
    void mutate(() => publishTemplate(template, operationKey.current!), 'Mẫu đã công bố. Nội dung được khóa.');
  }
  const previewReady = template?.renderState === 'Ready' && template.previewRevision === template.draftRevision;
  if (loading) return <main className="p-6"><p role="status">Đang tải mẫu hợp đồng…</p></main>;
  if (!template) return <main className="p-6"><p role="alert">{error || 'Không tìm thấy mẫu hợp đồng.'}</p><ActionButton variant="outline" onClick={() => void load()}>Tải lại</ActionButton></main>;
  return <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
    <Link href={ROUTES.admin.contractTemplates} onClick={(event) => { if (dirty && !window.confirm('Bản nháp có thay đổi chưa lưu. Rời trang?')) event.preventDefault(); }} className="inline-flex min-h-11 items-center text-sm font-semibold underline">← Danh sách mẫu hợp đồng</Link>
    <header><p className="text-sm text-brand-muted">{template.version ? `Phiên bản ${template.version}` : 'Bản nháp chưa công bố'} · {templateStatusLabel[template.status]} · Lần sửa {template.draftRevision}</p><h1 className="mt-2 break-words text-2xl font-bold">{template.title}</h1><p className="mt-2 text-xs text-brand-muted">Cập nhật: {formatTripDateTime(template.updatedAtUtc)} · Thế hệ công bố {template.publicationHead.generation}</p></header>
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><p>{error}</p><button type="button" disabled={busy} onClick={() => void load()} className="mt-2 min-h-11 font-semibold underline">Tải lại dữ liệu</button></div>}
    {notice && <p role="status" className="rounded-xl bg-brand-lightTeal p-4 text-sm">{notice}</p>}
    {!draft && <section className="rounded-xl border border-brand-border bg-white p-4"><p>{template.status === 'Archived' ? 'Phiên bản này đã lưu trữ và khóa nội dung.' : 'Mẫu đã công bố. Nội dung được khóa.'}</p><p className="mt-2 text-sm text-brand-muted">Muốn chỉnh sửa, hãy tạo một bản nháp mới. Các hợp đồng cũ không thay đổi.</p><ActionButton className="mt-3" loading={busy} onClick={async () => { if (submitLock.current) return; submitLock.current = true; setBusy(true); setError(''); try { setNewId((await createVersion(template)).id); } catch (reason) { setError(message(reason)); } finally { submitLock.current = false; setBusy(false); } }}>Tạo phiên bản mới</ActionButton>{newId && <Link className="ml-4 inline-flex min-h-11 items-center underline" href={ROUTES.admin.contractTemplate(newId)}>Mở phiên bản mới</Link>}</section>}
    <section className="rounded-2xl border border-brand-border bg-white p-5">
      <h2 className="text-lg font-bold">File nguồn và biến tự động</h2>
      <a className="mt-2 inline-flex min-h-11 break-all font-semibold underline" href={documentUrl(id, 'source')}>Tải DOCX: {template.sourceFileName}</a>
      {draft && <form className="mt-3 space-y-4" onSubmit={save}>
        <label className="block text-sm font-semibold">Tên mẫu hợp đồng<input value={title} required maxLength={200} disabled={busy} onChange={(event) => { setTitle(event.target.value); setAcknowledged(false); }} className="mt-2 block min-h-11 w-full rounded-xl border border-brand-border px-3" /></label>
        <label className="block text-sm font-semibold">Thay file DOCX<input type="file" accept=".docx" disabled={busy} onChange={(event) => { setFile(event.target.files?.[0]); setAcknowledged(false); }} className="mt-2 block w-full rounded-xl border border-brand-border p-2" /></label>
        <ActionButton type="submit" loading={busy} disabled={!dirty || !title.trim()}>Lưu bản nháp</ActionButton>
      </form>}
      <p className="mt-4 text-sm">Biến nhận diện: {template.variables.length ? template.variables.map((variable) => `{{${variable}}}`).join(', ') : 'Chưa có biến'}</p>
      {!!template.missingVariables.length && <p className="mt-2 text-sm text-red-700">Thiếu biến bắt buộc: {template.missingVariables.join(', ')}</p>}
      {!!template.unknownVariables.length && <p className="mt-2 text-sm text-red-700">Biến không được hỗ trợ: {template.unknownVariables.join(', ')}</p>}
    </section>
    <section className="rounded-2xl border border-brand-border bg-white p-5" aria-labelledby="preview-heading">
      <h2 id="preview-heading" className="text-lg font-bold">PDF xem trước</h2>
      <p className="mt-2 text-sm text-brand-muted">Dùng dữ liệu mẫu, không dùng để ký. Kiểm tra đầy đủ nội dung, font chữ và vùng chữ ký trước khi công bố.</p>
      {template.renderState === 'Processing' && <p role="status" className="mt-3">Đang tạo PDF…{pollPaused ? ' Đã dừng cập nhật tự động. Hãy tải lại trạng thái.' : ''}</p>}
      {template.renderState === 'Failed' && <p className="mt-3 text-sm text-red-700">Không tạo được PDF. Hãy kiểm tra file hoặc thử lại khi dịch vụ sẵn sàng.</p>}
      {draft && <ActionButton variant="outline" className="mt-3" disabled={busy || dirty || template.renderState === 'Processing' || template.validationStatus !== 'Valid'} onClick={() => void mutate(() => requestPreview(template), 'Đã yêu cầu tạo PDF xem trước.')}>Tạo PDF xem trước</ActionButton>}
      {dirty && <p className="mt-2 text-sm text-amber-800">Lưu các thay đổi trước khi tạo PDF hoặc công bố.</p>}
      {previewReady && <div className="mt-4"><a href={documentUrl(id, 'preview')} target="_blank" rel="noreferrer" onClick={() => setOpenedPreviewRevision(template.draftRevision)} className="inline-flex min-h-11 items-center font-semibold underline">Mở PDF xem trước</a><p className="mt-1 text-xs text-brand-muted">PDF mở trong tab mới; có thể tải từ trình xem PDF của trình duyệt.</p></div>}
      {pollPaused && <ActionButton variant="outline" onClick={() => void load()}>Tải lại trạng thái</ActionButton>}
      {draft && <div className="mt-5 border-t border-brand-border pt-4"><label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={acknowledged} disabled={!previewReady || openedPreviewRevision !== template.draftRevision || dirty || busy} onChange={(event) => setAcknowledged(event.target.checked)} className="mt-1 h-4 w-4" />Tôi đã kiểm tra PDF của bản nháp hiện tại và xác nhận nội dung chính thức.</label><ActionButton className="mt-4" disabled={busy || dirty || !acknowledged || openedPreviewRevision !== template.draftRevision || !canPublishTemplate(template)} onClick={() => setConfirming(true)}>Công bố phiên bản</ActionButton></div>}
    </section>
    {confirming && <ConfirmationDialog title="Công bố mẫu hợp đồng?" confirmLabel="Xác nhận công bố" pending={busy} onCancel={() => setConfirming(false)} onConfirm={publish}><p>Bản này sẽ được áp dụng cho hợp đồng mới. Bản đang áp dụng được chuyển sang lưu trữ; hợp đồng đã phát hành không bị thay đổi.</p></ConfirmationDialog>}
  </main>;
}

function message(reason: unknown) { return reason instanceof Error ? reason.message : 'Chưa thể xử lý mẫu hợp đồng. Vui lòng thử lại.'; }
