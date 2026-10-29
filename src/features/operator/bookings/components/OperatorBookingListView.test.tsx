import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthStorage, type WebAuthContext } from '@/features/auth/session/authSession';
import { OperatorBookingListView } from './OperatorBookingListView';
import * as bookingService from '../services/operatorBookingService';
import {
  OPERATOR_BOOKING_DEFAULT_PAGE_SIZE,
  OPERATOR_BOOKING_MESSAGES,
} from '../types/bookingLifecycle';
import { bookingEn } from '../resources/en';
import { detailExample, listExample } from '../utils/bookingApiFixtures';

const mocks = vi.hoisted(() => ({
  webRefresh: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
}));

vi.mock('@/lib/authApi', () => ({
  webRefresh: mocks.webRefresh,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mocks.push,
    replace: mocks.replace,
  }),
}));

function seedOperatorSession(userId = 101) {
  AuthStorage.accept(
    {
      userId,
      email: `operator${userId}@example.com`,
      fullName: `Operator ${userId}`,
      role: 'TourOperator',
      status: 'Active',
      applicationStatus: 'Approved',
      applicationUnresolved: false,
      accessToken: 'test-operator-token',
      accessTokenExpiresAtUtc: new Date(Date.now() + 3600_000).toISOString(),
    } as unknown as WebAuthContext,
    false
  );
}

