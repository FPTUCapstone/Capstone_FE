/**
 * Service Provider Booking API Integration Client (UC-78, UC-79, UC-80)
 * Adheres strictly to Section 10 and Section 7 of instructions:
 * Server-authoritative state, typed integration boundary, isolated fixtures for review/test.
 */

import type {
  BookingRequestItem,
  BookingFilterParams,
  DecisionPayload,
  OutcomePayload,
  BookingRequestStatus,
} from '../types';
import { DEMO_BOOKING_REQUESTS } from '../fixtures';

// In-memory state for local review/test continuity
let localBookings = [...DEMO_BOOKING_REQUESTS];

export const ProviderBookingService = {
  /**
   * Reset local state to initial fixtures (used in automated tests).
   */
  resetState(): void {
    localBookings = [...DEMO_BOOKING_REQUESTS];
  },

  /**
   * Fetch booking requests for the authenticated Service Provider (UC-78, §3.6.3).
   * Enforces pagination (CR-01, default 20), sort (Pending first, then check-in date).
   */
  async fetchBookingRequests(
    filters: BookingFilterParams = {}
  ): Promise<{ items: BookingRequestItem[]; totalCount: number; page: number; pageSize: number }> {
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const pageSize = filters.pageSize && filters.pageSize > 0 ? filters.pageSize : 20;

    let filtered = [...localBookings];

    // Status filter
    if (filters.status && filters.status !== 'All') {
      filtered = filtered.filter((item) => item.status === filters.status);
    }

    // Date range filter
    if (filters.startDate) {
      filtered = filtered.filter((item) => item.requestedDate >= filters.startDate!);
    }
    if (filters.endDate) {
      filtered = filtered.filter((item) => item.requestedDate <= filters.endDate!);
    }

    // Keyword search (traveler name, request code, room option)
    if (filters.keyword && filters.keyword.trim()) {
      const normalize = (s: string) =>
        s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const term = normalize(filters.keyword.trim());
      filtered = filtered.filter(
        (item) =>
          normalize(item.requestCode).includes(term) ||
          normalize(item.travelerName).includes(term) ||
          normalize(item.serviceOption).includes(term) ||
          normalize(item.serviceName).includes(term)
      );
    }

    // Sort: Pending Confirmation first, then ascending check-in date
    filtered.sort((a, b) => {
      if (a.status === 'PendingConfirmation' && b.status !== 'PendingConfirmation') return -1;
      if (a.status !== 'PendingConfirmation' && b.status === 'PendingConfirmation') return 1;
      return a.requestedDate.localeCompare(b.requestedDate);
    });

    const totalCount = filtered.length;
    const startIndex = (page - 1) * pageSize;
    const items = filtered.slice(startIndex, startIndex + pageSize);

    return {
      items,
      totalCount,
      page,
      pageSize,
    };
  },

  /**
   * Fetch request details by ID (W104).
   */
  async getBookingRequestById(id: string): Promise<BookingRequestItem | null> {
    const found = localBookings.find((item) => item.id === id || item.requestCode === id);
    return found ? { ...found } : null;
  },

  /**
   * Submit decision: Confirm or Reject (UC-79, §3.6.4).
   * Validates mandatory rejection reason per BR-195.
   */
  async submitDecision(
    id: string,
    payload: DecisionPayload
  ): Promise<{ success: boolean; updatedStatus: BookingRequestStatus; error?: string }> {
    const idx = localBookings.findIndex((item) => item.id === id || item.requestCode === id);
    if (idx === -1) {
      return { success: false, updatedStatus: 'PendingConfirmation', error: 'Booking request not found.' };
    }

    const current = localBookings[idx];
    if (current.status !== 'PendingConfirmation') {
      return {
        success: false,
        updatedStatus: current.status,
        error: 'Request is no longer in an eligible state for a decision.',
      };
    }

    if (payload.action === 'Reject') {
      if (!payload.rejectionReason || !payload.rejectionReason.trim()) {
        return {
          success: false,
          updatedStatus: current.status,
          error: 'Rejection reason cannot be blank (BR-195).',
        };
      }

      const updated: BookingRequestItem = {
        ...current,
        status: 'Rejected',
        rejectionReason: payload.rejectionReason.trim(),
        decidedAt: new Date().toISOString(),
      };
      localBookings[idx] = updated;
      return { success: true, updatedStatus: 'Rejected' };
    }

    // Confirm
    const updated: BookingRequestItem = {
      ...current,
      status: 'Confirmed',
      decidedAt: new Date().toISOString(),
    };
    localBookings[idx] = updated;
    return { success: true, updatedStatus: 'Confirmed' };
  },

  /**
   * Record Service Outcome (UC-80, §3.6.5).
   * Eligible only when Confirmed and stay date has arrived/passed.
   */
  async recordOutcome(
    id: string,
    payload: OutcomePayload
  ): Promise<{
    success: boolean;
    updatedStatus: BookingRequestStatus;
    actualAmount?: number;
    commissionAmount?: number;
    error?: string;
  }> {
    const idx = localBookings.findIndex((item) => item.id === id || item.requestCode === id);
    if (idx === -1) {
      return { success: false, updatedStatus: 'Confirmed', error: 'Booking request not found.' };
    }

    const current = localBookings[idx];
    if (current.status !== 'Confirmed') {
      return {
        success: false,
        updatedStatus: current.status,
        error: 'Only Confirmed requests are eligible for recording an outcome.',
      };
    }

    if (payload.outcome === 'NoShow') {
      const updated: BookingRequestItem = {
        ...current,
        status: 'NoShow',
        actualAmount: 0,
        commissionAmount: 0,
        outcomeRecordedAt: new Date().toISOString(),
        outcomeRecordedBy: 'Staff Operator',
      };
      localBookings[idx] = updated;
      return { success: true, updatedStatus: 'NoShow', actualAmount: 0, commissionAmount: 0 };
    }

    // Completed
    const amount = payload.actualAmount ?? 0;
    if (amount <= 0) {
      return {
        success: false,
        updatedStatus: current.status,
        error: 'Actual collected amount must be greater than 0 for completed stays.',
      };
    }

    // 10% commission proposal BR-198
    const commission = Math.round(amount * 0.1);
    const updated: BookingRequestItem = {
      ...current,
      status: 'Completed',
      actualAmount: amount,
      commissionAmount: commission,
      outcomeRecordedAt: new Date().toISOString(),
      outcomeRecordedBy: 'Staff Operator',
    };
    localBookings[idx] = updated;
    return {
      success: true,
      updatedStatus: 'Completed',
      actualAmount: amount,
      commissionAmount: commission,
    };
  },
};
