import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SignInForm } from './SignInForm';

const mocks = vi.hoisted(() => ({
  webVerifyEmail: vi.fn(), webResendVerification: vi.fn(), firebaseSignIn: vi.fn(), verifyEmail: vi.fn(), resend: vi.fn(), webLogin: vi.fn(), webGoogleAuth: vi.fn(), popup: vi.fn(), googleAuth: vi.fn(), saveTokens: vi.fn(), push: vi.fn(),
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock('@/lib/firebase', () => ({ getFirebaseAuth: () => ({}) }));
vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: class GoogleAuthProvider {},
  signInWithPopup: mocks.popup,
  signInWithEmailAndPassword: mocks.firebaseSignIn, sendEmailVerification: mocks.resend,
}));
vi.mock('@/lib/authApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/authApi')>()),
  webVerifyEmail: mocks.webVerifyEmail, webResendVerification: mocks.webResendVerification, verifyEmail: mocks.verifyEmail, webLogin: mocks.webLogin, webGoogleAuth: mocks.webGoogleAuth, googleAuth: mocks.googleAuth, saveTokens: mocks.saveTokens,
}));

beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value() { this.setAttribute('open', ''); } });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value() { this.removeAttribute('open'); } });
});

describe('SignInForm Google access', () => {
  beforeEach(() => vi.clearAllMocks());

  it('does not offer Google in the administrator login', () => {
    render(<SignInForm admin />);
    expect(screen.queryByRole('button', { name: /continue with google/i })).toBeNull();
    expect(screen.getByLabelText('Email address')).toBeDefined();
    expect(screen.getByLabelText('Password')).toBeDefined();
    expect(mocks.popup).not.toHaveBeenCalled();
  });

  it('shows a useful message when public Google sign-in rejects an administrator', async () => {
    mocks.popup.mockResolvedValue({ user: { getIdToken: vi.fn().mockResolvedValue('firebase-token') } });
    mocks.webGoogleAuth.mockRejectedValue({
      code: 'auth.admin_google_sign_in_disabled', status: 403, message: 'internal detail',
    });
    render(<SignInForm />);
    fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));
    fireEvent.click(screen.getByRole('button', { name: /agree and continue/i }));

    await waitFor(() => expect(screen.getByText(
      'Administrator accounts must sign in with email and password.',
    )).toBeDefined());
    expect(screen.queryByText('internal detail')).toBeNull();
    expect(mocks.saveTokens).not.toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
  });
});

function enterPassword() {
  fireEvent.change(screen.getByLabelText('Email address'), { target: { value: ' user@example.com ' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: ' unchanged ' } });
}
describe('Web password sign-in', () => {
  beforeEach(() => vi.clearAllMocks());
  it.each([false, true])('submits real public/Admin password login (%s)', async (admin) => {
    mocks.webLogin.mockResolvedValue({ role: admin ? 'Administrator' : 'Traveler', status: 'Active' });
    render(<SignInForm admin={admin} />); enterPassword();
    fireEvent.click(screen.getByLabelText('Keep me signed in'));
    fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));
    await waitFor(() => expect(mocks.webLogin).toHaveBeenCalledWith({ email: 'user@example.com', password: ' unchanged ', keepMeSignedIn: true }, admin));
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith(admin ? '/admin' : '/'));
    expect(mocks.saveTokens).not.toHaveBeenCalled();
    expect(screen.queryByText('Open Admin Prototype')).toBeNull();
  });
  it('requires both fields without calling the API', async () => {
    render(<SignInForm />); fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));
    expect(screen.getByText('Please enter your email.')).toBeDefined(); expect(screen.getByText('Please enter your password.')).toBeDefined();
    expect(mocks.webLogin).not.toHaveBeenCalled();
  });
  it('shows safe credential errors and keeps values for retry', async () => {
    mocks.webLogin.mockRejectedValue({ status: 401, code: 'auth.invalid_credentials', message: 'internal database detail' });
    render(<SignInForm />); enterPassword(); fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));
    await waitFor(() => expect(screen.getByText('Invalid email or password. Please try again.')).toBeDefined());
    expect(screen.queryByText('internal database detail')).toBeNull(); expect(mocks.push).not.toHaveBeenCalled(); expect(mocks.saveTokens).not.toHaveBeenCalled();
    expect((screen.getByLabelText('Password') as HTMLInputElement).value).toBe(' unchanged ');
  });
  it('disables submit and inputs while waiting', async () => {
    let resolve!: (value: object) => void; mocks.webLogin.mockReturnValue(new Promise((done) => { resolve = done; }));
    render(<SignInForm admin />); enterPassword(); fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));
    await waitFor(() => expect((screen.getByLabelText('Email address') as HTMLInputElement).disabled).toBe(true));
    resolve({ role: 'Administrator', status: 'Active' }); await waitFor(() => expect(mocks.push).toHaveBeenCalledWith('/admin'));
  });
});

