import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useExplanationRefresh } from '../components/useExplanationRefresh';
import * as schedulingApi from '../services/schedulingApi';
import type {
  ItineraryDetailDto,
  ItineraryDetailItemDto,
  SchedulingResponseDto,
} from '../types/schedulingTypes';
import { registerExplanationPending, takeExplanationPending } from '../utils/explanationRefresh';

vi.mock('../services/schedulingApi', () => ({
  getItineraryById: vi.fn(),
}));

const getItineraryById = vi.mocked(schedulingApi.getItineraryById);

const T0 = new Date('2026-11-17T10:00:00Z').getTime();
const TEMPLATE = 'Câu mẫu';
const AI = 'Câu của AI';

function createResponse(itineraryId: number): SchedulingResponseDto {
  return {
    schedulingRequestId: 1,
    itineraryId,
    title: 'Đà Nẵng',
    status: 'Draft',
    totalEstimatedCost: 0,
    totalDurationMinutes: 60,
    explanationPending: true,
    items: [
      {
        sequenceNo: 1,
        poiId: 10,
        poiName: 'A',
        itemKind: 'Visit',
        plannedArrival: '2026-10-20T08:00:00+07:00',
        plannedDeparture: '2026-10-20T09:00:00+07:00',
        stayDurationMinutes: 60,
        travelDurationToNextMinutes: null,
        estimatedCost: null,
        isMandatory: false,
        recommendationReason: null,
        friendlyExplanation: TEMPLATE,
      },
    ],
  };
}

function detail(itineraryId: number, sentence: string): ItineraryDetailDto {
  const item: ItineraryDetailItemDto = {
    itemId: 1,
    sequenceNo: 1,
    poiId: 10,
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
    friendlyExplanation: sentence,
    isUnavailable: false,
  };
  return {
    itineraryId,
    schedulingRequestId: 1,
    title: 'Đà Nẵng',
    version: 1,
    status: 'Draft',
    validFrom: null,
    validTo: null,
    canManage: true,
    totalEstimatedCost: 0,
    totalDurationMinutes: 60,
    items: [item],
  };
}

function seconds(n: number): number {
  return n * 1000;
}

