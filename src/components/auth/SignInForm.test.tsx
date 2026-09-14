import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SignInForm } from './SignInForm';

const mocks = vi.hoisted(() => ({
  popup: vi.fn(), googleAuth: vi.fn(), saveTokens: vi.fn(), push: vi.fn(),
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock('@/lib/firebase', () => ({ auth: {} }));
vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: class GoogleAuthProvider {},
  signInWithPopup: mocks.popup,
  signInWithEmailAndPassword: vi.fn(), sendEmailVerification: vi.fn(),
}));
vi.mock('@/lib/authApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/authApi')>()),
  googleAuth: mocks.googleAuth, saveTokens: mocks.saveTokens,
}));

describe('SignInForm Google access', () => {
  beforeEach(() => vi.clearAllMocks());

  it('does not offer Google in the administrator login', () => {
    render(<SignInForm admin />);
    expect(screen.queryByRole('button', { name: /continue with google/i })).toBeNull();
    expect(screen.getByLabelText('Email address')).toBeDefined();
    expect(screen.getByLabelText('Password')).toBeDefined();
    expect(mocks.popup).not.toHaveBeenCalled();
  });

  it('shows a useful message when public Google sign-in rejects an administrator', async () => {
    mocks.popup.mockResolvedValue({ user: { getIdToken: vi.fn().mockResolvedValue('firebase-token') } });
    mocks.googleAuth.mockRejectedValue({
      code: 'auth.admin_google_sign_in_disabled', status: 403, message: 'internal detail',
    });
    render(<SignInForm />);
    fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));

    await waitFor(() => expect(screen.getByText(
      'Administrator accounts must sign in with email and password.',
    )).toBeDefined());
    expect(screen.queryByText('internal detail')).toBeNull();
    expect(mocks.saveTokens).not.toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
  });
});
