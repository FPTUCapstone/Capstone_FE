import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AccountWorkspaceContext } from '@/features/account/common/AccountWorkspaceContext';
import * as useWebSessionModule from '@/features/auth/session/useWebSession';
import {
  listFavoritePois,
  PoiFavoriteError,
  setPoiFavorite,
  type FavoritePoiItem,
  type PagedFavoritePois,
} from '@/features/public/pois/services/poiFavoriteApi';
import { FavoritePoisPage } from '../FavoritePoisPage';

const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

vi.mock('@/features/public/pois/services/poiFavoriteApi', async () => {
  const actual = await vi.importActual<typeof import('@/features/public/pois/services/poiFavoriteApi')>(
    '@/features/public/pois/services/poiFavoriteApi',
  );
  return {
    ...actual,
    listFavoritePois: vi.fn(),
    setPoiFavorite: vi.fn(),
  };
});

function makeItem(overrides: Partial<FavoritePoiItem> = {}): FavoritePoiItem {
  return {
    id: 101,
    name: 'Bà Nà Hills',
    categoryId: 1,
    categoryName: 'Tham quan',
    latitude: 15.9977,
    longitude: 107.9881,
    address: 'An Sơn, Hòa Ninh, Hòa Vang, Đà Nẵng',
    indoorOutdoor: 'Outdoor',
    averageVisitDurationMinutes: 240,
    hasShelter: true,
    averageRating: 4.7,
    reviewCount: 42,
    thumbnailUrl: 'https://cdn.tripmate.vn/bana.jpg',
    isOpenNow: true,
    favoritedAtUtc: '2026-11-26T04:00:00Z',
    ...overrides,
  };
}

function makePage(items: FavoritePoiItem[], overrides: Partial<PagedFavoritePois> = {}): PagedFavoritePois {
  return {
    page: 1,
    pageSize: 12,
    totalCount: items.length,
    totalPages: items.length > 0 ? 1 : 0,
    items,
    ...overrides,
  };
}

function mockTravelerSession() {
  vi.spyOn(useWebSessionModule, 'useWebSession').mockReturnValue({
    status: 'authenticated',
    context: {
      userId: 10,
      email: 'traveler@tripmate.vn',
      fullName: 'Nguyễn Du Khách',
      role: 'Traveler',
      status: 'Active',
      applicationStatus: null,
      applicationUnresolved: false,
      accessToken: 'traveler-token',
      accessTokenExpiresAtUtc: '2099-01-01T00:00:00Z',
    },
  });
}

function renderInsideShell() {
  return render(
    <AccountWorkspaceContext.Provider value={{ isInsideShell: true, activeTab: 'favorites' }}>
      <FavoritePoisPage />
    </AccountWorkspaceContext.Provider>,
  );
}

