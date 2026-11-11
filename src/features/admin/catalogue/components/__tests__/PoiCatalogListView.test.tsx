import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { loadPoiManagementMock } = vi.hoisted(() => ({ loadPoiManagementMock: vi.fn() }));

vi.mock('../../services/poi-management-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/poi-management-api')>();
  return { ...actual, loadPoiManagement: loadPoiManagementMock };
});

import { PoiManagementApiError } from '../../services/poi-management-api';
import type { PoiManagementResponse } from '../../types/poi-management';
import { PoiCatalogListView } from '../PoiCatalogListView';

function response(overrides: Partial<PoiManagementResponse> = {}): PoiManagementResponse {
  return {
    page: 1,
    pageSize: 20,
    totalCount: 2,
    totalPages: 1,
    metadata: {
      categories: [
        { id: 7, name: 'Attraction' },
        { id: 8, name: 'Empty category' },
      ],
    },
    items: [
      {
        id: '9007199254740993',
        name: 'Marble Mountains',
        categoryId: 7,
        categoryName: 'Attraction',
        address: null,
        latitude: 16.003,
        longitude: 108.264,
        status: 'Active',
        openingHours: [],
      },
      {
        id: '9223372036854775807',
        name: 'Historic Museum',
        categoryId: 7,
        categoryName: 'Attraction',
        address: 'Hai Chau, Da Nang',
        latitude: 16.067,
        longitude: 108.22,
        status: 'Inactive',
        openingHours: [
          { dayOfWeek: 0, openTime: null, closeTime: null, isClosed: true },
          { dayOfWeek: 1, openTime: '08:00:00', closeTime: '17:00:00.0000001', isClosed: false },
        ],
      },
    ],
    ...overrides,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

function fullPage(prefix: string, offset = 0) {
  const source = response().items[0];
  return Array.from({ length: 20 }, (_, index) => ({
    ...source,
    id: String(offset + index + 1),
    name: `${prefix} ${index + 1}`,
  }));
}

async function renderSuccess(value = response()) {
  loadPoiManagementMock.mockResolvedValueOnce(value);
  render(<PoiCatalogListView />);
  await screen.findByText(value.items[0]?.name ?? 'No points of interest available');
}

describe('PoiCatalogListView (Screen #16)', () => {
  beforeEach(() => {
    loadPoiManagementMock.mockReset();
  });

  it('loads once on mount and announces an honest loading state before rendering the response', async () => {
    const pending = deferred<PoiManagementResponse>();
    loadPoiManagementMock.mockReturnValueOnce(pending.promise);
    render(<PoiCatalogListView />);

    expect(screen.getByRole('status').textContent).toContain('Loading points of interest');
    expect(screen.queryByText('No points of interest available')).toBeNull();
    expect(loadPoiManagementMock).toHaveBeenCalledWith({ page: 1, pageSize: 20 }, expect.any(AbortSignal));

    pending.resolve(response());
    expect(await screen.findByText('Marble Mountains')).toBeTruthy();
  });

  it('renders exact string IDs, Active/Inactive, null address, honest hours and unchanged Create/Preview affordances', async () => {
    await renderSuccess();

    expect(screen.getByText('#9007199254740993')).toBeTruthy();
    expect(screen.getByText('#9223372036854775807')).toBeTruthy();
    expect(screen.getByText('Address not provided')).toBeTruthy();
    expect(screen.getByText('Hours not provided')).toBeTruthy();
    expect(screen.getByText(/Sunday: Closed/)).toBeTruthy();
    expect(screen.getByText(/Monday: 08:00:00–17:00:00.0000001/)).toBeTruthy();
    expect(screen.getAllByText('Active').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Inactive').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByRole('link', { name: /Create New POI/i })[0].getAttribute('href')).toBe('/admin/catalogue/points-of-interest/new');
    expect(screen.getByRole('link', { name: /Preview Marble Mountains/i }).getAttribute('href')).toBe('/pois/9007199254740993');
    expect(screen.queryByText(/Remove/i)).toBeNull();
  });

  it('uses complete metadata for category choices and fetches only when search is explicitly submitted', async () => {
    await renderSuccess();
    const category = screen.getByRole('combobox', { name: 'Category' });
    expect(within(category).getByRole('option', { name: 'Empty category' })).toBeTruthy();

    const searchbox = screen.getByRole('searchbox', { name: 'Search points of interest' });
    fireEvent.change(searchbox, {
      target: { value: '  museum  ' },
    });
    expect(loadPoiManagementMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Search' })).toBeTruthy();

    loadPoiManagementMock.mockResolvedValueOnce(response({ items: [response().items[1]], totalCount: 1 }));
    fireEvent.submit(searchbox.closest('form')!);
    await waitFor(() => expect(loadPoiManagementMock).toHaveBeenLastCalledWith(
      { page: 1, pageSize: 20, search: 'museum' }, expect.any(AbortSignal),
    ));
  });

  it('submits category and status filters at page one, resets them, and preserves submitted filters while paging', async () => {
    await renderSuccess(response({ totalCount: 40, totalPages: 2, items: fullPage('Initial') }));

    loadPoiManagementMock.mockResolvedValueOnce(response());
    fireEvent.change(screen.getByRole('combobox', { name: 'Category' }), { target: { value: '7' } });
    await waitFor(() => expect(loadPoiManagementMock).toHaveBeenLastCalledWith(
      { page: 1, pageSize: 20, categoryId: 7 }, expect.any(AbortSignal),
    ));

    loadPoiManagementMock.mockResolvedValueOnce(response({ totalCount: 40, totalPages: 2, items: fullPage('Filtered') }));
    fireEvent.change(screen.getByRole('combobox', { name: 'Status' }), { target: { value: 'Inactive' } });
    await waitFor(() => expect(loadPoiManagementMock).toHaveBeenLastCalledWith(
      { page: 1, pageSize: 20, categoryId: 7, status: 'Inactive' }, expect.any(AbortSignal),
    ));

    loadPoiManagementMock.mockResolvedValueOnce(response({
      page: 2, totalCount: 40, totalPages: 2, items: fullPage('Filtered page two', 20),
    }));
    fireEvent.click(await screen.findByRole('button', { name: 'Next page' }));
    await waitFor(() => expect(loadPoiManagementMock).toHaveBeenLastCalledWith(
      { page: 2, pageSize: 20, categoryId: 7, status: 'Inactive' }, expect.any(AbortSignal),
    ));

    loadPoiManagementMock.mockResolvedValueOnce(response());
    fireEvent.click(screen.getAllByRole('button', { name: 'Reset filters' })[0]);
    await waitFor(() => expect(loadPoiManagementMock).toHaveBeenLastCalledWith(
      { page: 1, pageSize: 20 }, expect.any(AbortSignal),
    ));
  });

  it('ignores an obsolete response after a newer filter request wins', async () => {
    await renderSuccess();
    const older = deferred<PoiManagementResponse>();
    const newer = deferred<PoiManagementResponse>();
    loadPoiManagementMock.mockReturnValueOnce(older.promise).mockReturnValueOnce(newer.promise);

    fireEvent.change(screen.getByRole('combobox', { name: 'Category' }), { target: { value: '7' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Status' }), { target: { value: 'Inactive' } });
    newer.resolve(response({ items: [{ ...response().items[1], name: 'Newest result' }], totalCount: 1 }));
    expect(await screen.findByText('Newest result')).toBeTruthy();

    older.resolve(response({ items: [{ ...response().items[0], name: 'Obsolete result' }], totalCount: 1 }));
    await waitFor(() => expect(screen.queryByText('Obsolete result')).toBeNull());
    expect(screen.getByText('Newest result')).toBeTruthy();
  });

  it('invalidates the current request synchronously before the replacement effect starts', async () => {
    await renderSuccess();
    const obsolete = deferred<PoiManagementResponse>();
    const replacement = deferred<PoiManagementResponse>();
    loadPoiManagementMock.mockReturnValueOnce(obsolete.promise).mockReturnValueOnce(replacement.promise);

    fireEvent.change(screen.getByRole('combobox', { name: 'Category' }), { target: { value: '7' } });
    const status = screen.getByRole('combobox', { name: 'Status' });
    await act(async () => {
      fireEvent.change(status, { target: { value: 'Inactive' } });
      obsolete.resolve(response({
        items: [{ ...response().items[0], name: 'Obsolete transition result' }],
        totalCount: 1,
      }));
      await Promise.resolve();
    });

    expect(screen.queryByText('Obsolete transition result')).toBeNull();
    expect(screen.getByRole('status').textContent).toContain('Loading points of interest');
  });

  it('distinguishes catalogue empty, filtered no-results and a representable page beyond the end', async () => {
    await renderSuccess(response({ totalCount: 0, totalPages: 0, items: [] }));
    expect(screen.getByText('No points of interest available')).toBeTruthy();

    loadPoiManagementMock.mockResolvedValueOnce(response({ totalCount: 0, totalPages: 0, items: [] }));
    fireEvent.change(screen.getByRole('combobox', { name: 'Status' }), { target: { value: 'Inactive' } });
    expect(await screen.findByText('No points of interest match these filters')).toBeTruthy();

    loadPoiManagementMock.mockResolvedValueOnce(response({
      totalCount: 60, totalPages: 3, items: fullPage('First page'),
    }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Reset filters' })[0]);
    await screen.findByRole('button', { name: 'Next page' });
    loadPoiManagementMock.mockResolvedValueOnce(response({
      page: 2, totalCount: 60, totalPages: 3, items: fullPage('Second page', 20),
    }));
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    await waitFor(() => expect(loadPoiManagementMock).toHaveBeenLastCalledWith(
      { page: 2, pageSize: 20 }, expect.any(AbortSignal),
    ));
    loadPoiManagementMock.mockResolvedValueOnce(response({ page: 3, totalCount: 2, totalPages: 1, items: [] }));
    fireEvent.click(await screen.findByRole('button', { name: 'Next page' }));
    expect(await screen.findByText('This page has no results')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Back to first page' })).toBeTruthy();
  });

  it('treats an empty total on page two as beyond-page rather than an empty catalogue', async () => {
    await renderSuccess(response({ totalCount: 40, totalPages: 2, items: fullPage('Initial') }));
    loadPoiManagementMock.mockResolvedValueOnce(response({
      page: 2, totalCount: 0, totalPages: 0, items: [],
    }));

    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(await screen.findByText('This page has no results')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Back to first page' })).toBeTruthy();
    expect(screen.queryByText('No points of interest available')).toBeNull();
  });

  it.each([
    [400, 'Some filters need attention. Review the highlighted fields.'],
    [401, 'Your session has expired. Sign in again to continue.'],
    [403, 'An active Administrator or Staff account is required.'],
  ])('shows the safe non-retryable %i error state instead of an empty catalogue', async (status, message) => {
    loadPoiManagementMock.mockRejectedValueOnce(new PoiManagementApiError(
      status, status === 400 ? 'POI_MANAGEMENT_INVALID_QUERY' : 'POI_MANAGEMENT_ACCESS_REQUIRED',
      status === 400 ? { search: ['Review this filter value.'] } : {},
    ));
    render(<PoiCatalogListView />);

    expect((await screen.findByRole('alert')).textContent).toContain(message);
    expect(screen.queryByText('No points of interest available')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
    if (status === 400) {
      expect(screen.getByRole('searchbox', { name: 'Search points of interest' }).getAttribute('aria-invalid')).toBe('true');
    }
  });

  it('retries an unavailable request with the same submitted filters', async () => {
    await renderSuccess();
    loadPoiManagementMock.mockRejectedValueOnce(new PoiManagementApiError(503, 'POI_MANAGEMENT_UNAVAILABLE'));
    fireEvent.change(screen.getByRole('combobox', { name: 'Status' }), { target: { value: 'Inactive' } });
    expect((await screen.findByRole('alert')).textContent).toContain('The POI list could not be loaded');

    loadPoiManagementMock.mockResolvedValueOnce(response({ items: [response().items[1]], totalCount: 1 }));
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(loadPoiManagementMock).toHaveBeenLastCalledWith(
      { page: 1, pageSize: 20, status: 'Inactive' }, expect.any(AbortSignal),
    ));
    expect(await screen.findByText('Historic Museum')).toBeTruthy();
  });

  it('exposes labelled controls, a live result announcement and no mutation affordance', async () => {
    await renderSuccess();
    expect(screen.getByRole('searchbox', { name: 'Search points of interest' })).toBeTruthy();
    expect(screen.getByRole('combobox', { name: 'Category' })).toBeTruthy();
    expect(screen.getByRole('combobox', { name: 'Status' })).toBeTruthy();
    expect(screen.getByRole('status').textContent).toContain('2 points of interest loaded');
    expect(screen.queryByRole('button', { name: /Remove/i })).toBeNull();
  });
});
