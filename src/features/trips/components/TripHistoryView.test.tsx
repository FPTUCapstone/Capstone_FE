import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { tripReviewEn } from '../resources/en';
import { TripHistoryClientError } from '../services/tripHistoryClient';
import type {
  BookingTripItem,
  ItineraryTripItem,
  TripHistoryPage,
  TripListItem,
} from '../types/tripHistoryContract';
import { TripHistoryView } from './TripHistoryView';

const { fetchHistoryMock, fetchDetailMock, searchParamMock } = vi.hoisted(() => ({
  fetchHistoryMock: vi.fn(),
  fetchDetailMock: vi.fn(),
  searchParamMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({ useSearchParams: () => ({ get: searchParamMock }) }));
vi.mock('../services/tripHistoryClient', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../services/tripHistoryClient')>()),
  fetchTripHistory: fetchHistoryMock,
  fetchTripDetail: fetchDetailMock,
}));

const booking = (id: string, over: Partial<BookingTripItem> = {}): BookingTripItem => ({
  kind: 'commerceBooking',
  id,
  tripType: 'TourBooking',
  tab: 'Completed',
  title: `Tour ${id}`,
  departureAtUtc: '2026-10-01T02:00:00+00:00',
  status: 'Completed',
  bookingCode: `TM-${id}`,
  participantCount: 2,
  totalAmount: 3_200_000,
  reviewableRecord: { kind: 'commerceBooking', id },
  actions: { canReview: false, canViewETicket: false, ticketId: null, canViewRefund: false },
  review: { exists: false },
  ...over,
});

const itinerary = (id: string, over: Partial<ItineraryTripItem> = {}): ItineraryTripItem => ({
  kind: 'itinerary',
  id,
  tripType: 'SelfPlannedItinerary',
  tab: 'Completed',
  title: `Itinerary ${id}`,
  departureAtUtc: '2026-09-20T01:00:00+00:00',
  status: 'Completed',
  stopCount: 4,
  visitedCount: 3,
  reviewableRecord: null,
  actions: { canReview: false, canViewETicket: false, ticketId: null, canViewRefund: false },
  review: null,
  ...over,
});

const pageOf = (items: TripListItem[], over: Partial<TripHistoryPage> = {}): TripHistoryPage => ({
  items,
  summary: { totalCompletedTrips: items.length, totalVisitedPois: 3 },
  page: 1,
  pageSize: 20,
  totalCount: items.length,
  ...over,
});

const tabButton = (label: string) => screen.getByRole('button', { name: new RegExp(label, 'i') });
const lastCall = () => fetchHistoryMock.mock.calls[fetchHistoryMock.mock.calls.length - 1];

async function renderLoaded(items: TripListItem[] = [booking('1'), itinerary('2')], over: Partial<TripHistoryPage> = {}) {
  fetchHistoryMock.mockResolvedValue(pageOf(items, over));
  render(<TripHistoryView />);
  await screen.findByText(items[0].title);
}

