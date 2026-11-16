import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { AuthStorage } from '@/features/auth/session/authSession';
import { ExploreToursPage } from './ExploreToursPage';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(r => { resolve = r; });
  return { promise, resolve };
}
const context = (id = 1, role = 'Traveler', token = 'restored-token') => ({
  userId: id, role, status: 'Active', email: 'qa@example.test', fullName: 'QA',
  accessToken: token, accessTokenExpiresAtUtc: '2099-01-01T00:00:00Z',
});
const page = (criteria: object | null = {}) => ({
  page: 1, pageSize: 20, totalCount: 0, totalPages: 0,
  asOfUtc: '2026-11-16T00:00:00Z', criteria, items: [],
});
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
let restore: ReturnType<typeof deferred<Response>>;
let requests: { method: string; headers: Headers; path: string }[];
beforeEach(() => {
  AuthStorage.clear();
  restore = deferred<Response>();
  requests = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    if (String(url).endsWith('/auth/web/refresh')) return restore.promise;
    if (String(url).includes('/tour-recommendations')) {
      requests.push({ method: init?.method ?? 'GET', headers: new Headers(init?.headers), path: String(url) });
      return response(page(init?.method === 'POST' ? {} : null));
    }
    return response(String(url).includes('categories') ? [] : page());
  }));
});
afterEach(() => { cleanup(); AuthStorage.clear(); vi.unstubAllGlobals(); });

it('waits for cookie restore while public search runs, then GETs and POSTs once with the restored token', async () => {
  render(<ExploreToursPage />);
  await act(async () => {});
  expect(requests).toHaveLength(0);
  expect(screen.queryByText(/Không thể cập nhật gợi ý tour/)).toBeNull();
  expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/tours'), expect.anything());
  await act(async () => { restore.resolve(response({ success: true, data: context() })); });
  await waitFor(() => expect(requests.map(r => r.method)).toEqual(['GET', 'POST']));
  expect(requests.every(r => r.headers.get('Authorization') === 'Bearer restored-token')).toBe(true);
});

it.each(['Guest', 'TourOperator', 'Administrator'])('does not request personalized tours for %s', async role => {
  render(<ExploreToursPage />);
  await act(async () => { restore.resolve(role === 'Guest' ? response({}, 401) : response({ success: true, data: context(1, role) })); });
  await act(async () => {});
  expect(requests).toHaveLength(0);
  expect(screen.queryByText(/Không thể cập nhật gợi ý tour/)).toBeNull();
});

it('does not reload when a token is replaced for the same Traveler', async () => {
  AuthStorage.accept(context(), false);
  render(<ExploreToursPage />);
  await waitFor(() => expect(requests).toHaveLength(2));
  await act(async () => { AuthStorage.accept(context(1, 'Traveler', 'rotated-token'), false); });
  expect(requests).toHaveLength(2);
});

it.each(['logout', 'account', 'unmount'])('ignores delayed refresh response after %s', async action => {
  const old = deferred<Response>();
  const original = fetch;
  let oldSignal: AbortSignal | null | undefined;
  vi.stubGlobal('fetch', vi.fn((url: string, init?: RequestInit) => {
    if (String(url).includes('/tour-recommendations') && init?.method === 'POST' && new Headers(init?.headers).get('Authorization') === 'Bearer restored-token') {
      oldSignal = init?.signal;
      return old.promise;
    }
    return original(url, init);
  }));
  AuthStorage.accept(context(), false);
  const view = render(<ExploreToursPage />);
  await waitFor(() => expect(oldSignal).toBeDefined());
  await act(async () => {
    if (action === 'logout') AuthStorage.clear();
    if (action === 'account') AuthStorage.accept(context(2, 'Traveler', 'second-token'), false);
    if (action === 'unmount') view.unmount();
  });
  expect(oldSignal?.aborted).toBe(true);
  const stale = { ...page(), totalCount: 99, totalPages: 5 };
  await act(async () => { old.resolve(response(stale)); });
  expect(screen.queryByText(/99 tour phù hợp/)).toBeNull();
  expect(requests.filter(r => r.headers.get('Authorization') === 'Bearer restored-token').map(r => r.method)).toEqual(['GET']);
  if (action === 'account') {
    await waitFor(() => expect(requests.filter(r => r.headers.get('Authorization') === 'Bearer second-token').map(r => r.method)).toEqual(['GET', 'POST']));
  }
  expect(screen.queryByText(/Không thể cập nhật gợi ý tour/)).toBeNull();
});
