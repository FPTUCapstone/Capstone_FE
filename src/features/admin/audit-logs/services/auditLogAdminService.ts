import { GetAuditLogsParams, PaginatedList, AuditLogSummaryDto, AuditLogDetailDto } from '../types/auditLogAdmin';
import { getApiBase } from '@/lib/authApi';

export class AuditLogServiceError extends Error {
  statusCode?: number;
  errorCode?: string;
  validationErrors: Record<string, string[]>;

  constructor(message: string, statusCode?: number, errorCode?: string, validationErrors: Record<string, string[]> = {}) {
    super(message);
    this.name = 'AuditLogServiceError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.validationErrors = validationErrors;
  }
}

async function readServiceError(response: Response): Promise<AuditLogServiceError> {
  if (response.status === 401) clearStoredTokens();
  const body: unknown = await response.json().catch(() => null);
  const problem = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const validationErrors: Record<string, string[]> = {};
  if (response.status === 400 && problem.errors && typeof problem.errors === 'object' && !Array.isArray(problem.errors)) {
    for (const [field, values] of Object.entries(problem.errors)) {
      if (Array.isArray(values)) {
        const messages = values.filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
        if (messages.length) Object.defineProperty(validationErrors, field, { value: messages, enumerable: true });
      }
    }
  }
  const message = typeof problem.title === 'string' ? problem.title : 'Unable to load audit logs.';
  const errorCode = typeof problem.errorCode === 'string' ? problem.errorCode : undefined;
  return new AuditLogServiceError(message, response.status, errorCode, validationErrors);
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
    throw await readServiceError(response);
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
    throw await readServiceError(response);
  }

  return response.json();
}
