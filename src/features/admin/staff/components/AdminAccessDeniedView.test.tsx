import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AdminAccessDeniedView } from './AdminAccessDeniedView';

describe('AdminAccessDeniedView', () => {
  it('shows Administrator-required copy by default', () => {
    render(<AdminAccessDeniedView />);
    expect(screen.getByText('Administrator Access Required')).not.toBeNull();
  });

  it('shows Staff-required copy for requiredRole="Staff"', () => {
    render(<AdminAccessDeniedView requiredRole="Staff" />);
    expect(screen.getByText('Staff Access Required')).not.toBeNull();
  });

  // DAILY-PAYOUT-TRANSFER plan Task 3a: UC-72 (Payout Settlements List) allows either role.
  it('shows "Staff or Administrator" copy when requiredRoles lists both', () => {
    render(<AdminAccessDeniedView requiredRoles={['Staff', 'Administrator']} />);
    expect(screen.getByText('Staff or Administrator Access Required')).not.toBeNull();
  });

  it('links the dual-role denial to the administration sign-in page, not a role-specific dashboard', () => {
    render(<AdminAccessDeniedView requiredRoles={['Staff', 'Administrator']} />);
    const links = screen.getAllByRole('link').map((link) => link.getAttribute('href'));
    expect(links).toContain('/admin/login');
    expect(links).not.toContain('/admin');
    expect(links).not.toContain('/admin/staff');
  });

  it('still renders a return-to-dashboard link for the existing single-role case', () => {
    render(<AdminAccessDeniedView requiredRole="Staff" />);
    const links = screen.getAllByRole('link').map((link) => link.getAttribute('href'));
    expect(links).toContain('/admin');
  });
});
