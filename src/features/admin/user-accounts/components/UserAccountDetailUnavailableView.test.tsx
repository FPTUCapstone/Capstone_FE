import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { UserAccountDetailUnavailableView } from '@/features/admin/user-accounts/components/UserAccountDetailUnavailableView';
import { parseUserAccountRouteId } from '@/features/admin/user-accounts/server/userAccountRouteId';

describe('UserAccountDetailUnavailableView', () => {
  it('uses the requested ID only as context and does not expose account actions before Backend integration', () => {
    render(<UserAccountDetailUnavailableView userId={42} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Account details unavailable' })).toBeTruthy();
    const requestedAccountId = screen.getByText('Requested account ID');
    expect(requestedAccountId.nextElementSibling?.textContent).toBe('42');
    expect(screen.getByRole('link', { name: 'Back to User Account Management' }).getAttribute('href')).toBe(
      '/admin/users',
    );

    const operations = screen.getByRole('region', { name: 'Account status operations unavailable' });
    expect(within(operations).queryByRole('button', { name: /lock account/i })).toBeNull();
    expect(within(operations).queryByRole('button', { name: /unlock account/i })).toBeNull();
  });

  it.each([
    ['42', 42],
    ['00042', 42],
    ['0', null],
    ['-1', null],
    ['1.5', null],
    ['abc', null],
    ['9007199254740992', null],
  ])('accepts only positive safe integer route IDs (%s)', (value, expected) => {
    expect(parseUserAccountRouteId(value)).toBe(expected);
  });
});
