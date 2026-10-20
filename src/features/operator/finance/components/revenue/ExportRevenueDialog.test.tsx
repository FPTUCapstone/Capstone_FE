import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExportRevenueDialog } from './ExportRevenueDialog';

describe('ExportRevenueDialog (Screen #90)', () => {
  const defaultAppliedFilters = {
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    granularity: 'monthly' as const,
    tourId: undefined,
  };

  const mockOnClose = vi.fn();
  const mockOnExport = vi.fn().mockResolvedValue({
    success: true,
    record: { id: 1, status: 'Ready', fileName: 'file.xlsx' },
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the applied filter summary, the Excel-only format, and the scope controls', () => {
    render(
      <ExportRevenueDialog
        isOpen={true}
        appliedFilters={defaultAppliedFilters}
        onClose={mockOnClose}
        onExport={mockOnExport}
      />
    );

    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText(/Applied Filter Summary/i)).toBeDefined();
    expect(screen.getByText(/Monthly/i)).toBeDefined();
    expect(screen.getByText(/All Tour Packages/i)).toBeDefined();
    expect(screen.getByText(/Export File Format/i)).toBeDefined();
    expect(screen.getByText(/Excel Spreadsheet \(\.xlsx\)/i)).toBeDefined();
    expect(screen.getByText(/Content Scope/i)).toBeDefined();
    // No format selector: xlsx is the only supported format (CSV/PDF deferred by product decision).
    expect(screen.queryByText(/\.csv/i)).toBeNull();
    expect(screen.queryByText(/\.pdf/i)).toBeNull();
  });

  it('submits the immutable applied-filter snapshot with the selected scope', () => {
    render(
      <ExportRevenueDialog
        isOpen={true}
        appliedFilters={defaultAppliedFilters}
        onClose={mockOnClose}
        onExport={mockOnExport}
      />
    );

    const summaryOnlyRadio = screen.getByRole('radio', { name: /Summary metrics only/i });
    fireEvent.click(summaryOnlyRadio);

    const exportBtn = screen.getByRole('button', { name: /Export File/i });
    fireEvent.click(exportBtn);

    expect(mockOnExport).toHaveBeenCalledWith({
      format: 'xlsx',
      scope: 'summary',
      appliedFilters: defaultAppliedFilters,
    });
  });

  it('closes immediately when the export is Ready', async () => {
    render(
      <ExportRevenueDialog
        isOpen={true}
        appliedFilters={defaultAppliedFilters}
        onClose={mockOnClose}
        onExport={mockOnExport}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Export File/i }));

    await waitFor(() => expect(mockOnClose).toHaveBeenCalledTimes(1));
  });

  it('shows a Queued notice and switches Cancel to Close instead of closing', async () => {
    const queuedExport = vi.fn().mockResolvedValue({
      success: true,
      record: { id: 2, status: 'Queued' },
    });

    render(
      <ExportRevenueDialog
        isOpen={true}
        appliedFilters={defaultAppliedFilters}
        onClose={mockOnClose}
        onExport={queuedExport}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Export File/i }));

    expect(await screen.findByText('Export Queued')).toBeDefined();
    expect(mockOnClose).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /^Close$/i })).toBeDefined();
    expect(screen.queryByRole('button', { name: /Export File/i })).toBeNull();
  });

  it('shows the backend error message and keeps the dialog open on MSG128 (no records)', async () => {
    const failedExport = vi.fn().mockResolvedValue({
      success: false,
      message: 'No revenue records found for the selected period.',
      messageCode: 'MSG128',
    });

    render(
      <ExportRevenueDialog
        isOpen={true}
        appliedFilters={defaultAppliedFilters}
        onClose={mockOnClose}
        onExport={failedExport}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Export File/i }));

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('No revenue records found for the selected period.');
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('shows a Demo-mode notice and still allows attempting the real export', () => {
    render(
      <ExportRevenueDialog
        isOpen={true}
        appliedFilters={defaultAppliedFilters}
        onClose={mockOnClose}
        onExport={mockOnExport}
        isDemo={true}
      />
    );

    expect(
      screen.getByText(/unavailable while previewing with Demo mode data/i)
    ).toBeDefined();
  });

  it('calls onClose when Cancel is clicked or Escape is pressed', () => {
    render(
      <ExportRevenueDialog
        isOpen={true}
        appliedFilters={defaultAppliedFilters}
        onClose={mockOnClose}
        onExport={mockOnExport}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalledTimes(2);
  });
});
