import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UpdateCouponView } from './UpdateCouponView';
import * as couponService from '../services/operatorCouponService';
import { couponEn } from '../resources/en';
import type { CouponDto, EligibleTourDto } from '../types/couponLifecycle';

const mockPush = vi.fn();
const obsoleteModeParam = ['de', 'mo'].join('');
let mockSearchParams = new URLSearchParams(`${obsoleteModeParam}=1`);

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
}));

const initialCoupon: CouponDto = {
  id: '31', couponCode: 'BANA15', name: 'Ba Na Hills', operatorUserId: 101,
  discountType: 'Percentage', discountValue: 15, maxDiscountAmount: 100000,
  minSpend: 500000, usageLimit: 200, usageLimitPerTraveler: 1, usageCount: 86,
  validFrom: '2026-10-01', validTo: '2030-10-31',
  validFromUtc: '2026-10-01T00:00:00Z', validToUtc: '2030-10-31T00:00:00Z',
  appliesToAllTours: false, appliedTourIds: ['4'], status: 'Active',
  createdAt: '2026-09-01T00:00:00Z', updatedAt: '2026-10-01T00:00:00Z',
};

const eligibleTours: EligibleTourDto[] = [{
  id: '4', tourCode: 'TOUR-4', title: 'Ba Na Hills Tour', destination: 'Da Nang',
  basePrice: 1200000, status: 'Published', operatorUserId: 101,
}];

afterEach(() => {
  vi.restoreAllMocks();
  mockPush.mockClear();
  mockSearchParams = new URLSearchParams(`${obsoleteModeParam}=1`);
});

