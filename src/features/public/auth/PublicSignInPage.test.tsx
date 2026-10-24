import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock('@/lib/firebase', () => ({ getFirebaseAuth: () => ({}) }));

vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: class GoogleAuthProvider {},
  signInWithPopup: vi.fn(),
}));

import { PublicSignInPage } from './PublicSignInPage';

describe('PublicSignInPage production composition', () => {
  it('owns the current Vietnamese sign-in presentation without the retired OTP layout', () => {
    render(<PublicSignInPage />);

    expect(screen.getByRole('heading', { name: 'Đăng nhập' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Tiếp tục với Google' })).toBeDefined();
    expect(screen.getByText(/Bằng việc đăng nhập, bạn đã đồng ý với các điều khoản của TripMate/)).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Phone / OTP' })).toBeNull();
  });
});
