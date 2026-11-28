'use client';
import { useEffect, useRef, useState } from 'react';
import type { GroupMessageApiDto } from '../services/travelGroupApi';
import { editGroupMessage } from '../services/groupMessageToolsApi';
import type { BroadcastData, PollData, SplitBillData } from '../types/groupChatTypes';
import { metadataOf } from './MessageCard';
import { chatError } from './useMessenger';
import { CreatePollModal } from './CreatePollModal';
import { CreateExpenseModal } from './CreateExpenseModal';
import { BroadcastModal } from './BroadcastModal';
import { useChatDialog } from './useChatDialog';

export function EditGroupMessageDialog({ message, onClose, onSaved }: { message: GroupMessageApiDto; onClose: () => void; onSaved: (message: GroupMessageApiDto) => void }) {
  const data = metadataOf(message);
  const [error, setError] = useState('');
  const keys = useRef(new Map<string, string>());
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const save = async (content: string, metadata: object) => {
    setError('');
    const metadataJson = JSON.stringify(metadata), fingerprint = JSON.stringify({ content, metadataJson });
    const clientRequestId = keys.current.get(fingerprint) ?? crypto.randomUUID(); keys.current.set(fingerprint, clientRequestId);
    try { const result = await editGroupMessage(message.groupId, message.messageId, { content, metadataJson, expectedRevision: message.revision ?? 0, clientRequestId }, message.messageType); if (!alive.current) return false; onSaved(result); return true; }
    catch (e) { if (alive.current) setError(chatError(e)); return false; }
  };
  if (message.messageType === 'poll' && data && typeof data.question === 'string' && Array.isArray(data.options)
    && data.options.length >= 2 && data.options.every(o => o && typeof o === 'object' && typeof o.text === 'string')) {
    const initialData: PollData = { question: data.question, options: data.options.map((o, i) => ({ id: String(i), text: o.text, voterUserIds: [] })), totalVotes: Object.values(message.pollVoteCounts).reduce((a, b) => a + b, 0) };
    return <CreatePollModal title="Chỉnh sửa bình chọn" submitLabel="Lưu thay đổi" initialData={initialData} apiError={error} onClose={onClose} onSubmit={updated => save(updated.question, {
      ...data, question: updated.question,
      options: updated.options.map((option, index) => ({ ...(data.options as Record<string, unknown>[])[index], ...option,
        ...((data.options as Record<string, unknown>[])[index] ? { id: (data.options as Record<string, unknown>[])[index].id, voterUserIds: (data.options as Record<string, unknown>[])[index].voterUserIds } : {}) })),
    })} />;
  }
  if (message.messageType === 'broadcast' && data && typeof data.title === 'string' && typeof data.content === 'string') {
    const initialData: BroadcastData = { title: data.title, content: data.content, priority: data.priority === 'high' ? 'high' : 'normal', acknowledgedUserIds: [] };
    return <BroadcastModal title="Chỉnh sửa thông báo" submitLabel="Lưu thay đổi" initialData={initialData} apiError={error} onClose={onClose} onSubmit={updated => save(updated.title, updated)} />;
  }
  if (message.messageType === 'split_bill' && data && typeof data.title === 'string' && typeof data.payerName === 'string'
    && typeof data.payerBankName === 'string' && typeof data.payerBankAccount === 'string' && Number.isSafeInteger(data.totalAmount)
    && Array.isArray(data.participants) && data.participants.length > 0 && data.participants.every(p => p && typeof p === 'object' && Number.isSafeInteger(p.userId) && p.userId > 0 && typeof p.displayName === 'string')) {
    const participants = data.participants as { userId: number; displayName: string; amount: number }[];
    const initialData: SplitBillData = { title: data.title, payerName: data.payerName, payerBankName: data.payerBankName, payerBankAccount: data.payerBankAccount,
      totalAmount: data.totalAmount as number, perPersonAmount: Math.floor(Number(data.totalAmount) / participants.length), participantNames: participants.map(p => p.displayName), paidUserIds: message.paidUserIds };
    return <CreateExpenseModal title="Chỉnh sửa khoản chia tiền" submitLabel="Lưu thay đổi" initialData={initialData} apiError={error} currentUserName={data.payerName} memberCount={participants.length} onClose={onClose} onSubmit={updated => {
      const base = Math.floor(updated.totalAmount / participants.length), remainder = updated.totalAmount % participants.length;
      return save(updated.title, { ...updated, participants: participants.map((p, i) => ({ ...p, amount: base + (i < remainder ? 1 : 0) })) });
    }} />;
  }
  return <InvalidEdit onClose={onClose} />;
}
function InvalidEdit({ onClose }: { onClose: () => void }) {
  const ref = useChatDialog(onClose);
  return <div ref={ref} role="dialog" aria-modal="true" aria-label="Không thể chỉnh sửa" className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"><div className="w-full max-w-sm space-y-3 rounded-2xl bg-white p-4"><p role="alert" className="text-sm">Nội dung nhóm không hợp lệ để chỉnh sửa. Hãy tải lại tin nhắn hoặc liên hệ người quản lý nhóm.</p><button className="rounded-lg border border-brand-border px-3 py-2 text-sm" onClick={onClose}>Đóng</button></div></div>;
}
