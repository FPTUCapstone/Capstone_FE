import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/account/favorites/FavoritePoisPage', () => ({
  FavoritePoisPage: () => <div data-testid="favorite-pois-page">FavoritePoisPage Content</div>,
}));

import AccountFavoritesPage, { metadata } from './page';

describe('/account/favorites Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exposes valid metadata', () => {
    expect(metadata.title).toBe('Địa điểm yêu thích');
    expect(metadata.description).toBeTruthy();
  });

  it('renders FavoritePoisPage', () => {
    render(<AccountFavoritesPage />);
    expect(screen.getByTestId('favorite-pois-page')).toBeTruthy();
  });
});
