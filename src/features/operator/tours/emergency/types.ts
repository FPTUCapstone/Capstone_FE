export type EmergencyTourReason =
  | 'WeatherEmergency'
  | 'AuthorityDirective'
  | 'DestinationUnavailable'
  | 'TransportFailure'
  | 'SafetyIncident'
  | 'Other';

export interface EmergencyTourImpactResponse {
  readonly tourId: number;
  readonly scheduleId: number;
  readonly action: string;
  readonly scheduleStatus: string;
  readonly paidBookingCount: number;
  readonly unpaidBookingCount: number;
  readonly totalPassengerCount: number;
  readonly activeSessionCount: number;
  readonly unusedTicketCount: number;
  readonly hasUnverifiedSessions: boolean;
  readonly impactVersion: string;
}

export interface CancelBeforeDepartureRequest {
  readonly impactVersion: string;
  readonly reason: EmergencyTourReason;
  readonly reasonDetails: string;
  readonly emergencyContact?: string | null;
  readonly evidenceReference?: string | null;
  readonly evidenceUrl?: string | null;
  readonly authorityReference?: string | null;
  readonly addEvidenceLater?: boolean;
}

export interface EmergencyStopActiveRequest {
  readonly impactVersion: string;
  readonly currentPassword: string;
  readonly reason: EmergencyTourReason;
  readonly reasonDetails: string;
  readonly immediateInstructions: string;
  readonly emergencyContact: string;
  readonly evidenceReference?: string | null;
  readonly evidenceUrl?: string | null;
  readonly authorityReference?: string | null;
  readonly addEvidenceLater?: boolean;
}

export interface EmergencyTourActionResponse {
  readonly operationId: number;
  readonly tourScheduleId: number;
  readonly action: string;
  readonly scheduleStatus: string;
  readonly affectedBookingCount: number;
  /** 100% refund requests created by a cancellation (0 for a stop). Older Backends omit it. */
  readonly refundsSubmitted?: number;
  readonly committedAtUtc: string;
}

export interface AddEmergencyTourEvidenceRequest {
  readonly evidenceUrl?: string | null;
  readonly authorityReference?: string | null;
  readonly evidenceReference?: string | null;
  readonly withdrawEvidence?: boolean;
  /** The version read from the Backend; a save based on older evidence is rejected. */
  readonly expectedVersion: string;
}

export interface EmergencyTourEvidenceResponse {
  readonly operationId: number;
  readonly evidenceUrl: string | null;
  readonly authorityReference: string | null;
  readonly evidenceReference: string | null;
  readonly evidenceProvenance: string;
  readonly evidenceAddedLater: boolean;
  readonly evidenceVersion: string;
}

export interface AddEmergencyTourEvidenceResponse {
  readonly operationId: number;
  readonly evidenceProvenance: string;
  readonly evidenceAddedLater: boolean;
  readonly updatedAtUtc: string;
}
