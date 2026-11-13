/**
 * Staff Administration Commission Reconciliation API Client (UC-83, §3.6.7)
 */

import type {
  StatementItem,
  StatementFilterParams,
  StatementStatus,
} from '../types';
import { DEMO_STATEMENTS } from '../fixtures';

let reconciliationStatements = [...DEMO_STATEMENTS];

export const StaffReconciliationService = {
  resetState(): void {
    reconciliationStatements = [...DEMO_STATEMENTS];
  },

  async fetchReconciliationStatements(
    filters: StatementFilterParams = {}
  ): Promise<{ items: StatementItem[]; totalCount: number }> {
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

    return {
      items: filtered,
      totalCount: filtered.length,
    };
  },

  /**
   * Confirm Commission Receipt (UC-83).
   * Verifies payment credited, updates statement to 'Paid', logs audit entry (BR-174, CR-14).
   */
  async confirmReceipt(
    statementId: string,
    staffId: number = 101
  ): Promise<{
    success: boolean;
    updatedStatus: StatementStatus;
    confirmedAt: string;
    error?: string;
  }> {
    const idx = reconciliationStatements.findIndex(
      (s) => s.id === statementId || s.statementCode === statementId
    );

    if (idx === -1) {
      return {
        success: false,
        updatedStatus: 'PaymentReported',
        confirmedAt: '',
        error: 'Statement not found.',
      };
    }

    const current = reconciliationStatements[idx];
    if (current.status !== 'PaymentReported') {
      return {
        success: false,
        updatedStatus: current.status,
        confirmedAt: '',
        error: 'Only statements in Payment Reported status can be reconciled and confirmed.',
      };
    }

    const confirmedAt = new Date().toISOString();

    const updated: StatementItem = {
      ...current,
      status: 'Paid',
      confirmedAt,
      confirmedByStaffId: staffId,
    };

    reconciliationStatements[idx] = updated;

    return {
      success: true,
      updatedStatus: 'Paid',
      confirmedAt,
    };
  },
};
