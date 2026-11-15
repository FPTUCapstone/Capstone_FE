import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { BookingDecisionOutcomeView } from '../components/w104/BookingDecisionOutcomeView';

import { ToastProvider } from '../components/common/Toast';

import { ProviderBookingService } from '../services/providerBookingService';

import { testBooking } from './testBooking';

vi.mock('../services/providerBookingService', () => ({ ProviderBookingService: { getBookingRequestById: vi.fn(), submitDecision: vi.fn(), recordOutcome: vi.fn() } }));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));

const renderView = () => render(<ToastProvider><BookingDecisionOutcomeView id="9" /></ToastProvider>);

beforeEach(() => { vi.resetAllMocks(); vi.mocked(ProviderBookingService.getBookingRequestById).mockResolvedValue({ ...testBooking }); });

describe('UC79–80 request decisions and outcomes', () => {
  it('closes manual outcomes at the automatic-completion deadline', async () => {
    vi.mocked(ProviderBookingService.getBookingRequestById).mockResolvedValue({
      ...testBooking, status: 'Confirmed', autoCompleteAtUtc: '2020-01-04T17:00:00Z',
    });
    renderView();
    expect(await screen.findByText(/outcome recording window has ended/i)).toBeDefined();
    expect(screen.queryByRole('button', { name: /Mark Service Completed/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Mark Guest No-Show/i })).toBeNull();
  });

  it('uses service terminology for vehicle and restaurant requests', async () => {
    vi.mocked(ProviderBookingService.getBookingRequestById).mockResolvedValue({
      ...testBooking, status: 'Confirmed', serviceName: 'Motorbike rental',
    });
    renderView();
    expect(await screen.findByRole('button', { name: /Mark Service Completed/i })).toBeDefined();
    expect(screen.queryByText(/Stay Details/i)).toBeNull();
  });


  it('requires confirmation and submits the current row version', async () => {

    vi.mocked(ProviderBookingService.submitDecision).mockResolvedValue({ ...testBooking, status: 'Confirmed', rowVersion: 'new=' });

    renderView();

    fireEvent.click(await screen.findByRole('button', { name: /Confirm Request/i }));

    expect(ProviderBookingService.submitDecision).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Confirm Acceptance/i }));

    await waitFor(() => expect(ProviderBookingService.submitDecision).toHaveBeenCalledWith('9', { decision: 'Confirmed', rowVersion: testBooking.rowVersion }));

  });

  it('requires a rejection reason and supports Escape dismissal', async () => {

    renderView();

    fireEvent.click(await screen.findByRole('button', { name: /Reject Request/i }));

    fireEvent.click(screen.getByRole('button', { name: /Decline Request/i }));

    expect(ProviderBookingService.submitDecision).not.toHaveBeenCalled();

    expect(screen.getByText('Rejection reason cannot be blank.')).toBeDefined();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).toBeNull();

  });

  it('uses server eligibility and records a positive actual amount', async () => {

    vi.mocked(ProviderBookingService.getBookingRequestById).mockResolvedValue({ ...testBooking, status: 'Confirmed' });

    vi.mocked(ProviderBookingService.recordOutcome).mockResolvedValue({ ...testBooking, status: 'Completed', actualAmount: 100000, commissionAmount: 10000 });

    renderView();

    fireEvent.click(await screen.findByRole('button', { name: /Mark Service Completed/i }));

    fireEvent.click(screen.getByRole('button', { name: /Confirm Completion/i }));

    await waitFor(() => expect(ProviderBookingService.recordOutcome).toHaveBeenCalledWith('9', { outcome: 'Completed', actualAmount: 100000, rowVersion: testBooking.rowVersion }));

    expect(await screen.findByText('Outcome recorded.')).toBeDefined();

  });

  it('keeps outcomes locked before the server eligibility timestamp', async () => {

    vi.mocked(ProviderBookingService.getBookingRequestById).mockResolvedValue({ ...testBooking, status: 'Confirmed', outcomeAvailableAtUtc: '2099-01-01T00:00:00Z' });

    renderView();

    expect(await screen.findByText(/Outcome Recording Locked/i)).toBeDefined();

    expect(screen.queryByRole('button', { name: /Mark Service Completed/i })).toBeNull();

  });

});

