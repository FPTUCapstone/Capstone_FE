import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { joinTravelGroup, TravelGroupHttpError } from './travelGroupApi';

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
