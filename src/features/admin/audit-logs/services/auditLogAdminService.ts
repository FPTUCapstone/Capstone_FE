import { GetAuditLogsParams, PaginatedList, AuditLogSummaryDto, AuditLogDetailDto } from '../types/auditLogAdmin';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5021';

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

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || sessionStorage.getItem('token') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/admin/audit-logs?${queryParams.toString()}`, {
    method: 'GET',
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.title || errorData.message || `Failed to fetch audit logs (${response.status})`;
    throw new AuditLogServiceError(message, response.status, errorData.extensions?.errorCode);
  }

  return response.json();
}

export async function getAuditLogDetail(id: number): Promise<AuditLogDetailDto> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || sessionStorage.getItem('token') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/admin/audit-logs/${id}`, {
    method: 'GET',
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    let message = errorData.title || errorData.message;
    if (!message) {
      if (response.status === 404) {
        message = 'System audit log entry not found. (MSG129)';
      } else if (response.status === 403) {
        message = 'Access denied. Administrator role required. (MSG126)';
      } else {
        message = 'The audit log details cannot be retrieved because of a system or network failure. (MSG127)';
      }
    }
    throw new AuditLogServiceError(message, response.status, errorData.extensions?.errorCode);
  }

  return response.json();
}



