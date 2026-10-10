import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OperatorRevenueView } from './OperatorRevenueView';

let mockSearchParams = new URLSearchParams('demo=1');

vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

vi.mock('@/features/auth/session/useWebSession', () => ({
  useWebSession: () => ({
    status: 'authenticated',
    context: {
      userId: 101,
      role: 'TourOperator',
      status: 'Active',
      applicationStatus: 'Approved',
      email: 'operator101@test.com',
    },
  }),
}));

describe('OperatorRevenueView (Screen #89)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      NODE_ENV: 'test',
      NEXT_PUBLIC_ENABLE_DEMO_FIXTURES: 'true',
    };
    mockSearchParams = new URLSearchParams('demo=1');
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('renders Screen #89 with header, demo banner, summary metrics, chart, and table', async () => {
    render(<OperatorRevenueView />);

    expect(screen.getByRole('heading', { name: /Revenue & Analytics/i })).toBeDefined();
    expect(screen.getByText(/Demo Finance Mode Active/i)).toBeDefined();

    await waitFor(() => {
      expect(screen.getAllByText(/Gross Revenue/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Platform Commission/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Net Amount/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Total Bookings/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Revenue Trend/i)).toBeDefined();
      expect(screen.getByText(/Tour Package Breakdown/i)).toBeDefined();
    });
  });

  it('displays truthful PENDING_BE_INTEGRATION notice when demo query is absent', async () => {
    mockSearchParams = new URLSearchParams('');
    render(<OperatorRevenueView />);

    await waitFor(() => {
      expect(screen.getByText(/Backend Integration Pending/i)).toBeDefined();
      expect(
        screen.getByText(/Revenue calculation and reporting backend integration is pending/i)
      ).toBeDefined();
    });
  });

  it('enforces CR-02 draft filter behavior: does not re-query until Apply Filters is clicked', async () => {
    render(<OperatorRevenueView />);

    await waitFor(() => {
      expect(screen.getAllByText(/Ba Na Hills Full-Day Tour/i).length).toBeGreaterThan(0);
    });

    const startDateInput = screen.getByLabelText(/Start Date/i);
    fireEvent.change(startDateInput, { target: { value: '2026-09-15' } });

    // While in draft state, table still shows initial data
    expect(screen.getAllByText(/Ba Na Hills Full-Day Tour/i).length).toBeGreaterThan(0);

    // Click Apply Filters
    const applyButton = screen.getByRole('button', { name: /Apply Filters/i });
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Revenue & Analytics/i })).toBeDefined();
    });
  });

  it('opens Screen #90 Export Revenue Report dialog when Export Report button is clicked', async () => {
    render(<OperatorRevenueView />);

    const exportButtons = screen.getAllByRole('button', { name: /Export Report/i });
    expect(exportButtons.length).toBeGreaterThan(0);
    fireEvent.click(exportButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeDefined();
      expect(
        screen.getByRole('heading', { name: /Export Revenue Report/i })
      ).toBeDefined();
      expect(screen.getByText(/Applied Filter Summary/i)).toBeDefined();
    });
  });

  it('does not show a fake successful-export toast when Demo async simulation is submitted', async () => {
    render(<OperatorRevenueView />);

    const exportButtons = screen.getAllByRole('button', { name: /Export Report/i });
    fireEvent.click(exportButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeDefined();
    });

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    const submitExportBtn = screen.getByRole('button', { name: /Export File/i });
    fireEvent.click(submitExportBtn);

    await waitFor(() => {
      expect(
        screen.getByText('Demo Async Export Simulation')
      ).toBeDefined();
      expect(
        screen.getByText(
          /No background export job was created and no notification will be sent/i
        )
      ).toBeDefined();
    });

    // Must keep dialog open with simulation notice and never show the green export-completed toast
    expect(screen.getByRole('dialog')).toBeDefined();
    expect(
      screen.queryByText(/Revenue report exported successfully/i)
    ).toBeNull();
    expect(screen.queryByText(/queued successfully/i)).toBeNull();
  });
});
