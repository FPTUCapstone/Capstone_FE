import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { TourOperatorApplicationDetailDto } from '@/types/tour-operator-application';
import { CompanyInfoCard } from './CompanyInfoCard';

const rejectedApplication: TourOperatorApplicationDetailDto = {
  userId: 51,
  role: 'TourOperator',
  accountStatus: 'Rejected',
  applicationStatus: 'Rejected',
  companyName: 'UC-51 Long Reason Travel',
  taxCode: 'UC51-TAX-LONG',
  businessLicenseNumber: 'UC51-LIC-LONG',
  documents: [],
  reviewedBy: 1,
  reviewedAt: '2026-09-28T15:00:00Z',
  rejectionReason: 'A'.repeat(500),
};

describe('UC-51 rejection reason presentation', () => {
  it('collapses a long reason and lets the administrator expand and collapse it', () => {
    render(<CompanyInfoCard detail={rejectedApplication} />);

    const reason = screen.getByText('A'.repeat(500));
    const toggle = screen.getByRole('button', { name: 'Show full reason' });

    expect(reason.className).toContain('line-clamp-4');
    expect(reason.className).toContain('[overflow-wrap:anywhere]');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(toggle);
    expect(reason.className).not.toContain('line-clamp-4');
    expect(screen.getByRole('button', { name: 'Show less' }).getAttribute('aria-expanded')).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: 'Show less' }));
    expect(reason.className).toContain('line-clamp-4');
  });

  it('shows a short reason in full without an unnecessary toggle', () => {
    render(
      <CompanyInfoCard
        detail={{ ...rejectedApplication, rejectionReason: 'Business license could not be verified.' }}
      />,
    );

    expect(screen.getByText('Business license could not be verified.').className).not.toContain('line-clamp-4');
    expect(screen.queryByRole('button', { name: /show (full reason|less)/i })).toBeNull();
  });
});