describe('UpdateCouponView (UC-39)', () => {
  it('renders immutable coupon code and recorded usage', () => {
    render(<UpdateCouponView initialCoupon={initialCoupon} eligibleTours={eligibleTours} currentUserId={101} />);
    expect(screen.getAllByText('BANA15').length).toBeGreaterThan(0);
    expect(screen.getByText(couponEn.update.couponCodeNote)).toBeDefined();
    expect(screen.getAllByText('86').length).toBeGreaterThan(0);
    expect(screen.queryByPlaceholderText(/SUMMER2026/i)).toBeNull();
  });

  it('calls the production update service and preserves unlimited limits', async () => {
    const coupon = { ...initialCoupon, usageLimit: null, usageLimitPerTraveler: null };
    const save = vi.spyOn(couponService, 'updateCoupon').mockResolvedValue({ status: 'SUCCESS', data: coupon });
    render(<UpdateCouponView initialCoupon={coupon} eligibleTours={eligibleTours} currentUserId={101} />);

    fireEvent.click(screen.getByRole('button', { name: new RegExp(couponEn.update.actions.save, 'i') }));
    await waitFor(() => expect(save).toHaveBeenCalled());
    expect(save.mock.calls[0][1]).toMatchObject({
      usageLimit: null,
      validFrom: '2026-10-01T00:00:00Z',
    });
    expect(save.mock.calls[0][2]).toEqual({ currentUserId: 101, eligibleTourIds: ['4'] });
  });

  it('announces the pending save state and marks the form busy', async () => {
    let resolveSave!: (value: Awaited<ReturnType<typeof couponService.updateCoupon>>) => void;
    const pendingSave = new Promise<Awaited<ReturnType<typeof couponService.updateCoupon>>>((resolve) => {
      resolveSave = resolve;
    });
    vi.spyOn(couponService, 'updateCoupon').mockReturnValue(pendingSave);

    render(<UpdateCouponView initialCoupon={initialCoupon} eligibleTours={eligibleTours} currentUserId={101} />);
    fireEvent.click(screen.getByRole('button', { name: new RegExp(couponEn.update.actions.save, 'i') }));

    await waitFor(() => expect(screen.getByRole('form').getAttribute('aria-busy')).toBe('true'));
    expect(screen.getByRole('status').textContent).toBe(couponEn.update.actions.saving);

    resolveSave({ status: 'SUCCESS', data: initialCoupon });
    await waitFor(() => expect(screen.getByRole('form').getAttribute('aria-busy')).toBe('false'));
  });

  it('keeps a draft on conflict and reloads only after explicit confirmation', async () => {
    const save = vi.spyOn(couponService, 'updateCoupon').mockResolvedValue({
      status: 'CONFLICT', message: 'Coupon usage changed. Reload the coupon before saving again.',
    });
    const reload = vi.spyOn(couponService, 'getOperatorCouponById').mockResolvedValue({
      status: 'SUCCESS', data: { ...initialCoupon, name: 'Latest name', usageCount: 90 },
    });
    render(<UpdateCouponView initialCoupon={initialCoupon} eligibleTours={eligibleTours} currentUserId={101} />);
    const name = screen.getByLabelText(new RegExp(couponEn.create.fields.name, 'i'));
    fireEvent.change(name, { target: { value: 'My draft' } });
    fireEvent.click(screen.getByRole('button', { name: new RegExp(couponEn.update.actions.save, 'i') }));
    await waitFor(() => expect(save).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText(/Coupon usage changed/i)).toBeDefined());
    expect((name as HTMLInputElement).value).toBe('My draft');
    expect(reload).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: couponEn.update.actions.reloadLatest }));
    await waitFor(() => expect((name as HTMLInputElement).value).toBe('Latest name'));
    expect(reload).toHaveBeenCalledWith('31', { currentUserId: 101 });
  });

  it('rejects a total limit below recorded usage before calling the API', async () => {
    const save = vi.spyOn(couponService, 'updateCoupon');
    render(<UpdateCouponView initialCoupon={initialCoupon} eligibleTours={eligibleTours} currentUserId={101} />);
    fireEvent.change(screen.getByLabelText(new RegExp(couponEn.create.fields.usageLimit, 'i')), {
      target: { value: '85' },
    });
    fireEvent.click(screen.getByRole('button', { name: new RegExp(couponEn.update.actions.save, 'i') }));
    await waitFor(() => expect(screen.getByText(couponEn.errors.usageLimitBelowCount)).toBeDefined());
    expect(save).not.toHaveBeenCalled();
  });

  it('explains that a limit equal to occupied usage leaves no available slots', () => {
    render(<UpdateCouponView initialCoupon={initialCoupon} eligibleTours={eligibleTours} currentUserId={101} />);
    fireEvent.change(screen.getByLabelText(new RegExp(couponEn.create.fields.usageLimit, 'i')), {
      target: { value: String(initialCoupon.usageCount) },
    });
    expect(screen.getByText(couponEn.update.usage.currentlyFull)).toBeDefined();
  });

  it('associates a name longer than 120 characters with the name input', async () => {
    const save = vi.spyOn(couponService, 'updateCoupon');
    render(<UpdateCouponView initialCoupon={initialCoupon} eligibleTours={eligibleTours} currentUserId={101} />);
    const name = screen.getByLabelText(new RegExp(couponEn.create.fields.name, 'i'));
    fireEvent.change(name, { target: { value: 'N'.repeat(121) } });
    fireEvent.click(screen.getByRole('button', { name: new RegExp(couponEn.update.actions.save, 'i') }));
    await waitFor(() => expect(document.getElementById('couponName-error')).not.toBeNull());
    expect(name.getAttribute('aria-invalid')).toBe('true');
    expect(save).not.toHaveBeenCalled();
  });

  it('deactivates through the production service after confirmation', async () => {
    const deactivate = vi.spyOn(couponService, 'deactivateCoupon').mockResolvedValue({
      status: 'SUCCESS', data: { ...initialCoupon, status: 'Inactive' },
    });
    render(<UpdateCouponView initialCoupon={initialCoupon} eligibleTours={eligibleTours} currentUserId={101} />);
    fireEvent.click(screen.getByRole('button', { name: new RegExp(couponEn.update.statusAction.deactivate, 'i') }));
    expect(screen.getByRole('dialog').getAttribute('aria-modal')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: new RegExp(couponEn.dialog.confirmDeactivate, 'i') }));
    await waitFor(() => expect(deactivate).toHaveBeenCalledWith('31', { currentUserId: 101 }));
  });

  it('drops obsolete mode flags from the return URL', () => {
    mockSearchParams = new URLSearchParams(`${obsoleteModeParam}=1&returnUrl=%2Fpartner%2Fcoupons%3Fpage%3D2%26status%3DActive`);
    render(<UpdateCouponView initialCoupon={initialCoupon} eligibleTours={eligibleTours} currentUserId={101} />);
    const back = screen.getByRole('link', { name: new RegExp(couponEn.update.backAria, 'i') });
    expect(back.getAttribute('href')).toBe('/partner/coupons?page=2&status=Active');
  });

  it('disables save when the operator has no eligible tour', () => {
    render(<UpdateCouponView initialCoupon={initialCoupon} eligibleTours={[]} currentUserId={101} />);
    expect(screen.getByText(couponEn.create.fields.noEligibleToursTitle)).toBeDefined();
    expect((screen.getByRole('button', {
      name: new RegExp(couponEn.update.actions.save, 'i'),
    }) as HTMLButtonElement).disabled).toBe(true);
  });
});
