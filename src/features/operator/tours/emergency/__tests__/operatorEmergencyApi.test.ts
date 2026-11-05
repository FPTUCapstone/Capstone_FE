import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getEmergencyImpact,
  cancelBeforeDeparture,
  emergencyStopActive,
  addEmergencyEvidence,
  getEmergencyEvidence,
} from '../operatorEmergencyApi';
import { AuthStorage } from '@/features/auth/session/authSession';

describe('Operator Emergency API', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(AuthStorage, 'getAccessToken').mockReturnValue('mock-jwt-token');
  });

  it('getEmergencyImpact sends GET to correct endpoint with authorization', async () => {
    const rawImpact = {
      tourId: 10,
      scheduleId: 20,
      action: 'CancelBeforeDeparture',
      scheduleStatus: 'Scheduled',
      paidBookingCount: 2,
      unpaidBookingCount: 1,
      totalPassengerCount: 4,
      activeSessionCount: 0,
      unusedTicketCount: 4,
      hasUnverifiedSessions: false,
      impactVersion: 'version-abc',
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(rawImpact), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const result = await getEmergencyImpact(10, 20);
    expect(result.action).toBe('CancelBeforeDeparture');
    expect(result.impactVersion).toBe('version-abc');

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/operator/tours/10/schedules/20/emergency-impact'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer mock-jwt-token',
        }),
      })
    );
  });

  it('cancelBeforeDeparture sends POST with Idempotency-Key header and request body', async () => {
    const rawActionResponse = {
      operationId: 55,
      tourScheduleId: 20,
      action: 'CancelBeforeDeparture',
      scheduleStatus: 'Cancelled',
      affectedBookingCount: 3,
      committedAtUtc: '2026-11-02T12:00:00Z',
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(rawActionResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const payload = {
      impactVersion: 'version-abc',
      reason: 'WeatherEmergency' as const,
      reasonDetails: 'Severe typhoon approaching',
      authorityReference: 'NCHMF-WARN-01',
    };

    const result = await cancelBeforeDeparture(10, 20, payload, '00000000-0000-0000-0000-000000000001');
    expect(result.operationId).toBe(55);
    expect(result.scheduleStatus).toBe('Cancelled');

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/operator/tours/10/schedules/20/cancel-before-departure'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Idempotency-Key': '00000000-0000-0000-0000-000000000001',
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-jwt-token',
        }),
        body: JSON.stringify(payload),
      })
    );
  });

  it('emergencyStopActive explains a throttled attempt without mentioning the credential', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ title: 'Too many requests.', status: 429 }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    await expect(
      emergencyStopActive(
        10,
        20,
        {
          impactVersion: 'version-abc',
          currentPassword: 'OperatorPassword123!',
          reason: 'SafetyIncident' as const,
          reasonDetails: 'Road blockage',
          immediateInstructions: 'Return to meeting point',
          emergencyContact: '+84901234567',
        },
        '00000000-0000-0000-0000-000000000001'
      )
    ).rejects.toMatchObject({ status: 429, message: expect.stringMatching(/quá nhiều lần/i) });
  });

  it('emergencyStopActive sends POST with Idempotency-Key, currentPassword, and emergency contact', async () => {
    const rawActionResponse = {
      operationId: 56,
      tourScheduleId: 20,
      action: 'EmergencyStopActive',
      scheduleStatus: 'EmergencyStopped',
      affectedBookingCount: 3,
      committedAtUtc: '2026-11-02T12:00:00Z',
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(rawActionResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const payload = {
      impactVersion: 'version-abc',
      currentPassword: 'OperatorPassword123!',
      reason: 'SafetyIncident' as const,
      reasonDetails: 'Road blockage due to landslide',
      immediateInstructions: 'Return to meeting point immediately',
      emergencyContact: '+84901234567',
    };

    const result = await emergencyStopActive(10, 20, payload, '00000000-0000-0000-0000-000000000002');
    expect(result.operationId).toBe(56);
    expect(result.scheduleStatus).toBe('EmergencyStopped');

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/operator/tours/10/schedules/20/emergency-stop'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Idempotency-Key': '00000000-0000-0000-0000-000000000002',
          Authorization: 'Bearer mock-jwt-token',
        }),
      })
    );
  });

  it('getEmergencyEvidence reads the current evidence and its version', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          operationId: 55,
          evidenceUrl: null,
          authorityReference: 'NCHMF-DOC-02',
          evidenceReference: null,
          evidenceProvenance: 'OperatorProvided',
          evidenceAddedLater: false,
          evidenceVersion: 'version-1',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const result = await getEmergencyEvidence(10, 20);

    expect(result.evidenceVersion).toBe('version-1');
    expect(result.authorityReference).toBe('NCHMF-DOC-02');
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/operator/tours/10/schedules/20/emergency-evidence'),
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('addEmergencyEvidence sends PUT with evidence fields or withdraw flag', async () => {
    const rawEvidenceResponse = {
      operationId: 55,
      evidenceProvenance: 'OperatorProvided',
      evidenceAddedLater: false,
      updatedAtUtc: '2026-11-02T13:00:00Z',
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(rawEvidenceResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const payload = {
      evidenceUrl: 'https://example.com/evidence.pdf',
      authorityReference: 'NCHMF-DOC-02',
      withdrawEvidence: false,
      expectedVersion: 'version-1',
    };

    const result = await addEmergencyEvidence(10, 20, payload);
    expect(result.operationId).toBe(55);

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/operator/tours/10/schedules/20/emergency-evidence'),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(payload),
      })
    );
  });
});
