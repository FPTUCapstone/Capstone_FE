import { isRecord } from '@/lib/typeGuards';
import type { WeatherSafetyReview, WeatherSafetyReviewStatus } from './types';

export class WeatherSafetyReviewParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WeatherSafetyReviewParseError';
  }
}

const VALID_STATUSES: ReadonlySet<string> = new Set<WeatherSafetyReviewStatus>([
  'PendingAcknowledgement',
  'Escalated',
  'Acknowledged',
  'Closed',
]);

function isValidIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !value.trim()) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed);
}

export function parseWeatherSafetyReview(data: unknown): WeatherSafetyReview {
  if (!isRecord(data)) {
    throw new WeatherSafetyReviewParseError('Weather safety review payload must be a JSON object.');
  }

  const {
    id,
    tourScheduleId,
    tourId,
    tourTitle,
    scheduleStartAtUtc,
    scheduleEndAtUtc,
    scheduleStatus,
    provider,
    providerEventId,
    eventType,
    severity,
    description,
    validFromUtc,
    validToUtc,
    originalAuthority,
    officialVietnamRiskLevel,
    verifiedDirective,
    affectedAreaSummary,
    isWithdrawn,
    status,
    urgentNoticeSentAtUtc,
    acknowledgementDeadlineUtc,
    acknowledgedAtUtc,
    acknowledgedByOperatorId,
    escalatedAtUtc,
    escalationContact,
    immediateInstructions,
    createdAtUtc,
  } = data;

  if (typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0) {
    throw new WeatherSafetyReviewParseError(`Invalid review id: ${String(id)}`);
  }
  if (typeof tourScheduleId !== 'number' || !Number.isSafeInteger(tourScheduleId) || tourScheduleId <= 0) {
    throw new WeatherSafetyReviewParseError(`Invalid tourScheduleId: ${String(tourScheduleId)}`);
  }
  if (typeof tourId !== 'number' || !Number.isSafeInteger(tourId) || tourId <= 0) {
    throw new WeatherSafetyReviewParseError(`Invalid tourId: ${String(tourId)}`);
  }
  if (typeof tourTitle !== 'string' || !tourTitle.trim()) {
    throw new WeatherSafetyReviewParseError('tourTitle must be a non-empty string.');
  }

  if (!isValidIsoDate(scheduleStartAtUtc)) {
    throw new WeatherSafetyReviewParseError('scheduleStartAtUtc must be a valid ISO date string.');
  }
  if (!isValidIsoDate(scheduleEndAtUtc)) {
    throw new WeatherSafetyReviewParseError('scheduleEndAtUtc must be a valid ISO date string.');
  }
  if (typeof scheduleStatus !== 'string' || !scheduleStatus.trim()) {
    throw new WeatherSafetyReviewParseError('scheduleStatus must be a string.');
  }

  if (typeof provider !== 'string' || !provider.trim()) {
    throw new WeatherSafetyReviewParseError('provider must be a non-empty string.');
  }
  if (typeof providerEventId !== 'string' || !providerEventId.trim()) {
    throw new WeatherSafetyReviewParseError('providerEventId must be a non-empty string.');
  }

  if (typeof status !== 'string' || !VALID_STATUSES.has(status)) {
    throw new WeatherSafetyReviewParseError(`Invalid weather safety review status: ${String(status)}`);
  }

  if (!isValidIsoDate(urgentNoticeSentAtUtc)) {
    throw new WeatherSafetyReviewParseError('urgentNoticeSentAtUtc must be a valid ISO date string.');
  }
  if (!isValidIsoDate(acknowledgementDeadlineUtc)) {
    throw new WeatherSafetyReviewParseError('acknowledgementDeadlineUtc must be a valid ISO date string.');
  }
  if (!isValidIsoDate(createdAtUtc)) {
    throw new WeatherSafetyReviewParseError('createdAtUtc must be a valid ISO date string.');
  }

  return {
    id,
    tourScheduleId,
    tourId,
    tourTitle: tourTitle.trim(),
    scheduleStartAtUtc,
    scheduleEndAtUtc,
    scheduleStatus,
    provider: provider.trim(),
    providerEventId: providerEventId.trim(),

    eventType: typeof eventType === 'string' ? eventType.trim() : null,
    severity: typeof severity === 'string' ? severity.trim() : null,
    description: typeof description === 'string' ? description.trim() : null,
    validFromUtc: isValidIsoDate(validFromUtc) ? validFromUtc : null,
    validToUtc: isValidIsoDate(validToUtc) ? validToUtc : null,
    originalAuthority: typeof originalAuthority === 'string' ? originalAuthority.trim() : null,
    officialVietnamRiskLevel: typeof officialVietnamRiskLevel === 'number' ? officialVietnamRiskLevel : null,
    verifiedDirective: typeof verifiedDirective === 'string' ? verifiedDirective.trim() : null,
    affectedAreaSummary: typeof affectedAreaSummary === 'string' ? affectedAreaSummary.trim() : null,
    isWithdrawn: Boolean(isWithdrawn),

    status: status as WeatherSafetyReviewStatus,

    urgentNoticeSentAtUtc,
    acknowledgementDeadlineUtc,
    acknowledgedAtUtc: isValidIsoDate(acknowledgedAtUtc) ? acknowledgedAtUtc : null,
    acknowledgedByOperatorId: typeof acknowledgedByOperatorId === 'number' ? acknowledgedByOperatorId : null,
    escalatedAtUtc: isValidIsoDate(escalatedAtUtc) ? escalatedAtUtc : null,
    escalationContact: typeof escalationContact === 'string' ? escalationContact.trim() : null,
    immediateInstructions: typeof immediateInstructions === 'string' ? immediateInstructions.trim() : null,
    createdAtUtc,
  };
}

export function parseWeatherSafetyReviewList(data: unknown): WeatherSafetyReview[] {
  if (!Array.isArray(data)) {
    throw new WeatherSafetyReviewParseError('Weather safety review list must be an array.');
  }
  return data.map(parseWeatherSafetyReview);
}
