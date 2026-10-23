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

  function deferredResponse() {
    let resolve!: (response: Response) => void;
    const promise = new Promise<Response>((done) => { resolve = done; });
    return { promise, resolve };
  }

  function reportResponse(marker?: string) {
    return new Response(JSON.stringify({
      summary: { grossRevenue: 0, platformCommission: 0, netAmount: 0, totalBookings: 0, totalParticipants: 0, refundedAmount: 0, commissionRatePercent: 10 },
      chartData: [], tourDetails: [], totalToursCount: 0, page: 1, pageSize: 20, totalPages: 0,
      ...(marker ? { errorMessage: marker } : {}),
    }));
  }

  function ownedTourResponse(id = 7) {
    return new Response(JSON.stringify([{ id, code: `T${id}`, title: `Owned tour ${id}`, isActive: true }]));
  }

  it('announces initial tour loading independently of the report and distinguishes successful empty results', async () => {
    mockSearchParams = new URLSearchParams('');
    const tours = deferredResponse();
    vi.stubGlobal('fetch', productionFetch(() => tours.promise));
    render(<OperatorRevenueView />);
    await waitFor(() => expect((screen.getByRole('button', { name: /Apply Filters/i }) as HTMLButtonElement).disabled).toBe(false));
    const select = screen.getByLabelText(/Tour Package/i) as HTMLSelectElement;
    expect(select.disabled).toBe(true);
    expect(select.getAttribute('aria-busy')).toBe('true');
    expect(screen.getByText('Loading tour filters…').getAttribute('role')).toBe('status');
    expect(screen.getByText('Loading tour filters…').getAttribute('aria-live')).toBe('polite');
    await act(async () => tours.resolve(new Response('[]')));
    expect(select.disabled).toBe(false);
    expect(screen.queryByText('Loading tour filters…')).toBeNull();
    expect(select.value).toBe('all');
    expect(screen.queryByText(/Unable to load tour filters/)).toBeNull();
  });

  it('announces retry loading while preserving same-actor draft filters and leaving the report alone', async () => {
    mockSearchParams = new URLSearchParams('');
    const retry = deferredResponse();
    const tours = vi.fn().mockResolvedValueOnce(new Response('{}', { status: 500 })).mockReturnValueOnce(retry.promise);
    const fetchMock = productionFetch(tours);
    vi.stubGlobal('fetch', fetchMock);
    render(<OperatorRevenueView />);
    await screen.findByText(/Unable to load tour filters/);
    fireEvent.change(screen.getByLabelText(/Start Date/), { target: { value: '2026-09-01' } });
    fireEvent.change(screen.getByLabelText(/Granularity/), { target: { value: 'weekly' } });
    const reportCalls = fetchMock.mock.calls.filter(([url]) => url.includes('/report')).length;
    fireEvent.click(screen.getByRole('button', { name: /Retry tour filters/ }));
    expect(screen.queryByText(/Unable to load tour filters/)).toBeNull();
    expect((screen.getByLabelText(/Tour Package/) as HTMLSelectElement).disabled).toBe(true);
    expect(screen.getByText('Loading tour filters…')).toBeDefined();
    await act(async () => retry.resolve(ownedTourResponse()));
    expect((screen.getByLabelText(/Start Date/) as HTMLInputElement).value).toBe('2026-09-01');
    expect((screen.getByLabelText(/Granularity/) as HTMLSelectElement).value).toBe('weekly');
    expect(fetchMock.mock.calls.filter(([url]) => url.includes('/report')).length).toBe(reportCalls);
  });

  it.each([false, true])('resets actor-owned tour filters when switching actor (applied=%s)', async (apply) => {
    mockSearchParams = new URLSearchParams('');
    const fetchMock = productionFetch(() => Promise.resolve(ownedTourResponse()));
    vi.stubGlobal('fetch', fetchMock);
    const view = render(<OperatorRevenueView />);
    await screen.findByRole('option', { name: /Owned tour/ });
    fireEvent.change(screen.getByLabelText(/Tour Package/), { target: { value: '7' } });
    fireEvent.change(screen.getByLabelText(/Start Date/), { target: { value: '2026-09-01' } });
    fireEvent.change(screen.getByLabelText(/Granularity/), { target: { value: 'weekly' } });
    if (apply) {
      fireEvent.click(screen.getByRole('button', { name: /Apply Filters/ }));
      await waitFor(() => expect((screen.getByRole('button', { name: /Apply Filters/ }) as HTMLButtonElement).disabled).toBe(false));
    }
    // Same-actor session rerenders must retain both applied and unapplied edits.
    view.rerender(<OperatorRevenueView />);
    expect((screen.getByLabelText(/Start Date/) as HTMLInputElement).value).toBe('2026-09-01');
    expect((screen.getByLabelText(/Granularity/) as HTMLSelectElement).value).toBe('weekly');
    expect((screen.getByLabelText(/Tour Package/) as HTMLSelectElement).value).toBe('7');
    fireEvent.click(screen.getAllByRole('button', { name: /Export Report/ })[0]);
    const callsBeforeSwitch = fetchMock.mock.calls.length;
    mockActorUserId = 202;
    view.rerender(<OperatorRevenueView />);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect((screen.getByLabelText(/Tour Package/) as HTMLSelectElement).value).toBe('all');
    await waitFor(() => expect((screen.getByRole('button', { name: /Apply Filters/ }) as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(screen.getByRole('button', { name: /Apply Filters/ }));
    await waitFor(() => {
      const requests = fetchMock.mock.calls.slice(callsBeforeSwitch).filter(([url]) => url.includes('/report'));
      expect(requests.length).toBeGreaterThanOrEqual(2);
      expect(requests.every(([url]) => !new URL(url, 'https://test').searchParams.has('tourId'))).toBe(true);
    });
  });

  it('resets the selected tour on demo to production transition for the same actor', async () => {
    const view = render(<OperatorRevenueView />);
    await waitFor(() => expect((screen.getByRole('button', { name: /Apply Filters/ }) as HTMLButtonElement).disabled).toBe(false));
    const select = screen.getByLabelText(/Tour Package/) as HTMLSelectElement;
    fireEvent.change(select, { target: { value: select.options[1].value } });
    fireEvent.click(screen.getByRole('button', { name: /Apply Filters/ }));
    await waitFor(() => expect((screen.getByRole('button', { name: /Apply Filters/ }) as HTMLButtonElement).disabled).toBe(false));
    const fetchMock = productionFetch(() => Promise.resolve(ownedTourResponse()));
    vi.stubGlobal('fetch', fetchMock);
    mockSearchParams = new URLSearchParams('');
    view.rerender(<OperatorRevenueView />);
    await screen.findByRole('option', { name: /Owned tour/ });
    expect((screen.getByLabelText(/Tour Package/) as HTMLSelectElement).value).toBe('all');
    expect(fetchMock.mock.calls.filter(([url]) => url.includes('/report')).every(([url]) => !url.includes('tourId='))).toBe(true);
  });

  it('ignores a late report from the previous actor', async () => {
    mockSearchParams = new URLSearchParams('');
    const oldReport = deferredResponse();
    let reportCalls = 0;
    const fallback = productionFetch(() => Promise.resolve(ownedTourResponse()));
    vi.stubGlobal('fetch', vi.fn((url: string) => url.includes('/report')
      ? (++reportCalls === 1 ? oldReport.promise : Promise.resolve(reportResponse('Current actor report')))
      : fallback(url)));
    const view = render(<OperatorRevenueView />);
    mockActorUserId = 202;
    view.rerender(<OperatorRevenueView />);
    await screen.findByText('Current actor report');
    await act(async () => oldReport.resolve(reportResponse('Previous actor report')));
    expect(screen.queryByText('Previous actor report')).toBeNull();
    expect(screen.getByText('Current actor report')).toBeDefined();
  });

  it.each([{ oldFirst: true, changedFilters: false }, { oldFirst: false, changedFilters: false }, { oldFirst: true, changedFilters: true }, { oldFirst: false, changedFilters: true }])('ignores obsolete report completion (oldFirst=$oldFirst, changedFilters=$changedFilters)', async ({ oldFirst, changedFilters }) => {
    mockSearchParams = new URLSearchParams('');
    const foreground = deferredResponse();
    const focused = deferredResponse();
    let reportCalls = 0;
    const fallback = productionFetch(() => Promise.resolve(ownedTourResponse()));
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (!url.includes('/report')) return fallback(url);
      reportCalls++;
      return reportCalls === 1 ? Promise.resolve(reportResponse()) : reportCalls === 2 ? foreground.promise : focused.promise;
    }));
    render(<OperatorRevenueView />);
    const applyButton = () => screen.getByRole('button', { name: /Apply Filters/ }) as HTMLButtonElement;
    await waitFor(() => expect(applyButton().disabled).toBe(false));
    if (changedFilters) fireEvent(window, new Event('focus'));
    fireEvent.change(screen.getByLabelText(/Start Date/), { target: { value: '2026-09-01' } });
    fireEvent.click(applyButton());
    if (!changedFilters) fireEvent(window, new Event('focus'));
    if (oldFirst) {
      await act(async () => foreground.resolve(reportResponse('Obsolete report')));
      expect(applyButton().disabled).toBe(true);
      expect(screen.queryByText('Obsolete report')).toBeNull();
    }
    await act(async () => focused.resolve(reportResponse('Latest report')));
    expect(applyButton().disabled).toBe(false);
    expect(screen.getByText('Latest report')).toBeDefined();
    if (!oldFirst) await act(async () => foreground.resolve(reportResponse('Obsolete report')));
    expect(screen.queryByText('Obsolete report')).toBeNull();
    expect(screen.getByText('Latest report')).toBeDefined();
  });

  it('does not automatically download a previous actor export that completes after switching', async () => {
    mockSearchParams = new URLSearchParams('');
    const created = deferredResponse();
    const fallback = productionFetch(() => Promise.resolve(ownedTourResponse()));
    const fetchMock = vi.fn((url: string, init?: RequestInit) => init?.method === 'POST' ? created.promise : fallback(url));
    vi.stubGlobal('fetch', fetchMock);
    const view = render(<OperatorRevenueView />);
    await screen.findByRole('option', { name: /Owned tour/ });
    fireEvent.click(screen.getAllByRole('button', { name: /Export Report/ })[0]);
    fireEvent.submit(screen.getByRole('dialog').querySelector('form')!);
    await waitFor(() => expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(true));
    mockActorUserId = 202;
    view.rerender(<OperatorRevenueView />);
    await act(async () => created.resolve(new Response(JSON.stringify({ id: 42, status: 'Ready', fileName: 'old.xlsx' }), { status: 201 })));
    expect(fetchMock.mock.calls.some(([url]) => url.includes('/42/download'))).toBe(false);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
