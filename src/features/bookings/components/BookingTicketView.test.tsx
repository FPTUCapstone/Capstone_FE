import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ticketMessages } from '../resources/ticketMessages';
import type { TicketStatus, TicketView } from '../types/ticket';

const { fetchTicketMock, refreshTicketQrMock, searchParams } = vi.hoisted(() => ({
  fetchTicketMock: vi.fn(),
  refreshTicketQrMock: vi.fn(),
  searchParams: new URLSearchParams(),
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => searchParams,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));
vi.mock('../services/ticketClient', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../services/ticketClient')>()),
  fetchTicket: fetchTicketMock,
  refreshTicketQr: refreshTicketQrMock,
}));
vi.mock('./QrCodeDisplay', () => ({
  QrCodeDisplay: ({ value }: { value: string }) => <div data-testid="qr" data-value={value} />,
}));

import { TicketClientError } from '../services/ticketClient';
import { BookingTicketView } from './BookingTicketView';

function ticket(over: Partial<TicketView> = {}): TicketView {
  return {
    ticketId: '77',
    ticketCode: 'TK-0000000456',
    bookingId: '456',
    bookingCode: 'BK-20261017-00001',
    ticketStatus: 'Valid',
    tour: { tourId: '45', title: 'Hoi An Lantern Tour' },
    operatorName: 'Hoi An Travel Co.',
    schedule: {
      startAtUtc: '2026-10-30T01:00:00+00:00',
      endAtUtc: '2026-10-30T10:00:00+00:00',
      meetingPoint: 'Old Town gate',
    },
    participantCount: 3,
    participants: { adult: 2, child: 1, infant: 0 },
    validity: {
      departureDate: '2026-10-30',
      timeZone: 'Asia/Ho_Chi_Minh',
      validFromUtc: '2026-10-29T17:00:00+00:00',
      validUntilUtc: '2026-10-30T16:59:59.9999999+00:00',
    },
    checkedInAtUtc: null,
    qr: { content: 'TM1.first.sig', issuedAtUtc: '2026-10-24T08:15:00+00:00' },
    ...over,
  };
}

const renderView = (key: { ticketId: string } | { bookingId: string } = { ticketId: '77' }) =>
  render(<BookingTicketView ticketKey={key} returnPath="/account/tickets/77" />);

function setOnline(online: boolean) {
  Object.defineProperty(window.navigator, 'onLine', { value: online, configurable: true });
  act(() => {
    window.dispatchEvent(new Event(online ? 'online' : 'offline'));
  });
}

async function confirmRefresh() {
  fireEvent.click(await screen.findByRole('button', { name: /Làm mới mã QR/ }));
  expect(screen.getByRole('alertdialog').textContent).toContain(ticketMessages.refreshConfirm);
  fireEvent.click(screen.getByRole('button', { name: 'Làm mới' }));
}

