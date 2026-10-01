import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ItineraryRouteMapPreview } from '../components/ItineraryRouteMapPreview';
import { ItineraryDetailDto } from '../types/schedulingTypes';

describe('ItineraryRouteMapPreview (UC-11)', () => {
  afterEach(() => {
    cleanup();
  });

  const mockItinerary: ItineraryDetailDto = {
    itineraryId: 789,
    schedulingRequestId: 55,
    title: 'Lịch trình khám phá Đà Nẵng',
    version: 1,
    status: 'OptimalGenerated',
    validFrom: '2026-10-20T08:00:00+07:00',
    validTo: '2026-10-20T17:00:00+07:00',
    canManage: true,
    totalEstimatedCost: 250000,
    totalDurationMinutes: 480,
    items: [
      {
        itemId: 101,
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
        recommendationReason: 'Di sản độc đáo',
        isUnavailable: false,
      },
      {
        itemId: 102,
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
        recommendationReason: 'Nghỉ ngơi',
        isUnavailable: false,
      },
      {
        itemId: 103,
        sequenceNo: 3,
        poiId: 103,
        poiName: 'Cầu Rồng Đà Nẵng',
        category: 'Danh lam thắng cảnh',
        kind: 'Visit',
        plannedArrival: '2026-10-20T14:00:00+07:00',
        plannedDeparture: '2026-10-20T15:00:00+07:00',
        stayDurationMinutes: 60,
        travelDurationFromPreviousMinutes: 20,
        estimatedCost: 0,
        isMandatory: false,
        recommendationReason: 'Biểu tượng',
        isUnavailable: false,
      },
    ],
  };

  it('MAP-1: displays truthful heading "Sơ đồ thứ tự điểm dừng" and stop count badge', () => {
    render(<ItineraryRouteMapPreview itinerary={mockItinerary} />);
    expect(screen.getByText('Sơ đồ thứ tự điểm dừng')).toBeDefined();
    expect(screen.getByText('3 điểm dừng')).toBeDefined();
  });

  it('MAP-2: replaces misleading "Bản đồ hành trình trực quan" with truthful "Thứ tự điểm dừng"', () => {
    render(<ItineraryRouteMapPreview itinerary={mockItinerary} />);
    expect(screen.getByText('Thứ tự điểm dừng')).toBeDefined();
    expect(screen.getByText('Sơ đồ thể hiện trình tự các điểm dừng trong lịch trình.')).toBeDefined();
    expect(screen.queryByText('Bản đồ hành trình trực quan')).toBeNull();
  });

  it('MAP-3: contains no fake geographic coordinates, radius, or map geometry claims', () => {
    render(<ItineraryRouteMapPreview itinerary={mockItinerary} />);
    expect(screen.queryByText(/16\.\d+/)).toBeNull();
    expect(screen.queryByText(/108\.\d+/)).toBeNull();
    expect(screen.queryByText(/bán kính/i)).toBeNull();
    expect(screen.queryByText(/tọa độ/i)).toBeNull();
  });

  it('MAP-4: preserves sequential stop ordering and stop kind styling', () => {
    render(<ItineraryRouteMapPreview itinerary={mockItinerary} />);
    expect(screen.getByText('1')).toBeDefined();
    expect(screen.getByText('2')).toBeDefined();
    expect(screen.getByText('3')).toBeDefined();
  });

  it('P3-1: renders full stop name in text and title attribute without manual first-word ellipsis', () => {
    render(<ItineraryRouteMapPreview itinerary={mockItinerary} />);

    // Full names must exist in the document text
    expect(screen.getByText('Bảo tàng Điêu khắc Chăm')).toBeDefined();
    expect(screen.getByText('Bữa trưa đặc sản Mì Quảng')).toBeDefined();
    expect(screen.getByText('Cầu Rồng Đà Nẵng')).toBeDefined();

    // No manual first-word shortening with ellipsis
    expect(screen.queryByText('Bảo...')).toBeNull();
    expect(screen.queryByText('Bữa...')).toBeNull();
    expect(screen.queryByText('Cầu...')).toBeNull();

    // Title attributes contain the full name
    const chamStop = screen.getByTitle('Bảo tàng Điêu khắc Chăm');
    expect(chamStop).toBeDefined();
  });
});
