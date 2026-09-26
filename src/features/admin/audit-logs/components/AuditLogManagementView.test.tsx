import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditLogManagementView } from './AuditLogManagementView';
import * as service from '../services/auditLogAdminService';
import type { AuditLogSummaryDto, PaginatedList } from '../types/auditLogAdmin';

const { router } = vi.hoisted(() => ({ router: { replace: vi.fn() } }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));
vi.mock('../services/auditLogAdminService', async (importOriginal) => ({
  ...await importOriginal<typeof service>(),
  getAuditLogs: vi.fn(),
  getAuditLogDetail: vi.fn(),
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

function page(name: string, pageNumber = 1): PaginatedList<AuditLogSummaryDto> {
  return {
    items: [{ id: pageNumber, actionType: 'POI_CREATE', actorFullName: name,
      actorEmail: null, actorUserId: 10, actorRole: 'Administrator',
      affectedEntity: 'POI', affectedEntityId: 42, ipAddress: null,
      result: 'Success', createdAtUtc: '2026-09-18T00:00:00Z', createdAtLocal: '18/09/2026 07:00:00' }],
    pageNumber, pageSize: 20, totalCount: 60, totalPages: 3,
    hasPreviousPage: pageNumber > 1, hasNextPage: pageNumber < 3,
  };
}

function search(keyword: string) {
  fireEvent.change(screen.getByLabelText('Search Keyword'), { target: { value: keyword } });
  fireEvent.click(screen.getByRole('button', { name: /Apply Filters/ }));
}

describe('Audit list and detail state (U03)', () => {
  beforeEach(() => { vi.resetAllMocks(); });

  it('uses safe actionable feedback for a 400 without validation messages', async () => {
    vi.mocked(service.getAuditLogs).mockRejectedValue(new service.AuditLogServiceError('Internal backend detail', 400));
    render(<AuditLogManagementView />);
    expect(await screen.findByText('Please check the audit log filters and apply them again.')).toBeDefined();
    expect(screen.queryByText('Internal backend detail')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
  });

  it('shows date validation feedback and lets the user correct the filters', async () => {
    const message = 'The submitted Event Date range is logically invalid.';
    vi.mocked(service.getAuditLogs).mockRejectedValueOnce(
      new service.AuditLogServiceError('One or more validation errors occurred.', 400, undefined, { general: [message] })
    ).mockResolvedValueOnce(page('Corrected'));
    render(<AuditLogManagementView />);
    expect(await screen.findByText(message)).toBeDefined();
    expect(screen.getByText('Check Audit Log Filters')).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
    search('corrected');
    await screen.findByText('Corrected');
    expect(screen.queryByText(message)).toBeNull();
  });

  it('keeps search B when the older search A response arrives last', async () => {
    const a = deferred<PaginatedList<AuditLogSummaryDto>>();
    const b = deferred<PaginatedList<AuditLogSummaryDto>>();
    vi.mocked(service.getAuditLogs).mockResolvedValueOnce(page('Initial'))
      .mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise);
    render(<AuditLogManagementView />);
    await screen.findByText('Initial');
    search('A');
    search('B');
    await act(async () => { b.resolve(page('Newest result')); });
    expect(screen.getByText('Newest result')).toBeDefined();
    await act(async () => { a.resolve(page('Obsolete result')); });
    expect(screen.queryByText('Obsolete result')).toBeNull();
    expect(screen.getByText('Newest result')).toBeDefined();
    expect((screen.getByLabelText('Search Keyword') as HTMLInputElement).value).toBe('B');
    expect(service.getAuditLogs).toHaveBeenLastCalledWith({ keyword: 'B', pageNumber: 1, pageSize: 20 });
  });

  it('ignores an obsolete unauthorized error after the current search succeeds', async () => {
    const a = deferred<PaginatedList<AuditLogSummaryDto>>();
    vi.mocked(service.getAuditLogs).mockResolvedValueOnce(page('Initial'))
      .mockReturnValueOnce(a.promise).mockResolvedValueOnce(page('Current'));
    render(<AuditLogManagementView />);
    await screen.findByText('Initial');
    search('A');
    search('B');
    await screen.findByText('Current');
    await act(async () => { a.reject(new service.AuditLogServiceError('Expired', 401)); });
    expect(router.replace).not.toHaveBeenCalled();
    expect(screen.getByText('Current')).toBeDefined();
  });

  it('preserves filters/page after closing detail, and resets page when a filter changes', async () => {
    vi.mocked(service.getAuditLogs).mockResolvedValueOnce(page('Initial'))
      .mockResolvedValueOnce(page('Filtered')).mockResolvedValueOnce(page('Second page', 2))
      .mockResolvedValueOnce(page('Changed filter'));
    vi.mocked(service.getAuditLogDetail).mockResolvedValue({
      ...page('Detail actor', 2).items[0], reason: null, beforeData: null, afterData: null,
    });
    render(<AuditLogManagementView />);
    await screen.findByText('Initial');
    search('POI');
    await screen.findByText('Filtered');
    fireEvent.click(screen.getByRole('button', { name: /Next/ }));
    await screen.findByText('Second page');
    fireEvent.click(screen.getByTitle('View Details (UC-69)'));
    await screen.findByText('Detail actor');
    fireEvent.click(screen.getByTitle('Close (ESC)'));
    expect(screen.queryByText('Detail actor')).toBeNull();
    expect(screen.getByText('Page 2 of 3')).toBeDefined();
    expect((screen.getByLabelText('Search Keyword') as HTMLInputElement).value).toBe('POI');
    expect(service.getAuditLogs).toHaveBeenCalledTimes(3);
    fireEvent.change(screen.getByLabelText('Actor Role'), { target: { value: 'Administrator' } });
    await screen.findByText('Changed filter');
    expect(service.getAuditLogs).toHaveBeenLastCalledWith({ keyword: 'POI', actorRole: 'Administrator', pageNumber: 1, pageSize: 20 });
  });

  it('retries the failed query with its filters and replaces rows rather than appending', async () => {
    vi.mocked(service.getAuditLogs).mockResolvedValueOnce(page('Initial'))
      .mockRejectedValueOnce(new service.AuditLogServiceError('Unavailable', 500))
      .mockResolvedValueOnce(page('Recovered'));
    render(<AuditLogManagementView />);
    await screen.findByText('Initial');
    search('retry query');
    fireEvent.click(await screen.findByRole('button', { name: 'Retry' }));
    await screen.findByText('Recovered');
    await waitFor(() => expect(service.getAuditLogs).toHaveBeenCalledTimes(3));
    expect(service.getAuditLogs).toHaveBeenLastCalledWith({ keyword: 'retry query', pageNumber: 1, pageSize: 20 });
    expect(screen.queryByText('Initial')).toBeNull();
    expect(screen.getAllByText('Recovered')).toHaveLength(1);
  });
});
