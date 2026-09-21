import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PasswordField } from './FormControls';

describe('PasswordField end control', () => {
  it('positions the visibility button inside the input wrapper even when help text exists', () => {
    render(
      <PasswordField
        label="New Password"
        name="newPassword"
        help="Password requirements"
        leading={<span>lock</span>}
      />,
    );

    const input = screen.getByLabelText('New Password');
    const visibilityButton = screen.getByRole('button', { name: 'Show New Password' });

    expect(visibilityButton.parentElement).toBe(input.parentElement);
  });
});
