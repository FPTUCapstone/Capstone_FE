import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PoiApiError } from '../types/poi';
import { fetchPois } from '../services/poiApi';
import { ExplorePoisPage } from './ExplorePoisPage';

const push = vi.fn();
const replace = vi.fn();
let currentSearch = '';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace }),
  useSearchParams: () => new URLSearchParams(currentSearch),
}));

vi.mock('@/components/navigation/PublicNavigation', () => ({
  PublicNavigation: () => <div data-testid="public-navigation" />,
}));

vi.mock('../services/poiApi', () => ({
  fetchPois: vi.fn(),
}));

const mockData = {
  page: 1,
  pageSize: 20,
  totalCount: 2,
  totalPages: 1,
  items: [
    {
      id: 1,
      name: 'Bãi biển Mỹ Khê',
      categoryId: 2,
      categoryName: 'Biển & Đảo',
      latitude: 16.0597,
      longitude: 108.2435,
      address: 'Đường Võ Nguyên Giáp, Đà Nẵng',
      indoorOutdoor: 'Outdoor' as const,
      averageVisitDurationMinutes: 120,
      hasShelter: false,
      averageRating: 4.7,
      reviewCount: 320,
      thumbnailUrl: 'https://example.com/mykhe.jpg',
      distanceKm: 2.5,
      isOpenNow: true,
    },
    {
      id: 2,
      name: 'Chùa Linh Ứng',
      categoryId: 1,
      categoryName: 'Tâm linh & Tôn giáo',
      latitude: 16.1005,
      longitude: 108.2778,
      address: 'Bán đảo Sơn Trà, Đà Nẵng',
      indoorOutdoor: 'Mixed' as const,
      averageVisitDurationMinutes: 90,
      hasShelter: true,
      averageRating: 4.8,
      reviewCount: 540,
      thumbnailUrl: null,
      distanceKm: 8.1,
      isOpenNow: false,
    },
  ],
};

