import { describe, expect, it } from 'vitest';

import {
  arrivalShiftLabel,
  diffArrivalMinutes,
  formatLegDistance,
  formatLegDuration,
  radiusWarning,
  splitItineraryCosts,
  walkHint,
  describeStopInfeasible,
  unfitReasonLabel,
  lunchCardAfterIndex,
  stopDisplayName,
} from '../utils/itineraryPresentation';
import { formatPriceLabel } from '@/lib/priceLabel';
import { ItineraryDetailItemDto } from '../types/schedulingTypes';

function item(overrides: Partial<ItineraryDetailItemDto>): ItineraryDetailItemDto {
  return {
    itemId: 1,
    sequenceNo: 1,
    poiId: 1,
    poiName: 'A',
    category: null,
    kind: 'Visit',
    plannedArrival: '2026-10-20T08:00:00+07:00',
    plannedDeparture: '2026-10-20T09:00:00+07:00',
    travelDurationFromPreviousMinutes: null,
    stayDurationMinutes: 60,
    estimatedCost: null,
    isMandatory: false,
    recommendationReason: null,
    isUnavailable: false,
    ...overrides,
  };
}

describe('formatPriceLabel (D1)', () => {
  it('says the price is unknown when the cost is null', () => {
    expect(formatPriceLabel(null, 'AdmissionTicket')).toBe('Chưa có thông tin');
    expect(formatPriceLabel(undefined, undefined)).toBe('Chưa có thông tin');
  });

  it('says free only for a known zero cost', () => {
    expect(formatPriceLabel(0, 'AdmissionTicket')).toBe('Miễn phí');
    expect(formatPriceLabel(0, 'AverageSpend')).toBe('Miễn phí');
  });

  it('labels an admission ticket per person', () => {
    expect(formatPriceLabel(60000, 'AdmissionTicket')).toBe('Giá vé dự kiến: 60.000 VNĐ/người');
  });

  it('labels average spend for food per person', () => {
    expect(formatPriceLabel(120000, 'AverageSpend')).toBe('Mức chi tiêu dự kiến: 120.000 VNĐ/người');
  });

  it('treats a missing cost kind as an admission ticket', () => {
    expect(formatPriceLabel(30000, undefined)).toBe('Giá vé dự kiến: 30.000 VNĐ/người');
  });
});

describe('splitItineraryCosts (D11-7)', () => {
  it('splits tickets and food by cost kind and counts unknown prices', () => {
    const split = splitItineraryCosts([
      item({ estimatedCost: 60000, costKind: 'AdmissionTicket' }),
      item({ estimatedCost: 120000, costKind: 'AverageSpend' }),
      item({ estimatedCost: null, costKind: 'AdmissionTicket' }),
      item({ estimatedCost: 0, costKind: 'AdmissionTicket' }),
      item({ estimatedCost: 50000, kind: 'Rest', poiId: null }),
    ]);
    expect(split).toEqual({ tickets: 60000, food: 120000, total: 180000, unknownCount: 1 });
  });
});

describe('leg formatting (D5)', () => {
  it('shows metres below one kilometre and one decimal with a comma above', () => {
    expect(formatLegDistance(850)).toBe('850 m');
    expect(formatLegDistance(9400)).toBe('9,4 km');
    expect(formatLegDistance(12000)).toBe('12 km');
    expect(formatLegDistance(null)).toBeNull();
    expect(formatLegDistance(undefined)).toBeNull();
  });

  it('shows minutes, or hours and minutes from one hour', () => {
    expect(formatLegDuration(22)).toBe('khoảng 22 phút');
    expect(formatLegDuration(70)).toBe('khoảng 1 giờ 10 phút');
    expect(formatLegDuration(120)).toBe('khoảng 2 giờ');
  });

  it('hints walking for a short leg that is not walked', () => {
    expect(walkHint(600, 'Motorbike')).toBe('Gần, có thể đi bộ ~8 phút');
    expect(walkHint(600, 'Walking')).toBeNull();
    expect(walkHint(1500, 'Car')).toBeNull();
    expect(walkHint(null, 'Car')).toBeNull();
  });
});

