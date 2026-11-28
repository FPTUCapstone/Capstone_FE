import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('next/link', () => ({ default: ({ children, ...props }: React.ComponentProps<'a'>) => <a {...props}>{children}</a> }));
import { TourReadinessPanel } from '@/features/operator/tours/components/TourExtraFields';
import { createOrReusePayment, PaymentApiError } from '@/features/bookings/services/paymentApi';
import { evaluateTourCompleteness } from '@/features/operator/tours/services/operatorTourService';

afterEach(() => vi.unstubAllGlobals());
describe('payOS readiness and Traveler payment integration', () => {
  it('offers a meaningful payment settings link when the server blocks review', () => {
    render(<TourReadinessPanel blockers={['payment_channel_not_ready']} />);
    expect(screen.queryByText('payment_channel_not_ready')).toBeNull();
    expect(screen.getByRole('link', { name: 'Kết nối payOS' }).getAttribute('href')).toBe('/partner/payment-settings');
  });
  it('maps the channel blocker into an actionable eligibility item', () => {
    const result = evaluateTourCompleteness({ schedules: [], reviewBlockers: ['payment_channel_not_ready'] } as never);
    const item = result.items.find((candidate) => candidate.key === 'payment_channel_not_ready');
    expect(item?.summaryText).toContain('payOS'); expect(item?.isComplete).toBe(false);
  });
  it('explains that the operator channel is unavailable without suggesting a platform fallback', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => Response.json({ errorCode: 'payment.channel_not_ready' }, { status: 409 })));
    await expect(createOrReusePayment('42')).rejects.toBeInstanceOf(PaymentApiError);
    await expect(createOrReusePayment('42')).rejects.toThrow(/kênh thanh toán.*đối tác/i);
  });
  it('explains that an old unbound payment needs reconciliation instead of sending the customer to pay', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => Response.json({ errorCode: 'payment.reconciliation_required' }, { status: 409 })));
    await expect(createOrReusePayment('42')).rejects.toThrow(/đối soát/i);
  });
});
