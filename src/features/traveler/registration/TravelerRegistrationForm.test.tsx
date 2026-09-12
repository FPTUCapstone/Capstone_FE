import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TravelerRegistrationForm } from './TravelerRegistrationForm';

const authMocks = vi.hoisted(() => ({
  createUserWithEmailAndPassword: vi.fn(),
  sendEmailVerification: vi.fn(),
  signInWithPopup: vi.fn(),
}));

const apiMocks = vi.hoisted(() => ({
  googleAuth: vi.fn(),
  registerTraveler: vi.fn(),
  saveTokens: vi.fn(),
}));

const routerMocks = vi.hoisted(() => ({ push: vi.fn() }));

const firebaseUserMocks = vi.hoisted(() => ({
  delete: vi.fn(),
  getIdToken: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: authMocks.createUserWithEmailAndPassword,
  GoogleAuthProvider: class GoogleAuthProvider {},
  sendEmailVerification: authMocks.sendEmailVerification,
  signInWithPopup: authMocks.signInWithPopup,
}));

vi.mock('@/lib/firebase', () => ({ auth: {} }));
vi.mock('@/lib/authApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/authApi')>()),
  ...apiMocks,
}));
vi.mock('next/navigation', () => ({ useRouter: () => routerMocks }));

describe('TravelerRegistrationForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    firebaseUserMocks.delete.mockResolvedValue(undefined);
    firebaseUserMocks.getIdToken.mockResolvedValue('firebase-token');
    authMocks.createUserWithEmailAndPassword.mockResolvedValue({ user: firebaseUserMocks });
    authMocks.sendEmailVerification.mockResolvedValue(undefined);
    apiMocks.registerTraveler.mockResolvedValue({ userId: 1 });
  });

  function completeForm(
    fullName: string,
    options: {
      email?: string;
      password?: string;
      confirmPassword?: string;
      phone?: string;
    } = {},
  ) {
    const password = options.password ?? 'Password1!';
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: fullName } });
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: options.email ?? 'traveler@example.com' },
    });
    if (options.phone !== undefined) {
      fireEvent.change(screen.getByLabelText('Phone number'), { target: { value: options.phone } });
    }
    fireEvent.change(screen.getByPlaceholderText('At least 8 characters'), {
      target: { value: password },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: options.confirmPassword ?? password },
    });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));
  }

  it('keeps Register disabled until the traveler accepts the terms', () => {
    render(<TravelerRegistrationForm />);

    const registerButton = screen.getByRole('button', { name: 'Register' });
    expect(registerButton.hasAttribute('disabled')).toBe(true);

    fireEvent.click(screen.getByRole('checkbox'));

    expect(registerButton.hasAttribute('disabled')).toBe(false);
  });

  it('disables the form action while registration is loading', async () => {
    authMocks.createUserWithEmailAndPassword.mockReturnValue(new Promise(() => undefined));
    render(<TravelerRegistrationForm />);

    completeForm('Traveler Name');

    await waitFor(() => {
      const registerButton = screen.getByRole('button', { name: 'Register' });
      expect(registerButton.hasAttribute('disabled')).toBe(true);
      expect(registerButton.getAttribute('aria-busy')).toBe('true');
    });
  });

  it.each([149, 150])('accepts a valid full name containing %i characters', async (length) => {
    render(<TravelerRegistrationForm />);

    const fullNameInput = screen.getByLabelText('Full name');
    expect(fullNameInput.getAttribute('maxlength')).toBe('150');
    completeForm('A'.repeat(length));

    await waitFor(() => {
      expect(authMocks.createUserWithEmailAndPassword).toHaveBeenCalledOnce();
    });
  });

  it('rejects a full name containing 151 characters', async () => {
    render(<TravelerRegistrationForm />);

    completeForm('A'.repeat(151));

    expect(await screen.findByText('Full name must not exceed 150 characters.')).toBeDefined();
    expect(authMocks.createUserWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it('accepts a Vietnamese full name with diacritics', async () => {
    render(<TravelerRegistrationForm />);

    completeForm('Nguyễn Ánh');

    await waitFor(() => {
      expect(authMocks.createUserWithEmailAndPassword).toHaveBeenCalledOnce();
    });
  });

  it.each(['Traveler\tName', 'Traveler-Name'])(
    'rejects a full name containing unsupported characters: %s',
    async (fullName) => {
      render(<TravelerRegistrationForm />);

      completeForm(fullName);

      await waitFor(() => {
        expect(authMocks.createUserWithEmailAndPassword).not.toHaveBeenCalled();
      });
    },
  );

  it('accepts a .co email and sends the agreed registration payload', async () => {
    render(<TravelerRegistrationForm />);

    completeForm('Traveler Name', { email: 'bathinh2k4@gmail.co' });

    await waitFor(() => {
      expect(apiMocks.registerTraveler).toHaveBeenCalledOnce();
    });
    expect(apiMocks.registerTraveler).toHaveBeenCalledWith(
      {
        email: 'bathinh2k4@gmail.co',
        password: 'Password1!',
        fullName: 'Traveler Name',
        phoneNumber: undefined,
        acceptedTerms: true,
      },
      'firebase-token',
    );
    expect(apiMocks.registerTraveler.mock.calls[0][0]).not.toHaveProperty('confirmPassword');
  });

  it('accepts a password of 72 characters', async () => {
    render(<TravelerRegistrationForm />);

    completeForm('Traveler Name', { password: `Aa1!${'a'.repeat(68)}` });

    await waitFor(() => {
      expect(authMocks.createUserWithEmailAndPassword).toHaveBeenCalledOnce();
    });
  });

  it('rejects a password of 73 characters', async () => {
    render(<TravelerRegistrationForm />);

    completeForm('Traveler Name', { password: `Aa1!${'a'.repeat(69)}` });

    expect(await screen.findByText('Password must not exceed 72 characters.')).toBeDefined();
    expect(authMocks.createUserWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it('rejects a mismatched confirm password before Firebase registration', async () => {
    render(<TravelerRegistrationForm />);

    completeForm('Traveler Name', { confirmPassword: 'Different1!' });

    expect(await screen.findByText('Passwords do not match. Please re-enter.')).toBeDefined();
    expect(authMocks.createUserWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it('accepts a valid phone number and includes its normalized value in the payload', async () => {
    render(<TravelerRegistrationForm />);

    fireEvent.change(screen.getByPlaceholderText('0905 123 456'), {
      target: { value: '0912 345 678' },
    });
    completeForm('Traveler Name');

    await waitFor(() => {
      expect(apiMocks.registerTraveler).toHaveBeenCalledOnce();
    });
    expect(apiMocks.registerTraveler.mock.calls[0][0].phoneNumber).toBe('0912345678');
  });

  it('rejects an invalid phone number before Firebase registration', async () => {
    render(<TravelerRegistrationForm />);

    fireEvent.change(screen.getByPlaceholderText('0905 123 456'), {
      target: { value: '091234567' },
    });
    completeForm('Traveler Name');

    await waitFor(() => {
      expect(authMocks.createUserWithEmailAndPassword).not.toHaveBeenCalled();
    });
  });

  it('keeps the registered accounts recoverable when the first verification email fails', async () => {
    authMocks.sendEmailVerification.mockRejectedValue({
      code: 'auth/network-request-failed',
      message: 'Firebase: Error (auth/network-request-failed).',
    });
    render(<TravelerRegistrationForm />);

    completeForm('Traveler Name');

    await waitFor(() => {
      expect(apiMocks.registerTraveler).toHaveBeenCalledOnce();
      expect(authMocks.sendEmailVerification).toHaveBeenCalledOnce();
      expect(firebaseUserMocks.delete).not.toHaveBeenCalled();
      expect(routerMocks.push).toHaveBeenCalledWith(
        '/verify-account?email=traveler%40example.com&delivery=failed',
      );
    });
  });

  it('deletes the new Firebase user when Backend definitively rejects registration', async () => {
    apiMocks.registerTraveler.mockRejectedValue({
      code: 'MSG03',
      message: 'internal duplicate detail',
      status: 409,
    });
    render(<TravelerRegistrationForm />);

    completeForm('Traveler Name');

    await waitFor(() => {
      expect(firebaseUserMocks.delete).toHaveBeenCalledOnce();
      expect(authMocks.sendEmailVerification).not.toHaveBeenCalled();
    });
    expect(
      screen.getByText(
        'An account with this email already exists. Please sign in or use another email.',
      ),
    ).toBeDefined();
  });

  it('deletes the new Firebase user when token acquisition fails before Backend is called', async () => {
    firebaseUserMocks.getIdToken.mockRejectedValue(new Error('token acquisition failed'));
    render(<TravelerRegistrationForm />);

    completeForm('Traveler Name');

    await waitFor(() => {
      expect(firebaseUserMocks.delete).toHaveBeenCalledOnce();
    });
    expect(apiMocks.registerTraveler).not.toHaveBeenCalled();
    expect(await screen.findByText('Registration failed. Please try again.')).toBeDefined();
    expect(screen.queryByText('token acquisition failed')).toBeNull();
  });

  it('preserves the Firebase user when Backend commit outcome is unknown', async () => {
    apiMocks.registerTraveler.mockRejectedValue(new TypeError('Failed to fetch internal endpoint'));
    render(<TravelerRegistrationForm />);

    completeForm('Traveler Name');

    expect(await screen.findByText('Registration failed. Please try again.')).toBeDefined();
    expect(firebaseUserMocks.delete).not.toHaveBeenCalled();
    expect(screen.queryByText('Failed to fetch internal endpoint')).toBeNull();
  });

  it('preserves the Firebase user after a Backend 5xx with an ambiguous commit outcome', async () => {
    apiMocks.registerTraveler.mockRejectedValue({
      code: 'MSG127',
      message: 'database connection closed after commit',
      status: 500,
    });
    render(<TravelerRegistrationForm />);

    completeForm('Traveler Name');

    expect(await screen.findByText('Something went wrong. Please try again later.')).toBeDefined();
    expect(firebaseUserMocks.delete).not.toHaveBeenCalled();
    expect(screen.queryByText('database connection closed after commit')).toBeNull();
  });

  it('maps a Backend duplicate-account error during Google registration', async () => {
    authMocks.signInWithPopup.mockResolvedValue({
      user: {
        displayName: 'Traveler',
        email: 'traveler@example.com',
        getIdToken: vi.fn().mockResolvedValue('google-token'),
      },
    });
    apiMocks.googleAuth.mockRejectedValue({
      code: 'MSG03',
      message: 'internal duplicate detail',
      status: 409,
    });
    render(<TravelerRegistrationForm />);

    fireEvent.click(screen.getByRole('button', { name: 'Continue with Google' }));

    expect(
      await screen.findByText(
        'An account with this email already exists. Please sign in or use another email.',
      ),
    ).toBeDefined();
    expect(screen.queryByText('internal duplicate detail')).toBeNull();
  });

  it('does not expose an unknown Firebase registration error', async () => {
    authMocks.createUserWithEmailAndPassword.mockRejectedValue(
      Object.assign(new Error('Firebase internal implementation detail'), {
        code: 'auth/internal-error',
      }),
    );
    render(<TravelerRegistrationForm />);

    completeForm('Traveler Name');

    expect(await screen.findByText('Registration failed. Please try again.')).toBeDefined();
    expect(screen.queryByText('Firebase internal implementation detail')).toBeNull();
  });
});
