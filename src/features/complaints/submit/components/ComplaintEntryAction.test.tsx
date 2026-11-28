import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ context: vi.fn() }));
vi.mock('../services/postTripComplaintApi', () => ({ getPostTripComplaintContext: mocks.context }));
import { ComplaintEntryAction } from './ComplaintEntryAction';

const eligible = { bookingId: '51710', bookingCode: 'BK-20261127-00003', tourTitle: 'Tour', endAtUtc: '2026-12-14T00:00:00Z', submissionDeadlineUtc: '2026-12-17T00:00:00Z', canSubmit: true, canAmendEvidence: false, ineligibilityReason: null, complaint: null };
afterEach(() => { cleanup(); vi.resetAllMocks(); });

it('keeps a successful eligibility result when an older Strict Mode request aborts late', async () => {
  let rejectOld!: (reason: unknown) => void;
  mocks.context.mockReturnValueOnce(new Promise((_resolve, reject) => { rejectOld = reject; })).mockResolvedValueOnce(eligible);
  render(<StrictMode><ComplaintEntryAction bookingId="51710" disabled={false} /></StrictMode>);
  const link = await screen.findByRole('link');
  expect(link.getAttribute('href')).toBe('/bookings/51710/complaint');
  await act(async () => { rejectOld(new DOMException('Aborted', 'AbortError')); });
  expect(screen.getByRole('link')).toBeTruthy();
});

it('shows retry when eligibility could not be loaded instead of silently hiding the action', async () => {
  mocks.context.mockRejectedValueOnce(new Error('Unavailable')).mockResolvedValueOnce(eligible);
  render(<ComplaintEntryAction bookingId="51710" disabled={false} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Thử lại' }));
  await screen.findByRole('link');
});

it('explains the backend ineligibility reason inside the detail', async () => {
  mocks.context.mockResolvedValue({ ...eligible, canSubmit: false, ineligibilityReason: 'complaint.tour_not_ended' });
  render(<ComplaintEntryAction bookingId="51710" disabled={false} />);
  await screen.findByText(/Tour chưa kết thúc/);
  expect(screen.queryByRole('link')).toBeNull();
});

it('does not fetch live complaint data for demo records', () => {
  render(<ComplaintEntryAction bookingId="51710" disabled />);
  expect(mocks.context).not.toHaveBeenCalled();
});
