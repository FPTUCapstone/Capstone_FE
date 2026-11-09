import { describe, it, expect } from 'vitest';
import {
  parseWeatherSafetyReview,
  parseWeatherSafetyReviewList,
  WeatherSafetyReviewParseError,
} from '../parsers';

const validRawReview = {
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

describe('Weather Safety Review Parsers', () => {
  it('parses valid enriched review with all fields', () => {
    const parsed = parseWeatherSafetyReview(validRawReview);
    expect(parsed.id).toBe(101);
    expect(parsed.tourScheduleId).toBe(202);
    expect(parsed.tourTitle).toBe('Bà Nà Hills Discovery');
    expect(parsed.officialVietnamRiskLevel).toBe(3);
    expect(parsed.status).toBe('PendingAcknowledgement');
    expect(parsed.isWithdrawn).toBe(false);
  });

  it('accepts null for optional weather fields', () => {
    const rawWithNulls = {
      ...validRawReview,
      eventType: null,
      severity: null,
      description: null,
      validFromUtc: null,
      validToUtc: null,
      originalAuthority: null,
      officialVietnamRiskLevel: null,
      verifiedDirective: null,
      affectedAreaSummary: null,
    };
    const parsed = parseWeatherSafetyReview(rawWithNulls);
    expect(parsed.eventType).toBeNull();
    expect(parsed.severity).toBeNull();
    expect(parsed.officialVietnamRiskLevel).toBeNull();
  });

  it('rejects missing required field', () => {
    const missingTitle = { ...validRawReview, tourTitle: undefined };
    expect(() => parseWeatherSafetyReview(missingTitle)).toThrow(WeatherSafetyReviewParseError);
  });

  it('rejects invalid status', () => {
    const invalidStatus = { ...validRawReview, status: 'InvalidStatus' };
    expect(() => parseWeatherSafetyReview(invalidStatus)).toThrow(WeatherSafetyReviewParseError);
  });

  it('rejects invalid date string for required date fields', () => {
    const invalidDate = { ...validRawReview, acknowledgementDeadlineUtc: 'not-a-date' };
    expect(() => parseWeatherSafetyReview(invalidDate)).toThrow(WeatherSafetyReviewParseError);
  });

  it('parses a list of reviews successfully', () => {
    const list = parseWeatherSafetyReviewList([validRawReview]);
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(101);
  });

  it('throws when list payload is not an array', () => {
    expect(() => parseWeatherSafetyReviewList({ invalid: true })).toThrow(WeatherSafetyReviewParseError);
  });
});
