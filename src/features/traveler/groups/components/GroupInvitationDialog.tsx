'use client';
import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { getApiBase } from '@/lib/apiBase';
import { chatRequest } from '../services/travelGroupApi';
import { chatError } from './useMessenger';
import { useChatDialog } from './useChatDialog';
interface Invitation { groupId: number; groupName: string; inviteCode: string; qrData: string; expiresAt: string }
export function GroupInvitationDialog({ groupId, onClose }: { groupId: number; onClose: () => void }) {
  const ref=useChatDialog(onClose);
  const key=useRef<string | null>(null);
  const [data,setData]=useState<Invitation | null>(null);
  const [error,setError]=useState('');const [copied,setCopied]=useState(false);const [revision,setRevision]=useState(0);
  useEffect(()=>{const abort=new AbortController();key.current ??= crypto.randomUUID();
    chatRequest<Invitation>(`${getApiBase()}/travel-groups/${groupId}/invitation`,'POST',undefined,abort.signal,{'Idempotency-Key':key.current})
      .then(value=>{if(value.groupId!==groupId||typeof value.inviteCode!=='string'||!value.inviteCode||typeof value.qrData!=='string'||!Number.isFinite(Date.parse(value.expiresAt)))throw Error('Invalid invitation');if(!abort.signal.aborted)setData(value);})
      .catch(e=>{if(!abort.signal.aborted)setError(chatError(e));});return()=>abort.abort();},[groupId,revision]);
  return <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="group-invitation-title" className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><div className="max-h-[85dvh] w-full max-w-sm space-y-4 overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"><header className="flex items-center justify-between gap-3"><h2 id="group-invitation-title" className="font-bold">Mời vào nhóm du lịch</h2><button className="rounded-lg border border-brand-border px-3 py-2 text-sm" onClick={onClose}>Đóng</button></header><p className="text-sm text-brand-textSecondary">Gửi mã hoặc QR cho người cùng chuyến đi. Trong Tin nhắn, chọn Nhập mã để tham gia nhóm.</p>{error&&!data?<div role="alert" className="text-sm text-red-700">{error}<button className="ml-2 underline" onClick={()=>{setError('');setRevision(v=>v+1);}}>Thử lại</button></div>:!data?<p role="status">Đang lấy mã mời…</p>:<>{error&&<p role="alert" className="text-sm text-red-700">{error}</p>}<div className="flex justify-center"><QRCodeSVG value={data.qrData} size={160}/></div><label className="block text-sm">Mã mời<input readOnly value={data.inviteCode} className="mt-2 w-full rounded-xl border border-brand-border p-3 font-mono text-sm" onFocus={e=>e.target.select()}/></label><button className="w-full rounded-xl bg-brand-teal px-4 py-2 text-sm font-semibold text-white" onClick={async()=>{try{await navigator.clipboard.writeText(data.inviteCode);setCopied(true);}catch{setError('Không thể tự sao chép. Bạn có thể chọn mã và sao chép thủ công.');}}}>{copied?'Đã sao chép':'Sao chép mã mời'}</button><p className="text-xs text-brand-textSecondary">Hết hạn: {new Intl.DateTimeFormat('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',dateStyle:'short',timeStyle:'short'}).format(new Date(data.expiresAt))}</p></>}</div></div>;
}
