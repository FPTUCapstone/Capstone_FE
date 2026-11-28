import { StrictMode } from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const a = vi.hoisted(() => ({ groups: vi.fn(), history: vi.fn(), post: vi.fn(), members: vi.fn(), vote: vi.fn(), ack: vi.fn(), present: vi.fn(), direct: vi.fn(), read: vi.fn(), search: vi.fn(), start: vi.fn(), directHistory: vi.fn() }));
vi.mock('@/features/auth/session/useWebSession', () => ({ useWebSession: () => ({ status: 'authenticated', context: { userId: 42, fullName: 'Người dùng hiện tại', role: 'Traveler' } }) }));
vi.mock('../services/chatNotifications', () => ({ subscribeToChatChanges: () => () => undefined }));
vi.mock('../services/travelGroupApi', async original => ({ ...(await original<object>()), fetchGroupConversations: a.groups, fetchGroupMessages: a.history, postGroupMessage: a.post, fetchChatMembers: a.members, votePollOption: a.vote, acknowledgeBroadcastMessage: a.ack, checkinRollCallMessage: a.present, markGroupRead: a.read }));
vi.mock('../services/directChatApi', async original => ({ ...(await original<object>()), fetchDirectConversations: a.direct, searchChatUsers: a.search, openDirectConversation: a.start, fetchDirectMessages: a.directHistory }));
vi.mock('../services/chatGroupApi', async original => ({ ...(await original<object>()), fetchChatGroupConversations: vi.fn(async () => ({ items: [], nextBeforeGroupId: null })) }));
import { GroupChatHub } from '../components/GroupChatHub';
const group = (id = 73, status = 'Active') => ({ groupId: id, groupName: `Nhóm DB ${id}`, itineraryId: 91, itineraryTitle: 'Trip', itinerarySourceType: 'Manual', hostUserId: 42, memberCount: 2, status, lastMessage: null, lastMessageAtUtc: null, unreadCount: 0 });
const message = (id = 804, type = 'text', meta: object | null = null) => ({ messageId: id, groupId: 73, senderUserId: 42, senderName: 'Người gửi thật', messageType: type, content: `Nội dung ${id}`, metadataJson: meta ? JSON.stringify(meta) : null, createdAtUtc: '2026-11-23T00:00:00Z', isReadByMe: false, readByCount: 0, isPresentByMe: false, presentCount: 0, paidUserIds: [], pollVoteCounts: {}, myPollVoteOption: null });
beforeEach(() => { vi.resetAllMocks(); a.groups.mockResolvedValue({ items: [group()], nextBeforeGroupId: null }); a.direct.mockResolvedValue({ items: [], nextBeforeConversationId: null }); a.history.mockResolvedValue([]); a.members.mockResolvedValue([{ memberId: 42, displayName: 'Host', isHost: true }, { memberId: 43, displayName: 'Member', isHost: false }]); a.read.mockResolvedValue(undefined); a.search.mockResolvedValue([{ userId: 99, displayName: 'Người nhận DB', avatarUrl: null }]); a.start.mockResolvedValue({ conversationId: 60, otherUserId: 99, displayName: 'Người nhận DB', avatarUrl: null, lastMessage: null, lastMessageAtUtc: null, unreadCount: 0 }); a.directHistory.mockResolvedValue([]); a.post.mockImplementation(async (_id, payload) => ({ ...message(), messageType: payload.messageType, content: payload.content, metadataJson: payload.metadataJson })); });
afterEach(cleanup);
async function ready() { render(<GroupChatHub />); await screen.findByRole('button', { name: 'Mở Nhóm DB 73' }); await waitFor(() => expect(screen.queryByText('Đang tải tin nhắn…')).toBeNull()); }
async function action(name: string) { fireEvent.click(screen.getByRole('button', { name: 'Thêm tiện ích' })); fireEvent.click(screen.getByRole('button', { name })); }
it('shows an empty database instead of sample conversations', async () => { a.groups.mockResolvedValue({ items: [], nextBeforeGroupId: null }); render(<GroupChatHub />); expect(await screen.findByText(/Chưa có cuộc trò chuyện\./)).toBeDefined(); expect(screen.queryByText(/Đà Lạt/)).toBeNull(); });
it('shows a load error without pretending the account has no groups', async () => { a.groups.mockRejectedValue(new Error('offline')); render(<GroupChatHub />); await screen.findByRole('alert'); expect(screen.queryByText(/Chưa có cuộc trò chuyện\./)).toBeNull(); });
it('disables writing to a closed group', async () => { a.groups.mockResolvedValue({ items: [group(73, 'Closed')], nextBeforeGroupId: null }); await ready(); expect((screen.getByPlaceholderText('Nhập tin nhắn...') as HTMLTextAreaElement).disabled).toBe(true); expect((screen.getByRole('button', { name: 'Thêm tiện ích' }) as HTMLButtonElement).disabled).toBe(true); });
it('rejects a late history response from the previous group', async () => {
 a.groups.mockResolvedValue({ items: [group(), group(74)], nextBeforeGroupId: null }); let resolve!: (v: unknown) => void;
 a.history.mockImplementationOnce(() => new Promise(r => { resolve = r; })).mockResolvedValueOnce([{ ...message(900), groupId: 74, content: 'Nhóm mới' }]);
 render(<GroupChatHub />); fireEvent.click(await screen.findByRole('button', { name: 'Mở Nhóm DB 74' })); await screen.findByText('Nhóm mới'); resolve([{ ...message(), content: 'Tin cũ sai phòng' }]);
 await waitFor(() => expect(within(screen.getByRole('log')).queryByText('Tin cũ sai phòng')).toBeNull());
});
it('uses zero-based poll indices and explicit persisted cancellation', async () => {
 const poll = { ...message(804, 'poll', { question: 'Chọn địa điểm', options: [{ text: 'Lựa chọn A' }, { text: 'Lựa chọn B' }] }), myPollVoteOption: 0, pollVoteCounts: { 0: 1 } };
 a.history.mockResolvedValueOnce([poll]).mockResolvedValue([{ ...poll, myPollVoteOption: null, pollVoteCounts: {} }]); a.vote.mockResolvedValue({}); await ready();
 fireEvent.click(screen.getByRole('button', { name: /Lựa chọn A/ })); await waitFor(() => expect(a.vote).toHaveBeenCalledWith(73, 804, -1, 0)); await waitFor(() => expect(screen.getByRole('button', { name: /Lựa chọn A/ }).getAttribute('aria-pressed')).toBe('false'));
});
it('does not toggle persisted receipts or attendance back to false', async () => {
 a.history.mockResolvedValue([{ ...message(1, 'broadcast', { title: 'Thông báo thật', content: 'Nội dung' }), isReadByMe: true, readByCount: 2 }, { ...message(2, 'roll_call', { title: 'Điểm danh thật' }), isPresentByMe: true, presentCount: 2 }]); await ready();
 expect((screen.getByRole('button', { name: 'Đã xác nhận đã đọc' }) as HTMLButtonElement).disabled).toBe(true); expect((screen.getByRole('button', { name: 'Đã có mặt' }) as HTMLButtonElement).disabled).toBe(true); expect(a.ack).not.toHaveBeenCalled(); expect(a.present).not.toHaveBeenCalled();
});
it('validates a poll and closes its dialog after a confirmed save', async () => {
 await ready(); await action('Tạo bình chọn'); const d = screen.getByRole('dialog'); fireEvent.click(within(d).getByRole('button', { name: 'Tạo bình chọn' })); expect(await within(d).findByText('Vui lòng nhập câu hỏi bình chọn.')).toBeDefined();
 fireEvent.change(within(d).getByLabelText('Câu hỏi bình chọn'), { target: { value: 'Câu hỏi thật' } }); fireEvent.change(within(d).getByLabelText('Lựa chọn 1'), { target: { value: 'A' } }); fireEvent.change(within(d).getByLabelText('Lựa chọn 2'), { target: { value: 'B' } }); fireEvent.click(within(d).getByRole('button', { name: 'Tạo bình chọn' }));
 await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull()); expect(JSON.parse(a.post.mock.calls[0][1].metadataJson).options.map((v: { id: string }) => v.id)).toEqual(['0', '1']);
});
it('does not prefill bank data and splits VND remainders across actual members exactly', async () => {
 await ready(); await waitFor(() => expect(a.members).toHaveBeenCalled()); await action('Chia tiền (VietQR)'); const d = screen.getByRole('dialog'); expect((within(d).getByLabelText('Số tài khoản') as HTMLInputElement).value).toBe('');
 fireEvent.change(within(d).getByLabelText('Tên khoản chi'), { target: { value: 'Tiền ăn' } }); fireEvent.change(within(d).getByLabelText('Tổng số tiền (VND)'), { target: { value: '100001' } }); fireEvent.change(within(d).getByLabelText('Số tài khoản'), { target: { value: '1234567890' } }); fireEvent.click(within(d).getByRole('button', { name: /Gửi chia tiền/ }));
 await waitFor(() => expect(a.post).toHaveBeenCalled()); const payload = JSON.parse(a.post.mock.calls[0][1].metadataJson); expect(payload.participants).toEqual([{ userId: 42, displayName: 'Host', amount: 50001 }, { userId: 43, displayName: 'Member', amount: 50000 }]); expect(payload.paidUserIds).toEqual([]);
});
it('closes dialogs with Escape or a backdrop click', async () => { await ready(); await action('Tạo bình chọn'); fireEvent.keyDown(document, { key: 'Escape' }); expect(screen.queryByRole('dialog')).toBeNull(); await action('Phát thông báo nhóm'); fireEvent.pointerDown(screen.getByRole('dialog')); expect(screen.queryByRole('dialog')).toBeNull(); });
it('opens a real direct conversation under React Strict Mode without a disposed operation winning', async () => {
 render(<StrictMode><GroupChatHub /></StrictMode>); await screen.findByRole('button', {name:'Mở Nhóm DB 73'});
 fireEvent.click(screen.getByRole('button',{name:'Cuộc trò chuyện mới'})); fireEvent.change(screen.getByPlaceholderText('Nhập ít nhất 2 ký tự tên'),{target:{value:'Người nhận'}});
 fireEvent.click(await screen.findByRole('button',{name:/Người nhận DB/}));
 await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull()); expect(screen.getByRole('heading',{name:'Người nhận DB'})).toBeDefined();
});
it('hides broadcast and roll call actions for regular non-host members', async () => {
 a.groups.mockResolvedValue({ items: [{ ...group(), hostUserId: 999 }], nextBeforeGroupId: null });
 await ready();
 fireEvent.click(screen.getByRole('button', { name: 'Thêm tiện ích' }));
 expect(screen.getByRole('button', { name: 'Tạo bình chọn' })).toBeDefined();
 expect(screen.getByRole('button', { name: 'Chia tiền (VietQR)' })).toBeDefined();
 expect(screen.queryByRole('button', { name: 'Phát thông báo nhóm' })).toBeNull();
 expect(screen.queryByRole('button', { name: 'Tạo điểm danh' })).toBeNull();
});
it('skips fetching members when opening a closed group', async () => {
 a.groups.mockResolvedValue({ items: [group(73, 'Closed')], nextBeforeGroupId: null });
 await ready();
 expect(a.members).not.toHaveBeenCalled();
});
it('does not navigate or close a newer dialog when an abandoned start-DM completes late',async()=>{
 let finish!:(v:unknown)=>void;a.start.mockImplementation(()=>new Promise(r=>{finish=r;}));await ready();fireEvent.click(screen.getByRole('button',{name:'Cuộc trò chuyện mới'}));
 fireEvent.change(screen.getByPlaceholderText('Nhập ít nhất 2 ký tự tên'),{target:{value:'Người nhận'}});fireEvent.click(await screen.findByRole('button',{name:/Người nhận DB/}));
 fireEvent.click(screen.getByRole('button',{name:'Đóng'}));await action('Tạo bình chọn');
 finish({conversationId:60,otherUserId:99,displayName:'Người nhận DB',avatarUrl:null,lastMessage:null,lastMessageAtUtc:null,unreadCount:0});
 await waitFor(()=>expect(screen.getByRole('dialog').getAttribute('aria-labelledby')).toBe('create-poll-title'));
 expect(screen.getByRole('heading',{name:'Nhóm DB 73'})).toBeDefined();
});
