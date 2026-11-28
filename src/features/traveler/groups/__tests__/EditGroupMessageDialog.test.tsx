import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { EditGroupMessageDialog } from '../components/EditGroupMessageDialog';
import type { GroupMessageApiDto } from '../services/travelGroupApi';
const api = vi.hoisted(() => ({ edit: vi.fn() }));
vi.mock('../services/groupMessageToolsApi', () => ({ editGroupMessage: api.edit }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
const message = { messageId: 3, groupId: 1, senderUserId: 42, senderName: 'Host', content: 'Đi đâu?', messageType: 'poll', metadataJson: JSON.stringify({ question: 'Đi đâu?', options: [{ text: 'Biển' }, { text: 'Núi' }] }), createdAtUtc: '2026-11-24T00:00:00Z', pollVoteCounts: {}, paidUserIds: [], revision: 2 } as unknown as GroupMessageApiDto;
it('retains edited values and reuses the operation key after a failed response', async () => {
  api.edit.mockRejectedValueOnce(new Error('timeout')).mockResolvedValueOnce({ ...message, revision: 3 });
  const saved = vi.fn(); render(<EditGroupMessageDialog message={message} onClose={vi.fn()} onSaved={saved} />);
  fireEvent.change(screen.getByRole('textbox', { name: 'Câu hỏi bình chọn' }), { target: { value: 'Đổi địa điểm?' } });
  fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));
  await screen.findByRole('alert');
  expect((screen.getByRole('textbox', { name: 'Câu hỏi bình chọn' }) as HTMLInputElement).value).toBe('Đổi địa điểm?');
  fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));
  await waitFor(() => expect(saved).toHaveBeenCalled());
  expect(api.edit.mock.calls[0][2]).toMatchObject({ expectedRevision: 2, content: 'Đổi địa điểm?' });
  expect(api.edit.mock.calls[1][2].clientRequestId).toBe(api.edit.mock.calls[0][2].clientRequestId);
});
it('shows a safe explanation instead of opening an invalid money editor', () => {
  render(<EditGroupMessageDialog message={{ ...message, messageType: 'split_bill', metadataJson: '{}' }} onClose={vi.fn()} onSaved={vi.fn()} />);
  expect(screen.getByRole('alert').textContent).toContain('không hợp lệ'); expect(api.edit).not.toHaveBeenCalled();
});
it('does not close another dialog when a save finishes after this editor was closed', async () => {
  let finish!: (value: GroupMessageApiDto) => void;
  api.edit.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  const saved = vi.fn(), view = render(<EditGroupMessageDialog message={message} onClose={vi.fn()} onSaved={saved} />);
  fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));
  await waitFor(() => expect(api.edit).toHaveBeenCalled()); view.unmount();
  await act(async () => { finish({ ...message, revision: 3 }); });
  expect(saved).not.toHaveBeenCalled();
});
it('preserves stored poll metadata while appending after authoritative votes changed', async () => {
  api.edit.mockResolvedValueOnce({ ...message, revision: 3 });
  render(<EditGroupMessageDialog message={{ ...message, pollVoteCounts: { 0: 1 }, metadataJson: JSON.stringify({ question: 'Đi đâu?', options: [{ id: '0', text: 'Biển', voterUserIds: [] }, { id: '1', text: 'Núi', voterUserIds: [] }], totalVotes: 0 }) }} onClose={vi.fn()} onSaved={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: /Thêm lựa chọn/ }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Lựa chọn 3' }), { target: { value: 'Thành phố' } });
  fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));
  await waitFor(() => expect(api.edit).toHaveBeenCalled());
  expect(JSON.parse(api.edit.mock.calls[0][2].metadataJson)).toMatchObject({ totalVotes: 0, options: [{ id: '0', text: 'Biển', voterUserIds: [] }, { id: '1', text: 'Núi', voterUserIds: [] }, { text: 'Thành phố' }] });
});
