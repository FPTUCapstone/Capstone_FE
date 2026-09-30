export type UserRole = 'Traveler' | 'TourOperator' | 'Administrator';
export type AuditLogResult = 'Success' | 'Failure';

export interface AuditLogSummaryDto {
  id: number;
  result: AuditLogResult | null;
  actionType: string;
  actorUserId: number | null;
  actorEmail: string | null;
  actorFullName: string | null;
  actorRole: UserRole | null;
  affectedEntity: string;
  affectedEntityId: number | null;
  ipAddress: string | null;
  createdAtUtc: string;
  createdAtLocal: string;
}

export interface PaginatedList<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface GetAuditLogsParams {
  keyword?: string;
  actionType?: string;
  actorRole?: UserRole;
  affectedEntity?: string;
  fromDateUtc?: string;
  toDateUtc?: string;
  pageNumber?: number;
  pageSize?: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isSafeId(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) > 0;
}

function isNullableSafeId(value: unknown): value is number | null {
  return value === null || isSafeId(value);
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function isUserRole(value: unknown): value is UserRole {
  return value === 'Traveler' || value === 'TourOperator' || value === 'Administrator';
}

function isAuditLogResult(value: unknown): value is AuditLogResult {
  return value === 'Success' || value === 'Failure';
}

export function isAuditLogSummary(value: unknown): value is AuditLogSummaryDto {
  if (!isRecord(value)) return false;

  return (
    isSafeId(value.id) &&
    (value.result === null || isAuditLogResult(value.result)) &&
    typeof value.actionType === 'string' &&
    isNullableSafeId(value.actorUserId) &&
    isNullableString(value.actorEmail) &&
    isNullableString(value.actorFullName) &&
    (value.actorRole === null || isUserRole(value.actorRole)) &&
    typeof value.affectedEntity === 'string' &&
    isNullableSafeId(value.affectedEntityId) &&
    isNullableString(value.ipAddress) &&
    typeof value.createdAtUtc === 'string' &&
    typeof value.createdAtLocal === 'string'
  );
}

export function isAuditLogPage(value: unknown): value is PaginatedList<AuditLogSummaryDto> {
  if (!isRecord(value) || !Array.isArray(value.items)) return false;

  return (
    value.items.every(isAuditLogSummary) &&
    Number.isSafeInteger(value.pageNumber) &&
    (value.pageNumber as number) >= 1 &&
    Number.isSafeInteger(value.pageSize) &&
    (value.pageSize as number) >= 1 &&
    Number.isSafeInteger(value.totalCount) &&
    (value.totalCount as number) >= 0 &&
    Number.isSafeInteger(value.totalPages) &&
    (value.totalPages as number) >= 0 &&
    typeof value.hasPreviousPage === 'boolean' &&
    typeof value.hasNextPage === 'boolean'
  );
}
