import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { CommissionReconciliationView } from '../components/w106/CommissionReconciliationView';
import { ToastProvider } from '../components/common/Toast';
import { StaffReconciliationService } from '../services/staffReconciliationService';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

describe('Screen W106: Commission Reconciliation (Staff Workspace, UC-83)', () => {
  beforeEach(() => {
    StaffReconciliationService.resetState();
  });

  const renderComponent = () =>
    render(
      <ToastProvider>
        <CommissionReconciliationView />
      </ToastProvider>
    );

  it('renders reconciliation table with mandatory SRS §3.6.7 columns and filters', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Commission Reconciliation/i })).toBeDefined();
    });

    // Check Staff boundary badge
    expect(screen.getByText(/Staff Reconciliation \(UC-83\)/i)).toBeDefined();

    // Check Filter Bar
    expect(screen.getByText('Service Provider')).toBeDefined();
    expect(screen.getByText('Statement Period')).toBeDefined();
    expect(screen.getByText('Payment Status')).toBeDefined();
    expect(screen.getByLabelText(/Search Bank Reference/i)).toBeDefined();

    // Check Table Headers
    expect(screen.getByText('Service Provider / Property')).toBeDefined();
    expect(screen.getByText('Period')).toBeDefined();
    expect(screen.getByText('Commission Amount')).toBeDefined();
    expect(screen.getByText('Due Date')).toBeDefined();
    expect(screen.getByText('Status')).toBeDefined();
    expect(screen.getByText('Bank Reference')).toBeDefined();
    expect(screen.getByText('Reported At')).toBeDefined();
    expect(screen.getByText('Action')).toBeDefined();

    // Default filter is PaymentReported -> stmt-001 should be present
    expect(screen.getByText('Hội An Riverside Heritage Resort')).toBeDefined();
    expect(screen.getByText('VCB-20261205-982341')).toBeDefined();
    expect(screen.getByRole('button', { name: /Record Receipt/i })).toBeDefined();
  });

  it('executes receipt confirmation workflow via CR-05 modal and updates to Paid with MSG209', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Record Receipt/i })).toBeDefined();
    });

    // Click Record Receipt button
    fireEvent.click(screen.getByRole('button', { name: /Record Receipt/i }));

    // Verify CR-05 Confirmation Modal
    expect(screen.getByText(/Confirm Commission Payment Receipt/i)).toBeDefined();
    expect(
      screen.getByText(/Confirm that the commission amount of 4\.440\.000 ₫/i)
    ).toBeDefined();
    expect(
      screen.getByText(/This action records an immutable financial reconciliation audit entry/i)
    ).toBeDefined();

    // Confirm receipt
    const confirmBtn = screen.getByRole('button', { name: /Confirm Receipt & Mark Paid/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      // MSG209 toast
      expect(
        screen.getByText(/Receipt recorded\. The statement is now Paid\./i)
      ).toBeDefined();

      // Action button replaced by Reconciled badge
      expect(screen.getByText(/Reconciled/i)).toBeDefined();
    });
  });
});