beforeEach(() => {
  fetchTicketMock.mockReset();
  refreshTicketQrMock.mockReset();
  searchParams.delete('demo');
  Object.defineProperty(window.navigator, 'onLine', { value: true, configurable: true });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('BookingTicketView (UC-29)', () => {
  it('shows a loading state, then the ticket fields of the contract', async () => {
    fetchTicketMock.mockResolvedValue(ticket());

    renderView();

    expect(screen.getByText(/Đang tải/)).toBeTruthy();
    expect(await screen.findByText('Hoi An Lantern Tour')).toBeTruthy();
    expect(screen.getByText(ticketMessages.status.Valid)).toBeTruthy();
    expect(screen.getByText(ticketMessages.msg93)).toBeTruthy();
    expect(screen.getByTestId('qr').getAttribute('data-value')).toBe('TM1.first.sig');
    expect(screen.getAllByText('TK-0000000456').length).toBeGreaterThan(0);
    expect(screen.getByText('BK-20261017-00001')).toBeTruthy();
    expect(screen.getByText(/Hoi An Travel Co\./)).toBeTruthy();
    expect(screen.getByText('30/10/2026 08:00')).toBeTruthy();
    expect(screen.getByText('Old Town gate')).toBeTruthy();
    expect(screen.getByText('2 người lớn, 1 trẻ em (3 khách)')).toBeTruthy();
    expect(screen.getByText(ticketMessages.validityNote('30/10/2026'))).toBeTruthy();
    expect(fetchTicketMock).toHaveBeenCalledWith({ ticketId: '77' }, expect.objectContaining({ allowDemo: false }));
  });

  it('reads by booking when opened from the payment result', async () => {
    fetchTicketMock.mockResolvedValue(ticket());

    renderView({ bookingId: '456' });

    await screen.findByText('Hoi An Lantern Tour');
    expect(fetchTicketMock).toHaveBeenCalledWith({ bookingId: '456' }, expect.anything());
  });

  it.each<[TicketStatus, Partial<TicketView>, string, boolean]>([
    ['NotYetActive', {}, ticketMessages.msg98('30/10/2026'), true],
    ['Used', { qr: null, checkedInAtUtc: '2026-10-30T00:20:00+00:00' }, ticketMessages.msg95('30/10/2026 07:20'), false],
    ['Cancelled', { qr: null }, ticketMessages.msg139('BK-20261017-00001'), false],
    ['Expired', { qr: null }, ticketMessages.msg140('30/10/2026'), false],
  ])('shows %s with its message and QR visibility', async (status, over, message, showsQr) => {
    fetchTicketMock.mockResolvedValue(ticket({ ticketStatus: status, ...over }));

    renderView();

    expect(await screen.findByText(message)).toBeTruthy();
    expect(screen.getByText(ticketMessages.status[status])).toBeTruthy();
    expect(screen.queryByTestId('qr') !== null).toBe(showsQr);
    expect(screen.queryByRole('button', { name: /Làm mới mã QR/ }) !== null).toBe(showsQr);
  });

  it('says the meeting point is not set yet when it is missing', async () => {
    fetchTicketMock.mockResolvedValue(ticket({ schedule: { ...ticket().schedule, meetingPoint: null } }));

    renderView();

    expect(await screen.findByText(ticketMessages.meetingPointMissing)).toBeTruthy();
  });

  it('refreshes only after confirmation and replaces the QR', async () => {
    fetchTicketMock.mockResolvedValue(ticket());
    refreshTicketQrMock.mockResolvedValue(ticket({ qr: { content: 'TM1.second.sig', issuedAtUtc: '2026-10-30T00:40:00+00:00' } }));
    renderView();

    fireEvent.click(await screen.findByRole('button', { name: /Làm mới mã QR/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Huỷ' }));
    expect(refreshTicketQrMock).not.toHaveBeenCalled();
    await confirmRefresh();

    await waitFor(() => expect(screen.getByTestId('qr').getAttribute('data-value')).toBe('TM1.second.sig'));
    expect(refreshTicketQrMock).toHaveBeenCalledWith('77', expect.anything());
  });

  it('re-reads the ticket when it can no longer be refreshed', async () => {
    fetchTicketMock
      .mockResolvedValueOnce(ticket())
      .mockResolvedValueOnce(ticket({ ticketStatus: 'Used', qr: null, checkedInAtUtc: '2026-10-30T00:20:00+00:00' }));
    refreshTicketQrMock.mockRejectedValue(
      new TicketClientError('notRefreshable', ticketMessages.msg127, 409, 'Used'),
    );
    renderView();

    await confirmRefresh();

    expect(await screen.findByText(ticketMessages.status.Used)).toBeTruthy();
    expect(screen.queryByTestId('qr')).toBeNull();
    expect(fetchTicketMock).toHaveBeenLastCalledWith({ ticketId: '77' }, expect.anything());
  });

  it('re-reads after a failed refresh and shows the new QR when that works', async () => {
    fetchTicketMock
      .mockResolvedValueOnce(ticket())
      .mockResolvedValueOnce(ticket({ qr: { content: 'TM1.server.sig', issuedAtUtc: '2026-10-30T00:41:00+00:00' } }));
    refreshTicketQrMock.mockRejectedValue(new TicketClientError('system', ticketMessages.msg127, 0));
    renderView();

    await confirmRefresh();

    await waitFor(() => expect(screen.getByTestId('qr').getAttribute('data-value')).toBe('TM1.server.sig'));
    expect(screen.queryByText(ticketMessages.staleQr)).toBeNull();
  });

  it('keeps the old QR with a warning when both the refresh and the re-read fail', async () => {
    fetchTicketMock
      .mockResolvedValueOnce(ticket())
      .mockRejectedValueOnce(new TicketClientError('system', ticketMessages.msg127, 0));
    refreshTicketQrMock.mockRejectedValue(new TicketClientError('system', ticketMessages.msg127, 0));
    renderView();

    await confirmRefresh();

    expect(await screen.findByText(ticketMessages.staleQr)).toBeTruthy();
    expect(screen.getByText(ticketMessages.msg127)).toBeTruthy();
    expect(screen.getByTestId('qr').getAttribute('data-value')).toBe('TM1.first.sig');
  });

  it('disables refresh while the browser is offline', async () => {
    fetchTicketMock.mockResolvedValue(ticket());
    renderView();
    const button = await screen.findByRole('button', { name: /Làm mới mã QR/ });

    setOnline(false);
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(ticketMessages.offline)).toBeTruthy();

    setOnline(true);
    expect((button as HTMLButtonElement).disabled).toBe(false);
  });

  it.each([
    [new TicketClientError('forbidden', ticketMessages.msg126, 403), ticketMessages.msg126],
    [new TicketClientError('notFound', ticketMessages.notFound, 404), ticketMessages.notFound],
    [new TicketClientError('notConfirmed', ticketMessages.msg138, 409), ticketMessages.msg138],
    [new TicketClientError('signIn', ticketMessages.signIn, 401), ticketMessages.signIn],
  ])('shows the reviewed message for %s and no QR', async (error, message) => {
    fetchTicketMock.mockRejectedValue(error);

    renderView();

    expect(await screen.findByText(message)).toBeTruthy();
    expect(screen.queryByTestId('qr')).toBeNull();
  });

  it('links to sign-in with the return path when the session is gone', async () => {
    fetchTicketMock.mockRejectedValue(new TicketClientError('signIn', ticketMessages.signIn, 401));

    renderView();

    const link = await screen.findByRole('link', { name: /Đăng nhập/ });
    expect(link.getAttribute('href')).toBe(`/sign-in?returnUrl=${encodeURIComponent('/account/tickets/77')}`);
  });

  it('offers a retry after a system failure', async () => {
    fetchTicketMock
      .mockRejectedValueOnce(new TicketClientError('system', ticketMessages.msg127, 503))
      .mockResolvedValueOnce(ticket());
    renderView();

    fireEvent.click(await screen.findByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('Hoi An Lantern Tour')).toBeTruthy();
  });

  it('marks the demo ticket and prints on request', async () => {
    fetchTicketMock.mockResolvedValue({ ...ticket(), isDemo: true });
    const print = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    renderView();

    expect(await screen.findByText('DEMO ONLY')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /In vé/ }));
    expect(print).toHaveBeenCalled();
  });

  it('never shows claims the product does not support', async () => {
    fetchTicketMock.mockResolvedValue(ticket());

    const { container } = renderView();

    await screen.findByText('Hoi An Lantern Tour');
    expect(container.textContent).not.toMatch(/Escrow|độ sáng|ngoại tuyến|PENDING_BE_INTEGRATION/i);
  });
});
