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
      screen.getAllByText(
        'The account directory and account-status operations will be available after their Backend contracts are deployed.',
      ).length,
    ).toBeGreaterThanOrEqual(2);

    const search = screen.getByRole('searchbox', { name: 'Search accounts' }) as HTMLInputElement;
    expect(search.disabled).toBe(true);
    expect(search.getAttribute('placeholder')).toBe('Search is unavailable until Backend integration');
    expect(search.getAttribute('aria-describedby')).toBe('account-controls-pending-desc');

    const filter = screen.getByRole('combobox', { name: 'Account status filter' }) as HTMLSelectElement;
    expect(filter.disabled).toBe(true);
    expect(filter.getAttribute('aria-describedby')).toBe('account-controls-pending-desc');

    const operations = screen.getByRole('region', { name: 'Account operations unavailable' });
    const lockBtn = within(operations).getByRole('button', { name: 'Lock account unavailable' }) as HTMLButtonElement;
    expect(lockBtn.disabled).toBe(true);
    expect(lockBtn.getAttribute('aria-describedby')).toBe('account-controls-pending-desc');

    const unlockBtn = within(operations).getByRole('button', { name: 'Unlock account unavailable' }) as HTMLButtonElement;
    expect(unlockBtn.disabled).toBe(true);
    expect(unlockBtn.getAttribute('aria-describedby')).toBe('account-controls-pending-desc');

    expect(screen.getByRole('link', { name: 'Return to Administration Dashboard' }).getAttribute('href')).toBe(
      '/admin',
    );
    expect(container.querySelector('#account-controls-pending-desc')).toBeTruthy();
    expect(container.querySelector('tbody')).toBeNull();
    expect(container.textContent).not.toMatch(/\b\d+\s+(accounts?|users?)\b/i);
  });
});
