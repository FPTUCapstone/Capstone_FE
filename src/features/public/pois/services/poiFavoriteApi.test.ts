import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getPoiFavorite, PoiFavoriteError, setPoiFavorite } from './poiFavoriteApi';

function respondWith(status: number, body: unknown) {
  global.fetch = vi.fn().mockResolvedValueOnce({ status, ok: status < 400, json: async () => body });
}

describe('POI favorite API (UC-10 feedback, §3.2)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('loads the favorite state with the traveler token', async () => {
    respondWith(200, { poiId: 42, isFavorite: true });

    const result = await getPoiFavorite(42, { accessToken: 'traveler-token' });

    expect(result).toEqual({ poiId: 42, isFavorite: true });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/pois\/42\/favorite$/),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ Authorization: 'Bearer traveler-token' }),
      }),
    );
  });

  it('turns the favorite on with PUT and no body', async () => {
    respondWith(200, { poiId: 42, isFavorite: true });

    const result = await setPoiFavorite(42, true, { accessToken: 'traveler-token' });

    expect(result.isFavorite).toBe(true);
    const [url, init] = vi.mocked(global.fetch).mock.calls[0];
    expect(url).toMatch(/\/pois\/42\/favorite$/);
    expect(init).toMatchObject({
      method: 'PUT',
      headers: expect.objectContaining({ Authorization: 'Bearer traveler-token' }),
    });
    expect(init?.body).toBeUndefined();
  });

  it('turns the favorite off with DELETE and no body', async () => {
    respondWith(200, { poiId: 42, isFavorite: false });

    const result = await setPoiFavorite(42, false);

    expect(result.isFavorite).toBe(false);
    const [url, init] = vi.mocked(global.fetch).mock.calls[0];
    expect(url).toMatch(/\/pois\/42\/favorite$/);
    expect(init?.method).toBe('DELETE');
    expect(init?.body).toBeUndefined();
  });

  it.each([401, 403, 404, 500])('reports HTTP %i as a typed error carrying the status', async (status) => {
    respondWith(status, { errorCode: 'poi.favorite_failed' });

    const failure = await setPoiFavorite(42, true).catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(PoiFavoriteError);
    expect((failure as PoiFavoriteError).status).toBe(status);
  });

  it('reports a failed load the same way', async () => {
    respondWith(401, null);

    await expect(getPoiFavorite(42)).rejects.toMatchObject({ name: 'PoiFavoriteError', status: 401 });
  });

  it('rejects a body that does not match the contract', async () => {
    respondWith(200, { poiId: 42, isFavorite: 'yes' });

    await expect(getPoiFavorite(42)).rejects.toMatchObject({ name: 'PoiFavoriteError', status: 502 });
  });

  it('survives a non-JSON body', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => {
        throw new SyntaxError('Unexpected token');
      },
    });

    await expect(setPoiFavorite(42, true)).rejects.toMatchObject({ name: 'PoiFavoriteError', status: 502 });
  });

  it('reports an unreachable server as status 0', async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(setPoiFavorite(42, false)).rejects.toMatchObject({ name: 'PoiFavoriteError', status: 0 });
  });

  it('lets an aborted request through untouched', async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'));

    const failure = await getPoiFavorite(42).catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(DOMException);
    expect(failure).not.toBeInstanceOf(PoiFavoriteError);
  });
});
