import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loginWithWebRecovery, resendWebVerification } from './webRecovery';
const mocks = vi.hoisted(() => ({ login: vi.fn(), verify: vi.fn(), firebase: vi.fn(), send: vi.fn(), auth: { currentUser: null as unknown } }));
vi.mock('@/lib/authApi', async (original) => ({ ...(await original<typeof import('@/lib/authApi')>()), webLogin: mocks.login, webVerifyEmail: mocks.verify }));
vi.mock('@/lib/firebase', () => ({ getFirebaseAuth: () => mocks.auth }));
vi.mock('firebase/auth', () => ({ signInWithEmailAndPassword: mocks.firebase, sendEmailVerification: mocks.send }));
const input = { email: 'user@example.com', password: ' unchanged ', keepMeSignedIn: true };
const unverified = { code: 'MSG_UNVERIFIED', status: 403 };
function user(verified = true, email = input.email) { return { email, emailVerified: verified, reload: vi.fn(), getIdToken: vi.fn().mockResolvedValue('fresh-test') }; }
beforeEach(() => { vi.resetAllMocks(); mocks.auth.currentUser = null; });
describe('bounded Web recovery', () => {
  it.each([false, true])('reloads/freshens evidence then retries full Web login once (%s)', async (admin) => {
    const evidence = user(); const context = { role: admin ? 'Administrator' : 'TourOperator', status: 'Active', applicationStatus: 'Rejected' };
    mocks.login.mockRejectedValueOnce(unverified).mockResolvedValueOnce(context); mocks.firebase.mockResolvedValue({ user: evidence }); mocks.verify.mockResolvedValue({ emailVerified: true });
    expect(await loginWithWebRecovery(input, admin)).toBe(context);
    expect(evidence.reload).toHaveBeenCalledTimes(1); expect(evidence.getIdToken).toHaveBeenCalledWith(true); expect(mocks.verify).toHaveBeenCalledWith('fresh-test'); expect(mocks.login).toHaveBeenCalledTimes(2);
    expect(mocks.login).toHaveBeenNthCalledWith(2, input, admin);
    expect(evidence.reload.mock.invocationCallOrder[0]).toBeLessThan(evidence.getIdToken.mock.invocationCallOrder[0]); expect(mocks.verify.mock.invocationCallOrder[0]).toBeLessThan(mocks.login.mock.invocationCallOrder[1]);
  });
  it('does not loop on a second unverified failure', async () => {
    mocks.login.mockRejectedValue(unverified); mocks.firebase.mockResolvedValue({ user: user() }); mocks.verify.mockResolvedValue({ emailVerified: true });
    await expect(loginWithWebRecovery(input, false)).rejects.toMatchObject(unverified); expect(mocks.login).toHaveBeenCalledTimes(2); expect(mocks.firebase).toHaveBeenCalledTimes(1); expect(mocks.verify).toHaveBeenCalledTimes(1);
  });
  it('shows guidance without sync when Firebase is not verified', async () => {
    mocks.login.mockRejectedValue(unverified); mocks.firebase.mockResolvedValue({ user: user(false) });
    await expect(loginWithWebRecovery(input, false)).rejects.toMatchObject(unverified); expect(mocks.verify).not.toHaveBeenCalled(); expect(mocks.login).toHaveBeenCalledTimes(1);
  });
  it.each(['auth.account_locked', 'auth.account_inactive', 'auth.account_state_unresolved', 'auth.invalid_credentials'])('never recovers other account errors %s', async (code) => {
    mocks.login.mockRejectedValue({ code, status: 403 }); await expect(loginWithWebRecovery(input, false)).rejects.toMatchObject({ code }); expect(mocks.firebase).not.toHaveBeenCalled(); expect(mocks.verify).not.toHaveBeenCalled();
  });
  it('stops on sync failure without repeating sign-in', async () => {
    mocks.login.mockRejectedValue(unverified); mocks.firebase.mockResolvedValue({ user: user() }); mocks.verify.mockRejectedValue({ code: 'MSG14', status: 401 });
    await expect(loginWithWebRecovery(input, false)).rejects.toMatchObject({ code: 'MSG14' }); expect(mocks.login).toHaveBeenCalledTimes(1);
  });
  it('rejects mismatched Firebase identity before sending its token', async () => {
    mocks.login.mockRejectedValue(unverified); mocks.firebase.mockResolvedValue({ user: user(true, 'other@example.com') });
    await expect(loginWithWebRecovery(input, false)).rejects.toMatchObject({ code: 'FIREBASE_SESSION_MISMATCH' }); expect(mocks.verify).not.toHaveBeenCalled();
  });
});
describe('matching resend', () => {
  it('reuses only a matching Firebase user, no session/sync', async () => {
    const evidence = user(false); mocks.auth.currentUser = evidence; await resendWebVerification(input.email, input.password);
    expect(mocks.send).toHaveBeenCalledWith(evidence, expect.objectContaining({ handleCodeInApp: true })); expect(mocks.firebase).not.toHaveBeenCalled(); expect(mocks.login).not.toHaveBeenCalled(); expect(mocks.verify).not.toHaveBeenCalled();
  });
  it('authenticates submitted account instead of sending to another current user', async () => {
    mocks.auth.currentUser = user(false, 'other@example.com'); const evidence = user(false); mocks.firebase.mockResolvedValue({ user: evidence });
    await resendWebVerification(input.email, input.password); expect(mocks.firebase).toHaveBeenCalledWith(mocks.auth, input.email, input.password); expect(mocks.send).toHaveBeenCalledWith(evidence, expect.anything());
  });
  it('does not resend when authenticated identity still mismatches', async () => {
    mocks.firebase.mockResolvedValue({ user: user(false, 'other@example.com') });
    await expect(resendWebVerification(input.email, input.password)).rejects.toMatchObject({ code: 'FIREBASE_SESSION_MISMATCH' }); expect(mocks.send).not.toHaveBeenCalled();
  });
});
