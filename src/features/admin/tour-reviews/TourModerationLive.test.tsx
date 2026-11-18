import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { tourModerationEn } from './resources/en';
import { TourReview } from './TourReview';
import { TourReviewQueue } from './TourReviewQueue';

const navigation = vi.hoisted(() => ({
  params: new URLSearchParams(),
  push: vi.fn(),
  replace: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => navigation.params,
  useRouter: () => ({ push: navigation.push, replace: navigation.replace, back: vi.fn() }),
}));

type Handler = (init: RequestInit | undefined) => Response | Promise<Response>;

const copy = tourModerationEn;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

/** Routes fetch by "METHOD url"; anything unregistered fails the test loudly. */
function mockBackend(routes: Record<string, Handler | Handler[]>) {
  const counters = new Map<string, number>();
  const mock = vi.fn(async (url: string, init?: RequestInit) => {
    const key = `${init?.method ?? 'GET'} ${url}`;
    const entry = routes[key];
    if (!entry) throw new Error(`Unexpected request: ${key}`);
    const index = counters.get(key) ?? 0;
    counters.set(key, index + 1);
    const handler = Array.isArray(entry) ? entry[Math.min(index, entry.length - 1)] : entry;
    return handler(init);
  });
  vi.stubGlobal('fetch', mock);
  return mock;
}

/** One row of the TM-83 Staff queue (GET /api/v1/admin/tours) with the Screen 13 columns. */
const summary = (id: number, name: string, extra: Record<string, unknown> = {}) => ({
  id,
  operatorUserId: 101,
  title: name,
  status: 'Pending',
  submittedAtUtc: '2026-11-10T08:00:00+00:00',
  submissionNote: null,
  operatorName: 'Sunrise Travel',
  location: 'Hoi An',
  category: null,
  durationDays: 2,
  priceVnd: 1500000,
  nextDepartureAtUtc: '2026-11-20T01:00:00+00:00',
  nextDepartureCapacity: 8,
  imageCount: 2,
  ...extra,
});

const page = (items: unknown[], totalCount = items.length, pageNumber = 1) => ({
  items,
  totalCount,
  page: pageNumber,
  pageSize: 20,
});

const detail = () => ({
  tourId: 12,
  tourName: 'Hoi An lantern night',
  operatorName: 'Sunrise Travel',
  location: 'Hoi An',
  category: null,
  submittedAtUtc: '2026-11-10T08:00:00+00:00',
  durationDays: 2,
  priceVnd: 1500000,
  nextDepartureAtUtc: '2026-11-20T01:00:00+00:00',
  nextDepartureCapacity: 8,
  imageCount: 2,
  overview: 'A relaxed food tour.',
  highlights: 'Lantern boat ride',
  includedServices: ['Breakfast', 'Guide'],
  excludedServices: ['Personal spending'],
  travellerRequirements: null,
  cancellationPolicy: [
    { daysBeforeDeparture: 30, feePercent: 0 },
    { daysBeforeDeparture: 0, feePercent: 100 },
  ],
  schedules: [
    {
      startAtUtc: '2026-11-20T01:00:00+00:00',
      endAtUtc: '2026-11-21T01:00:00+00:00',
      meetingPoint: 'Hoi An Gate',
      capacity: 8,
      adultPrice: 1500000,
      childPrice: 900000,
      infantPrice: null,
    },
  ],
  itinerary: [{ dayNo: 1, sequenceNo: 1, poiName: 'Ancient Town', plannedTime: '08:30:00', stayMinutes: 90, notes: 'Local guide' }],
  images: [{ url: 'https://res.cloudinary.com/x/a.webp', altText: 'Lantern street at night', caption: null, isPrimary: true }],
});

const REVIEW_URL = 'GET /api/admin/tours/12/review';
const APPROVE_URL = 'POST /api/admin/tours/12/approve';
const REJECT_URL = 'POST /api/admin/tours/12/reject';

