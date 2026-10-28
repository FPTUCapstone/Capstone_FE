import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { tripReviewEn } from '../resources/en';
import type { BookingTripItem, ItineraryTripItem, TripListItem } from '../types/tripHistoryContract';
import { TripCard } from './TripCard';

const booking = (over: Partial<BookingTripItem> = {}): BookingTripItem => ({
  kind: 'commerceBooking',
  id: '123',
  tripType: 'TourBooking',
  tab: 'Completed',
  title: 'Hoi An Lantern Tour',
  departureAtUtc: '2026-10-01T02:00:00+00:00',
  status: 'Completed',
  bookingCode: 'TM-000123',
  participantCount: 3,
  totalAmount: 4_500_000,
  reviewableRecord: { kind: 'commerceBooking', id: '123' },
  actions: { canReview: false, canViewETicket: false, ticketId: null, canViewRefund: false },
  review: { exists: false },
  ...over,
});

const itinerary = (over: Partial<ItineraryTripItem> = {}): ItineraryTripItem => ({
  kind: 'itinerary',
  id: '45',
  tripType: 'SelfPlannedItinerary',
  tab: 'Completed',
  title: 'Da Nang 2 days',
  departureAtUtc: '2026-09-20T01:00:00+00:00',
  status: 'Completed',
  stopCount: 6,
  visitedCount: 5,
  reviewableRecord: null,
  actions: { canReview: false, canViewETicket: false, ticketId: null, canViewRefund: false },
  review: null,
  ...over,
});

function renderCard(item: TripListItem, onOpenDetail = vi.fn(), isDemo = false) {
  render(<TripCard item={item} onOpenDetail={onOpenDetail} isDemo={isDemo} />);
  return onOpenDetail;
}

const link = (name: string) => screen.queryByRole('link', { name: new RegExp(name, 'i') });
const button = (name: string) => screen.queryByRole('button', { name: new RegExp(name, 'i') });

describe('TripCard — content', () => {
  it('shows only what the booking contract provides', () => {
    renderCard(booking());

    expect(screen.getByRole('heading', { name: 'Hoi An Lantern Tour' })).toBeDefined();
    expect(screen.getByText(tripReviewEn.tripHistory.card.departureDate('01/10/2026'))).toBeDefined();
    expect(screen.getByText(tripReviewEn.tripHistory.card.bookingCode('TM-000123'))).toBeDefined();
    expect(screen.getByText(tripReviewEn.tripHistory.card.participantCount(3))).toBeDefined();
    expect(screen.getByText(/4\.500\.000/)).toBeDefined();
    expect(screen.getByText(tripReviewEn.tripHistory.statusLabels.Completed)).toBeDefined();
  });

  it('does not render data the backend does not return', () => {
    const { container } = render(<TripCard item={booking()} onOpenDetail={vi.fn()} />);

    expect(container.textContent).not.toMatch(/km traveled|Paid via|Participants:|Weather reroute|Operator/i);
    expect(container.querySelector('img')).toBeNull();
    expect(link('Book Again')).toBeNull();
  });

  it('shows an itinerary with its stops and how many were visited', () => {
    renderCard(itinerary());

    expect(screen.getByRole('heading', { name: 'Da Nang 2 days' })).toBeDefined();
    expect(screen.getByText(tripReviewEn.tripHistory.card.departureDate('20/09/2026'))).toBeDefined();
    expect(screen.getByText(tripReviewEn.tripHistory.card.stopsCount(6))).toBeDefined();
    expect(screen.getByText(tripReviewEn.tripHistory.card.visitedOf(5, 6))).toBeDefined();
  });

  it('omits the visited count when the backend does not send one', () => {
    const { visitedCount: _unused, ...rest } = itinerary({ tab: 'Upcoming', status: 'Active' });
    void _unused;
    renderCard(rest as ItineraryTripItem);

    expect(screen.getByText(tripReviewEn.tripHistory.card.stopsCount(6))).toBeDefined();
    expect(screen.queryByText(/Visited/)).toBeNull();
    expect(screen.getByText(tripReviewEn.tripHistory.statusLabels.Active)).toBeDefined();
  });

  it('shows the Vietnam calendar day of the UTC departure instant', () => {
    renderCard(booking({ departureAtUtc: '2026-10-20T17:00:00+00:00' }));

    expect(screen.getByText(tripReviewEn.tripHistory.card.departureDate('21/10/2026'))).toBeDefined();
  });

  it.each([
    ['PendingPayment', tripReviewEn.tripHistory.statusLabels.PendingPayment],
    ['Confirmed', tripReviewEn.tripHistory.statusLabels.Confirmed],
    ['Cancelled', tripReviewEn.tripHistory.statusLabels.Cancelled],
    ['Expired', tripReviewEn.tripHistory.statusLabels.Expired],
  ])('labels the %s status readably', (status, label) => {
    renderCard(booking({ status, tab: status === 'Confirmed' || status === 'PendingPayment' ? 'Upcoming' : 'Cancelled' }));

    expect(screen.getByText(label)).toBeDefined();
  });

  it('falls back to the raw status for a value it does not know', () => {
    renderCard(booking({ status: 'Frozen' }));

    expect(screen.getByText('Frozen')).toBeDefined();
  });
});

