import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { ServiceBookingRequestsView } from '../components/w103/ServiceBookingRequestsView';
import { ToastProvider } from '../components/common/Toast';
import { ProviderBookingService } from '../services/providerBookingService';

const mockSearchParams = new URLSearchParams();
const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: vi.fn(),
  }),
  useSearchParams: () => mockSearchParams,
}));

describe('Screen W103: Service Booking Requests (Service Provider Workspace, UC-78)', () => {
  beforeEach(() => {
    ProviderBookingService.resetState();
    mockSearchParams.delete('status');
    mockSearchParams.delete('keyword');
    mockSearchParams.delete('page');
  });

  const renderComponent = () =>
    render(
      <ToastProvider>
        <ServiceBookingRequestsView />
      </ToastProvider>
    );

  it('renders operational table with all mandatory SRS §3.6.3 columns', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Service Booking Requests')).toBeDefined();
    });

    // Check mandatory table headers
    expect(screen.getByText('Request Code')).toBeDefined();
    expect(screen.getByText('Property / Service')).toBeDefined();
    expect(screen.getByText('Room Option')).toBeDefined();
    expect(screen.getByText('Requested Date')).toBeDefined();
    expect(screen.getByText('Check-in Time')).toBeDefined();
    expect(screen.getByText('Qty')).toBeDefined();
    expect(screen.getByText('Traveler Name')).toBeDefined();
    expect(screen.getByText('Status')).toBeDefined();
    expect(screen.getByText('Submitted At')).toBeDefined();
    expect(screen.getByText('Action')).toBeDefined();

    // Verify representative booking rows exist
    expect(screen.getByText('HBR-20261113-082')).toBeDefined();
    expect(screen.getByText('Nguyễn Văn An')).toBeDefined();
    expect(screen.getAllByText('Deluxe Riverside Suite').length).toBeGreaterThan(0);
  });

  it('displays sorting notice prioritizing Pending Confirmation requests', async () => {
    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText(/Pending Confirmation requests are prioritized first/i)
      ).toBeDefined();
    });
  });

  it('enforces search-on-submit behavior (CR-02)', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('HBR-20261113-082')).toBeDefined();
      expect(screen.getByText('HBR-20261113-083')).toBeDefined();
    });

    const searchInput = screen.getByLabelText(/Search/i);
    fireEvent.change(searchInput, { target: { value: 'Tam' } });

    // Before submit, both still present
    expect(screen.getByText('HBR-20261113-082')).toBeDefined();

    // Click Search button
    const searchBtn = screen.getByRole('button', { name: /^Search$/i });
    fireEvent.click(searchBtn);

    await waitFor(() => {
      // Only Tran Minh Tam should remain
      expect(screen.getByText('HBR-20261113-083')).toBeDefined();
      expect(screen.queryByText('HBR-20261113-082')).toBeNull();
    });
  });

  it('displays MSG128 empty state when no requests match filter criteria', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('HBR-20261113-082')).toBeDefined();
    });

    const searchInput = screen.getByLabelText(/Search/i);
    fireEvent.change(searchInput, { target: { value: 'NONEXISTENT_KEYWORD_XYZ' } });

    const searchBtn = screen.getByRole('button', { name: /^Search$/i });
    fireEvent.click(searchBtn);

    await waitFor(() => {
      expect(screen.getByText(/No Booking Requests Found/i)).toBeDefined();
      expect(
        screen.getByText(/No requests match your current filter parameters/i)
      ).toBeDefined();
    });
  });

  it('renders pagination details per CR-01', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Total 10 booking requests on file/i)).toBeDefined();
      expect(screen.getByText(/1 \/ 1/)).toBeDefined();
      expect(screen.getByRole('button', { name: /Previous page/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /Next page/i })).toBeDefined();
    });
  });
});