describe('Web password failures', () => {
  beforeEach(() => vi.clearAllMocks());
  it.each([
    ['auth.account_locked', 'Your account is locked. Please contact support.'],
    ['auth.account_inactive', 'Your account is inactive. Please contact support.'],
  ])('keeps account restriction %s ahead of Admin success', async (code, message) => {
    mocks.webLogin.mockRejectedValue({ code, status: 403, message: 'internal detail' });
    render(<SignInForm admin />); enterPassword(); fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));
    await waitFor(() => expect(screen.getByText(message)).toBeDefined());
    expect(mocks.push).not.toHaveBeenCalled(); expect(mocks.saveTokens).not.toHaveBeenCalled();
  });
  it('renders server field codes without displaying internals', async () => {
    mocks.webLogin.mockRejectedValue({ status: 400, code: 'auth.request_invalid', errors: { email: 'MSG02', password: 'MSG01' }, message: 'internal validation' });
    render(<SignInForm />); enterPassword(); fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));
    await waitFor(() => expect(screen.getByText('Please enter your password.')).toBeDefined());
    expect(screen.getByText('Invalid email format. Please enter a valid email address.')).toBeDefined(); expect(screen.queryByText('internal validation')).toBeNull();
  });
  it('preserves A through an actual rejected Web request from the form', async () => {
    const api = await vi.importActual<typeof import('@/lib/authApi')>('@/lib/authApi');
    const { AuthStorage } = await import('@/features/auth/session/authSession');
    const context = { userId: 42, email: 'a@example.com', fullName: '', role: 'Traveler', status: 'Active', applicationStatus: null, accessToken: 'test-access', accessTokenExpiresAtUtc: '2099-01-01T00:00:00Z' };
    AuthStorage.accept(context, true); mocks.webLogin.mockImplementation(api.webLogin);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ errorCode: 'auth.admin_access_required' }), { status: 403 })));
    try {
      render(<SignInForm admin />); enterPassword(); fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));
      await waitFor(() => expect(screen.getByRole('link', { name: 'Go to public sign-in' })).toBeDefined());
      await waitFor(() => expect(screen.getByRole('button', { name: /^sign in$/i }).hasAttribute('disabled')).toBe(false));
      expect(AuthStorage.getContext()?.userId).toBe(42); expect(AuthStorage.getAccessToken()).toBe('test-access');
      expect(mocks.push).not.toHaveBeenCalled(); expect(mocks.saveTokens).not.toHaveBeenCalled();
    } finally { vi.unstubAllGlobals(); AuthStorage.clear(); mocks.webLogin.mockReset(); }
  });
});

describe('Password verification guidance without Firebase sign-in', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.webLogin.mockReset(); });
  it('surfaces Backend MSG_UNVERIFIED guidance without any Firebase authentication step', async () => {
    mocks.webLogin.mockRejectedValue({ code: 'MSG_UNVERIFIED', status: 403 });
    render(<SignInForm />); enterPassword(); fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));
    await waitFor(() => expect((screen.getByLabelText('Email address') as HTMLInputElement).disabled).toBe(false));
    expect(screen.getByText('Please verify your email before signing in.')).toBeDefined();
    // The resend action remains reachable, but it no longer depends on a
    // Firebase session or a Firebase sendEmailVerification call.
    expect(screen.getByRole('button', { name: 'Resend Verification Email' })).toBeDefined();
    expect(mocks.firebaseSignIn).not.toHaveBeenCalled();
    expect(mocks.resend).not.toHaveBeenCalled();
    expect(mocks.verifyEmail).not.toHaveBeenCalled();
    expect(mocks.saveTokens).not.toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
    expect(mocks.webLogin).toHaveBeenCalledTimes(1);
  });
});

