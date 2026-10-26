import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/account/profile/TravelerProfilePage', () => ({
  TravelerProfilePage: () => <div data-testid="traveler-profile-page">TravelerProfilePage Content</div>,
}));

import AccountProfilePage, { metadata } from './page';

describe('/account/profile Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exposes valid metadata', () => {
    expect(metadata.title).toBe('Hồ sơ cá nhân | TripMate');
    expect(metadata.description).toBeTruthy();
  });

  it('renders TravelerProfilePage', () => {
    render(<AccountProfilePage />);
    expect(screen.getByTestId('traveler-profile-page')).toBeTruthy();
  });
});
