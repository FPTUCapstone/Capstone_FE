import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/lib/firebase', () => ({ getFirebaseAuth: () => ({}) }));

vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: class GoogleAuthProvider {},
  signInWithPopup: vi.fn(),
}));

import { TravelerRegistrationPage } from './TravelerRegistrationPage';

describe('TravelerRegistrationPage production composition', () => {
  it('owns the current registration footer and form presentation', () => {
    render(<TravelerRegistrationPage />);

    expect(screen.getByRole('button', { name: 'Đăng ký' })).toBeDefined();
    expect(screen.getByText(/Bằng việc đăng ký, bạn đã đồng ý với các điều khoản của TripMate/)).toBeDefined();
  });
});
