import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OperatorRevenueView } from './OperatorRevenueView';

let mockActorUserId = 101;
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
      userId: mockActorUserId,
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
    mockActorUserId = 101;
    process.env = {
      ...originalEnv,
      NODE_ENV: 'test',
      NEXT_PUBLIC_ENABLE_DEMO_FIXTURES: 'true',
    };
    mockSearchParams = new URLSearchParams('demo=1');
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
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
      expect(screen.getByText(/Settlement Breakdown/i)).toBeDefined();
      expect(screen.getByText(/Tour Package Breakdown/i)).toBeDefined();
    });
  });

  it('loads the production workspace through the revenue API when demo query is absent', async () => {
    mockSearchParams = new URLSearchParams('');
    const fetchMock = vi.fn((url: string) => {
      if (url.includes('/tours')) {
        return Promise.resolve(new Response(JSON.stringify([{ id: 7, code: 'TOUR-007', title: 'API tour', isActive: true }]), { status: 200 }));
      }
      if (url.includes('/exports')) {
        return Promise.resolve(new Response(JSON.stringify({
          items: [], totalCount: 0, page: 1, pageSize: 20, totalPages: 0,
        }), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify({
        summary: { grossRevenue: 10000, platformCommission: 1000, netAmount: 9000, totalBookings: 1, totalParticipants: 1, refundedAmount: 0, commissionRatePercent: 10 },
        chartData: [], tourDetails: [], totalToursCount: 1, page: 1, pageSize: 20, totalPages: 1,
      }), { status: 200 }));
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<OperatorRevenueView />);

    await waitFor(() => {
      expect(screen.getByRole('option', { name: /API tour/i })).toBeDefined();
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/operator/revenue/report?'),
        { cache: 'no-store' }
      );
    });
    expect(screen.queryByText(/Backend Integration Pending/i)).toBeNull();
  });

  function productionFetch(toursResponse: () => Promise<Response>) {
    return vi.fn((url: string) => {
      if (url.includes('/tours')) return toursResponse();
      if (url.includes('/exports')) return Promise.resolve(new Response(JSON.stringify({
        items: [], totalCount: 0, page: 1, pageSize: 20, totalPages: 0,
      })));
      return Promise.resolve(new Response(JSON.stringify({
        summary: { grossRevenue: 0, platformCommission: 0, netAmount: 0, totalBookings: 0, totalParticipants: 0, refundedAmount: 0, commissionRatePercent: 10 },
        chartData: [], tourDetails: [], totalToursCount: 0, page: 1, pageSize: 20, totalPages: 0,
      })));
    });
  }

  it('shows a safe tour-filter error independently of report success and retries only tours', async () => {
    mockSearchParams = new URLSearchParams('');
    const toursResponse = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ detail: 'private backend detail' }), { status: 403 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 7, code: 'T7', title: 'Recovered tour', isActive: true }])));
    const fetchMock = productionFetch(toursResponse);
    vi.stubGlobal('fetch', fetchMock);
    render(<OperatorRevenueView />);
    expect(await screen.findByText(/Unable to load tour filters/i)).toBeDefined();
    expect(screen.queryByText(/private backend detail/)).toBeNull();
    expect(screen.getByText(/Settlement Breakdown/)).toBeDefined();
    const reportCalls = fetchMock.mock.calls.filter(([url]) => url.includes('/report')).length;
    fireEvent.click(screen.getByRole('button', { name: /Retry tour filters/i }));
    expect(await screen.findByRole('option', { name: /Recovered tour/ })).toBeDefined();
    expect(screen.queryByText(/Unable to load tour filters/i)).toBeNull();
    expect(fetchMock.mock.calls.filter(([url]) => url.includes('/report')).length).toBe(reportCalls);
  });

  it('does not label a successful empty tour list as a failure', async () => {
    mockSearchParams = new URLSearchParams('');
    vi.stubGlobal('fetch', productionFetch(() => Promise.resolve(new Response('[]'))));
    render(<OperatorRevenueView />);
    await waitFor(() => expect(screen.getByTestId('revenue-last-updated').textContent).toMatch(/^Updated /));
    expect(screen.queryByText(/Unable to load tour filters/i)).toBeNull();
  });

  it('hides previous actor tours and ignores late previous-actor completion', async () => {
    mockSearchParams = new URLSearchParams('');
    let resolveOld!: (value: Response) => void;
    const toursResponse = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 1, code: 'OLD', title: 'Old actor tour', isActive: true }])))
      .mockImplementationOnce(() => new Promise<Response>((resolve) => { resolveOld = resolve; }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 2, code: 'NEW', title: 'New actor tour', isActive: true }])));
    vi.stubGlobal('fetch', productionFetch(toursResponse));
    const view = render(<OperatorRevenueView />);
    expect(await screen.findByRole('option', { name: /Old actor tour/ })).toBeDefined();
    mockActorUserId = 202;
    view.rerender(<OperatorRevenueView />);
    expect(screen.queryByRole('option', { name: /Old actor tour/ })).toBeNull();
    mockActorUserId = 303;
    view.rerender(<OperatorRevenueView />);
    expect(await screen.findByRole('option', { name: /New actor tour/ })).toBeDefined();
    await act(async () => resolveOld(new Response(JSON.stringify([{ id: 9, code: 'STALE', title: 'Stale tour', isActive: true }]))));
    expect(screen.queryByRole('option', { name: /Stale tour/ })).toBeNull();
  });

  it('handles a tour request rejection after unmount', async () => {
    mockSearchParams = new URLSearchParams('');
    let rejectTours!: (reason: Error) => void;
    vi.stubGlobal('fetch', productionFetch(() => new Promise<Response>((_resolve, reject) => { rejectTours = reject; })));
    const view = render(<OperatorRevenueView />);
    view.unmount();
    await act(async () => rejectTours(new Error('private network failure')));
    expect(screen.queryByText(/Unable to load tour filters/i)).toBeNull();
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

  it('opens the export dialog when Export Report is clicked (UC-45)', async () => {
    render(<OperatorRevenueView />);

    const exportButtons = screen.getAllByRole('button', { name: /Export Report/i });
    expect(exportButtons.length).toBeGreaterThan(0);
    exportButtons.forEach((button) => expect(button.hasAttribute('disabled')).toBe(false));

    fireEvent.click(exportButtons[0]);

    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText(/Excel Spreadsheet \(\.xlsx\)/i)).toBeDefined();
  });

  it('shows when the report was last loaded and lets the operator force a reload without changing filters', async () => {
    render(<OperatorRevenueView />);

    await waitFor(() => {
      expect(screen.getByTestId('revenue-last-updated').textContent).toMatch(
        /^Updated /
      );
    });

    const refreshButton = screen.getByRole('button', { name: /^Refresh$/i });
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
      screen.getByRole('button', { name: /^Refresh$/i }).hasAttribute('disabled')
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
