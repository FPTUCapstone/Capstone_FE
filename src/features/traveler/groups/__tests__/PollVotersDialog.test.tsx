import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { PollVotersDialog } from '../components/PollVotersDialog';
import type { GroupMessageApiDto } from '../services/travelGroupApi';
const api = vi.hoisted(() => ({ read: vi.fn() }));
vi.mock('../services/groupMessageToolsApi', () => ({ fetchPollVoters: api.read }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
const message = { messageId: 3, groupId: 1, content: 'Đi đâu?', metadataJson: JSON.stringify({ options: [{ text: 'Biển' }, { text: 'Núi' }] }) } as GroupMessageApiDto;
it('shows the actual voter next to the chosen option and retries read errors', async () => {
  api.read.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([{ userId: 43, displayName: 'Bob', avatarUrl: null, optionIndex: 1, votedAtUtc: '2026-11-27T00:00:00Z' }]);
  render(<PollVotersDialog message={message} onClose={vi.fn()} />);
  await screen.findByRole('alert'); fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
  expect(await screen.findByText('Bob')).toBeDefined(); expect(screen.getByText('Núi')).toBeDefined();
  expect(api.read.mock.calls[0].slice(0, 2)).toEqual([1, 3]);
});
