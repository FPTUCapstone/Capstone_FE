import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
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
      costKind: 'AverageSpend',
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

    // Costs (Review 2, D1)
    expect(screen.getByText('Giá vé dự kiến: 60.000 VNĐ/người')).toBeDefined();
    expect(screen.getByText('Mức chi tiêu dự kiến: 65.000 VNĐ/người')).toBeDefined();
    expect(screen.getByText('Miễn phí')).toBeDefined();
  });

  it('renders "Điểm dừng chân tránh nắng" for rest stops without dining category', () => {
    const shelterRestItem = {
      ...mockItems[1],
      category: 'Natural attraction',
      costKind: undefined,
    };
    render(<ItineraryTimeline items={[mockItems[0], shelterRestItem]} />);
    expect(screen.getByText('Điểm dừng chân tránh nắng')).toBeDefined();
    expect(screen.queryByText('Nghỉ ngơi / Ẩm thực')).toBeNull();
  });



  it('says the price is unknown instead of free when the cost is null (D1)', () => {
    render(<ItineraryTimeline items={[{ ...mockItems[0], estimatedCost: null }]} />);

    expect(screen.getByText('Chưa có thông tin')).toBeDefined();
    expect(screen.queryByText('Miễn phí')).toBeNull();
  });

  it('renders a leg row before item N with travelDurationFromPreviousMinutes', () => {
    render(<ItineraryTimeline items={mockItems} />);

    const legs = screen.getAllByTestId('leg-row');
    expect(legs.length).toBe(2);
    // Itineraries planned before Review 2 have no distance: the km part is hidden.
    expect(legs[0].textContent).toContain('khoảng 15 phút');
    expect(legs[0].textContent).not.toContain('km');
    expect(legs[1].textContent).toContain('khoảng 20 phút');
  });

  describe('Review 2 leg row (D5, D11-6)', () => {
    const legItems: ItineraryDetailItemDto[] = [
      { ...mockItems[0], itemId: 11, poiId: 12, isUnavailable: false },
      {
        ...mockItems[2],
        itemId: 12,
        poiId: 88,
        poiName: 'Ngũ Hành Sơn',
        isUnavailable: false,
        travelDurationFromPreviousMinutes: 22,
        travelDistanceFromPreviousMeters: 9400,
        transportModeFromPrevious: 'Motorbike',
      },
      {
        ...mockItems[2],
        itemId: 13,
        sequenceNo: 3,
        poiId: 35,
        poiName: 'Chùa Quan Thế Âm',
        isUnavailable: false,
        travelDurationFromPreviousMinutes: 4,
        travelDistanceFromPreviousMeters: 600,
        transportModeFromPrevious: 'Motorbike',
      },
      {
        ...mockItems[2],
        itemId: 14,
        sequenceNo: 4,
        poiId: 40,
        poiName: 'Bãi biển Non Nước',
        isUnavailable: false,
        travelDurationFromPreviousMinutes: 70,
        travelDistanceFromPreviousMeters: 31000,
        transportModeFromPrevious: 'Car',
      },
    ];

    it('shows km, minutes and mode per leg', () => {
      render(<ItineraryTimeline items={legItems} />);

      const legs = screen.getAllByTestId('leg-row');
      expect(legs[0].textContent).toContain('9,4 km · khoảng 22 phút · 🛵 Xe máy');
      expect(legs[1].textContent).toContain('600 m · khoảng 4 phút · 🛵 Xe máy');
      expect(legs[2].textContent).toContain('31 km · khoảng 1 giờ 10 phút · 🚗 Ô tô/taxi');
    });

    it('suggests walking only for a short leg that is not walked', () => {
      render(<ItineraryTimeline items={legItems} />);

      expect(screen.getAllByText('Gần, có thể đi bộ ~8 phút')).toHaveLength(1);
    });

    it('shows the motorbike estimate note once at the top', () => {
      render(<ItineraryTimeline items={legItems} />);

      expect(screen.getAllByText('ⓘ Thời gian xe máy là ước tính theo đường ô tô')).toHaveLength(1);
    });

    it('falls back to the trip transport mode when a leg has none', () => {
      render(
        <ItineraryTimeline
          items={[legItems[0], { ...legItems[1], transportModeFromPrevious: null }]}
          tripTransportMode="Car"
        />,
      );

      expect(screen.getByTestId('leg-row').textContent).toContain('🚗 Ô tô/taxi');
      expect(screen.queryByText(/Thời gian xe máy/)).toBeNull();
    });

    it('offers no transport change unless the trip is editable', () => {
      render(<ItineraryTimeline items={legItems} />);

      expect(screen.queryByRole('button', { name: /Đổi phương tiện/ })).toBeNull();
    });

    it('changes the mode of the leg leaving the previous stop', () => {
      const onChangeLegMode = vi.fn();
      render(<ItineraryTimeline items={legItems} editable onChangeLegMode={onChangeLegMode} />);

      fireEvent.click(screen.getByRole('button', { name: 'Đổi phương tiện đến Ngũ Hành Sơn' }));
      const menu = screen.getByRole('menu');
      expect(within(menu).getAllByRole('menuitemradio').map((option) => option.textContent)).toEqual([
        '🚶 Đi bộ',
        '🛵 Xe máy',
        '🚗 Ô tô/taxi',
      ]);
      fireEvent.click(within(menu).getByRole('menuitemradio', { name: '🚶 Đi bộ' }));

      expect(onChangeLegMode).toHaveBeenCalledWith(12, 'Walking');
    });

    it('does not offer transport mode change or walk hint for legs connecting to or from rest stops', () => {
      const onChangeLegMode = vi.fn();
      const itemsWithRest: ItineraryDetailItemDto[] = [
        legItems[0],
        {
          ...legItems[1],
          itemId: 99,
          poiId: 999,
          poiName: 'Động Âm Phủ',
          kind: 'Rest',
          travelDurationFromPreviousMinutes: 2,
          travelDistanceFromPreviousMeters: 750,
          transportModeFromPrevious: 'Motorbike',
        },
        legItems[2],
      ];

      render(<ItineraryTimeline items={itemsWithRest} editable onChangeLegMode={onChangeLegMode} />);

      // The leg into the Rest stop has no [Đổi] button and no walk hint
      expect(screen.queryByRole('button', { name: /Đổi phương tiện đến Động Âm Phủ/i })).toBeNull();
      expect(screen.queryByText(/Gần, có thể đi bộ/i)).toBeNull();
    });

    it('marks stops whose arrival moved after an edit (D11-3)', () => {
      render(<ItineraryTimeline items={legItems} arrivalShifts={new Map([[88, 25], [35, -10]])} />);

      expect(screen.getByText('⟲ lùi 25 phút')).toBeDefined();
      expect(screen.getByText('⟲ sớm hơn 10 phút')).toBeDefined();
    });
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

  it('shows no day labels for a same-day trip', () => {
    render(<ItineraryTimeline items={mockItems} tripStart="2026-10-20T07:30:00+07:00" />);

    expect(screen.queryByText(/20\/10/)).toBeNull();
  });

  it('labels the next morning when an evening trip waits overnight', () => {
    render(<ItineraryTimeline items={mockItems} tripStart="2026-10-19T20:45:00+07:00" />);

    expect(screen.getByText(/20\/10/)).toBeDefined();
  });

  describe('Review 2 stop actions and lunch card (D4, D11-1/5)', () => {
    const day: ItineraryDetailItemDto[] = [
      { ...mockItems[0], itemId: 21, poiId: 12, poiName: 'Bảo tàng Chăm', plannedArrival: '2026-10-20T08:00:00+07:00', plannedDeparture: '2026-10-20T09:30:00+07:00' },
      { ...mockItems[0], itemId: 22, sequenceNo: 2, poiId: 88, poiName: 'Ngũ Hành Sơn', isMandatory: false, plannedArrival: '2026-10-20T09:50:00+07:00', plannedDeparture: '2026-10-20T11:40:00+07:00', travelDurationFromPreviousMinutes: 20 },
      { ...mockItems[0], itemId: 23, sequenceNo: 3, poiId: 35, poiName: 'Bãi biển Non Nước', isMandatory: false, plannedArrival: '2026-10-20T12:00:00+07:00', plannedDeparture: '2026-10-20T14:00:00+07:00', travelDurationFromPreviousMinutes: 20 },
    ];
    const handlers = () => ({
      onReplaceStop: vi.fn(),
      onRemoveStop: vi.fn(),
      onViewReviews: vi.fn(),
      onAddFood: vi.fn(),
    });

    it('groups the stop actions in one "⋯" menu', () => {
      const h = handlers();
      render(<ItineraryTimeline items={day} tripStart="2026-10-20T08:00:00+07:00" tripEnd="2026-10-20T17:00:00+07:00" editable {...h} />);

      fireEvent.click(screen.getByRole('button', { name: 'Thao tác với Ngũ Hành Sơn' }));
      const menu = screen.getByRole('menu');
      expect(within(menu).getAllByRole('menuitem').map((entry) => entry.textContent)).toEqual([
        'Thay địa điểm',
        'Bỏ khỏi lịch',
        'Xem đánh giá',
      ]);

      fireEvent.click(within(menu).getByRole('menuitem', { name: 'Thay địa điểm' }));
      expect(h.onReplaceStop).toHaveBeenCalledWith(expect.objectContaining({ itemId: 22 }));

      fireEvent.click(screen.getByRole('button', { name: 'Thao tác với Ngũ Hành Sơn' }));
      fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: 'Bỏ khỏi lịch' }));
      expect(h.onRemoveStop).toHaveBeenCalledWith(expect.objectContaining({ itemId: 22 }));

      fireEvent.click(screen.getByRole('button', { name: 'Thao tác với Ngũ Hành Sơn' }));
      fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: 'Xem đánh giá' }));
      expect(h.onViewReviews).toHaveBeenCalledWith(expect.objectContaining({ itemId: 22 }));
    });

    it('offers only reviews to read-only viewers', () => {
      render(<ItineraryTimeline items={day} {...handlers()} />);

      fireEvent.click(screen.getByRole('button', { name: 'Thao tác với Ngũ Hành Sơn' }));
      expect(within(screen.getByRole('menu')).getAllByRole('menuitem').map((entry) => entry.textContent)).toEqual([
        'Xem đánh giá',
      ]);
      expect(screen.queryByText('🍜 Bữa trưa?')).toBeNull();
      expect(screen.queryByRole('button', { name: '＋ Thêm quán ăn' })).toBeNull();
    });

    it('shows the lunch card on the leg closest to noon and one add-food button at the end', () => {
      const h = handlers();
      render(<ItineraryTimeline items={day} tripStart="2026-10-20T08:00:00+07:00" tripEnd="2026-10-20T17:00:00+07:00" editable {...h} />);

      expect(screen.getAllByText('🍜 Bữa trưa?')).toHaveLength(1);
      fireEvent.click(screen.getByRole('button', { name: 'Chọn quán' }));
      expect(h.onAddFood).toHaveBeenCalledWith(expect.objectContaining({ itemId: 22 }));

      fireEvent.click(screen.getByRole('button', { name: '＋ Thêm quán ăn' }));
      expect(h.onAddFood).toHaveBeenLastCalledWith(expect.objectContaining({ itemId: 23 }));
    });

    it('shows no lunch card once the trip has a food stop', () => {
      const withFood = day.map((entry) => (entry.itemId === 23 ? { ...entry, costKind: 'AverageSpend' as const } : entry));
      render(<ItineraryTimeline items={withFood} tripStart="2026-10-20T08:00:00+07:00" tripEnd="2026-10-20T17:00:00+07:00" editable {...handlers()} />);

      expect(screen.queryByText('🍜 Bữa trưa?')).toBeNull();
    });

    it('offers no "⋯" menu for a stop without a place', () => {
      const rest: ItineraryDetailItemDto = { ...mockItems[1], itemId: 30, sequenceNo: 4, poiId: null, poiName: null };
      render(<ItineraryTimeline items={[...day, rest]} editable {...handlers()} />);

      expect(screen.queryByRole('button', { name: 'Thao tác với điểm dừng 4' })).toBeNull();
      expect(screen.getByRole('button', { name: 'Thao tác với Ngũ Hành Sơn' })).toBeDefined();
    });
  });

  describe('map highlight (review finding 9)', () => {
    it('reports the stop under keyboard focus as well as under the mouse', () => {
      const onHighlightItem = vi.fn();
      render(<ItineraryTimeline items={mockItems} onHighlightItem={onHighlightItem} />);
      const link = screen.getAllByRole('link', { name: /Chi tiết địa điểm/i })[0];

      fireEvent.focus(link);
      expect(onHighlightItem).toHaveBeenLastCalledWith(1);
      fireEvent.blur(link);
      expect(onHighlightItem).toHaveBeenLastCalledWith(null);

      fireEvent.mouseEnter(link.closest('[data-item-id]')!);
      expect(onHighlightItem).toHaveBeenLastCalledWith(1);
    });
  });
});
