import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createCoupon: vi.fn(),
  getEligibleCouponTours: vi.fn(),
}));

vi.mock('../services/couponApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../services/couponApi')>()),
  createCoupon: mocks.createCoupon,
  getEligibleCouponTours: mocks.getEligibleCouponTours,
}));

import { CreateCouponForm } from './CreateCouponForm';

describe('CreateCouponForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getEligibleCouponTours.mockResolvedValue([
      { id: 1, title: 'Da Nang highlights', destination: 'Da Nang', basePrice: 500000 },
    ]);
    mocks.createCoupon.mockResolvedValue({ couponId: 1, code: 'TRIP10' });
  });

  it('keeps selected tours when the operator creates another coupon', async () => {
    render(<CreateCouponForm />);

    fireEvent.change(await screen.findByLabelText('Coupon code'), { target: { value: 'TRIP10' } });
    fireEvent.change(screen.getByLabelText('Discount (%)'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Maximum discount (VND)'), { target: { value: '100000' } });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Create and activate coupon' }));

    fireEvent.click(await screen.findByRole('button', { name: 'Create another coupon' }));

    expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(true);
    await waitFor(() => expect(mocks.createCoupon).toHaveBeenCalledTimes(1));
  });

  it('distinguishes a failed tour load from an empty tour list and allows retry', async () => {
    mocks.getEligibleCouponTours
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce([
        { id: 1, title: 'Da Nang highlights', destination: 'Da Nang', basePrice: 500000 },
      ]);
    render(<CreateCouponForm />);

    fireEvent.click(await screen.findByRole('button', { name: 'Retry loading tours' }));

    expect(await screen.findByRole('checkbox')).toBeDefined();
    expect(mocks.getEligibleCouponTours).toHaveBeenCalledTimes(2);
  });

  it('uses the Stitch coupon-creation layout with accessible discount cards', async () => {
    render(<CreateCouponForm />);

    expect(await screen.findByRole('heading', { name: 'Create a new promotional coupon' })).toBeDefined();
    expect((screen.getByRole('radio', { name: 'Percentage discount' }) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByRole('radio', { name: 'Fixed amount' }) as HTMLInputElement).checked).toBe(false);
    expect(screen.getByRole('button', { name: 'Generate code' })).toBeDefined();
  });
});
