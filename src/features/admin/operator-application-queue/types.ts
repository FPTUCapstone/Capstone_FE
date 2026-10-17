/**
 * Row of the pending Tour Operator applications list (Screen #10).
 *
 * `submittedAtUtc` is part of the proposed Backend contract only: the current application
 * detail DTO does not carry a submission date, so it is nullable and never invented.
 */
export interface PendingOperatorApplication {
  readonly userId: number;
  readonly companyName: string;
  readonly taxCode: string;
  readonly businessLicenseNumber: string;
  readonly submittedAtUtc: string | null;
}

export interface OperatorApplicationQueueQuery {
  readonly page: number;
  readonly keyword: string;
}

export type PendingOperatorApplicationsResult =
  | { readonly status: 'NO_BACKEND' }
  | {
      readonly status: 'DEMO';
      readonly items: readonly PendingOperatorApplication[];
      readonly totalCount: number;
      readonly page: number;
      readonly pageSize: number;
      readonly totalPages: number;
    };
