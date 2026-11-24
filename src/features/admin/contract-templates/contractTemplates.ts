export type TemplateStatus = 'Draft' | 'Published' | 'Archived';
export type RenderState = 'NotRequested' | 'Processing' | 'Ready' | 'Failed';
export interface ContractTemplateDetail {
  id: string;
  version: number | null;
  draftRevision: number;
  title: string;
  status: TemplateStatus;
  rowVersion: string;
  sourceFileName: string;
  sourceSha256: string;
  validationStatus: string;
  variables: string[];
  missingVariables: string[];
  unknownVariables: string[];
  renderState: RenderState;
  previewRevision: number | null;
  previewErrorCode: string | null;
  createdAtUtc: string;
  updatedAtUtc: string;
  publishedAtUtc: string | null;
  publicationHead: { currentPublishedId: string | null; generation: number };
}
export interface ContractTemplatePage {
  items: ContractTemplateDetail[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
export const templateStatusLabel: Record<TemplateStatus, string> = { Draft: 'Bản nháp', Published: 'Đang áp dụng', Archived: 'Lưu trữ — đã khóa' };
export const documentUrl = (id: string, kind: 'source' | 'preview') => `/api/admin/contract-templates/${encodeURIComponent(id)}/documents/${kind}`;
export function canPublishTemplate(template: ContractTemplateDetail): boolean {
  return template.status === 'Draft' && template.validationStatus === 'Valid' && template.renderState === 'Ready' && template.previewRevision === template.draftRevision && !template.missingVariables.length && !template.unknownVariables.length;
}
