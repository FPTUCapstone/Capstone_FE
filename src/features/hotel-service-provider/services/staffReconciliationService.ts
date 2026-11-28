/**
 * Staff Administration Commission Reconciliation API Client (UC-83, §3.6.7)
 */

import type {
  StatementItem,
  StatementFilterParams,
  StatementStatus,
} from '../types';
import { DEMO_STATEMENTS } from '../fixtures';
import { hotelProviderVi } from '../resources/vi';

let reconciliationStatements = [...DEMO_STATEMENTS];

type StatementReferences = Pick<StatementItem, 'bankReference' | 'reportedBankReference' | 'verifiedBankReference'>;

type ConfirmReceiptResult =
  | ({ success: true; confirmedAt: string; confirmedByStaffId?: number } & StatementReferences)
  | { success: false; error?: string };

const receiptMessages = hotelProviderVi.w106.confirmModal;
const receiptErrors = new Map([
  ['CommissionStatement.MissingBankReference', hotelProviderVi.messages.MSG172],
  ['CommissionStatement.ReceiptAmountMismatch', receiptMessages.amountMismatch],
  ['CommissionStatement.BankReferenceAlreadyUsed', receiptMessages.referenceAlreadyUsed],
]);

function readReferences(data: Record<string, unknown>): StatementReferences {
  const bankReference = typeof data.bankTransferReference === 'string' ? data.bankTransferReference : undefined;
  const verifiedBankReference = typeof data.verifiedBankTransferReference === 'string' ? data.verifiedBankTransferReference : undefined;
  const reportedBankReference = 'reportedBankTransferReference' in data
    ? (typeof data.reportedBankTransferReference === 'string' ? data.reportedBankTransferReference : undefined)
    : (verifiedBankReference ? undefined : bankReference);
  return { bankReference: verifiedBankReference ?? bankReference ?? reportedBankReference, verifiedBankReference, reportedBankReference };
}

