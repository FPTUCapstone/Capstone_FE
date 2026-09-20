import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PasswordRecoveryFlow } from './PasswordRecoveryFlow';

const mocks = vi.hoisted(() => ({
  requestWebPasswordReset: vi.fn(),
  confirmWebPasswordReset: vi.fn(),
  push: vi.fn(),
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock('@/features/auth/recovery/webRecovery', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/auth/recovery/webRecovery')>()),
  requestWebPasswordReset: mocks.requestWebPasswordReset,
  confirmWebPasswordReset: mocks.confirmWebPasswordReset,
}));

const REQUEST_SUCCESS = { message: 'If an account exists for this email, reset instructions have been sent.' };
const CONFIRM_SUCCESS = { message: 'Your password has been reset. You can now sign in with your new password.' };

function fillEmail(value: string) {
  fireEvent.change(screen.getByLabelText('Email Address'), { target: { value } });
}

function advanceToResetForm(email = 'user@example.com', { admin = false } = {}) {
  mocks.requestWebPasswordReset.mockResolvedValue(REQUEST_SUCCESS);
  render(<PasswordRecoveryFlow {...(admin ? { admin: true } : {})} />);
  fillEmail(email);
  fireEvent.click(screen.getByRole('button', { name: /send reset code/i }));
  return waitFor(() => screen.getByLabelText('Reset Code'));
}

function fillResetForm({ code = '012345', password = 'NewPassword1!', confirmPassword = password }: { code?: string; password?: string; confirmPassword?: string } = {}) {
  fireEvent.change(screen.getByLabelText('Reset Code'), { target: { value: code } });
  fireEvent.change(screen.getByLabelText(/^New Password/), { target: { value: password } });
  fireEvent.change(screen.getByLabelText('Confirm New Password'), { target: { value: confirmPassword } });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PasswordRecoveryFlow request step', () => {
  it('begins at the email step for the public flow', () => {
    render(<PasswordRecoveryFlow />);
    expect(screen.getByLabelText('Email Address')).toBeDefined();
    expect(screen.queryByLabelText('Reset Code')).toBeNull();
  });

  it('begins at the email step for the admin self-service flow', () => {
    render(<PasswordRecoveryFlow admin />);
    expect(screen.getByLabelText('Email Address')).toBeDefined();
    expect(screen.getByRole('button', { name: /send reset code/i })).toBeDefined();
  });

  it('blocks an empty email without calling the API', async () => {
    render(<PasswordRecoveryFlow />);
    fireEvent.click(screen.getByRole('button', { name: /send reset code/i }));
    expect(await screen.findByText('Please enter your email.')).toBeDefined();
    expect(mocks.requestWebPasswordReset).not.toHaveBeenCalled();
  });

  it('blocks an invalid email without calling the API', async () => {
    render(<PasswordRecoveryFlow />);
    fillEmail('not-an-email');
    fireEvent.click(screen.getByRole('button', { name: /send reset code/i }));
    expect(await screen.findByText('Invalid email format. Please enter a valid email address.')).toBeDefined();
    expect(mocks.requestWebPasswordReset).not.toHaveBeenCalled();
  });

  it('requests a reset OTP with the normalized email and advances to the reset form', async () => {
    mocks.requestWebPasswordReset.mockResolvedValue(REQUEST_SUCCESS);
    render(<PasswordRecoveryFlow />);
    fillEmail('  User@Example.COM ');
    fireEvent.click(screen.getByRole('button', { name: /send reset code/i }));

    await waitFor(() =>
      expect(mocks.requestWebPasswordReset).toHaveBeenCalledWith('user@example.com'),
    );
    expect(await screen.findByLabelText('Reset Code')).toBeDefined();
  });

  it('shows generic success UX that never claims an account exists', async () => {
    await advanceToResetForm();
    const info = await screen.findByText(/reset code has been sent/i);
    expect(info.textContent).not.toMatch(/account exists for user@example\.com|no account|registered/i);
  });

  it('prevents double submission while a request is in flight', async () => {
    let resolveRequest: (value: typeof REQUEST_SUCCESS) => void = () => {};
    mocks.requestWebPasswordReset.mockImplementation(
      () => new Promise<typeof REQUEST_SUCCESS>((resolve) => { resolveRequest = resolve; }),
    );
    render(<PasswordRecoveryFlow />);
    fillEmail('user@example.com');
    const send = screen.getByRole('button', { name: /send reset code/i });
    fireEvent.click(send);
    fireEvent.click(send);

    resolveRequest(REQUEST_SUCCESS);
    await waitFor(() => expect(mocks.requestWebPasswordReset).toHaveBeenCalledTimes(1));
  });

  it('releases the loading state and allows explicit retry after a request failure', async () => {
    mocks.requestWebPasswordReset.mockRejectedValueOnce({ status: 500, code: 'MSG127' });
    mocks.requestWebPasswordReset.mockResolvedValueOnce(REQUEST_SUCCESS);
    render(<PasswordRecoveryFlow />);
    fillEmail('user@example.com');
    fireEvent.click(screen.getByRole('button', { name: /send reset code/i }));

    expect(await screen.findByText('Something went wrong. Please try again later.')).toBeDefined();
    expect(screen.getByLabelText('Email Address')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /send reset code/i }));
    await waitFor(() => expect(screen.getByLabelText('Reset Code')).toBeDefined());
    expect(mocks.requestWebPasswordReset).toHaveBeenCalledTimes(2);
  });
});