beforeEach(() => {
  navigation.params = new URLSearchParams();
  navigation.push.mockReset();
  navigation.replace.mockReset();
  vi.stubEnv('NODE_ENV', 'production');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('Pending queue backed by the backend (Screen #13)', () => {
  it('renders backend rows, the total, the page indicator and context-preserving links', async () => {
    mockBackend({ 'GET /api/admin/tours/pending': () => json(page([summary(12, 'Hoi An lantern night'), summary(13, 'Mountain trek')], 25, 1)) });

    render(<TourReviewQueue />);

    const list = await screen.findByRole('list', { name: copy.queue.listLabel });
    const rows = within(list).getAllByRole('listitem');
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText('Hoi An lantern night')).toBeTruthy();
    expect(within(rows[0]).getByRole('link').getAttribute('href')).toBe('/admin/tours/reviews/12');
    expect(screen.getByText(copy.queue.totalCount(25))).toBeTruthy();
    expect(screen.getByText(copy.pagination.pageOf(1, 2))).toBeTruthy();
    expect(screen.getByRole('link', { name: copy.pagination.next }).getAttribute('href')).toBe('/admin/tours/reviews?page=2');
    expect(screen.queryByText(copy.demoBanner.body)).toBeNull();
  });

  it('shows "Not available" for a legacy row that has no submission time instead of a made-up date', async () => {
    mockBackend({ 'GET /api/admin/tours/pending': () => json(page([summary(12, 'Legacy tour', { submittedAtUtc: null })])) });

    render(<TourReviewQueue />);

    const row = (await screen.findAllByRole('listitem'))[0];
    expect(within(row).getByText(copy.format.unavailable)).toBeTruthy();
  });

  it('says so when a tour has no departure instead of inventing a date', async () => {
    mockBackend({
      'GET /api/admin/tours/pending': () =>
        json(page([summary(12, 'No schedule tour', { nextDepartureAtUtc: null, nextDepartureCapacity: null })])),
    });

    render(<TourReviewQueue />);

    expect(await screen.findByText(copy.live.noDeparture)).toBeTruthy();
  });

  it('sends the applied page and keyword to the backend', async () => {
    navigation.params = new URLSearchParams('page=2&q=lantern');
    const fetchMock = mockBackend({ 'GET /api/admin/tours/pending?pageNumber=2&keyword=lantern': () => json(page([], 0, 2)) });

    render(<TourReviewQueue />);

    expect(await screen.findByText(copy.queue.emptyTitle)).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('applies a search only on explicit submit', async () => {
    mockBackend({ 'GET /api/admin/tours/pending': () => json(page([summary(12, 'A')])) });
    render(<TourReviewQueue />);
    await screen.findByRole('list', { name: copy.queue.listLabel });

    fireEvent.change(screen.getByRole('searchbox', { name: copy.queue.searchLabel }), { target: { value: 'Ba Na' } });
    expect(navigation.push).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: copy.queue.searchButton }));
    expect(navigation.push).toHaveBeenCalledWith('/admin/tours/reviews?q=Ba+Na');
  });

  it('explains a forbidden response without offering a pointless retry', async () => {
    mockBackend({ 'GET /api/admin/tours/pending': () => json({ title: 'no' }, 403) });

    render(<TourReviewQueue />);

    expect((await screen.findByRole('alert')).textContent).toContain(copy.live.forbiddenTitle);
    expect(screen.queryByRole('button', { name: copy.live.retry })).toBeNull();
  });

  it('sends the reviewer back to sign-in when the session has ended', async () => {
    mockBackend({ 'GET /api/admin/tours/pending': () => json({ title: 'expired' }, 401) });

    render(<TourReviewQueue />);

    await waitFor(() =>
      expect(navigation.replace).toHaveBeenCalledWith(expect.stringContaining('/admin/login?returnUrl=')),
    );
    expect(screen.queryByRole('list', { name: copy.queue.listLabel })).toBeNull();
  });

  it('shows a retryable error on a temporary failure and recovers', async () => {
    mockBackend({
      'GET /api/admin/tours/pending': [() => json({ title: 'down' }, 503), () => json(page([summary(12, 'Recovered tour')]))],
    });

    render(<TourReviewQueue />);

    expect((await screen.findByRole('alert')).textContent).toContain(copy.live.unavailableTitle);
    fireEvent.click(screen.getByRole('button', { name: copy.live.retry }));
    expect(await screen.findByText('Recovered tour')).toBeTruthy();
  });

  it('refuses to render a malformed backend payload', async () => {
    mockBackend({ 'GET /api/admin/tours/pending': () => json({ items: [{ tourId: 'x' }], totalCount: 1 }) });

    render(<TourReviewQueue />);

    expect((await screen.findByRole('alert')).textContent).toContain(copy.live.unavailableTitle);
    expect(screen.queryByRole('list', { name: copy.queue.listLabel })).toBeNull();
  });
});

