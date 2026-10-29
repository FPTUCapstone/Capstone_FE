import { afterEach, describe, expect, it, vi } from 'vitest';

import { getDevTourCategories, searchDevTours } from './devTourApi';

export const devTourPage = {
  page: 1, pageSize: 20, totalCount: 1, totalPages: 1, asOfUtc: '2026-10-17T00:00:00Z',
  items: [{ tourId: '9007199254740995', title: 'Quiet beach', destinations: ['Hoi An'], operatorName: 'Operator', durationDays: 2, basePrice: 500000, currency: 'VND', representativeScheduleId: '9007199254740997', departureAtUtc: '2027-01-01T00:00:00Z', availabilityStatus: 'available', remainingSlots: 2, thumbnailUrl: null, aggregateRating: null }],
};

describe('development search transport contract', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('uses same-origin dev route with cancellation and preserves string IDs and null rating', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(devTourPage)));
    const controller = new AbortController();
    const page = await searchDevTours(new URLSearchParams('keyword=sea&mode=hybrid'), controller.signal);
    expect(fetch).toHaveBeenCalledWith('/api/dev/tours/search?keyword=sea&mode=hybrid', expect.objectContaining({ signal: controller.signal }));
    expect(page.items[0]).toMatchObject({ tourId: '9007199254740995', aggregateRating: null });
  });

  it.each([
    { ...devTourPage, totalCount: Number.MAX_SAFE_INTEGER + 1 },
    { ...devTourPage, totalPages: 2 },
    { ...devTourPage, items: [] },
    { ...devTourPage, items: [{ ...devTourPage.items[0], aggregateRating: undefined }] },
    { ...devTourPage, items: [{ ...devTourPage.items[0], aggregateRating: 8 }] },
    { ...devTourPage, items: [{ ...devTourPage.items[0], tourId: 9007199254740992 }] },
    { ...devTourPage, items: [{ ...devTourPage.items[0], availabilityStatus: 'invented' }] },
  ])('rejects malformed or incomplete successful pages', async (body) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(body)));
    await expect(searchDevTours(new URLSearchParams())).rejects.toThrow();
  });

  it('loads only active server-provided category codes', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json([{ categoryId: 1, code: 'SEA', name: 'Sea' }])));
    expect(await getDevTourCategories()).toEqual([{ categoryId: 1, code: 'SEA', name: 'Sea' }]);
  });

  it('does not turn dependency errors into empty results or expose raw details', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ errorCode: 'DevSearch.IndexIncomplete', detail: 'private-secret' }, { status: 503 })));
    await expect(searchDevTours(new URLSearchParams())).rejects.toThrow(/missing|stale/i);
    await expect(searchDevTours(new URLSearchParams())).rejects.not.toThrow(/private-secret/);
  });

  it('preserves upstream AbortError so cancelled reads do not become user errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError')));
    await expect(searchDevTours(new URLSearchParams())).rejects.toMatchObject({ name: 'AbortError' });
  });
});
