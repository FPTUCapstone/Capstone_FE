import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { isDevTourSearchEnabled } from '@/features/public/tours/services/devTourProxy';
import ToursPage from './page';

vi.mock('@/components/navigation/PageTransition', () => ({
  PageTransition: ({ children }: { children: ReactNode }) => <div data-testid="page-transition">{children}</div>,
}));
vi.mock('@/features/public/tours/services/devTourProxy', () => ({ isDevTourSearchEnabled: vi.fn() }));
vi.mock('@/features/public/tours/components/ExploreToursPage', () => ({
  ExploreToursPage: ({ devSearchEnabled = false }: { devSearchEnabled?: boolean }) => <p>{devSearchEnabled ? 'Gated V2 search' : 'Legacy search'}</p>,
}));

describe('integrated tour search route', () => {
  beforeEach(() => vi.resetAllMocks());

  it('keeps the public transition wrapper and the default legacy path', () => {
    vi.mocked(isDevTourSearchEnabled).mockReturnValue(false);
    render(<ToursPage />);
    expect(screen.getByTestId('page-transition').textContent).toBe('Legacy search');
    expect(screen.queryByText('Gated V2 search')).toBeNull();
  });

  it('passes the server-side dev access decision through the transition wrapper', () => {
    vi.mocked(isDevTourSearchEnabled).mockReturnValue(true);
    render(<ToursPage />);
    expect(screen.getByTestId('page-transition').textContent).toBe('Gated V2 search');
  });
});
