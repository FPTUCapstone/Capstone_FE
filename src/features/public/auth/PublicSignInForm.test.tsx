import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  popup: vi.fn(),
  replace: vi.fn(),
  webGoogleAuth: vi.fn(),
  webLogin: vi.fn(),
  webResendVerification: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));

vi.mock('@/lib/firebase', () => ({ getFirebaseAuth: () => ({}) }));

vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: class GoogleAuthProvider {},
  signInWithPopup: mocks.popup,
}));

vi.mock('@/lib/authApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/authApi')>()),
  webGoogleAuth: mocks.webGoogleAuth,
  webLogin: mocks.webLogin,
  webResendVerification: mocks.webResendVerification,
}));

import { ROUTES } from '@/lib/routes';
import { PublicSignInForm } from './PublicSignInForm';

describe('PublicSignInForm production sign-in route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('associates validation errors with the production sign-in fields', async () => {
    render(<PublicSignInForm />);

    fireEvent.click(screen.getByRole('button', { name: /^Đăng nhập/ }));

    const email = screen.getByLabelText(/^Email/);
    const password = screen.getByLabelText(/^Mật khẩu/);
    const emailError = await screen.findByText('Please enter your email.');
    const passwordError = await screen.findByText('Please enter your password.');

    expect(email.getAttribute('aria-invalid')).toBe('true');
    expect(email.getAttribute('aria-describedby')).toBe(emailError.id);
    expect(password.getAttribute('aria-invalid')).toBe('true');
    expect(password.getAttribute('aria-describedby')).toBe(passwordError.id);
    expect(emailError.getAttribute('role')).toBe('alert');
    expect(passwordError.getAttribute('role')).toBe('alert');
  });

  it('resends verification through the Backend after an unverified sign-in', async () => {
    mocks.webLogin.mockRejectedValue({ code: 'MSG_UNVERIFIED', status: 403 });
    mocks.webResendVerification.mockResolvedValue({ messageCode: 'MSG_RESEND_SUCCESS' });

    render(<PublicSignInForm />);
    fireEvent.change(screen.getByLabelText(/^Email/), {
      target: { value: ' User@Example.com ' },
    });
    fireEvent.change(screen.getByLabelText(/^Mật khẩu/), {
      target: { value: ' unchanged ' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Đăng nhập/ }));

    const resend = await screen.findByRole('button', { name: 'Gửi lại email xác minh' });
    fireEvent.click(resend);

    await waitFor(() => expect(mocks.webResendVerification).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: ' unchanged ',
    }));
    expect(await screen.findByText(
      'A fresh verification link has been sent to your email. Please check your inbox.',
    )).toBeDefined();
  });
});

describe('PublicSignInForm post sign-in destination', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function signInAs(role: string, returnUrl?: string) {
    mocks.webLogin.mockResolvedValue({ role, status: 'Active', applicationStatus: null });
    render(<PublicSignInForm returnUrl={returnUrl} />);
    fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Mật khẩu/), { target: { value: 'secret-pass' } });
    fireEvent.click(screen.getByRole('button', { name: /^Đăng nhập/ }));
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledTimes(1));
    return mocks.replace.mock.calls[0]?.[0];
  }

  it.each([
    ['Administrator', '/admin/audit-logs', '/admin/audit-logs'],
    ['Administrator', 'https://attacker.example/admin', '/admin'],
    ['Administrator', '/admin/login', '/admin'],
    ['Administrator', undefined, '/admin'],
    ['Staff', '/admin/payouts', '/admin/payouts'],
    ['Staff', '/admin/reports', '/admin/staff'],
    ['Staff', undefined, '/admin/staff'],
    ['Traveler', '/admin/audit-logs', ROUTES.home],
  ])('signs %s in and lands on %s as %s', async (role, returnUrl, expected) => {
    expect(await signInAs(role, returnUrl)).toBe(expected);
  });
});