describe('ExplorePoisPage', () => {
  beforeEach(() => {
    push.mockClear();
    replace.mockClear();
    currentSearch = '';
    vi.mocked(fetchPois).mockReset();
    vi.mocked(fetchPois).mockResolvedValue(mockData);
  });

  it('renders loaded POI items and displays result count', async () => {
    render(<ExplorePoisPage />);
    expect((await screen.findAllByText('Bãi biển Mỹ Khê')).length).toBeGreaterThan(0);
    expect(screen.getByText('Chùa Linh Ứng')).toBeTruthy();
    expect(screen.getByText('1–2 trong 2 địa điểm')).toBeTruthy();
    expect(screen.getAllByText('● Đang mở cửa').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('○ Đã đóng').length).toBeGreaterThanOrEqual(1);
  });

  it('submits search only after the form is submitted', async () => {
    render(<ExplorePoisPage />);
    await screen.findAllByText('Bãi biển Mỹ Khê');

    fireEvent.change(screen.getByLabelText('Tìm kiếm địa điểm'), {
      target: { value: 'Sơn Trà' },
    });
    expect(push).not.toHaveBeenCalled();

    fireEvent.submit(screen.getByRole('search'));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/pois?search=S%C6%A1n+Tr%C3%A0'));
  });

  it('does not navigate or enter loading when submitting the active search query', async () => {
    currentSearch = 'search=S%C6%A1n+Tr%C3%A0';
    render(<ExplorePoisPage />);
    await screen.findAllByText('Bãi biển Mỹ Khê');

    fireEvent.submit(screen.getByRole('search'));

    expect(push).not.toHaveBeenCalled();
    expect(screen.queryByText('Đang cập nhật…')).toBeNull();
  });

  it('does not navigate or enter loading when selecting the active all-categories filter', async () => {
    render(<ExplorePoisPage />);
    await screen.findAllByText('Bãi biển Mỹ Khê');

    fireEvent.click(screen.getByRole('button', { name: 'Tất cả' }));

    expect(push).not.toHaveBeenCalled();
    expect(screen.queryByText('Đang cập nhật…')).toBeNull();
  });

  it('does not navigate or enter loading when resetting already-default filters', async () => {
    vi.mocked(fetchPois).mockResolvedValue({
      page: 1,
      pageSize: 20,
      totalCount: 0,
      totalPages: 0,
      items: [],
    });

    render(<ExplorePoisPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Đặt lại tìm kiếm và bộ lọc' }));

    expect(push).not.toHaveBeenCalled();
    expect(screen.queryByText('Đang cập nhật…')).toBeNull();
  });

  it('shows loading for a changed query and clears it after the new request completes', async () => {
    let resolveNext: (value: typeof mockData) => void = () => undefined;
    vi.mocked(fetchPois)
      .mockResolvedValueOnce(mockData)
      .mockImplementationOnce(() => new Promise((resolve) => { resolveNext = resolve; }));
    const view = render(<ExplorePoisPage />);
    await screen.findAllByText('Bãi biển Mỹ Khê');

    fireEvent.change(screen.getByLabelText('Tìm kiếm địa điểm'), { target: { value: 'Sơn Trà' } });
    fireEvent.submit(screen.getByRole('search'));
    expect(screen.getByText('Đang cập nhật…')).toBeTruthy();

    currentSearch = 'search=S%C6%A1n+Tr%C3%A0';
    view.rerender(<ExplorePoisPage />);
    resolveNext(mockData);

    await waitFor(() => expect(screen.queryByText('Đang cập nhật…')).toBeNull());
  });

  it('shows client validation error when search exceeds 200 characters', async () => {
    render(<ExplorePoisPage />);
    await screen.findAllByText('Bãi biển Mỹ Khê');

    const longSearch = 'a'.repeat(201);
    fireEvent.change(screen.getByLabelText('Tìm kiếm địa điểm'), {
      target: { value: longSearch },
    });
    fireEvent.submit(screen.getByRole('search'));

    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toContain('Từ khóa tìm kiếm không được vượt quá 200 ký tự.');
  });

  it('updates sort when changing the sort dropdown', async () => {
    render(<ExplorePoisPage />);
    await screen.findAllByText('Bãi biển Mỹ Khê');

    const sortSelect = screen.getByLabelText('Sắp xếp địa điểm');
    fireEvent.change(sortSelect, { target: { value: 'rating' } });

    await waitFor(() => expect(push).toHaveBeenCalledWith('/pois?sort=rating'));
  });

  it('toggles openNow filter when clicking the openNow button', async () => {
    render(<ExplorePoisPage />);
    await screen.findAllByText('Bãi biển Mỹ Khê');

    const openNowBtn = screen.getByRole('button', { name: /Lọc đang mở cửa/i });
    fireEvent.click(openNowBtn);

    await waitFor(() => expect(push).toHaveBeenCalledWith('/pois?openNow=true'));
  });

  it('handles pagination navigation', async () => {
    vi.mocked(fetchPois).mockResolvedValue({
      page: 1,
      pageSize: 20,
      totalCount: 45,
      totalPages: 3,
      items: mockData.items,
    });

    render(<ExplorePoisPage />);
    await screen.findAllByText('Bãi biển Mỹ Khê');

    const nextBtn = screen.getAllByRole('button', { name: 'Sau' })[0];
    fireEvent.click(nextBtn);

    await waitFor(() => expect(push).toHaveBeenCalledWith('/pois?page=2'));
  });

  it('switches between list and map view modes', async () => {
    render(<ExplorePoisPage />);
    await screen.findAllByText('Bãi biển Mỹ Khê');

    const mapBtn = screen.getByRole('button', { name: '⌖ Bản đồ' });
    fireEvent.click(mapBtn);
    expect(mapBtn.getAttribute('aria-pressed')).toBe('true');

    const listBtn = screen.getByRole('button', { name: '☷ Danh sách' });
    fireEvent.click(listBtn);
    expect(listBtn.getAttribute('aria-pressed')).toBe('true');
  });

  it('handles GPS geolocation success and enables distance sort', async () => {
    const mockGeolocation = {
      getCurrentPosition: vi.fn((success) =>
        success({
          coords: { latitude: 16.0544, longitude: 108.2022 },
        }),
      ),
    };
    vi.stubGlobal('navigator', { ...navigator, geolocation: mockGeolocation });

    render(<ExplorePoisPage />);
    await screen.findAllByText('Bãi biển Mỹ Khê');

    const gpsBtn = screen.getByRole('button', { name: 'Bật định vị' });
    fireEvent.click(gpsBtn);

    expect((await screen.findAllByText(/Đã bật vị trí/i)).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('option', { name: 'Gần nhất' })).toBeTruthy();
  });

  it('handles GPS geolocation denied gracefully without breaking browsing', async () => {
    const mockGeolocation = {
      getCurrentPosition: vi.fn((_success, error) =>
        error({ code: 1, message: 'User denied Geolocation' }),
      ),
    };
    vi.stubGlobal('navigator', { ...navigator, geolocation: mockGeolocation });

    render(<ExplorePoisPage />);
    await screen.findAllByText('Bãi biển Mỹ Khê');

    const gpsBtn = screen.getByRole('button', { name: 'Bật định vị' });
    fireEvent.click(gpsBtn);

    expect(await screen.findByText(/Quyền vị trí đang tắt/i)).toBeTruthy();
  });

  it('renders backend validation error alert on 400 Bad Request', async () => {
    vi.mocked(fetchPois).mockRejectedValue(
      new PoiApiError('Bad Request', 400, {
        status: 400,
        title: 'Validation Error',
        errors: { maxDistanceKm: ['Bán kính không hợp lệ mà không có tọa độ.'] },
      }),
    );

    render(<ExplorePoisPage />);
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toContain('Bán kính không hợp lệ mà không có tọa độ.');
  });

  it('renders network error state on connection failure and allows retry', async () => {
    vi.mocked(fetchPois)
      .mockRejectedValueOnce(new Error('Network failure'))
      .mockResolvedValueOnce(mockData);

    render(<ExplorePoisPage />);
    expect(await screen.findByText('Không thể tải danh sách địa điểm')).toBeTruthy();

    const retryBtn = screen.getByRole('button', { name: 'Thử lại kết nối' });
    fireEvent.click(retryBtn);

    expect((await screen.findAllByText('Bãi biển Mỹ Khê')).length).toBeGreaterThan(0);
  });

  it('provides an actionable reset for empty results', async () => {
    currentSearch = 'search=kh%C3%B4ng-c%C3%B3';
    vi.mocked(fetchPois).mockResolvedValue({
      page: 1,
      pageSize: 20,
      totalCount: 0,
      totalPages: 0,
      items: [],
    });

    render(<ExplorePoisPage />);
    const resetBtn = await screen.findByRole('button', { name: 'Đặt lại tìm kiếm và bộ lọc' });
    fireEvent.click(resetBtn);
    expect(push).toHaveBeenCalledWith('/pois');
  });
});
