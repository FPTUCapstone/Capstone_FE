import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchPoiDetail, fetchPois, parsePagedPois, parsePoiDetail } from './poiApi';

describe('POI API response parsing', () => {
  it('accepts nullable list fields without inventing values', () => {
    const page = parsePagedPois({
      page: 1,
      pageSize: 20,
      totalCount: 1,
      totalPages: 1,
      items: [
        {
          id: 42,
          name: 'Mỹ Khê',
          categoryId: 3,
          categoryName: 'Bãi biển',
          latitude: 16.061,
          longitude: 108.246,
          address: null,
          indoorOutdoor: 'Outdoor',
          averageVisitDurationMinutes: 90,
          hasShelter: false,
          averageRating: null,
          reviewCount: 0,
          thumbnailUrl: null,
          distanceKm: null,
          isOpenNow: true,
        },
      ],
    });

    expect(page.items[0]).toMatchObject({
      id: 42,
      address: null,
      averageRating: null,
      thumbnailUrl: null,
      distanceKm: null,
    });
  });

  it('rejects malformed detail payloads at the service boundary', () => {
    expect(() => parsePoiDetail({ id: '42', name: 'Mỹ Khê' })).toThrow(
      'Dữ liệu địa điểm không hợp lệ.',
    );
  });

  it('accepts null times when the backend marks an opening-hours row closed', () => {
    const detail = parsePoiDetail({
      id: 1,
      name: 'Da Lat Flower Park',
      description: 'Công viên hoa thử nghiệm TM-98',
      status: 'Active',
      categoryId: 1,
      categoryName: 'Attraction',
      latitude: 11.941755,
      longitude: 108.438278,
      address: 'Đà Lạt, Lâm Đồng',
      indoorOutdoor: 'Mixed',
      averageVisitDurationMinutes: 90,
      hasShelter: true,
      scenicScore: null,
      photoRating: null,
      averageRating: null,
      reviewCount: 0,
      isOpenNow: true,
      openingHours: [
        { dayOfWeek: 0, openTime: null, closeTime: null, isClosed: true },
        { dayOfWeek: 1, openTime: '08:00:00', closeTime: '17:00:00', isClosed: false },
      ],
      photos: [],
      tags: [{ id: 1, name: 'Nature' }],
      createdAtUtc: '2026-09-09T11:20:00Z',
      updatedAtUtc: '2026-09-09T11:20:00Z',
    });

    expect(detail.openingHours[0]).toEqual({
      dayOfWeek: 0,
      openTime: null,
      closeTime: null,
      isClosed: true,
    });
  });

  it('accepts a valid detail with a null description', () => {
    const detail = parsePoiDetail({ id: 1, name: 'POI', description: null, status: 'Active', categoryId: 1, categoryName: 'Attraction', latitude: 1, longitude: 1, address: null, indoorOutdoor: 'Outdoor', averageVisitDurationMinutes: 60, hasShelter: false, scenicScore: null, photoRating: null, averageRating: null, reviewCount: 0, isOpenNow: true, openingHours: [], photos: [], tags: [], createdAtUtc: '2026-01-01T00:00:00Z', updatedAtUtc: '2026-01-01T00:00:00Z' });
    expect(detail.description).toBeNull();
  });

  it('reads the Review 2 price fields and tolerates their absence (§3.3)', () => {
    const base = { id: 1, name: 'POI', description: null, status: 'Active', categoryId: 1, categoryName: 'Attraction', latitude: 1, longitude: 1, address: null, indoorOutdoor: 'Outdoor', averageVisitDurationMinutes: 60, hasShelter: false, scenicScore: null, photoRating: null, averageRating: null, reviewCount: 0, isOpenNow: true, openingHours: [], photos: [], tags: [], createdAtUtc: '2026-01-01T00:00:00Z', updatedAtUtc: '2026-01-01T00:00:00Z' };

    const priced = parsePoiDetail({ ...base, estimatedVisitCost: 40000, costKind: 'AdmissionTicket' });
    expect(priced.estimatedVisitCost).toBe(40000);
    expect(priced.costKind).toBe('AdmissionTicket');

    const legacy = parsePoiDetail(base);
    expect(legacy.estimatedVisitCost).toBeNull();
    expect(legacy.costKind).toBeNull();

    expect(() => parsePoiDetail({ ...base, estimatedVisitCost: '40000' })).toThrow();
  });
});

describe('POI API error propagation and explicit demo isolation', () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES;
    vi.unstubAllEnvs();
  });

  it('propagates 502/503 service unavailable as PoiApiError instead of returning fake fixtures', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      headers: { get: () => 'application/problem+json' },
      json: async () => ({ status: 503, title: 'Dịch vụ khám phá chưa được cấu hình.' }),
    });

    await expect(fetchPois(new URLSearchParams())).rejects.toThrow();
  });

  it('propagates 502 Bad Gateway on detail request as PoiApiError', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      headers: { get: () => 'application/problem+json' },
      json: async () => ({ status: 502, title: 'Không thể kết nối máy chủ khám phá.' }),
    });

    await expect(fetchPoiDetail('1')).rejects.toThrow();
  });

  it('propagates network failure as error without silently substituting fixtures', async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(fetchPois(new URLSearchParams())).rejects.toThrow('Không thể kết nối máy chủ khám phá.');
    await expect(fetchPoiDetail('1')).rejects.toThrow('Không thể kết nối máy chủ khám phá.');
  });

  it('propagates AbortError without converting to sample results', async () => {
    const abortErr = new DOMException('The user aborted a request.', 'AbortError');
    global.fetch = vi.fn().mockRejectedValue(abortErr);

    await expect(fetchPois(new URLSearchParams())).rejects.toThrow('The user aborted a request.');
  });

  it('returns demo fixtures in development mode only when NEXT_PUBLIC_ENABLE_DEMO_FIXTURES is explicitly true', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';

    const paged = await fetchPois(new URLSearchParams());
    expect(paged.items.length).toBeGreaterThan(0);
    expect(paged.items[0].name).toBeTruthy();

    const detail = await fetchPoiDetail('1');
    expect(detail.id).toBe(1);
    expect(detail.name).toBe('Bãi biển Mỹ Khê');
  });

  it('strictly ignores NEXT_PUBLIC_ENABLE_DEMO_FIXTURES in production mode', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      headers: { get: () => 'application/problem+json' },
      json: async () => ({ status: 503, title: 'Dịch vụ khám phá chưa được cấu hình.' }),
    });

    await expect(fetchPois(new URLSearchParams())).rejects.toThrow();
    await expect(fetchPoiDetail('1')).rejects.toThrow();
  });
});