describe('radiusWarning (D9 fallback)', () => {
  it('warns only above 30 km', () => {
    expect(radiusWarning(10)).toBeNull();
    expect(radiusWarning(30)).toBeNull();
    expect(radiusWarning(31)).toMatch(/31 km/);
  });
});

describe('arrival diff (D11-3)', () => {
  it('reports the arrival shift per POI between two versions', () => {
    const before = [
      item({ poiId: 1, plannedArrival: '2026-10-20T08:00:00+07:00' }),
      item({ poiId: 2, plannedArrival: '2026-10-20T10:00:00+07:00' }),
      item({ poiId: 3, plannedArrival: '2026-10-20T12:00:00+07:00' }),
    ];
    const after = [
      item({ poiId: 1, plannedArrival: '2026-10-20T08:00:00+07:00' }),
      item({ poiId: 2, plannedArrival: '2026-10-20T10:25:00+07:00' }),
      item({ poiId: 3, plannedArrival: '2026-10-20T11:50:00+07:00' }),
      item({ poiId: 4, plannedArrival: '2026-10-20T13:00:00+07:00' }),
    ];
    expect(diffArrivalMinutes(before, after)).toEqual(new Map([[2, 25], [3, -10]]));
  });

  it('labels later and earlier shifts', () => {
    expect(arrivalShiftLabel(25)).toBe('⟲ lùi 25 phút');
    expect(arrivalShiftLabel(-10)).toBe('⟲ sớm hơn 10 phút');
    expect(arrivalShiftLabel(75)).toBe('⟲ lùi 1 giờ 15 phút');
  });
});

describe('infeasible stop messages (§3.4 422)', () => {
  const names = new Map([[35, 'Ngũ Hành Sơn'], [88, 'Chợ Hàn']]);
  const nameOf = (poiId: number | null) => (poiId === null ? null : names.get(poiId) ?? null);
  const base = { poiId: 35, plannedArrival: null, closesAt: null, overflowMinutes: null, overflowVnd: null };

  it('names the stop that closes before arrival', () => {
    expect(
      describeStopInfeasible(
        { ...base, reason: 'ClosedAtArrival', plannedArrival: '2026-10-20T17:40:00+07:00', closesAt: '17:00' },
        nameOf,
      ),
    ).toBe('Không thể lưu thay đổi: "Ngũ Hành Sơn" đóng cửa lúc 17:00, dự kiến đến lúc 17:40.');
  });

  it('gives the overflow of the end time and the budget', () => {
    expect(describeStopInfeasible({ ...base, reason: 'ExceedsEndTime', overflowMinutes: 80 }, nameOf)).toBe(
      'Không thể lưu thay đổi: "Ngũ Hành Sơn" vượt giờ kết thúc 1 giờ 20 phút.',
    );
    expect(describeStopInfeasible({ ...base, poiId: 88, reason: 'ExceedsBudget', overflowVnd: 50000 }, nameOf)).toBe(
      'Không thể lưu thay đổi: "Chợ Hàn" vượt ngân sách 50.000 VNĐ.',
    );
  });

  it('explains the other reasons and falls back for an unknown stop', () => {
    expect(describeStopInfeasible({ ...base, reason: 'OutsideRadius' }, nameOf)).toMatch(/ngoài bán kính/);
    expect(describeStopInfeasible({ ...base, reason: 'Inactive' }, nameOf)).toMatch(/không còn hoạt động/);
    expect(describeStopInfeasible({ ...base, reason: 'NoOpeningHours' }, nameOf)).toMatch(/chưa có giờ mở cửa/);
    expect(describeStopInfeasible({ ...base, poiId: 1, reason: 'Inactive' }, nameOf)).toMatch(/"địa điểm này"/);
    expect(describeStopInfeasible({ ...base, reason: null }, nameOf)).toBe(
      'Không thể lưu thay đổi: lịch trình mới không còn khả thi.',
    );
  });
});

