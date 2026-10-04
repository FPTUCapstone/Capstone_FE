import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import type { TripCardDto } from '../types/tripHistory';
import { TripCard } from './TripCard';

describe('TripCard Component (TRIP-9, TRIP-10)', () => {
  it('TRIP-9: Booked-tour E-ticket CTA uses ticketId, NEVER bookingId', () => {
    const tourWithTicket: TripCardDto = {
      tripId: 'trip-demo-02',
      tripType: 'TourBooking',
      title: 'Hành Trình Di Sản Phố Cổ Hội An',
      departureDatetime: '2026-04-15T07:30:00Z',
      status: 'Completed',
      statusLabel: 'Đã hoàn thành',
      bookingId: 'bk-demo-0148',
      bookingCode: 'BK-20261015-0148',
      ticketId: 'tkt-demo-03', // Distinct ticket ID per PR #43
      isReviewed: false,
    };

    render(<TripCard trip={tourWithTicket} />);

    const ticketLink = screen.getByRole('link', { name: /Xem vé điện tử/i });
    expect(ticketLink).toBeDefined();

    // Verify href strictly contains the ticketId, NEVER the bookingId
    expect(ticketLink.getAttribute('href')).toBe('/bookings/tkt-demo-03/ticket');
    expect(ticketLink.getAttribute('href')).not.toContain('bk-demo-0148');
  });

  it('TRIP-10: Missing ticketId does not generate a ticket route or CTA button', () => {
    const tourWithoutTicket: TripCardDto = {
      tripId: 'trip-demo-04',
      tripType: 'TourBooking',
      title: 'Đà Nẵng City Tour',
      departureDatetime: '2026-07-15T08:00:00Z',
      status: 'Completed',
      statusLabel: 'Đã hoàn thành',
      bookingId: 'bk-demo-0442',
      ticketId: undefined, // Truthfully absent
      isReviewed: false,
    };

    render(<TripCard trip={tourWithoutTicket} />);

    // Link "Xem vé điện tử" must NOT be rendered
    const ticketLink = screen.queryByRole('link', { name: /Xem vé điện tử/i });
    expect(ticketLink).toBeNull();
  });

  it('Renders [Xem lại lộ trình] CTA for self-planned itinerary', () => {
    const itineraryTrip: TripCardDto = {
      tripId: 'trip-demo-01',
      tripType: 'SelfPlannedItinerary',
      title: 'Hành trình Đà Nẵng - Hội An',
      departureDatetime: '2026-05-24T08:00:00Z',
      status: 'Completed',
      statusLabel: 'Đã hoàn thành',
      itineraryId: 101,
      stopCount: 4,
      distanceKm: 28,
      isReviewed: false,
    };

    render(<TripCard trip={itineraryTrip} />);

    const itineraryLink = screen.getByRole('link', { name: /Xem lại lộ trình/i });
    expect(itineraryLink.getAttribute('href')).toBe('/itinerary/101');
  });

  it('Renders [Viết đánh giá] CTA when completed trip is unreviewed', () => {
    const unreviewedTrip: TripCardDto = {
      tripId: 'trip-demo-01',
      tripType: 'SelfPlannedItinerary',
      title: 'Hành trình Đà Nẵng',
      departureDatetime: '2026-05-24T08:00:00Z',
      status: 'Completed',
      statusLabel: 'Đã hoàn thành',
      isReviewed: false,
    };

    render(<TripCard trip={unreviewedTrip} />);

    const reviewLink = screen.getByRole('link', { name: /Viết đánh giá/i });
    expect(reviewLink.getAttribute('href')).toBe('/account/trips/trip-demo-01/review');
  });
});
