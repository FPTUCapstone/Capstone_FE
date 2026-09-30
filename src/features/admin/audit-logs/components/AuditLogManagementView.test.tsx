import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as auditLogService from '../services/auditLogAdminService';
import type { AuditLogSummaryDto, PaginatedList } from '../types/auditLogAdmin';
import { AuditLogManagementView } from './AuditLogManagementView';
import {
  getVietnamTodayDateInputValue,
  toVietnamDayBoundaryUtc,
} from './AuditLogFilterBar';

const { router } = vi.hoisted(() => ({ router: { replace: vi.fn() } }));

vi.mock('next/navigation', () => ({ useRouter: () => router }));
vi.mock('../services/auditLogAdminService', async (importOriginal) => ({
  ...await importOriginal<typeof auditLogService>(),
  getAuditLogs: vi.fn(),
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
}

function page(actorFullName: string | null, result: AuditLogSummaryDto['result'] = 'Success'):
  PaginatedList<AuditLogSummaryDto> {
  return {
    items: [{
      id: 1,
      result,
      actionType: 'UpdateAlgorithmParameters',
      actorUserId: 10,
      actorEmail: 'admin@tripmate.local',
      actorFullName,
      actorRole: 'Administrator',
      affectedEntity: 'SystemConfig',
      affectedEntityId: 2,
      ipAddress: '127.0.0.1',
      createdAtUtc: '2026-09-29T10:00:00Z',
      createdAtLocal: '29/09/2026 17:00:00',
    }],
    pageNumber: 1,
    pageSize: 10,
    totalCount: 1,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  };
}

describe('UC-68 audit log management', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the result contract and nullable actor name safely', async () => {
    vi.mocked(auditLogService.getAuditLogs).mockResolvedValue(page(null, 'Failure'));

    render(<AuditLogManagementView />);

    expect(await screen.findByText('Failure')).toBeDefined();
    expect(screen.getByText('N/A')).toBeDefined();
    expect(screen.queryByText(/MSG12[67]/)).toBeNull();
    expect(screen.queryByRole('button', { name: /view details/i })).toBeNull();
  });

  it('keeps the newest filter response when an older request finishes last', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const older = deferred<PaginatedList<AuditLogSummaryDto>>();
    const newer = deferred<PaginatedList<AuditLogSummaryDto>>();
    vi.mocked(auditLogService.getAuditLogs)
      .mockResolvedValueOnce(page('Initial result'))
      .mockReturnValueOnce(older.promise)
      .mockReturnValueOnce(newer.promise);

    render(<AuditLogManagementView />);
    await screen.findByText('Initial result');

    fireEvent.change(screen.getByLabelText('Search Keyword'), { target: { value: 'old' } });
    await act(async () => vi.advanceTimersByTime(400));
    await waitFor(() => expect(auditLogService.getAuditLogs).toHaveBeenCalledTimes(2));
    fireEvent.change(screen.getByLabelText('Search Keyword'), { target: { value: 'new' } });
    await act(async () => vi.advanceTimersByTime(400));
    await waitFor(() => expect(auditLogService.getAuditLogs).toHaveBeenCalledTimes(3));

    await act(async () => newer.resolve(page('Newest result')));
    expect(await screen.findByText('Newest result')).toBeDefined();

    await act(async () => older.resolve(page('Obsolete result')));
    expect(screen.queryByText('Obsolete result')).toBeNull();
    expect(screen.getByText('Newest result')).toBeDefined();
  });

  it('debounces keyword requests until typing has paused', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.mocked(auditLogService.getAuditLogs).mockResolvedValue(page('Initial result'));

    render(<AuditLogManagementView />);
    await screen.findByText('Initial result');

    const keyword = screen.getByLabelText('Search Keyword');
    fireEvent.change(keyword, { target: { value: 't' } });
    fireEvent.change(keyword, { target: { value: 'tr' } });
    fireEvent.change(keyword, { target: { value: 'trip' } });
    await act(async () => vi.advanceTimersByTime(399));
    expect(auditLogService.getAuditLogs).toHaveBeenCalledTimes(1);

    await act(async () => vi.advanceTimersByTime(1));
    await waitFor(() => expect(auditLogService.getAuditLogs).toHaveBeenCalledTimes(2));
    expect(vi.mocked(auditLogService.getAuditLogs).mock.calls[1][0].keyword).toBe('trip');
  });

  it('redirects an expired Administrator session to login with a return URL', async () => {
    vi.mocked(auditLogService.getAuditLogs).mockRejectedValue(
      new auditLogService.AuditLogServiceError('Administrator sign-in is required.', 401),
    );

    render(<AuditLogManagementView />);

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith(
        '/admin/login?returnUrl=%2Fadmin%2Faudit-logs',
      );
    });
    expect(screen.queryByText(/MSG12[67]/)).toBeNull();
  });

  it('shows product-facing forbidden feedback without a message-catalog code', async () => {
    vi.mocked(auditLogService.getAuditLogs).mockRejectedValue(
      new auditLogService.AuditLogServiceError('Administrator access is not allowed.', 403),
    );

    render(<AuditLogManagementView />);

    expect(await screen.findByText('Access denied. Administrator role required.')).toBeDefined();
    expect(screen.queryByText(/MSG126/)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
  });

  it('treats invalid filters as correctable input instead of a retryable outage', async () => {
    vi.mocked(auditLogService.getAuditLogs).mockRejectedValue(
      new auditLogService.AuditLogServiceError('Please check the audit log filters and try again.', 400),
    );

    render(<AuditLogManagementView />);

    expect(await screen.findByText('Please check the audit log filters and try again.')).toBeDefined();
    expect(screen.getByText('Check Audit Log Filters')).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
  });

  it('retries the current filters after a service failure', async () => {
    vi.mocked(auditLogService.getAuditLogs)
      .mockRejectedValueOnce(new auditLogService.AuditLogServiceError('Unavailable', 503))
      .mockResolvedValueOnce(page('Recovered result'));

    render(<AuditLogManagementView />);

    fireEvent.click(await screen.findByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Recovered result')).toBeDefined();
    expect(auditLogService.getAuditLogs).toHaveBeenCalledTimes(2);
  });

  it('derives date filters from the fixed Asia/Ho_Chi_Minh business timezone', () => {
    expect(getVietnamTodayDateInputValue(new Date('2026-09-29T17:30:00.000Z')))
      .toBe('2026-09-30');
    expect(toVietnamDayBoundaryUtc('2026-09-30', 'start'))
      .toBe('2026-09-29T17:00:00.000Z');
    expect(toVietnamDayBoundaryUtc('2026-09-30', 'end'))
      .toBe('2026-09-30T16:59:59.999Z');
  });
});
