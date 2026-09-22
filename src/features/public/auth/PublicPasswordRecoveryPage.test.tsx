import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PublicPasswordRecoveryPage } from './PublicPasswordRecoveryPage';

describe('PublicPasswordRecoveryPage auth layout', () => {
  it('uses the same immersive split-screen shell as sign-in and register', () => {
    const { container } = render(<PublicPasswordRecoveryPage />);
    const page = container.firstElementChild;

    expect(page?.className).toContain('min-h-screen');
    expect(page?.className).toContain('grid');
    expect(screen.queryByRole('banner')).toBeNull();
    expect(screen.getByLabelText('TripMate brand')).toBeDefined();
  });
});
