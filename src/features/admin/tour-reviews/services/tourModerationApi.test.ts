import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ModerationApiError,
  fetchPendingTourPage,
  fetchTourReview,
  parsePendingTourPage,
  parseTourReview,
  submitApproval,
  submitRejection,
} from './tourModerationApi';

/** One row of GET /api/v1/admin/tours (TM-83 members first, then the Screen 13 columns). */
const queueRow = {
  id: 12,
  operatorUserId: 101,
  title: 'Hoi An lantern night',
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
  imageCount: 3,
};

/** Header members of GET /api/v1/admin/tours/{id}/review. */
const reviewHeader = {
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
  imageCount: 3,
};

const envelope = (items: unknown[], totalCount = items.length, page = 1, pageSize = 20) => ({ items, totalCount, page, pageSize });

const detail = {
  ...reviewHeader,
  overview: 'A relaxed food tour.',
  highlights: null,
  includedServices: ['Breakfast'],
  excludedServices: [],
  travellerRequirements: null,
  cancellationPolicy: [{ daysBeforeDeparture: 30, feePercent: 0 }],
  schedules: [
    {
      startAtUtc: '2026-11-20T01:00:00+00:00',
      endAtUtc: '2026-11-21T01:00:00+00:00',
      meetingPoint: 'Gate',
      capacity: 8,
      adultPrice: 1500000,
      childPrice: null,
      infantPrice: null,
    },
  ],
  itinerary: [{ dayNo: 1, sequenceNo: 1, poiName: 'Ancient Town', plannedTime: '08:30:00', stayMinutes: 90, notes: null }],
  images: [{ url: 'https://res.cloudinary.com/x/a.webp', altText: 'alt', caption: null, isPrimary: true }],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('parsePendingTourPage', () => {
  it('maps the backend queue envelope and stringifies ids', () => {
    const page = parsePendingTourPage(envelope([queueRow]));

    expect(page.items).toHaveLength(1);
    expect(page.items[0]).toMatchObject({
      id: '12',
      tourName: 'Hoi An lantern night',
      submittedAtUtc: '2026-11-10T08:00:00+00:00',
      operatorName: 'Sunrise Travel',
      departureAtUtc: '2026-11-20T01:00:00+00:00',
      capacity: 8,
      category: null,
      imageCount: 3,
    });
    expect(page).toMatchObject({ totalCount: 1, page: 1, pageSize: 20, totalPages: 1 });
  });

  it('accepts a tour without a departure', () => {
    const page = parsePendingTourPage(envelope([{ ...queueRow, nextDepartureAtUtc: null, nextDepartureCapacity: null }]));
    expect(page.items[0].departureAtUtc).toBeNull();
    expect(page.items[0].capacity).toBeNull();
  });

  it('accepts a legacy row without a submission time', () => {
    const page = parsePendingTourPage(envelope([{ ...queueRow, submittedAtUtc: null }]));
    expect(page.items[0].submittedAtUtc).toBeNull();
  });

  it('derives totalPages because the backend envelope does not carry it', () => {
    expect(parsePendingTourPage(envelope([queueRow], 25, 2, 20)).totalPages).toBe(2);
    expect(parsePendingTourPage(envelope([queueRow], 20, 1, 20)).totalPages).toBe(1);
    expect(parsePendingTourPage(envelope([queueRow], 21, 1, 20)).totalPages).toBe(2);
    expect(parsePendingTourPage(envelope([], 0, 1, 20)).totalPages).toBe(0);
  });

  it('rejects an envelope whose page size is not positive', () => {
    expect(() => parsePendingTourPage(envelope([], 0, 1, 0))).toThrow(ModerationApiError);
  });

  it.each([null, 'x', 42, {}, { items: 'nope' }, { items: [{ id: 'x' }], totalCount: 1, page: 1, pageSize: 20 }])(
    'rejects a malformed payload %#',
    (payload) => {
      expect(() => parsePendingTourPage(payload)).toThrow(ModerationApiError);
    },
  );
});

describe('parseTourReview', () => {
  it('maps every checklist input', () => {
    const view = parseTourReview(detail);

    expect(view.id).toBe('12');
    expect(view.overview).toBe('A relaxed food tour.');
    expect(view.includedServices).toEqual(['Breakfast']);
    expect(view.cancellationRules).toEqual([{ daysBeforeDeparture: 30, feePercent: 0 }]);
    expect(view.schedules[0]).toMatchObject({ meetingPoint: 'Gate', capacity: 8, adultPrice: 1500000 });
    expect(view.itinerary[0]).toMatchObject({ dayNo: 1, poiName: 'Ancient Town', plannedTime: '08:30', stayMinutes: 90 });
    expect(view.images[0]).toMatchObject({ url: 'https://res.cloudinary.com/x/a.webp', isPrimary: true });
  });

  it('refuses non-https image URLs so a reviewer never loads arbitrary content', () => {
    const view = parseTourReview({ ...detail, images: [{ ...detail.images[0], url: 'javascript:alert(1)' }, detail.images[0]] });
    expect(view.images.map((image) => image.url)).toEqual(['https://res.cloudinary.com/x/a.webp']);
  });

  it('rejects a payload that is not a tour review', () => {
    expect(() => parseTourReview({ tourId: 1 })).toThrow(ModerationApiError);
  });
});

describe('fetch helpers', () => {
  function stubFetch(status: number, body: unknown) {
    const mock = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', mock);
    return mock;
  }

  it('requests the queue with only the paging and keyword', async () => {
    const mock = stubFetch(200, envelope([], 0, 2, 20));

    await fetchPendingTourPage({ page: 2, keyword: 'lantern' });

    expect(mock.mock.calls[0][0]).toBe('/api/admin/tours/pending?pageNumber=2&keyword=lantern');
  });

  it('omits an empty keyword and the first page', async () => {
    const mock = stubFetch(200, envelope([], 0, 1, 20));

    await fetchPendingTourPage({ page: 1, keyword: '' });

    expect(mock.mock.calls[0][0]).toBe('/api/admin/tours/pending');
  });

  it.each([401, 403, 404, 409, 503])('surfaces HTTP %i as a ModerationApiError with the server title', async (status) => {
    stubFetch(status, { title: 'Server says no', errorCode: 'operator_tour.invalid_state' });

    await expect(fetchTourReview('12')).rejects.toMatchObject({
      name: 'ModerationApiError',
      status,
      title: 'Server says no',
      errorCode: 'operator_tour.invalid_state',
    });
  });

  it('turns a network failure into status 0', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
    await expect(fetchTourReview('12')).rejects.toMatchObject({ status: 0 });
  });

  it('rejects an id that is not a positive integer before calling the network', async () => {
    const mock = stubFetch(200, detail);
    await expect(fetchTourReview('../etc')).rejects.toMatchObject({ status: 400 });
    expect(mock).not.toHaveBeenCalled();
  });
});