describe('PasswordRecoveryFlow reset form', () => {
  it('renders the OTP, New Password and Confirm Password fields', async () => {
    await advanceToResetForm();
    expect(screen.getByLabelText('Reset Code')).toBeDefined();
    expect(screen.getByLabelText(/^New Password/)).toBeDefined();
    expect(screen.getByLabelText('Confirm New Password')).toBeDefined();
    expect(screen.getByLabelText('Reset Code').getAttribute('type')).toBe('text');
    expect(screen.getByLabelText('Reset Code').getAttribute('maxlength')).toBe('6');
  });

  it('accepts a leading-zero OTP and passes it through verbatim', async () => {
    mocks.confirmWebPasswordReset.mockResolvedValue(CONFIRM_SUCCESS);
    await advanceToResetForm();
    fillResetForm({ code: '012345' });
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() =>
      expect(mocks.confirmWebPasswordReset).toHaveBeenCalledWith({
        email: 'user@example.com',
        code: '012345',
        newPassword: 'NewPassword1!',
      }),
    );
  });

  it.each([
    ['12345', 'fewer than 6 digits'],
    ['1234567', 'more than 6 digits'],
    ['12a456', 'letters'],
    ['１２３４５６', 'non-ASCII digits'],
  ])('rejects %s (%s) without calling the API', async (code) => {
    await advanceToResetForm();
    fillResetForm({ code });
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    expect(await screen.findByText('The reset code must be exactly 6 digits.')).toBeDefined();
    expect(mocks.confirmWebPasswordReset).not.toHaveBeenCalled();
  });

  it('rejects a policy-invalid password using the shared canonical policy', async () => {
    await advanceToResetForm();
    fillResetForm({ password: 'weakpass', confirmPassword: 'weakpass' });
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    expect(
      await screen.findByText('Password must contain uppercase, number, and special character.'),
    ).toBeDefined();
    expect(mocks.confirmWebPasswordReset).not.toHaveBeenCalled();
  });

  it('rejects a confirm-password mismatch', async () => {
    await advanceToResetForm();
    fillResetForm({ confirmPassword: 'OtherPassword1!' });
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    expect(await screen.findByText('Passwords do not match. Please re-enter.')).toBeDefined();
    expect(mocks.confirmWebPasswordReset).not.toHaveBeenCalled();
  });

  it('shows safe MSG14 feedback, stays on the reset form and preserves entered values', async () => {
    mocks.confirmWebPasswordReset.mockRejectedValue({ code: 'MSG14', status: 400 });
    await advanceToResetForm('user@example.com');
    fillResetForm({ code: '999999' });
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    expect(await screen.findByText(
      'The verification code is invalid or has expired. Please try again or request a new code.',
    )).toBeDefined();
    expect(screen.getByLabelText('Reset Code')).toBeDefined();
    expect((screen.getByLabelText('Reset Code') as HTMLInputElement).value).toBe('999999');
    expect((screen.getByLabelText(/^New Password/) as HTMLInputElement).value).toBe('NewPassword1!');
  });

  it('maps MSG127 to generic system feedback without leaking Backend text', async () => {
    mocks.confirmWebPasswordReset.mockRejectedValue({
      code: 'MSG127', status: 500, message: 'internal SQL detail',
    });
    await advanceToResetForm();
    fillResetForm();
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    expect(await screen.findByText('Something went wrong. Please try again later.')).toBeDefined();
    expect(screen.queryByText(/internal SQL detail/i)).toBeNull();
  });

  it('prevents duplicate confirm submissions', async () => {
    let resolveConfirm: (value: typeof CONFIRM_SUCCESS) => void = () => {};
    mocks.confirmWebPasswordReset.mockImplementation(
      () => new Promise<typeof CONFIRM_SUCCESS>((resolve) => { resolveConfirm = resolve; }),
    );
    await advanceToResetForm();
    fillResetForm();
    const submit = screen.getByRole('button', { name: /reset password/i });
    fireEvent.click(submit);
    fireEvent.click(submit);

    resolveConfirm(CONFIRM_SUCCESS);
    await waitFor(() => expect(mocks.confirmWebPasswordReset).toHaveBeenCalledTimes(1));
  });
});

