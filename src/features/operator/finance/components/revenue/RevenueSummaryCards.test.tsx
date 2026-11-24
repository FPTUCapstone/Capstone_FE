import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RevenueSummaryCards } from './RevenueSummaryCards';

describe('RevenueSummaryCards monetary alignment', () => {
  it('right-aligns money values while keeping count metrics unchanged', () => {
    const { container } = render(<RevenueSummaryCards summary={{
      grossRevenue: 100000, paymentsReceived: 100000, discountsGiven: 0,
      platformCommission: 10000, netAmount: 90000, netSales: 100000,
      totalBookings: 2, totalParticipants: 3, refundedAmount: 0, commissionRatePercent: 10,
    }} />);
    const monetaryValues = [...container.querySelectorAll('p')].filter((element) => element.textContent?.includes('₫'));
    expect(monetaryValues.length).toBe(4);
    for (const value of monetaryValues) expect(value.classList.contains('text-right')).toBe(true);
    expect(screen.getByText('2').classList.contains('text-right')).toBe(false);
    expect(screen.getByText('3').classList.contains('text-right')).toBe(false);
  });
});