describe('useExplanationRefresh (UC-10)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(T0);
    getItineraryById.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  function mount(itineraryId: number, itinerary: ItineraryDetailDto | null = detail(itineraryId, TEMPLATE)) {
    const onFresh = vi.fn();
    const view = renderHook(
      (props: { itinerary: ItineraryDetailDto | null }) =>
        useExplanationRefresh({ itineraryId, itinerary: props.itinerary, onFresh }),
      { initialProps: { itinerary } },
    );
    return { onFresh, ...view };
  }

  it('does nothing without a handoff', async () => {
    mount(800);

    await act(() => vi.advanceTimersByTimeAsync(seconds(200)));

    expect(getItineraryById).not.toHaveBeenCalled();
  });

  it('loads the detail at 20, 45, 75 and 110 seconds after the create, then stops', async () => {
    registerExplanationPending(createResponse(801), T0);
    getItineraryById.mockImplementation(async () => detail(801, TEMPLATE));
    const { onFresh } = mount(801);

    await act(() => vi.advanceTimersByTimeAsync(seconds(19.9)));
    expect(getItineraryById).toHaveBeenCalledTimes(0);
    await act(() => vi.advanceTimersByTimeAsync(seconds(0.1)));
    expect(getItineraryById).toHaveBeenCalledTimes(1);
    await act(() => vi.advanceTimersByTimeAsync(seconds(25)));
    expect(getItineraryById).toHaveBeenCalledTimes(2);
    await act(() => vi.advanceTimersByTimeAsync(seconds(30)));
    expect(getItineraryById).toHaveBeenCalledTimes(3);
    await act(() => vi.advanceTimersByTimeAsync(seconds(35)));
    expect(getItineraryById).toHaveBeenCalledTimes(4);
    await act(() => vi.advanceTimersByTimeAsync(seconds(300)));
    expect(getItineraryById).toHaveBeenCalledTimes(4);
    expect(getItineraryById).toHaveBeenCalledWith(801);
    expect(onFresh).not.toHaveBeenCalled();
  });

  it('measures the schedule from the create, so a delay already passed at mount is skipped', async () => {
    registerExplanationPending(createResponse(802), T0);
    getItineraryById.mockImplementation(async () => detail(802, TEMPLATE));
    vi.setSystemTime(T0 + seconds(30));
    mount(802);

    await act(() => vi.advanceTimersByTimeAsync(seconds(14.9)));
    expect(getItineraryById).toHaveBeenCalledTimes(0);
    await act(() => vi.advanceTimersByTimeAsync(seconds(0.1)));
    expect(getItineraryById).toHaveBeenCalledTimes(1);
    await act(() => vi.advanceTimersByTimeAsync(seconds(300)));
    expect(getItineraryById).toHaveBeenCalledTimes(3);
  });

  it('stops at once when a sentence changed and reports the fresh detail', async () => {
    registerExplanationPending(createResponse(803), T0);
    getItineraryById
      .mockResolvedValueOnce(detail(803, TEMPLATE))
      .mockResolvedValueOnce(detail(803, AI));
    const { onFresh } = mount(803);

    await act(() => vi.advanceTimersByTimeAsync(seconds(45)));

    expect(onFresh).toHaveBeenCalledTimes(1);
    expect(onFresh.mock.calls[0][0].items[0].friendlyExplanation).toBe(AI);

    await act(() => vi.advanceTimersByTimeAsync(seconds(300)));
    expect(getItineraryById).toHaveBeenCalledTimes(2);
    expect(onFresh).toHaveBeenCalledTimes(1);
  });

  it('ignores a failed attempt and still runs the later ones', async () => {
    registerExplanationPending(createResponse(804), T0);
    getItineraryById
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(detail(804, AI));
    const { onFresh } = mount(804);

    await act(() => vi.advanceTimersByTimeAsync(seconds(45)));

    expect(getItineraryById).toHaveBeenCalledTimes(2);
    expect(onFresh).toHaveBeenCalledTimes(1);
  });

  it('does not report a result that arrives after the page was left', async () => {
    registerExplanationPending(createResponse(805), T0);
    let resolve!: (value: ItineraryDetailDto) => void;
    getItineraryById.mockImplementationOnce(
      () => new Promise<ItineraryDetailDto>((r) => {
        resolve = r;
      }),
    );
    const { onFresh, unmount } = mount(805);

    await act(() => vi.advanceTimersByTimeAsync(seconds(20)));
    expect(getItineraryById).toHaveBeenCalledTimes(1);
    unmount();
    await act(async () => {
      resolve(detail(805, AI));
    });
    await act(() => vi.advanceTimersByTimeAsync(seconds(300)));

    expect(onFresh).not.toHaveBeenCalled();
    expect(getItineraryById).toHaveBeenCalledTimes(1);
  });

  it('leaves a handoff for another itinerary alone and makes no request', async () => {
    registerExplanationPending(createResponse(806), T0);
    mount(807);

    await act(() => vi.advanceTimersByTimeAsync(seconds(200)));

    expect(getItineraryById).not.toHaveBeenCalled();
    expect(takeExplanationPending(806)).not.toBeNull();
  });

  it('makes no request when the loaded detail already has the AI sentence', async () => {
    registerExplanationPending(createResponse(808), T0);
    mount(808, detail(808, AI));

    await act(() => vi.advanceTimersByTimeAsync(seconds(200)));

    expect(getItineraryById).not.toHaveBeenCalled();
  });

  it('makes no request when the page is opened after the last delay', async () => {
    registerExplanationPending(createResponse(809), T0);
    vi.setSystemTime(T0 + seconds(111));
    mount(809);

    await act(() => vi.advanceTimersByTimeAsync(seconds(200)));

    expect(getItineraryById).not.toHaveBeenCalled();
  });

  it('waits for the detail to load before it starts', async () => {
    registerExplanationPending(createResponse(810), T0);
    getItineraryById.mockImplementation(async () => detail(810, TEMPLATE));
    const { rerender } = mount(810, null);

    await act(() => vi.advanceTimersByTimeAsync(seconds(30)));
    expect(getItineraryById).not.toHaveBeenCalled();

    rerender({ itinerary: detail(810, TEMPLATE) });
    await act(() => vi.advanceTimersByTimeAsync(seconds(15)));

    expect(getItineraryById).toHaveBeenCalledTimes(1);
  });
});
