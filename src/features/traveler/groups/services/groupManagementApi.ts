import { AuthStorage } from '@/features/auth/session/authSession';
import { getApiBase } from '@/lib/apiBase';
import type { Thread } from '../components/useMessenger';
import { chatRequest, TravelGroupHttpError } from './travelGroupApi';

type Action = 'rename' | 'remove' | 'dissolve';
// Travel member removal has a durable operation receipt; retain its key after a lost response.
const removalKeys = new Map<string, string>();
async function manage(thread: Thread, action: Action, name?: string, memberId?: number): Promise<void> {
  const actor = AuthStorage.getContext();
  if (!actor) throw new TravelGroupHttpError(401, 'Vui lòng đăng nhập lại để quản lý nhóm.', 'auth.unauthorized');
  if (actor.status !== 'Active' || (!thread.chatGroup && actor.role !== 'Traveler'))
    throw new TravelGroupHttpError(403, 'Tài khoản không có quyền quản lý nhóm này.', 'auth.forbidden');
  if (thread.kind !== 'group' || !Number.isSafeInteger(thread.id) || thread.id <= 0)
    throw new TravelGroupHttpError(400, 'Nhóm không hợp lệ. Vui lòng tải lại danh sách.', 'validation.group');
  if (thread.isClosed || thread.group?.status === 'Closed')
    throw new TravelGroupHttpError(409, 'Nhóm đã giải tán. Bạn chỉ có thể xem lịch sử.', 'group.closed');
  const normalized = name?.trim();
  const limit = thread.chatGroup ? 100 : 150;
  if (action === 'rename' && (!normalized || normalized.length > limit))
    throw new TravelGroupHttpError(400, 'Tên nhóm cần có từ 1 đến ' + limit + ' ký tự.', 'validation.name');
  if (action === 'remove' && (!Number.isSafeInteger(memberId) || !memberId || memberId <= 0 || memberId === actor.userId))
    throw new TravelGroupHttpError(400, 'Chọn một thành viên khác để xóa khỏi nhóm.', 'validation.member');
  const kind = thread.chatGroup ? 'chat-groups' : 'travel-groups';
  const key = JSON.stringify([actor.userId, kind, thread.id, action, memberId ?? null]);
  let requestKey: string | undefined;
  if (action === 'remove' && !thread.chatGroup) {
    requestKey = removalKeys.get(key) ?? crypto.randomUUID();
    removalKeys.set(key, requestKey);
  }
  const route = action === 'rename' ? '/name' : action === 'remove' ? '/members/' + memberId : '/dissolve';
  const abort = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      chatRequest<unknown>(getApiBase() + '/' + kind + '/' + thread.id + route,
        action === 'rename' ? 'PUT' : action === 'remove' ? 'DELETE' : 'POST',
        action === 'rename' ? { name: normalized } : undefined, abort.signal,
        requestKey ? { 'Idempotency-Key': requestKey } : undefined),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => { abort.abort(); reject(new TravelGroupHttpError(504,
          'Chưa xác nhận được kết quả. Vui lòng tải lại nhóm trước khi thử lại.', 'network.timeout')); }, 20000);
      }),
    ]);
    removalKeys.delete(key);
  } catch (error) {
    if (!(error instanceof TravelGroupHttpError)) throw error;
    const messages: Record<number, string> = {
      400: 'Thông tin quản lý nhóm không hợp lệ. Vui lòng kiểm tra lại.',
      403: 'Chỉ trưởng nhóm đang hoạt động mới được thực hiện thao tác này.',
      404: 'Nhóm hoặc thành viên không còn khả dụng. Vui lòng tải lại.',
      409: action === 'dissolve' && thread.group?.itinerarySourceType === 'BookedTour'
        ? 'Nhóm gắn với tour đã đặt phải tuân theo vòng đời chuyến đi; không thể giải tán tại đây.'
        : 'Nhóm đã thay đổi hoặc không còn cho phép thao tác này. Vui lòng tải lại.',
    };
    throw new TravelGroupHttpError(error.status, messages[error.status] ?? error.message, error.code);
  } finally { if (timer) clearTimeout(timer); }
}
export const renameMessengerGroup = (thread: Thread, name: string): Promise<void> => manage(thread, 'rename', name);
export const removeMessengerGroupMember = (thread: Thread, memberId: number): Promise<void> => manage(thread, 'remove', undefined, memberId);
export const dissolveMessengerGroup = (thread: Thread): Promise<void> => manage(thread, 'dissolve');
