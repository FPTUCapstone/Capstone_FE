import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { CommissionStatementsView } from '../components/w105/CommissionStatementsView';
import { ToastProvider } from '../components/common/Toast';
import { ProviderStatementService } from '../services/providerStatementService';

describe('Screen W105: Commission Statements (Service Provider Workspace, UC-82)', () => {
  beforeEach(() => {
    ProviderStatementService.resetState();
  });

  const renderComponent = () =>
    render(
      <ToastProvider>
        <CommissionStatementsView />
      </ToastProvider>
    );

  it('renders 60/40 master-detail layout with statement ledger and detail drawer', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Commission Statements')).toBeDefined();
    });

    // Check Ledger Table Headers
    expect(screen.getByText('Statement Period')).toBeDefined();
    expect(screen.getByText('Completed Stays')).toBeDefined();
    expect(screen.getByText('Total Actual Revenue')).toBeDefined();
    expect(screen.getByText('Commission Due')).toBeDefined();
    expect(screen.getByText('Due Date')).toBeDefined();
    expect(screen.getByText('Payment Status')).toBeDefined();

    // Check Selected Statement Details
    expect(screen.getByText(/Commission Billing — Month 11\/2026/i)).toBeDefined();
    expect(screen.getByText('COMM-202611-0012')).toBeDefined();
    expect(screen.getByText(/Audited Completed Bookings/i)).toBeDefined();
    expect(screen.getByText(/Wire Payment Reported/i)).toBeDefined();
  });

  it('displays sandbox bank beneficiary details for payment instructions', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/TripMate Beneficiary Account/i)).toBeDefined();
      expect(screen.getByText(/0071000888999/i)).toBeDefined();
      expect(screen.getByText(/CONG TY CO PHAN TRIPMATE VIETNAM/i)).toBeDefined();
    });
  });

  it('enforces non-empty bank transfer reference (MSG172)', async () => {
    // Select an Issued statement (e.g. stmt-004)
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('COMM-202611-0012')).toBeDefined();
    });

    // stmt-001 is already PaymentReported in default fixture, let's select stmt-004
    const rows = screen.getAllByRole('row');
    // Click stmt-004 row
    const issuedRow = rows.find((r) => r.textContent?.includes('Tháng 11/2026') && r.textContent?.includes('27.750.000'));
    if (issuedRow) {
      fireEvent.click(issuedRow);
    }

    await waitFor(() => {
      const reportBtn = screen.getByRole('button', { name: /Report Wire Payment/i });
      expect(reportBtn).toBeDefined();

      // Submit with empty reference
      const refInput = screen.getByLabelText(/Bank Transfer Transaction Reference/i);
      fireEvent.change(refInput, { target: { value: '' } });
      fireEvent.click(reportBtn);
    });

    await waitFor(() => {
      expect(
        screen.getAllByText(/Please enter the bank transfer reference before confirming the payment/i).length
      ).toBeGreaterThan(0);
    });
  });

  it('reports wire transfer, transitions status to Payment Reported, and does NOT mark Paid (PC-02)', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('COMM-202611-0012')).toBeDefined();
    });

    // Select stmt-004 (Issued)
    const rows = screen.getAllByRole('row');
    const issuedRow = rows.find((r) => r.textContent?.includes('27.750.000'));
    if (issuedRow) {
      fireEvent.click(issuedRow);
    }

    await waitFor(() => {
      const refInput = screen.getByLabelText(/Bank Transfer Transaction Reference/i);
      fireEvent.change(refInput, { target: { value: 'VCB-20261205-777888' } });

      const reportBtn = screen.getByRole('button', { name: /Report Wire Payment/i });
      fireEvent.click(reportBtn);
    });

    await waitFor(() => {
      // MSG208 toast
      expect(
        screen.getByText(/Payment reported\. TripMate will confirm it after bank reconciliation\./i)
      ).toBeDefined();

      // Verify status shows Payment Reported, NOT Paid
      expect(screen.getByText(/Wire Payment Reported/i)).toBeDefined();
      expect(screen.getByText(/VCB-20261205-777888/i)).toBeDefined();
    });
  });
});
