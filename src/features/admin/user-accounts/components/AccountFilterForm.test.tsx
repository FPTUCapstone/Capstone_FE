// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { AccountFilterForm } from './AccountFilterForm';

afterEach(cleanup);

it('keeps the previous results visible when an invalid date range is submitted', () => {
  render(<>
    <AccountFilterForm invalidRange={false}>
      <label>Registered from <input type="date" name="registeredFrom" defaultValue="2026-11-16" /></label>
      <label>Registered to <input type="date" name="registeredTo" defaultValue="2026-11-15" /></label>
      <button>Apply filters</button>
    </AccountFilterForm>
    <p>Previous result</p>
  </>);

  const form = screen.getByRole('button').closest('form')!;
  expect(fireEvent.submit(form)).toBe(false);
  expect(screen.getByRole('alert').textContent).toContain('The selected date range is invalid.');
  expect(screen.getByText('Previous result')).toBeDefined();

  fireEvent.change(screen.getByLabelText('Registered to'), { target: { value: '2026-11-16' } });
  expect(fireEvent.submit(form)).toBe(true);
  expect(screen.queryByRole('alert')).toBeNull();
});
