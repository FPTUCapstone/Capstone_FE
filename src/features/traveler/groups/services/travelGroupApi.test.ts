import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  acknowledgeBroadcastMessage,
  checkinRollCallMessage,
  fetchGroupMessages,
  joinTravelGroup,
  postGroupMessage,
  toggleExpensePaymentStatus,
  TravelGroupHttpError,
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

describe('travelGroupApi: group chat & interaction endpoints', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('fetchGroupMessages forwards limit & beforeMessageId query parameters', async () => {
    const sample = [
      {
        messageId: 10,
        groupId: 5,
        senderUserId: 1,
        senderName: 'Nam',
        messageType: 'text',
        content: 'Hello',
        createdAtUtc: '2026-11-23T08:00:00Z',
        readByCount: 0,
        isReadByMe: false,
        presentCount: 0,
        isPresentByMe: false,
        paidUserIds: [],
        pollVoteCounts: {},
      },
    ];
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => sample,
    } as unknown as Response);

    const res = await fetchGroupMessages(5, 25, 99);
    expect(res).toEqual(sample);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/travel-groups/5/messages?limit=25&beforeMessageId=99'),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('postGroupMessage returns created DTO and extracts ProblemDetails 400 error', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ messageId: 11, content: 'Hi' }),
    } as unknown as Response);

    const created = await postGroupMessage(5, { messageType: 'text', content: 'Hi' });
    expect(created.messageId).toBe(11);

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        title: 'Bad Request',
        detail: 'Content is required.',
        errorCode: 'travel_group.invalid_message_content',
      }),
    } as unknown as Response);

    try {
      await postGroupMessage(5, { messageType: 'text', content: '' });
      throw new Error('Expected error');
    } catch (err) {
      expect(err).toBeInstanceOf(TravelGroupHttpError);
      const httpErr = err as TravelGroupHttpError;
      expect(httpErr.status).toBe(400);
      expect(httpErr.message).toBe('Content is required.');
      expect(httpErr.code).toBe('travel_group.invalid_message_content');
    }
  });

  it('acknowledgeBroadcastMessage returns updated count and surfaces 404 ProblemDetails', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => 3,
    } as unknown as Response);

    await expect(acknowledgeBroadcastMessage(5, 11)).resolves.toBe(3);

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ detail: 'Message not found.', errorCode: 'travel_group.message_not_found' }),
    } as unknown as Response);

    await expect(acknowledgeBroadcastMessage(5, 999)).rejects.toMatchObject({
      status: 404,
      message: 'Message not found.',
      code: 'travel_group.message_not_found',
    });
  });

  it('checkinRollCallMessage returns count and surfaces 409 GroupClosed', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => 5,
    } as unknown as Response);

    await expect(checkinRollCallMessage(5, 12)).resolves.toBe(5);

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({ detail: 'Group closed.', errorCode: 'travel_group.group_closed' }),
    } as unknown as Response);

    await expect(checkinRollCallMessage(5, 12)).rejects.toMatchObject({
      status: 409,
      code: 'travel_group.group_closed',
    });
  });

  it('toggleExpensePaymentStatus posts isPaid flag and returns paidUserIds', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [1, 2],
    } as unknown as Response);

    await expect(toggleExpensePaymentStatus(5, 13, true)).resolves.toEqual([1, 2]);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/travel-groups/5/messages/13/toggle-payment'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ isPaid: true }),
      }),
    );
  });

  it('votePollOption returns counts and handles network 503 + malformed JSON 502', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ 1: 4 }),
    } as unknown as Response);

    await expect(votePollOption(5, 14, 1)).resolves.toEqual({ 1: 4 });

    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network down'));
    await expect(votePollOption(5, 14, 1)).rejects.toMatchObject({
      status: 503,
      code: 'network.unavailable',
    });

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('Unexpected token');
      },
    } as unknown as Response);

    await expect(votePollOption(5, 14, 1)).rejects.toMatchObject({
      status: 502,
      code: 'server.malformed_response',
    });
  });
});