beforeEach(() => {
  vi.clearAllMocks();
  fetchHistoryMock.mockReset();
  fetchDetailMock.mockReset();
  searchParamMock.mockReturnValue(null);
  vi.stubEnv('NODE_ENV', 'test');
  vi.stubEnv('NEXT_PUBLIC_ENABLE_DEMO_FIXTURES', '');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('TripHistoryView — loading the list', () => {
  it('asks for the Completed tab, all trip types, page 1, and renders the items in the order sent', async () => {
    await renderLoaded([booking('1'), itinerary('2'), booking('3')]);

    expect(fetchHistoryMock).toHaveBeenCalledTimes(1);
    const [filter, options] = lastCall();
    expect(filter).toMatchObject({ tab: 'Completed', tripType: 'All', page: 1 });
    expect(filter.fromDate || undefined).toBeUndefined();
    expect(filter.toDate || undefined).toBeUndefined();
    expect(options.allowDemo).toBe(false);
    expect(options.signal).toBeInstanceOf(AbortSignal);
    const titles = screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent);
    expect(titles).toEqual(['Tour 1', 'Itinerary 2', 'Tour 3']);
  });

  it('shows a loading skeleton until the request settles', async () => {
    let resolve: (page: TripHistoryPage) => void = () => undefined;
    fetchHistoryMock.mockReturnValue(new Promise<TripHistoryPage>((r) => { resolve = r; }));
    render(<TripHistoryView />);

    expect(screen.getByLabelText(tripReviewEn.accessibility.loadingTripsAria)).toBeDefined();

    await act(async () => resolve(pageOf([booking('1')])));
    expect(screen.queryByLabelText(tripReviewEn.accessibility.loadingTripsAria)).toBeNull();
    expect(screen.getByText('Tour 1')).toBeDefined();
  });

  it('has no search box: the backend offers no search', async () => {
    await renderLoaded();

    expect(screen.queryByRole('searchbox')).toBeNull();
    expect(screen.queryByRole('button', { name: /^search$/i })).toBeNull();
  });
});

describe('TripHistoryView — tabs and filters', () => {
  it('requests the chosen tab and goes back to page 1', async () => {
    await renderLoaded([booking('1')], { totalCount: 45 });
    fireEvent.click(screen.getByRole('button', { name: tripReviewEn.accessibility.nextPageAria }));
    await waitFor(() => expect(lastCall()[0].page).toBe(2));

    fetchHistoryMock.mockResolvedValue(pageOf([booking('9', { tab: 'Cancelled', status: 'Cancelled' })], { summary: undefined }));
    fireEvent.click(tabButton(tripReviewEn.tripHistory.tabs.cancelled));

    await waitFor(() => expect(lastCall()[0]).toMatchObject({ tab: 'Cancelled', page: 1 }));
    await screen.findByText('Tour 9');
  });

  it.each([
    [tripReviewEn.tripHistory.tabs.upcoming, 'Upcoming'],
    [tripReviewEn.tripHistory.tabs.completed, 'Completed'],
  ])('the %s tab requests %s', async (label, tab) => {
    await renderLoaded();
    fetchHistoryMock.mockResolvedValue(pageOf([booking('8', { tab: tab as 'Upcoming' })], { summary: undefined }));

    fireEvent.click(tabButton(tripReviewEn.tripHistory.tabs.cancelled));
    await waitFor(() => expect(lastCall()[0].tab).toBe('Cancelled'));
    fireEvent.click(tabButton(label));

    await waitFor(() => expect(lastCall()[0].tab).toBe(tab));
  });

  it('does not refetch when the active tab is clicked again', async () => {
    await renderLoaded();

    fireEvent.click(tabButton(tripReviewEn.tripHistory.tabs.completed));

    expect(fetchHistoryMock).toHaveBeenCalledTimes(1);
  });

  it('requests the chosen trip type and resets to page 1', async () => {
    await renderLoaded([booking('1')], { totalCount: 45 });
    fireEvent.click(screen.getByRole('button', { name: tripReviewEn.accessibility.nextPageAria }));
    await waitFor(() => expect(lastCall()[0].page).toBe(2));

    fireEvent.change(screen.getByLabelText(tripReviewEn.accessibility.tripTypeFilterLabel), {
      target: { value: 'SelfPlannedItinerary' },
    });

    await waitFor(() => expect(lastCall()[0]).toMatchObject({ tripType: 'SelfPlannedItinerary', page: 1 }));
  });

  it('offers exactly the three trip-type choices', async () => {
    await renderLoaded();

    const options = within(screen.getByLabelText(tripReviewEn.accessibility.tripTypeFilterLabel))
      .getAllByRole('option')
      .map((option) => (option as HTMLOptionElement).value);
    expect(options).toEqual(['All', 'TourBooking', 'SelfPlannedItinerary']);
  });

  it('requests the date range once both ends are valid', async () => {
    await renderLoaded();

    fireEvent.change(screen.getByLabelText(tripReviewEn.accessibility.fromDateAria), { target: { value: '2026-10-01' } });
    await waitFor(() => expect(lastCall()[0]).toMatchObject({ fromDate: '2026-10-01', page: 1 }));
    fireEvent.change(screen.getByLabelText(tripReviewEn.accessibility.toDateAria), { target: { value: '2026-10-31' } });

    await waitFor(() => expect(lastCall()[0]).toMatchObject({ fromDate: '2026-10-01', toDate: '2026-10-31' }));
  });

  it('shows the invalid-range message and sends no request for a reversed range', async () => {
    await renderLoaded();
    fireEvent.change(screen.getByLabelText(tripReviewEn.accessibility.toDateAria), { target: { value: '2026-10-01' } });
    await waitFor(() => expect(fetchHistoryMock).toHaveBeenCalledTimes(2));

    fireEvent.change(screen.getByLabelText(tripReviewEn.accessibility.fromDateAria), { target: { value: '2026-10-05' } });

    expect((await screen.findByRole('alert')).textContent).toContain(tripReviewEn.validation.invalidDateRange);
    expect(fetchHistoryMock).toHaveBeenCalledTimes(2);
    expect(screen.getByText('Tour 1')).toBeDefined();
  });
});

describe('TripHistoryView — summary, counts and pages', () => {
  it('shows the two summary figures the backend returns, and nothing else', async () => {
    await renderLoaded([booking('1')], {
      summary: { totalCompletedTrips: 14, totalVisitedPois: 63 },
      totalCount: 14,
    });

    const banner = screen.getByLabelText(tripReviewEn.accessibility.tripSummaryAria);
    expect(within(banner).getByText(tripReviewEn.tripHistory.summary.completedTripsCount(14))).toBeDefined();
    expect(within(banner).getByText('63')).toBeDefined();
    expect(within(banner).getByText(tripReviewEn.tripHistory.summary.visitedPoisLabel)).toBeDefined();
    expect(banner.textContent).not.toMatch(/km|Rating|Match/i);
  });

  it('shows no summary banner when the backend sends none', async () => {
    await renderLoaded([booking('1')], { summary: undefined });

    expect(screen.queryByLabelText(tripReviewEn.accessibility.tripSummaryAria)).toBeNull();
  });

  it('derives the page count from totalCount and a page size of 20', async () => {
    await renderLoaded([booking('1')], { totalCount: 45 });

    expect(screen.getByText(/\(45 total trips\)/)).toBeDefined();
    expect(screen.getByText('1 / 3')).toBeDefined();
    expect(screen.getByText(/Showing/).textContent).toContain('45');
  });

  it('moves between pages and disables the buttons at both ends', async () => {
    await renderLoaded([booking('1')], { totalCount: 45 });
    const previous = () => screen.getByRole('button', { name: tripReviewEn.accessibility.previousPageAria }) as HTMLButtonElement;
    const next = () => screen.getByRole('button', { name: tripReviewEn.accessibility.nextPageAria }) as HTMLButtonElement;
    expect(previous().disabled).toBe(true);

    fireEvent.click(next());
    await waitFor(() => expect(lastCall()[0].page).toBe(2));
    await screen.findByText('2 / 3');
    fireEvent.click(next());
    await waitFor(() => expect(lastCall()[0].page).toBe(3));
    await screen.findByText('3 / 3');

    expect(next().disabled).toBe(true);
    fireEvent.click(previous());
    await waitFor(() => expect(lastCall()[0].page).toBe(2));
  });
});

describe('TripHistoryView — empty and failed states', () => {
  it('shows the empty state with the plan and explore links when there are no trips', async () => {
    fetchHistoryMock.mockResolvedValue(pageOf([], { summary: undefined }));
    render(<TripHistoryView />);

    expect(await screen.findByText(tripReviewEn.tripHistory.empty.title)).toBeDefined();
    expect(screen.getByRole('link', { name: tripReviewEn.actions.planSmartItinerary }).getAttribute('href')).toBe('/plan');
    expect(screen.getByRole('link', { name: tripReviewEn.actions.exploreLocalTours }).getAttribute('href')).toBe('/tours');
  });

  it('shows the error state with the safe message and retries on demand', async () => {
    fetchHistoryMock.mockRejectedValueOnce(new TripHistoryClientError('system', tripReviewEn.errors.systemError, 503));
    fetchHistoryMock.mockResolvedValueOnce(pageOf([booking('1')]));
    render(<TripHistoryView />);

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain(tripReviewEn.tripHistory.error.title);
    expect(alert.textContent).toContain(tripReviewEn.errors.systemError);

    fireEvent.click(screen.getByRole('button', { name: tripReviewEn.actions.retry }));

    await screen.findByText('Tour 1');
    expect(fetchHistoryMock).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it.each([
    ['accessDenied', tripReviewEn.errors.tripHistoryAccessDenied],
    ['invalidDateRange', tripReviewEn.validation.invalidDateRange],
  ] as const)('shows the %s message', async (kind, message) => {
    fetchHistoryMock.mockRejectedValue(new TripHistoryClientError(kind, message, 403));
    render(<TripHistoryView />);

    expect((await screen.findByRole('alert')).textContent).toContain(message);
  });

  it('reports an unexpected error as the generic system error without its details', async () => {
    fetchHistoryMock.mockRejectedValue(new Error('SELECT * FROM secrets'));
    render(<TripHistoryView />);

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain(tripReviewEn.errors.systemError);
    expect(alert.textContent).not.toContain('SELECT');
  });

  it('treats a 501 like any other failure: an error with Retry, not a pending notice', async () => {
    fetchHistoryMock.mockRejectedValue(new TripHistoryClientError('system', tripReviewEn.errors.systemError, 501));
    render(<TripHistoryView />);

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain(tripReviewEn.errors.systemError);
    expect(screen.getByRole('button', { name: tripReviewEn.actions.retry })).toBeDefined();
    expect(screen.queryByText(/pending/i)).toBeNull();
  });
});

describe('TripHistoryView — overlapping requests', () => {
  it('ignores a late answer to an earlier request', async () => {
    let resolveFirst: (page: TripHistoryPage) => void = () => undefined;
    fetchHistoryMock.mockReturnValueOnce(new Promise<TripHistoryPage>((r) => { resolveFirst = r; }));
    fetchHistoryMock.mockResolvedValueOnce(pageOf([booking('7', { tab: 'Upcoming', status: 'Confirmed' })], { summary: undefined }));
    render(<TripHistoryView />);

    fireEvent.click(tabButton(tripReviewEn.tripHistory.tabs.upcoming));
    await screen.findByText('Tour 7');
    const firstSignal = fetchHistoryMock.mock.calls[0][1].signal as AbortSignal;
    await act(async () => resolveFirst(pageOf([booking('1')])));

    expect(firstSignal.aborted).toBe(true);
    expect(screen.getByText('Tour 7')).toBeDefined();
    expect(screen.queryByText('Tour 1')).toBeNull();
  });

  it('does not show an error for a request it cancelled itself', async () => {
    const abort = new DOMException('aborted', 'AbortError');
    fetchHistoryMock.mockRejectedValueOnce(abort);
    fetchHistoryMock.mockResolvedValueOnce(pageOf([booking('7')]));
    render(<TripHistoryView />);

    fireEvent.click(tabButton(tripReviewEn.tripHistory.tabs.upcoming));

    await screen.findByText('Tour 7');
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

describe('TripHistoryView — demo mode', () => {
  it('passes the demo request on and shows the banner only where demo data is allowed', async () => {
    searchParamMock.mockImplementation((key: string) => (key === 'demo' ? '1' : null));
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_ENABLE_DEMO_FIXTURES', 'true');
    await renderLoaded([booking('1')]);

    expect(lastCall()[1].allowDemo).toBe(true);
    expect(screen.getByText(tripReviewEn.demo.tripHistoryBannerPrefix)).toBeDefined();
  });

  it('shows no demo banner when the environment does not allow demo data', async () => {
    searchParamMock.mockImplementation((key: string) => (key === 'demo' ? '1' : null));
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_ENABLE_DEMO_FIXTURES', 'true');
    await renderLoaded([booking('1')]);

    expect(screen.queryByText(tripReviewEn.demo.tripHistoryBannerPrefix)).toBeNull();
  });

  it('shows no banner and asks for real data without ?demo=1', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_ENABLE_DEMO_FIXTURES', 'true');
    await renderLoaded([booking('1')]);

    expect(lastCall()[1].allowDemo).toBe(false);
    expect(screen.queryByText(tripReviewEn.demo.tripHistoryBannerPrefix)).toBeNull();
  });
});

describe('TripHistoryView — trip details', () => {
  const refundable = booking('4', {
    tab: 'Cancelled',
    status: 'Cancelled',
    actions: { canReview: false, canViewETicket: false, ticketId: null, canViewRefund: true },
  });

  it('opens the detail dialog for the chosen card and closes it', async () => {
    fetchDetailMock.mockImplementation(() => new Promise(() => undefined));
    await renderLoaded([booking('1'), itinerary('2')]);

    const card = screen.getByRole('article', { name: 'Itinerary 2' });
    fireEvent.click(within(card).getByRole('button', { name: tripReviewEn.actions.viewDetails }));

    const dialog = await screen.findByRole('dialog', { name: 'Itinerary 2' });
    expect(fetchDetailMock.mock.calls[0].slice(0, 2)).toEqual(['itinerary', '2']);
    fireEvent.click(within(dialog).getByRole('button', { name: tripReviewEn.actions.close }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('links a real booking to its live refund progress', async () => {
    await renderLoaded([refundable]);

    const link = screen.getByRole('link', { name: tripReviewEn.actions.refundDetails });

    expect(link.getAttribute('href')).toBe(`/bookings/${refundable.id}/refund`);
    expect(screen.queryByRole('button', { name: tripReviewEn.actions.refundDetails })).toBeNull();
  });

  it('opens demo records on the refund inside the dialog', async () => {
    searchParamMock.mockImplementation((key: string) => (key === 'demo' ? '1' : null));
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_ENABLE_DEMO_FIXTURES', 'true');
    const { demoTripDetail } = await import('../data/tripHistoryDemoFixtures');
    fetchDetailMock.mockResolvedValue(demoTripDetail('commerceBooking', '9004'));
    await renderLoaded([refundable]);

    fireEvent.click(screen.getByRole('button', { name: tripReviewEn.actions.refundDetails }));

    const heading = await screen.findByText(tripReviewEn.dialogs.tripDetail.refundHeading);
    expect(heading.closest('section')?.getAttribute('data-highlighted')).toBe('true');
  });

  it('forwards the demo request to the dialog', async () => {
    searchParamMock.mockImplementation((key: string) => (key === 'demo' ? '1' : null));
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_ENABLE_DEMO_FIXTURES', 'true');
    fetchDetailMock.mockImplementation(() => new Promise(() => undefined));
    await renderLoaded([booking('1')]);

    fireEvent.click(screen.getByRole('button', { name: tripReviewEn.actions.viewDetails }));

    await screen.findByRole('dialog');
    expect(fetchDetailMock.mock.calls[0][2].allowDemo).toBe(true);
  });

  it('returns focus to the control that opened the dialog', async () => {
    fetchDetailMock.mockImplementation(() => new Promise(() => undefined));
    await renderLoaded([booking('1')]);
    const opener = screen.getByRole('button', { name: tripReviewEn.actions.viewDetails });
    opener.focus();
    fireEvent.click(opener);

    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: tripReviewEn.actions.close }));

    await waitFor(() => expect(document.activeElement).toBe(opener));
  });
});