describe('Resend Verification Email uses the Backend contract', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.webLogin.mockReset(); });
  it('shows success and never calls Firebase', async () => {
    mocks.webLogin.mockRejectedValue({ code: 'MSG_UNVERIFIED', status: 403 });
    mocks.webResendVerification.mockResolvedValue({ messageCode: 'MSG_RESEND_SUCCESS' });
    render(<SignInForm />); enterPassword(); fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));
    const resend = await screen.findByRole('button', { name: 'Resend Verification Email' });
    fireEvent.click(resend);
    await screen.findByText('A fresh verification link has been sent to your email. Please check your inbox.');
    expect(mocks.webResendVerification).toHaveBeenCalledWith({ email: 'user@example.com', password: ' unchanged ' });
    expect(mocks.firebaseSignIn).not.toHaveBeenCalled();
    expect(mocks.resend).not.toHaveBeenCalled();
    expect(mocks.saveTokens).not.toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
  });
  it('still blocks resending after the form email changes', async () => {
    mocks.webLogin.mockRejectedValue({ code: 'MSG_UNVERIFIED', status: 403 });
    render(<SignInForm />); enterPassword(); fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));
    const resend = await screen.findByRole('button', { name: 'Resend Verification Email' });
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'other@example.com' } });
    fireEvent.click(resend);
    await screen.findByText('Please sign in with the email you want to verify before requesting a new link.');
    expect(mocks.firebaseSignIn).not.toHaveBeenCalled();
    expect(mocks.resend).not.toHaveBeenCalled();
  });
});

describe('Web Google consent', () => {
  beforeEach(() => {
    vi.clearAllMocks(); mocks.webGoogleAuth.mockReset(); mocks.popup.mockReset();
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value() { this.setAttribute('open', ''); } });
    Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value() { this.removeAttribute('open'); } });
  });
  it('requires affirmative consent before opening a popup and can cancel without API calls', () => {
    render(<SignInForm />); fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));
    expect(screen.getByRole('dialog')).toBeDefined(); expect(screen.getByText(/creates a Traveler account, not a TourOperator account/i)).toBeDefined();
    expect(mocks.popup).not.toHaveBeenCalled(); expect(mocks.webGoogleAuth).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' })); expect(screen.queryByRole('dialog')).toBeNull(); expect(mocks.popup).not.toHaveBeenCalled();
  });
  it('offers legal content and Partner registration without starting Google', () => {
    render(<SignInForm />); fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));
    expect(screen.getByRole('link', { name: 'Register as TourOperator' }).getAttribute('href')).toBe('/partner/register');
    fireEvent.click(screen.getByRole('link', { name: 'Terms of Service' })); expect(screen.getByText('1. Acceptance of Terms')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Back to consent' })); fireEvent.click(screen.getByRole('link', { name: 'Privacy Policy' }));
    expect(screen.getByRole('dialog')).toBeDefined(); expect(mocks.popup).not.toHaveBeenCalled();
  });
  it('uses Web Google with Keep choice and server identity, never persists Firebase/Mobile tokens', async () => {
    const getIdToken = vi.fn().mockResolvedValue('test-firebase');
    mocks.popup.mockResolvedValue({ user: { email: 'different@example.com', getIdToken } });
    mocks.webGoogleAuth.mockResolvedValue({ role: 'TourOperator', status: 'Active', applicationStatus: 'PendingApproval', isNewAccount: false });
    render(<SignInForm />); fireEvent.click(screen.getByLabelText('Keep me signed in')); fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));
    fireEvent.click(screen.getByRole('button', { name: /agree and continue/i }));
    await waitFor(() => expect(mocks.webGoogleAuth).toHaveBeenCalledWith('test-firebase', true));
    await screen.findByText('Signed in with Google successfully! Redirecting...');
    expect(mocks.googleAuth).not.toHaveBeenCalled(); expect(mocks.saveTokens).not.toHaveBeenCalled(); expect(mocks.verifyEmail).not.toHaveBeenCalled(); expect(mocks.push).toHaveBeenCalledWith('/partner/application');
  });
});

