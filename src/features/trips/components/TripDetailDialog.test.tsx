import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { demoTripDetail } from '../data/tripHistoryDemoFixtures';
import { tripReviewEn } from '../resources/en';
import { TripHistoryClientError } from '../services/tripHistoryClient';
import type { TripDetail, TripListItem } from '../types/tripHistoryContract';
import { TripDetailDialog } from './TripDetailDialog';

const fetchTripDetailMock = vi.hoisted(() => vi.fn());
vi.mock('../services/tripHistoryClient', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../services/tripHistoryClient')>()),
  fetchTripDetail: fetchTripDetailMock,
}));

const detail = (kind: 'commerceBooking' | 'itinerary', id: string): TripDetail => {
  const found = demoTripDetail(kind, id);
  if (!found) throw new Error(`fixture ${kind}:${id} missing`);
  return found;
};

function show(
  item: TripDetail,
  props: Partial<React.ComponentProps<typeof TripDetailDialog>> = {},
) {
  const onClose = vi.fn();
  render(<TripDetailDialog item={item as TripListItem} allowDemo={false} onClose={onClose} {...props} />);
  return onClose;
}

const dialog = () => screen.getByRole('dialog');

beforeEach(() => {
  fetchTripDetailMock.mockReset();
});

describe('TripDetailDialog — loading and accessibility', () => {
  it('requests the (kind, id) pair with the demo flag and a signal, and shows a loading state first', async () => {
    let resolve: (value: TripDetail) => void = () => undefined;
    fetchTripDetailMock.mockReturnValue(new Promise<TripDetail>((r) => { resolve = r; }));
    const item = detail('itinerary', '5003');

    show(item, { allowDemo: true });

    expect(fetchTripDetailMock).toHaveBeenCalledTimes(1);
    const [kind, id, options] = fetchTripDetailMock.mock.calls[0];
    expect([kind, id]).toEqual(['itinerary', '5003']);
    expect(options.allowDemo).toBe(true);
    expect(options.signal).toBeInstanceOf(AbortSignal);
    expect(screen.getByRole('status').textContent).toContain(tripReviewEn.dialogs.tripDetail.loading);

    await act(async () => resolve(item));
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('is a modal dialog labelled by the trip title, with focus moved inside', async () => {
    fetchTripDetailMock.mockResolvedValue(detail('commerceBooking', '9001'));

    show(detail('commerceBooking', '9001'));

    expect(dialog().getAttribute('aria-modal')).toBe('true');
    expect(screen.getByRole('dialog', { name: 'Hoi An Lantern Tour' })).toBeDefined();
    await waitFor(() => expect(dialog().contains(document.activeElement)).toBe(true));
    expect(document.activeElement).toBe(screen.getByRole('button', { name: tripReviewEn.actions.close }));
  });

  it('closes with the close button and with Escape', async () => {
    fetchTripDetailMock.mockResolvedValue(detail('commerceBooking', '9001'));
    const onClose = show(detail('commerceBooking', '9001'));

    fireEvent.click(screen.getByRole('button', { name: tripReviewEn.actions.close }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('keeps Tab inside the dialog', async () => {
    fetchTripDetailMock.mockResolvedValue(detail('commerceBooking', '9004'));
    show(detail('commerceBooking', '9004'));
    await screen.findByText(/Change of plans/);
    const controls = within(dialog()).getAllByRole('button');
    const last = controls[controls.length - 1];

    last.focus();
    fireEvent.keyDown(window, { key: 'Tab' });

    expect(document.activeElement).toBe(controls[0]);
  });

  it('returns focus to the control that opened it', async () => {
    fetchTripDetailMock.mockResolvedValue(detail('commerceBooking', '9001'));
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();

    const { unmount } = render(
      <TripDetailDialog item={detail('commerceBooking', '9001') as TripListItem} allowDemo={false} onClose={vi.fn()} />,
    );
    await screen.findByText(tripReviewEn.dialogs.tripDetail.tourHeading);
    unmount();

    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });

  it('aborts the request when it is closed and ignores a late answer', async () => {
    let resolve: (value: TripDetail) => void = () => undefined;
    fetchTripDetailMock.mockReturnValue(new Promise<TripDetail>((r) => { resolve = r; }));
    const item = detail('commerceBooking', '9001');
    const { unmount } = render(<TripDetailDialog item={item as TripListItem} allowDemo={false} onClose={vi.fn()} />);
    const signal = fetchTripDetailMock.mock.calls[0][2].signal as AbortSignal;

    unmount();
    await act(async () => resolve(item));

    expect(signal.aborted).toBe(true);
  });
});

describe('TripDetailDialog — booking', () => {
  it('shows the tour, schedule and participants of a completed booking', async () => {
    fetchTripDetailMock.mockResolvedValue(detail('commerceBooking', '9001'));
    show(detail('commerceBooking', '9001'));

    await screen.findByText(tripReviewEn.dialogs.tripDetail.tourHeading);
    const view = within(dialog());
    expect(view.getByText('Hoi An')).toBeDefined();
    expect(view.getByText(tripReviewEn.dialogs.refundDetails.bookingCodeLabel)).toBeDefined();
    expect(view.getByText('TM-009001')).toBeDefined();
    expect(view.getByText('01/10/2026 09:00')).toBeDefined();
    expect(view.getByText('01/10/2026 17:00')).toBeDefined();
    expect(view.getByText('Old Town gate')).toBeDefined();
    expect(view.getByText(tripReviewEn.dialogs.tripDetail.adults(2))).toBeDefined();
    expect(view.getByText(tripReviewEn.dialogs.tripDetail.children(1))).toBeDefined();
    expect(view.queryByText(tripReviewEn.dialogs.tripDetail.infants(0))).toBeNull();
    expect(view.queryByText(tripReviewEn.dialogs.tripDetail.cancellationHeading)).toBeNull();
    expect(view.queryByText(tripReviewEn.dialogs.tripDetail.refundHeading)).toBeNull();
  });

  it('omits the meeting point when there is none', async () => {
    fetchTripDetailMock.mockResolvedValue(detail('commerceBooking', '9002'));
    show(detail('commerceBooking', '9002'));

    await screen.findByText(tripReviewEn.dialogs.tripDetail.tourHeading);
    expect(within(dialog()).queryByText(tripReviewEn.dialogs.tripDetail.meetingPointLabel)).toBeNull();
  });

  it('shows the cancellation and the refund of a cancelled booking', async () => {
    fetchTripDetailMock.mockResolvedValue(detail('commerceBooking', '9004'));
    show(detail('commerceBooking', '9004'));

    await screen.findByText(tripReviewEn.dialogs.tripDetail.cancellationHeading);
    const view = within(dialog());
    expect(view.getByText('Change of plans')).toBeDefined();
    expect(view.getByText('10/08/2026')).toBeDefined();
    expect(view.getByText(tripReviewEn.tripHistory.refundStatusLabels.Processed)).toBeDefined();
    expect(view.getByText(/800\.000/)).toBeDefined();
    expect(view.getByText('PayOS')).toBeDefined();
  });

  it('says the refund channel is not available instead of showing an empty value', async () => {
    const base = detail('commerceBooking', '9004');
    if (base.kind !== 'commerceBooking' || !base.refund) throw new Error('fixture');
    fetchTripDetailMock.mockResolvedValue({ ...base, refund: { ...base.refund, channel: null } });
    show(base);

    await screen.findByText(tripReviewEn.dialogs.tripDetail.refundHeading);
    expect(within(dialog()).getByText(tripReviewEn.dialogs.tripDetail.channelUnavailable)).toBeDefined();
  });

  it('highlights the refund section when it was opened from the refund action', async () => {
    fetchTripDetailMock.mockResolvedValue(detail('commerceBooking', '9004'));
    show(detail('commerceBooking', '9004'), { focus: 'refund' });

    const heading = await screen.findByText(tripReviewEn.dialogs.tripDetail.refundHeading);
    expect(heading.closest('section')?.getAttribute('data-highlighted')).toBe('true');
  });

  it('does not highlight the refund when opened from View details', async () => {
    fetchTripDetailMock.mockResolvedValue(detail('commerceBooking', '9004'));
    show(detail('commerceBooking', '9004'));

    const heading = await screen.findByText(tripReviewEn.dialogs.tripDetail.refundHeading);
    expect(heading.closest('section')?.getAttribute('data-highlighted')).not.toBe('true');
  });

  it('shows a cancelled booking that has no refund without a refund section', async () => {
    const base = detail('commerceBooking', '9004');
    if (base.kind !== 'commerceBooking') throw new Error('fixture');
    const { refund: _refund, ...withoutRefund } = base;
    void _refund;
    fetchTripDetailMock.mockResolvedValue(withoutRefund);
    show(base);

    await screen.findByText(tripReviewEn.dialogs.tripDetail.cancellationHeading);
    expect(within(dialog()).queryByText(tripReviewEn.dialogs.tripDetail.refundHeading)).toBeNull();
  });
});

describe('TripDetailDialog — itinerary', () => {
  it('lists the stops in order with visited, skipped and not-visited labels and the session', async () => {
    fetchTripDetailMock.mockResolvedValue(detail('itinerary', '5001'));
    show(detail('itinerary', '5001'));

    await screen.findByText(tripReviewEn.dialogs.tripDetail.stopsHeading);
    const view = within(dialog());
    const stops = view.getAllByRole('listitem');
    expect(stops.map((s) => s.querySelector('[data-stop-name]')?.textContent)).toEqual([
      'Dragon Bridge',
      'My Khe Beach',
      'Han Market',
      'Marble Mountains',
    ]);
    expect(within(stops[0]).getByText(tripReviewEn.dialogs.tripDetail.stopStatus.Reached)).toBeDefined();
    expect(within(stops[2]).getByText(tripReviewEn.dialogs.tripDetail.stopStatus.Skipped)).toBeDefined();
    expect(within(stops[0]).getByText(tripReviewEn.dialogs.tripDetail.reachedAt('20/09/2026 08:05'))).toBeDefined();
    expect(view.getByText(tripReviewEn.tripHistory.card.visitedOf(3, 4))).toBeDefined();
    expect(view.getByText('20/09/2026 08:00')).toBeDefined();
    expect(view.getByText('20/09/2026 16:30')).toBeDefined();
    expect(view.getByText(tripReviewEn.dialogs.tripDetail.completionReasons.RouteFinished)).toBeDefined();
  });

  it('labels a stop that was never reached as not visited', async () => {
    fetchTripDetailMock.mockResolvedValue(detail('itinerary', '5002'));
    show(detail('itinerary', '5002'));

    await screen.findByText(tripReviewEn.dialogs.tripDetail.stopsHeading);
    const stops = within(dialog()).getAllByRole('listitem');
    expect(within(stops[1]).getByText(tripReviewEn.dialogs.tripDetail.stopStatus.Pending)).toBeDefined();
    expect(within(dialog()).getByText(tripReviewEn.dialogs.tripDetail.completionReasons.Expired)).toBeDefined();
  });

  it('falls back to the raw completion reason it does not know', async () => {
    const base = detail('itinerary', '5001');
    if (base.kind !== 'itinerary' || !base.session) throw new Error('fixture');
    fetchTripDetailMock.mockResolvedValue({ ...base, session: { ...base.session, completionReason: 'Mystery' } });
    show(base);

    await screen.findByText(tripReviewEn.dialogs.tripDetail.stopsHeading);
    expect(within(dialog()).getByText('Mystery')).toBeDefined();
  });

  it('shows planned stops of an upcoming itinerary without visit labels or a session', async () => {
    fetchTripDetailMock.mockResolvedValue(detail('itinerary', '5003'));
    show(detail('itinerary', '5003'));

    await screen.findByText(tripReviewEn.dialogs.tripDetail.stopsHeading);
    const view = within(dialog());
    expect(view.getAllByRole('listitem')).toHaveLength(3);
    for (const label of Object.values(tripReviewEn.dialogs.tripDetail.stopStatus)) {
      expect(view.queryByText(label)).toBeNull();
    }
    expect(view.queryByText(tripReviewEn.dialogs.tripDetail.sessionHeading)).toBeNull();
    expect(view.getByText(tripReviewEn.dialogs.tripDetail.plannedWindow('08:00', '09:00'))).toBeDefined();
  });
});

describe('TripDetailDialog — failures', () => {
  it('shows a system error with Retry that asks again', async () => {
    fetchTripDetailMock.mockRejectedValueOnce(
      new TripHistoryClientError('system', tripReviewEn.errors.systemError, 503),
    );
    fetchTripDetailMock.mockResolvedValueOnce(detail('commerceBooking', '9001'));
    show(detail('commerceBooking', '9001'));

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain(tripReviewEn.errors.systemError);

    fireEvent.click(screen.getByRole('button', { name: tripReviewEn.actions.retry }));

    await screen.findByText(tripReviewEn.dialogs.tripDetail.tourHeading);
    expect(fetchTripDetailMock).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('says a record that is gone is no longer available and offers no retry', async () => {
    fetchTripDetailMock.mockRejectedValue(
      new TripHistoryClientError('notFound', tripReviewEn.errors.tripRecordUnavailable, 404),
    );
    show(detail('commerceBooking', '9001'));

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain(tripReviewEn.errors.tripRecordUnavailable);
    expect(screen.queryByRole('button', { name: tripReviewEn.actions.retry })).toBeNull();
    expect(screen.getByRole('button', { name: tripReviewEn.actions.close })).toBeDefined();
  });

  it('shows the access-denied text without a retry', async () => {
    fetchTripDetailMock.mockRejectedValue(
      new TripHistoryClientError('accessDenied', tripReviewEn.errors.tripDetailAccessDenied, 403),
    );
    show(detail('commerceBooking', '9001'));

    expect((await screen.findByRole('alert')).textContent).toContain(tripReviewEn.errors.tripDetailAccessDenied);
    expect(screen.queryByRole('button', { name: tripReviewEn.actions.retry })).toBeNull();
  });

  it('reports an unexpected error as the generic system error', async () => {
    fetchTripDetailMock.mockRejectedValue(new Error('boom: internal detail'));
    show(detail('commerceBooking', '9001'));

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain(tripReviewEn.errors.systemError);
    expect(alert.textContent).not.toContain('boom');
  });
});
