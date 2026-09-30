import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

vi.mock('@/features/auth/session/useWebSession', () => ({
  useWebSession: () => ({
    status: 'authenticated',
    context: {
      userId: 1,
      email: 'traveler@tripmate.vn',
      fullName: 'Nguyen Van A',
      role: 'Traveler',
      status: 'Active',
      accessToken: 'mock-token',
    },
  }),
}));

vi.mock('@/features/account/preferences/travelPreferencesApi', () => ({
  getTravelPreferences: vi.fn().mockResolvedValue({
    interests: ['culture', 'nature', 'food'],
    travelStyle: 'couple',
    budgetLevel: 'standard',
    preferredTransport: 'motorbike',
    travelPace: 'balanced',
    foodPreference: 'noRestriction',
    autoApplyToPlans: true,
  }),
  updateTravelPreferences: vi.fn(),
  resetTravelPreferences: vi.fn(),
}));

import AccountPreferencesPage, { metadata } from './page';

describe('/account/preferences production route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports appropriate metadata', () => {
    expect(metadata.title).toBe('Sở thích du lịch | TripMate');
  });

  it('renders the travel preferences page for authenticated traveler', async () => {
    render(<AccountPreferencesPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Sở thích du lịch \(UC-09\)/ })).toBeDefined();
    });

    expect(screen.getByRole('tab', { name: /Hồ sơ cá nhân/ })).toBeDefined();
    expect(screen.getByRole('tab', { name: /Sở thích du lịch/ })).toBeDefined();
    expect(screen.getByRole('tab', { name: /Bảo mật & Mật khẩu/ })).toBeDefined();
    expect(screen.getByRole('button', { name: /Lưu sở thích/ })).toBeDefined();
  });
});