describe('PasswordRecoveryFlow success and navigation', () => {
  it('renders success feedback and links to public Sign In without auto-authenticating', async () => {
    mocks.confirmWebPasswordReset.mockResolvedValue(CONFIRM_SUCCESS);
    await advanceToResetForm();
    fillResetForm();
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    const success = await screen.findByText(/password has been reset successfully/i);
    expect(success).toBeDefined();
    expect(mocks.push).not.toHaveBeenCalled();

    const signInCta = screen.getByRole('link', { name: /^sign in$/i });
    expect(signInCta.getAttribute('href')).toBe('/sign-in');
  });

  it('links the admin self-service flow back to Admin Login', async () => {
    mocks.confirmWebPasswordReset.mockResolvedValue(CONFIRM_SUCCESS);
    await advanceToResetForm('admin@tripmate.com', { admin: true });
    fillResetForm();
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    await screen.findByText(/password has been reset successfully/i);
    const adminCta = screen.getByRole('link', { name: /return to admin login/i });
    expect(adminCta.getAttribute('href')).toBe('/admin/login');
  });

  it('returns a fresh mount to the email step (no persisted recovery context)', async () => {
    mocks.confirmWebPasswordReset.mockResolvedValue(CONFIRM_SUCCESS);
    const { unmount } = render(<PasswordRecoveryFlow />);
    fillEmail('user@example.com');
    fireEvent.click(screen.getByRole('button', { name: /send reset code/i }));
    await screen.findByLabelText('Reset Code');
    fillResetForm();
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
    await screen.findByText(/password has been reset successfully/i);

    unmount();
    render(<PasswordRecoveryFlow />);
    expect(screen.getByLabelText('Email Address')).toBeDefined();
    expect(screen.queryByLabelText('Reset Code')).toBeNull();
  });

  it('makes prior recovery state unusable after success', async () => {
    mocks.confirmWebPasswordReset.mockResolvedValue(CONFIRM_SUCCESS);
    await advanceToResetForm();
    fillResetForm();
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    await screen.findByText(/password has been reset successfully/i);
    expect(screen.queryByLabelText('Reset Code')).toBeNull();
    expect(screen.queryByLabelText(/^New Password/)).toBeNull();
  });

  it('keeps the OTP and password out of URL state during the flow', async () => {
    mocks.confirmWebPasswordReset.mockResolvedValue(CONFIRM_SUCCESS);
    await advanceToResetForm();
    fillResetForm();
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
    await screen.findByText(/password has been reset successfully/i);

    expect(window.location.search).toBe('');
    expect(mocks.push).not.toHaveBeenCalled();
  });
});

