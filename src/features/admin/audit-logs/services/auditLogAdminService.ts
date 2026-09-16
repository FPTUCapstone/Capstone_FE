import { GetAuditLogsParams, PaginatedList, AuditLogSummaryDto, AuditLogDetailDto } from '../types/auditLogAdmin';
import { getApiBase } from '@/lib/authApi';

export class AuditLogServiceError extends Error {
  statusCode?: number;
  errorCode?: string;

  constructor(message: string, statusCode?: number, errorCode?: string) {
    super(message);
    this.name = 'AuditLogServiceError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('tripmate_access_token');
}

function buildAuthorizedHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const token = getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

function clearStoredTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('tripmate_access_token');
  localStorage.removeItem('tripmate_refresh_token');
  localStorage.removeItem('tripmate_user');
}

export async function getAuditLogs(params: GetAuditLogsParams): Promise<PaginatedList<AuditLogSummaryDto>> {
  const queryParams = new URLSearchParams();

  if (params.keyword?.trim()) {
    queryParams.append('keyword', params.keyword.trim());
  }
  if (params.actionType) {
    queryParams.append('actionType', params.actionType);
  }
  if (params.actorRole) {
    queryParams.append('actorRole', params.actorRole);
  }
  if (params.affectedEntity) {
    queryParams.append('affectedEntity', params.affectedEntity);
  }
  if (params.fromDateUtc) {
    queryParams.append('fromDateUtc', params.fromDateUtc);
  }
  if (params.toDateUtc) {
    queryParams.append('toDateUtc', params.toDateUtc);
  }
  if (params.pageNumber && params.pageNumber > 0) {
    queryParams.append('pageNumber', params.pageNumber.toString());
  }
  if (params.pageSize && params.pageSize > 0) {
    queryParams.append('pageSize', params.pageSize.toString());
  }

  const response = await fetch(`${getApiBase()}/admin/audit-logs?${queryParams.toString()}`, {
    method: 'GET',
    headers: buildAuthorizedHeaders(),
    cache: 'no-store',
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearStoredTokens();
    }
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.title || errorData.message || `Failed to fetch audit logs (${response.status})`;
    throw new AuditLogServiceError(message, response.status, errorData.extensions?.errorCode);
  }

  return response.json();
}

export async function getAuditLogDetail(id: number): Promise<AuditLogDetailDto> {
  const response = await fetch(`${getApiBase()}/admin/audit-logs/${id}`, {
    method: 'GET',
    headers: buildAuthorizedHeaders(),
    cache: 'no-store',
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearStoredTokens();
    }
    const errorData = await response.json().catch(() => ({}));
    let message = errorData.title || errorData.message;
    if (!message) {
      if (response.status === 404) {
        message = 'System audit log entry not found.';
      } else if (response.status === 403) {
        message = 'You do not have permission to access this function.';
      } else {
        message = 'TripMate is temporarily unable to process your request. Please check your connection and try again.';
      }
    }
    throw new AuditLogServiceError(message, response.status, errorData.extensions?.errorCode);
  }

  return response.json();
}
