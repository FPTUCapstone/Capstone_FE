export type OperatorContractStatus = 'PendingSignature' | 'Signed' | 'Voided';
export type OperatorContractDocumentState = 'NeedsSignerDetails' | 'Processing' | 'Ready' | 'Failed';
export interface OperatorContract {
  id: string; status: OperatorContractStatus; documentState: OperatorContractDocumentState; title: string; templateVersion: number;
  companyName: string; taxCode: string; businessLicenseNo: string; businessAddress: string; operatorEmail: string;
  signerName: string; signerTitle: string; signerCapacity: string;
  acceptedContentSha256: string | null; unsignedDocumentSha256: string | null; signedDocumentSha256: string | null;
  rowVersion: string; canPrepare: boolean; canSign: boolean; approvedAtUtc: string; signedAtUtc: string | null; errorCode: string | null;
  otpPolicy: { timeToLiveSeconds: number; resendCooldownSeconds: number; maxFailedAttempts: number; consentVersion: string };
}
export interface PrepareContractInput { signerName: string; signerTitle: string; signerCapacity: string; rowVersion: string }
export interface ContractChallengeInput { expectedContentSha256: string; rowVersion: string }
export interface ContractChallenge { challengeId: string; expiresAtUtc: string; resendAtUtc: string; rowVersion: string; maskedEmail: string }
export interface SignContractInput { expectedContentSha256: string; rowVersion: string; signerName: string; acceptedTerms: boolean; consentVersion: string; challengeId: string; otp: string; idempotencyKey: string }
export class OperatorContractError extends Error {
  constructor(public readonly status: number, public readonly code?: string, public readonly retryAfterSeconds?: number) {
    super(status === 401 ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
      : status === 403 ? 'Bạn không có quyền thực hiện thao tác này.'
      : status === 404 ? 'Chưa có hợp đồng được phát hành cho tài khoản này.'
      : status === 409 ? 'Trạng thái hợp đồng đã thay đổi. Vui lòng xem lại bản mới nhất.'
      : status === 429 ? 'Bạn gửi yêu cầu quá nhanh. Vui lòng chờ trước khi thử lại.'
      : code?.includes('otp') || code?.includes('challenge') ? 'OTP chưa hợp lệ, đã hết hạn hoặc đã hết lượt thử. Kiểm tra mã hoặc yêu cầu mã mới.'
      : code?.includes('signature') ? 'Ảnh chữ ký chưa hợp lệ. Vui lòng xóa và vẽ lại chữ ký rõ nét.'
      : status === 413 ? 'Ảnh chữ ký quá lớn. Vui lòng xóa và ký lại.'
      : status === 400 || status === 422 ? 'Thông tin ký chưa hợp lệ. Vui lòng kiểm tra họ tên, xác nhận đồng ý và OTP.'
      : 'Chưa thể xử lý hợp đồng. Vui lòng thử lại.');
  }
}
const base = '/api/operator/contracts';
async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try { response = await fetch(url, { ...init, cache: 'no-store', credentials: 'same-origin' }); }
  catch { throw new OperatorContractError(503); }
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new OperatorContractError(response.status, data?.errorCode, data?.retryAfterSeconds);
  if (!data) throw new OperatorContractError(503);
  return data as T;
}
function post<T>(id: string, action: string, input: object) {
  return request<T>(`${base}/${encodeURIComponent(id)}/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
}
export const getCurrentContract = (signal?: AbortSignal) => request<OperatorContract>(`${base}/current`, { signal });
export const prepareContract = (id: string, input: PrepareContractInput) => post<OperatorContract>(id, 'prepare', input);
export const requestSigningChallenge = (id: string, input: ContractChallengeInput) => post<ContractChallenge>(id, 'signing-challenges', input);
export function signContract(id: string, input: SignContractInput, signature: Blob) {
  const body = new FormData();
  for (const [name, value] of Object.entries(input)) body.set(name, String(value));
  body.set('signature', signature, 'signature.png');
  return request<OperatorContract>(`${base}/${encodeURIComponent(id)}/sign`, { method: 'POST', body });
}
export const contractDocumentUrl = (id: string, kind: 'unsigned' | 'signed') => `${base}/${encodeURIComponent(id)}/documents/${kind}`;
export async function getContractPdf(id: string, kind: 'unsigned' | 'signed', signal?: AbortSignal): Promise<Blob> {
  let response: Response;
  try { response = await fetch(`${contractDocumentUrl(id, kind)}?format=preview`, { headers: { Accept: 'application/json' }, credentials: 'same-origin', cache: 'no-store', signal }); }
  catch { throw new OperatorContractError(503); }
  if (!response.ok) { const data = await response.json().catch(() => null); throw new OperatorContractError(response.status, data?.errorCode); }
  try {
    const data: unknown = await response.json();
    if (!data || typeof data !== 'object' || !('contentBase64' in data) || !('contentType' in data) ||
        data.contentType !== 'application/pdf' || typeof data.contentBase64 !== 'string' ||
        data.contentBase64.length > 70 * 1024 * 1024) throw new Error();
    const decoded = atob(data.contentBase64);
    if (!decoded.startsWith('%PDF-')) throw new Error();
    const bytes = Uint8Array.from(decoded, character => character.charCodeAt(0));
    return new Blob([bytes], { type: 'application/pdf' });
  } catch { throw new OperatorContractError(503, 'operator_contract.pdf_preview_invalid'); }
}
export function contractDateTime(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '—';
  return `${new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' }).format(date)} ${new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Ho_Chi_Minh' }).format(date)}`;
}
