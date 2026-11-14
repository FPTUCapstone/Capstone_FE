import { isRecord } from '@/lib/typeGuards';
import type {
  EmergencyTourImpactResponse,
  EmergencyTourActionResponse,
  AddEmergencyTourEvidenceResponse,
  EmergencyTourEvidenceResponse,
} from './types';

export class EmergencyTourParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmergencyTourParseError';
  }
}

function isValidIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !value.trim()) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed);
}

export function parseEmergencyTourImpactResponse(data: unknown): EmergencyTourImpactResponse {
  if (!isRecord(data)) {
    throw new EmergencyTourParseError('Emergency impact response must be an object.');
  }

  const {
    tourId,
    scheduleId,
    action,
    scheduleStatus,
    paidBookingCount,
    unpaidBookingCount,
    totalPassengerCount,
    activeSessionCount,
    unusedTicketCount,
    hasUnverifiedSessions,
    impactVersion,
  } = data;

  if (typeof tourId !== 'number' || typeof scheduleId !== 'number') {
    throw new EmergencyTourParseError('tourId and scheduleId must be numbers.');
  }
  if (typeof action !== 'string' || !action.trim()) {
    throw new EmergencyTourParseError('action must be a non-empty string.');
  }
  if (typeof scheduleStatus !== 'string' || !scheduleStatus.trim()) {
    throw new EmergencyTourParseError('scheduleStatus must be a non-empty string.');
  }
  if (
    typeof paidBookingCount !== 'number' ||
    typeof unpaidBookingCount !== 'number' ||
    typeof totalPassengerCount !== 'number' ||
    typeof activeSessionCount !== 'number' ||
    typeof unusedTicketCount !== 'number'
  ) {
    throw new EmergencyTourParseError('Impact counts and estimates must be numbers.');
  }
  if (typeof hasUnverifiedSessions !== 'boolean') {
    throw new EmergencyTourParseError('hasUnverifiedSessions must be a boolean.');
  }
  if (typeof impactVersion !== 'string' || !impactVersion.trim()) {
    throw new EmergencyTourParseError('impactVersion must be a non-empty string.');
  }

  return {
    tourId,
    scheduleId,
    action: action.trim(),
    scheduleStatus: scheduleStatus.trim(),
    paidBookingCount,
    unpaidBookingCount,
    totalPassengerCount,
    activeSessionCount,
    unusedTicketCount,
    hasUnverifiedSessions,
    impactVersion: impactVersion.trim(),
  };
}

export function parseEmergencyTourActionResponse(data: unknown): EmergencyTourActionResponse {
  if (!isRecord(data)) {
    throw new EmergencyTourParseError('Emergency action response must be an object.');
  }

  const {
    operationId,
    tourScheduleId,
    action,
    scheduleStatus,
    affectedBookingCount,
    committedAtUtc,
  } = data;

  if (
    typeof operationId !== 'number' ||
    typeof tourScheduleId !== 'number' ||
    typeof affectedBookingCount !== 'number'
  ) {
    throw new EmergencyTourParseError('Numeric fields in emergency action response must be numbers.');
  }
  if (typeof action !== 'string' || typeof scheduleStatus !== 'string') {
    throw new EmergencyTourParseError('action and scheduleStatus must be strings.');
  }
  if (!isValidIsoDate(committedAtUtc)) {
    throw new EmergencyTourParseError('committedAtUtc must be a valid ISO date string.');
  }

  const refundsSubmitted = optionalCount(data.refundsSubmitted, 'refundsSubmitted');

  return {
    operationId,
    tourScheduleId,
    action: action.trim(),
    scheduleStatus: scheduleStatus.trim(),
    affectedBookingCount,
    ...(refundsSubmitted === undefined ? {} : { refundsSubmitted }),
    committedAtUtc,
  };
}

function optionalCount(value: unknown, field: string): number | undefined {
  if (value === null || value === undefined) return undefined;
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new EmergencyTourParseError(`${field} must be a non-negative whole number.`);
  }
  return value as number;
}

function optionalText(value: unknown, field: string): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') {
    throw new EmergencyTourParseError(`${field} must be a string or null.`);
  }
  return value;
}

export function parseEmergencyTourEvidenceResponse(data: unknown): EmergencyTourEvidenceResponse {
  if (!isRecord(data)) {
    throw new EmergencyTourParseError('Emergency evidence response must be an object.');
  }
  const { operationId, evidenceProvenance, evidenceAddedLater, evidenceVersion } = data;
  if (typeof operationId !== 'number') {
    throw new EmergencyTourParseError('operationId must be a number.');
  }
  if (typeof evidenceProvenance !== 'string') {
    throw new EmergencyTourParseError('evidenceProvenance must be a string.');
  }
  if (typeof evidenceAddedLater !== 'boolean') {
    throw new EmergencyTourParseError('evidenceAddedLater must be a boolean.');
  }
  if (typeof evidenceVersion !== 'string' || evidenceVersion.length === 0) {
    throw new EmergencyTourParseError('evidenceVersion must be a non-empty string.');
  }
  return {
    operationId,
    evidenceUrl: optionalText(data.evidenceUrl, 'evidenceUrl'),
    authorityReference: optionalText(data.authorityReference, 'authorityReference'),
    evidenceReference: optionalText(data.evidenceReference, 'evidenceReference'),
    evidenceProvenance,
    evidenceAddedLater,
    evidenceVersion,
  };
}

export function parseAddEmergencyTourEvidenceResponse(data: unknown): AddEmergencyTourEvidenceResponse {
  if (!isRecord(data)) {
    throw new EmergencyTourParseError('Add emergency evidence response must be an object.');
  }

  const { operationId, evidenceProvenance, evidenceAddedLater, updatedAtUtc } = data;

  if (typeof operationId !== 'number') {
    throw new EmergencyTourParseError('operationId must be a number.');
  }
  if (typeof evidenceProvenance !== 'string') {
    throw new EmergencyTourParseError('evidenceProvenance must be a string.');
  }
  if (typeof evidenceAddedLater !== 'boolean') {
    throw new EmergencyTourParseError('evidenceAddedLater must be a boolean.');
  }
  if (!isValidIsoDate(updatedAtUtc)) {
    throw new EmergencyTourParseError('updatedAtUtc must be a valid ISO date string.');
  }

  return {
    operationId,
    evidenceProvenance: evidenceProvenance.trim(),
    evidenceAddedLater,
    updatedAtUtc,
  };
}
