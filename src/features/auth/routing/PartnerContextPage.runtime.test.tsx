import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthStorage } from '../session/authSession';

const mocks = vi.hoisted(() => ({ webRefresh: vi.fn(), replace: vi.fn() }));
vi.mock('@/lib/authApi', () => ({ webRefresh: mocks.webRefresh }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: mocks.replace, push: vi.fn() }) }));
vi.mock('next/font/google', () => ({ Geist: () => ({ variable: '' }), Geist_Mono: () => ({ variable: '' }) }));

const PartnerApplicationPage = (await import('../../../../app/partner/application/page')).default;
const PartnerPage = (await import('../../../../app/partner/page')).default;
const PartnerRegisterPage = (await import('../../../../app/partner/register/page')).default;
const RootLayout = (await import('../../../../app/layout')).default;

vi.mock('@/features/operator/application/OperatorRegistrationForm', () => ({
  OperatorRegistrationForm: () => <p>register-form</p>,
}));

const operator = (applicationStatus: string | null) => ({
  userId: 7, email: 'operator@example.com', fullName: 'Restored Operator', role: 'TourOperator', status: 'Active',
  applicationStatus, accessToken: 'test-access', accessTokenExpiresAtUtc: new Date(Date.now() + 60000).toISOString(),
});

afterEach(() => { cleanup(); vi.clearAllMocks(); });
beforeEach(() => { AuthStorage.clear(); localStorage.clear(); sessionStorage.clear(); });

describe('S01 runtime wiring regression (real cold-start composition, browser failure repro)', () => {
  it('A. cold /partner/application restores PendingApproval: restoring first, no "Please sign in" before settle, refresh exactly once', async () => {
    let settleRefresh!: () => void;
    const gate = new Promise<void>((resolve) => { settleRefresh = resolve; });
    mocks.webRefresh.mockImplementation(async () => { await gate; return AuthStorage.accept(operator('PendingApproval') as never, false); });
    render(<PartnerApplicationPage />);
    // The exact browser failure: this must NOT appear while restoring.
    expect(screen.queryByText(/Please sign in/)).toBeNull();
    expect(screen.getByRole('status')).toBeDefined();
    expect(mocks.webRefresh).toHaveBeenCalledTimes(1);
    settleRefresh();
    await waitFor(() => expect(screen.getByText('PendingApproval')).toBeDefined());
    expect(screen.queryByText(/Please sign in/)).toBeNull();
    expect(mocks.webRefresh).toHaveBeenCalledTimes(1);
  });

  it('B. cold /partner restores an Approved operator into the approved area', async () => {
    mocks.webRefresh.mockImplementation(async () => AuthStorage.accept(operator('Approved') as never, false));
    render(<PartnerPage />);
    expect(screen.queryByText(/Please sign in/)).toBeNull();
    await waitFor(() => expect(screen.getByText(/Khu/)).toBeDefined());
  });

  it('C. cold restore with applicationStatus null keeps the fail-closed unresolved UI and infers nothing', async () => {
    mocks.webRefresh.mockImplementation(async () => AuthStorage.accept(operator(null) as never, false));
    render(<PartnerApplicationPage />);
    await waitFor(() => expect(screen.getByText(/Partner\./)).toBeDefined());
    expect(screen.queryByText('PendingApproval')).toBeNull();
    expect(screen.queryByText('Approved')).toBeNull();
    expect(screen.queryByText(/Please sign in/)).toBeNull();
  });

  it('D. restore 401: restoring first, then CR-11 denies the guest application route toward public sign-in', async () => {
    let settleRefresh!: (error: unknown) => void;
    const gate = new Promise<void>((resolve, reject) => { settleRefresh = (error) => { reject(error); }; });
    mocks.webRefresh.mockImplementation(() => gate.catch(() => { throw { status: 401, code: 'AUTH_TOKEN_INVALID' }; }));
    render(<PartnerApplicationPage />);
    expect(screen.queryByText(/Please sign in/)).toBeNull();
    expect(screen.getByRole('status')).toBeDefined();
    settleRefresh({ status: 401 });
    // CR-11 matrix: a genuinely unauthenticated visitor is redirected to the
    // public sign-in route rather than being shown Partner content.
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/sign-in'));
    expect(screen.queryByText(/Please sign in/)).toBeNull();
  });

  it('E. warm memory renders without any refresh call', () => {
    AuthStorage.accept(operator('PendingApproval') as never, false);
    render(<PartnerApplicationPage />);
    expect(screen.getByText('PendingApproval')).toBeDefined();
    expect(mocks.webRefresh).not.toHaveBeenCalled();
  });

  it('G. cold /partner/register: a restored Traveler is denied toward home and the form never renders', async () => {
    mocks.webRefresh.mockImplementation(async () => AuthStorage.accept({
      userId: 9, email: 't@example.com', fullName: 'T', role: 'Traveler', status: 'Active',
      applicationStatus: null, accessToken: 'test-access', accessTokenExpiresAtUtc: new Date(Date.now() + 60000).toISOString(),
    } as never, false));
    render(<PartnerRegisterPage />);
    expect(screen.queryByText('register-form')).toBeNull();
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/'));
    expect(screen.queryByText('register-form')).toBeNull();
  });

  it('G. cold /partner/register: a settled guest keeps the registration form allowed (future UC-02 entry)', async () => {
    mocks.webRefresh.mockRejectedValue({ status: 401, code: 'AUTH_TOKEN_INVALID' });
    render(<PartnerRegisterPage />);
    expect(screen.queryByText('register-form')).toBeNull();
    await waitFor(() => expect(screen.getByText('register-form')).toBeDefined());
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it('F. the real root layout mounts WebSessionProvider: cold start drives exactly one restore and still renders children', async () => {
    mocks.webRefresh.mockImplementation(async () => AuthStorage.accept(operator('PendingApproval') as never, false));
    render(<RootLayout><p>child-content</p></RootLayout>);
    expect(screen.getByText('child-content')).toBeDefined();
    await waitFor(() => expect(mocks.webRefresh).toHaveBeenCalledTimes(1));
    // Regression guard: an import-only layout (provider never rendered) fails above.
    expect(AuthStorage.getContext()?.role).toBe('TourOperator');
  });
});