function agreeGoogle() {
  fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));
  fireEvent.click(screen.getByRole('button', { name: /agree and continue/i }));
}
describe('Web Google failure boundaries', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.webGoogleAuth.mockReset(); mocks.popup.mockReset(); });
  it.each(['auth/popup-closed-by-user', 'auth/cancelled-popup-request'])('silently cancels popup %s', async (code) => {
    mocks.popup.mockRejectedValue({ code, message: 'raw SDK detail' }); render(<SignInForm />); agreeGoogle();
    await waitFor(() => expect((screen.getByLabelText('Email address') as HTMLInputElement).disabled).toBe(false));
    expect(screen.queryByRole('alert')).toBeNull(); expect(screen.queryByText('raw SDK detail')).toBeNull(); expect(mocks.webGoogleAuth).not.toHaveBeenCalled(); expect(mocks.push).not.toHaveBeenCalled();
  });
  it('requires explicit retry when popup is blocked', async () => {
    mocks.popup.mockRejectedValue({ code: 'auth/popup-blocked', message: 'raw SDK detail' }); render(<SignInForm />); agreeGoogle();
    await screen.findByText('Please allow popups for TripMate and try again.'); expect(mocks.popup).toHaveBeenCalledTimes(1); expect(mocks.webGoogleAuth).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull(); expect(mocks.push).not.toHaveBeenCalled();
  });
  it.each([
    ['MSG_EMAIL_NOT_VERIFIED', 'Your Google account email could not be confirmed as verified. Please verify it with Google and try again.'],
    ['MSG_UNVERIFIED', 'Please verify your TripMate email before signing in.'],
    ['auth.account_locked', 'Your account is locked. Please contact support.'],
    ['auth.account_inactive', 'Your account is inactive. Please contact support.'],
    ['AUTH_TOKEN_INVALID', 'Your Google authentication could not be verified. Please try again.'],
    ['auth.firebase_unavailable', 'Google authentication service is temporarily unavailable. Please try again later.'],
  ])('handles BE failure %s without recovery or token persistence', async (code, message) => {
    mocks.popup.mockResolvedValue({ user: { getIdToken: vi.fn().mockResolvedValue('test-firebase') } });
    mocks.webGoogleAuth.mockRejectedValue({ code, status: code === 'auth.firebase_unavailable' ? 503 : 403, message: 'raw backend detail' });
    render(<SignInForm />); agreeGoogle(); await screen.findByText(message);
    expect(mocks.verifyEmail).not.toHaveBeenCalled(); expect(mocks.firebaseSignIn).not.toHaveBeenCalled(); expect(mocks.saveTokens).not.toHaveBeenCalled(); expect(mocks.push).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /resend verification/i })).toBeNull(); expect(screen.queryByText('raw backend detail')).toBeNull();
  });
  it('closes consent on Escape without opening Google', () => {
    render(<SignInForm />); fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { bubbles: true, cancelable: true }));
    expect(screen.queryByRole('dialog')).toBeNull(); expect(mocks.popup).not.toHaveBeenCalled();
  });
  it('retains BE context in memory and never saves provider identity through the real Web API', async () => {
    const api = await vi.importActual<typeof import('@/lib/authApi')>('@/lib/authApi'); const { AuthStorage } = await import('@/features/auth/session/authSession');
    mocks.webGoogleAuth.mockImplementation(api.webGoogleAuth);
    mocks.popup.mockResolvedValue({ user: { email: 'provider@example.com', getIdToken: vi.fn().mockResolvedValue('test-firebase') } });
    const data = { userId: 42, email: 'db@example.com', fullName: '', role: 'Traveler', status: 'Active', applicationStatus: null, accessToken: 'test-access', accessTokenExpiresAtUtc: '2099-01-01T00:00:00Z', isNewAccount: true };
    const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, data }), { status: 200 })); vi.stubGlobal('fetch', request);
    try {
      render(<SignInForm />); agreeGoogle(); await waitFor(() => expect(mocks.push).toHaveBeenCalledWith('/'));
      expect(AuthStorage.getContext()?.email).toBe('db@example.com'); expect(AuthStorage.getAccessToken()).toBe('test-access');
      const [url, options] = request.mock.calls[0]; expect(url).toMatch(/\/auth\/web\/google$/); expect(options.credentials).toBe('include'); expect(JSON.parse(options.body)).toEqual({ idToken: 'test-firebase', keepMeSignedIn: false });
      expect(localStorage.getItem('tripmate_access_token')).toBeNull(); expect(localStorage.getItem('tripmate_refresh_token')).toBeNull(); expect(mocks.googleAuth).not.toHaveBeenCalled(); expect(mocks.saveTokens).not.toHaveBeenCalled();
    } finally { vi.unstubAllGlobals(); AuthStorage.clear(); mocks.webGoogleAuth.mockReset(); }
  });
  it('preserves existing A on BE-denied Google sign-in', async () => {
    const api = await vi.importActual<typeof import('@/lib/authApi')>('@/lib/authApi'); const { AuthStorage } = await import('@/features/auth/session/authSession');
    AuthStorage.accept({ userId: 42, email: 'a@example.com', fullName: '', role: 'Traveler', status: 'Active', applicationStatus: null, accessToken: 'test-access', accessTokenExpiresAtUtc: '2099-01-01T00:00:00Z' }, false);
    mocks.webGoogleAuth.mockImplementation(api.webGoogleAuth); mocks.popup.mockResolvedValue({ user: { getIdToken: vi.fn().mockResolvedValue('test-firebase') } });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ errorCode: 'auth.admin_google_sign_in_disabled' }), { status: 403 })));
    try {
      render(<SignInForm />); agreeGoogle(); await screen.findByText('Administrator accounts must sign in with email and password.');
      expect(AuthStorage.getContext()?.userId).toBe(42); expect(AuthStorage.getAccessToken()).toBe('test-access'); expect(mocks.push).not.toHaveBeenCalled(); expect(mocks.verifyEmail).not.toHaveBeenCalled();
      expect((screen.getByLabelText('Email address') as HTMLInputElement).value).toBe('');
    } finally { vi.unstubAllGlobals(); AuthStorage.clear(); mocks.webGoogleAuth.mockReset(); }
  });
});

