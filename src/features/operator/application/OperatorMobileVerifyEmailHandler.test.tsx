import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OperatorMobileVerifyEmailHandler } from './OperatorMobileVerifyEmailHandler';

const firebaseMocks = vi.hoisted(() => ({ applyActionCode: vi.fn(), checkActionCode: vi.fn() }));
const authState = vi.hoisted(() => ({}));
const apiMocks = vi.hoisted(() => ({ verifyEmail: vi.fn(), webVerifyEmail: vi.fn() }));

vi.mock('firebase/auth', () => ({
  applyActionCode: firebaseMocks.applyActionCode,
  checkActionCode: firebaseMocks.checkActionCode,
}));
vi.mock('@/lib/firebase', () => ({ getFirebaseAuth: () => authState }));
vi.mock('@/lib/authApi', () => apiMocks);

describe('Operator Mobile email verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    firebaseMocks.checkActionCode.mockResolvedValue({ data: { email: 'operator@example.com' } });
    firebaseMocks.applyActionCode.mockResolvedValue(undefined);
  });

  it('applies the action code but never calls BE before the Mobile application is submitted', async () => {
    render(<OperatorMobileVerifyEmailHandler mode="verifyEmail" oobCode="valid-code" />);
    expect(await screen.findByText('Return to the TripMate app')).toBeDefined();
    expect(firebaseMocks.applyActionCode).toHaveBeenCalledWith(authState, 'valid-code');
    expect(apiMocks.webVerifyEmail).not.toHaveBeenCalled();
    expect(apiMocks.verifyEmail).not.toHaveBeenCalled();
  });

  it('does not claim a submitted application without an action code', () => {
    render(<OperatorMobileVerifyEmailHandler />);
    expect(screen.getByText('Return to the TripMate app')).toBeDefined();
    expect(screen.getByText(/before sending the Tour Operator application/i)).toBeDefined();
  });

  it('shows an invalid link safely', async () => {
    firebaseMocks.checkActionCode.mockRejectedValue(new Error('private Firebase details'));
    render(<OperatorMobileVerifyEmailHandler mode="verifyEmail" oobCode="bad-code" />);
    expect(await screen.findByText('Verification Failed')).toBeDefined();
    expect(screen.queryByText(/private Firebase details/)).toBeNull();
  });
});
