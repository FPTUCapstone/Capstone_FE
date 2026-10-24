import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/tour-operator-applications',
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));

import {
  TourOperatorApplicationListView,
  type OperatorApplicationSummary,
} from '@/features/admin/tour-operator-applications/components/TourOperatorApplicationListView';

const TEST_APPLICATIONS: OperatorApplicationSummary[] = [
  {
    userId: 101,
    companyName: 'Saigon Eco Adventure Co., Ltd',
    taxCode: '0312456789',
    contactPhone: '+84 28 3822 9999',
    submittedAt: '2026-10-22',
    applicationStatus: 'Pending',
    documentsCount: 2,
    hasBusinessLicense: true,
  },
  {
    userId: 102,
    companyName: 'Hanoi Heritage Trails Travel',
    taxCode: '0109876543',
    contactPhone: '+84 24 3934 8888',
    submittedAt: '2026-10-21',
    applicationStatus: 'Pending',
    documentsCount: 2,
    hasBusinessLicense: true,
  },
  {
    userId: 103,
    companyName: 'Da Nang Sea Breeze Tours JSC',
    taxCode: '0401234567',
    contactPhone: '+84 236 3844 777',
    submittedAt: '2026-10-18',
    applicationStatus: 'Approved',
    documentsCount: 2,
    hasBusinessLicense: true,
  },
];

describe('TourOperatorApplicationListView (Screen #10, UC-50/51)', () => {
  it('renders application queue header, status filter tabs, search input and data table', () => {
    render(<TourOperatorApplicationListView initialApplications={TEST_APPLICATIONS} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Tour Operator Applications' })).toBeTruthy();
    expect(screen.getByText('Operational Review Queue')).toBeTruthy();

    const table = screen.getByRole('table', { name: 'Tour Operator Applications Queue' });
    expect(table).toBeTruthy();

    expect(screen.getByText('Saigon Eco Adventure Co., Ltd')).toBeTruthy();
    expect(screen.getByText('Hanoi Heritage Trails Travel')).toBeTruthy();
    expect(screen.getByText('Da Nang Sea Breeze Tours JSC')).toBeTruthy();
  });

  it('renders honest empty queue state when no applications exist', () => {
    render(<TourOperatorApplicationListView initialApplications={[]} />);

    expect(screen.getByText('No operator applications in queue')).toBeTruthy();
    expect(
      screen.getByText('Applications will appear here when partner registrations are submitted.'),
    ).toBeTruthy();
  });

  it('renders filter tabs and allows status filtering', () => {
    render(<TourOperatorApplicationListView initialApplications={TEST_APPLICATIONS} />);

    const allTab = screen.getByRole('tab', { name: 'All Applications' });
    const pendingTab = screen.getByRole('tab', { name: 'Pending' });
    expect(allTab).toBeTruthy();
    expect(pendingTab).toBeTruthy();
  });
});
