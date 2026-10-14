import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LandingContent, LandingContentState } from './landingContent';
import {
  getApprovedTours,
  getLandingContent,
  LandingContentError,
  publishDraft,
  restoreVersion,
  saveDraft,
  uploadImage,
} from './landingContentService';

const content: LandingContent = {
  hero: { headline: 'H', subHeadline: '', backgroundImage: null, ctaLabel: 'Go', ctaTarget: '/' },
  destinations: [],
  featuredTourIds: [],
  banner: { image: null, link: '', displayStart: '', displayEnd: '' },
};
const published = {
  versionId: 'v1',
  versionNumber: 1,
  publishedByName: 'Admin',
  publishedAtUtc: '2026-10-01T00:00:00Z',
  content,
};
const state: LandingContentState = { published, draft: null, history: [] };

const fetchMock = vi.fn();

function reply(status: number, body: unknown) {
  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(body), { status }));
}

async function failure(promise: Promise<unknown>): Promise<LandingContentError> {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(LandingContentError);
    return error as LandingContentError;
  }
  throw new Error('expected the call to reject');
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('landingContentService', () => {
  it('reads the content with same-origin credentials and no caching', async () => {
    reply(200, state);
    await expect(getLandingContent()).resolves.toEqual(state);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/admin/landing-content');
    expect(init).toMatchObject({ method: 'GET', credentials: 'same-origin', cache: 'no-store' });
  });

  it('saves a draft as JSON with the base version', async () => {
    reply(200, { baseVersion: 1, content });
    await saveDraft(1, content);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/admin/landing-content/draft');
    expect(init.method).toBe('PUT');
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/json' });
    expect(JSON.parse(init.body)).toEqual({ baseVersion: 1, content });
  });

  it('publishes the draft by base version', async () => {
    reply(200, published);
    await expect(publishDraft(1)).resolves.toEqual(published);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/admin/landing-content/publish');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ baseVersion: 1 });
  });

  it('restores a version by id', async () => {
    reply(200, { baseVersion: 1, content });
    await restoreVersion('v0');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/admin/landing-content/restore');
    expect(JSON.parse(init.body)).toEqual({ versionId: 'v0' });
  });

  it('uploads an image as multipart without a manual content type', async () => {
    reply(201, { mediaId: 'm1', url: '/media/m1.png' });
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    await expect(uploadImage(file)).resolves.toEqual({ mediaId: 'm1', url: '/media/m1.png' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/admin/landing-content/media');
    expect(init.body).toBeInstanceOf(FormData);
    expect(init.headers).toBeUndefined();
  });

  it('lists approved tours', async () => {
    reply(200, [{ tourId: 't1', title: 'Hue tour' }]);
    await expect(getApprovedTours()).resolves.toEqual([{ tourId: 't1', title: 'Hue tour' }]);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/admin/landing-content/approved-tours');
  });

  it('maps a 422 body to field errors', async () => {
    reply(422, { errors: { 'hero.headline': 'required' } });
    const error = await failure(saveDraft(1, content));
    expect(error.status).toBe(422);
    expect(error.fieldErrors).toEqual({ 'hero.headline': 'required' });
  });

  it.each([401, 403, 409, 503])('keeps the %i status', async (status) => {
    reply(status, { title: 'x' });
    expect((await failure(getLandingContent())).status).toBe(status);
  });

  it('treats a 200 body that fails the type guard as status 0', async () => {
    reply(200, { published: null });
    expect((await failure(getLandingContent())).status).toBe(0);
  });

  it('treats a network failure as status 0', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('network'));
    expect((await failure(getLandingContent())).status).toBe(0);
  });
});
