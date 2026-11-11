import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./VerificationPageShell', () => ({
  VerificationPageShell: ({ children }: { children: ReactNode }) => (
    <section data-testid="verification-shell">{children}</section>
  ),
}));

vi.mock('./VerifyAccountForm', () => ({
  VerifyAccountForm: ({ email }: { email?: string }) => (
    <div data-testid="verify-account-form">{email}</div>
  ),
}));

import { VerifyAccountPage } from './VerifyAccountPage';

describe('VerifyAccountPage composition', () => {
  it('reuses the shared verification shell and forwards the initial email', () => {
    render(<VerifyAccountPage email="traveler@example.com" />);

    expect(
      screen.getByTestId('verification-shell').contains(screen.getByTestId('verify-account-form')),
    ).toBe(true);
    expect(screen.getByText('traveler@example.com')).toBeDefined();
  });
});