describe('TripCard — review actions follow their own conditions', () => {
  const reviewHref = '/account/reviews/commerceBooking/123';

  it('Write review appears when actions.canReview is true and links to the canonical review page', () => {
    renderCard(booking({ actions: { canReview: true, canViewETicket: false, ticketId: null, canViewRefund: false } }));

    expect(link('Write Review')?.getAttribute('href')).toBe(reviewHref);
  });

  it('Write review is absent when actions.canReview is false', () => {
    renderCard(booking());

    expect(link('Write Review')).toBeNull();
  });

  it('View review appears when review.exists is true, with the rating, and links to the same page', () => {
    renderCard(
      booking({
        actions: { canReview: false, canViewETicket: false, ticketId: null, canViewRefund: false },
        review: { exists: true, reviewId: '41', rating: 4 },
      }),
    );

    expect(link('View Review')?.getAttribute('href')).toBe(reviewHref);
    expect(screen.getByText('★ 4.0')).toBeDefined();
    expect(link('Write Review')).toBeNull();
  });

  it('View review is absent when review.exists is false', () => {
    renderCard(booking({ review: { exists: false } }));

    expect(link('View Review')).toBeNull();
    expect(screen.queryByText(/★/)).toBeNull();
  });

  it('each button follows its own flag, even if the flags disagree', () => {
    renderCard(
      booking({
        actions: { canReview: true, canViewETicket: false, ticketId: null, canViewRefund: false },
        review: { exists: true, reviewId: '41', rating: 5 },
      }),
    );

    expect(link('Write Review')).not.toBeNull();
    expect(link('View Review')).not.toBeNull();
  });

  it('builds the review link from reviewableRecord, not from the item id', () => {
    renderCard(
      booking({
        id: '123',
        reviewableRecord: { kind: 'commerceBooking', id: '999' },
        actions: { canReview: true, canViewETicket: false, ticketId: null, canViewRefund: false },
      }),
    );

    expect(link('Write Review')?.getAttribute('href')).toBe('/account/reviews/commerceBooking/999');
  });
});

describe('TripCard — e-ticket, refund and details actions', () => {
  it('E-ticket links to the ticket id, never the booking id', () => {
    renderCard(booking({ actions: { canReview: false, canViewETicket: true, ticketId: '77', canViewRefund: false } }));

    expect(link('View E-Ticket')?.getAttribute('href')).toBe('/account/tickets/77');
  });

  it('E-ticket is absent when canViewETicket is false, even if a ticket id is present', () => {
    renderCard(booking({ actions: { canReview: false, canViewETicket: false, ticketId: '77', canViewRefund: false } }));

    expect(link('View E-Ticket')).toBeNull();
  });

  it('E-ticket is absent when there is no ticket id to link to', () => {
    renderCard(booking({ actions: { canReview: false, canViewETicket: true, ticketId: null, canViewRefund: false } }));

    expect(link('View E-Ticket')).toBeNull();
  });

  const refundable = () =>
    booking({
      tab: 'Cancelled',
      status: 'Cancelled',
      actions: { canReview: false, canViewETicket: false, ticketId: null, canViewRefund: true },
    });

  it('View refund links to the live refund progress of the booking', () => {
    const onOpenDetail = renderCard(refundable());

    expect(link('Refund Details')?.getAttribute('href')).toBe('/bookings/123/refund');
    expect(button('Refund Details')).toBeNull();
    expect(onOpenDetail).not.toHaveBeenCalled();
  });

  it('in demo mode View refund opens the detail dialog on the refund and never links to the API page', () => {
    const item = refundable();
    const onOpenDetail = renderCard(item, vi.fn(), true);

    expect(link('Refund Details')).toBeNull();
    fireEvent.click(button('Refund Details')!);

    expect(onOpenDetail).toHaveBeenCalledWith(item, 'refund');
  });

  it('View refund is absent when canViewRefund is false', () => {
    renderCard(booking({ tab: 'Cancelled', status: 'Cancelled' }));

    expect(button('Refund Details')).toBeNull();
  });

  it('View details is always offered and opens the dialog for that record', () => {
    const item = booking();
    const onOpenDetail = renderCard(item);

    fireEvent.click(button('View Details')!);

    expect(onOpenDetail).toHaveBeenCalledWith(item, undefined);
  });
});

describe('TripCard — itinerary actions', () => {
  it('links to the itinerary page and offers details', () => {
    const item = itinerary();
    const onOpenDetail = renderCard(item);

    expect(link('View Itinerary')?.getAttribute('href')).toBe('/itinerary/45');
    fireEvent.click(button('View Details')!);
    expect(onOpenDetail).toHaveBeenCalledWith(item, undefined);
  });

  it('never offers review, e-ticket or refund for an itinerary', () => {
    renderCard(itinerary());

    expect(link('Write Review')).toBeNull();
    expect(link('View Review')).toBeNull();
    expect(link('View E-Ticket')).toBeNull();
    expect(button('Refund Details')).toBeNull();
  });
});

describe('TripCard — accessibility', () => {
  it('every link and button has an accessible name', () => {
    renderCard(
      booking({
        actions: { canReview: true, canViewETicket: true, ticketId: '77', canViewRefund: true },
        review: { exists: true, reviewId: '41', rating: 5 },
      }),
    );

    const interactive = [...screen.getAllByRole('link'), ...screen.getAllByRole('button')];
    expect(interactive.length).toBeGreaterThanOrEqual(5);
    for (const element of interactive) {
      expect((element.textContent ?? '').trim() || element.getAttribute('aria-label')).toBeTruthy();
    }
  });

  it('is an article labelled by its title', () => {
    renderCard(booking());

    expect(screen.getByRole('article', { name: 'Hoi An Lantern Tour' })).toBeDefined();
  });
});
