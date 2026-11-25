import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PoiManagementQuery } from '../types/poi-management';
import { loadPoiManagement, parsePoiManagementResponse, PoiManagementApiError, serializePoiManagementQuery, parsePoiDeactivationReferences, parseDeactivatePoiResponse, loadPoiDeactivationReferences, deactivatePoi } from './poi-management-api';

function payload() {
  return {
    page: 1, pageSize: 20, totalCount: 1, totalPages: 1,
    metadata: { categories: [{ id: 7, name: 'Attraction' }, { id: 8, name: 'Empty category' }] },
    items: [{ id: '9007199254740993', name: 'Example', categoryId: 7, categoryName: 'Attraction', address: null,
      latitude: 90, longitude: -180, status: 'Active',
      openingHours: [{ dayOfWeek: 0, openTime: '08:00:00', closeTime: '17:00:00.0000001', isClosed: false }] }],
  };
}

describe('management list whole-response contract', () => {
  it('retains the exported safe error type for callers', () => {
    let caught: unknown;
    try { parsePoiManagementResponse(null); } catch (error) { caught = error; }
    expect(caught).toBeInstanceOf(PoiManagementApiError);
    expect(() => { throw new PoiManagementApiError(503, 'POI_MANAGEMENT_UNAVAILABLE'); }).toThrow(PoiManagementApiError);
  });
  it('preserves BIGINT strings, nullable address and complete category choices', () => {
    expect(parsePoiManagementResponse(payload())).toEqual(payload());
  });
  it('constructs only approved fields at every level', () => {
    const source = payload();
    const result = parsePoiManagementResponse({ ...source, token: 'secret',
      metadata: { categories: source.metadata.categories.map(c => ({ ...c, secret: 'x' })), secret: 'x' },
      items: source.items.map(item => ({ ...item, internalDetail: 'x', openingHours: item.openingHours.map(hour => ({ ...hour, secret: 'x' })) })) });
    expect(result).toEqual(source);
    expect(JSON.stringify(result)).not.toContain('secret');
  });
  it.each(['1', '9223372036854775807'])('accepts canonical ID %s', id => {
    const b = payload(); b.items[0].id = id;
    expect(parsePoiManagementResponse(b).items[0].id).toBe(id);
  });
  it.each(['0', '-1', '+1', '01', ' 1', '1 ', '1e3', '1.0', '9223372036854775808', '999999999999999999999'])('rejects invalid ID %s', id => {
    const b = payload(); b.items[0].id = id;
    expect(() => parsePoiManagementResponse(b)).toThrow(PoiManagementApiError);
  });
  const invalidCases: [string, (b: ReturnType<typeof payload>) => unknown][] = [
    ['numeric POI ID', b => ({ ...b, items: [{ ...b.items[0], id: 1 }] })],
    ['missing address', b => ({ ...b, items: [{ ...b.items[0], address: undefined }] })],
    ['invalid address', b => ({ ...b, items: [{ ...b.items[0], address: 5 }] })],
    ['blank name', b => ({ ...b, items: [{ ...b.items[0], name: ' ' }] })],
    ['blank category', b => ({ ...b, metadata: { categories: [{ id: 7, name: ' ' }] } })],
    ['string category ID', b => ({ ...b, metadata: { categories: [{ id: '7', name: 'Attraction' }] } })],
    ['category overflow', b => ({ ...b, metadata: { categories: [{ id: 2147483648, name: 'Attraction' }] } })],
    ['duplicate categories', b => ({ ...b, metadata: { categories: [...b.metadata.categories, b.metadata.categories[0]] } })],
    ['unknown category reference', b => ({ ...b, items: [{ ...b.items[0], categoryId: 9 }] })],
    ['category label mismatch', b => ({ ...b, items: [{ ...b.items[0], categoryName: 'Other' }] })],
    ['unknown status', b => ({ ...b, items: [{ ...b.items[0], status: 'active' }] })],
    ['latitude overflow', b => ({ ...b, items: [{ ...b.items[0], latitude: 90.001 }] })],
    ['longitude overflow', b => ({ ...b, items: [{ ...b.items[0], longitude: -180.001 }] })],
    ['nonfinite coordinate', b => ({ ...b, items: [{ ...b.items[0], latitude: NaN }] })],
    ['zero page', b => ({ ...b, page: 0 })],
    ['page overflow', b => ({ ...b, page: 2147483648 })],
    ['offset overflow', b => ({ ...b, page: 2147483647, pageSize: 2 })],
    ['large page size', b => ({ ...b, pageSize: 101 })],
    ['unsafe total', b => ({ ...b, totalCount: Number.MAX_SAFE_INTEGER + 1 })],
    ['negative total', b => ({ ...b, totalCount: -1 })],
    ['fractional count', b => ({ ...b, totalCount: 1.5 })],
    ['wrong page total', b => ({ ...b, totalPages: 2 })],
    ['missing item', b => ({ ...b, items: [] })],
    ['duplicate item', b => ({ ...b, totalCount: 2, items: [b.items[0], b.items[0]] })],
    ['missing metadata', b => ({ ...b, metadata: undefined })],
    ['array metadata', b => ({ ...b, metadata: [] })],
    ['null items', b => ({ ...b, items: null })],
  ];
  it.each(invalidCases)('rejects whole payload: %s', (_name, change) => {
    expect(() => parsePoiManagementResponse(change(payload()))).toThrow(PoiManagementApiError);
  });
  it('accepts empty totals and representable pages beyond last without clamping', () => {
    expect(parsePoiManagementResponse({ ...payload(), totalCount: 0, totalPages: 0, items: [] }).items).toEqual([]);
    expect(parsePoiManagementResponse({ ...payload(), page: 2, items: [] }).page).toBe(2);
  });
  it('does not impose JavaScript ordering on database-collated names', () => {
    const b = payload(); b.metadata.categories.reverse();
    expect(parsePoiManagementResponse(b).metadata.categories).toEqual(b.metadata.categories);
  });
  it.each(['08:00:00', '08:00:00.1', '08:00:00.1234567'])('accepts TimeOnly precision %s', openTime => {
    const b = payload(); b.items[0].openingHours[0].openTime = openTime;
    expect(parsePoiManagementResponse(b).items[0].openingHours[0].openTime).toBe(openTime);
  });
  it.each(['8:00:00', '24:00:00', '08:60:00', '08:00:60', '08:00:00.', '08:00:00.12345678', '08:00:00Z'])('rejects malformed TimeOnly %s', openTime => {
    const b = payload(); b.items[0].openingHours[0].openTime = openTime;
    expect(() => parsePoiManagementResponse(b)).toThrow(PoiManagementApiError);
  });
  it('accepts no hours and closed days; compares fractional precision without UTC', () => {
    for (const openingHours of [[], [{ dayOfWeek: 6, openTime: null, closeTime: null, isClosed: true }],
      [{ dayOfWeek: 0, openTime: '08:00:00.1000000', closeTime: '08:00:00.1000001', isClosed: false }]]) {
      expect(parsePoiManagementResponse({ ...payload(), items: [{ ...payload().items[0], openingHours }] }).items[0].openingHours).toEqual(openingHours);
    }
  });
  it.each([
    [[{ dayOfWeek: 7, openTime: null, closeTime: null, isClosed: true }]],
    [[{ dayOfWeek: 0, openTime: '08:00:00', closeTime: null, isClosed: false }]],
    [[{ dayOfWeek: 0, openTime: '08:00:00', closeTime: '08:00:00.0000000', isClosed: false }]],
    [[{ dayOfWeek: 0, openTime: '18:00:00', closeTime: '08:00:00', isClosed: false }]],
    [[{ dayOfWeek: 0, openTime: '08:00:00', closeTime: '17:00:00', isClosed: true }]],
    [[{ dayOfWeek: 2, openTime: null, closeTime: null, isClosed: true }, { dayOfWeek: 1, openTime: null, closeTime: null, isClosed: true }]],
    [[{ dayOfWeek: 0, openTime: null, closeTime: null, isClosed: true }, { dayOfWeek: 0, openTime: null, closeTime: null, isClosed: true }]],
  ])('rejects invalid hours %#', openingHours => {
    expect(() => parsePoiManagementResponse({ ...payload(), items: [{ ...payload().items[0], openingHours }] })).toThrow(PoiManagementApiError);
  });
});

