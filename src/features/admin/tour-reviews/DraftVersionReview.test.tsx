import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DraftVersionReview } from './DraftVersionReview';
import { tourModerationEn } from './resources/en';

const copy = tourModerationEn.draftVersion;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

type Handler = (init: RequestInit | undefined) => Response | Promise<Response>;

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

const draft = (overrides: Record<string, unknown> = {}) => ({
  id: 55,
  tourId: 42,
  status: 'PendingReview',
  categoryId: 3,
  title: 'Tour Bà Nà (bản nháp)',
  description: 'Mô tả cập nhật',
  basePrice: 1200000,
  durationDays: 1,
  inclusions: 'Xe đưa đón mới',
  exclusions: null,
  highlights: null,
  travellerRequirements: null,
  timeZoneId: 'Asia/Ho_Chi_Minh',
  destinationIds: [1, 2],
  destinationSummary: 'Đà Nẵng, Quảng Nam',
  cancellationPolicyTemplateId: 7,
  itineraryItems: [],
  schedules: [
    {
      scheduleId: 5,
      startAtUtc: '2026-11-20T01:30:00+00:00',
      endAtUtc: '2026-11-20T09:30:00+00:00',
      meetingPoint: null,
      totalCapacity: 8,
      minimumCapacity: 4,
      registrationDeadlineAtUtc: null,
      adultPrice: 1200000,
      childPrice: null,
      infantPrice: null,
    },
    { scheduleId: null, startAtUtc: '2026-12-01T01:00:00+00:00', endAtUtc: '2026-12-01T09:00:00+00:00', meetingPoint: null, totalCapacity: 10, minimumCapacity: 1, registrationDeadlineAtUtc: null, adultPrice: null, childPrice: null, infantPrice: null },
  ],
  createdAtUtc: '2026-11-20T00:00:00Z',
  updatedAtUtc: '2026-11-20T00:00:00Z',
  submittedAtUtc: '2026-11-20T00:00:00Z',
  reviewedAtUtc: null,
  rejectionReason: null,
  ...overrides,
});

const liveTour = (overrides: Record<string, unknown> = {}) => ({
  id: 42,
  title: 'Tour Bà Nà (đã duyệt)',
  destination: 'Đà Nẵng',
  description: 'Mô tả gốc',
  categoryId: 3,
  basePrice: 1000000,
  durationDays: 1,
  versionNo: 1,
  status: 'Approved',
  rejectionReason: null,
  inclusions: 'Xe đưa đón',
  exclusions: null,
  destinations: [{ destinationId: 1, name: 'Đà Nẵng' }, { destinationId: 2, name: 'Quảng Nam' }],
  cancellationPolicyTemplateId: 7,
  itineraryItems: [],
  departures: [
    { id: 5, startAtUtc: '2026-11-20T01:30:00+00:00', endAtUtc: '2026-11-20T09:30:00+00:00', meetingPoint: null, minimumCapacity: 4, totalCapacity: 12, reservedCapacity: 4, registrationDeadlineAtUtc: null, adultPrice: 1000000, childPrice: null, infantPrice: null, status: 'Scheduled' },
  ],
  timeZoneId: 'Asia/Ho_Chi_Minh',
  highlights: null,
  travellerRequirements: null,
  mediaCount: 0,
  hasPrimaryImage: false,
  canSubmitForReview: false,
  reviewBlockers: [],
  warnings: [],
  ...overrides,
});

const DETAIL_URL = 'GET /api/admin/tours/pending-changes/55';
const LIVE_URL = 'GET /api/admin/tours/42';
const APPROVE_URL = 'POST /api/admin/tours/pending-changes/55/approve';
const REJECT_URL = 'POST /api/admin/tours/pending-changes/55/reject';

beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'production');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('DraftVersionReview (TM-82 §5.4)', () => {
  it('fetches the draft then the live tour, and renders a full field diff', async () => {
    mockBackend({ [DETAIL_URL]: () => json(draft()), [LIVE_URL]: () => json(liveTour()) });

    render(<DraftVersionReview pendingChangeId="55" onDecision={() => {}} />);

    await screen.findByRole('heading', { name: 'Tour Bà Nà (đã duyệt)', level: 1 });
    expect(screen.getByText('Tour Bà Nà (bản nháp)')).toBeTruthy(); // proposed title, in the diff row
    expect(screen.getByText('1000000')).toBeTruthy();
    expect(screen.getByText('1200000')).toBeTruthy();
  });

  it('shows a matched schedule change and a new schedule separately', async () => {
    mockBackend({ [DETAIL_URL]: () => json(draft()), [LIVE_URL]: () => json(liveTour()) });

    render(<DraftVersionReview pendingChangeId="55" onDecision={() => {}} />);

    await screen.findByText(copy.schedulesTitle);
    expect(screen.getByText(copy.newScheduleLabel)).toBeTruthy();
    // Matched schedule: live capacity 12 struck through, proposed 8 highlighted.
    expect(screen.getByText('12')).toBeTruthy();
    expect(screen.getAllByText('8').length).toBeGreaterThan(0);
  });

  it('flags a live schedule missing from the proposal instead of silently dropping it', async () => {
    mockBackend({
      [DETAIL_URL]: () => json(draft({ schedules: [] })),
      [LIVE_URL]: () => json(liveTour()),
    });

    render(<DraftVersionReview pendingChangeId="55" onDecision={() => {}} />);

    expect(await screen.findByText(copy.scheduleInconsistencyWarning)).toBeTruthy();
  });

  it('shows a not-found state for a 404 pending-change-not-found response', async () => {
    mockBackend({ [DETAIL_URL]: () => json({ title: 'x', errorCode: 'operator_tour.pending_change_not_found' }, 404) });

    render(<DraftVersionReview pendingChangeId="55" onDecision={() => {}} />);

    expect(await screen.findByText(copy.notFoundTitle)).toBeTruthy();
  });

  it('approving calls the approve endpoint and reports success, not implying the tour itself changed status', async () => {
    const onDecision = vi.fn();
    mockBackend({
      [DETAIL_URL]: () => json(draft()),
      [LIVE_URL]: () => json(liveTour()),
      [APPROVE_URL]: () => json({ id: 55, tourId: 42, status: 'Applied', tourStatus: 'Approved', message: 'MSG144' }),
    });

    render(<DraftVersionReview pendingChangeId="55" onDecision={onDecision} />);
    await screen.findByText(copy.decision.approveButton);

    fireEvent.click(screen.getByRole('button', { name: copy.decision.approveButton }));
    fireEvent.click(await screen.findByRole('button', { name: tourModerationEn.approveDialog.confirm }));

    await waitFor(() => expect(screen.getByText(copy.decision.approvedResult)).toBeTruthy());
    expect(onDecision).toHaveBeenCalledWith('approved');
    // The success copy must describe the draft version, never claim the live tour's own status changed.
    expect(copy.decision.approvedResult).not.toMatch(/tour (is|was) approved/i);
  });

  it('rejecting requires a non-empty reason before any request, then sends it', async () => {
    mockBackend({
      [DETAIL_URL]: () => json(draft()),
      [LIVE_URL]: () => json(liveTour()),
      [REJECT_URL]: () => json({ id: 55, tourId: 42, status: 'Rejected', tourStatus: 'Approved', message: 'MSG145' }),
    });

    render(<DraftVersionReview pendingChangeId="55" onDecision={() => {}} />);
    await screen.findByText(copy.decision.rejectButton);

    fireEvent.click(screen.getByRole('button', { name: copy.decision.rejectButton }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.submit(within(dialog).getByRole('textbox', { name: /reason/i }).closest('form')!);
    expect(within(dialog).getByRole('alert')).toBeTruthy(); // empty-reason error, no request sent yet

    fireEvent.change(within(dialog).getByRole('textbox', { name: /reason/i }), { target: { value: 'Thiếu ảnh chất lượng cao' } });
    fireEvent.submit(within(dialog).getByRole('textbox', { name: /reason/i }).closest('form')!);
    fireEvent.click(await screen.findByRole('button', { name: /reject tour post/i }));

    await waitFor(() => expect(screen.getByText(copy.decision.rejectedResult)).toBeTruthy());
  });

  it('a 409 stale-decision failure on approve is shown as "already decided", not a generic error', async () => {
    mockBackend({
      [DETAIL_URL]: () => json(draft()),
      [LIVE_URL]: () => json(liveTour()),
      [APPROVE_URL]: () => json({ title: 'Stale', errorCode: 'operator_tour.invalid_state' }, 409),
    });

    render(<DraftVersionReview pendingChangeId="55" onDecision={() => {}} />);
    await screen.findByText(copy.decision.approveButton);

    fireEvent.click(screen.getByRole('button', { name: copy.decision.approveButton }));
    fireEvent.click(await screen.findByRole('button', { name: tourModerationEn.approveDialog.confirm }));

    expect(await screen.findByText(copy.decision.staleDecision)).toBeTruthy();
  });
});
