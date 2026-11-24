import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/features/auth/session/authSession', () => ({ AuthStorage: { getContext: () => ({ userId: 1, accessToken: 'test-access' }) } }));
import {
  acknowledgeBroadcastMessage,
  checkinRollCallMessage,
  fetchGroupMessages,
  joinTravelGroup,
  postGroupMessage,
  toggleExpensePaymentStatus,
  votePollOption,
} from './travelGroupApi';

describe('travelGroupApi: joinTravelGroup', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('throws validation error when code is empty', async () => {
    await expect(joinTravelGroup('   ')).rejects.toThrow('Trường này là bắt buộc.');
  });

  it('joins group successfully when response is 200', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        groupId: 42,
        groupName: 'Đà Lạt Mộng Mơ',
        itineraryId: 101,
      }),
    } as unknown as Response);

    const result = await joinTravelGroup('ABC123XY', {
      accessToken: 'test-token',
      idempotencyKey: 'test-key',
    });

    expect(result).toEqual({
      groupId: 42,
      groupName: 'Đà Lạt Mộng Mơ',
      itineraryId: 101,
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/travel-groups/join'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Idempotency-Key': 'test-key',
          Authorization: 'Bearer test-token',
        }),
        body: JSON.stringify({ invitationCode: 'ABC123XY' }),
      }),
    );
  });

  it('throws friendly message when user is already active member (409)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({
        errorCode: 'travel_group.already_active_member',
        groupId: 42,
      }),
    } as unknown as Response);

    await expect(joinTravelGroup('ABC123XY')).rejects.toThrow(
      'Bạn đã là thành viên của nhóm du lịch này.',
    );
  });

  it('throws friendly message when invitation code is unavailable/expired (400)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        errorCode: 'travel_group.invitation_unavailable',
      }),
    } as unknown as Response);

    await expect(joinTravelGroup('INVALID1')).rejects.toThrow(
      'Mã lời mời không hợp lệ, đã hết hạn hoặc không còn khả dụng.',
    );
  });

  it('throws network message on fetch failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

    await expect(joinTravelGroup('ABC123XY')).rejects.toThrow(
      'TripMate tạm thời không thể xử lý yêu cầu. Vui lòng kiểm tra kết nối và thử lại.',
    );
  });
});


const dto = { messageId: 10, groupId: 5, senderUserId: 1, senderName: 'Nam', messageType: 'text', content: 'Hello', createdAtUtc: '2026-11-23T08:00:00Z', readByCount: 0, isReadByMe: false, presentCount: 0, isPresentByMe: false, paidUserIds: [], pollVoteCounts: {}, myPollVoteOption: null };
afterEach(() => vi.unstubAllGlobals());
describe('real group chat API contract', () => {
 it('loads history with exact group ID and pagination cursor', async () => {
  const request=vi.fn().mockResolvedValue(new Response(JSON.stringify([dto])));vi.stubGlobal('fetch',request);
  expect(await fetchGroupMessages(5,25,99)).toEqual([dto]);expect(request.mock.calls[0][0]).toContain('/travel-groups/5/messages?limit=25&beforeMessageId=99');
 });
 it('keeps the server ID and sends the stable retry key', async () => {
  const request=vi.fn().mockResolvedValue(new Response(JSON.stringify(dto),{status:201}));vi.stubGlobal('fetch',request);
  expect(await postGroupMessage(5,{messageType:'text',content:'Hello',clientMessageId:'stable-key'})).toEqual(dto);
  expect(JSON.parse(request.mock.calls[0][1].body)).toEqual({messageType:'text',content:'Hello',clientMessageId:'stable-key'});
 });
 it('does not accept history or a created message from another group', async () => {
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify([{...dto,groupId:6}]))));
  await expect(fetchGroupMessages(5)).rejects.toMatchObject({status:502});
 });
 it('uses zero-based vote indices and explicit cancellation', async () => {
  const request=vi.fn().mockImplementation(()=>Promise.resolve(new Response('{}')));vi.stubGlobal('fetch',request);
  await votePollOption(5,10,0);await votePollOption(5,10,-1);
  expect(JSON.parse(request.mock.calls[0][1].body)).toEqual({optionIndex:0});expect(JSON.parse(request.mock.calls[1][1].body)).toEqual({optionIndex:-1});
 });
 it('confirms receipts and attendance against real message IDs',async()=>{
  const request=vi.fn().mockImplementation(()=>Promise.resolve(new Response('2')));vi.stubGlobal('fetch',request);
  expect(await acknowledgeBroadcastMessage(5,10)).toBe(2);expect(await checkinRollCallMessage(5,11)).toBe(2);
  expect(request.mock.calls[0][0]).toContain('/5/messages/10/acknowledge');expect(request.mock.calls[1][0]).toContain('/5/messages/11/checkin');
 });
 it('does not silently mark a payment when persistence fails',async()=>{
  const request=vi.fn().mockResolvedValue(new Response('{}',{status:503}));vi.stubGlobal('fetch',request);
  await expect(toggleExpensePaymentStatus(5,10,true)).rejects.toMatchObject({status:503});expect(request).toHaveBeenCalledTimes(1);
 });
 it('explains denied access even with a malformed error body',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('null',{status:403})));
  await expect(fetchGroupMessages(5)).rejects.toMatchObject({status:403});
 });
});
