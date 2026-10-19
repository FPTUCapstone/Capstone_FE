import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateCouponView } from './CreateCouponView';
import { DEMO_ELIGIBLE_TOURS } from '../data/operatorCouponDemoFixtures';
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

describe('CreateCouponView (UC-38 Create Coupon)', () => {
  it('renders all canonical input fields and labels in English', () => {
    render(<CreateCouponView eligibleTours={DEMO_ELIGIBLE_TOURS} isDemo={true} />);

    expect(screen.getByLabelText(new RegExp(`^${couponEn.create.fields.couponCode}`, 'i'))).toBeDefined();
    expect(screen.getByLabelText(new RegExp(couponEn.create.fields.name, 'i'))).toBeDefined();
    expect(screen.getByText(couponEn.create.fields.discountTypePercentage)).toBeDefined();
    expect(screen.getByLabelText(new RegExp(couponEn.create.fields.discountValue, 'i'))).toBeDefined();
    expect(screen.getByLabelText(/Maximum Discount Amount/i)).toBeDefined();
    expect(screen.getByLabelText(/Minimum Spend/i)).toBeDefined();
    expect(screen.getByLabelText(new RegExp(couponEn.create.fields.usageLimit, 'i'))).toBeDefined();
    expect(screen.getByLabelText(new RegExp(couponEn.create.fields.validFrom, 'i'))).toBeDefined();
    expect(screen.getByLabelText(new RegExp(couponEn.create.fields.validTo, 'i'))).toBeDefined();
    expect(screen.getByLabelText(new RegExp(couponEn.create.fields.appliesToAllTours, 'i'))).toBeDefined();
  });

  it('triggers inline semantic validation when submitting with empty required fields (CR-04)', async () => {
    render(<CreateCouponView eligibleTours={DEMO_ELIGIBLE_TOURS} isDemo={true} />);

    const codeInput = screen.getByLabelText(new RegExp(`^${couponEn.create.fields.couponCode}`, 'i'));
    fireEvent.change(codeInput, { target: { value: '' } });

    const submitBtn = screen.getByRole('button', { name: new RegExp(couponEn.create.actions.submit, 'i') });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getAllByText(couponEn.errors.requiredField).length).toBeGreaterThan(0);
    });
  });

  it('toggles scope selector and allows choosing specific owned tour packages', () => {
    render(<CreateCouponView eligibleTours={DEMO_ELIGIBLE_TOURS} isDemo={true} />);

    const allToursCheckbox = screen.getByLabelText(new RegExp(couponEn.create.fields.appliesToAllTours, 'i'));
    expect((allToursCheckbox as HTMLInputElement).checked).toBe(true);

    // Uncheck "apply to all tours"
    fireEvent.click(allToursCheckbox);
    expect((allToursCheckbox as HTMLInputElement).checked).toBe(false);

    // Specific tour options should appear
    expect(screen.getByText('Ba Na Hills full-day tour')).toBeDefined();
    expect(screen.getByText('Hội An lantern evening tour')).toBeDefined();
  });

  it('truthfully prevents fake backend persistence in production mode', async () => {
    render(<CreateCouponView eligibleTours={DEMO_ELIGIBLE_TOURS} isDemo={false} />);

    const codeInput = screen.getByLabelText(new RegExp(`^${couponEn.create.fields.couponCode}`, 'i'));
    fireEvent.change(codeInput, { target: { value: 'PRODTEST' } });

    const nameInput = screen.getByLabelText(new RegExp(couponEn.create.fields.name, 'i'));
    fireEvent.change(nameInput, { target: { value: 'Test Prod Promotion' } });

    const submitBtn = screen.getByRole('button', { name: new RegExp(couponEn.create.actions.submit, 'i') });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert.textContent).toContain('PENDING_BE_INTEGRATION');
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('successfully creates coupon with authenticated currentUserId and redirects in Demo mode', async () => {
    render(
      <CreateCouponView
        eligibleTours={DEMO_ELIGIBLE_TOURS}
        currentUserId={101}
        isDemo={true}
      />
    );

    const codeInput = screen.getByLabelText(new RegExp(`^${couponEn.create.fields.couponCode}`, 'i'));
    fireEvent.change(codeInput, { target: { value: 'DEMOSUCCESS' } });

    const nameInput = screen.getByLabelText(new RegExp(couponEn.create.fields.name, 'i'));
    fireEvent.change(nameInput, { target: { value: 'Demo Success Promotion' } });

    const submitBtn = screen.getByRole('button', { name: new RegExp(couponEn.create.actions.submit, 'i') });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(couponEn.create.notices.success)).toBeDefined();
    });

    await waitFor(
      () => {
        expect(mockPush).toHaveBeenCalledWith('/partner/coupons?demo=1');
      },
      { timeout: 1500 }
    );
  });

  it('fails closed with unauthorized error when currentUserId is missing in Demo mode', async () => {
    render(<CreateCouponView eligibleTours={DEMO_ELIGIBLE_TOURS} isDemo={true} />);

    const codeInput = screen.getByLabelText(new RegExp(`^${couponEn.create.fields.couponCode}`, 'i'));
    fireEvent.change(codeInput, { target: { value: 'NOACTOR' } });

    const nameInput = screen.getByLabelText(new RegExp(couponEn.create.fields.name, 'i'));
    fireEvent.change(nameInput, { target: { value: 'No Actor Attempt' } });

    const submitBtn = screen.getByRole('button', { name: new RegExp(couponEn.create.actions.submit, 'i') });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(couponEn.errors.unauthorizedOwner)).toBeDefined();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('preserves returnUrl context when navigating back', () => {
    mockSearchParams = new URLSearchParams('demo=1&returnUrl=%2Fpartner%2Fcoupons%3Fpage%3D2%26status%3DActive');
    render(<CreateCouponView eligibleTours={DEMO_ELIGIBLE_TOURS} isDemo={true} />);

    const backLink = screen.getByRole('link', { name: new RegExp(couponEn.create.backAria, 'i') });
    expect(backLink.getAttribute('href')).toBe('/partner/coupons?page=2&status=Active&demo=1');
  });

  it('10. excludes foreign operator tours from the scope selector when eligibleTours is actor-scoped', () => {
    const operator101Tours = DEMO_ELIGIBLE_TOURS.filter((t) => String(t.operatorUserId) === '101');
    render(
      <CreateCouponView
        eligibleTours={operator101Tours}
        currentUserId={101}
        isDemo={true}
      />
    );

    const allToursCheckbox = screen.getByLabelText(new RegExp(couponEn.create.fields.appliesToAllTours, 'i'));
    fireEvent.click(allToursCheckbox); // reveal selector

    // Operator 101 tours are present
    expect(screen.getByText('Ba Na Hills full-day tour')).toBeDefined();
    expect(screen.getByText('Hội An lantern evening tour')).toBeDefined();
    expect(screen.getByText('Da Nang Night Food Trail')).toBeDefined();

    // Foreign tours (operator 202) are not in the selector
    expect(screen.queryByText('Huế Imperial City heritage tour')).toBeNull();
    expect(screen.queryByText('Nha Trang coral island discovery')).toBeNull();
  });

  it('rejects fractional usageLimit and usageLimitPerTraveler with inline accessible validation errors', async () => {
    render(
      <CreateCouponView
        eligibleTours={DEMO_ELIGIBLE_TOURS}
        currentUserId={101}
        isDemo={true}
      />
    );

    const codeInput = screen.getByLabelText(new RegExp(`^${couponEn.create.fields.couponCode}`, 'i'));
    fireEvent.change(codeInput, { target: { value: 'FRACTIONAL10' } });

    const nameInput = screen.getByLabelText(new RegExp(couponEn.create.fields.name, 'i'));
    fireEvent.change(nameInput, { target: { value: 'Fractional Usage Limit Test' } });

    const usageLimitInput = screen.getByLabelText(new RegExp(couponEn.create.fields.usageLimit, 'i'));
    const perTravelerInput = screen.getByLabelText(
      new RegExp(couponEn.create.fields.usageLimitPerTraveler, 'i')
    );

    fireEvent.change(usageLimitInput, { target: { value: '1.5' } });
    fireEvent.change(perTravelerInput, { target: { value: '0.5' } });

    const submitBtn = screen.getByRole('button', { name: new RegExp(couponEn.create.actions.submit, 'i') });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getAllByText(couponEn.errors.invalidNumeric).length).toBe(2);
    });
    expect(usageLimitInput.getAttribute('aria-invalid')).toBe('true');
    expect(perTravelerInput.getAttribute('aria-invalid')).toBe('true');
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('shows clear English empty state and disables coupon creation when eligibleTours is empty (P1 Zero-Owned-Tour Scope)', () => {
    render(
      <CreateCouponView
        eligibleTours={[]}
        currentUserId={303}
        isDemo={true}
      />
    );

    expect(screen.getByText(couponEn.create.fields.noEligibleToursTitle)).toBeDefined();
    expect(screen.getByText(couponEn.create.fields.noEligibleToursHelp)).toBeDefined();

    const allToursCheckbox = screen.getByLabelText(
      new RegExp(couponEn.create.fields.appliesToAllTours, 'i')
    ) as HTMLInputElement;
    expect(allToursCheckbox.disabled).toBe(true);

    const submitBtn = screen.getByRole('button', {
      name: new RegExp(couponEn.create.actions.submit, 'i'),
    }) as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(true);
  });
});
