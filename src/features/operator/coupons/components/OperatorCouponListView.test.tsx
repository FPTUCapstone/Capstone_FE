import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OperatorCouponListView } from './OperatorCouponListView';
import { INITIAL_DEMO_COUPONS } from '../data/operatorCouponDemoFixtures';
import { couponEn } from '../resources/en';
import type { CouponDto } from '../types/couponLifecycle';

const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockSearchParams = new URLSearchParams('demo=1');

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => mockSearchParams,
}));

describe('OperatorCouponListView (Supporting Promotional Coupons List)', () => {
  it('renders coupon summary statistics and list items in English', () => {
    render(<OperatorCouponListView coupons={INITIAL_DEMO_COUPONS} isDemo={true} />);

    expect(screen.getByText(couponEn.list.title)).toBeDefined();
    expect(screen.getAllByText('BANA15').length).toBeGreaterThan(0);
    expect(screen.getAllByText('DANANG50K').length).toBeGreaterThan(0);
    expect(screen.getAllByText('FALLVIP20').length).toBeGreaterThan(0);

    // Check KPI counts
    expect(screen.getByText(String(INITIAL_DEMO_COUPONS.length))).toBeDefined();
  });

  it('displays truthful PENDING_BE_INTEGRATION banner when not in demo mode', () => {
    render(<OperatorCouponListView coupons={INITIAL_DEMO_COUPONS} isDemo={false} />);
    expect(screen.getByRole('status')).toBeDefined();
    expect(screen.getByText(couponEn.list.banners.productionTitle)).toBeDefined();
    expect(screen.queryByText(couponEn.list.banners.demoTitle)).toBeNull();
  });

  it('displays Demo banner when isDemo is true', () => {
    render(<OperatorCouponListView coupons={INITIAL_DEMO_COUPONS} isDemo={true} />);
    expect(screen.getByText(couponEn.list.banners.demoTitle)).toBeDefined();
    expect(screen.queryByText(couponEn.list.banners.productionTitle)).toBeNull();
  });

  it('filters coupons by status tabs', () => {
    render(<OperatorCouponListView coupons={INITIAL_DEMO_COUPONS} isDemo={true} />);

    // Click "Scheduled" tab
    const scheduledTab = screen.getByRole('button', { name: couponEn.list.filterTabs.scheduled });
    fireEvent.click(scheduledTab);

    expect(screen.getAllByText('FALLVIP20').length).toBeGreaterThan(0);
    expect(screen.queryByText('BANA15')).toBeNull(); // BANA15 is Active

    // Click "Inactive" tab
    const inactiveTab = screen.getByRole('button', { name: couponEn.list.filterTabs.inactive });
    fireEvent.click(inactiveTab);

    expect(screen.getAllByText('SUMMER2026').length).toBeGreaterThan(0);
    expect(screen.queryByText('FALLVIP20')).toBeNull();
  });

  it('shows empty state when no coupons match', () => {
    render(<OperatorCouponListView coupons={[]} isDemo={true} />);
    expect(screen.getByText(couponEn.list.empty.title)).toBeDefined();
  });

  it('preserves demo=1 query parameter on Create and Edit links', () => {
    render(<OperatorCouponListView coupons={INITIAL_DEMO_COUPONS} isDemo={true} />);

    const createLink = screen.getByRole('link', { name: new RegExp(couponEn.list.createButton, 'i') });
    expect(createLink.getAttribute('href')).toContain('?returnUrl=');
    expect(createLink.getAttribute('href')).toContain('demo=1');

    const editLinks = screen.getAllByRole('link', { name: new RegExp(couponEn.list.table.editAction, 'i') });
    expect(editLinks[0].getAttribute('href')).toContain('demo=1');
  });

  it('generates clean production URLs when isDemo is false', () => {
    render(<OperatorCouponListView coupons={INITIAL_DEMO_COUPONS} isDemo={false} />);

    const createLink = screen.getByRole('link', { name: new RegExp(couponEn.list.createButton, 'i') });
    expect(createLink.getAttribute('href')).not.toContain('demo=1');

    const editLinks = screen.getAllByRole('link', { name: new RegExp(couponEn.list.table.editAction, 'i') });
    expect(editLinks[0].getAttribute('href')).not.toContain('demo=1');
  });

  it('enforces CR-01 pagination at 20 items per page with total count and navigation', () => {
    // Generate 25 test coupons
    const manyCoupons: CouponDto[] = Array.from({ length: 25 }, (_, i) => ({
      id: `cp-test-${i + 1}`,
      couponCode: `CODE${i + 1}`,
      name: `Test Campaign ${i + 1}`,
      operatorUserId: 101,
      discountType: 'Percentage',
      discountValue: 10,
      maxDiscountAmount: null,
      minSpend: null,
      usageLimit: 100,
      usageLimitPerTraveler: 1,
      validFrom: '2026-10-01',
      validTo: '2026-10-31',
      appliesToAllTours: true,
      appliedTourIds: [],
      usageCount: 0,
      status: 'Active',
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
      isDemo: true,
    }));

    render(<OperatorCouponListView coupons={manyCoupons} isDemo={true} />);

    // Page 1 displays 20 items (CODE1 to CODE20)
    expect(screen.getByText('Showing 1 to 20 of 25 coupons')).toBeDefined();
    expect(screen.getByText('Page 1 of 2')).toBeDefined();
    expect(screen.getAllByText('CODE1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('CODE20').length).toBeGreaterThan(0);
    expect(screen.queryByText('CODE21')).toBeNull();

    // Previous button should be disabled on page 1
    const prevBtn = screen.getByRole('button', { name: new RegExp(couponEn.list.pagination.previous, 'i') });
    expect((prevBtn as HTMLButtonElement).disabled).toBe(true);

    // Next button should be enabled
    const nextBtn = screen.getByRole('button', { name: new RegExp(couponEn.list.pagination.next, 'i') });
    expect((nextBtn as HTMLButtonElement).disabled).toBe(false);

    // Click Next
    fireEvent.click(nextBtn);

    // Page 2 displays remaining 5 items (CODE21 to CODE25)
    expect(screen.getByText('Showing 21 to 25 of 25 coupons')).toBeDefined();
    expect(screen.getByText('Page 2 of 2')).toBeDefined();
    expect(screen.getAllByText('CODE21').length).toBeGreaterThan(0);
    expect(screen.getAllByText('CODE25').length).toBeGreaterThan(0);
    expect(screen.queryByText('CODE1')).toBeNull();

    // Next button should now be disabled
    expect((nextBtn as HTMLButtonElement).disabled).toBe(true);

    // Changing filter resets page to 1
    const scheduledTab = screen.getByRole('button', { name: couponEn.list.filterTabs.scheduled });
    fireEvent.click(scheduledTab);

    // All test coupons are Active, so Scheduled is empty
    expect(screen.getByText(couponEn.list.empty.title)).toBeDefined();
  });
});
