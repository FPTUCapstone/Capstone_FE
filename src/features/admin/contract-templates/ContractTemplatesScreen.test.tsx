import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('next/link', () => ({ default: ({ children, ...props }: React.ComponentProps<'a'>) => <a {...props}>{children}</a> }));
vi.mock('./contractTemplatesService', () => ({ listTemplates: vi.fn(), createTemplate: vi.fn(), validateTemplateUpload: vi.fn(() => null) }));
import { listTemplates, createTemplate } from './contractTemplatesService';
import { ContractTemplatesScreen } from './ContractTemplatesScreen';

beforeEach(() => { vi.clearAllMocks(); vi.mocked(listTemplates).mockResolvedValue({ items: [], page: 1, pageSize: 20, totalCount: 0, totalPages: 0 }); });
describe('contract template list and draft upload', () => {
  it('shows an empty state and does not claim a template exists', async () => {
    render(<ContractTemplatesScreen />);
    expect(await screen.findByText('Chưa có mẫu hợp đồng.')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Lưu bản nháp' }) as HTMLButtonElement).disabled).toBe(true);
  });
  it('requires a title and file then creates only a draft', async () => {
    vi.mocked(createTemplate).mockResolvedValue({ id: '21' } as never);
    render(<ContractTemplatesScreen />);
    await screen.findByText('Chưa có mẫu hợp đồng.');
    fireEvent.change(screen.getByLabelText('Tên mẫu hợp đồng'), { target: { value: 'Partner 2026' } });
    fireEvent.change(screen.getByLabelText(/^Mẫu DOCX/), { target: { files: [new File(['docx'], 'partner.docx')] } });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu bản nháp' }));
    await waitFor(() => expect(createTemplate).toHaveBeenCalledTimes(1));
    expect((await screen.findByRole('link', { name: 'Mở bản nháp vừa tạo' })).getAttribute('href')).toBe('/admin/contract-templates/21');
  });
  it('shows retry on backend failure instead of sample content', async () => {
    vi.mocked(listTemplates).mockRejectedValue(new Error('offline'));
    render(<ContractTemplatesScreen />);
    expect(await screen.findByRole('button', { name: 'Thử lại' })).toBeTruthy();
  });
});
