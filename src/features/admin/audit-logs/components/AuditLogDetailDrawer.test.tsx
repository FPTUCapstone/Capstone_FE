import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';
import { AuditLogDetailDrawer } from './AuditLogDetailDrawer';
import * as service from '../services/auditLogAdminService';

const { routerReplace } = vi.hoisted(() => ({
  routerReplace: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: routerReplace,
  }),
}));

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

  const buildDetail = (overrides: Partial<Awaited<ReturnType<typeof service.getAuditLogDetail>>> = {}) => ({
    id: 101,
    result: 'Success' as const,
    actionType: 'ApproveOperatorApplication',
    actorUserId: 10,
    actorEmail: 'admin@tripmate.vn',
    actorFullName: 'Admin User',
    actorRole: 'Administrator' as const,
    affectedEntity: 'OperatorProfile',
    affectedEntityId: 5,
    reason: null,
    beforeData: '{"status":"Pending"}',
    afterData: '{"status":"Approved"}',
    ipAddress: '127.0.0.1',
    createdAtUtc: '2026-09-13T10:00:00.000Z',
    createdAtLocal: '13/09/2026 17:00:00',
    ...overrides,
  });

  it('renders nothing when isOpen is false', () => {
    render(<AuditLogDetailDrawer logId={101} isOpen={false} onClose={mockOnClose} />);
    expect(screen.queryByText('Audit Log Details')).toBeNull();
  });

  it('renders details successfully when open and data is loaded', async () => {
    vi.mocked(service.getAuditLogDetail).mockResolvedValue(buildDetail());

    render(<AuditLogDetailDrawer logId={101} isOpen={true} onClose={mockOnClose} />);

    expect(await screen.findByText('#101')).toBeDefined();
    expect(screen.getByText('ApproveOperatorApplication')).toBeDefined();
    expect(screen.getByText('Admin User')).toBeDefined();
    expect(screen.getByText('admin@tripmate.vn')).toBeDefined();
    expect(screen.getByText('13/09/2026 17:00:00')).toBeDefined();
    expect(screen.getByText('127.0.0.1')).toBeDefined();
  });

  it('exposes the modal with a dialog role and accessible name', async () => {
    vi.mocked(service.getAuditLogDetail).mockResolvedValue(buildDetail());

    render(<AuditLogDetailDrawer logId={101} isOpen={true} onClose={mockOnClose} />);

    const dialog = await screen.findByRole('dialog', { name: /Audit Log Details/ });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(screen.getByRole('button', { name: 'Close audit log details' })).toBeDefined();
  });

  it('prioritizes the BE reason field over JSON payload fallback', async () => {
    vi.mocked(service.getAuditLogDetail).mockResolvedValue(buildDetail({
      reason: 'Approved because the business license is valid.',
      afterData: '{"reason":"payload fallback should not render"}',
    }));

    render(<AuditLogDetailDrawer logId={101} isOpen={true} onClose={mockOnClose} />);

    expect(await screen.findByText(/Approved because the business license is valid/)).toBeDefined();
    expect(screen.getByText('Supplied Reason / Action Note')).toBeDefined();
  });

  it('ignores non-string JSON reason fields without crashing', async () => {
    vi.mocked(service.getAuditLogDetail).mockResolvedValue(buildDetail({
      reason: null,
      beforeData: '{"reason":{"text":"not renderable"},"note":123}',
      afterData: '{"rejectionReason":42}',
    }));

    render(<AuditLogDetailDrawer logId={101} isOpen={true} onClose={mockOnClose} />);

    expect(await screen.findByText('#101')).toBeDefined();
    expect(screen.queryByText('Supplied Reason / Action Note')).toBeNull();
  });

  it('redirects to admin login when the detail request returns 401', async () => {
    const err = new service.AuditLogServiceError('Administrator sign-in is required.', 401);
    vi.mocked(service.getAuditLogDetail).mockRejectedValue(err);

    render(<AuditLogDetailDrawer logId={101} isOpen={true} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(routerReplace).toHaveBeenCalledWith('/admin/login?returnUrl=%2Fadmin%2Faudit-logs');
    });
  });

  it('renders error state when audit log entry is not found (404)', async () => {
    const err = new service.AuditLogServiceError('Not found', 404, 'admin.audit_log_not_found');
    vi.mocked(service.getAuditLogDetail).mockRejectedValue(err);

    render(<AuditLogDetailDrawer logId={999} isOpen={true} onClose={mockOnClose} />);

    expect(await screen.findByText('System audit log entry not found.')).toBeDefined();
  });

  it('renders error state MSG127 when system or network failure occurs (500)', async () => {
    const err = new service.AuditLogServiceError(
      'TripMate is temporarily unable to process your request. Please check your connection and try again.',
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

  it('calls onClose when close button is clicked', async () => {
    vi.mocked(service.getAuditLogDetail).mockResolvedValue(buildDetail({
      beforeData: null,
      afterData: null,
      ipAddress: null,
    }));

    render(<AuditLogDetailDrawer logId={101} isOpen={true} onClose={mockOnClose} />);

    const closeButtons = await screen.findAllByRole('button', { name: /close/i });
    fireEvent.click(closeButtons[0]);

    expect(mockOnClose).toHaveBeenCalled();
  });
});