describe('management list browser GET client', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('serializes only named filters, trimmed search, and supports abort', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(payload())); vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();
    await loadPoiManagement({ page: 1, pageSize: 20, search: '  lake & park  ', categoryId: 7, status: 'Active', url: 'https://evil.test' } as Parameters<typeof loadPoiManagement>[0], controller.signal);
    expect(fetchMock).toHaveBeenCalledWith('/api/admin/pois?page=1&pageSize=20&search=lake+%26+park&categoryId=7&status=Active',
      { method: 'GET', cache: 'no-store', credentials: 'same-origin', signal: controller.signal });
  });
  it('omits absent filters and whitespace-only search', () => {
    expect(serializePoiManagementQuery({ search: '  ' })).toBe('');
  });
  it.each([{ value: null }, { value: [] }, { value: 'page=1' }, { value: 1 }, { value: new Date(0) }])('rejects a malformed root query safely before fetching: %j', async ({ value }) => {
    const query = value as unknown as PoiManagementQuery;
    expect(() => serializePoiManagementQuery(query)).toThrow(PoiManagementApiError);
    const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
    await expect(loadPoiManagement(query)).rejects.toMatchObject({ status: 400, code: 'POI_MANAGEMENT_INVALID_QUERY' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it.each([{ page: 0 }, { page: null }, { pageSize: null }, { page: NaN }, { page: Infinity }, { pageSize: 101 }, { page: 2147483647, pageSize: 2 }, { categoryId: 0 }, { categoryId: 2147483648 }, { search: 'x'.repeat(201) }, { status: 'active' }])('rejects invalid query before fetching %j', async query => {
    const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
    await expect(loadPoiManagement(query as Parameters<typeof loadPoiManagement>[0])).rejects.toMatchObject({ status: 400 });
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('distinguishes safe field validation from unavailable responses without raw messages', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.resolve(Response.json({ detail: 'secret SQL token', errors: { page: ['raw SQL detail'] } }, { status: 400 }))));
    await expect(loadPoiManagement()).rejects.toMatchObject({ status: 400, code: 'POI_MANAGEMENT_INVALID_QUERY', errors: { page: ['Review this filter value.'] } });
    await expect(loadPoiManagement()).rejects.not.toHaveProperty('message', expect.stringContaining('SQL'));
  });
  it.each([401, 403, 404, 500, 502])('normalizes status %i safely', async status => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.resolve(Response.json({ detail: 'secret SQL token' }, { status }))));
    await expect(loadPoiManagement()).rejects.toMatchObject({ status: status === 401 || status === 403 ? status : 503 });
    await expect(loadPoiManagement()).rejects.not.toHaveProperty('message', expect.stringContaining('secret'));
  });
  it('rejects malformed JSON, malformed DTO and network failures as retryable503', async () => {
    for (const response of [new Response('not json'), Response.json({ items: [] })]) {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
      await expect(loadPoiManagement()).rejects.toMatchObject({ status: 503, code: 'POI_MANAGEMENT_UNAVAILABLE' });
    }
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('secret network detail')));
    await expect(loadPoiManagement()).rejects.toMatchObject({ status: 503 });
  });
  it('preserves cancellation for request sequencing', async () => {
    const controller = new AbortController(); controller.abort();
    const abort = new DOMException('Aborted', 'AbortError'); vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abort));
    await expect(loadPoiManagement({}, controller.signal)).rejects.toBe(abort);
  });
  it('maps field names to known filters and discards unrelated upstream fields/messages', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ errorCode: 'POI_MANAGEMENT_CATEGORY_NOT_FOUND',
      errors: { CategoryId: ['internal SQL detail'], token: ['secret'] } }, { status: 400 })));
    await expect(loadPoiManagement()).rejects.toMatchObject({ status: 400, code: 'POI_MANAGEMENT_CATEGORY_NOT_FOUND',
      errors: { categoryId: ['Review this filter value.'] } });
  });
  it('rejects a non-contract success status instead of false success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(payload(), { status: 201 })));
    await expect(loadPoiManagement()).rejects.toMatchObject({ status: 503 });
  });
  it('rejects valid DTO belonging to a different requested page size, category or status', async () => {
    for (const query of [{ pageSize: 10 }, { categoryId: 8 }, { status: 'Inactive' }]) {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(payload())));
      await expect(loadPoiManagement(query as Parameters<typeof loadPoiManagement>[0])).rejects.toMatchObject({ status: 503 });
    }
  });
});

