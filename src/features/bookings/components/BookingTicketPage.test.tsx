import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { replaceMock, session } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  session: { status: 'unauthenticated' as string, context: null as null | { role: string } },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock, push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('@/features/auth/session/useWebSession', () => ({ useWebSession: () => session }));
vi.mock('./BookingTicketView', () => ({
  BookingTicketView: (props: { ticketKey: object; returnPath: string }) => (
    <div data-testid="view" data-key={JSON.stringify(props.ticketKey)} data-return={props.returnPath} />
  ),
}));

import { BookingTicketPage } from './BookingTicketPage';

beforeEach(() => {
  replaceMock.mockReset();
  session.status = 'unauthenticated';
  session.context = null;
});

describe('BookingTicketPage', () => {
  it.each([
    [{ ticketId: '77' }, '/account/tickets/77'],
    [{ bookingId: '456' }, '/bookings/456/ticket'],
  ])('sends a signed-out visitor of %j to sign-in and back to %s', (key, path) => {
    render(<BookingTicketPage ticketKey={key} />);

    expect(replaceMock).toHaveBeenCalledWith(`/sign-in?returnUrl=${encodeURIComponent(path)}`);
  });

  it.each([
    [{ ticketId: '77' }, '/account/tickets/77'],
    [{ bookingId: '456' }, '/bookings/456/ticket'],
  ])('renders the ticket view for a Traveler with %j', (key, path) => {
    session.status = 'authenticated';
    session.context = { role: 'Traveler' };

    render(<BookingTicketPage ticketKey={key} />);

    const view = screen.getByTestId('view');
    expect(JSON.parse(view.getAttribute('data-key') ?? '')).toEqual(key);
    expect(view.getAttribute('data-return')).toBe(path);
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it('keeps the role guard for other roles', () => {
    session.status = 'authenticated';
    session.context = { role: 'TourOperator' };

    render(<BookingTicketPage ticketKey={{ ticketId: '77' }} />);

    expect(screen.queryByTestId('view')).toBeNull();
    expect(screen.getByText(/không thuộc phạm vi Vé điện tử Du khách/)).toBeTruthy();
  });
});
