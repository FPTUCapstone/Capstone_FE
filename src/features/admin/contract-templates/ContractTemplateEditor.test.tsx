import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('next/link', () => ({ default: ({ children, ...props }: React.ComponentProps<'a'>) => <a {...props}>{children}</a> }));
vi.mock('./contractTemplatesService', () => ({ getTemplate: vi.fn(), updateTemplate: vi.fn(), requestPreview: vi.fn(), publishTemplate: vi.fn(), createVersion: vi.fn(), validateTemplateUpload: vi.fn(() => null) }));
import { createVersion, getTemplate, publishTemplate, requestPreview } from './contractTemplatesService';
import { ContractTemplateEditor } from './ContractTemplateEditor';
import type { ContractTemplateDetail } from './contractTemplates';

const draft: ContractTemplateDetail = { id: '1', title: 'Partner template', version: null, draftRevision: 2, rowVersion: 'AA==', sourceFileName: 'partner.docx', sourceSha256: 'hash', validationStatus: 'Valid', variables: ['company_name'], missingVariables: [], unknownVariables: [], status: 'Draft', renderState: 'Ready', previewRevision: 2, previewErrorCode: null, createdAtUtc: '2026-11-23T00:00:00Z', updatedAtUtc: '2026-11-23T00:00:00Z', publishedAtUtc: null, publicationHead: { currentPublishedId: '4', generation: 3 } };
beforeEach(() => { vi.clearAllMocks(); vi.mocked(getTemplate).mockResolvedValue(draft); });
describe('contract template review and publication', () => {
  it('requires opening the current preview and explicit acknowledgement before publishing', async () => {
    vi.mocked(publishTemplate).mockResolvedValue({ ...draft, status: 'Published', version: 2 });
    render(<ContractTemplateEditor id="1" />);
    await screen.findByDisplayValue('Partner template');
    const publish = screen.getByRole('button', { name: 'Công bố phiên bản' }) as HTMLButtonElement;
    expect(publish.disabled).toBe(true);
    fireEvent.click(screen.getByRole('link', { name: 'Mở PDF xem trước' }));
    fireEvent.click(screen.getByLabelText('Tôi đã kiểm tra PDF của bản nháp hiện tại và xác nhận nội dung chính thức.'));
    fireEvent.click(publish);
    expect(screen.getByRole('dialog', { name: 'Công bố mẫu hợp đồng?' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận công bố' }));
    await waitFor(() => expect(publishTemplate).toHaveBeenCalledTimes(1));
    expect(publishTemplate).toHaveBeenCalledWith(draft, expect.any(String));
    expect((await screen.findAllByText('Mẫu đã công bố. Nội dung được khóa.')).length).toBeGreaterThan(0);
  });
  it('does not allow publishing an old preview for a newer revision', async () => {
    vi.mocked(getTemplate).mockResolvedValue({ ...draft, draftRevision: 3 });
    render(<ContractTemplateEditor id="1" />);
    await screen.findByDisplayValue('Partner template');
    expect((screen.getByRole('button', { name: 'Công bố phiên bản' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByRole('link', { name: 'Mở PDF xem trước' })).toBeNull();
  });
  it('keeps a published version read-only and creates a new draft explicitly', async () => {
    vi.mocked(getTemplate).mockResolvedValue({ ...draft, status: 'Archived', version: 1 });
    vi.mocked(createVersion).mockResolvedValue({ ...draft, id: '2' });
    render(<ContractTemplateEditor id="1" />);
    await screen.findByText('Phiên bản này đã lưu trữ và khóa nội dung.');
    expect(screen.queryByRole('button', { name: 'Lưu bản nháp' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Tạo phiên bản mới' }));
    expect(await screen.findByRole('link', { name: 'Mở phiên bản mới' })).toBeTruthy();
  });
  it('shows renderer failure without enabling publication', async () => {
    vi.mocked(getTemplate).mockResolvedValue({ ...draft, renderState: 'NotRequested', previewRevision: null });
    vi.mocked(requestPreview).mockRejectedValue(new Error('Dịch vụ tạo PDF chưa sẵn sàng.'));
    render(<ContractTemplateEditor id="1" />);
    await screen.findByDisplayValue('Partner template');
    fireEvent.click(screen.getByRole('button', { name: 'Tạo PDF xem trước' }));
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Công bố phiên bản' }) as HTMLButtonElement).disabled).toBe(true);
  });
});