describe('FavoritePoisPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTravelerSession();
  });

  it('shows loading status then renders favorite POI cards with detail links', async () => {
    vi.mocked(listFavoritePois).mockResolvedValueOnce(
      makePage([
        makeItem(),
        makeItem({
          id: 202,
          name: 'Phố cổ Hội An',
          categoryName: 'Di sản',
          address: null,
          averageRating: null,
          reviewCount: 0,
          isOpenNow: false,
          hasShelter: false,
          indoorOutdoor: 'Mixed',
        }),
      ]),
    );

    renderInsideShell();

    expect(screen.getByRole('status', { name: /đang tải danh sách địa điểm yêu thích/i })).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText('Bà Nà Hills')).toBeDefined();
    });

    expect(screen.getByText('2 địa điểm đã lưu')).toBeDefined();
    expect(screen.getByText('Phố cổ Hội An')).toBeDefined();
    expect(screen.getByText('Địa chỉ đang được cập nhật')).toBeDefined();
    expect(screen.getByText('4.7')).toBeDefined();
    expect(screen.getByText('42 lượt đánh giá')).toBeDefined();
    expect(screen.getByText('Chưa có đánh giá')).toBeDefined();
    expect(screen.getAllByText('Đã lưu 26/11/2026').length).toBe(2);

    const detailLinks = screen.getAllByRole('link', { name: /Xem chi tiết/i });
    expect(detailLinks[0].getAttribute('href')).toBe('/pois/101');
    expect(detailLinks[1].getAttribute('href')).toBe('/pois/202');
  });

  it('renders empty state with explore CTA when traveler has no favorites', async () => {
    vi.mocked(listFavoritePois).mockResolvedValueOnce(makePage([]));

    renderInsideShell();

    await waitFor(() => {
      expect(screen.getByText(/Bạn chưa lưu địa điểm yêu thích nào/i)).toBeDefined();
    });

    const exploreLinks = screen.getAllByRole('link', { name: /Khám phá địa điểm/i });
    expect(exploreLinks.some((link) => link.getAttribute('href') === '/pois')).toBe(true);
  });

  it('shows error state and retries loading when user clicks Thử lại', async () => {
    vi.mocked(listFavoritePois)
      .mockRejectedValueOnce(new PoiFavoriteError('Máy chủ gián đoạn', 500))
      .mockResolvedValueOnce(makePage([makeItem()]));

    renderInsideShell();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeDefined();
    });
    expect(screen.getByText(/Máy chủ gián đoạn/i)).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /Thử lại/i }));

    await waitFor(() => {
      expect(screen.getByText('Bà Nà Hills')).toBeDefined();
    });
    expect(listFavoritePois).toHaveBeenCalledTimes(2);
  });

  it('removes a favorite directly and refreshes the list', async () => {
    vi.mocked(listFavoritePois)
      .mockResolvedValueOnce(
        makePage([
          makeItem({ id: 101, name: 'Bà Nà Hills' }),
          makeItem({ id: 202, name: 'Cầu Rồng' }),
        ]),
      )
      .mockResolvedValueOnce(makePage([makeItem({ id: 202, name: 'Cầu Rồng' })]));
    vi.mocked(setPoiFavorite).mockResolvedValueOnce({ poiId: 101, isFavorite: false });

    renderInsideShell();

    await waitFor(() => {
      expect(screen.getByText('Bà Nà Hills')).toBeDefined();
    });

    fireEvent.click(screen.getByRole('button', { name: /Bỏ yêu thích Bà Nà Hills/i }));

    await waitFor(() => {
      expect(setPoiFavorite).toHaveBeenCalledWith(101, false);
    });
    await waitFor(() => {
      expect(screen.queryByText('Bà Nà Hills')).toBeNull();
    });
    expect(screen.getByText('Cầu Rồng')).toBeDefined();
    expect(screen.getByText('1 địa điểm đã lưu')).toBeDefined();
  });

  it('keeps the card and shows an alert when unfavorite fails', async () => {
    vi.mocked(listFavoritePois).mockResolvedValueOnce(makePage([makeItem()]));
    vi.mocked(setPoiFavorite).mockRejectedValueOnce(new PoiFavoriteError('Lỗi mạng', 0));

    renderInsideShell();

    await waitFor(() => {
      expect(screen.getByText('Bà Nà Hills')).toBeDefined();
    });

    fireEvent.click(screen.getByRole('button', { name: /Bỏ yêu thích Bà Nà Hills/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeDefined();
    });
    expect(screen.getByText('Bà Nà Hills')).toBeDefined();
  });

  it('supports pagination and steps back to the previous page when removing the last item on page 2', async () => {
    vi.mocked(listFavoritePois)
      .mockResolvedValueOnce(
        makePage([makeItem({ id: 1, name: 'Trang 1 POI' })], {
          page: 1,
          pageSize: 1,
          totalCount: 2,
          totalPages: 2,
        }),
      )
      .mockResolvedValueOnce(
        makePage([makeItem({ id: 2, name: 'Trang 2 POI' })], {
          page: 2,
          pageSize: 1,
          totalCount: 2,
          totalPages: 2,
        }),
      )
      .mockResolvedValueOnce(
        makePage([makeItem({ id: 1, name: 'Trang 1 POI' })], {
          page: 1,
          pageSize: 1,
          totalCount: 1,
          totalPages: 1,
        }),
      );
    vi.mocked(setPoiFavorite).mockResolvedValueOnce({ poiId: 2, isFavorite: false });

    renderInsideShell();

    await waitFor(() => {
      expect(screen.getByText('Trang 1 POI')).toBeDefined();
    });

    fireEvent.click(screen.getByRole('button', { name: '2' }));

    await waitFor(() => {
      expect(screen.getByText('Trang 2 POI')).toBeDefined();
    });
    expect(listFavoritePois).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));

    fireEvent.click(screen.getByRole('button', { name: /Bỏ yêu thích Trang 2 POI/i }));

    await waitFor(() => {
      expect(screen.getByText('Trang 1 POI')).toBeDefined();
    });
    expect(listFavoritePois).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 }));
  });

  it('redirects unauthenticated users to sign-in with returnUrl', () => {
    vi.spyOn(useWebSessionModule, 'useWebSession').mockReturnValue({
      status: 'unauthenticated',
      context: null,
    });

    render(<FavoritePoisPage />);

    expect(mockReplace).toHaveBeenCalledWith('/sign-in?returnUrl=%2Faccount%2Ffavorites');
  });

  it('redirects to sign-in when the favorites API responds with 401', async () => {
    vi.mocked(listFavoritePois).mockRejectedValueOnce(new PoiFavoriteError('Unauthorized', 401));

    renderInsideShell();

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/sign-in?returnUrl=%2Faccount%2Ffavorites');
    });
  });
});
