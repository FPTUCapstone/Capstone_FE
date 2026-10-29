import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getDevTourCategories, searchDevTours } from '../services/devTourApi';
import type { DevPagedToursResponseDto } from '../types/devTour';
import { DevExploreToursPage } from './DevExploreToursPage';

const push = vi.fn();
const { publicNavigation } = vi.hoisted(() => ({ publicNavigation: vi.fn(() => null) }));
let query = '';
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }), useSearchParams: () => new URLSearchParams(query) }));
vi.mock('@/components/navigation/PublicNavigation', () => ({ PublicNavigation: publicNavigation }));
vi.mock('../services/devTourApi', () => ({ getDevTourCategories: vi.fn(), searchDevTours: vi.fn() }));

const response: DevPagedToursResponseDto = {
  page: 1, pageSize: 20, totalCount: 1, totalPages: 1, asOfUtc: '2026-10-17T00:00:00Z',
  items: [{ tourId: '9007199254740995', title: 'Quiet beach', destinations: ['Hoi An'], operatorName: 'Operator', durationDays: 2, basePrice: 500000, currency: 'VND', representativeScheduleId: null, departureAtUtc: null, availabilityStatus: 'available', remainingSlots: 2, thumbnailUrl: null, aggregateRating: null }],
};

describe('development tour discovery', () => {
  beforeEach(() => {
    query = '';
    vi.resetAllMocks();
    vi.mocked(searchDevTours).mockResolvedValue(response);
    vi.mocked(getDevTourCategories).mockResolvedValue([{ categoryId: 2, code: 'SEA', name: 'Sea experiences' }]);
  });

  it('does not mount a second public navigation inside the persistent root layout', async () => {
    render(<DevExploreToursPage />);
    await screen.findByText('Quiet beach');
    expect(publicNavigation).not.toHaveBeenCalled();
  });

  it('renders real category codes and complete V2 controls; applying filters resets page', async () => {
    query = 'page=3&mode=semantic';
    render(<DevExploreToursPage />);
    await screen.findByText('Quiet beach');
    expect(screen.getByText('Not yet rated')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('What experience are you looking for?'), { target: { value: 'quiet sea' } });
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'SEA' } });
    fireEvent.change(screen.getByLabelText('Search mode'), { target: { value: 'hybrid' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search tours' }));
    expect(push).toHaveBeenCalledWith('/tours?keyword=quiet+sea&category=SEA&page=1&pageSize=20&mode=hybrid');
    expect(screen.getByLabelText('End date')).toBeTruthy();
    expect(screen.getByLabelText('Duration (days)')).toBeTruthy();
    expect(screen.getByLabelText('Minimum rating')).toBeTruthy();
    expect(screen.queryByLabelText('Results per page')).toBeNull();
  });

  it('clear filters preserves keyword and mode while restoring the approved defaults', async () => {
    query = 'keyword=quiet+sea&destination=Hoi+An&startDate=2027-01-02&endDate=2027-01-05&minPrice=100&maxPrice=500&durationDays=3&category=SEA&minimumRating=4&sort=priceDesc&mode=semantic&page=3&pageSize=99';
    render(<DevExploreToursPage />);
    await screen.findByText('Quiet beach');
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(push).toHaveBeenLastCalledWith('/tours?keyword=quiet+sea&sort=relevance&page=1&pageSize=20&mode=semantic');
  });

  it('validates copied invalid URL and never requests search data', async () => {
    query = 'startDate=2027-02-30';
    render(<DevExploreToursPage />);
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Enter valid calendar dates.');
    expect(searchDevTours).not.toHaveBeenCalled();
  });

  it('retains successful data and displayed criteria while a different query fails, then retries that query', async () => {
    query = 'keyword=beach&mode=lexical&page=2&pageSize=1';
    vi.mocked(searchDevTours).mockResolvedValueOnce({ ...response, page: 2, pageSize: 1, totalCount: 3, totalPages: 3 });
    const { rerender } = render(<DevExploreToursPage />);
    await screen.findByText('Quiet beach');
    vi.mocked(searchDevTours).mockRejectedValue(new Error('Vectors are missing or stale. No partial results were returned.'));
    query = 'keyword=mountain&mode=semantic';
    rerender(<DevExploreToursPage />);
    expect(screen.getByText('Quiet beach')).toBeTruthy();
    await screen.findByText(/Vectors are missing or stale/);
    expect(screen.getByText(/MSG127/)).toBeTruthy();
    const criteria = screen.getByRole('region', { name: 'Displayed search criteria' });
    expect(within(criteria).getByText('beach')).toBeTruthy();
    expect(within(criteria).getByText('lexical')).toBeTruthy();
    expect(within(criteria).queryByText('mountain')).toBeNull();
    expect(screen.getByText('Showing 1 of 3 tours')).toBeTruthy();
    expect(screen.getByRole('link', { name: /View details/ }).getAttribute('href')).toContain('keyword=beach');
    fireEvent.click(screen.getByRole('button', { name: /^Page 3$/ }));
    expect(push).toHaveBeenLastCalledWith('/tours?keyword=beach&page=3&pageSize=20&mode=lexical');
    vi.mocked(searchDevTours).mockResolvedValueOnce({ ...response, items: [], totalCount: 0, totalPages: 0 });
    fireEvent.click(screen.getByRole('button', { name: 'Retry search' }));
    await screen.findByText('No matching tours.');
    expect(vi.mocked(searchDevTours).mock.calls.at(-1)?.[0].get('keyword')).toBe('mountain');
    expect(screen.queryByText('Quiet beach')).toBeNull();
    expect(within(screen.getByRole('region', { name: 'Displayed search criteria' })).getByText('mountain')).toBeTruthy();
  });

  it('keeps the snapshot during pending work and ignores both late success and late rejection', async () => {
    const { rerender } = render(<DevExploreToursPage />);
    await screen.findByText('Quiet beach');
    let resolveOld: (value: DevPagedToursResponseDto) => void = () => {};
    vi.mocked(searchDevTours).mockImplementationOnce(() => new Promise((resolve) => { resolveOld = resolve; }));
    query = 'keyword=older';
    rerender(<DevExploreToursPage />);
    const oldSignal = vi.mocked(searchDevTours).mock.calls.at(-1)?.[1];
    expect(screen.getByText('Quiet beach')).toBeTruthy();
    expect(screen.getByText('Searching tours…')).toBeTruthy();
    vi.mocked(searchDevTours).mockRejectedValueOnce(new Error('Current request failed'));
    query = 'keyword=current';
    rerender(<DevExploreToursPage />);
    await screen.findByText('Current request failed');
    expect(oldSignal?.aborted).toBe(true);
    await act(async () => resolveOld({ ...response, items: [{ ...response.items[0], title: 'Late result' }] }));
    expect(screen.queryByText('Late result')).toBeNull();
    expect(screen.getByText('Current request failed')).toBeTruthy();

    let rejectOld: (error: Error) => void = () => {};
    vi.mocked(searchDevTours).mockImplementationOnce(() => new Promise((_, reject) => { rejectOld = reject; }));
    query = 'keyword=obsolete-failure';
    rerender(<DevExploreToursPage />);
    vi.mocked(searchDevTours).mockResolvedValueOnce({ ...response, items: [{ ...response.items[0], title: 'Newest result' }] });
    query = 'keyword=newest';
    rerender(<DevExploreToursPage />);
    await screen.findByText('Newest result');
    await act(async () => rejectOld(new Error('Obsolete failure')));
    expect(screen.queryByText('Obsolete failure')).toBeNull();
    expect(screen.getByText('Newest result')).toBeTruthy();
  });

  it('retains data on invalid navigation and restores criteria when navigating back or resetting', async () => {
    query = 'keyword=beach&mode=hybrid';
    const { rerender } = render(<DevExploreToursPage />);
    await screen.findByText('Quiet beach');
    const calls = vi.mocked(searchDevTours).mock.calls.length;
    query = 'startDate=2027-02-30';
    rerender(<DevExploreToursPage />);
    expect(screen.getByText('Enter valid calendar dates.')).toBeTruthy();
    expect(screen.getByText('Quiet beach')).toBeTruthy();
    expect(vi.mocked(searchDevTours).mock.calls.length).toBe(calls);
    query = 'keyword=beach&mode=hybrid';
    rerender(<DevExploreToursPage />);
    await waitFor(() => expect(vi.mocked(searchDevTours).mock.calls.length).toBe(calls + 1));
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(push).toHaveBeenLastCalledWith('/tours?keyword=beach&sort=relevance&page=1&pageSize=20&mode=hybrid');
    query = '';
    rerender(<DevExploreToursPage />);
    await waitFor(() => expect(within(screen.getByRole('region', { name: 'Displayed search criteria' })).getByText('lexical')).toBeTruthy());
  });

  it('does not invent previous data on initial failure or treat an abort as an error', async () => {
    vi.mocked(searchDevTours).mockRejectedValueOnce(new Error('Initial failure'));
    const { rerender } = render(<DevExploreToursPage />);
    await screen.findByText('Initial failure');
    expect(screen.queryByRole('region', { name: 'Displayed search criteria' })).toBeNull();
    expect(screen.queryByText(/Showing/)).toBeNull();
    vi.mocked(searchDevTours).mockRejectedValueOnce(new DOMException('Cancelled', 'AbortError'));
    query = 'keyword=cancelled';
    rerender(<DevExploreToursPage />);
    await act(async () => {});
    expect(screen.queryByText('Cancelled')).toBeNull();
    expect(screen.queryByText('Initial failure')).toBeNull();
  });

  it('aborts obsolete requests and ignores a delayed response after URL navigation', async () => {
    let resolveOld: (value: DevPagedToursResponseDto) => void = () => {};
    vi.mocked(searchDevTours).mockImplementationOnce(() => new Promise((resolve) => { resolveOld = resolve; }));
    const { rerender } = render(<DevExploreToursPage />);
    const oldSignal = vi.mocked(searchDevTours).mock.calls[0][1];
    query = 'keyword=new';
    rerender(<DevExploreToursPage />);
    await screen.findByText('Quiet beach');
    expect(oldSignal?.aborted).toBe(true);
    resolveOld({ ...response, items: [{ ...response.items[0], title: 'Obsolete title' }] });
    await waitFor(() => expect(screen.queryByText('Obsolete title')).toBeNull());
  });

  it('shows empty and category failure states independently', async () => {
    vi.mocked(searchDevTours).mockResolvedValue({ ...response, items: [], totalCount: 0, totalPages: 0 });
    vi.mocked(getDevTourCategories).mockRejectedValue(new Error('secret internal error'));
    render(<DevExploreToursPage />);
    await screen.findByText('No matching tours.');
    expect(screen.getByText(/Categories could not be loaded/)).toBeTruthy();
    expect(screen.queryByText('secret internal error')).toBeNull();
  });
});
