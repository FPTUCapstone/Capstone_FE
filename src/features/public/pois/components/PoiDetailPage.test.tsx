import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PoiApiError } from '../types/poi';
import { fetchPoiDetail } from '../services/poiApi';
import { PoiDetailPage } from './PoiDetailPage';

const back = vi.fn();
const push = vi.fn();

vi.mock('@/components/navigation/PublicNavigation', () => ({
  PublicNavigation: () => <div data-testid="public-navigation" />,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back, push }),
}));

vi.mock('../services/poiApi', () => ({
  fetchPoiDetail: vi.fn(),
}));

const mockDetail = {
  id: 42,
  name: 'Ngũ Hành Sơn',
  description: 'Quần thể danh thắng nổi tiếng.',
  status: 'Active' as const,
  categoryId: 3,
  categoryName: 'Danh lam & Di sản',
  latitude: 16.00389,
  longitude: 108.26417,
  address: null,
  indoorOutdoor: 'Mixed' as const,
  averageVisitDurationMinutes: 90,
  hasShelter: true,
  scenicScore: null,
  photoRating: null,
  averageRating: 4.8,
  reviewCount: 1420,
  isOpenNow: true,
  openingHours: [
    { dayOfWeek: 0, openTime: null, closeTime: null, isClosed: true },
    { dayOfWeek: 1, openTime: '07:00:00', closeTime: '17:30:00', isClosed: false },
  ],
  photos: [],
  tags: [{ id: 2, name: 'Di tích quốc gia' }],
  createdAtUtc: '2026-09-09T11:20:00Z',
  updatedAtUtc: '2026-09-09T11:20:00Z',
};

describe('PoiDetailPage', () => {
  beforeEach(() => {
    back.mockClear();
    push.mockClear();
    vi.mocked(fetchPoiDetail).mockReset();
    vi.mocked(fetchPoiDetail).mockResolvedValue(mockDetail);
  });

  it('renders verified detail fields and nullable fallbacks', async () => {
    render(<PoiDetailPage id="42" />);

    expect(await screen.findByRole('heading', { name: 'Ngũ Hành Sơn' })).toBeTruthy();
    expect(screen.getAllByText('Địa chỉ đang được cập nhật')).toHaveLength(2);
    expect(screen.getByText('Di tích quốc gia')).toBeTruthy();
    expect(screen.queryByText(/Scenic/i)).toBeNull();
    expect(screen.getByText(/^Chủ nhật/).parentElement?.textContent).toContain('Đóng cửa');
    expect(screen.getByText(/^Thứ hai/).parentElement?.textContent).toContain('07:00–17:30');
  });

  it('rejects an invalid route id without requesting detail data', async () => {
    render(<PoiDetailPage id="abc" />);
    expect(await screen.findByText('Liên kết địa điểm không hợp lệ')).toBeTruthy();
    expect(fetchPoiDetail).not.toHaveBeenCalled();
  });

  it('renders 404 state when POI is not found or inactive', async () => {
    vi.mocked(fetchPoiDetail).mockRejectedValue(
      new PoiApiError('Not Found', 404, {
        status: 404,
        title: 'Poi.NotFound',
        errorCode: 'Poi.NotFound',
      }),
    );

    render(<PoiDetailPage id="999" />);
    expect(await screen.findByText('Địa điểm không tồn tại hoặc đã đóng')).toBeTruthy();
  });

  it('renders network error state on fetch failure and allows retry', async () => {
    vi.mocked(fetchPoiDetail)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(mockDetail);

    render(<PoiDetailPage id="42" />);
    expect(await screen.findByText('Không thể tải thông tin địa điểm')).toBeTruthy();

    const retryBtn = screen.getByRole('button', { name: 'Thử lại' });
    fireEvent.click(retryBtn);

    expect(await screen.findByRole('heading', { name: 'Ngũ Hành Sơn' })).toBeTruthy();
  });

  it('navigates back when clicking the back button', async () => {
    vi.spyOn(window.history, 'length', 'get').mockReturnValue(2);
    render(<PoiDetailPage id="42" />);
    await screen.findByRole('heading', { name: 'Ngũ Hành Sơn' });

    const backBtn = screen.getByRole('button', { name: /Quay lại/i });
    fireEvent.click(backBtn);
    expect(back).toHaveBeenCalled();
  });
});
