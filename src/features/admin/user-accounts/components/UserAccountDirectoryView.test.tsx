import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { UserAccountDirectoryView } from './UserAccountDirectoryView';
import { mockUserAccountsList } from '../data/mockUserAccounts';

describe('UserAccountDirectoryView (UC-47 View User Accounts)', () => {
  it('renders the directory heading, breadcrumbs, and KPI statistics cards', () => {
    render(<UserAccountDirectoryView initialAccounts={mockUserAccountsList} />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'User Account & Operator Management' }),
    ).toBeTruthy();
    expect(screen.getByText('TOTAL ACCOUNTS')).toBeTruthy();
    expect(screen.getByText('1,248')).toBeTruthy();
    expect(screen.getByText('TOUR OPERATORS')).toBeTruthy();
    expect(screen.getByText('LOCKED ACCOUNTS')).toBeTruthy();
    expect(screen.getByText('PENDING VERIFICATION')).toBeTruthy();
  });

  it('renders user account rows with roles and status badges', () => {
    render(<UserAccountDirectoryView initialAccounts={mockUserAccountsList} />);

    expect(screen.getByText('Nguyễn Văn Nam')).toBeTruthy();
    expect(screen.getByText('nam.nguyen@hanoicheritage.vn')).toBeTruthy();
    expect(screen.getByText('Trần Văn B')).toBeTruthy();
    expect(screen.getByText('tranvanb.travel@gmail.com')).toBeTruthy();
    expect(screen.getByText('Lê Thị Thanh Hương')).toBeTruthy();

    const viewLinks = screen.getAllByRole('link', { name: 'View details' });
    expect(viewLinks.length).toBe(mockUserAccountsList.length);
    expect(viewLinks[0].getAttribute('href')).toBe('/admin/users/4402');
  });

  it('filters account rows by search query', () => {
    render(<UserAccountDirectoryView initialAccounts={mockUserAccountsList} />);

    const searchInput = screen.getByRole('searchbox', { name: 'Search accounts' });
    fireEvent.change(searchInput, { target: { value: 'Nam' } });

    expect(screen.getByText('Nguyễn Văn Nam')).toBeTruthy();
    expect(screen.queryByText('Trần Văn B')).toBeNull();
  });

  it('filters account rows by role tab', () => {
    render(<UserAccountDirectoryView initialAccounts={mockUserAccountsList} />);

    const travelerTab = screen.getByRole('button', { name: /Traveler/i });
    fireEvent.click(travelerTab);

    expect(screen.getByText('Trần Văn B')).toBeTruthy();
    expect(screen.queryByText('Nguyễn Văn Nam')).toBeNull();

    const operatorTab = screen.getByRole('button', { name: /Tour Operator/i });
    fireEvent.click(operatorTab);

    expect(screen.getByText('Nguyễn Văn Nam')).toBeTruthy();
    expect(screen.queryByText('Trần Văn B')).toBeNull();
  });

  it('filters account rows by status dropdown', () => {
    render(<UserAccountDirectoryView initialAccounts={mockUserAccountsList} />);

    const statusSelect = screen.getByRole('combobox', { name: 'Account status filter' });
    fireEvent.change(statusSelect, { target: { value: 'Locked' } });

    expect(screen.getByText('Trần Văn B')).toBeTruthy();
    expect(screen.queryByText('Nguyễn Văn Nam')).toBeNull();
  });

  it('renders recent safety moderation timeline and policy advisory', () => {
    render(<UserAccountDirectoryView initialAccounts={mockUserAccountsList} />);

    expect(screen.getByText('Recent Safety Moderation Log')).toBeTruthy();
    expect(screen.getByText(/Automatic temporary lock on account #USR-2091/i)).toBeTruthy();
    expect(screen.getByText('Governance Policy')).toBeTruthy();
    expect(screen.getByText('ISO 27001 Standard')).toBeTruthy();
  });

  it('renders Last Sign-in column and supports registration date range filtering with MSG29 validation', () => {
    render(<UserAccountDirectoryView initialAccounts={mockUserAccountsList} />);

    expect(screen.getByText('Last Sign-in')).toBeTruthy();

    const fromDateInput = screen.getByLabelText('Registered from');
    const toDateInput = screen.getByLabelText('Registered to');

    // Trigger MSG29 validation error when fromDate > toDate
    fireEvent.change(fromDateInput, { target: { value: '2026-03-15' } });
    fireEvent.change(toDateInput, { target: { value: '2026-03-01' } });
    expect(screen.getByText('Start date cannot be after end date (MSG29)')).toBeTruthy();

    // Valid date range filtering: only February 2026
    fireEvent.change(fromDateInput, { target: { value: '2026-02-01' } });
    fireEvent.change(toDateInput, { target: { value: '2026-02-28' } });
    expect(screen.queryByText('Start date cannot be after end date (MSG29)')).toBeNull();
    // Nguyễn Văn Nam registered 14/02/2026
    expect(screen.getByText('Nguyễn Văn Nam')).toBeTruthy();
    // Phạm Quốc Hưng registered 10/03/2026 (filtered out)
    expect(screen.queryByText('Phạm Quốc Hưng')).toBeNull();
  });
});
