import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MyItinerariesPage, formatSchedule } from '../components/MyItinerariesPage';
import * as schedulingApi from '../services/schedulingApi';
import type { ItinerarySummaryDto } from '../services/schedulingApi';

const mocks = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: mocks.replace }),
}));

const mockUseWebSession = vi.fn();
vi.mock('@/features/auth/session/useWebSession', () => ({
  useWebSession: () => mockUseWebSession(),
}));

vi.mock('@/components/navigation/PublicNavigation', () => ({
  PublicNavigation: () => <nav data-testid="public-navigation" />,
}));

const traveler = {
  status: 'authenticated',
  context: {
    userId: 1,
    email: 'traveler@tripmate.vn',
    fullName: 'Nguyen Van A',
    role: 'Traveler',
    status: 'Active',
    accessToken: 'traveler-token',
  },
};

function trip(overrides: Partial<ItinerarySummaryDto> = {}): ItinerarySummaryDto {
  return {
    itineraryId: 101,
    schedulingRequestId: 55,
    title: 'Đà Nẵng một ngày',
    version: 1,
    status: 'Active',
    validFrom: '2099-10-15T01:00:00Z',
    validTo: '2099-10-15T05:00:00Z',
    canManage: true,
    stopCount: 4,
    openNavigationSessionId: null,
    transportMode: 'Motorbike',
    previewStopNames: ['Bảo tàng Chăm', 'Cầu Rồng', 'Chùa Linh Ứng'],
    ...overrides,
  };
}

