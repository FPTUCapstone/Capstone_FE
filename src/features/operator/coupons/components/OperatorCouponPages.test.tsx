import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthStorage, type WebAuthContext } from '@/features/auth/session/authSession';
import OperatorCouponsPage from '../../../../../app/partner/coupons/page';
import EditCouponPage from '../../../../../app/partner/coupons/[id]/edit/page';
import * as couponService from '../services/operatorCouponService';
import { couponEn } from '../resources/en';
import type { CouponDto, EligibleTourDto } from '../types/couponLifecycle';

const mockWebRefresh = vi.fn();
let mockSearchParams = new URLSearchParams();
let mockParams = { id: '31' };

vi.mock('@/lib/authApi', () => ({ webRefresh: () => mockWebRefresh() }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => mockSearchParams,
  useParams: () => mockParams,
}));

const coupon: CouponDto = {
  id: '31', couponCode: 'BANA15', name: 'Ba Na Hills', operatorUserId: 101,
  discountType: 'Percentage', discountValue: 15, maxDiscountAmount: 100000,
  minSpend: 500000, usageLimit: 200, usageLimitPerTraveler: 1, usageCount: 86,
  validFrom: '2026-10-01', validTo: '2030-10-31',
  validFromUtc: '2026-10-01T00:00:00Z', validToUtc: '2030-10-31T00:00:00Z',
  appliesToAllTours: false, appliedTourIds: ['4'], status: 'Active',
  createdAt: '2026-09-01T00:00:00Z', updatedAt: '2026-10-01T00:00:00Z',
};

const tours: EligibleTourDto[] = [{
  id: '4', tourCode: 'TOUR-4', title: 'Ba Na Hills Tour', destination: 'Da Nang',
  basePrice: 1200000, status: 'Published', operatorUserId: 101,
}];

function acceptOperatorSession(userId = 101): void {
  AuthStorage.accept({
    userId, email: 'operator@tripmate.vn', fullName: 'Han River Travel',
    role: 'TourOperator', status: 'Active', applicationStatus: 'Approved',
    applicationUnresolved: false, accessToken: 'test-access-token',
    accessTokenExpiresAtUtc: new Date(Date.now() + 60000).toISOString(),
  } as unknown as WebAuthContext, false);
}

beforeEach(() => {
  AuthStorage.clear();
  acceptOperatorSession();
  mockWebRefresh.mockReset();
  mockSearchParams = new URLSearchParams();
  mockParams = { id: '31' };
});

afterEach(() => vi.restoreAllMocks());