describe('OperatorBookingListView (UC-40, UC-41, UC-42 Workspace)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      NODE_ENV: 'test',
      NEXT_PUBLIC_ENABLE_DEMO_FIXTURES: 'true',
    };
    mocks.webRefresh.mockRejectedValue({ status: 401, code: 'AUTH_TOKEN_INVALID' });
    bookingService.resetDemoBookingsState();
    seedOperatorSession(101);
  });

  afterEach(() => {
    cleanup();
    AuthStorage.clear();
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
    process.env = originalEnv;
  });

  describe('Live mode (UC-40 BFF, no demo)', () => {
    const fetchMock = vi.fn();
    const toursBody = [
      { id: 101, code: 'TOUR-00101', title: 'Ba Na Hills full-day tour', isActive: true },
      { id: 55, code: 'TOUR-00055', title: 'Food trail', isActive: false },
    ];
    const json = (body: unknown, status = 200) =>
      Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));

    /** Routes the BFF calls: list, tours (and anything else is a test error). */
    function routeFetch(handlers: { list?: () => Promise<Response>; tours?: () => Promise<Response> } = {}) {
      fetchMock.mockImplementation((url: string) => {
        if (url.startsWith('/api/operator/revenue/tours')) return (handlers.tours ?? (() => json(toursBody)))();
        if (url.startsWith('/api/operator/bookings')) return (handlers.list ?? (() => json(listExample())))();
        return Promise.reject(new Error(`unexpected fetch ${url}`));
      });
    }
    const listCalls = () =>
      fetchMock.mock.calls.map((call) => String(call[0])).filter((url) => url.startsWith('/api/operator/bookings'));

    beforeEach(() => {
      process.env = { ...originalEnv, NODE_ENV: 'test', NEXT_PUBLIC_ENABLE_DEMO_FIXTURES: 'false' };
      fetchMock.mockReset();
      vi.stubGlobal('fetch', fetchMock);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('renders the live items and the BE summary without any pending-integration banner or demo banner', async () => {
      routeFetch();
      render(<OperatorBookingListView isDemo={false} />);

      await waitFor(() => {
        expect(screen.getAllByText('BK-20261020-0007').length).toBeGreaterThan(0);
      });

      expect(screen.queryByText(OPERATOR_BOOKING_MESSAGES.PENDING_BE_INTEGRATION)).toBeNull();
      expect(screen.queryByText(/Demo Active/i)).toBeNull();
      expect(screen.getAllByText('Nguyen Van A').length).toBeGreaterThan(0);
      expect(screen.getAllByText('a@example.com').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Ba Na Hills full-day tour').length).toBeGreaterThan(0);
      // BE summary shown as returned (37 bookings, 112 participants)
      expect(screen.getAllByText('37').length).toBeGreaterThan(0); // KPI card (and the pagination total)
      expect(screen.getByText('112')).toBeDefined();
      expect(screen.getByText(/98\.400\.000/)).toBeDefined();
    });

    it('enables the filters and fills the tour select from the owned-tour list', async () => {
      routeFetch();
      render(<OperatorBookingListView isDemo={false} />);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Food trail' })).toBeDefined();
      });

      const tour = screen.getByLabelText(/Tour Package/i) as HTMLSelectElement;
      expect(tour.disabled).toBe(false);
      expect((screen.getByLabelText(/Booking Status/i) as HTMLSelectElement).disabled).toBe(false);
      expect((screen.getByLabelText(/Departure from date/i) as HTMLInputElement).disabled).toBe(false);
      expect((screen.getByLabelText(/To date/i) as HTMLInputElement).disabled).toBe(false);
      expect((screen.getByPlaceholderText(/Search booking code/i) as HTMLInputElement).disabled).toBe(false);
      expect((screen.getByRole('button', { name: /Apply Filter/i }) as HTMLButtonElement).disabled).toBe(false);
      expect(Array.from(tour.options).map((o) => o.value)).toEqual(['ALL', '101', '55']);
      const status = screen.getByLabelText(/Booking Status/i) as HTMLSelectElement;
      expect(Array.from(status.options).map((o) => o.value)).toContain('Expired');
    });

    it('shows the loading state while the list is being fetched', async () => {
      let release: (response: Response) => void = () => undefined;
      routeFetch({ list: () => new Promise<Response>((resolve) => { release = resolve; }) });
      render(<OperatorBookingListView isDemo={false} />);

      expect(screen.getByText(bookingEn.list.loading)).toBeDefined();

      release(new Response(JSON.stringify(listExample()), { status: 200 }));
      await waitFor(() => {
        expect(screen.getAllByText('BK-20261020-0007').length).toBeGreaterThan(0);
      });
      expect(screen.queryByText(bookingEn.list.loading)).toBeNull();
    });

    it('shows MSG128 for an empty live list', async () => {
      routeFetch({
        list: () =>
          json({
            pageNumber: 1,
            pageSize: 20,
            totalCount: 0,
            totalPages: 0,
            summary: { totalBookings: 0, totalParticipants: 0, totalConfirmedAmount: 0 },
            items: [],
          }),
      });
      render(<OperatorBookingListView isDemo={false} />);

      await waitFor(() => {
        expect(screen.getByText(OPERATOR_BOOKING_MESSAGES.MSG128)).toBeDefined();
      });
      expect(screen.queryByRole('button', { name: /Retry/i })).toBeNull();
    });

    it('shows MSG127 with a Retry button that refetches and then renders the data', async () => {
      let attempt = 0;
      routeFetch({
        list: () => (attempt++ === 0 ? json({ errorCode: 'MSG127' }, 503) : json(listExample())),
      });
      render(<OperatorBookingListView isDemo={false} />);

      await waitFor(() => {
        expect(screen.getByText(OPERATOR_BOOKING_MESSAGES.MSG127)).toBeDefined();
      });

      fireEvent.click(screen.getByRole('button', { name: /Retry/i }));

      await waitFor(() => {
        expect(screen.getAllByText('BK-20261020-0007').length).toBeGreaterThan(0);
      });
      expect(listCalls()).toHaveLength(2);
      expect(screen.queryByText(OPERATOR_BOOKING_MESSAGES.MSG127)).toBeNull();
    });

    it('shows MSG126 when the BE denies access', async () => {
      routeFetch({ list: () => json({ errorCode: 'operator_tour.access_required' }, 403) });
      render(<OperatorBookingListView isDemo={false} />);

      await waitFor(() => {
        expect(screen.getByText(OPERATOR_BOOKING_MESSAGES.MSG126)).toBeDefined();
      });
      expect(screen.queryByRole('button', { name: /Retry/i })).toBeNull();
    });

    it('keeps the list working with only "All Tour Packages" (select disabled) when the tour list fails', async () => {
      routeFetch({ tours: () => json({ errorCode: 'MSG127' }, 503) });
      render(<OperatorBookingListView isDemo={false} />);

      await waitFor(() => {
        expect(screen.getAllByText('BK-20261020-0007').length).toBeGreaterThan(0);
      });

      const tour = screen.getByLabelText(/Tour Package/i) as HTMLSelectElement;
      expect(tour.disabled).toBe(true);
      expect(Array.from(tour.options).map((o) => o.value)).toEqual(['ALL']);
      expect(screen.getByText(bookingEn.filters.tourOptionsUnavailable)).toBeDefined();
      // the other filters still work
      expect((screen.getByLabelText(/Booking Status/i) as HTMLSelectElement).disabled).toBe(false);
    });

    it('sends the applied filters mapped for the BE and resets to page 1 on Apply', async () => {
      routeFetch();
      render(<OperatorBookingListView isDemo={false} />);
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Food trail' })).toBeDefined();
      });
      expect(listCalls()).toEqual(['/api/operator/bookings?pageNumber=1&pageSize=20']);

      fireEvent.change(screen.getByLabelText(/Tour Package/i), { target: { value: '55' } });
      fireEvent.change(screen.getByLabelText(/Booking Status/i), { target: { value: 'Expired' } });
      fireEvent.change(screen.getByLabelText(/Departure from date/i), { target: { value: '2026-11-01' } });
      fireEvent.change(screen.getByLabelText(/To date/i), { target: { value: '2026-11-30' } });
      fireEvent.change(screen.getByPlaceholderText(/Search booking code/i), { target: { value: ' alice ' } });
      // drafts are not sent until Apply (CR-02)
      expect(listCalls()).toHaveLength(1);

      fireEvent.click(screen.getByRole('button', { name: /Apply Filter/i }));

      await waitFor(() => {
        expect(listCalls()).toHaveLength(2);
      });
      expect(listCalls()[1]).toBe(
        '/api/operator/bookings?tourId=55&status=Expired&departureFrom=2026-11-01&departureTo=2026-11-30&keyword=alice&pageNumber=1&pageSize=20'
      );
    });

    it('blocks an inverted date range with MSG31 and does not call the BFF again', async () => {
      routeFetch();
      render(<OperatorBookingListView isDemo={false} />);
      await waitFor(() => {
        expect(screen.getAllByText('BK-20261020-0007').length).toBeGreaterThan(0);
      });

      fireEvent.change(screen.getByLabelText(/Departure from date/i), { target: { value: '2026-11-30' } });
      fireEvent.change(screen.getByLabelText(/To date/i), { target: { value: '2026-11-01' } });
      fireEvent.click(screen.getByRole('button', { name: /Apply Filter/i }));

      await waitFor(() => {
        expect(screen.getByText(OPERATOR_BOOKING_MESSAGES.MSG31)).toBeDefined();
      });
      expect(listCalls()).toHaveLength(1);
    });

    it('paginates with the BE totalPages and requests the next page keeping the applied filters', async () => {
      routeFetch();
      render(<OperatorBookingListView isDemo={false} />);
      await waitFor(() => {
        expect(screen.getByText(/Showing/i)).toBeDefined();
      });

      fireEvent.click(screen.getByRole('button', { name: 'Next' }));

      await waitFor(() => {
        expect(listCalls()).toHaveLength(2);
      });
      expect(listCalls()[1]).toBe('/api/operator/bookings?pageNumber=2&pageSize=20');
    });

    it('never calls the cancel or refund endpoints and offers no demo data', async () => {
      routeFetch();
      render(<OperatorBookingListView isDemo={false} />);
      await waitFor(() => {
        expect(screen.getAllByText('BK-20261020-0007').length).toBeGreaterThan(0);
      });

      expect(screen.queryByText('BK-20260919-0141')).toBeNull();
      expect(fetchMock.mock.calls.every((call) => !String(call[0]).includes('cancel'))).toBe(true);
    });
  });

  describe('Live detail drawer (UC-40 detail endpoint)', () => {
    const fetchMock = vi.fn();
    const json = (body: unknown, status = 200) =>
      Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));

    function listOfTwo() {
      const body = listExample();
      const second = JSON.parse(JSON.stringify(body.items[0]));
      second.bookingId = '1202';
      second.bookingCode = 'BK-20261021-0008';
      second.booker.fullName = 'Tran Thi B';
      second.tour.title = 'Food trail';
      body.items.push(second);
      return body;
    }

    function detailFor(id: string, code: string, extra: Record<string, unknown> = {}) {
      return { ...detailExample(), bookingId: id, bookingCode: code, ...extra };
    }

    /** `details` maps a booking id to its response factory. */
    function routeFetch(details: Record<string, () => Promise<Response>>) {
      fetchMock.mockImplementation((url: string) => {
        if (url.startsWith('/api/operator/revenue/tours')) return json([]);
        const detail = /^\/api\/operator\/bookings\/(\d+)$/.exec(url);
        if (detail) return (details[detail[1]] ?? (() => json({ errorCode: 'operator_booking.not_found' }, 404)))();
        if (url.startsWith('/api/operator/bookings')) return json(listOfTwo());
        return Promise.reject(new Error(`unexpected fetch ${url}`));
      });
    }
    const detailCalls = () =>
      fetchMock.mock.calls.map((c) => String(c[0])).filter((url) => /^\/api\/operator\/bookings\/\d+$/.test(url));

    async function openFirstRow() {
      await waitFor(() => {
        expect(screen.getAllByText('BK-20261020-0007').length).toBeGreaterThan(0);
      });
      fireEvent.click(screen.getAllByRole('button', { name: /Details/i })[0]);
    }

    beforeEach(() => {
      process.env = { ...originalEnv, NODE_ENV: 'test', NEXT_PUBLIC_ENABLE_DEMO_FIXTURES: 'false' };
      fetchMock.mockReset();
      vi.stubGlobal('fetch', fetchMock);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('opens at once with the row basics and a skeleton, then shows the full detail from the detail endpoint', async () => {
      let release: (response: Response) => void = () => undefined;
      routeFetch({ '1201': () => new Promise<Response>((resolve) => { release = resolve; }) });
      render(<OperatorBookingListView isDemo={false} />);

      await openFirstRow();

      const dialog = await screen.findByRole('dialog');
      expect(dialog.getAttribute('aria-busy')).toBe('true');
      expect(within(dialog).getByText(/BK-20261020-0007/)).toBeDefined();
      expect(within(dialog).getByRole('status', { name: bookingEn.detail.loading })).toBeDefined();
      expect(within(dialog).queryByText(/Participant List/i)).toBeNull();

      release(new Response(JSON.stringify(detailFor('1201', 'BK-20261020-0007')), { status: 200 }));

      await waitFor(() => {
        expect(within(screen.getByRole('dialog')).getByText('Nguyen Thi B')).toBeDefined();
      });
      const loaded = screen.getByRole('dialog');
      expect(loaded.getAttribute('aria-busy')).toBeNull();
      expect(detailCalls()).toEqual(['/api/operator/bookings/1201']);
      // participants (name + type), booker phone, meeting point, ticket, payment gateway and reference, coupon
      expect(within(loaded).getByText('+84901234567')).toBeDefined();
      expect(within(loaded).getByText('Da Nang Cruise Port')).toBeDefined();
      expect(within(loaded).getByText(/TK-0000001201 \(Valid\)/)).toBeDefined();
      expect(within(loaded).getByText('PayOS')).toBeDefined();
      expect(within(loaded).getByText('FT26102012345')).toBeDefined();
      expect(within(loaded).getByText(/Applied Coupon \(SUMMER10\)/)).toBeDefined();
      expect(within(loaded).getAllByText('Adult').length).toBeGreaterThan(0);
      expect(within(loaded).getAllByText('Child').length).toBeGreaterThan(0);
    });

    it('hides the payment, coupon and ticket blocks when the BE returns null for them', async () => {
      routeFetch({
        '1201': () =>
          json(
            detailFor('1201', 'BK-20261020-0007', {
              ticket: null,
              payment: null,
              coupon: null,
              paidAmount: 0,
              status: 'PendingPayment',
              paymentStatus: 'Unpaid',
            })
          ),
      });
      render(<OperatorBookingListView isDemo={false} />);

      await openFirstRow();

      const dialog = await screen.findByRole('dialog');
      await waitFor(() => {
        expect(within(dialog).getByText('Nguyen Thi B')).toBeDefined();
      });
      expect(within(dialog).queryByText(bookingEn.detail.transactionRef + ':')).toBeNull();
      expect(within(dialog).queryByText(/Applied Coupon/)).toBeNull();
      expect(within(dialog).queryByText(bookingEn.detail.ticketCode + ':')).toBeNull();
    });

    it('never renders fields the contract says are not returned, even when a response carries them', async () => {
      const body = detailFor('1201', 'BK-20261020-0007');
      (body.participants[0] as Record<string, unknown>).idDocumentNumber = 'P1234567';
      (body.participants[0] as Record<string, unknown>).age = 41;
      (body.payment as Record<string, unknown>).rawResponse = 'gateway-secret';
      (body.payment as Record<string, unknown>).checkoutUrl = 'https://pay.example/secret';
      routeFetch({ '1201': () => json(body) });
      render(<OperatorBookingListView isDemo={false} />);

      await openFirstRow();

      const dialog = await screen.findByRole('dialog');
      await waitFor(() => {
        expect(within(dialog).getByText('Nguyen Thi B')).toBeDefined();
      });
      const html = document.body.innerHTML;
      expect(html).not.toContain('P1234567');
      expect(html).not.toContain('gateway-secret');
      expect(html).not.toContain('pay.example');
      expect(html).not.toMatch(/years old/i);
    });

    it('keeps cancel disabled with the locked tooltip in live mode', async () => {
      routeFetch({ '1201': () => json(detailFor('1201', 'BK-20261020-0007')) });
      render(<OperatorBookingListView isDemo={false} />);

      await openFirstRow();

      const dialog = await screen.findByRole('dialog');
      await waitFor(() => {
        expect(within(dialog).getByText('Nguyen Thi B')).toBeDefined();
      });
      const cancel = within(dialog).getByRole('button', { name: /Cancel Booking/i }) as HTMLButtonElement;
      expect(cancel.disabled).toBe(true);
      expect(cancel.getAttribute('title')).toBe(bookingEn.detail.productionLockedTooltip);
    });

    it.each([
      ['MSG126 when the booking is not accessible (403)', 403, { errorCode: 'operator_booking.forbidden' }, OPERATOR_BOOKING_MESSAGES.MSG126, false],
      ['MSG126 when the booking no longer exists (404)', 404, { errorCode: 'operator_booking.not_found' }, OPERATOR_BOOKING_MESSAGES.MSG126, false],
      ['MSG127 on a server failure', 503, { errorCode: 'MSG127' }, OPERATOR_BOOKING_MESSAGES.MSG127, true],
    ])('shows %s inside the drawer', async (_label, status, body, message, hasRetry) => {
      routeFetch({ '1201': () => json(body, status) });
      render(<OperatorBookingListView isDemo={false} />);

      await openFirstRow();

      const dialog = await screen.findByRole('dialog');
      await waitFor(() => {
        expect(within(dialog).getByRole('alert').textContent).toContain(message);
      });
      expect(within(dialog).getByText(/BK-20261020-0007/)).toBeDefined();
      expect(within(dialog).queryByText(/Participant List/i)).toBeNull();
      expect(!!within(dialog).queryByRole('button', { name: bookingEn.list.retryBtn })).toBe(hasRetry);
    });

    it('Retry in the drawer refetches the same booking and then shows the detail', async () => {
      let attempt = 0;
      routeFetch({
        '1201': () =>
          attempt++ === 0 ? json({ errorCode: 'MSG127' }, 503) : json(detailFor('1201', 'BK-20261020-0007')),
      });
      render(<OperatorBookingListView isDemo={false} />);

      await openFirstRow();
      const dialog = await screen.findByRole('dialog');
      await waitFor(() => {
        expect(within(dialog).getByRole('button', { name: bookingEn.list.retryBtn })).toBeDefined();
      });

      fireEvent.click(within(dialog).getByRole('button', { name: bookingEn.list.retryBtn }));

      await waitFor(() => {
        expect(within(screen.getByRole('dialog')).getByText('Nguyen Thi B')).toBeDefined();
      });
      expect(detailCalls()).toEqual(['/api/operator/bookings/1201', '/api/operator/bookings/1201']);
    });

    it('ignores a slow response for a previous row after the user closes and opens another row (stale guard)', async () => {
      let releaseFirst: (response: Response) => void = () => undefined;
      routeFetch({
        '1201': () => new Promise<Response>((resolve) => { releaseFirst = resolve; }),
        '1202': () => json(detailFor('1202', 'BK-20261021-0008', { tour: { tourId: '102', title: 'Food trail' } })),
      });
      render(<OperatorBookingListView isDemo={false} />);
      await waitFor(() => {
        expect(screen.getAllByText('BK-20261021-0008').length).toBeGreaterThan(0);
      });

      // open row A (slow), close the drawer, open row B (fast)
      fireEvent.click(screen.getAllByRole('button', { name: /Details/i })[0]);
      await screen.findByRole('dialog');
      fireEvent.click(screen.getByRole('button', { name: bookingEn.detail.closeBtn }));
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBeNull();
      });
      fireEvent.click(screen.getAllByRole('button', { name: /Details/i })[1]);
      await waitFor(() => {
        expect(within(screen.getByRole('dialog')).getByText(/BK-20261021-0008/)).toBeDefined();
        expect(screen.getByRole('dialog').getAttribute('aria-busy')).toBeNull();
      });

      // the slow response for A arrives late and must not replace B
      releaseFirst(new Response(JSON.stringify(detailFor('1201', 'BK-20261020-0007')), { status: 200 }));
      await new Promise((resolve) => setTimeout(resolve, 30));

      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText(/BK-20261021-0008/)).toBeDefined();
      expect(within(dialog).queryByText(/BK-20261020-0007/)).toBeNull();
    });

    it('does not reopen a closed drawer when its response arrives afterwards', async () => {
      let release: (response: Response) => void = () => undefined;
      routeFetch({ '1201': () => new Promise<Response>((resolve) => { release = resolve; }) });
      render(<OperatorBookingListView isDemo={false} />);

      await openFirstRow();
      await screen.findByRole('dialog');
      fireEvent.click(screen.getByRole('button', { name: bookingEn.detail.closeBtn }));
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBeNull();
      });

      release(new Response(JSON.stringify(detailFor('1201', 'BK-20261020-0007')), { status: 200 }));
      await new Promise((resolve) => setTimeout(resolve, 30));

      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  describe('CR-01 Default Page Size & CR-02 Draft vs Applied Filter Behavior', () => {
    it('requests default pageSize = 20 (OPERATOR_BOOKING_DEFAULT_PAGE_SIZE)', async () => {
      const spy = vi.spyOn(bookingService, 'getOperatorBookings');
      render(<OperatorBookingListView isDemo={true} />);

      await waitFor(() => {
        expect(screen.getAllByText('BK-20260919-0141').length).toBeGreaterThan(0);
      });

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          pageSize: 20,
        }),
        expect.objectContaining({
          isDemo: true,
          demoActorUserId: 101,
        })
      );
      expect(OPERATOR_BOOKING_DEFAULT_PAGE_SIZE).toBe(20);
    });

    it('does NOT call getOperatorBookings while typing search or changing tour/status/date inputs before submit', async () => {
      const spy = vi.spyOn(bookingService, 'getOperatorBookings');
      render(<OperatorBookingListView isDemo={true} />);

      await waitFor(() => {
        expect(screen.getAllByText('BK-20260919-0141').length).toBeGreaterThan(0);
      });

      expect(spy).toHaveBeenCalledTimes(1);

      // Mutate all draft filter inputs without submitting
      fireEvent.change(screen.getByPlaceholderText(/Search booking code/i), {
        target: { value: '0148' },
      });
      fireEvent.change(screen.getByLabelText(/Tour Package/i), {
        target: { value: 'tour-142' },
      });
      fireEvent.change(screen.getByLabelText(/Booking Status/i), {
        target: { value: 'Confirmed' },
      });
      fireEvent.change(screen.getByLabelText(/Departure from date/i), {
        target: { value: '2026-09-01' },
      });
      fireEvent.change(screen.getByLabelText(/To date/i), {
        target: { value: '2026-09-30' },
      });

      // Still only the initial retrieval call
      expect(spy).toHaveBeenCalledTimes(1);

      // Submit via "Apply Filter" button -> triggers exactly ONE new call with appliedFilters and page=1
      fireEvent.click(screen.getByRole('button', { name: /Apply Filter/i }));

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(2);
      });

      expect(spy).toHaveBeenLastCalledWith(
        {
          tourId: 'tour-142',
          status: 'Confirmed',
          startDate: '2026-09-01',
          endDate: '2026-09-30',
          searchKeyword: '0148',
          page: 1,
          pageSize: 20,
        },
        {
          isDemo: true,
          demoActorUserId: 101,
        }
      );

      // Reset via "Reset" button -> resets draft & applied filters and page=1 in a single retrieval
      fireEvent.click(screen.getByRole('button', { name: /Reset/i }));

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(3);
      });

      expect(spy).toHaveBeenLastCalledWith(
        {
          tourId: undefined,
          status: undefined,
          startDate: undefined,
          endDate: undefined,
          searchKeyword: undefined,
          page: 1,
          pageSize: 20,
        },
        {
          isDemo: true,
          demoActorUserId: 101,
        }
      );
    });

    it('keeps appliedFilters when paginating and resets page to 1 when applying new filters', async () => {
      const spy = vi.spyOn(bookingService, 'getOperatorBookings');
      // Use initialParams.pageSize = 2 so 6 items span 3 pages
      render(<OperatorBookingListView isDemo={true} initialParams={{ pageSize: 2 }} />);

      await waitFor(() => {
        expect(screen.getByText(/Showing/i)).toBeDefined();
      });
      expect(spy).toHaveBeenCalledTimes(1);

      // Edit draft search WITHOUT clicking Apply
      fireEvent.change(screen.getByPlaceholderText(/Search booking code/i), {
        target: { value: 'UNAPPLIED-DRAFT' },
      });
      expect(spy).toHaveBeenCalledTimes(1);

      // Click "Next" pagination button -> changes page to 2 while keeping appliedFilters
      fireEvent.click(screen.getByRole('button', { name: 'Next' }));

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(2);
      });
      expect(spy).toHaveBeenLastCalledWith(
        expect.objectContaining({
          searchKeyword: undefined,
          page: 2,
          pageSize: 2,
        }),
        expect.objectContaining({ isDemo: true, demoActorUserId: 101 })
      );

      // Now change draft search to '0141' and submit form (e.g. pressing Enter / submit) -> resets page to 1
      const searchInput = screen.getByPlaceholderText(/Search booking code/i);
      fireEvent.change(searchInput, { target: { value: '0141' } });
      fireEvent.submit(searchInput.closest('form')!);

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(3);
      });
      expect(spy).toHaveBeenLastCalledWith(
        expect.objectContaining({
          searchKeyword: '0141',
          page: 1,
          pageSize: 2,
        }),
        expect.objectContaining({ isDemo: true, demoActorUserId: 101 })
      );
    });
  });

  describe('BR-105 Session Identity & Fail-Closed Authorization', () => {
    it('fails closed with MSG126 when Demo mode is rendered without an authenticated operator session', async () => {
      AuthStorage.clear();
      render(<OperatorBookingListView isDemo={true} demoActorUserId={undefined} />);

      await waitFor(() => {
        expect(screen.getByText(OPERATOR_BOOKING_MESSAGES.MSG126)).toBeDefined();
      });

      expect(screen.queryByText('BK-20260919-0141')).toBeNull();
    });

    it('prevents operator 999 from viewing operator 101 fixtures', async () => {
      seedOperatorSession(999);
      render(<OperatorBookingListView isDemo={true} />);

      await waitFor(() => {
        expect(screen.getAllByText('BK-20260925-9999').length).toBeGreaterThan(0);
      });

      expect(screen.queryByText('BK-20260919-0141')).toBeNull();
    });
  });

  describe('Demo Mode Workspace & UC-40 / UC-41 / UC-42 Flows', () => {
    it('renders Demo banner, summary KPI cards, and booking items list for signed-in operator 101', async () => {
      render(<OperatorBookingListView isDemo={true} />);

      await waitFor(() => {
        expect(screen.getByText(/Demo Active/i)).toBeDefined();
      });

      // KPI summary cards
      expect(screen.getByText(bookingEn.summary.totalBookings)).toBeDefined();
      expect(screen.getByText(bookingEn.summary.totalParticipants)).toBeDefined();
      expect(screen.getByText(bookingEn.summary.confirmedRevenue)).toBeDefined();

      // Owned items present in document; foreign booking-9999 excluded
      expect(screen.getAllByText('BK-20260919-0141').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Nguyễn Văn An').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Ba Na Hills full-day tour').length).toBeGreaterThan(0);
      expect(screen.queryByText('BK-20260925-9999')).toBeNull();
    });

    it('shows the booker name and e-mail, the status filter lists Expired, and no phone column', async () => {
      render(<OperatorBookingListView isDemo={true} />);

      await waitFor(() => {
        expect(screen.getAllByText('BK-20260919-0141').length).toBeGreaterThan(0);
      });

      expect(screen.getAllByText('an.nguyen@example.com').length).toBeGreaterThan(0);
      expect(screen.queryByText('0901234567')).toBeNull();
      const statusSelect = screen.getByLabelText(/Booking Status/i) as HTMLSelectElement;
      expect(Array.from(statusSelect.options).map((o) => o.value)).toContain('Expired');
      // 0144 is the Expired demo booking
      expect(screen.getAllByText(bookingEn.statuses.Expired).length).toBeGreaterThan(0);
    });

    it('filters bookings by tour package on Apply', async () => {
      render(<OperatorBookingListView isDemo={true} />);

      await waitFor(() => {
        expect(screen.getAllByText('BK-20260919-0141').length).toBeGreaterThan(0);
      });

      const selectTour = screen.getByLabelText(/Tour Package/i);
      fireEvent.change(selectTour, { target: { value: 'tour-55' } });

      const applyBtn = screen.getByRole('button', { name: /Apply Filter/i });
      fireEvent.click(applyBtn);

      await waitFor(() => {
        expect(screen.getAllByText('BK-20260914-0144').length).toBeGreaterThan(0);
        expect(screen.queryByText('BK-20260919-0141')).toBeNull();
      });
    });

    it('filters bookings by status on Apply', async () => {
      render(<OperatorBookingListView isDemo={true} />);

      await waitFor(() => {
        expect(screen.getAllByText('BK-20260919-0141').length).toBeGreaterThan(0);
      });

      const selectStatus = screen.getByLabelText(/Booking Status/i);
      fireEvent.change(selectStatus, { target: { value: 'PendingPayment' } });

      const applyBtn = screen.getByRole('button', { name: /Apply Filter/i });
      fireEvent.click(applyBtn);

      await waitFor(() => {
        expect(screen.getAllByText('BK-20260913-0146').length).toBeGreaterThan(0);
        expect(screen.queryByText('BK-20260919-0141')).toBeNull();
      });
    });

    it('searches by booking code on Apply', async () => {
      render(<OperatorBookingListView isDemo={true} />);

      await waitFor(() => {
        expect(screen.getAllByText('BK-20260919-0141').length).toBeGreaterThan(0);
      });

      const searchInput = screen.getByPlaceholderText(/Search booking code/i);
      fireEvent.change(searchInput, { target: { value: '0148' } });

      const applyBtn = screen.getByRole('button', { name: /Apply Filter/i });
      fireEvent.click(applyBtn);

      await waitFor(() => {
        expect(screen.getAllByText('BK-20260912-0148').length).toBeGreaterThan(0);
        expect(screen.queryByText('BK-20260919-0141')).toBeNull();
      });
    });

    it('shows MSG31 when date range is invalid on Apply', async () => {
      render(<OperatorBookingListView isDemo={true} />);

      await waitFor(() => {
        expect(screen.getAllByText('BK-20260919-0141').length).toBeGreaterThan(0);
      });

      const startDateInput = screen.getByLabelText(/Departure from date/i);
      const endDateInput = screen.getByLabelText(/To date/i);

      fireEvent.change(startDateInput, { target: { value: '2026-09-30' } });
      fireEvent.change(endDateInput, { target: { value: '2026-09-01' } });

      const applyBtn = screen.getByRole('button', { name: /Apply Filter/i });
      fireEvent.click(applyBtn);

      await waitFor(() => {
        expect(screen.getByText(OPERATOR_BOOKING_MESSAGES.MSG31)).toBeDefined();
      });
    });

    it('shows MSG128 when no bookings match filter criteria on Apply', async () => {
      render(<OperatorBookingListView isDemo={true} />);

      await waitFor(() => {
        expect(screen.getAllByText('BK-20260919-0141').length).toBeGreaterThan(0);
      });

      const searchInput = screen.getByPlaceholderText(/Search booking code/i);
      fireEvent.change(searchInput, { target: { value: 'MA-DON-KHONG-CO' } });

      const applyBtn = screen.getByRole('button', { name: /Apply Filter/i });
      fireEvent.click(applyBtn);

      await waitFor(() => {
        expect(screen.getByText(OPERATOR_BOOKING_MESSAGES.MSG128)).toBeDefined();
      });
    });

    it('opens detail drawer when clicking Details button', async () => {
      render(<OperatorBookingListView isDemo={true} />);

      await waitFor(() => {
        expect(screen.getAllByText('BK-20260919-0141').length).toBeGreaterThan(0);
      });

      const detailButtons = screen.getAllByRole('button', { name: /Details/i });
      fireEvent.click(detailButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeDefined();
        expect(screen.getByText(/Booking Details/i)).toBeDefined();
      });
    });

    it('executes cancellation flow and updates booking state (UC-41)', async () => {
      render(<OperatorBookingListView isDemo={true} />);

      await waitFor(() => {
        expect(screen.getAllByText('BK-20260919-0141').length).toBeGreaterThan(0);
      });

      // Open detail drawer
      const detailButtons = screen.getAllByRole('button', { name: /Details/i });
      fireEvent.click(detailButtons[0]);

      // Click cancel action in drawer
      const cancelDrawerBtn = await screen.findByRole('button', {
        name: /Cancel Booking/i,
      });
      fireEvent.click(cancelDrawerBtn);

      // Cancel dialog opens
      const textarea = await screen.findByLabelText(/Cancellation Reason Details/i);
      fireEvent.change(textarea, { target: { value: 'Customer has unexpected personal conflict' } });

      const submitCancelBtn = screen.getByRole('button', {
        name: /Confirm Cancellation/i,
      });
      fireEvent.click(submitCancelBtn);

      // Verify feedback banner
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeDefined();
        expect(screen.getByText(new RegExp(bookingEn.messages.MSG81, 'i'))).toBeDefined();
      });
    });

    it('does not render an Initiate Refund action anywhere in the booking detail drawer (UC-42/UC-71: refund is automatic)', async () => {
      render(<OperatorBookingListView isDemo={true} />);

      await waitFor(() => {
        expect(screen.getAllByText('BK-20260919-0141').length).toBeGreaterThan(0);
      });

      // Open detail drawer
      const detailButtons = screen.getAllByRole('button', { name: /Details/i });
      fireEvent.click(detailButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeDefined();
      });
      expect(screen.queryByRole('button', { name: /Initiate Refund/i })).toBeNull();
    });
  });
});
