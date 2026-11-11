import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/account/common/AccountWorkspaceShell', () => ({
  AccountWorkspaceShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="account-workspace-shell">{children}</div>
  ),
}));

import AccountLayout, { metadata } from './layout';

describe('app/account/layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exposes valid title template and description metadata', () => {
    expect(metadata.title).toBeDefined();
    expect(metadata.description).toContain('TripMate');
  });

  it('wraps children inside AccountWorkspaceShell', () => {
    render(
      <AccountLayout>
        <div data-testid="test-child">Child Element</div>
      </AccountLayout>
    );

    expect(screen.getByTestId('account-workspace-shell')).toBeDefined();
    expect(screen.getByTestId('test-child')).toBeDefined();
  });
});
