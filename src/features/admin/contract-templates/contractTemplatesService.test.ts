import { afterEach, describe, expect, it, vi } from 'vitest';
import { ContractTemplateError, createTemplate, publishTemplate, requestPreview, validateTemplateUpload } from './contractTemplatesService';
import type { ContractTemplateDetail } from './contractTemplates';

afterEach(() => vi.unstubAllGlobals());
const detail = { id: '9007199254740993', draftRevision: 2, rowVersion: 'AQ==', sourceSha256: 'hash', publicationHead: { currentPublishedId: '4', generation: 3 } } as ContractTemplateDetail;
describe('contract template mutations', () => {
  it('explains why a small DOCX with external links is blocked', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ errorCode: 'contract_template.invalid_document', validationIssue: 'external_content_or_fields' }, { status: 400 })));
    await expect(createTemplate('Template', new File(['docx'], 'sample.docx'))).rejects.toThrow('liên kết ngoài');
  });
  it('explains invalid DOCX placeholders without exposing backend diagnostics', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ missingVariables: ['operator.name'], unknownVariables: ['invalid.variable'], detail: 'private diagnostics' }, { status: 400 })));
    await expect(createTemplate('Official template', new File(['docx'], 'sample.docx'))).rejects.toThrow('Biến bắt buộc còn thiếu: operator.name. Biến không được hỗ trợ: invalid.variable.');
  });
  it('rejects non-DOCX and oversized files before sending', () => {
    expect(validateTemplateUpload(new File(['pdf'], 'sample.pdf'))).toBeTruthy();
    expect(validateTemplateUpload(new File([], 'empty.docx'))).toBeTruthy();
    expect(validateTemplateUpload(new File(['docx'], 'sample.docx'))).toBeNull();
  });
  it('sends original multipart file and metadata without setting the boundary', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(detail)); vi.stubGlobal('fetch', fetchMock);
    const file = new File(['docx'], 'sample.docx');
    await createTemplate('Official template', file);
    const options = fetchMock.mock.calls[0][1];
    expect(options.body.get('file')).toBe(file);
    expect(options.body.get('title')).toBe('Official template');
    expect(options.headers).toBeUndefined();
  });
  it('binds publication to reviewed revision, source hash and publication head', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(detail)); vi.stubGlobal('fetch', fetchMock);
    await publishTemplate(detail, 'operation-1');
    expect(fetchMock.mock.calls[0][0]).toContain('9007199254740993/publish');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ expectedRevision: 2, expectedSourceSha256: 'hash', rowVersion: 'AQ==', expectedCurrentPublishedId: '4', expectedPublicationGeneration: 3, previewAcknowledged: true, idempotencyKey: 'operation-1' });
  });
  it('reports stale revisions and unavailable renderers without fake success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(Response.json({ errorCode: 'contract_template.conflict' }, { status: 409 })).mockResolvedValueOnce(Response.json({}, { status: 503 })));
    await expect(requestPreview(detail)).rejects.toMatchObject({ status: 409 });
    await expect(requestPreview(detail)).rejects.toBeInstanceOf(ContractTemplateError);
  });
});