describe('Web recovery form integration', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.webLogin.mockReset(); });
  it('never calls Firebase sign-in or verify-email and surfaces the BE guidance', async () => {
    mocks.webLogin.mockRejectedValue({ code: 'MSG_UNVERIFIED', status: 403 });
    render(<SignInForm />); enterPassword(); fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));
    await screen.findByText('Please verify your email before signing in.');
    expect(mocks.webLogin).toHaveBeenCalledTimes(1);
    expect(mocks.firebaseSignIn).not.toHaveBeenCalled();
    expect(mocks.webVerifyEmail).not.toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
    expect(mocks.saveTokens).not.toHaveBeenCalled();
  });
});

describe('Resend Verification Email cooldown', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.webLogin.mockReset(); });
  async function showGuidance() {
    mocks.webLogin.mockRejectedValue({ code: 'MSG_UNVERIFIED', status: 403 });
    render(<SignInForm />); enterPassword(); fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));
    return screen.findByRole('button', { name: 'Resend Verification Email' });
  }
  it('starts the cooldown after Backend success without Firebase', async () => {
    mocks.webResendVerification.mockResolvedValue({ messageCode: 'MSG_RESEND_SUCCESS' });
    const resend = await showGuidance();
    fireEvent.click(resend);
    await screen.findByText('A fresh verification link has been sent to your email. Please check your inbox.');
    expect(mocks.firebaseSignIn).not.toHaveBeenCalled();
    expect(mocks.resend).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Resend Email \(\d+s\)/ })).toBeDefined();
  });
});


describe('authoritative Partner routing', () => {
 beforeEach(() => vi.clearAllMocks());
 it.each(['Approved', 'PendingApproval', 'Rejected', null])('routes password context %s', async (applicationStatus) => {
  mocks.webLogin.mockResolvedValue({role:'TourOperator',status:'Active',applicationStatus});
  render(<SignInForm />); enterPassword(); fireEvent.click(screen.getByRole('button',{name:/^sign in$/i}));
  if (applicationStatus === null) { await screen.findByText(/Partner\./); expect(mocks.push).not.toHaveBeenCalled(); }
  else await waitFor(() => expect(mocks.push).toHaveBeenCalledWith(applicationStatus === 'Approved' ? '/partner' : '/partner/application'));
  expect(mocks.saveTokens).not.toHaveBeenCalled();
 });
});

describe('Google Partner final context', () => {
 beforeEach(() => vi.clearAllMocks());
 it.each(['Approved','PendingApproval','Rejected',null,'unexpected'])('uses BE application %s despite Firebase identity', async (applicationStatus) => {
  mocks.popup.mockResolvedValue({user:{email:'admin@example.com',getIdToken:vi.fn().mockResolvedValue('firebase')}});
  mocks.webGoogleAuth.mockResolvedValue({role:'TourOperator',status:'Active',applicationStatus});
  render(<SignInForm />); agreeGoogle();
  if (applicationStatus === null || applicationStatus === 'unexpected') {await screen.findByText(/Partner\./);expect(mocks.push).not.toHaveBeenCalled();}
  else await waitFor(() => expect(mocks.push).toHaveBeenCalledWith(applicationStatus === 'Approved' ? '/partner' : '/partner/application'));
  expect(mocks.saveTokens).not.toHaveBeenCalled();expect(mocks.verifyEmail).not.toHaveBeenCalled();expect(mocks.webVerifyEmail).not.toHaveBeenCalled();
 });
});