export const StaffReconciliationService = {
  resetState(): void {
    reconciliationStatements = [...DEMO_STATEMENTS];
  },

  async fetchReconciliationStatements(
    filters: StatementFilterParams = {},
    preview = false,
  ): Promise<{ items: StatementItem[]; totalCount: number }> {
    if (!preview) {
      const query = new URLSearchParams();
      if (filters.providerId && filters.providerId !== 'All') query.set('providerId', filters.providerId);
      if (filters.period && filters.period !== 'All') query.set('period', filters.period);
      if (filters.status && filters.status !== 'All') query.set('status', filters.status);
      if (filters.keyword && filters.keyword.trim()) query.set('keyword', filters.keyword.trim());
      query.set('pageNumber', String(filters.page ?? 1));
      query.set('pageSize', String(filters.pageSize ?? 20));

      const res = await fetch(`/api/admin/commercial-settlements/reconciliation?${query}`, { credentials: 'same-origin', cache: 'no-store' });
      const json = res.ok ? await res.json() : null;
      const data = json?.data;
      if (json?.success !== true || !Array.isArray(data?.items)) {
        throw new Error('Reconciliation statements unavailable.');
      }
      const items: StatementItem[] = data.items.map((s: Record<string, unknown>) => ({
        id: String(s.statementId ?? s.id),
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
        ...readReferences(s),
        reportedAt: typeof s.reportedAtUtc === 'string' ? s.reportedAtUtc : undefined,
        confirmedAt: typeof s.confirmedAtUtc === 'string' ? s.confirmedAtUtc : undefined,
        confirmedByStaffId: typeof s.confirmedByUserId === 'number' ? s.confirmedByUserId : undefined,
      }));
      return { items, totalCount: typeof data.totalCount === 'number' ? data.totalCount : items.length };
    }

    let filtered = [...reconciliationStatements];

    // Filter by provider
    if (filters.providerId && filters.providerId !== 'All') {
      filtered = filtered.filter((s) => String(s.providerId) === String(filters.providerId));
    }

    // Filter by period
    if (filters.period && filters.period !== 'All') {
      filtered = filtered.filter((s) => s.period === filters.period);
    }

    // Filter by status (default 'PaymentReported' if specified)
    if (filters.status && filters.status !== 'All') {
      filtered = filtered.filter((s) => s.status === filters.status);
    }

    // Filter by bank reference search keyword
    if (filters.keyword && filters.keyword.trim()) {
      const term = filters.keyword.trim().toLowerCase();
      filtered = filtered.filter(
        (s) =>
          (s.bankReference && s.bankReference.toLowerCase().includes(term)) ||
          s.providerName.toLowerCase().includes(term) ||
          s.statementCode.toLowerCase().includes(term)
      );
    }

    const pageSize = filters.pageSize ?? 20;
    const offset = ((filters.page ?? 1) - 1) * pageSize;
    return {
      items: filtered.slice(offset, offset + pageSize),
      totalCount: filtered.length,
    };
  },

  /**
   * Confirm Commission Receipt (UC-83).
   * Verifies payment credited, updates statement to 'Paid', logs audit entry (BR-174, CR-14).
   */
  async confirmReceipt(
    statementId: string,
    bankTransferReference: string,
    receivedAmountVnd: number,
    preview = false,
  ): Promise<ConfirmReceiptResult> {
    const reference = bankTransferReference.trim();
    if (!preview) {
      const res = await fetch(`/api/admin/commercial-settlements/reconciliation/${encodeURIComponent(statementId)}/reconcile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ bankTransferReference: reference, receivedAmountVnd }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const error = receiptErrors.get(json?.errorCode)
          ?? (res.status === 401 || res.status === 403
            ? hotelProviderVi.messages.MSG126
            : res.status === 409 ? hotelProviderVi.messages.MSG133 : hotelProviderVi.messages.MSG127);
        return { success: false, error };
      }
      const data = json?.data;
      if (json?.success !== true || data?.status !== 'Paid' || typeof data.confirmedAtUtc !== 'string') {
        return { success: false };
      }
      return {
        success: true,
        confirmedAt: data.confirmedAtUtc,
        confirmedByStaffId: typeof data.confirmedByUserId === 'number' ? data.confirmedByUserId : undefined,
        ...readReferences(data),
      };
    }

    const idx = reconciliationStatements.findIndex(
      (s) => s.id === statementId || s.statementCode === statementId
    );

    if (idx === -1) {
      return {
        success: false,
        error: 'Statement not found.',
      };
    }

    const current = reconciliationStatements[idx];
    if (current.commissionAmount <= 0 || (current.status !== 'PaymentReported' && current.status !== 'Overdue')) {
      return { success: false };
    }
    if (!reference) {
      return { success: false, error: hotelProviderVi.messages.MSG172 };
    }
    if (receivedAmountVnd !== current.commissionAmount) {
      return { success: false, error: receiptMessages.amountMismatch };
    }
    if (reconciliationStatements.some((statement) => statement.status === 'Paid'
      && (statement.verifiedBankReference ?? statement.bankReference)?.toUpperCase() === reference.toUpperCase())) {
      return { success: false, error: receiptMessages.referenceAlreadyUsed };
    }

    const confirmedAt = new Date().toISOString();

    const updated: StatementItem = {
      ...current,
      status: 'Paid',
      confirmedAt,
      confirmedByStaffId: 101,
      bankReference: reference,
      reportedBankReference: current.reportedBankReference ?? current.bankReference,
      verifiedBankReference: reference,
    };

    reconciliationStatements[idx] = updated;

    return {
      success: true,
      confirmedAt,
      confirmedByStaffId: updated.confirmedByStaffId,
      bankReference: updated.bankReference,
      reportedBankReference: updated.reportedBankReference,
      verifiedBankReference: updated.verifiedBankReference,
    };
  },
};
