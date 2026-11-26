import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { StayCatalog, StayDetail, StayRequestList } from '../TravelerStays';
import { ProviderStays } from '../ProviderStays';
import * as stayApi from '../stayApi';

const sessionMock = vi.hoisted(() => ({
  status: 'authenticated' as 'authenticated' | 'unauthenticated' | 'restoring',
  context: {
    userId: 10,
    role: 'Traveler',
    fullName: 'Trần Ngọc Mai',
    email: 'mai.tran@tripmate.vn',
    accessToken: 'token-123',
  } as null | {
    userId: number;
    role: string;
    fullName: string;
    email: string;
    accessToken: string;
  },
}));

vi.mock('@/features/auth/session/useWebSession', () => ({
  useWebSession: () => sessionMock,
}));

const OPEN_HOTEL: stayApi.StayFacility = {
  poiId: 367,
  name: 'Phố Cổ Riverside Homestay',
  address: '188 Cửa Đại, Hội An',
  latitude: 15.8801,
  longitude: 108.338,
  description: 'Homestay ven sông Thu Bồn.',
  published: true,
  acceptingRequests: true,
};

const CLOSED_HOTEL: stayApi.StayFacility = {
  poiId: 377,
  name: 'Khách sạn Cố Đô Huế',
  address: '24 Lê Lợi, Huế',
  latitude: 16.4637,
  longitude: 107.5909,
  description: 'Tạm đóng nhận yêu cầu.',
  published: true,
  acceptingRequests: false,
};

describe('Stays UC-31 Coastal Heritage UI flows', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionMock.status = 'authenticated';
    sessionMock.context = {
      userId: 10,
      role: 'Traveler',
      fullName: 'Trần Ngọc Mai',
      email: 'mai.tran@tripmate.vn',
      accessToken: 'token-123',
    };
  });

  afterEach(() => {
    cleanup();
  });

  it('renders catalog with open/closed status badges and separate start-point links', async () => {
    vi.spyOn(stayApi, 'stayRequest').mockResolvedValueOnce([OPEN_HOTEL, CLOSED_HOTEL]);

    render(<StayCatalog itineraryId={1} />);

    expect(await screen.findByText('Phố Cổ Riverside Homestay')).toBeDefined();
    expect(screen.getByText('Khách sạn Cố Đô Huế')).toBeDefined();
    expect(screen.getAllByText('Chưa mở nhận yêu cầu').length).toBeGreaterThan(0);

    const startLinks = screen.getAllByRole('link', { name: /Dùng làm điểm xuất phát/i });
    expect(startLinks[0].getAttribute('href')).toBe('/plan?stayPoiId=367');
  });

  it('submits simplified stay inquiry on Web with mandatory direct-exchange notice', async () => {
    const spy = vi
      .spyOn(stayApi, 'stayRequest')
      .mockResolvedValueOnce(OPEN_HOTEL)
      .mockResolvedValueOnce({
        id: 148,
        poiId: 367,
        facilityName: OPEN_HOTEL.name,
        itineraryId: 1,
        arrival: '2026-11-27',
        departure: '2026-12-01',
        guests: 4,
        contactName: 'Trần Ngọc Mai',
        contact: '0905678234',
        note: 'Đến chiều 27/11',
        status: 'Sent',
        reply: null,
      });

    render(<StayDetail poiId={367} itineraryId={1} />);

    expect(await screen.findByRole('heading', { name: OPEN_HOTEL.name })).toBeDefined();
    expect(screen.getByText(stayApi.STAY_DIRECT_EXCHANGE_NOTICE)).toBeDefined();

    fireEvent.change(screen.getByLabelText(/Ngày nhận dự kiến/i), { target: { value: '2026-11-27' } });
    fireEvent.change(screen.getByLabelText(/Ngày trả dự kiến/i), { target: { value: '2026-12-01' } });
    fireEvent.change(screen.getByLabelText(/Số khách/i), { target: { value: '4' } });
    fireEvent.click(screen.getByRole('button', { name: /Gửi yêu cầu lưu trú/i }));

    expect(await screen.findByText(/Yêu cầu #148/i)).toBeDefined();
    expect(screen.getByText('Đã gửi')).toBeDefined();
    expect(spy).toHaveBeenCalledWith(
      '/traveler/stay-inquiries',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('shows Cơ sở đã phản hồi and Dùng làm điểm xuất phát on Traveler request list', async () => {
    vi.spyOn(stayApi, 'stayRequest').mockResolvedValueOnce([
      {
        id: 148,
        poiId: 367,
        facilityName: OPEN_HOTEL.name,
        itineraryId: 1,
        arrival: '2026-11-27',
        departure: '2026-12-01',
        guests: 4,
        contactName: 'Trần Ngọc Mai',
        contact: 'mai.tran@tripmate.vn',
        note: null,
        status: 'Replied',
        reply: 'Cơ sở hiện còn phòng, vui lòng gọi lễ tân để chốt.',
      },
    ]);

    render(<StayRequestList />);

    expect(await screen.findByText('Phố Cổ Riverside Homestay')).toBeDefined();
    expect(screen.getAllByText('Cơ sở đã phản hồi').length).toBeGreaterThan(0);
    expect(screen.getByText(/vui lòng gọi lễ tân để chốt/i)).toBeDefined();
    expect(screen.getByRole('link', { name: /Dùng làm điểm xuất phát/i }).getAttribute('href')).toBe(
      '/plan?stayPoiId=367',
    );
    expect(screen.getByRole('link', { name: /Quay lại chi tiết lịch trình/i }).getAttribute('href')).toBe(
      '/itinerary/1',
    );
  });

  it('lets Hotel Operator send reply or decline with two distinct buttons and switch to listing tab', async () => {
    const spy = vi
      .spyOn(stayApi, 'stayRequest')
      .mockResolvedValueOnce([OPEN_HOTEL])
      .mockResolvedValueOnce([
        {
          id: 148,
          poiId: 367,
          facilityName: OPEN_HOTEL.name,
          itineraryId: 1,
          arrival: '2026-11-27',
          departure: '2026-12-01',
          guests: 4,
          contactName: 'Trần Ngọc Mai',
          contact: '0905678234',
          note: 'Nhờ tư vấn phòng',
          status: 'Sent',
          reply: null,
        },
      ])
      .mockResolvedValueOnce({
        id: 148,
        poiId: 367,
        facilityName: OPEN_HOTEL.name,
        itineraryId: 1,
        arrival: '2026-11-27',
        departure: '2026-12-01',
        guests: 4,
        contactName: 'Trần Ngọc Mai',
        contact: '0905678234',
        note: 'Nhờ tư vấn phòng',
        status: 'Replied',
        reply: 'Cơ sở còn phòng 27/11–01/12.',
      });

    render(<ProviderStays />);

    expect(await screen.findByText('Hotel Operator')).toBeDefined();
    expect(await screen.findByText('Trần Ngọc Mai')).toBeDefined();

    fireEvent.change(screen.getByLabelText(/Nội dung phản hồi hoặc lý do từ chối/i), {
      target: { value: 'Cơ sở còn phòng 27/11–01/12.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Gửi phản hồi/i }));

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith(
        '/api/provider/stays/inquiries/148/reply',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ reply: 'Cơ sở còn phòng 27/11–01/12.', declined: false }),
        }),
      );
    });

    fireEvent.click(screen.getByRole('tab', { name: /Hồ sơ cơ sở lưu trú/i }));
    expect(await screen.findByText('Đã được Staff xác minh')).toBeDefined();
  });
});
