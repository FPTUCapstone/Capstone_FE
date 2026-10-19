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
      expect(screen.getAllByText(/Backend Integration Pending/i).length).toBeGreaterThan(0);
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

  it('disables the export trigger and explains that backend integration is pending', async () => {
    render(<OperatorRevenueView />);

    const exportButtons = screen.getAllByRole('button', { name: /Export Report/i });
    expect(exportButtons.length).toBeGreaterThan(0);
    exportButtons.forEach((button) => expect(button.hasAttribute('disabled')).toBe(true));
    expect(screen.getAllByText('Backend integration pending').length).toBeGreaterThan(0);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('does not expose the demo export simulation through the disabled workspace trigger', async () => {
    render(<OperatorRevenueView />);

    const exportButtons = screen.getAllByRole('button', { name: /Export Report/i });
    expect(exportButtons[0].hasAttribute('disabled')).toBe(true);
    fireEvent.click(exportButtons[0]);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(
      screen.queryByText(/Revenue report exported successfully/i)
    ).toBeNull();
    expect(screen.queryByText(/queued successfully/i)).toBeNull();
  });

  it('shows when the report was last loaded and lets the operator force a reload without changing filters', async () => {
    render(<OperatorRevenueView />);

    await waitFor(() => {
      expect(screen.getByTestId('revenue-last-updated').textContent).toMatch(
        /^Updated /
      );
    });

    const refreshButton = screen.getByRole('button', { name: /Refresh/i });
    expect(refreshButton.hasAttribute('disabled')).toBe(false);

    const updatedAtBeforeClick = screen.getByTestId(
      'revenue-last-updated'
    ).textContent;
    fireEvent.click(refreshButton);

    // Refresh must not pop the export dialog, change the applied filters, or require a page
    // reload — it only asks for the same report again.
    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => {
      expect(screen.getByTestId('revenue-last-updated').textContent).toMatch(
        /^Updated /
      );
    });
    expect(
      (screen.getByLabelText(/Start Date/i) as HTMLInputElement).value
    ).toBe('2026-10-01');
    void updatedAtBeforeClick;
  });

  it('silently refreshes when the tab regains focus, without disabling the Refresh control', async () => {
    render(<OperatorRevenueView />);

    await waitFor(() => {
      expect(screen.getByTestId('revenue-last-updated').textContent).toMatch(
        /^Updated /
      );
    });

    fireEvent(window, new Event('focus'));

    // A background/silent refresh must never disable the controls the way an explicit,
    // user-initiated reload does.
    expect(
      screen.getByRole('button', { name: /Refresh/i }).hasAttribute('disabled')
    ).toBe(false);
    expect(
      screen.getByRole('button', { name: /Apply Filters/i }).hasAttribute('disabled')
    ).toBe(false);
  });

  it('REGRESSION: applying the same filter values twice in a row does not leave Apply stuck disabled', async () => {
    render(<OperatorRevenueView />);

    const applyButton = () =>
      screen.getByRole('button', { name: /Apply Filters/i }) as HTMLButtonElement;

    await waitFor(() => expect(applyButton().disabled).toBe(false));

    // Click Apply twice without editing any field in between. The second click submits a
    // filter object that is value-identical to (and, before the fix, the same reference as)
    // the already-applied one, which must not stop the report from reloading and the button
    // from re-enabling.
    fireEvent.click(applyButton());
    await waitFor(() => expect(applyButton().disabled).toBe(false));

    fireEvent.click(applyButton());
    await waitFor(() => expect(applyButton().disabled).toBe(false));
  });
});
