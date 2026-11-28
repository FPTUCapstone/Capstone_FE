import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OperatorContractPage } from './OperatorContractPage';
import type { OperatorContract } from './operatorContracts';
// These signing cases represent a newly approved operator awaiting signature.
vi.mock('@/features/auth/session/useWebSession', () => ({ useWebSession: () => ({ context: { onboardingState: 'AwaitingSignature' } }) }));
vi.mock('next/link', () => ({ default: ({ children, ...props }: React.ComponentProps<'a'>) => <a {...props}>{children}</a> }));
vi.mock('@/components/layout/PartnerShell', () => ({ PartnerShell: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
vi.mock('@/lib/authApi', () => ({ webRefresh: vi.fn() }));
vi.mock('./SignaturePad', () => ({ SignaturePad: ({ onChange, disabled }: { onChange: (value: Blob) => void; disabled?: boolean }) => <button disabled={disabled} onClick={() => onChange(new Blob(['png'], { type: 'image/png' }))}>Vẽ chữ ký thử</button> }));
vi.mock('./operatorContracts', async (original) => ({ ...await original<typeof import('./operatorContracts')>(), getCurrentContract: vi.fn(), prepareContract: vi.fn(), requestSigningChallenge: vi.fn(), signContract: vi.fn(), getContractPdf: vi.fn() }));
import { getCurrentContract, getContractPdf, prepareContract, requestSigningChallenge, signContract, OperatorContractError } from './operatorContracts';
import { webRefresh } from '@/lib/authApi';
const contract: OperatorContract = { id: '2', status: 'PendingSignature', documentState: 'Ready', title: 'Hợp đồng đối tác', templateVersion: 1,
  companyName: 'Công ty mẫu', taxCode: '0000000000', businessLicenseNo: 'TEST', businessAddress: 'Đà Nẵng', operatorEmail: 'operator@example.test',
  signerName: 'Nguyễn Văn A', signerTitle: 'Giám đốc', signerCapacity: 'Đại diện pháp luật', acceptedContentSha256: 'abc', unsignedDocumentSha256: 'abc', signedDocumentSha256: null,
  rowVersion: 'AQ==', canPrepare: false, canSign: true, approvedAtUtc: '2026-11-24T00:00:00Z', signedAtUtc: null, errorCode: null,
  otpPolicy: { timeToLiveSeconds: 180, resendCooldownSeconds: 60, maxFailedAttempts: 5, consentVersion: 'operator-contract-v1' } };
beforeEach(() => {
  vi.clearAllMocks(); vi.mocked(getCurrentContract).mockResolvedValue(contract);
  vi.mocked(getContractPdf).mockResolvedValue(new Blob(['%PDF-test'], { type: 'application/pdf' }));
  vi.mocked(requestSigningChallenge).mockResolvedValue({ challengeId: 'challenge-1', expiresAtUtc: new Date(Date.now() + 180000).toISOString(), resendAtUtc: new Date(Date.now() + 60000).toISOString(), rowVersion: 'Ag==', maskedEmail: 'o***@example.test' });
  vi.mocked(webRefresh).mockResolvedValue({} as Awaited<ReturnType<typeof webRefresh>>);
  URL.createObjectURL = vi.fn(() => 'blob:contract'); URL.revokeObjectURL = vi.fn();
});
async function fillSigning() {
  await screen.findByTitle('Nội dung hợp đồng');
  fireEvent.click(screen.getByLabelText(/Tôi đã đọc toàn bộ/));
  fireEvent.change(screen.getByLabelText('Họ tên xác nhận ký'), { target: { value: 'Nguyễn Văn A' } });
  fireEvent.click(screen.getByRole('button', { name: 'Vẽ chữ ký thử' }));
  fireEvent.click(screen.getByRole('button', { name: 'Gửi OTP qua email' }));
  await screen.findByText(/o\*\*\*@example.test/);
  fireEvent.change(screen.getByLabelText('Mã OTP'), { target: { value: '123456' } });
}
describe('operator contract viewer and signing', () => {
  it('collects signer identity before freezing the document and never assumes contact person authority', async () => {
    vi.mocked(getCurrentContract).mockResolvedValue({ ...contract, canPrepare: true, canSign: false, documentState: 'NeedsSignerDetails', signerName: '', signerTitle: '', signerCapacity: '', acceptedContentSha256: null });
    vi.mocked(prepareContract).mockResolvedValue({ ...contract, documentState: 'Processing', canSign: false });
    render(<OperatorContractPage />);
    const name = await screen.findByLabelText('Họ tên người đại diện'); expect((name as HTMLInputElement).value).toBe('');
    fireEvent.change(name, { target: { value: 'Nguyễn Văn A' } });
    fireEvent.change(screen.getByLabelText('Chức vụ'), { target: { value: 'Giám đốc' } });
    fireEvent.change(screen.getByLabelText('Tư cách đại diện hoặc căn cứ ủy quyền'), { target: { value: 'Đại diện pháp luật' } });
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận thông tin và tạo hợp đồng' }));
    await waitFor(() => expect(prepareContract).toHaveBeenCalledWith('2', { signerName: 'Nguyễn Văn A', signerTitle: 'Giám đốc', signerCapacity: 'Đại diện pháp luật', rowVersion: 'AQ==' }));
    expect(await screen.findByText(/Đang tạo bản hợp đồng/)).toBeTruthy();
  });
  it('requires the current PDF, acknowledgement, signature, matching full name and OTP', async () => {
    render(<OperatorContractPage />); await screen.findByTitle('Nội dung hợp đồng');
    expect((screen.getByRole('button', { name: 'Xác nhận ký hợp đồng' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole('link', { name: 'Tải hợp đồng chưa ký' }).getAttribute('href')).toContain('/documents/unsigned');
    await fillSigning();
    expect((screen.getByRole('button', { name: 'Xác nhận ký hợp đồng' }) as HTMLButtonElement).disabled).toBe(false);
    expect((screen.getByRole('button', { name: /Gửi lại OTP/ }) as HTMLButtonElement).disabled).toBe(true);
  });
  it('submits once using the challenge row version and refreshes the real session after signed success', async () => {
    let resolve!: (value: OperatorContract) => void;
    vi.mocked(signContract).mockImplementation(() => new Promise((done) => { resolve = done; }));
    render(<OperatorContractPage />); await fillSigning();
    const submit = screen.getByRole('button', { name: 'Xác nhận ký hợp đồng' }); fireEvent.click(submit); fireEvent.click(submit);
    await waitFor(() => expect(signContract).toHaveBeenCalledTimes(1));
    expect(vi.mocked(signContract).mock.calls[0][1]).toMatchObject({ rowVersion: 'Ag==', expectedContentSha256: 'abc', signerName: 'Nguyễn Văn A', otp: '123456', challengeId: 'challenge-1', acceptedTerms: true, consentVersion: 'operator-contract-v1' });
    await act(async () => resolve({ ...contract, status: 'Signed', canSign: false, signedAtUtc: '2026-11-24T01:00:00Z', signedDocumentSha256: 'signed-hash' }));
    expect(await screen.findByText('Hợp đồng đã ký thành công.')).toBeTruthy();
    await waitFor(() => expect(webRefresh).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('button', { name: 'Xác nhận ký hợp đồng' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Tải hợp đồng đã ký' })).toBeTruthy();
  });
  it('reloads metadata and clears stale signing input on a conflict', async () => {
    vi.mocked(signContract).mockRejectedValue(new OperatorContractError(409, 'operator_contract.version_changed'));
    render(<OperatorContractPage />); await fillSigning();
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận ký hợp đồng' }));
    await waitFor(() => expect(getCurrentContract).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect((screen.getByLabelText('Mã OTP') as HTMLInputElement).value).toBe('');
  });
  it('recovers a committed signature after the response is lost instead of signing twice', async () => {
    vi.mocked(signContract).mockRejectedValue(new OperatorContractError(503));
    vi.mocked(getCurrentContract).mockResolvedValueOnce(contract).mockResolvedValueOnce({ ...contract, status: 'Signed', canSign: false, signedDocumentSha256: 'signed' });
    render(<OperatorContractPage />); await fillSigning(); fireEvent.click(screen.getByRole('button', { name: 'Xác nhận ký hợp đồng' }));
    expect(await screen.findByText('Hợp đồng đã ký thành công.')).toBeTruthy();
    expect(signContract).toHaveBeenCalledTimes(1);
  });
  it('shows an honest missing-contract state without constructing a demo contract', async () => {
    vi.mocked(getCurrentContract).mockRejectedValue(new OperatorContractError(404)); render(<OperatorContractPage />);
    expect(await screen.findByText('Chưa có hợp đồng được phát hành cho tài khoản này.')).toBeTruthy();
    expect(getContractPdf).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Vẽ chữ ký thử' })).toBeNull();
  });
  it('retains the idempotency key for the same uncertain request and changes it when the OTP changes', async () => {
    vi.mocked(signContract).mockRejectedValue(new OperatorContractError(503));
    render(<OperatorContractPage />); await fillSigning();
    const submit = screen.getByRole('button', { name: 'Xác nhận ký hợp đồng' }); fireEvent.click(submit);
    await screen.findByRole('alert'); await waitFor(() => expect((submit as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(submit); await waitFor(() => expect(signContract).toHaveBeenCalledTimes(2));
    await waitFor(() => expect((submit as HTMLButtonElement).disabled).toBe(false));
    expect(vi.mocked(signContract).mock.calls[1][1].idempotencyKey).toBe(vi.mocked(signContract).mock.calls[0][1].idempotencyKey);
    fireEvent.change(screen.getByLabelText('Mã OTP'), { target: { value: '654321' } }); fireEvent.click(submit);
    await waitFor(() => expect(signContract).toHaveBeenCalledTimes(3));
    expect(vi.mocked(signContract).mock.calls[2][1].idempotencyKey).not.toBe(vi.mocked(signContract).mock.calls[0][1].idempotencyKey);
  });
  it('does not accept an expired OTP or a mismatched signer name', async () => {
    vi.mocked(requestSigningChallenge).mockResolvedValue({ challengeId: 'expired', expiresAtUtc: new Date(Date.now() - 1000).toISOString(), resendAtUtc: new Date(Date.now() - 1000).toISOString(), rowVersion: 'Ag==', maskedEmail: 'o***@example.test' });
    render(<OperatorContractPage />); await fillSigning();
    expect(screen.getByText('OTP đã hết hạn. Vui lòng yêu cầu mã mới.')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Xác nhận ký hợp đồng' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Họ tên xác nhận ký'), { target: { value: 'Người khác' } });
    expect(screen.getByText('Họ tên phải khớp người đại diện ghi trên hợp đồng.')).toBeTruthy();
    expect(signContract).not.toHaveBeenCalled();
  });
  it('keeps signing disabled when the private PDF could not be loaded', async () => {
    vi.mocked(getContractPdf).mockRejectedValue(new OperatorContractError(503));
    render(<OperatorContractPage />); await screen.findByRole('alert');
    expect((screen.getByRole('button', { name: 'Xác nhận ký hợp đồng' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Gửi OTP qua email' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByText('Đang tải PDF riêng tư…')).toBeNull();
  });
});
