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

    if (!payload.bankReference || !payload.bankReference.trim()) {
      return {
        success: false,
        updatedStatus: localStatements[idx].status,
        reportedAt: '',
        error: 'Bank transfer reference cannot be empty (§3.6.6).',
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
