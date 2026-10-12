import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { UserAccountDetailView } from './UserAccountDetailView';

describe('UserAccountDetailView (Screen #07 Account Details)', () => {
  it('renders known user account details with organization and verified badge', () => {
    render(<UserAccountDetailView userId={4402} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Nguyễn Văn Nam' })).toBeTruthy();
    expect(screen.getByText('ID: #USR-4402')).toBeTruthy();
    expect(screen.getByText('Hanoi Heritage Travel Co., Ltd')).toBeTruthy();
    expect(screen.getByText('Verified Partner')).toBeTruthy();
    expect(screen.getByText('Tour Operator')).toBeTruthy();
    expect(screen.getByText('nam.nguyen@hanoicheritage.vn')).toBeTruthy();
    expect(screen.getByText('0912 345 678')).toBeTruthy();
  });

  it('renders not found state when user id is not in preloaded mock data', () => {
    render(<UserAccountDetailView userId={9999} />);

    expect(screen.getByRole('heading', { level: 1, name: 'User Account Not Found' })).toBeTruthy();
    expect(
      screen.getByText(/No account exists with ID #9999 \(MSG128: Account does not exist\)/),
    ).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Back to User Account Management' })).toBeTruthy();
  });

  it('renders moderation history and booking count for known account', () => {
    render(<UserAccountDetailView userId={2091} />);

    expect(screen.getByText('Moderation & Audit History')).toBeTruthy();
    expect(screen.getByText(/Account Status Flag: Locked/)).toBeTruthy();
    expect(screen.getByText(/Policy violation/)).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
  });

  it('provides a navigation link back to the user account management directory', () => {
    render(<UserAccountDetailView userId={4402} />);

    const backLink = screen.getByRole('link', { name: 'Back to User Account Management' });
    expect(backLink.getAttribute('href')).toBe('/admin/users');
  });
});
