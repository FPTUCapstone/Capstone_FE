export type WeatherSafetyReviewStatus =
  | 'PendingAcknowledgement'
  | 'Escalated'
  | 'Acknowledged'
  | 'Closed';

export interface WeatherSafetyReview {
  readonly id: number;
  readonly tourScheduleId: number;
  readonly tourId: number;
  readonly tourTitle: string;

  readonly scheduleStartAtUtc: string;
  readonly scheduleEndAtUtc: string;
  readonly scheduleStatus: string;

  readonly provider: string;
  readonly providerEventId: string;

  readonly eventType: string | null;
  readonly severity: string | null;
  readonly description: string | null;
  readonly validFromUtc: string | null;
  readonly validToUtc: string | null;
  readonly originalAuthority: string | null;
  readonly officialVietnamRiskLevel: number | null;
  readonly verifiedDirective: string | null;
  readonly affectedAreaSummary: string | null;
  readonly isWithdrawn: boolean;

  readonly status: WeatherSafetyReviewStatus;

  readonly urgentNoticeSentAtUtc: string;
  readonly acknowledgementDeadlineUtc: string;
  readonly acknowledgedAtUtc: string | null;
  readonly acknowledgedByOperatorId: number | null;
  readonly escalatedAtUtc: string | null;
  readonly escalationContact: string | null;
  readonly immediateInstructions: string | null;
  readonly createdAtUtc: string;
}

export interface AcknowledgeReviewRequest {
  readonly immediateInstructions?: string | null;
}

export type WeatherSafetyReviewChangeType = 'Created' | 'Updated' | 'Escalated' | 'Closed';

export interface WeatherSafetyReviewChanged {
  readonly reviewId: number;
  readonly tourScheduleId: number;
  readonly changeType: WeatherSafetyReviewChangeType;
  readonly occurredAtUtc: string;
}
