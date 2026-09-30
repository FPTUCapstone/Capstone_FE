import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';
import { AuditLogDetailDrawer } from './AuditLogDetailDrawer';
import * as service from '../services/auditLogAdminService';

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

    expect(await screen.findByText('#101')).toBeDefined();
    expect(screen.getByText('ApproveOperatorApplication')).toBeDefined();
    expect(screen.getByText('Admin User')).toBeDefined();
    expect(screen.getByText('admin@tripmate.vn')).toBeDefined();
    expect(screen.getByText('13/09/2026 17:00:00')).toBeDefined();
    expect(screen.getByText('127.0.0.1')).toBeDefined();
  });

  it('renders error state MSG129 when audit log entry is not found (404)', async () => {
    const err = new service.AuditLogServiceError('Not found', 404, 'admin.audit_log_not_found');
    vi.mocked(service.getAuditLogDetail).mockRejectedValue(err);

    render(<AuditLogDetailDrawer logId={999} isOpen={true} onClose={mockOnClose} />);

    expect(await screen.findByText('System audit log entry not found. (MSG129)')).toBeDefined();
  });

  it('calls onClose when close button is clicked', async () => {
    const mockDetail = {
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
