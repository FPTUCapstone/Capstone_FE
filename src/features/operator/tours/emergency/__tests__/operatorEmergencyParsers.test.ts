import { describe, it, expect } from 'vitest';
import {
  parseEmergencyTourImpactResponse,
  parseEmergencyTourActionResponse,
  parseAddEmergencyTourEvidenceResponse,
  EmergencyTourParseError,
} from '../parsers';

describe('Operator Emergency Parsers', () => {
  it('parses valid impact response correctly', () => {
    const raw = {
      tourId: 10,
      scheduleId: 20,
      action: 'CancelBeforeDeparture',
      scheduleStatus: 'Scheduled',
      paidBookingCount: 5,
      unpaidBookingCount: 2,
      totalPassengerCount: 15,
      activeSessionCount: 0,
      unusedTicketCount: 15,
      hasUnverifiedSessions: false,
      impactVersion: 'hash-version-123',
    };

    const parsed = parseEmergencyTourImpactResponse(raw);
    expect(parsed.tourId).toBe(10);
    expect(parsed.action).toBe('CancelBeforeDeparture');
    expect(parsed.hasUnverifiedSessions).toBe(false);
    expect(parsed.impactVersion).toBe('hash-version-123');
  });

  it('rejects impact response missing impactVersion or required counts', () => {
    const raw = {
      tourId: 10,
      scheduleId: 20,
      action: 'CancelBeforeDeparture',
    };
    expect(() => parseEmergencyTourImpactResponse(raw)).toThrow(EmergencyTourParseError);
  });

  it('parses emergency action response', () => {
    const raw = {
      operationId: 99,
      tourScheduleId: 20,
      action: 'CancelBeforeDeparture',
      scheduleStatus: 'Cancelled',
      affectedBookingCount: 7,
      committedAtUtc: '2026-11-02T12:00:00Z',
    };

    const parsed = parseEmergencyTourActionResponse(raw);
    expect(parsed.operationId).toBe(99);
    expect(parsed.scheduleStatus).toBe('Cancelled');
  });

  it('parses add emergency evidence response', () => {
    const raw = {
      operationId: 99,
      evidenceProvenance: 'OperatorProvided',
      evidenceAddedLater: false,
      updatedAtUtc: '2026-11-02T12:30:00Z',
    };

    const parsed = parseAddEmergencyTourEvidenceResponse(raw);
    expect(parsed.operationId).toBe(99);
    expect(parsed.evidenceProvenance).toBe('OperatorProvided');
    expect(parsed.evidenceAddedLater).toBe(false);
  });
});
