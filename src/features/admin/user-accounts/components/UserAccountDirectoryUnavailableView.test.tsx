import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { UserAccountDirectoryUnavailableView } from '@/features/admin/user-accounts/components/UserAccountDirectoryUnavailableView';

describe('UserAccountDirectoryUnavailableView', () => {
  it('truthfully marks every account-management control unavailable until the Backend directory contract exists', () => {
    const { container } = render(<UserAccountDirectoryUnavailableView />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'User Account Management' }),
    ).toBeTruthy();
    expect(screen.getByText('Backend integration pending')).toBeTruthy();
    expect(
      screen.getByText(
        'The account directory and account-status operations will be available after their Backend contracts are deployed.',
      ),
    ).toBeTruthy();

    const search = screen.getByRole('searchbox', { name: 'Search accounts' }) as HTMLInputElement;
    expect(search.disabled).toBe(true);
    expect(search.getAttribute('placeholder')).toBe('Search is unavailable until Backend integration');

    const filter = screen.getByRole('combobox', { name: 'Account status filter' }) as HTMLSelectElement;
    expect(filter.disabled).toBe(true);

    const operations = screen.getByRole('region', { name: 'Account operations unavailable' });
    expect(
      (within(operations).getByRole('button', { name: 'Lock account unavailable' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(
      (within(operations).getByRole('button', { name: 'Unlock account unavailable' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);

    expect(screen.getByRole('link', { name: 'Return to Staff Workspace' }).getAttribute('href')).toBe(
      '/admin/staff',
    );
    expect(container.querySelector('tbody')).toBeNull();
    expect(container.textContent).not.toMatch(/\b\d+\s+(accounts?|users?)\b/i);
  });
});
