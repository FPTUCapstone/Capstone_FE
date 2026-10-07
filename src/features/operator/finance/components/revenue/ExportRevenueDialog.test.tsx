import { fireEvent, render, screen } from '@testing-library/react';
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
  const mockOnExport = vi.fn().mockResolvedValue({ success: true });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders applied filter summary and format/scope controls', () => {
    render(
      <ExportRevenueDialog
        isOpen={true}
        appliedFilters={defaultAppliedFilters}
        onClose={mockOnClose}
        onExport={mockOnExport}
        isDemo={true}
      />
    );

    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText(/Applied Filter Summary/i)).toBeDefined();
    expect(screen.getByText(/Monthly/i)).toBeDefined();
    expect(screen.getByText(/All Tour Packages/i)).toBeDefined();
    expect(screen.getByText(/Export File Format/i)).toBeDefined();
    expect(screen.getByText(/Content Scope/i)).toBeDefined();
  });

  it('submits selected format and scope to onExport handler', () => {
    render(
      <ExportRevenueDialog
        isOpen={true}
        appliedFilters={defaultAppliedFilters}
        onClose={mockOnClose}
        onExport={mockOnExport}
        isDemo={true}
      />
    );

    // Select XLSX format
    const xlsxRadio = screen.getByDisplayValue('xlsx');
    fireEvent.click(xlsxRadio);

    // Click Export File
    const exportBtn = screen.getByRole('button', { name: /Export File/i });
    fireEvent.click(exportBtn);

    expect(mockOnExport).toHaveBeenCalledWith(
      {
        format: 'xlsx',
        scope: 'summary_and_details',
        appliedFilters: defaultAppliedFilters,
      },
      false
    );
  });

  it('calls onClose when Cancel button or Escape key is pressed', () => {
    render(
      <ExportRevenueDialog
        isOpen={true}
        appliedFilters={defaultAppliedFilters}
        onClose={mockOnClose}
        onExport={mockOnExport}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    expect(mockOnClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalledTimes(2);
  });
});
