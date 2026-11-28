import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StaffComplaintListScreen } from './StaffComplaintListScreen';
afterEach(() => vi.unstubAllGlobals());
describe('Staff complaint queue', () => {
  it('links a row to its own detail and filters server-side', async () => {
    const fetcher = vi.fn().mockImplementation(() => Promise.resolve(Response.json({ items: [{ complaintId: 42, bookingId: 2, bookingCode: 'BK-42', tourTitle: 'Đà Nẵng', status: 'AwaitingStaffReview', refundableAmount: 12000, submittedAtUtc: '2026-11-27T00:00:00Z' }], totalCount: 21, page: 1, pageSize: 20 })));
    vi.stubGlobal('fetch', fetcher); render(<StaffComplaintListScreen />);
    const link = await screen.findByRole('link', { name: 'Chi tiết hồ sơ #42' }); expect(link.getAttribute('href')).toBe('/admin/staff/post-trip-complaints/42');
    fireEvent.click(screen.getByRole('button', { name: 'Trang sau' }));
    await waitFor(() => expect(fetcher.mock.calls.at(-1)?.[0]).toContain('page=2'));
    fireEvent.change(screen.getByLabelText('Trạng thái'), { target: { value: 'AwaitingStaffEvidence' } });
    await waitFor(() => expect(fetcher.mock.calls.at(-1)?.[0]).toBe('/api/staff/post-trip-complaints?page=1&pageSize=20&status=AwaitingStaffEvidence'));
  });
  it('shows service failure instead of pretending the queue is empty', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ title: 'Unavailable' }, { status: 503 })));
    render(<StaffComplaintListScreen />); expect(await screen.findByRole('alert')).toBeTruthy(); expect(screen.queryByText('Chưa có hồ sơ phù hợp')).toBeNull();
  });
});
