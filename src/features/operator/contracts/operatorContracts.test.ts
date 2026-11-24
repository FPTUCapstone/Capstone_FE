import { afterEach, describe, expect, it, vi } from 'vitest';
import { getContractPdf, getCurrentContract, prepareContract, requestSigningChallenge, signContract, OperatorContractError } from './operatorContracts';

afterEach(() => vi.unstubAllGlobals());
describe('operator contract transport', () => {
  it('receives the private preview as JSON and reconstructs its exact PDF bytes', async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ contentType: 'application/pdf', contentBase64: 'JVBERi10ZXN0' }));
    vi.stubGlobal('fetch', fetcher);
    const blob = await getContractPdf('2', 'unsigned');
    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBe(9);
    expect(fetcher.mock.calls[0][0]).toContain('?format=preview');
  });
  it('does not treat a missing contract as a signed or mock contract', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ errorCode: 'operator_contract.not_found' }, { status: 404 })));
    await expect(getCurrentContract()).rejects.toMatchObject({ status: 404 });
  });
  it('binds preparation and OTP challenge to the expected row version and accepted document hash', async () => {
    const fetch = vi.fn().mockImplementation(async () => Response.json({ id: '1' })); vi.stubGlobal('fetch', fetch);
    await prepareContract('1', { signerName: 'Nguyễn Văn A', signerTitle: 'Giám đốc', signerCapacity: 'Đại diện pháp luật', rowVersion: 'AQ==' });
    await requestSigningChallenge('1', { expectedContentSha256: 'hash', rowVersion: 'Ag==' });
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ signerName: 'Nguyễn Văn A', signerTitle: 'Giám đốc', signerCapacity: 'Đại diện pháp luật', rowVersion: 'AQ==' });
    expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual({ expectedContentSha256: 'hash', rowVersion: 'Ag==' });
  });
  it('sends the PNG with consent, OTP, document hash and a stable idempotency key without an operator ID', async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({ status: 'Signed' })); vi.stubGlobal('fetch', fetch);
    await signContract('1', { expectedContentSha256: 'hash', rowVersion: 'AQ==', signerName: 'Nguyễn Văn A', acceptedTerms: true,
      consentVersion: 'consent-v1', challengeId: 'challenge-id', otp: '123456', idempotencyKey: 'operation-1' }, new Blob(['png'], { type: 'image/png' }));
    const form = fetch.mock.calls[0][1].body as FormData;
    expect(form.get('idempotencyKey')).toBe('operation-1'); expect(form.get('otp')).toBe('123456');
    expect(form.get('expectedContentSha256')).toBe('hash'); expect(form.get('acceptedTerms')).toBe('true');
    expect(form.get('operatorId')).toBeNull(); expect((form.get('signature') as File).type).toBe('image/png');
    expect(fetch.mock.calls[0][1].headers).toBeUndefined();
  });
  it('maps stable OTP failures to readable Vietnamese without displaying backend diagnostics', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ errorCode: 'operator_contract.otp_invalid', detail: 'internal db secret' }, { status: 400 })));
    await expect(requestSigningChallenge('1', { expectedContentSha256: 'hash', rowVersion: 'AQ==' })).rejects.toThrow('OTP');
    expect(new OperatorContractError(503, 'private code').message).not.toContain('private code');
  });
});