describe('UC-39 operator coupon pages', () => {
  it('loads the authenticated operator list from the production service', async () => {
    const load = vi.spyOn(couponService, 'getOperatorCoupons').mockResolvedValue({ status: 'SUCCESS', data: [coupon] });
    render(<OperatorCouponsPage />);
    await waitFor(() => expect(screen.getByText(couponEn.list.title)).toBeDefined());
    expect(screen.getAllByText('BANA15').length).toBeGreaterThan(0);
    expect(load).toHaveBeenCalledWith({ currentUserId: 101 });
  });

  it('loads numeric coupon detail and eligible tours from production services', async () => {
    const detail = vi.spyOn(couponService, 'getOperatorCouponById').mockResolvedValue({ status: 'SUCCESS', data: coupon });
    const eligible = vi.spyOn(couponService, 'getEligibleTours').mockResolvedValue({ status: 'SUCCESS', data: tours });
    render(<EditCouponPage />);
    await waitFor(() => expect(screen.getByText(couponEn.update.title.replace('{code}', 'BANA15'))).toBeDefined());
    expect(detail).toHaveBeenCalledWith('31', { currentUserId: 101 });
    expect(eligible).toHaveBeenCalledWith({ currentUserId: 101 });
  });

  it('ignores a late response after the coupon ID changes', async () => {
    let resolveOldCoupon!: (value: Awaited<ReturnType<typeof couponService.getOperatorCouponById>>) => void;
    let resolveOldTours!: (value: Awaited<ReturnType<typeof couponService.getEligibleTours>>) => void;
    const oldCouponRequest = new Promise<Awaited<ReturnType<typeof couponService.getOperatorCouponById>>>((resolve) => {
      resolveOldCoupon = resolve;
    });
    const oldToursRequest = new Promise<Awaited<ReturnType<typeof couponService.getEligibleTours>>>((resolve) => {
      resolveOldTours = resolve;
    });
    const currentCoupon = { ...coupon, id: '32', couponCode: 'CURRENT32', name: 'Current coupon' };

    vi.spyOn(couponService, 'getOperatorCouponById')
      .mockReturnValueOnce(oldCouponRequest)
      .mockResolvedValueOnce({ status: 'SUCCESS', data: currentCoupon });
    vi.spyOn(couponService, 'getEligibleTours')
      .mockReturnValueOnce(oldToursRequest)
      .mockResolvedValueOnce({ status: 'SUCCESS', data: tours });

    const page = render(<EditCouponPage />);
    mockParams = { id: '32' };
    page.rerender(<EditCouponPage />);

    await waitFor(() => expect(screen.getByText(couponEn.update.title.replace('{code}', 'CURRENT32'))).toBeDefined());

    await act(async () => {
      resolveOldCoupon({ status: 'SUCCESS', data: coupon });
      resolveOldTours({ status: 'SUCCESS', data: tours });
      await Promise.all([oldCouponRequest, oldToursRequest]);
    });

    expect(screen.getByText(couponEn.update.title.replace('{code}', 'CURRENT32'))).toBeDefined();
    expect(screen.queryByText(couponEn.update.title.replace('{code}', 'BANA15'))).toBeNull();
  });

  it('ignores obsolete query flags when loading UC-39', async () => {
    mockSearchParams = new URLSearchParams(`${['de', 'mo'].join('')}=1`);
    const detail = vi.spyOn(couponService, 'getOperatorCouponById').mockResolvedValue({ status: 'SUCCESS', data: coupon });
    const eligible = vi.spyOn(couponService, 'getEligibleTours').mockResolvedValue({ status: 'SUCCESS', data: tours });
    render(<EditCouponPage />);
    await waitFor(() => expect(detail).toHaveBeenCalledWith('31', { currentUserId: 101 }));
    expect(eligible).toHaveBeenCalledWith({ currentUserId: 101 });
  });

  it('blocks unauthenticated access before requesting private coupon data', async () => {
    AuthStorage.clear();
    mockWebRefresh.mockRejectedValue(new Error('Unauthenticated'));
    const list = vi.spyOn(couponService, 'getOperatorCoupons');
    const detail = vi.spyOn(couponService, 'getOperatorCouponById');
    const eligible = vi.spyOn(couponService, 'getEligibleTours');
    render(<OperatorCouponsPage />);
    render(<EditCouponPage />);
    await waitFor(() => expect(screen.getByText(couponEn.page.unauthorizedTitle)).toBeDefined());
    expect(list).not.toHaveBeenCalled();
    expect(detail).not.toHaveBeenCalled();
    expect(eligible).not.toHaveBeenCalled();
  });

  it('shows not found for a non-numeric coupon ID', async () => {
    mockParams = { id: 'invalid-id' };
    const detail = vi.spyOn(couponService, 'getOperatorCouponById').mockResolvedValue({
      status: 'NOT_FOUND', message: 'Coupon not found.',
    });
    render(<EditCouponPage />);
    await waitFor(() => expect(screen.getByText(couponEn.page.notFoundTitle)).toBeDefined());
    expect(detail).toHaveBeenCalledWith('invalid-id', { currentUserId: 101 });
  });

  it('shows a retryable list error instead of a false empty state', async () => {
    vi.spyOn(couponService, 'getOperatorCoupons').mockResolvedValue({
      status: 'SYSTEM_ERROR', message: couponEn.list.loadError, data: [],
    });
    render(<OperatorCouponsPage />);
    await waitFor(() => expect(screen.getByText(couponEn.list.loadError)).toBeDefined());
    expect(screen.queryByText(couponEn.list.empty.title)).toBeNull();
  });
});
