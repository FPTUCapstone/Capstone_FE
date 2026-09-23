import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';
import { AuditLogDetailDrawer } from './AuditLogDetailDrawer';
import * as service from '../services/auditLogAdminService';

const { router } = vi.hoisted(() => ({ router: { replace: vi.fn() } }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

vi.mock('../services/auditLogAdminService', () => ({
  getAuditLogDetail: vi.fn(),
  AuditLogServiceError: class extends Error {
    statusCode?: number;
    errorCode?: string;
    constructor(message: string, statusCode?: number, errorCode?: string) {
      super(message);
      this.name = 'AuditLogServiceError';
      this.statusCode = statusCode;
      this.errorCode = errorCode;
    }
  },
}));

describe('AuditLogDetailDrawer', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    render(<AuditLogDetailDrawer logId={101} isOpen={false} onClose={mockOnClose} />);
    expect(screen.queryByText('Audit Log Details')).toBeNull();
  });

  it('renders details successfully when open and data is loaded', async () => {
    const mockDetail = {
      result: 'Success' as const,
      reason: null,
      id: 101,
      actionType: 'ApproveOperatorApplication',
      actorUserId: 10,
      actorEmail: 'admin@tripmate.vn',
      actorFullName: 'Admin User',
      actorRole: 'Administrator' as const,
      affectedEntity: 'OperatorProfile',
      affectedEntityId: 5,
      beforeData: '{"status":"Pending"}',
      afterData: '{"status":"Approved"}',
      ipAddress: '127.0.0.1',
      createdAtUtc: '2026-09-13T10:00:00.000Z',
      createdAtLocal: '13/09/2026 17:00:00',
    };

    vi.mocked(service.getAuditLogDetail).mockResolvedValue(mockDetail);

    render(<AuditLogDetailDrawer logId={101} isOpen={true} onClose={mockOnClose} />);

    expect(await screen.findByText('ApproveOperatorApplication')).toBeDefined();
    expect(screen.getByText('ApproveOperatorApplication')).toBeDefined();
    expect(screen.getByText('Admin User')).toBeDefined();
    expect(screen.getByText('admin@tripmate.vn')).toBeDefined();
    expect(screen.getByText('13/09/2026 17:00:00')).toBeDefined();
    expect(screen.getByText('127.0.0.1')).toBeDefined();
  });

  it('renders error state when audit log entry is not found (404)', async () => {
    const err = new service.AuditLogServiceError('Not found', 404, 'admin.audit_log_not_found');
    vi.mocked(service.getAuditLogDetail).mockRejectedValue(err);

    render(<AuditLogDetailDrawer logId={999} isOpen={true} onClose={mockOnClose} />);

    expect(await screen.findByText('System audit log entry not found.')).toBeDefined();
  });

  it('renders error state MSG127 when system or network failure occurs (500)', async () => {
    const err = new service.AuditLogServiceError(
      'An unexpected error occurred.',
      500
    );
    vi.mocked(service.getAuditLogDetail).mockRejectedValue(err);

    render(<AuditLogDetailDrawer logId={101} isOpen={true} onClose={mockOnClose} />);

    expect(
      await screen.findByText(
        'TripMate is temporarily unable to process your request. Please check your connection and try again.'
      )
    ).toBeDefined();
  });

  it('redirects an expired detail session to login with the audit list return URL', async () => {
    vi.mocked(service.getAuditLogDetail).mockRejectedValue(new service.AuditLogServiceError('Unauthorized', 401));
    render(<AuditLogDetailDrawer logId={101} isOpen onClose={mockOnClose} />);
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/admin/login?returnUrl=%2Fadmin%2Faudit-logs'));
  });

  it('does not redirect for a detail response arriving after the drawer closes', async () => {
    let reject!: (reason: unknown) => void;
    vi.mocked(service.getAuditLogDetail).mockReturnValue(new Promise((_, rej) => { reject = rej; }));
    const { rerender } = render(<AuditLogDetailDrawer logId={101} isOpen onClose={mockOnClose} />);
    rerender(<AuditLogDetailDrawer logId={101} isOpen={false} onClose={mockOnClose} />);
    await act(async () => reject(new service.AuditLogServiceError('Unauthorized', 401)));
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('uses MSG127 instead of exposing a network exception', async () => {
    vi.mocked(service.getAuditLogDetail).mockRejectedValue(new TypeError('Failed to fetch'));
    render(<AuditLogDetailDrawer logId={101} isOpen onClose={mockOnClose} />);
    expect(await screen.findByText('TripMate is temporarily unable to process your request. Please check your connection and try again.')).toBeDefined();
    expect(screen.queryByText('Failed to fetch')).toBeNull();
  });

  it('preserves the locked forbidden message', async () => {
    vi.mocked(service.getAuditLogDetail).mockRejectedValue(new service.AuditLogServiceError('Forbidden', 403));
    render(<AuditLogDetailDrawer logId={101} isOpen onClose={mockOnClose} />);
    expect(await screen.findByText('You do not have permission to access this function.')).toBeDefined();
  });

  it('calls onClose when close button is clicked', async () => {

    const mockDetail = {
      result: 'Success' as const,
      reason: null,
      id: 101,
      actionType: 'ApproveOperatorApplication',
      actorUserId: 10,
      actorEmail: 'admin@tripmate.vn',
      actorFullName: 'Admin User',
      actorRole: 'Administrator' as const,
      affectedEntity: 'OperatorProfile',
      affectedEntityId: 5,
      beforeData: null,
      afterData: null,
      ipAddress: null,
      createdAtUtc: '2026-09-13T10:00:00.000Z',
      createdAtLocal: '13/09/2026 17:00:00',
    };

    vi.mocked(service.getAuditLogDetail).mockResolvedValue(mockDetail);

    render(<AuditLogDetailDrawer logId={101} isOpen={true} onClose={mockOnClose} />);

    const closeButtons = await screen.findAllByRole('button', { name: /close/i });
    fireEvent.click(closeButtons[0]);

    expect(mockOnClose).toHaveBeenCalled();
  });
});
