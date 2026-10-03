import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ItineraryTimeline } from '../components/ItineraryTimeline';
import { ItineraryDetailItemDto } from '../types/schedulingTypes';

describe('ItineraryTimeline (UC-11)', () => {
  afterEach(() => {
    cleanup();
  });

  const mockItems: ItineraryDetailItemDto[] = [
    {
      itemId: 1,
      sequenceNo: 1,
      poiId: 101,
      poiName: 'Bảo tàng Điêu khắc Chăm',
      category: 'Văn hóa & Di sản',
      kind: 'Visit',
      plannedArrival: '2026-10-20T08:00:00+07:00',
      plannedDeparture: '2026-10-20T09:00:00+07:00',
      stayDurationMinutes: 60,
      travelDurationFromPreviousMinutes: null,
      estimatedCost: 60000,
      isMandatory: true,
      recommendationReason: 'Phù hợp với sở thích Văn hóa & Di sản',
      isUnavailable: false,
    },
    {
      itemId: 2,
      sequenceNo: 2,
      poiId: null,
      poiName: 'Bữa trưa đặc sản Mì Quảng',
      category: 'Ẩm thực',
      kind: 'Rest',
      plannedArrival: '2026-10-20T12:00:00+07:00',
      plannedDeparture: '2026-10-20T13:00:00+07:00',
      stayDurationMinutes: 60,
      travelDurationFromPreviousMinutes: 15,
      estimatedCost: 65000,
      isMandatory: false,
      recommendationReason: 'Nghỉ ngơi và thưởng thức đặc sản',
      isUnavailable: false,
    },
    {
      itemId: 3,
      sequenceNo: 3,
      poiId: 102,
      poiName: 'Cầu Rồng Đà Nẵng',
      category: 'Danh lam thắng cảnh',
      kind: 'Visit',
      plannedArrival: '2026-10-20T14:00:00+07:00',
      plannedDeparture: '2026-10-20T15:00:00+07:00',
      stayDurationMinutes: 60,
      travelDurationFromPreviousMinutes: 20,
      estimatedCost: 0,
      isMandatory: false,
      recommendationReason: 'Biểu tượng nổi tiếng',
      isUnavailable: true,
    },
  ];

  it('renders all stops with sequence numbers and details', () => {
    render(<ItineraryTimeline items={mockItems} />);

    expect(screen.getByText('Bảo tàng Điêu khắc Chăm')).toBeDefined();
    expect(screen.getByText('Bữa trưa đặc sản Mì Quảng')).toBeDefined();
    expect(screen.getByText('Cầu Rồng Đà Nẵng')).toBeDefined();

    // Check item kind badges
    expect(screen.getAllByText('Điểm tham quan').length).toBe(2);
    expect(screen.getByText('Nghỉ ngơi / Ẩm thực')).toBeDefined();

    // Mandatory badge
    expect(screen.getByText('Bắt buộc')).toBeDefined();

    // Category chips
    expect(screen.getByText('Văn hóa & Di sản')).toBeDefined();
    expect(screen.getByText('Ẩm thực')).toBeDefined();
    expect(screen.getByText('Danh lam thắng cảnh')).toBeDefined();

    // Unavailable badge
    expect(screen.getByText('Tạm ngưng hoạt động')).toBeDefined();

    // Costs
    expect(screen.getByText('60.000 VNĐ')).toBeDefined();
    expect(screen.getByText('65.000 VNĐ')).toBeDefined();
    expect(screen.getByText('Miễn phí')).toBeDefined();
  });

  it('renders incoming travel transition segments before item N with travelDurationFromPreviousMinutes', () => {
    render(<ItineraryTimeline items={mockItems} />);

    expect(screen.getAllByText(/Di chuyển khoảng/i).length).toBe(2);
    expect(screen.getByText('15 phút')).toBeDefined();
    expect(screen.getByText('20 phút')).toBeDefined();
    expect(screen.getAllByText(/từ điểm trước/i).length).toBe(2);

    // Verify directions icon is present
    expect(screen.getAllByText('directions').length).toBe(2);
  });

  it('formats arrival and departure times under Asia/Ho_Chi_Minh', () => {
    render(<ItineraryTimeline items={mockItems} />);

    expect(screen.getByText('08:00 - 09:00')).toBeDefined();
    expect(screen.getByText('12:00 - 13:00')).toBeDefined();
    expect(screen.getByText('14:00 - 15:00')).toBeDefined();
  });

  it('renders link to POI details (UC-12) when poiId is present and omits when null', () => {
    render(<ItineraryTimeline items={mockItems} />);

    const poiLinks = screen.getAllByRole('link', { name: /Chi tiết địa điểm/i });
    expect(poiLinks.length).toBe(2);
    expect(poiLinks[0].getAttribute('href')).toBe('/pois/101');
    expect(poiLinks[1].getAttribute('href')).toBe('/pois/102');
  });

  it('renders empty placeholder when items array is empty', () => {
    render(<ItineraryTimeline items={[]} />);

    expect(screen.getByText(/Chưa có điểm dừng nào trong lịch trình này/i)).toBeDefined();
  });
});
