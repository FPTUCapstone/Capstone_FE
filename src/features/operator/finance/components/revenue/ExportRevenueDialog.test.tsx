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

  it('keeps Excel (.xlsx) and PDF (.pdf) visible as canonical options marked Pending Binary Export Integration and disabled, and submits CSV (.csv) to onExport handler', () => {
    render(
      <ExportRevenueDialog
        isOpen={true}
        appliedFilters={defaultAppliedFilters}
        onClose={mockOnClose}
        onExport={mockOnExport}
        isDemo={true}
      />
    );

    const csvRadio = screen.getByDisplayValue('csv') as HTMLInputElement;
    const xlsxRadio = screen.getByDisplayValue('xlsx') as HTMLInputElement;
    const pdfRadio = screen.getByDisplayValue('pdf') as HTMLInputElement;

    expect(csvRadio.disabled).toBe(false);
    expect(xlsxRadio.disabled).toBe(true);
    expect(pdfRadio.disabled).toBe(true);
    expect(
      screen.getAllByText(/Pending Binary Export Integration/i).length
    ).toBeGreaterThanOrEqual(2);

    // Click Export File (submits CSV)
    const exportBtn = screen.getByRole('button', { name: /Export File/i });
    fireEvent.click(exportBtn);

    expect(mockOnExport).toHaveBeenCalledWith(
      {
        format: 'csv',
        scope: 'summary_and_details',
        appliedFilters: defaultAppliedFilters,
      },
      false
    );
  });

  it('disables export submission in Production NO_BACKEND mode (isDemo=false)', () => {
    render(
      <ExportRevenueDialog
        isOpen={true}
        appliedFilters={defaultAppliedFilters}
        onClose={mockOnClose}
        onExport={mockOnExport}
        isDemo={false}
      />
    );

    const exportBtn = screen.getByRole('button', {
      name: /Export File/i,
    }) as HTMLButtonElement;
    expect(exportBtn.disabled).toBe(true);
    expect(
      screen.getByText(/Export is unavailable in Production mode/i)
    ).toBeDefined();
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
