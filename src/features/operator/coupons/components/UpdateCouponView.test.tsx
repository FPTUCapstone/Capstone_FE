import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UpdateCouponView } from './UpdateCouponView';
import { DEMO_ELIGIBLE_TOURS, INITIAL_DEMO_COUPONS } from '../data/operatorCouponDemoFixtures';
import { resetDemoCouponsStore } from '../services/operatorCouponService';
import { couponEn } from '../resources/en';

const mockPush = vi.fn();
let mockSearchParams = new URLSearchParams('demo=1');

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => mockSearchParams,
}));

beforeEach(() => {
  resetDemoCouponsStore();
  mockPush.mockClear();
  mockSearchParams = new URLSearchParams('demo=1');
  vi.unstubAllEnvs();
  vi.stubEnv('NODE_ENV', 'test');
  vi.stubEnv('NEXT_PUBLIC_ENABLE_DEMO_FIXTURES', 'true');
});

describe('UpdateCouponView (UC-39 Update Coupon)', () => {
  const initialCoupon = INITIAL_DEMO_COUPONS[0]; // BANA15, usageCount: 86, usageLimit: 200

  it('renders read-only immutable coupon code', () => {
    render(
      <UpdateCouponView
        initialCoupon={initialCoupon}
        eligibleTours={DEMO_ELIGIBLE_TOURS}
        isDemo={true}
      />
    );

    // Coupon code is displayed with lock indicator
    expect(screen.getAllByText('BANA15').length).toBeGreaterThan(0);
    expect(screen.getByText(couponEn.update.couponCodeNote)).toBeDefined();

    // Verify there is NO editable input for coupon code
    expect(screen.queryByPlaceholderText(/SUMMER2026/i)).toBeNull();
  });

  it('displays recorded usage count, remaining usages, and preservation rule notice', () => {
    render(
      <UpdateCouponView
        initialCoupon={initialCoupon}
        eligibleTours={DEMO_ELIGIBLE_TOURS}
        isDemo={true}
      />
    );

    expect(screen.getAllByText('86').length).toBeGreaterThan(0);
    expect(screen.getByText('114')).toBeDefined(); // 200 - 86 = 114
    expect(screen.getByText(/Applied Booking Preservation Rule/i)).toBeDefined();
  });

  it('enforces floor rule: rejects usageLimit < recorded usageCount', async () => {
    render(
      <UpdateCouponView
        initialCoupon={initialCoupon}
        eligibleTours={DEMO_ELIGIBLE_TOURS}
        isDemo={true}
      />
    );

    const usageInput = screen.getByLabelText(new RegExp(couponEn.create.fields.usageLimit, 'i'));
    // Try to reduce usage limit to 50 when usageCount is 86
    fireEvent.change(usageInput, { target: { value: '50' } });

    const saveBtn = screen.getByRole('button', { name: new RegExp(couponEn.update.actions.save, 'i') });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText(couponEn.errors.usageLimitBelowCount)).toBeDefined();
    });
  });

  it('opens accessible CR-05 confirmation dialog when clicking Deactivate coupon', async () => {
    render(
      <UpdateCouponView
        initialCoupon={initialCoupon}
        eligibleTours={DEMO_ELIGIBLE_TOURS}
        isDemo={true}
      />
    );

    const deactBtn = screen.getByRole('button', {
      name: new RegExp(couponEn.update.statusAction.deactivate, 'i'),
    });
    fireEvent.click(deactBtn);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeDefined();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(
      screen.getByText(couponEn.dialog.deactivateTitle.replace('{code}', 'BANA15'))
    ).toBeDefined();

    // Press Escape to dismiss dialog
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  it('deactivates coupon and updates status when confirmed by owner in Demo mode', async () => {
    render(
      <UpdateCouponView
        initialCoupon={initialCoupon}
        eligibleTours={DEMO_ELIGIBLE_TOURS}
        currentUserId={101}
        isDemo={true}
      />
    );

    const deactBtn = screen.getByRole('button', {
      name: new RegExp(couponEn.update.statusAction.deactivate, 'i'),
    });
    fireEvent.click(deactBtn);

    const confirmBtn = screen.getByRole('button', {
      name: new RegExp(couponEn.dialog.confirmDeactivate, 'i'),
    });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(screen.getByText(/Coupon deactivated successfully/i)).toBeDefined();
    });
  });

  it('blocks update and deactivate when currentUserId is foreign', async () => {
    render(
      <UpdateCouponView
        initialCoupon={initialCoupon} // owned by 101
        eligibleTours={DEMO_ELIGIBLE_TOURS}
        currentUserId={999} // foreign actor
        isDemo={true}
      />
    );

    const saveBtn = screen.getByRole('button', { name: new RegExp(couponEn.update.actions.save, 'i') });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText(couponEn.errors.unauthorizedOwner)).toBeDefined();
    });

    const deactBtn = screen.getByRole('button', {
      name: new RegExp(couponEn.update.statusAction.deactivate, 'i'),
    });
    fireEvent.click(deactBtn);

    const confirmBtn = screen.getByRole('button', {
      name: new RegExp(couponEn.dialog.confirmDeactivate, 'i'),
    });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(screen.getByText(couponEn.errors.unauthorizedOwner)).toBeDefined();
    });
  });

  it('does not offer reactivate button when coupon is expired (validTo < today)', () => {
    const expiredCoupon = INITIAL_DEMO_COUPONS[3]; // SUMMER2026: Inactive, validTo 2026-08-31
    render(
      <UpdateCouponView
        initialCoupon={expiredCoupon}
        eligibleTours={DEMO_ELIGIBLE_TOURS}
        currentUserId={101}
        isDemo={true}
      />
    );

    expect(
      screen.queryByRole('button', { name: new RegExp(couponEn.update.statusAction.activate, 'i') })
    ).toBeNull();
    expect(
      screen.queryByRole('button', { name: new RegExp(couponEn.update.statusAction.deactivate, 'i') })
    ).toBeNull();
    expect(screen.getByText(couponEn.update.statusAction.expiredBlocked)).toBeDefined();
    expect(screen.getAllByText(couponEn.statuses.expired).length).toBeGreaterThan(0);
  });

  it('truthfully reports pending capability in production mode', async () => {
    render(
      <UpdateCouponView
        initialCoupon={initialCoupon}
        eligibleTours={DEMO_ELIGIBLE_TOURS}
        currentUserId={101}
        isDemo={false}
      />
    );

    const saveBtn = screen.getByRole('button', { name: new RegExp(couponEn.update.actions.save, 'i') });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert.textContent).toContain('PENDING_BE_INTEGRATION');
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('preserves returnUrl context when navigating back', () => {
    mockSearchParams = new URLSearchParams('demo=1&returnUrl=%2Fpartner%2Fcoupons%3Fpage%3D2%26status%3DActive');
    render(
      <UpdateCouponView
        initialCoupon={initialCoupon}
        eligibleTours={DEMO_ELIGIBLE_TOURS}
        currentUserId={101}
        isDemo={true}
      />
    );

    const backLink = screen.getByRole('link', { name: new RegExp(couponEn.update.backAria, 'i') });
    expect(backLink.getAttribute('href')).toBe('/partner/coupons?page=2&status=Active&demo=1');
  });

  it('rejects fractional usageLimit and usageLimitPerTraveler with inline accessible validation errors', async () => {
    render(
      <UpdateCouponView
        initialCoupon={initialCoupon}
        eligibleTours={DEMO_ELIGIBLE_TOURS}
        currentUserId={101}
        isDemo={true}
      />
    );

    const usageLimitInput = screen.getByLabelText(new RegExp(couponEn.create.fields.usageLimit, 'i'));
    const perTravelerInput = screen.getByLabelText(
      new RegExp(couponEn.create.fields.usageLimitPerTraveler, 'i')
    );

    fireEvent.change(usageLimitInput, { target: { value: '200.5' } });
    fireEvent.change(perTravelerInput, { target: { value: '0.5' } });

    const saveBtn = screen.getByRole('button', { name: new RegExp(couponEn.update.actions.save, 'i') });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getAllByText(couponEn.errors.invalidNumeric).length).toBe(2);
    });
    expect(usageLimitInput.getAttribute('aria-invalid')).toBe('true');
    expect(perTravelerInput.getAttribute('aria-invalid')).toBe('true');
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('shows clear English empty state and disables coupon save when eligibleTours is empty (P1 Zero-Owned-Tour Scope)', () => {
    render(
      <UpdateCouponView
        initialCoupon={initialCoupon}
        eligibleTours={[]}
        currentUserId={101}
        isDemo={true}
      />
    );

    expect(screen.getByText(couponEn.create.fields.noEligibleToursTitle)).toBeDefined();
    expect(screen.getByText(couponEn.create.fields.noEligibleToursHelp)).toBeDefined();

    const allToursCheckbox = screen.getByLabelText(
      new RegExp(couponEn.create.fields.appliesToAllTours, 'i')
    ) as HTMLInputElement;
    expect(allToursCheckbox.disabled).toBe(true);

    const saveBtn = screen.getByRole('button', {
      name: new RegExp(couponEn.update.actions.save, 'i'),
    }) as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(true);
  });
});
