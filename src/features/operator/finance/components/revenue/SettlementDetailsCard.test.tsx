import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SettlementDetailsCard } from './SettlementDetailsCard';
import type { RevenueSummaryDto } from '../../types/revenueLifecycle';

describe('SettlementDetailsCard (SRS §3.8.5.1 settlement summary card)', () => {
  const summary: RevenueSummaryDto = {
    grossRevenue: 6200000,
    paymentsReceived: 5600000,
    discountsGiven: 600000,
    refundedAmount: 1400000,
    netSales: 4200000,
    platformCommission: 560000,
    netAmount: 3640000,
    totalBookings: 4,
    totalParticipants: 10,
    commissionRatePercent: 10,
  };

  it('renders the title and all settlement figures from the summary DTO', () => {
    render(<SettlementDetailsCard summary={summary} />);

    expect(screen.getByText(/Settlement Breakdown/i)).toBeDefined();
    expect(screen.getByText('Gross Revenue')).toBeDefined();
    expect(screen.getByText('Discounts Given')).toBeDefined();
    expect(screen.getByText('Payments Received')).toBeDefined();
    expect(screen.getByText('Refunded Amount')).toBeDefined();
    expect(screen.getByText('Net Sales')).toBeDefined();
    expect(screen.getByText('Platform Commission')).toBeDefined();
    expect(screen.getByText('Net Payout')).toBeDefined();

    // Supporting figure: gross revenue shown as a plain positive amount
    expect(screen.getByText('6.200.000 ₫')).toBeDefined();
    // Deductions are rendered parenthesized
    expect(screen.getByText('(600.000 ₫)')).toBeDefined();
    expect(screen.getByText('(1.400.000 ₫)')).toBeDefined();
    expect(screen.getByText('(560.000 ₫)')).toBeDefined();
    // Subtotals and the final net payout are plain positive amounts
    expect(screen.getByText('5.600.000 ₫')).toBeDefined();
    expect(screen.getByText('4.200.000 ₫')).toBeDefined();
    expect(screen.getByText('3.640.000 ₫')).toBeDefined();

    expect(
      screen.getByText(/Payments Received.*Refunds.*Commission.*Net Payout/i)
    ).toBeDefined();
  });

  it('renders a zero discount as a plain amount, not a deduction', () => {
    render(
      <SettlementDetailsCard
        summary={{ ...summary, discountsGiven: 0, grossRevenue: summary.paymentsReceived }}
      />
    );

    expect(screen.getByText('Discounts Given').nextSibling?.textContent).toBe('0 ₫');
  });
});
