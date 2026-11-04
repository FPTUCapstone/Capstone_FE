import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  listWeatherSafetyReviews,
  getWeatherSafetyReview,
  acknowledgeWeatherSafetyReview,
  getWeatherSafetyReviewBadgeCount,
} from '../weatherSafetyApi';
import { AuthStorage } from '@/features/auth/session/authSession';

const mockReview = {
  id: 101,
  tourScheduleId: 202,
  tourId: 303,
  tourTitle: 'Bà Nà Hills Discovery',
  scheduleStartAtUtc: '2026-11-03T01:00:00Z',
  scheduleEndAtUtc: '2026-11-03T10:00:00Z',
  scheduleStatus: 'Scheduled',
  provider: 'Tomorrow.io',
  providerEventId: 'evt-storm-01',
  eventType: 'TropicalStorm',
  severity: 'Severe',
  description: 'Heavy rain and wind expected.',
  validFromUtc: '2026-11-03T00:00:00Z',
  validToUtc: '2026-11-03T12:00:00Z',
  originalAuthority: 'NCHMF',
  officialVietnamRiskLevel: 3,
  verifiedDirective: 'TravelProhibition',
  affectedAreaSummary: 'Da Nang coastal region',
  isWithdrawn: false,
  status: 'PendingAcknowledgement',
  urgentNoticeSentAtUtc: '2026-11-02T12:00:00Z',
  acknowledgementDeadlineUtc: '2026-11-02T14:00:00Z',
  acknowledgedAtUtc: null,
  acknowledgedByOperatorId: null,
  escalatedAtUtc: null,
  escalationContact: null,
  immediateInstructions: null,
  createdAtUtc: '2026-11-02T12:00:00Z',
};

describe('Weather Safety Review API', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(AuthStorage, 'getAccessToken').mockReturnValue('mock-jwt-token');
  });

  it('listWeatherSafetyReviews calls correct endpoint with status query and returns parsed list', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify([mockReview]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const result = await listWeatherSafetyReviews('PendingAcknowledgement');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(101);

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/operator/weather-safety-reviews?status=PendingAcknowledgement'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer mock-jwt-token',
        }),
      })
    );
  });

  it('getWeatherSafetyReview calls correct detail endpoint and returns parsed review', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockReview), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const result = await getWeatherSafetyReview(101);
    expect(result.id).toBe(101);
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/operator/weather-safety-reviews/101'),
      expect.any(Object)
    );
  });

  it('acknowledgeWeatherSafetyReview sends POST with immediateInstructions in body', async () => {
    const acknowledgedReview = {
      ...mockReview,
      status: 'Acknowledged',
      acknowledgedAtUtc: '2026-11-02T12:30:00Z',
      immediateInstructions: 'Keep emergency hotlines ready',
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(acknowledgedReview), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const result = await acknowledgeWeatherSafetyReview(101, {
      immediateInstructions: 'Keep emergency hotlines ready',
    });
    expect(result.status).toBe('Acknowledged');

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/operator/weather-safety-reviews/101/acknowledge'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ immediateInstructions: 'Keep emergency hotlines ready' }),
      })
    );
  });

  it('getWeatherSafetyReviewBadgeCount fetches all reviews and counts PendingAcknowledgement + Escalated', async () => {
    const reviews = [
      mockReview,
      { ...mockReview, id: 102, status: 'Escalated' },
      { ...mockReview, id: 103, status: 'Acknowledged' },
      { ...mockReview, id: 104, status: 'Closed' },
    ];

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(reviews), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const badgeCount = await getWeatherSafetyReviewBadgeCount();
    expect(badgeCount).toBe(2);
  });

  it('throws typed error when response is malformed non-JSON or missing fields', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('not-valid-json', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      })
    );

    await expect(getWeatherSafetyReview(101)).rejects.toThrow();
  });
});
