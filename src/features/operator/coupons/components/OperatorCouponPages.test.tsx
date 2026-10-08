import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthStorage, type WebAuthContext } from '@/features/auth/session/authSession';
import OperatorCouponsPage from '../../../../../app/partner/coupons/page';
import CreateCouponPage from '../../../../../app/partner/coupons/new/page';
import EditCouponPage from '../../../../../app/partner/coupons/[id]/edit/page';
import { resetDemoCouponsStore } from '../services/operatorCouponService';
import { couponEn } from '../resources/en';

const mockPush = vi.fn();
const mockWebRefresh = vi.fn();
let mockSearchParams = new URLSearchParams('demo=1');
let mockParams = { id: 'cp-bana15' };

vi.mock('@/lib/authApi', () => ({
  webRefresh: () => mockWebRefresh(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
  useSearchParams: () => mockSearchParams,
  useParams: () => mockParams,
}));

const acceptOperatorSession = (userId = 101): WebAuthContext =>
  AuthStorage.accept(
    {
      userId,
      email: 'operator@tripmate.vn',
      fullName: 'Han River Travel',
      role: 'TourOperator',
      status: 'Active',
      applicationStatus: 'Approved',
      applicationUnresolved: false,
      accessToken: 'test-access-token',
      accessTokenExpiresAtUtc: new Date(Date.now() + 60000).toISOString(),
    } as unknown as WebAuthContext,
    false
  );

beforeEach(() => {
  resetDemoCouponsStore();
  AuthStorage.clear();
  acceptOperatorSession(101);
  mockPush.mockClear();
  mockWebRefresh.mockReset();
  mockSearchParams = new URLSearchParams('demo=1');
  mockParams = { id: 'cp-bana15' };
  vi.unstubAllEnvs();
  vi.stubEnv('NODE_ENV', 'test');
  vi.stubEnv('NEXT_PUBLIC_ENABLE_DEMO_FIXTURES', 'true');
});

describe('Operator Coupons App Router Pages', () => {
  it('renders OperatorCouponsPage with list and navigation for authenticated owner', async () => {
    render(<OperatorCouponsPage />);

    await waitFor(() => {
      expect(screen.getByText(couponEn.list.title)).toBeDefined();
    });
    expect(screen.getAllByText('BANA15').length).toBeGreaterThan(0);
  });

  it('renders CreateCouponPage with form and eligible tours', async () => {
    render(<CreateCouponPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: couponEn.create.title })).toBeDefined();
    });
    expect(
      screen.getByLabelText(new RegExp(`^${couponEn.create.fields.couponCode}`, 'i'))
    ).toBeDefined();
  });

  it('renders EditCouponPage with existing coupon details when session userId matches owner', async () => {
    mockParams = { id: 'cp-bana15' };
    render(<EditCouponPage />);

    await waitFor(() => {
      expect(
        screen.getByText(couponEn.update.title.replace('{code}', 'BANA15'))
      ).toBeDefined();
    });
    expect(screen.getByText(couponEn.update.subtitle)).toBeDefined();
  });

  it('blocks foreign operator on EditCouponPage and does not render UpdateCouponView', async () => {
    AuthStorage.clear();
    acceptOperatorSession(999); // Foreign operator trying to edit operator 101's coupon
    mockParams = { id: 'cp-bana15' };

    render(<EditCouponPage />);

    await waitFor(() => {
      expect(screen.getByText(couponEn.page.unauthorizedTitle)).toBeDefined();
    });
    expect(screen.getByText(couponEn.errors.unauthorizedOwner)).toBeDefined();
    expect(screen.queryByText(couponEn.update.title.replace('{code}', 'BANA15'))).toBeNull();
  });

  it('fails closed on EditCouponPage when session is unauthenticated / missing context', async () => {
    AuthStorage.clear();
    mockWebRefresh.mockRejectedValue(new Error('Unauthenticated'));
    mockParams = { id: 'cp-bana15' };

    render(<EditCouponPage />);

    await waitFor(() => {
      expect(screen.getByText(couponEn.page.unauthorizedTitle)).toBeDefined();
    });
    expect(screen.queryByText(couponEn.update.title.replace('{code}', 'BANA15'))).toBeNull();
  });

  it('renders truthful pending banner on EditCouponPage in production mode', async () => {
    mockSearchParams = new URLSearchParams(''); // production (no demo=1)
    render(<EditCouponPage />);

    await waitFor(() => {
      expect(screen.getByText(couponEn.page.pendingIntegrationTitle)).toBeDefined();
    });
  });

  it('renders not found state on EditCouponPage for invalid ID in demo mode', async () => {
    mockParams = { id: 'invalid-coupon-id-999' };
    render(<EditCouponPage />);

    await waitFor(() => {
      expect(screen.getByText(couponEn.page.notFoundTitle)).toBeDefined();
    });
  });
});
