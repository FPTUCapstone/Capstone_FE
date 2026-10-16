import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getDevTourCategories, searchDevTours } from '../services/devTourApi';
import type { DevPagedToursResponseDto } from '../types/devTour';
import { DevExploreToursPage } from './DevExploreToursPage';

const push = vi.fn();
let query = '';
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }), useSearchParams: () => new URLSearchParams(query) }));
vi.mock('@/components/navigation/PublicNavigation', () => ({ PublicNavigation: () => <nav aria-label="Public navigation" /> }));
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
  });

  it('validates copied invalid URL and never requests search data', async () => {
    query = 'startDate=2027-02-30';
    render(<DevExploreToursPage />);
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Enter valid calendar dates.');
    expect(searchDevTours).not.toHaveBeenCalled();
  });

  it('shows explicit dependency failure without previous results or a false total count', async () => {
    const { rerender } = render(<DevExploreToursPage />);
    await screen.findByText('Quiet beach');
    vi.mocked(searchDevTours).mockRejectedValue(new Error('Vectors are missing or stale. No partial results were returned.'));
    query = 'keyword=mountain&mode=semantic';
    rerender(<DevExploreToursPage />);
    expect(screen.queryByText('Quiet beach')).toBeNull();
    await screen.findByText(/Vectors are missing or stale/);
    expect(screen.queryByText(/1 tour/)).toBeNull();
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
