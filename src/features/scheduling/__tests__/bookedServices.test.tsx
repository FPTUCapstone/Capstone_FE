import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { isValidItineraryDetailDto } from '../types/schedulingTypes';
import { BookedServices } from '../components/BookedServices';

const service = { id: 9, serviceId: 2, poiId: 3, serviceName: 'Riverside Hotel', serviceOption: 'Deluxe', status: 'Confirmed', startAtUtc: '2026-11-15T07:00:00Z', endAtUtc: null, quantity: 2, estimatedAmount: 100000, actualAmount: null };
const detail = { itineraryId: 1, schedulingRequestId: 2, version: 1, status: 'Active', canManage: true, totalEstimatedCost: 0, totalDurationMinutes: 0, items: [] };

describe('UC79 confirmed services on Web itinerary', () => {
  it('accepts the additive contract and older itineraries', () => {
    expect(isValidItineraryDetailDto(detail)).toBe(true);
    expect(isValidItineraryDetailDto({ ...detail, bookedServices: [service] })).toBe(true);
  });
  it('rejects malformed additive service entries', () => {
    expect(isValidItineraryDetailDto({ ...detail, bookedServices: [{ ...service, quantity: 'two' }] })).toBe(false);
    expect(isValidItineraryDetailDto({ ...detail, bookedServices: 'bad' })).toBe(false);
  });
  it('renders the linked service and direct-payment information', () => {
    render(<BookedServices services={[service]} />);
    expect(screen.getByText('Riverside Hotel')).toBeDefined();
    expect(screen.getByText('Deluxe')).toBeDefined();
    expect(screen.getByText(/14:00/)).toBeDefined();
    expect(screen.getByText(/Thanh toán trực tiếp/i)).toBeDefined();
  });
  it('omits the section when the backend supplies no booked services', () => {
    const { container } = render(<BookedServices services={[]} />);
    expect(container.childElementCount).toBe(0);
  });
});
