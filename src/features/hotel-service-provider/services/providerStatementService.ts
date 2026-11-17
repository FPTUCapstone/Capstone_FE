/**
 * Service Provider Commission Statement API Client (UC-82, §3.6.6)
 */

import type {
  StatementItem,
  StatementFilterParams,
  ReportPaymentPayload,
  StatementStatus,
} from '../types';
import { DEMO_STATEMENTS } from '../fixtures';

let localStatements = [...DEMO_STATEMENTS];

export const ProviderStatementService = {
  resetState(): void {
    localStatements = [...DEMO_STATEMENTS];
  },

  async fetchStatements(
    filters: StatementFilterParams = {}
  ): Promise<{ items: StatementItem[]; totalCount: number }> {
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
      try {
        const query = new URLSearchParams();
        if (filters.status && filters.status !== 'All') query.set('status', filters.status);
        if (filters.period && filters.period !== 'All') query.set('period', filters.period);
        if (filters.keyword && filters.keyword.trim()) query.set('keyword', filters.keyword.trim());
        query.set('pageNumber', String(filters.page ?? 1));
        query.set('pageSize', String(filters.pageSize ?? 20));

        const res = await fetch(`/api/provider/statements?${query}`, { credentials: 'same-origin', cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (json?.success && json.data) {
            const data = json.data;
            const rawItems = Array.isArray(data.items) ? data.items : [];
            const items: StatementItem[] = rawItems.map((s: Record<string, unknown>) => ({
              id: String(s.id),
              statementCode: String(s.statementCode ?? ''),
              providerId: typeof s.providerId === 'number' ? s.providerId : 0,
              providerName: typeof s.providerName === 'string' ? s.providerName : 'Provider',
              period: String(s.period ?? ''),
              periodStartDate: String(s.issueDate ?? ''),
              periodEndDate: String(s.dueDate ?? ''),
              completedCount: typeof s.totalRequests === 'number' ? s.totalRequests : 0,
              totalRevenue: typeof s.totalActualAmount === 'number' ? s.totalActualAmount : 0,
              commissionAmount: typeof s.commissionAmount === 'number' ? s.commissionAmount : 0,
              dueDate: String(s.dueDate ?? ''),
              status: (s.status as StatementStatus) || 'Issued',
              bankReference: typeof s.bankTransferReference === 'string' ? s.bankTransferReference : undefined,
              reportedAt: typeof s.reportedAtUtc === 'string' ? s.reportedAtUtc : undefined,
              confirmedAt: typeof s.confirmedAtUtc === 'string' ? s.confirmedAtUtc : undefined,
            }));
            return { items, totalCount: typeof data.totalCount === 'number' ? data.totalCount : items.length };
          }
        }
      } catch {
        // Fall back to local mock data
      }
    }

    let filtered = [...localStatements];

    if (filters.status && filters.status !== 'All') {
      filtered = filtered.filter((s) => s.status === filters.status);
    }

    if (filters.period && filters.period !== 'All') {
      filtered = filtered.filter((s) => s.period === filters.period);
    }

    if (filters.keyword && filters.keyword.trim()) {
      const term = filters.keyword.trim().toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.statementCode.toLowerCase().includes(term) ||
          (s.bankReference && s.bankReference.toLowerCase().includes(term))
      );
    }

    return {
      items: filtered,
      totalCount: filtered.length,
    };
  },

  async getStatementById(id: string): Promise<StatementItem | null> {
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
      try {
        const res = await fetch(`/api/provider/statements/${encodeURIComponent(id)}`, { credentials: 'same-origin', cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (json?.success && json.data) {
            const s = json.data;
            const requests = Array.isArray(s.requests) ? s.requests : [];
            const item: StatementItem = {
              id: String(s.id),
              statementCode: String(s.statementCode ?? ''),
              providerId: typeof s.providerId === 'number' ? s.providerId : 0,
              providerName: typeof s.providerName === 'string' ? s.providerName : 'Provider',
              period: String(s.period ?? ''),
              periodStartDate: String(s.issueDate ?? ''),
              periodEndDate: String(s.dueDate ?? ''),
              completedCount: typeof s.totalRequests === 'number' ? s.totalRequests : requests.length,
              totalRevenue: typeof s.totalActualAmount === 'number' ? s.totalActualAmount : 0,
              commissionAmount: typeof s.commissionAmount === 'number' ? s.commissionAmount : 0,
              dueDate: String(s.dueDate ?? ''),
              status: (s.status as StatementStatus) || 'Issued',
              bankReference: typeof s.bankTransferReference === 'string' ? s.bankTransferReference : undefined,
              reportedAt: typeof s.reportedAtUtc === 'string' ? s.reportedAtUtc : undefined,
              confirmedAt: typeof s.confirmedAtUtc === 'string' ? s.confirmedAtUtc : undefined,
              breakdown: requests.map((r: Record<string, unknown>) => ({
                id: String(r.bookingId ?? ''),
                bookingCode: `REQ-${r.bookingId}`,
                roomOption: typeof r.serviceOption === 'string' ? r.serviceOption : 'Default',
                guestName: typeof r.travelerSummary === 'string' ? r.travelerSummary : 'Traveler',
                checkoutDate: String(r.date ?? ''),
                actualAmount: typeof r.actualAmount === 'number' ? r.actualAmount : 0,
                commissionAmount: typeof r.commissionAmount === 'number' ? r.commissionAmount : 0,
              })),
            };
            return item;
          }
        }
      } catch {
        // Fall back to local mock data
      }
    }

    const found = localStatements.find(
      (item) => item.id === id || item.statementCode === id
    );
    return found ? { ...found } : null;
  },

  /**
   * Report Bank Wire Payment (UC-82).
   * Note: Status transitions to 'PaymentReported', NOT 'Paid'.
   * Paid status requires Staff verification via Screen W106 (PC-02).
   */
  async reportPayment(
    payload: ReportPaymentPayload
  ): Promise<{
    success: boolean;
    updatedStatus: StatementStatus;
    reportedAt: string;
    error?: string;
  }> {
    if (!payload.bankReference || !payload.bankReference.trim()) {
      return {
        success: false,
        updatedStatus: 'Issued',
        reportedAt: '',
        error: 'Bank transfer reference cannot be empty (§3.6.6).',
      };
    }

    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
      try {
        const res = await fetch(`/api/provider/statements/${encodeURIComponent(payload.statementId)}/report-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ bankTransferReference: payload.bankReference.trim() }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json?.success && json.data) {
            return {
              success: true,
              updatedStatus: 'PaymentReported',
              reportedAt: typeof json.data.reportedAtUtc === 'string' ? json.data.reportedAtUtc : new Date().toISOString(),
            };
          }
        }
        // If not ok (mock id, unauthenticated, or backend offline), fall back to local mock state
      } catch {
        // Fall back to local mock data
      }
    }

    const idx = localStatements.findIndex(
      (s) => s.id === payload.statementId || s.statementCode === payload.statementId
    );
    if (idx === -1) {
      return {
        success: false,
        updatedStatus: 'Issued',
        reportedAt: '',
        error: 'Statement not found.',
      };
    }

    const current = localStatements[idx];
    const reportedAt = new Date().toISOString();

    const updated: StatementItem = {
      ...current,
      status: 'PaymentReported',
      bankReference: payload.bankReference.trim(),
      reportedAt,
    };

    localStatements[idx] = updated;

    return {
      success: true,
      updatedStatus: 'PaymentReported',
      reportedAt,
    };
  },
};