describe('MyItinerariesPage (/itineraries)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseWebSession.mockReturnValue(traveler);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('lists the traveler trips with in-progress, shared markers, route preview, and zero material icons', async () => {
    const list = vi.spyOn(schedulingApi, 'listMyItineraries').mockResolvedValueOnce({
      items: [
        trip({ openNavigationSessionId: 900 }),
        trip({
          itineraryId: 102,
          title: 'Generated itinerary - 15 Oct 2099',
          status: 'Draft',
          canManage: false,
          stopCount: 5,
          transportMode: 'Car',
          previewStopNames: ['Phố cổ Hội An', 'Chùa Cầu', 'Bảo tàng Hội An'],
        }),
      ],
      page: 1,
      pageSize: 20,
      totalCount: 2,
    });

    const { container } = render(<MyItinerariesPage />);

    await waitFor(() => expect(screen.getByText('Đà Nẵng một ngày')).toBeDefined());
    expect(list).toHaveBeenCalledWith(1, 20, { accessToken: 'traveler-token' });
    expect(screen.getByText('Đang diễn ra trên app')).toBeDefined();
    expect(screen.getByText('Được chia sẻ')).toBeDefined();
    expect(screen.getByText(/5 điểm dừng/)).toBeDefined();
    expect(screen.getByText('Mới tạo')).toBeDefined();
    expect(screen.getByText('Phố cổ Hội An – Chùa Cầu')).toBeDefined();
    expect(
      screen.getByText('Phố cổ Hội An → Chùa Cầu → Bảo tàng Hội An → +2 điểm'),
    ).toBeDefined();
    expect(screen.getAllByText(/4g/)).toHaveLength(2);
    expect(screen.getByText(/Ô tô/)).toBeDefined();
    expect(
      screen.getByRole('link', { name: /Đà Nẵng một ngày/ }).getAttribute('href'),
    ).toBe('/itinerary/101');
    expect(screen.queryByRole('button', { name: /Xem thêm/ })).toBeNull();
    expect(container.querySelectorAll('main .material-symbols-outlined')).toHaveLength(0);
  });

  it('separates confirmed upcoming trips from recent drafts in priority mode', async () => {
    vi.spyOn(schedulingApi, 'listMyItineraries').mockResolvedValueOnce({
      items: [
        trip({ itineraryId: 201, title: 'Chuyến đã chốt', status: 'Active' }),
        trip({ itineraryId: 202, title: 'Bản nháp mới nhất', status: 'Draft' }),
        trip({ itineraryId: 203, title: 'Bản nháp cũ hơn', status: 'Draft' }),
      ],
      page: 1,
      pageSize: 20,
      totalCount: 3,
    });

    render(<MyItinerariesPage />);

    await waitFor(() => expect(screen.getByText('Chuyến đã chốt')).toBeDefined());
    expect(screen.getByText('Chuyến sắp tới · Đã chốt (1)')).toBeDefined();
    expect(screen.getByText('Bản nháp gần đây (2)')).toBeDefined();
    expect(screen.getAllByText('Mới tạo')).toHaveLength(1);
  });

  it('filters by status pill and searches by stop name or #ID with reset', async () => {
    vi.spyOn(schedulingApi, 'listMyItineraries').mockResolvedValueOnce({
      items: [
        trip({
          itineraryId: 301,
          title: 'Tour Đà Nẵng',
          status: 'Active',
          previewStopNames: ['Bảo tàng Chăm'],
        }),
        trip({
          itineraryId: 302,
          title: 'Bản nháp Hội An',
          status: 'Draft',
          canManage: false,
          previewStopNames: ['Chùa Cầu'],
        }),
      ],
      page: 1,
      pageSize: 20,
      totalCount: 2,
    });

    render(<MyItinerariesPage />);

    await waitFor(() => expect(screen.getByText('Tour Đà Nẵng')).toBeDefined());

    fireEvent.click(screen.getByRole('button', { name: 'Bản nháp (1)' }));
    expect(screen.queryByText('Tour Đà Nẵng')).toBeNull();
    expect(screen.getByText('Bản nháp Hội An')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Tất cả (2)' }));
    const searchInput = screen.getByLabelText('Tìm theo điểm đến hoặc #ID');
    fireEvent.change(searchInput, { target: { value: 'Chùa Cầu' } });
    expect(screen.queryByText('Tour Đà Nẵng')).toBeNull();
    expect(screen.getByText('Bản nháp Hội An')).toBeDefined();

    fireEvent.change(searchInput, { target: { value: '#301' } });
    expect(screen.getByText('Tour Đà Nẵng')).toBeDefined();
    expect(screen.queryByText('Bản nháp Hội An')).toBeNull();

    fireEvent.change(searchInput, { target: { value: 'Không tồn tại' } });
    expect(screen.getByText('Không tìm thấy lịch trình phù hợp')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Xóa bộ lọc' }));
    expect(screen.getByText('Tour Đà Nẵng')).toBeDefined();
    expect(screen.getByText('Bản nháp Hội An')).toBeDefined();
  });

  it('re-fetches with sort=newest when switching the sort dropdown', async () => {
    const list = vi
      .spyOn(schedulingApi, 'listMyItineraries')
      .mockResolvedValueOnce({
        items: [trip({ itineraryId: 10, title: 'Lịch Active', status: 'Active' })],
        page: 1,
        pageSize: 20,
        totalCount: 1,
      })
      .mockResolvedValueOnce({
        items: [trip({ itineraryId: 99, title: 'Lịch vừa tạo', status: 'Draft' })],
        page: 1,
        pageSize: 20,
        totalCount: 1,
      });

    render(<MyItinerariesPage />);

    await waitFor(() => expect(screen.getByText('Lịch Active')).toBeDefined());

    fireEvent.change(screen.getByLabelText('Sắp xếp lịch trình'), {
      target: { value: 'newest' },
    });

    await waitFor(() => expect(screen.getByText('Lịch vừa tạo')).toBeDefined());
    expect(list).toHaveBeenLastCalledWith(1, 20, {
      accessToken: 'traveler-token',
      sort: 'newest',
    });
    expect(screen.getByText('Mới tạo')).toBeDefined();
  });

  it('loads the next page on demand', async () => {
    const list = vi
      .spyOn(schedulingApi, 'listMyItineraries')
      .mockResolvedValueOnce({ items: [trip()], page: 1, pageSize: 20, totalCount: 2 })
      .mockResolvedValueOnce({
        items: [trip({ itineraryId: 103, title: 'Sơn Trà buổi chiều' })],
        page: 2,
        pageSize: 20,
        totalCount: 2,
      });

    render(<MyItinerariesPage />);
    fireEvent.click(await screen.findByRole('button', { name: /Xem thêm chuyến đi/ }));

    await waitFor(() => expect(screen.getByText('Sơn Trà buổi chiều')).toBeDefined());
    expect(list).toHaveBeenLastCalledWith(2, 20, { accessToken: 'traveler-token' });
    expect(screen.getByText('Đà Nẵng một ngày')).toBeDefined();
    expect(screen.queryByRole('button', { name: /Xem thêm/ })).toBeNull();
  });

  it('shows an empty state with a link to plan a trip', async () => {
    vi.spyOn(schedulingApi, 'listMyItineraries').mockResolvedValueOnce({
      items: [],
      page: 1,
      pageSize: 20,
      totalCount: 0,
    });

    render(<MyItinerariesPage />);

    await waitFor(() => expect(screen.getByText(/Bạn chưa có chuyến đi nào/)).toBeDefined());
    expect(screen.getByRole('link', { name: /Lập lịch trình mới/ }).getAttribute('href')).toBe(
      '/plan',
    );
  });

  it('shows the error and retries', async () => {
    vi.spyOn(schedulingApi, 'listMyItineraries')
      .mockRejectedValueOnce(
        new schedulingApi.ItineraryHttpError(500, 'Không thể tải danh sách chuyến đi.', 'server.error'),
      )
      .mockResolvedValueOnce({ items: [trip()], page: 1, pageSize: 20, totalCount: 1 });

    render(<MyItinerariesPage />);

    await waitFor(() => expect(screen.getByRole('alert')).toBeDefined());
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    await waitFor(() => expect(screen.getByText('Đà Nẵng một ngày')).toBeDefined());
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('redirects a guest to sign in with returnUrl', () => {
    mockUseWebSession.mockReturnValue({ status: 'unauthenticated', context: null });
    const list = vi.spyOn(schedulingApi, 'listMyItineraries');

    const { container } = render(<MyItinerariesPage />);

    expect(container.firstChild).toBeNull();
    expect(mocks.replace).toHaveBeenCalledWith('/sign-in?returnUrl=%2Fitineraries');
    expect(list).not.toHaveBeenCalled();
  });

  it('redirects a tour operator to the partner dashboard', () => {
    mockUseWebSession.mockReturnValue({
      status: 'authenticated',
      context: { ...traveler.context, role: 'TourOperator' },
    });

    render(<MyItinerariesPage />);

    expect(mocks.replace).toHaveBeenCalledWith('/partner');
  });
});

describe('formatSchedule', () => {
  it('shows one date for a same-day trip', () => {
    expect(formatSchedule('2026-10-15T01:00:00Z', '2026-10-15T05:00:00Z')).toMatch(
      /15\/10.*08:00–12:00$/,
    );
  });

  it('shows both dates for a trip that crosses midnight', () => {
    const label = formatSchedule('2026-10-15T13:00:00Z', '2026-10-16T02:00:00Z');
    expect(label).toMatch(/15\/10.*20:00 – .*16\/10.*09:00$/);
  });

  it('returns null without a start', () => {
    expect(formatSchedule(null, null)).toBeNull();
  });
});
