import { describe, expect, it } from 'vitest';

import { ROUTES } from '../routes';

describe('UC-29 ticket routes', () => {
  it('opens a Trip History ticket by ticket id in the account area', () => {
    expect(ROUTES.account.ticket('77')).toBe('/account/tickets/77');
  });

  it('opens the ticket of a booking by booking id', () => {
    expect(ROUTES.bookingTicket('456')).toBe('/bookings/456/ticket');
  });

  it('encodes the id', () => {
    expect(ROUTES.account.ticket('a/b')).toBe('/account/tickets/a%2Fb');
  });
});