describe('PasswordRecoveryFlow resend cooldown and runtime errors', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  async function advanceToResetFormWithFakeTimers(email = 'user@example.com') {
    mocks.requestWebPasswordReset.mockResolvedValue(REQUEST_SUCCESS);
    render(<PasswordRecoveryFlow />);
    fillEmail(email);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /send reset code/i }));
    });
    return screen.getByLabelText('Reset Code');
  }

  async function expireCooldown() {
    await act(async () => {
      vi.advanceTimersByTime(60_000);
    });
  }

  it('starts a 60-second cooldown after the initial request, counts down, then re-enables resend', async () => {
    vi.useFakeTimers();
    await advanceToResetFormWithFakeTimers();

    const resend = () => screen.getByRole('button', { name: /resend code/i });
    expect((resend() as HTMLButtonElement).disabled).toBe(true);
    expect(resend().textContent).toContain('(60s)');

    await act(async () => {
      vi.advanceTimersByTime(30_000);
    });
    expect((resend() as HTMLButtonElement).disabled).toBe(true);
    expect(resend().textContent).toContain('(30s)');

    await expireCooldown();
    expect((resend() as HTMLButtonElement).disabled).toBe(false);
    expect(resend().textContent).not.toContain('s)');
    expect(mocks.requestWebPasswordReset).toHaveBeenCalledTimes(1);
  });

  it('resends to the retained email once, restarts the cooldown and shows superseded-OTP feedback', async () => {
    vi.useFakeTimers();
    await advanceToResetFormWithFakeTimers('user@example.com');
    await expireCooldown();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /resend code/i }));
      fireEvent.click(screen.getByRole('button', { name: /resend code/i }));
    });

    // Same request endpoint, same retained (normalized) email.
    expect(mocks.requestWebPasswordReset).toHaveBeenCalledTimes(2);
    expect(mocks.requestWebPasswordReset).toHaveBeenLastCalledWith('user@example.com');

    const resend = screen.getByRole('button', { name: /resend code/i });
    expect((resend as HTMLButtonElement).disabled).toBe(true);
    expect(resend.textContent).toContain('(60s)');

    const notice = screen.getByText(/a new reset code has been sent/i);
    expect(notice.textContent).not.toMatch(/still valid|remains valid/i);
    expect(notice.textContent).toMatch(/no longer valid/i);
  });

  it('handles a 429 resend with safe rate-limit feedback and keeps the cooldown running', async () => {
    vi.useFakeTimers();
    await advanceToResetFormWithFakeTimers();
    await expireCooldown();

    mocks.requestWebPasswordReset.mockRejectedValueOnce({ status: 429 });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /resend code/i }));
    });

    expect(screen.getByText('Too many attempts. Please wait before trying again.')).toBeDefined();
    const resend = screen.getByRole('button', { name: /resend code/i });
    expect((resend as HTMLButtonElement).disabled).toBe(true);
    expect(resend.textContent).toContain('(60s)');
  });

  it('keeps MSG14 users on the reset form with retry and resend available', async () => {
    vi.useFakeTimers();
    await advanceToResetFormWithFakeTimers();
    await expireCooldown();

    mocks.confirmWebPasswordReset.mockRejectedValue({ code: 'MSG14', status: 400 });
    fillResetForm({ code: '999999' });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
    });

    expect(screen.getByText(
      'The verification code is invalid or has expired. Please try again or request a new code.',
    )).toBeDefined();
    expect(screen.getByLabelText('Reset Code')).toBeDefined();
    expect((screen.getByRole('button', { name: /resend code/i }) as HTMLButtonElement).disabled).toBe(false);
    expect((screen.getByRole('button', { name: /reset password/i }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('releases loading on network failure and allows explicit retry without automatic reattempts', async () => {
    vi.useFakeTimers();
    await advanceToResetFormWithFakeTimers();
    await expireCooldown();

    mocks.confirmWebPasswordReset.mockRejectedValue(new TypeError('Failed to fetch'));
    fillResetForm();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
    });

    expect(screen.getByText('Unable to connect to TripMate. Please check your connection and try again.')).toBeDefined();
    expect((screen.getByRole('button', { name: /reset password/i }) as HTMLButtonElement).disabled).toBe(false);

    await act(async () => {
      vi.advanceTimersByTime(180_000);
    });
    expect(mocks.confirmWebPasswordReset).toHaveBeenCalledTimes(1);
  });
});

describe('PasswordRecoveryFlow Backend-invalidated reset state', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('treats exhausted wrong-attempt invalidation as the same safe MSG14 path and allows a new OTP', async () => {
    vi.useFakeTimers();
    mocks.requestWebPasswordReset.mockResolvedValue(REQUEST_SUCCESS);
    render(<PasswordRecoveryFlow />);
    fillEmail('user@example.com');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /send reset code/i }));
    });
    screen.getByLabelText('Reset Code');
    await act(async () => {
      vi.advanceTimersByTime(60_000);
    });

    // The Backend has invalidated the reset state after five wrong codes; it
    // answers with the same MSG14 shape. The FE shows the same safe feedback
    // and keeps retry/resend available so a new OTP can be requested.
    mocks.confirmWebPasswordReset.mockRejectedValue({ code: 'MSG14', status: 400 });
    fillResetForm({ code: '000000' });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
    });

    expect(screen.getByText(
      'The verification code is invalid or has expired. Please try again or request a new code.',
    )).toBeDefined();
    expect(screen.getByLabelText('Reset Code')).toBeDefined();
    expect((screen.getByRole('button', { name: /resend code/i }) as HTMLButtonElement).disabled).toBe(false);
    expect(screen.getByRole('button', { name: /resend code/i }).textContent).not.toMatch(/attempt/i);
  });
});
