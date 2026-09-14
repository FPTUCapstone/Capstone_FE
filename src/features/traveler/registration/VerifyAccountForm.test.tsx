import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { VerifyAccountForm } from './VerifyAccountForm';

const mocks = vi.hoisted(() => ({
  currentUser: null as null | { email: string },
  sendEmailVerification: vi.fn(),
}));

vi.mock('firebase/auth', () => ({ sendEmailVerification: mocks.sendEmailVerification }));
vi.mock('@/lib/firebase', () => ({ auth: mocks }));

describe('VerifyAccountForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.currentUser = null;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('explains that registration succeeded when the first email delivery failed', () => {
    render(<VerifyAccountForm email="traveler@example.com" deliveryFailed />);

    expect(
      screen.getByText(
        'The first verification email could not be delivered. Please request a new link below.',
      ),
    ).toBeDefined();
  });

  it('does not expose an internal resend error', async () => {
    mocks.currentUser = { email: 'traveler@example.com' };
    mocks.sendEmailVerification.mockRejectedValue(new Error('SMTP host smtp-prod-01 failed'));
    render(<VerifyAccountForm email="traveler@example.com" />);

    fireEvent.click(screen.getByRole('button', { name: 'Resend Verification Email' }));

    expect(
      await screen.findByText(
        'Unable to send verification email. Please try again later or sign in.',
      ),
    ).toBeDefined();
    expect(screen.queryByText('SMTP host smtp-prod-01 failed')).toBeNull();
  });

  it('resends through Firebase and starts the production cooldown', async () => {
    mocks.currentUser = { email: 'traveler@example.com' };
    mocks.sendEmailVerification.mockResolvedValue(undefined);
    render(<VerifyAccountForm email="traveler@example.com" deliveryFailed />);

    fireEvent.click(screen.getByRole('button', { name: 'Resend Verification Email' }));

    expect(
      await screen.findByText('A fresh verification link has been sent to your email address.'),
    ).toBeDefined();
    expect(mocks.sendEmailVerification).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Resend Email (60s)' }).hasAttribute('disabled')).toBe(
      true,
    );
  });

  it('blocks a second resend while the first request is still loading', async () => {
    let finishSending: (() => void) | undefined;
    mocks.currentUser = { email: 'traveler@example.com' };
    mocks.sendEmailVerification.mockReturnValue(
      new Promise<void>((resolve) => {
        finishSending = resolve;
      }),
    );
    render(<VerifyAccountForm email="traveler@example.com" />);

    const resendButton = screen.getByRole('button', { name: 'Resend Verification Email' });
    fireEvent.click(resendButton);
    fireEvent.click(resendButton);

    expect(mocks.sendEmailVerification).toHaveBeenCalledOnce();
    expect(resendButton.hasAttribute('disabled')).toBe(true);
    expect(resendButton.getAttribute('aria-busy')).toBe('true');

    await act(async () => finishSending?.());
  });

  it('shows a safe rate-limit error and starts cooldown', async () => {
    mocks.currentUser = { email: 'traveler@example.com' };
    mocks.sendEmailVerification.mockRejectedValue({
      code: 'auth/too-many-requests',
      message: 'Firebase: Error (auth/too-many-requests).',
    });
    render(<VerifyAccountForm email="traveler@example.com" />);

    fireEvent.click(screen.getByRole('button', { name: 'Resend Verification Email' }));

    expect(
      await screen.findByText(
        'Too many resend attempts. Please wait a few minutes before trying again.',
      ),
    ).toBeDefined();
    expect(screen.queryByText(/Firebase: Error/)).toBeNull();
    expect(screen.getByRole('button', { name: 'Resend Email (60s)' }).hasAttribute('disabled')).toBe(
      true,
    );
  });

  it('allows retry after the production cooldown expires', async () => {
    vi.useFakeTimers();
    mocks.currentUser = { email: 'traveler@example.com' };
    mocks.sendEmailVerification.mockResolvedValue(undefined);
    render(<VerifyAccountForm email="traveler@example.com" />);

    fireEvent.click(screen.getByRole('button', { name: 'Resend Verification Email' }));
    await act(async () => undefined);

    act(() => vi.advanceTimersByTime(60_000));
    const retryButton = screen.getByRole('button', { name: 'Resend Verification Email' });
    expect(retryButton.hasAttribute('disabled')).toBe(false);

    fireEvent.click(retryButton);
    await act(async () => undefined);
    expect(mocks.sendEmailVerification).toHaveBeenCalledTimes(2);
  });
});