describe('POI deactivation references and deactivate API client', () => {
  afterEach(() => vi.unstubAllGlobals());

  describe('parsePoiDeactivationReferences contract', () => {
    const validReferences = {
      poiId: 12345,
      poiName: 'Marble Mountains',
      status: 'Active',
      activeItinerariesCount: 2,
      activeRoutesCount: 3,
      openCommercialBookingsCount: 1,
      hasActiveReferences: true,
      referenceSnapshotToken: 'token_123',
      messageCode: 'MSG194',
      message: 'The point of interest is referenced by itineraries, routes or bookings.',
    };

    it('accepts canonical references DTO', () => {
      expect(parsePoiDeactivationReferences(validReferences)).toEqual(validReferences);
    });

    it('accepts null messageCode when references are 0', () => {
      const clean = {
        ...validReferences,
        activeItinerariesCount: 0,
        activeRoutesCount: 0,
        openCommercialBookingsCount: 0,
        hasActiveReferences: false,
        messageCode: null,
        message: null,
      };
      expect(parsePoiDeactivationReferences(clean)).toEqual(clean);
    });

    it.each([
      null,
      undefined,
      'not an object',
      { ...validReferences, poiId: 0 },
      { ...validReferences, activeItinerariesCount: -1 },
      { ...validReferences, activeRoutesCount: 'many' },
      { ...validReferences, referenceSnapshotToken: '' },
    ])('rejects invalid payload: %j', (invalid) => {
      expect(() => parsePoiDeactivationReferences(invalid)).toThrow(PoiManagementApiError);
    });
  });

  describe('parseDeactivatePoiResponse contract', () => {
    const validResponse = {
      poiId: 12345,
      status: 'Inactive',
      deactivatedConnectingRoutesCount: 2,
      deactivatedAtUtc: '2026-11-19T01:00:00Z',
      messageCode: 'MSG193',
      message: 'Point of interest deactivated.',
    };

    it('accepts canonical deactivate result DTO', () => {
      expect(parseDeactivatePoiResponse(validResponse)).toEqual(validResponse);
    });

    it.each([
      null,
      undefined,
      { ...validResponse, status: 'Active' },
      { ...validResponse, poiId: 0 },
      { ...validResponse, deactivatedConnectingRoutesCount: -1 },
      { ...validResponse, messageCode: '' },
    ])('rejects invalid deactivate payload: %j', (invalid) => {
      expect(() => parseDeactivatePoiResponse(invalid)).toThrow(PoiManagementApiError);
    });
  });

  describe('loadPoiDeactivationReferences browser GET client', () => {
    it('fetches references for valid ID', async () => {
      const refData = {
        poiId: 123,
        poiName: 'Test POI',
        status: 'Active',
        activeItinerariesCount: 1,
        activeRoutesCount: 0,
        openCommercialBookingsCount: 0,
        hasActiveReferences: true,
        referenceSnapshotToken: 'token_abc',
        messageCode: 'MSG194',
        message: 'Active references found.',
      };
      const fetchMock = vi.fn().mockResolvedValue(Response.json(refData));
      vi.stubGlobal('fetch', fetchMock);

      const result = await loadPoiDeactivationReferences('123');
      expect(result).toEqual(refData);
      expect(fetchMock).toHaveBeenCalledWith('/api/admin/pois/123/deactivation-references', {
        method: 'GET',
        cache: 'no-store',
        credentials: 'same-origin',
        signal: undefined,
      });
    });

    it('rejects invalid POI ID before fetching', async () => {
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);

      await expect(loadPoiDeactivationReferences('invalid-id')).rejects.toMatchObject({
        status: 503,
        code: 'POI_MANAGEMENT_UNAVAILABLE',
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('deactivatePoi browser POST client', () => {
    it('posts deactivation request with reason and referenceSnapshotToken', async () => {
      const resultData = {
        poiId: 123,
        status: 'Inactive',
        deactivatedAtUtc: '2026-11-19T01:00:00Z',
        deactivatedConnectingRoutesCount: 1,
        messageCode: 'MSG193',
        message: 'Point of interest deactivated.',
      };
      const fetchMock = vi.fn().mockResolvedValue(Response.json(resultData));
      vi.stubGlobal('fetch', fetchMock);

      const res = await deactivatePoi({
        poiId: 123,
        reason: 'Renovation closure',
        referenceSnapshotToken: 'token_abc',
      });
      expect(res).toEqual(resultData);
      expect(fetchMock).toHaveBeenCalledWith('/api/admin/pois/123/deactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        credentials: 'same-origin',
        body: JSON.stringify({
          poiId: 123,
          reason: 'Renovation closure',
          referenceSnapshotToken: 'token_abc',
        }),
      });
    });

    it('rejects empty reason before calling fetch', async () => {
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);

      await expect(
        deactivatePoi({
          poiId: 123,
          reason: '   ',
          referenceSnapshotToken: 'token_abc',
        }),
      ).rejects.toMatchObject({
        status: 400,
        code: 'POI_MANAGEMENT_INVALID_QUERY',
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('maps 409 Conflict when references changed', async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        Response.json({ messageCode: 'MSG194' }, { status: 409 }),
      );
      vi.stubGlobal('fetch', fetchMock);

      await expect(
        deactivatePoi({
          poiId: 123,
          reason: 'Valid reason',
          referenceSnapshotToken: 'token_abc',
        }),
      ).rejects.toMatchObject({
        status: 409,
        code: 'POI_MANAGEMENT_INVALID_QUERY',
      });
    });
  });
});