describe('decision submissions', () => {
  it('posts the five-item checklist and the note on approval', async () => {
    const mock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ tourId: 12, status: 'Approved' }), { status: 200 }));
    vi.stubGlobal('fetch', mock);
    const checklist = {
      contentCompleteness: true,
      imageAppropriateness: true,
      pricePlausibility: true,
      policyCompliance: true,
      itineraryFeasibility: true,
    };

    await submitApproval('12', checklist, 'looks fine');

    const [url, init] = mock.mock.calls[0];
    expect(url).toBe('/api/admin/tours/12/approve');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ checklist, note: 'looks fine' });
  });

  it('omits an empty note', async () => {
    const mock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', mock);

    await submitApproval('12', { contentCompleteness: true, imageAppropriateness: true, pricePlausibility: true, policyCompliance: true, itineraryFeasibility: true }, '   ');

    expect(JSON.parse(mock.mock.calls[0][1].body as string)).not.toHaveProperty('note');
  });

  it('posts the trimmed reason on rejection', async () => {
    const mock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', mock);

    await submitRejection('12', '  Price does not match  ');

    const [url, init] = mock.mock.calls[0];
    expect(url).toBe('/api/admin/tours/12/reject');
    expect(JSON.parse(init.body as string)).toEqual({ reason: 'Price does not match' });
  });

  it('reports a decided tour as a 409 error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ title: 'no longer pending' }), { status: 409 })));
    await expect(submitRejection('12', 'x')).rejects.toMatchObject({ status: 409, title: 'no longer pending' });
  });
});
