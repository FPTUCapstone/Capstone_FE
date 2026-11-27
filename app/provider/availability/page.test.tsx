import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ProviderAvailabilityPage from './page';

describe('Provider availability', () => {
  afterEach(() => vi.restoreAllMocks());

  it('publishes the chosen Vietnam time and displays remaining capacity', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(Response.json([{ id: 3, name: 'Double room' }]))
      .mockResolvedValueOnce(Response.json([]))
      .mockResolvedValueOnce(Response.json({
        startsAt: '2026-11-27T07:00:00Z', quantity: 2, remainingQuantity: 2,
      }));

    render(<ProviderAvailabilityPage />);
    await screen.findByRole('option', { name: 'Double room' });
    const publish = screen.getByRole('button', { name: 'Công bố lịch' });
    await waitFor(() => expect((publish as HTMLButtonElement).disabled).toBe(false));
    fireEvent.change(screen.getByLabelText('Ngày giờ (Việt Nam)'), { target: { value: '2026-11-27T14:00' } });
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '2' } });
    fireEvent.click(publish);

    expect(await screen.findByText('Đã lưu lịch.')).toBeDefined();
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/provider/commercial-services/3/availability/2026-11-27T07%3A00%3A00.000Z',
      expect.objectContaining({ method: 'PUT', body: '{"quantity":2}' }),
    );
    expect(screen.getByRole('table')).toBeDefined();
  });
});
