import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  getOptions: vi.fn(),
  getPreferences: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mocks.push,
    replace: mocks.replace,
    back: mocks.back,
  }),
}));

const mockUseWebSession = vi.fn();

vi.mock('@/features/auth/session/useWebSession', () => ({
  useWebSession: () => mockUseWebSession(),
}));

vi.mock('@/features/account/preferences/travelPreferencesApi', () => ({
  getTravelPreferenceOptions: mocks.getOptions,
  getTravelPreferences: mocks.getPreferences,
  updateTravelPreferences: vi.fn(),
}));

import { preferenceMessages } from '@/features/account/preferences/resources/messages';

import AccountPreferencesPage, { metadata } from './page';

const traveler = {
  status: 'authenticated',
  context: {
    userId: 1,
    email: 'traveler@tripmate.vn',
    fullName: 'Nguyen Van A',
    role: 'Traveler',
    status: 'Active',
    accessToken: 'mock-token',
  },
};

const options = {
  interests: [{ key: 'Beach', source: 'Category' }],
  preferredTransportModes: ['Walking', 'Motorbike', 'Car', 'PublicTransit'],
  travelPaces: ['Relaxed', 'Moderate', 'Fast'],
  foodPreferences: ['NoRestriction', 'Vegetarian', 'Vegan', 'Halal', 'NoSeafood'],
  riskTolerances: ['Low', 'Medium', 'High'],
};

const preferences = {
  interests: ['Beach'],
  preferredTransportMode: null,
  travelPace: null,
  riskTolerance: null,
  foodPreferences: [],
  updatedAtUtc: null,
};

describe('/account/preferences production route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseWebSession.mockReturnValue(traveler);
    mocks.getOptions.mockResolvedValue({ ok: true, data: options });
    mocks.getPreferences.mockResolvedValue({ ok: true, data: preferences });
  });

  it('exports appropriate metadata', () => {
    expect(metadata.title).toBe('Sở thích du lịch | TripMate');
  });

  it('loads options and saved preferences from the backend for a Traveler', async () => {
    render(<AccountPreferencesPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Sở thích du lịch' })).toBeDefined();
    });
    expect(screen.getByRole('tab', { name: /Travel Preferences/ })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Bãi biển' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: /Lưu sở thích/ })).toBeDefined();
    expect(mocks.getOptions).toHaveBeenCalledTimes(1);
    expect(mocks.getPreferences).toHaveBeenCalledTimes(1);
  });

  it('shows MSG127 with Retry when loading fails and never renders synthetic data', async () => {
    mocks.getPreferences.mockResolvedValueOnce({ ok: false, kind: 'failure' });
    render(<AccountPreferencesPage />);

    expect(await screen.findByText(preferenceMessages.locked.MSG127)).toBeDefined();
    expect(screen.queryByRole('button', { name: /Lưu sở thích/ })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    await waitFor(() => expect(screen.getByRole('button', { name: /Lưu sở thích/ })).toBeDefined());
  });

  it('shows MSG125 with a sign-in link when the session expired', async () => {
    mocks.getOptions.mockResolvedValueOnce({ ok: false, kind: 'sessionExpired' });
    render(<AccountPreferencesPage />);

    expect(await screen.findByText(preferenceMessages.locked.MSG125)).toBeDefined();
    expect(screen.getByRole('link', { name: 'Đăng nhập lại' }).getAttribute('href')).toBe(
      '/sign-in?returnUrl=%2Faccount%2Fpreferences',
    );
  });

  it('shows MSG126 when the backend forbids access', async () => {
    mocks.getPreferences.mockResolvedValueOnce({ ok: false, kind: 'forbidden' });
    render(<AccountPreferencesPage />);

    expect(await screen.findByText(preferenceMessages.locked.MSG126)).toBeDefined();
  });

  it('redirects unauthenticated user to sign in with returnUrl', () => {
    mockUseWebSession.mockReturnValue({ status: 'unauthenticated', context: null });

    render(<AccountPreferencesPage />);

    expect(mocks.replace).toHaveBeenCalledWith('/sign-in?returnUrl=%2Faccount%2Fpreferences');
    expect(mocks.getOptions).not.toHaveBeenCalled();
  });

  it('redirects TourOperator to partner dashboard without rendering preferences', () => {
    mockUseWebSession.mockReturnValue({
      status: 'authenticated',
      context: { ...traveler.context, userId: 2, role: 'TourOperator' },
    });

    const { container } = render(<AccountPreferencesPage />);

    expect(container.firstChild).toBeNull();
    expect(mocks.replace).toHaveBeenCalledWith('/partner');
    expect(mocks.getOptions).not.toHaveBeenCalled();
  });

  it('redirects Administrator to admin dashboard without rendering preferences', () => {
    mockUseWebSession.mockReturnValue({
      status: 'authenticated',
      context: { ...traveler.context, userId: 3, role: 'Administrator' },
    });

    const { container } = render(<AccountPreferencesPage />);

    expect(container.firstChild).toBeNull();
    expect(mocks.replace).toHaveBeenCalledWith('/admin');
  });
});
