import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { BookingDecisionOutcomeView } from '../components/w104/BookingDecisionOutcomeView';
import { ToastProvider } from '../components/common/Toast';
import { ProviderBookingService } from '../services/providerBookingService';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

describe('Screen W104: Booking Decision & Service Outcome (Service Provider Workspace, UC-79, UC-80)', () => {
  beforeEach(() => {
    ProviderBookingService.resetState();
  });

  const renderComponent = (id: string = 'req-001') =>
    render(
      <ToastProvider>
        <BookingDecisionOutcomeView id={id} />
      </ToastProvider>
    );

  it('renders 62/38 split layout, traveler identity and BR-196 direct payment notice', async () => {
    renderComponent('req-001');

    await waitFor(() => {
      expect(screen.getAllByText('HBR-20261113-082').length).toBeGreaterThan(0);
    });

    // Check 62/38 sections
    expect(screen.getByText('Reservation Parameters & Stay Details')).toBeDefined();
    expect(screen.getByText('Traveler Identity & Special Inquiries')).toBeDefined();

    // Check Traveler Info
    expect(screen.getByText('Nguyễn Văn An')).toBeDefined();
    expect(screen.getByText('0912 345 678')).toBeDefined();
    expect(screen.getByText('an.nguyen@example.com')).toBeDefined();

    // Check BR-196 Mandatory Policy Notice
    expect(screen.getByText(/Direct Hotel Payment Policy \(BR-196\)/i)).toBeDefined();
    expect(
      screen.getByText(/The traveler pays the hotel directly upon check-in/i)
    ).toBeDefined();
  });

  it('executes Confirm decision flow via CR-05 dialog and shows MSG203', async () => {
    renderComponent('req-001');

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Confirm Request/i })).toBeDefined();
    });

    // Click Confirm button
    fireEvent.click(screen.getByRole('button', { name: /Confirm Request/i }));

    // Confirmation dialog opens
    expect(screen.getByText(/Confirm Booking Request/i)).toBeDefined();
    const confirmSubmitBtn = screen.getByRole('button', { name: /Confirm Acceptance/i });

    fireEvent.click(confirmSubmitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Request confirmed\. The Traveler has been notified\./i)
      ).toBeDefined();
    });
  });

  it('enforces mandatory rejection reason (BR-195) and MSG123 validation', async () => {
    renderComponent('req-002');

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Reject Request/i })).toBeDefined();
    });

    // Open rejection dialog
    fireEvent.click(screen.getByRole('button', { name: /Reject Request/i }));

    expect(screen.getByText(/Reject Booking Request/i)).toBeDefined();
    const declineSubmitBtn = screen.getByRole('button', { name: /Decline Request/i });

    // Submit empty reason -> triggers MSG123
    fireEvent.click(declineSubmitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Rejection reason cannot be blank/i)).toBeDefined();
    });

    // Fill valid reason
    const reasonTextarea = screen.getByPlaceholderText(/Enter clear reason for declining/i);
    fireEvent.change(reasonTextarea, {
      target: { value: 'Property is fully booked on selected dates.' },
    });

    fireEvent.click(declineSubmitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Request rejected\. The Traveler has been notified with the reason\./i)
      ).toBeDefined();
    });
  });

  it('allows recording service outcome on confirmed stay where check-in date has passed (req-004)', async () => {
    // req-004 has requestedDate '2026-11-11' which is in the past
    renderComponent('req-004');

    await waitFor(() => {
      expect(screen.getByText('Record Service Outcome')).toBeDefined();
      expect(screen.getByRole('button', { name: /Mark Stay Completed/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /Mark Guest No-Show/i })).toBeDefined();
    });

    // Verify 10% commission preview
    expect(screen.getByText(/TripMate Commission Preview/i)).toBeDefined();

    // Click Mark Completed
    fireEvent.click(screen.getByRole('button', { name: /Mark Stay Completed/i }));

    // Confirm dialog opens
    expect(screen.getByText(/Confirm Stay Completion/i)).toBeDefined();
    const confirmCompletionBtn = screen.getByRole('button', { name: /Confirm Completion/i });
    fireEvent.click(confirmCompletionBtn);

    await waitFor(() => {
      expect(screen.getByText(/Outcome recorded\./i)).toBeDefined();
      expect(screen.getByText(/Recorded Operational Outcome/i)).toBeDefined();
    });
  });

  it('shows locked notice when stay date is in the future (req-003)', async () => {
    // req-003 has requestedDate '2026-12-20' (future)
    renderComponent('req-003');

    await waitFor(() => {
      expect(screen.getByText(/Outcome Recording Locked/i)).toBeDefined();
      expect(
        screen.getByText(/Service outcome recording will unlock after the check-in date/i)
      ).toBeDefined();
    });
  });
});
