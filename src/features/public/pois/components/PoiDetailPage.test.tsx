import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PoiDetailPage } from './PoiDetailPage';

vi.mock('@/components/navigation/PublicNavigation', () => ({
  PublicNavigation: () => <div data-testid="public-navigation" />,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
}));

vi.mock('../services/poiApi', () => ({
  fetchPoiDetail: vi.fn().mockResolvedValue({
    id: 42,
    name: 'Ngũ Hành Sơn',
    description: 'Quần thể danh thắng nổi tiếng.',
    status: 'Active',
    categoryId: 3,
    categoryName: 'Danh lam & Di sản',
    latitude: 16.00389,
    longitude: 108.26417,
    address: null,
    indoorOutdoor: 'Mixed',
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
  }),
}));

describe('PoiDetailPage', () => {
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
  });
});
