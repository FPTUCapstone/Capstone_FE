'use client';
import type { GroupMessageApiDto } from '../services/travelGroupApi';
import type { SplitBillData } from '../types/groupChatTypes';
import type { Message, Thread } from './useMessenger';

export function metadataOf(message: Message): Record<string, unknown> | null {
  if (!('metadataJson' in message) || !message.metadataJson) return null;
  try { const data: unknown = JSON.parse(message.metadataJson); return data && typeof data === 'object' && !Array.isArray(data) ? data as Record<string, unknown> : null; }
  catch { return null; }
}
const money = (n: number) => `${n.toLocaleString('vi-VN')} đ`;
const label = (v: unknown, fallback = '') => typeof v === 'string' ? v : fallback;
export function messageTime(value: string) { return new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' }).format(new Date(value)); }
export function MessageCard({ message: m, thread, userId, busy, onInteract, onQr }: {
  message: Message; thread: Thread; userId: number; busy: boolean;
  onInteract: (message: GroupMessageApiDto, action: 'read' | 'present' | 'paid' | 'vote', option?: number) => void;
  onQr: (data: SplitBillData, message: GroupMessageApiDto) => void;
}) {
  const self = m.senderUserId === userId;
  const group = 'groupId' in m ? m : null;
  const data = metadataOf(m);
  const button = 'rounded-xl border border-brand-border bg-white px-3 py-2 text-sm font-semibold text-brand-navy focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-60';
  let card;
  if (group?.messageType === 'poll' && data && Array.isArray(data.options) && data.options.length >= 2 && data.options.every(o => o && typeof o === 'object' && typeof o.text === 'string')) {
    const options = data.options as { text: string }[];
    const total = Object.values(group.pollVoteCounts).reduce((sum, n) => sum + n, 0);
    card = <div className="space-y-3"><h3 className="font-bold">{label(data.question, m.content)}</h3>{options.map((o, index) => <button key={index} type="button" className={`${button} block w-full text-left ${group.myPollVoteOption === index ? 'ring-2 ring-brand-teal' : ''}`} disabled={busy || thread.group?.status !== 'Active'} aria-pressed={group.myPollVoteOption === index} onClick={() => onInteract(group, 'vote', group.myPollVoteOption === index ? -1 : index)}>{o.text}<span className="ml-2 text-xs text-brand-textSecondary">{group.pollVoteCounts[index] ?? 0} phiếu ({total ? Math.round((group.pollVoteCounts[index] ?? 0) * 100 / total) : 0}%)</span></button>)}<p className="text-xs text-brand-textSecondary">{total} phiếu · Bấm lại lựa chọn của bạn để hủy phiếu.</p></div>;
  } else if (group?.messageType === 'broadcast' && data) {
    card = <div className="space-y-3"><p className="text-xs font-bold uppercase">Thông báo nhóm</p><h3 className="font-bold">{label(data.title, m.content)}</h3><p className="whitespace-pre-wrap break-words">{label(data.content, m.content)}</p><button className={button} disabled={busy || group.isReadByMe || thread.group?.status !== 'Active'} onClick={() => onInteract(group, 'read')}>{group.isReadByMe ? 'Đã xác nhận đã đọc' : 'Tôi đã đọc và hiểu'}</button><p className="text-xs">{group.readByCount} người đã xác nhận</p></div>;
  } else if (group?.messageType === 'roll_call' && data) {
    card = <div className="space-y-3"><p className="text-xs font-bold uppercase">Điểm danh nhóm</p><h3 className="font-bold">{label(data.title, m.content)}</h3>{typeof data.deadlineTime === 'string' && <p>{data.deadlineTime}</p>}<button className={button} disabled={busy || group.isPresentByMe || thread.group?.status !== 'Active'} onClick={() => onInteract(group, 'present')}>{group.isPresentByMe ? 'Đã có mặt' : 'Xác nhận có mặt'}</button><p className="text-xs">{group.presentCount}/{thread.group?.memberCount} thành viên có mặt</p></div>;
  } else if (group?.messageType === 'split_bill' && data) {
    const rows = Array.isArray(data.participants) ? data.participants : [];
    const participants = rows.filter((p): p is { userId: number; displayName: string; amount: number } => !!p && typeof p === 'object'
      && Number.isSafeInteger(p.userId) && p.userId > 0 && Number.isSafeInteger(p.amount) && p.amount >= 0 && typeof p.displayName === 'string');
    const share = participants.find(p => p.userId === userId);
    const total = Number(data.totalAmount);
    const valid = Number.isSafeInteger(total) && total > 0 && participants.length > 0 && participants.length === rows.length
      && participants.every(p => Number.isSafeInteger(p.userId) && p.userId > 0 && Number.isSafeInteger(p.amount) && p.amount >= 0 && typeof p.displayName === 'string')
      && new Set(participants.map(p => p.userId)).size === participants.length && participants.reduce((sum, p) => sum + p.amount, 0) === total
      && typeof data.payerBankAccount === 'string' && /^\d{6,30}$/.test(data.payerBankAccount)
      && typeof data.payerBankName === 'string' && typeof data.payerName === 'string';
    const paid = group.paidUserIds.includes(userId);
    card = <div className="space-y-3"><p className="text-xs font-bold uppercase">Chia tiền chuyến đi</p><h3 className="font-bold">{label(data.title, m.content)}</h3>{Number.isFinite(total) && <p>Tổng: {money(total)}</p>}{valid && share ? <><p>Phần của bạn: <strong>{money(share.amount)}</strong></p><button className={button} disabled={busy || paid || share.amount === 0 || thread.group?.status !== 'Active'} onClick={() => onQr({ title: label(data.title, m.content), payerName: label(data.payerName), payerBankName: label(data.payerBankName), payerBankAccount: label(data.payerBankAccount), totalAmount: total, perPersonAmount: share.amount, participantNames: participants.map(p => p.displayName), paidUserIds: group.paidUserIds }, group)}>{paid ? 'Bạn đã đánh dấu chuyển tiền' : 'Quét VietQR chuyển tiền'}</button></> : <p className="text-sm text-brand-textSecondary">Không có phần chia hợp lệ cho bạn. Hãy liên hệ người lập khoản chi.</p>}<p className="text-xs">{group.paidUserIds.length} người đã đánh dấu chuyển tiền. Đây là xác nhận của thành viên, không phải xác minh từ ngân hàng.</p></div>;
  }
  return <article data-message-id={m.messageId} className={`flex ${self ? 'justify-end' : 'justify-start'}`}>
    <div className={`min-w-0 max-w-[90%] rounded-2xl px-4 py-3 text-sm shadow-sm sm:max-w-[75%] ${card ? 'w-full border border-brand-border bg-white text-brand-textPrimary' : self ? 'bg-brand-navy text-white' : 'border border-brand-border bg-white text-brand-textPrimary'}`}>
      <p className={`mb-1 text-xs font-semibold ${self && !card ? 'text-white/80' : 'text-brand-textSecondary'}`}>{m.senderName}{thread.group?.hostUserId === m.senderUserId ? ' · Trưởng nhóm' : ''}</p>
      {card ?? <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{m.content}</p>}
      <p className={`mt-2 text-right text-[11px] ${self && !card ? 'text-white/75' : 'text-brand-textSecondary'}`}><time dateTime={m.createdAtUtc}>{messageTime(m.createdAtUtc)}</time>{self && !group ? ('isReadByOther' in m && m.isReadByOther ? ' · Đã đọc' : ' · Đã gửi') : ''}</p>
    </div>
  </article>;
}
