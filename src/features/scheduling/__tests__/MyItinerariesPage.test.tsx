import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MyItinerariesPage, formatSchedule } from '../components/MyItinerariesPage';
import * as schedulingApi from '../services/schedulingApi';
import type { ItinerarySummaryDto } from '../services/schedulingApi';
import * as travelGroupApi from '@/features/traveler/groups/services/travelGroupApi';

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
    validFrom: '2026-10-15T01:00:00Z',
    validTo: '2026-10-15T05:00:00Z',
    canManage: true,
    stopCount: 4,
    openNavigationSessionId: null,
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

  it('lists the traveler trips with in-progress and shared markers', async () => {
    const list = vi.spyOn(schedulingApi, 'listMyItineraries').mockResolvedValueOnce({
      items: [
        trip({ openNavigationSessionId: 900 }),
        trip({ itineraryId: 102, title: 'Hội An cùng nhóm', canManage: false, stopCount: 2 }),
      ],
      page: 1,
      pageSize: 20,
      totalCount: 2,
    });

    render(<MyItinerariesPage />);

    await waitFor(() => expect(screen.getByText('Đà Nẵng một ngày')).toBeDefined());
    expect(list).toHaveBeenCalledWith(1, 20, { accessToken: 'traveler-token' });
    expect(screen.getByText('Đang diễn ra trên app')).toBeDefined();
    expect(screen.getByText('Được chia sẻ')).toBeDefined();
    expect(screen.getByText(/2 điểm dừng/)).toBeDefined();
    expect(
      screen.getByRole('link', { name: /Đà Nẵng một ngày/ }).getAttribute('href'),
    ).toBe('/itinerary/101');
    expect(screen.queryByRole('button', { name: /Xem thêm/ })).toBeNull();
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

  it('opens join group modal and successfully joins travel group', async () => {
    const listSpy = vi.spyOn(schedulingApi, 'listMyItineraries').mockResolvedValue({
      items: [trip()],
      page: 1,
      pageSize: 20,
      totalCount: 1,
    });

    const joinSpy = vi.spyOn(travelGroupApi, 'joinTravelGroup').mockResolvedValueOnce({
      groupId: 99,
      groupName: 'Đà Lạt Mộng Mơ',
      itineraryId: 202,
    });

    render(<MyItinerariesPage />);

    await waitFor(() => expect(screen.getByText('Đà Nẵng một ngày')).toBeDefined());

    // Click "Tham gia nhóm" button in header
    fireEvent.click(screen.getByRole('button', { name: /Tham gia nhóm/ }));

    // Modal dialog is open
    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText('Mã lời mời (8 ký tự)')).toBeDefined();

    // Fill in 8-char code
    const input = screen.getByPlaceholderText('VD: A7K4P2QX');
    fireEvent.change(input, { target: { value: 'a7k4p2qx' } });
    expect((input as HTMLInputElement).value).toBe('A7K4P2QX');

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: 'Tham gia nhóm' }));

    await waitFor(() => {
      expect(joinSpy).toHaveBeenCalledWith('A7K4P2QX', { accessToken: 'traveler-token' });
      expect(screen.getByText(/Bạn đã tham gia "Đà Lạt Mộng Mơ"!/)).toBeDefined();
    });

    // Re-fetched list
    expect(listSpy).toHaveBeenCalledTimes(2);
  });

  it('displays error in modal when join group fails', async () => {
    vi.spyOn(schedulingApi, 'listMyItineraries').mockResolvedValue({
      items: [trip()],
      page: 1,
      pageSize: 20,
      totalCount: 1,
    });

    vi.spyOn(travelGroupApi, 'joinTravelGroup').mockRejectedValueOnce(
      new travelGroupApi.TravelGroupHttpError(
        400,
        'Mã lời mời không hợp lệ, đã hết hạn hoặc không còn khả dụng. Vui lòng kiểm tra lại.',
        'travel_group.invitation_unavailable',
      ),
    );

    render(<MyItinerariesPage />);
    await waitFor(() => expect(screen.getByText('Đà Nẵng một ngày')).toBeDefined());

    fireEvent.click(screen.getByRole('button', { name: /Tham gia nhóm/ }));
    const input = screen.getByPlaceholderText('VD: A7K4P2QX');
    fireEvent.change(input, { target: { value: 'INVALID1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Tham gia nhóm' }));

    await waitFor(() => {
      expect(
        screen.getByText(/Mã lời mời không hợp lệ, đã hết hạn hoặc không còn khả dụng/),
      ).toBeDefined();
    });
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
