import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ViewSuggestedItineraryPage } from '../components/ViewSuggestedItineraryPage';
import * as schedulingApi from '../services/schedulingApi';
import type { ItineraryDetailDto, SchedulingResponseDto } from '../types/schedulingTypes';
import { registerExplanationPending } from '../utils/explanationRefresh';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, replace: mocks.replace }),
}));

const mockUseWebSession = vi.fn();

vi.mock('@/features/auth/session/useWebSession', () => ({
  useWebSession: () => mockUseWebSession(),
}));

vi.mock('@/components/navigation/PublicNavigation', () => ({
  PublicNavigation: () => <nav data-testid="public-navigation">Public Navigation</nav>,
}));

const T0 = new Date('2026-11-17T10:00:00Z').getTime();
const TEMPLATE = 'Câu mẫu cho Bảo tàng Chăm';
const AI = 'Câu AI viết riêng cho Bảo tàng Chăm';

function detail(itineraryId: number, sentence: string): ItineraryDetailDto {
  return {
    schedulingRequestId: 55,
    itineraryId,
    title: 'Lịch trình khám phá Đà Nẵng',
    version: 1,
    status: 'Draft',
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
        isMandatory: false,
        recommendationReason: 'Di sản phong phú',
        friendlyExplanation: sentence,
        isUnavailable: false,
      },
    ],
  };
}

function createResponse(itineraryId: number): SchedulingResponseDto {
  return {
    schedulingRequestId: 55,
    itineraryId,
    title: 'Lịch trình khám phá Đà Nẵng',
    status: 'Draft',
    totalEstimatedCost: 250000,
    totalDurationMinutes: 480,
    explanationPending: true,
    items: [
      {
        sequenceNo: 1,
        poiId: 101,
        poiName: 'Bảo tàng Điêu khắc Chăm',
        itemKind: 'Visit',
        plannedArrival: '2026-10-20T08:00:00+07:00',
        plannedDeparture: '2026-10-20T09:00:00+07:00',
        stayDurationMinutes: 60,
        travelDurationToNextMinutes: null,
        estimatedCost: 60000,
        isMandatory: false,
        recommendationReason: 'Di sản phong phú',
        friendlyExplanation: TEMPLATE,
      },
    ],
  };
}

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

describe('ViewSuggestedItineraryPage explanation refresh (UC-10)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(T0);
    vi.clearAllMocks();
    mockUseWebSession.mockReturnValue({
      status: 'authenticated',
      context: { userId: 1, role: 'Traveler', accessToken: 'mock-token' },
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('shows the AI sentence once the detail has it, and stops loading', async () => {
    registerExplanationPending(createResponse(901), T0);
    const spy = vi
      .spyOn(schedulingApi, 'getItineraryById')
      .mockResolvedValueOnce(detail(901, TEMPLATE))
      .mockResolvedValueOnce(detail(901, TEMPLATE))
      .mockResolvedValue(detail(901, AI));

    render(<ViewSuggestedItineraryPage itineraryId="901" />);
    await advance(0);
    expect(screen.getByText(TEMPLATE)).toBeTruthy();
    expect(spy).toHaveBeenCalledTimes(1);

    await advance(20_000);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(screen.getByText(TEMPLATE)).toBeTruthy();

    await advance(25_000);
    expect(spy).toHaveBeenCalledTimes(3);
    expect(screen.getByText(AI)).toBeTruthy();
    expect(screen.queryByText(TEMPLATE)).toBeNull();
    expect(screen.queryByText('Di sản phong phú')).toBeNull();

    await advance(200_000);
    expect(spy).toHaveBeenCalledTimes(3);
  });

  it('makes no extra request when the itinerary was not created as pending', async () => {
    const spy = vi.spyOn(schedulingApi, 'getItineraryById').mockResolvedValue(detail(902, AI));

    render(<ViewSuggestedItineraryPage itineraryId="902" />);
    await advance(200_000);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(screen.getByText(AI)).toBeTruthy();
  });

  it('does not use a pending entry that belongs to another itinerary', async () => {
    registerExplanationPending(createResponse(903), T0);
    const spy = vi.spyOn(schedulingApi, 'getItineraryById').mockResolvedValue(detail(904, TEMPLATE));

    render(<ViewSuggestedItineraryPage itineraryId="904" />);
    await advance(200_000);

    expect(spy).toHaveBeenCalledTimes(1);
  });
});