describe('Review detail backed by the backend (Screen #14)', () => {
  it('renders every checklist input: images, price, policy, schedule and itinerary', async () => {
    mockBackend({ [REVIEW_URL]: () => json(detail()) });

    render(<TourReview id="12" />);

    expect(await screen.findByRole('heading', { name: 'Hoi An lantern night', level: 1 })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Lantern street at night' }).getAttribute('src')).toBe('https://res.cloudinary.com/x/a.webp');
    expect(screen.getByText('A relaxed food tour.')).toBeTruthy();
    expect(screen.getByText(copy.detailLive.cancellationRule(30, 0))).toBeTruthy();
    expect(screen.getByText(copy.detailLive.cancellationRule(0, 100))).toBeTruthy();
    expect(screen.getByText(/Meeting point: Hoi An Gate/)).toBeTruthy();
    expect(screen.getByText(/Day 1 · Ancient Town/)).toBeTruthy();
    expect(screen.getByText('08:30')).toBeTruthy();
    expect(screen.getByText('Breakfast')).toBeTruthy();
    // Backend does not store languages, so the label must not be invented.
    expect(screen.queryByText(copy.detail.languagesLabel)).toBeNull();
    expect(screen.queryByText(copy.demoBanner.body)).toBeNull();
    expect(screen.getAllByRole('checkbox')).toHaveLength(5);
  });

  it.each([
    [404, copy.detail.notFoundTitle],
    [409, copy.live.alreadyDecidedTitle],
    [403, copy.live.forbiddenTitle],
  ])('handles HTTP %i', async (status, title) => {
    mockBackend({ [REVIEW_URL]: () => json({ title: 'x' }, status) });

    render(<TourReview id="12" />);

    expect(await screen.findByText(title)).toBeTruthy();
    expect(screen.queryByRole('button', { name: copy.decision.approveButton })).toBeNull();
  });

  it('does not call the backend for a malformed id', async () => {
    const fetchMock = mockBackend({});

    render(<TourReview id="../etc" />);

    expect((await screen.findByRole('alert')).textContent).toContain(copy.live.invalidTitle);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('Live decisions', () => {
  const checkAll = () => {
    for (const box of screen.getAllByRole('checkbox')) fireEvent.click(box);
  };

  async function openDetail(routes: Record<string, Handler | Handler[]> = {}) {
    const fetchMock = mockBackend({ [REVIEW_URL]: () => json(detail()), ...routes });
    render(<TourReview id="12" />);
    await screen.findByRole('heading', { name: 'Hoi An lantern night', level: 1 });
    return fetchMock;
  }

  const postsTo = (fetchMock: ReturnType<typeof mockBackend>, url: string) =>
    fetchMock.mock.calls.filter(([u, init]) => `${init?.method ?? 'GET'} ${u}` === url);

  it('blocks approval until every criterion passes and sends nothing', async () => {
    const fetchMock = await openDetail();

    fireEvent.click(screen.getByRole('button', { name: copy.decision.approveButton }));

    expect(screen.getByRole('alert').textContent).toContain(copy.decision.checklistIncomplete);
    expect(postsTo(fetchMock, APPROVE_URL)).toHaveLength(0);
  });

  it('approves with the checklist and note, then reports the recorded decision honestly', async () => {
    const fetchMock = await openDetail({ [APPROVE_URL]: () => json({ tourId: 12, status: 'Approved' }) });

    checkAll();
    fireEvent.change(screen.getByLabelText(copy.decision.noteLabel), { target: { value: 'Verified photos' } });
    fireEvent.click(screen.getByRole('button', { name: copy.decision.approveButton }));
    const dialog = screen.getByRole('dialog', { name: copy.approveDialog.title });
    expect(dialog.textContent).toContain(copy.decisionLive.approveDescription);
    fireEvent.click(within(dialog).getByRole('button', { name: copy.approveDialog.confirm }));

    expect(await screen.findByText(copy.decisionLive.approvedResult)).toBeTruthy();
    const calls = postsTo(fetchMock, APPROVE_URL);
    expect(calls).toHaveLength(1);
    expect(JSON.parse(calls[0][1]!.body as string)).toEqual({
      checklist: {
        contentCompleteness: true,
        imageAppropriateness: true,
        pricePlausibility: true,
        policyCompliance: true,
        itineraryFeasibility: true,
      },
      note: 'Verified photos',
    });
    expect(screen.getByRole('button', { name: copy.decision.approveButton }).hasAttribute('disabled')).toBe(true);
    expect(screen.getByRole('button', { name: copy.decision.rejectButton }).hasAttribute('disabled')).toBe(true);
    expect(document.body.textContent).not.toMatch(/e-?mail|notified|notification sent/i);
  });

  it('rejects with the category and detailed reason composed into one recorded reason', async () => {
    const fetchMock = await openDetail({ [REJECT_URL]: () => json({ tourId: 12, status: 'Rejected' }) });

    fireEvent.click(screen.getByRole('button', { name: copy.decision.rejectButton }));
    const reasonDialog = screen.getByRole('dialog', { name: copy.rejectDialog.title });
    expect(reasonDialog.textContent).toContain(copy.decisionLive.rejectReasonHint);
    fireEvent.change(within(reasonDialog).getByLabelText(copy.rejectDialog.categoryLabel), { target: { value: 'pricing' } });
    fireEvent.change(within(reasonDialog).getByLabelText(copy.rejectDialog.reasonLabel), {
      target: { value: 'Price does not match the included services.' },
    });
    fireEvent.click(within(reasonDialog).getByRole('button', { name: copy.rejectDialog.confirmRejection }));
    fireEvent.click(
      within(screen.getByRole('dialog', { name: copy.rejectDialog.confirmTitle })).getByRole('button', {
        name: copy.rejectDialog.confirmReject,
      }),
    );

    expect(await screen.findByText(copy.decisionLive.rejectedResult)).toBeTruthy();
    const calls = postsTo(fetchMock, REJECT_URL);
    expect(calls).toHaveLength(1);
    expect(JSON.parse(calls[0][1]!.body as string)).toEqual({
      reason: 'Implausible pricing — Price does not match the included services.',
    });
  });

  it('keeps the composed reason within the 500 characters the backend accepts', async () => {
    const fetchMock = await openDetail();

    fireEvent.click(screen.getByRole('button', { name: copy.decision.rejectButton }));
    const dialog = screen.getByRole('dialog', { name: copy.rejectDialog.title });
    const reason = within(dialog).getByLabelText(copy.rejectDialog.reasonLabel);
    expect(reason.getAttribute('maxlength')).toBe('500');

    fireEvent.change(within(dialog).getByLabelText(copy.rejectDialog.categoryLabel), { target: { value: 'pricing' } });
    const limit = 500 - ('Implausible pricing'.length + 3);
    expect(reason.getAttribute('maxlength')).toBe(String(limit));

    fireEvent.change(reason, { target: { value: 'x'.repeat(limit + 1) } });
    fireEvent.click(within(dialog).getByRole('button', { name: copy.rejectDialog.confirmRejection }));

    expect(within(dialog).getByRole('alert').textContent).toBe(copy.decisionLive.reasonTooLong(limit));
    expect(screen.queryByRole('dialog', { name: copy.rejectDialog.confirmTitle })).toBeNull();
    expect(postsTo(fetchMock, REJECT_URL)).toHaveLength(0);
  });

  it('locks the controls while a decision is being saved', async () => {
    let release: (response: Response) => void = () => undefined;
    const fetchMock = await openDetail({
      [APPROVE_URL]: () => new Promise<Response>((resolve) => (release = resolve)),
    });

    checkAll();
    fireEvent.click(screen.getByRole('button', { name: copy.decision.approveButton }));
    fireEvent.click(
      within(screen.getByRole('dialog', { name: copy.approveDialog.title })).getByRole('button', { name: copy.approveDialog.confirm }),
    );

    expect(await screen.findByText(copy.decisionLive.submitting)).toBeTruthy();
    expect(screen.getByRole('button', { name: copy.decision.approveButton }).hasAttribute('disabled')).toBe(true);
    expect(screen.getByRole('button', { name: copy.decision.rejectButton }).hasAttribute('disabled')).toBe(true);
    expect(postsTo(fetchMock, APPROVE_URL)).toHaveLength(1);

    release(json({ tourId: 12, status: 'Approved' }));
    expect(await screen.findByText(copy.decisionLive.approvedResult)).toBeTruthy();
  });

  it('sends a single request even if confirm is activated twice before React re-renders', async () => {
    const fetchMock = await openDetail({ [APPROVE_URL]: () => json({ tourId: 12, status: 'Approved' }) });

    checkAll();
    fireEvent.click(screen.getByRole('button', { name: copy.decision.approveButton }));
    const confirm = within(screen.getByRole('dialog', { name: copy.approveDialog.title })).getByRole('button', {
      name: copy.approveDialog.confirm,
    });
    act(() => {
      confirm.click();
      confirm.click();
    });

    expect(await screen.findByText(copy.decisionLive.approvedResult)).toBeTruthy();
    expect(postsTo(fetchMock, APPROVE_URL)).toHaveLength(1);
  });

  it('tells the reviewer another reviewer already decided (409) and locks the panel', async () => {
    const fetchMock = await openDetail({ [APPROVE_URL]: () => json({ title: 'no longer pending', errorCode: 'operator_tour.invalid_state' }, 409) });

    checkAll();
    fireEvent.click(screen.getByRole('button', { name: copy.decision.approveButton }));
    fireEvent.click(
      within(screen.getByRole('dialog', { name: copy.approveDialog.title })).getByRole('button', { name: copy.approveDialog.confirm }),
    );

    expect((await screen.findByRole('alert')).textContent).toContain(copy.decisionLive.alreadyDecided);
    expect(screen.queryByText(copy.decisionLive.approvedResult)).toBeNull();
    expect(screen.getByRole('button', { name: copy.decision.approveButton }).hasAttribute('disabled')).toBe(true);
    expect(postsTo(fetchMock, APPROVE_URL)).toHaveLength(1);
  });

  it('reports a temporary failure (MSG127) and lets the reviewer retry successfully', async () => {
    const fetchMock = await openDetail({
      [APPROVE_URL]: [() => json({ title: 'down', errorCode: 'operator_tour.service_unavailable' }, 503), () => json({ tourId: 12 })],
    });

    const approve = async () => {
      fireEvent.click(screen.getByRole('button', { name: copy.decision.approveButton }));
      fireEvent.click(
        within(screen.getByRole('dialog', { name: copy.approveDialog.title })).getByRole('button', { name: copy.approveDialog.confirm }),
      );
    };

    checkAll();
    await approve();
    expect((await screen.findByRole('alert')).textContent).toContain(copy.decisionLive.unavailable);
    expect(screen.queryByText(copy.decisionLive.approvedResult)).toBeNull();
    await waitFor(() => expect(screen.getByRole('button', { name: copy.decision.approveButton }).hasAttribute('disabled')).toBe(false));

    await approve();
    expect(await screen.findByText(copy.decisionLive.approvedResult)).toBeTruthy();
    expect(postsTo(fetchMock, APPROVE_URL)).toHaveLength(2);
  });
});
