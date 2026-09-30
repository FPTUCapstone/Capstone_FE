import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CheckboxField, PasswordField, TextField } from './FormControls';

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

describe('field validation accessibility', () => {
  it('announces text and checkbox errors while associating them with their controls', () => {
    render(
      <>
        <TextField label="Email" name="email" error="Email is required." />
        <CheckboxField
          checked={false}
          name="terms"
          error="Terms must be accepted."
          onChange={() => undefined}
        >
          Accept terms
        </CheckboxField>
      </>,
    );

    const email = screen.getByLabelText('Email');
    const terms = screen.getByRole('checkbox', { name: 'Accept terms' });
    const alerts = screen.getAllByRole('alert');

    expect(alerts).toHaveLength(2);
    expect(email.getAttribute('aria-describedby')).toBe(alerts[0].id);
    expect(terms.getAttribute('aria-describedby')).toBe(alerts[1].id);
  });
});
