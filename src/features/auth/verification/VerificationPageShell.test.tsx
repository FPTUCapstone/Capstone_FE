import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { VerificationPageShell } from './VerificationPageShell';

describe('VerificationPageShell', () => {
  it('keeps the approved verification presentation around the owned handler', () => {
    render(
      <VerificationPageShell>
        <div>Owned verification handler</div>
      </VerificationPageShell>,
    );

    expect(screen.getByText('Owned verification handler')).toBeDefined();
    expect(screen.getByText(/Need help\? Contact TripMate Customer Support/)).toBeDefined();
    expect(screen.getAllByText('TripMate').length).toBeGreaterThan(0);
  });
});