describe('unfitReasonLabel (D11-2)', () => {
  const nameOf = (poiId: number | null) => (poiId === 35 ? 'Ngũ Hành Sơn' : null);
  const base = { poiId: 501, unfitPoiId: 501, overflowMinutes: null, overflowVnd: null, closesAt: null };

  it('uses the same reason texts as the save error', () => {
    expect(unfitReasonLabel({ ...base, unfitReason: 'ExceedsEndTime', overflowMinutes: 80 }, nameOf))
      .toBe('Vượt giờ kết thúc 1 giờ 20 phút');
    expect(unfitReasonLabel({ ...base, unfitReason: 'ClosedAtArrival', closesAt: '21:00' }, nameOf))
      .toBe('Đã đóng cửa khi đến (đóng lúc 21:00)');
    expect(unfitReasonLabel({ ...base, unfitReason: 'ExceedsBudget', overflowVnd: 30000 }, nameOf))
      .toBe('Vượt ngân sách 30.000 VNĐ');
    expect(unfitReasonLabel({ ...base, unfitReason: null, unfitPoiId: null }, nameOf))
      .toBe('Không vừa lịch trình hiện tại');
  });

  it('names a later stop that the suggestion pushes past its closing time', () => {
    expect(unfitReasonLabel({ ...base, unfitReason: 'ClosedAtArrival', unfitPoiId: 35 }, nameOf))
      .toBe('Làm "Ngũ Hành Sơn" đã đóng cửa khi đến');
  });
});

describe('stopDisplayName', () => {
  it('falls back to the stop number when the place has no name', () => {
    expect(stopDisplayName(item({ poiName: 'Chợ Hàn' }))).toBe('Chợ Hàn');
    expect(stopDisplayName(item({ poiName: null, sequenceNo: 4 }))).toBe('điểm dừng 4');
  });
});

describe('lunchCardAfterIndex (D11-1)', () => {
  const day = [
    item({ itemId: 1, poiId: 1, plannedArrival: '2026-10-20T08:00:00+07:00', plannedDeparture: '2026-10-20T09:30:00+07:00' }),
    item({ itemId: 2, poiId: 2, plannedArrival: '2026-10-20T09:50:00+07:00', plannedDeparture: '2026-10-20T11:40:00+07:00' }),
    item({ itemId: 3, poiId: 3, plannedArrival: '2026-10-20T12:00:00+07:00', plannedDeparture: '2026-10-20T14:00:00+07:00' }),
    item({ itemId: 4, poiId: 4, plannedArrival: '2026-10-20T14:20:00+07:00', plannedDeparture: '2026-10-20T16:00:00+07:00' }),
  ];

  it('puts the card on the leg closest to noon when the trip covers lunch', () => {
    expect(lunchCardAfterIndex(day, '2026-10-20T08:00:00+07:00', '2026-10-20T17:00:00+07:00')).toBe(1);
  });

  it('shows no card when the trip already has a food stop', () => {
    const withFood = day.map((entry, index) => (index === 2 ? { ...entry, costKind: 'AverageSpend' as const } : entry));
    expect(lunchCardAfterIndex(withFood, '2026-10-20T08:00:00+07:00', '2026-10-20T17:00:00+07:00')).toBeNull();
  });

  it('shows no card when the trip does not cover 11:00–13:30', () => {
    expect(lunchCardAfterIndex(day.slice(0, 2), '2026-10-20T08:00:00+07:00', '2026-10-20T12:00:00+07:00')).toBeNull();
    expect(lunchCardAfterIndex(day.slice(3), '2026-10-20T14:00:00+07:00', '2026-10-20T17:00:00+07:00')).toBeNull();
  });

  it('falls back to the stop times when the trip window is unknown', () => {
    expect(lunchCardAfterIndex(day, null, null)).toBe(1);
  });
});
