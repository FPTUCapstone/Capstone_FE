import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditLogDetailDrawer } from './AuditLogDetailDrawer';
import { AuditLogTable } from './AuditLogTable';
import * as service from '../services/auditLogAdminService';

const { router } = vi.hoisted(() => ({ router: { replace: vi.fn() } }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

vi.mock('../services/auditLogAdminService', () => ({
  getAuditLogDetail: vi.fn(),
  AuditLogServiceError: class extends Error {},
}));

const entry = {
  id: 101, actionType: 'ApproveOperatorApplication', actorUserId: 10,
  actorEmail: 'admin@example.test', actorFullName: 'Admin', actorRole: 'Administrator' as const,
  affectedEntity: 'OperatorProfile', affectedEntityId: 5, ipAddress: null,
  createdAtUtc: '2026-09-13T10:00:00.000Z', createdAtLocal: '13/09/2026 17:00:00',
  beforeData: null, afterData: null, reason: null,
};

describe('audit result and reason', () => {
  beforeEach(() => vi.clearAllMocks());

  it.each(['Success', 'Failure', null] as const)('displays actual %s result in detail', async (result) => {
    vi.mocked(service.getAuditLogDetail).mockResolvedValue({ ...entry, result });
    render(<AuditLogDetailDrawer logId={101} isOpen onClose={vi.fn()} />);
    expect(await screen.findByText(result ?? 'No recorded result')).toBeDefined();
    expect(screen.getByText('No reason recorded')).toBeDefined();
  });

  it('renders the explicit business reason independently of JSON', async () => {
    vi.mocked(service.getAuditLogDetail).mockResolvedValue({
      ...entry, result: 'Success', reason: 'The licence is invalid',
      afterData: '{"reason":"Unrelated old payload note"}',
    });
    render(<AuditLogDetailDrawer logId={101} isOpen onClose={vi.fn()} />);
    expect(await screen.findByText('The licence is invalid')).toBeDefined();
  });

  it('does not infer a missing reason from legacy payload keys', async () => {
    vi.mocked(service.getAuditLogDetail).mockResolvedValue({
      ...entry, result: null, afterData: '{"reason":"Legacy note"}',
    });
    render(<AuditLogDetailDrawer logId={101} isOpen onClose={vi.fn()} />);
    expect(await screen.findByText('No reason recorded')).toBeDefined();
  });

  it('labels failure metadata as context rather than saved state', async () => {
    vi.mocked(service.getAuditLogDetail).mockResolvedValue({
      ...entry, result: 'Failure', afterData: '{"auditMetadata":{"errorCode":"APPLICATION_ALREADY_REVIEWED"}}',
    });
    render(<AuditLogDetailDrawer logId={101} isOpen onClose={vi.fn()} />);
    expect(await screen.findByText('Failure Context')).toBeDefined();
    expect(screen.queryByText('After Data State')).toBeNull();
  });

  it('shows a Result column with success, failure and unknown rows', () => {
    render(<AuditLogTable isLoading={false} items={[
      { ...entry, id: 1, result: 'Success' },
      { ...entry, id: 2, result: 'Failure' },
      { ...entry, id: 3, result: null },
    ]} />);
    expect(screen.getByRole('columnheader', { name: 'Result' })).toBeDefined();
    const rows = screen.getAllByRole('row');
    ['Success', 'Failure', 'No recorded result'].forEach((label, index) => {
      expect(within(rows[index + 1]).getByText(label)).toBeDefined();
    });
  });
});
