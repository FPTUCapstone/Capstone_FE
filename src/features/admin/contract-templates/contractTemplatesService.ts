import type { ContractTemplateDetail, ContractTemplatePage, TemplateStatus } from './contractTemplates';

const base = '/api/admin/contract-templates';
export class ContractTemplateError extends Error {
  constructor(public readonly status: number, public readonly errorCode?: string, validation?: { missingVariables?: unknown; unknownVariables?: unknown; validationIssue?: unknown }) {
    super(status === 409 ? 'Nội dung đã thay đổi. Hãy tải lại để kiểm tra phiên bản mới nhất.' : status === 401 ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' : status === 403 ? 'Chỉ Administrator được quản lý mẫu hợp đồng.' : status === 413 ? 'File vượt quá dung lượng cho phép.' : status === 400 ? 'File hoặc thông tin mẫu chưa hợp lệ. Vui lòng kiểm tra lại.' : 'Chưa thể xử lý mẫu hợp đồng. Vui lòng thử lại.');
    if (status === 400 && validation) {
      if (errorCode === 'contract_template.invalid_document') {
        this.message = validation.validationIssue === 'external_content_or_fields'
          ? 'File DOCX có liên kết ngoài hoặc nội dung nhúng/trường tự động không được hỗ trợ. Hãy gỡ hyperlink (giữ lại chữ), nội dung nhúng và trường tự động trong Word rồi tải lại. Dung lượng không phải nguyên nhân của lỗi này.'
          : 'Không đọc được cấu trúc DOCX an toàn. Hãy mở file trong Word, lưu lại dạng .docx và kiểm tra nội dung nhúng/liên kết ngoài trước khi tải lại.';
      }
      const names = (value: unknown) => Array.isArray(value) ? value.filter((name): name is string => typeof name === 'string').slice(0, 30).join(', ') : '';
      const missing = names(validation.missingVariables);
      const unknown = names(validation.unknownVariables);
      if (missing) this.message += ` Biến bắt buộc còn thiếu: ${missing}.`;
      if (unknown) this.message += ` Biến không được hỗ trợ: ${unknown}.`;
    }
  }
}
async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try { response = await fetch(url, { ...init, cache: 'no-store', credentials: 'same-origin' }); } catch { throw new ContractTemplateError(503); }
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new ContractTemplateError(response.status, data?.errorCode, data);
  if (!data) throw new ContractTemplateError(503);
  return data as T;
}
export function validateTemplateUpload(file: File): string | null {
  if (!file.name.toLowerCase().endsWith('.docx')) return 'Chỉ nhận file DOCX.';
  if (!file.size || file.size > 10 * 1024 * 1024) return 'Chọn file DOCX có nội dung, tối đa 10 MB.';
  return null;
}
export function listTemplates(status = '', page = 1, signal?: AbortSignal): Promise<ContractTemplatePage> {
  const query = new URLSearchParams({ page: String(page), pageSize: '20' });
  if (status) query.set('status', status as TemplateStatus);
  return request(`${base}?${query}`, { signal });
}
export const getTemplate = (id: string, signal?: AbortSignal): Promise<ContractTemplateDetail> => request(`${base}/${encodeURIComponent(id)}`, { signal });
export function createTemplate(title: string, file: File): Promise<ContractTemplateDetail> {
  const body = new FormData(); body.set('title', title.trim()); body.set('file', file);
  return request(base, { method: 'POST', body });
}
export function updateTemplate(template: ContractTemplateDetail, title: string, file?: File): Promise<ContractTemplateDetail> {
  const body = new FormData(); body.set('title', title.trim()); body.set('expectedRevision', String(template.draftRevision)); body.set('rowVersion', template.rowVersion);
  if (file) body.set('file', file);
  return request(`${base}/${encodeURIComponent(template.id)}`, { method: 'PUT', body });
}
function post(template: ContractTemplateDetail, action: string, body: object) {
  return request<ContractTemplateDetail>(`${base}/${encodeURIComponent(template.id)}/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}
export const requestPreview = (template: ContractTemplateDetail) => post(template, 'preview', { expectedRevision: template.draftRevision, rowVersion: template.rowVersion });
export const createVersion = (template: ContractTemplateDetail) => post(template, 'versions', { rowVersion: template.rowVersion });
export const publishTemplate = (template: ContractTemplateDetail, idempotencyKey: string) => post(template, 'publish', {
  expectedRevision: template.draftRevision, expectedSourceSha256: template.sourceSha256, rowVersion: template.rowVersion,
  expectedCurrentPublishedId: template.publicationHead.currentPublishedId, expectedPublicationGeneration: template.publicationHead.generation,
  previewAcknowledged: true, idempotencyKey,
});
