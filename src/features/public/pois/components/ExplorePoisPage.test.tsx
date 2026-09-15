import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ExplorePoisPage } from './ExplorePoisPage';

const push = vi.fn();
const replace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/components/navigation/PublicNavigation', () => ({
  PublicNavigation: () => <div data-testid="public-navigation" />,
}));

vi.mock('../services/poiApi', () => ({
  fetchPois: vi.fn().mockResolvedValue({
    page: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 0,
    items: [],
  }),
}));

describe('ExplorePoisPage', () => {
  beforeEach(() => {
    push.mockClear();
    replace.mockClear();
  });

  it('submits search only after the form is submitted', async () => {
    render(<ExplorePoisPage />);
    await screen.findByText('Không tìm thấy địa điểm phù hợp');

    fireEvent.change(screen.getByLabelText('Tìm kiếm địa điểm'), {
      target: { value: 'Sơn Trà' },
    });
    expect(push).not.toHaveBeenCalled();

    fireEvent.submit(screen.getByRole('search'));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/pois?search=S%C6%A1n+Tr%C3%A0'));
  });

  it('provides an actionable reset for empty results', async () => {
    render(<ExplorePoisPage />);
    expect(await screen.findByRole('button', { name: 'Đặt lại tìm kiếm và bộ lọc' })).toBeTruthy();
  });
});
