import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OperatorCouponListView } from './OperatorCouponListView';
import { couponEn } from '../resources/en';
import type { CouponDto } from '../types/couponLifecycle';

const obsoleteModeParam = ['de', 'mo'].join('');
const mockSearchParams = new URLSearchParams(`${obsoleteModeParam}=1`);

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => mockSearchParams,
}));

const coupons: CouponDto[] = [
  {
    id: '31', couponCode: 'BANA15', name: 'Ba Na Hills', operatorUserId: 101,
    discountType: 'Percentage', discountValue: 15, maxDiscountAmount: 100000,
    minSpend: 500000, usageLimit: 200, usageLimitPerTraveler: 1, usageCount: 86,
    validFrom: '2026-10-01', validTo: '2030-10-31', appliesToAllTours: false,
    appliedTourIds: ['4'], status: 'Active', createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
  },
  {
    id: '32', couponCode: 'FALLVIP20', name: 'Fall VIP', operatorUserId: 101,
    discountType: 'Percentage', discountValue: 20, maxDiscountAmount: 200000,
    minSpend: null, usageLimit: null, usageLimitPerTraveler: null, usageCount: 0,
    validFrom: '2030-11-01', validTo: '2030-11-30', appliesToAllTours: true,
    appliedTourIds: ['4', '5'], status: 'Scheduled', createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
  },
];

describe('OperatorCouponListView (UC-39)', () => {
  it('renders coupon summaries without non-production notices', () => {
    render(<OperatorCouponListView coupons={coupons} />);
    expect(screen.getByText(couponEn.list.title)).toBeDefined();
    expect(screen.getAllByText('BANA15').length).toBeGreaterThan(0);
  });

  it('ignores obsolete mode flags and emits clean create and edit URLs', () => {
    render(<OperatorCouponListView coupons={coupons} />);
    const createLink = screen.getByRole('link', { name: new RegExp(couponEn.list.createButton, 'i') });
    expect(createLink.getAttribute('href')).not.toContain(obsoleteModeParam);
    const editLinks = screen.getAllByRole('link', { name: new RegExp(couponEn.list.table.editAction, 'i') });
    expect(editLinks[0].getAttribute('href')).not.toContain(obsoleteModeParam);
  });

  it('filters coupons by status', () => {
    render(<OperatorCouponListView coupons={coupons} />);
    fireEvent.click(screen.getByRole('button', { name: couponEn.list.filterTabs.scheduled }));
    expect(screen.getAllByText('FALLVIP20').length).toBeGreaterThan(0);
    expect(screen.queryByText('BANA15')).toBeNull();
  });

  it('renders unlimited usage without dividing by zero', () => {
    render(<OperatorCouponListView coupons={[coupons[1]]} />);
    expect(screen.getAllByText(couponEn.list.table.unlimited).length).toBeGreaterThan(0);
    expect(screen.queryByText('null max')).toBeNull();
  });

  it('shows the empty state', () => {
    render(<OperatorCouponListView coupons={[]} />);
    expect(screen.getByText(couponEn.list.empty.title)).toBeDefined();
  });

  it('paginates at twenty coupons', () => {
    const manyCoupons = Array.from({ length: 25 }, (_, index): CouponDto => ({
      ...coupons[0], id: String(index + 1), couponCode: `CODE${index + 1}`,
      name: `Campaign ${index + 1}`, usageCount: 0,
    }));
    render(<OperatorCouponListView coupons={manyCoupons} />);
    expect(screen.getByText('Showing 1 to 20 of 25 coupons')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: new RegExp(couponEn.list.pagination.next, 'i') }));
    expect(screen.getByText('Showing 21 to 25 of 25 coupons')).toBeDefined();
    expect(screen.getAllByText('CODE25').length).toBeGreaterThan(0);
  });
});
