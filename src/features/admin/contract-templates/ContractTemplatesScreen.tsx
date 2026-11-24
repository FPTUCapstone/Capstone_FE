'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { ActionButton } from '@/components/ui/ActionButton';
import { ROUTES } from '@/lib/routes';
import { formatTripDateTime } from '@/features/trips/utils/formatTripDate';
import { templateStatusLabel, type ContractTemplatePage } from './contractTemplates';
import { createTemplate, listTemplates, validateTemplateUpload } from './contractTemplatesService';

export function ContractTemplatesScreen() {
  const [data, setData] = useState<ContractTemplatePage | null>(null);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File>();
  const [uploadError, setUploadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [createdId, setCreatedId] = useState<string>();
  const requestGeneration = useRef(0);
  const reload = useCallback(async (signal?: AbortSignal) => {
    const generation = ++requestGeneration.current;
    try { const next = await listTemplates(status, page, signal); if (!signal?.aborted && generation === requestGeneration.current) { setData(next); setError(''); } }
    catch { if (!signal?.aborted && generation === requestGeneration.current) setError('Chưa thể tải danh sách mẫu hợp đồng.'); }
    finally { if (!signal?.aborted && generation === requestGeneration.current) setLoading(false); }
  }, [status, page]);
  useEffect(() => {
    const controller = new AbortController();
    const generation = ++requestGeneration.current;
    void listTemplates(status, page, controller.signal)
      .then((next) => { if (!controller.signal.aborted && generation === requestGeneration.current) { setData(next); setError(''); } })
      .catch(() => { if (!controller.signal.aborted && generation === requestGeneration.current) setError('Chưa thể tải danh sách mẫu hợp đồng.'); })
      .finally(() => { if (!controller.signal.aborted && generation === requestGeneration.current) setLoading(false); });
    return () => controller.abort();
  }, [status, page]);
  async function submit(event: FormEvent) {
    event.preventDefault(); if (saving || !file || !title.trim()) return;
    const invalid = validateTemplateUpload(file); if (invalid) { setUploadError(invalid); return; }
    setSaving(true); setUploadError('');
    try { const created = await createTemplate(title, file); setCreatedId(created.id); await reload(); }
    catch (reason) { setUploadError(reason instanceof Error ? reason.message : 'Chưa thể lưu bản nháp.'); }
    finally { setSaving(false); }
  }
  return <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
    <header><p className="text-xs font-bold uppercase tracking-widest text-brand-teal">Quản trị đối tác</p><h1 className="mt-2 text-3xl font-bold">Mẫu hợp đồng đối tác</h1><p className="mt-2 text-sm text-brand-muted">Soạn nháp, kiểm tra PDF và công bố mẫu cho hợp đồng mới. Phiên bản đã công bố được khóa nội dung.</p></header>
    <section className="rounded-2xl border border-brand-border bg-white p-5" aria-labelledby="create-template-heading">
      <h2 id="create-template-heading" className="text-lg font-bold">Tạo mẫu mới</h2>
      <form onSubmit={submit} className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold">Tên mẫu hợp đồng<input value={title} maxLength={200} onChange={(event) => setTitle(event.target.value)} required className="mt-2 block min-h-11 w-full rounded-xl border border-brand-border px-3" /></label>
        <label className="text-sm font-semibold">Mẫu DOCX<input type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => { setFile(event.target.files?.[0]); setUploadError(''); }} className="mt-2 block w-full rounded-xl border border-brand-border p-2" /><span className="mt-1 block text-xs font-normal text-brand-muted">Tối đa 10 MB. File được kiểm tra an toàn và các biến trước khi công bố.</span></label>
          <p className="text-xs text-brand-muted sm:col-span-2">{'DOCX cần có các biến {{contract_number}}, {{company_name}}, {{tax_code}}, {{representative_name}} và {{signature_block}}. Không chứa liên kết ngoài hoặc nội dung nhúng.'}</p>
          {uploadError && <p role="alert" className="text-sm text-red-700 sm:col-span-2">{uploadError}</p>}
        <ActionButton type="submit" disabled={!file || !title.trim()} loading={saving} className="sm:w-fit">Lưu bản nháp</ActionButton>
        {createdId && <Link className="self-center font-semibold underline" href={ROUTES.admin.contractTemplate(createdId)}>Mở bản nháp vừa tạo</Link>}
      </form>
    </section>
    <section className="rounded-2xl border border-brand-border bg-white p-5" aria-label="Danh sách phiên bản hợp đồng">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-bold">Các phiên bản</h2><label className="text-sm">Trạng thái<select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="ml-3 min-h-11 rounded-xl border border-brand-border px-3"><option value="">Tất cả</option><option value="Draft">Bản nháp</option><option value="Published">Đang áp dụng</option><option value="Archived">Lưu trữ</option></select></label></div>
      {loading ? <p role="status">Đang tải mẫu hợp đồng…</p> : error ? <div role="alert"><p>{error}</p><ActionButton variant="outline" onClick={() => void reload()}>Thử lại</ActionButton></div> : !data?.items.length ? <p>Chưa có mẫu hợp đồng.</p> : <ul className="divide-y divide-brand-border">{data.items.map((template) => <li key={template.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><h3 className="font-semibold">{template.title}</h3><p className="mt-1 text-sm text-brand-muted">{template.version ? `Phiên bản ${template.version}` : 'Chưa công bố'} · {templateStatusLabel[template.status]} · {formatTripDateTime(template.updatedAtUtc)}</p></div><Link href={ROUTES.admin.contractTemplate(template.id)} className="inline-flex min-h-11 items-center rounded-xl border border-brand-border px-4 text-sm font-semibold">{template.status === 'Draft' ? 'Mở bản nháp' : 'Xem phiên bản'}</Link></li>)}</ul>}
      {data && data.totalPages > 1 && <nav aria-label="Phân trang mẫu hợp đồng" className="mt-4 flex items-center justify-between"><ActionButton variant="outline" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}>Trang trước</ActionButton><span>Trang {page}/{data.totalPages}</span><ActionButton variant="outline" disabled={page >= data.totalPages || loading} onClick={() => setPage(page + 1)}>Trang sau</ActionButton></nav>}
    </section>
  </main>;
}
