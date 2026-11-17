import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ServiceBookingRequestsView } from '../components/w103/ServiceBookingRequestsView';
import { ProviderBookingService } from '../services/providerBookingService';
import { testBooking } from './testBooking';
const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }), useSearchParams: () => new URLSearchParams() }));
vi.mock('../services/providerBookingService', () => ({ ProviderBookingService: { fetchBookingRequests: vi.fn() } }));
beforeEach(() => { vi.clearAllMocks(); vi.mocked(ProviderBookingService.fetchBookingRequests).mockResolvedValue({ items: [testBooking], totalCount: 41, page: 1, pageSize: 20 }); });
describe('UC78 applied request filters', () => {
  it('waits for Search and preserves applied filters when paging', async () => {
    render(<ServiceBookingRequestsView />);
    await screen.findAllByText('SR-9');
    const search = screen.getByRole('searchbox');
    fireEvent.change(search, { target: { value: 'An' } });
    expect(ProviderBookingService.fetchBookingRequests).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: /^Search$/i }));
    await waitFor(() => expect(ProviderBookingService.fetchBookingRequests).toHaveBeenLastCalledWith(expect.objectContaining({ keyword: 'An', page: 1 })));
    fireEvent.change(search, { target: { value: 'unapplied' } });
    fireEvent.click(await screen.findByRole('button', { name: /Next page/i }));
    await waitFor(() => expect(ProviderBookingService.fetchBookingRequests).toHaveBeenLastCalledWith(expect.objectContaining({ keyword: 'An', page: 2 })));
  });
  it('renders retrieval errors and allows retry', async () => {
    vi.mocked(ProviderBookingService.fetchBookingRequests).mockRejectedValueOnce(new Error('offline'));
    render(<ServiceBookingRequestsView />);
    await screen.findByRole('alert');
    fireEvent.click(screen.getByRole('button', { name: /Retry/i }));
    await screen.findAllByText('SR-9');
  });
});
