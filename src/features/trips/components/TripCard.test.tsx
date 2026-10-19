import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { tripReviewEn } from '../resources/en';
import type { TripCardDto } from '../types/tripHistory';
import { TripCard } from './TripCard';

describe('TripCard Component (TRIP-9, TRIP-10)', () => {
  it('TRIP-9: Booked-tour E-ticket CTA uses ticketId, NEVER bookingId', () => {
    const tourWithTicket: TripCardDto = {
      tripId: 'trip-demo-02',
      tripType: 'TourBooking',
      title: 'Hoi An Heritage Tour',
      departureDatetime: '2026-04-15T07:30:00Z',
      status: 'Completed',
      statusLabel: 'Completed',
      bookingId: 'bk-demo-0148',
      bookingCode: 'BK-20261015-0148',
      ticketId: 'tkt-demo-03', // Distinct ticket ID per PR #43
      isReviewed: false,
    };

    render(<TripCard trip={tourWithTicket} />);

    const ticketLink = screen.getByRole('link', {
      name: new RegExp(tripReviewEn.actions.viewETicket, 'i'),
    });
    expect(ticketLink).toBeDefined();

    // Verify href strictly contains the ticketId, NEVER the bookingId
    expect(ticketLink.getAttribute('href')).toBe('/bookings/tkt-demo-03/ticket');
    expect(ticketLink.getAttribute('href')).not.toContain('bk-demo-0148');
  });

  it('TRIP-10: Missing ticketId does not generate a ticket route or CTA button', () => {
    const tourWithoutTicket: TripCardDto = {
      tripId: 'trip-demo-04',
      tripType: 'TourBooking',
      title: 'Da Nang City Tour',
      departureDatetime: '2026-07-15T08:00:00Z',
      status: 'Completed',
      statusLabel: 'Completed',
      bookingId: 'bk-demo-0442',
      ticketId: undefined, // Truthfully absent
      isReviewed: false,
    };

    render(<TripCard trip={tourWithoutTicket} />);

    // Link "View E-Ticket" must NOT be rendered
    const ticketLink = screen.queryByRole('link', {
      name: new RegExp(tripReviewEn.actions.viewETicket, 'i'),
    });
    expect(ticketLink).toBeNull();
  });

  it('Renders [View Itinerary] CTA for self-planned itinerary', () => {
    const itineraryTrip: TripCardDto = {
      tripId: 'trip-demo-01',
      tripType: 'SelfPlannedItinerary',
      title: 'Da Nang - Hoi An Itinerary',
      departureDatetime: '2026-05-24T08:00:00Z',
      status: 'Completed',
      statusLabel: 'Completed',
      itineraryId: 101,
      stopCount: 4,
      distanceKm: 28,
      isReviewed: false,
    };

    render(<TripCard trip={itineraryTrip} />);

    const itineraryLink = screen.getByRole('link', {
      name: new RegExp(tripReviewEn.actions.viewItinerary, 'i'),
    });
    expect(itineraryLink.getAttribute('href')).toBe('/itinerary/101');
  });

  it('Renders [Write Review] CTA when completed trip is unreviewed', () => {
    const unreviewedTrip: TripCardDto = {
      tripId: 'trip-demo-01',
      tripType: 'SelfPlannedItinerary',
      title: 'Da Nang Itinerary',
      departureDatetime: '2026-05-24T08:00:00Z',
      status: 'Completed',
      statusLabel: 'Completed',
      isReviewed: false,
    };

    render(<TripCard trip={unreviewedTrip} />);

    const reviewLink = screen.getByRole('link', {
      name: new RegExp(tripReviewEn.actions.writeReview, 'i'),
    });
    expect(reviewLink.getAttribute('href')).toBe('/account/trips/trip-demo-01/review');
  });

  it('Does not render stray "0" when memberCount is 0 or undefined', () => {
    const tripWithZeroMembers: TripCardDto = {
      tripId: 'trip-demo-zero',
      tripType: 'TourBooking',
      title: 'Walking Tour',
      departureDatetime: '2026-05-24T08:00:00Z',
      status: 'Upcoming',
      statusLabel: 'Upcoming',
      memberCount: 0,
      isReviewed: false,
    };

    const { container } = render(<TripCard trip={tripWithZeroMembers} />);
    expect(container.textContent).not.toContain('0 members');
  });

  describe('Refund modal accessibility & focus trap', () => {
    const cancelledTripWithRefund: TripCardDto = {
      tripId: 'trip-demo-refund',
      tripType: 'TourBooking',
      title: 'Cancelled Refunded Tour',
      departureDatetime: '2026-05-24T08:00:00Z',
      status: 'Cancelled',
      statusLabel: 'Cancelled',
      refundStatus: '100% Refunded',
      refundAmount: 500000,
      refundChannel: 'E-Wallet',
      isReviewed: false,
    };

    it('opens refund modal, establishes initial focus on close button, traps focus, and closes via Escape', () => {
      render(<TripCard trip={cancelledTripWithRefund} />);

      const triggerBtn = screen.getByRole('button', {
        name: new RegExp(tripReviewEn.actions.refundDetails, 'i'),
      });
      triggerBtn.focus();
      expect(document.activeElement).toBe(triggerBtn);

      fireEvent.click(triggerBtn);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeDefined();
      expect(dialog.getAttribute('aria-modal')).toBe('true');
      expect(dialog.getAttribute('aria-labelledby')).toBe('refund-modal-title');
      expect(
        screen.getByText(tripReviewEn.dialogs.refundDetails.title).id
      ).toBe('refund-modal-title');

      const closeBtn = screen.getByRole('button', {
        name: new RegExp(tripReviewEn.actions.close, 'i'),
      });
      // Initial focus placed inside modal onto close button
      expect(document.activeElement).toBe(closeBtn);

      // Focus trap: Tab wraps and stays on close button
      fireEvent.keyDown(window, { key: 'Tab' });
      expect(document.activeElement).toBe(closeBtn);

      // Focus trap: Shift+Tab wraps and stays on close button
      fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });
      expect(document.activeElement).toBe(closeBtn);

      // Escape key closes modal and restores focus to original trigger
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(document.activeElement).toBe(triggerBtn);
    });

    it('closing modal via Close button restores focus to trigger button', () => {
      render(<TripCard trip={cancelledTripWithRefund} />);

      const triggerBtn = screen.getByRole('button', {
        name: new RegExp(tripReviewEn.actions.refundDetails, 'i'),
      });
      triggerBtn.focus();
      fireEvent.click(triggerBtn);

      const closeBtn = screen.getByRole('button', {
        name: new RegExp(tripReviewEn.actions.close, 'i'),
      });
      expect(document.activeElement).toBe(closeBtn);

      fireEvent.click(closeBtn);
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(document.activeElement).toBe(triggerBtn);
    });
  });
});
