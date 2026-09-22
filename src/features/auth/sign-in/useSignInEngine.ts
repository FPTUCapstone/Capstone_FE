'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';

import { getFirebaseAuth } from '@/lib/firebase';
import { type ApiError, webGoogleAuth, isApiError } from '@/lib/authApi';
import { mapGoogleSignInError, mapWebRecoveryError } from '@/lib/authErrorMapper';
import { useVerificationEmailCooldown } from '@/lib/useVerificationEmailCooldown';
import { signInDestination, partnerUnresolvedMessage } from '@/features/auth/routing/signInDestination';
import { loginWithWebRecovery, resendWebVerification } from '@/features/auth/recovery/webRecovery';

export type SignInFeedback = {
  message: string;
  tone: 'info' | 'success' | 'error';
} | null;

export type SignInFieldErrors = {
  email?: string;
  password?: string;
};

export type SignInEngine = {
  email: string;
  password: string;
  remember: boolean;
  errors: SignInFieldErrors;
  feedback: SignInFeedback;
  loading: boolean;
  googleConsent: boolean;
  googlePasswordHint: boolean;
  unverifiedEmail: string | null;
  resendSecondsLeft: number;
  resendOnCooldown: boolean;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setRemember: (value: boolean) => void;
  setGoogleConsent: (value: boolean) => void;
  handleSubmit: (event: { preventDefault: () => void }) => Promise<void>;
  handleGoogle: () => Promise<void>;
  handleResendEmail: () => Promise<void>;
};

export type SignInEngineOptions = {
  admin?: boolean;
  /** Overrides the default email placeholders / labels if needed. */
  invalidEmailMessage?: string;
  emailRequiredMessage?: string;
  passwordRequiredMessage?: string;
};

const defaultEmailRequiredMessage = 'Please enter your email.';
const defaultPasswordRequiredMessage = 'Please enter your password.';
const defaultInvalidEmailMessage = 'Invalid email format. Please enter a valid email address.';

export function useSignInEngine({
  admin = false,
  emailRequiredMessage = defaultEmailRequiredMessage,
  passwordRequiredMessage = defaultPasswordRequiredMessage,
  invalidEmailMessage = defaultInvalidEmailMessage,
}: SignInEngineOptions = {}): SignInEngine {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [googleConsent, setGoogleConsent] = useState(false);
  const [googlePasswordHint, setGooglePasswordHint] = useState(false);
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<SignInFieldErrors>({});
  const [feedback, setFeedback] = useState<SignInFeedback>(null);
  const [loading, setLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const { secondsLeft: resendSecondsLeft, isOnCooldown: resendOnCooldown, startCooldown: startResendCooldown } = useVerificationEmailCooldown(60);

  async function handleResendEmail() {
    if (resendOnCooldown || loading) return;
    setFeedback(null);
    setLoading(true);

    try {
      if (!unverifiedEmail || email.trim().toLowerCase() !== unverifiedEmail.trim().toLowerCase()) throw { code: 'FIREBASE_SESSION_MISMATCH' };
      await resendWebVerification(unverifiedEmail, password);
      startResendCooldown();
      setFeedback({ tone: 'success', message: 'A fresh verification link has been sent to your email. Please check your inbox.' });
    } catch (error: unknown) {
      const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined;
      if (code === 'auth/too-many-requests') startResendCooldown();
      // The TripMate Backend is the sole password authority; UC-06 will own
      // resending the verification email from the Backend. Until then the
      // resend action is intentionally a no-op and the UI surfaces a stable,
      // non-actionable notice so the user is never given false success.
      if (code === 'MSG_VERIFICATION_RESEND_UNAVAILABLE') {
        setFeedback({
          tone: 'info',
          message: 'Your verification email was already sent when you registered. Check your spam folder, or contact support if you no longer have it.',
        });
      } else {
        setFeedback({ tone: 'error', message: mapWebRecoveryError(error) });
      }
    } finally { setLoading(false); }
  }

  async function handleSubmit(event: { preventDefault: () => void }) {
    event.preventDefault();
    if (loading) return;
    const nextErrors: SignInFieldErrors = {};

    if (!email.trim()) nextErrors.email = emailRequiredMessage;
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) nextErrors.email = invalidEmailMessage;
    if (!password) nextErrors.password = passwordRequiredMessage;

    setErrors(nextErrors);
    setFeedback(null);
    setUnverifiedEmail(null);
    setGooglePasswordHint(false);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);

    try {
      const res = await loginWithWebRecovery({ email: email.trim().toLowerCase(), password, keepMeSignedIn: remember }, admin);

      setFeedback({
        tone: 'success',
        message: signInDestination(res) ? 'Signed in successfully! Redirecting...' : partnerUnresolvedMessage,
      });

      const destination = signInDestination(res);
      if (destination) router.replace(destination);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      if (apiErr?.code === 'MSG_UNVERIFIED' || apiErr?.code === 'MSG_EMAIL_NOT_VERIFIED') {
        setUnverifiedEmail(email.trim());
        setFeedback({
          tone: 'error',
          message: mapWebRecoveryError(apiErr),
        });
      } else {
        if (isApiError(err) && err.errors) {
          setErrors({
            email: err.errors.email === 'MSG01' ? emailRequiredMessage : err.errors.email === 'MSG02' ? invalidEmailMessage : undefined,
            password: err.errors.password === 'MSG01' ? passwordRequiredMessage : undefined,
          });
        }
        setFeedback({ tone: 'error', message: mapWebRecoveryError(err) });
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    if (admin || loading || !googleConsent) return;
    setGoogleConsent(false);
    setUnverifiedEmail(null);
    setGooglePasswordHint(false);
    setFeedback(null);
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(getFirebaseAuth(), provider);
      const idToken = await result.user.getIdToken();

      const res = await webGoogleAuth(idToken, remember);
      const destination = signInDestination(res);
      setFeedback({ tone: 'success', message: destination ? 'Signed in with Google successfully! Redirecting...' : partnerUnresolvedMessage });
      if (destination) router.replace(destination);

    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        ((err as { code: string }).code === 'auth/popup-closed-by-user' ||
          (err as { code: string }).code === 'auth/cancelled-popup-request')
      ) {
        // User closed the Google popup intentionally; clear feedback without showing raw error
        setFeedback(null);
        return;
      }
      const code = err && typeof err === 'object' && 'code' in err ? err.code : undefined;
      setGooglePasswordHint(code === 'auth.admin_google_sign_in_disabled' || code === 'MSG_UNVERIFIED');
      setFeedback({ tone: 'error', message: mapGoogleSignInError(err) });
    } finally {
      setLoading(false);
    }
  }

  return {
    email,
    password,
    remember,
    errors,
    feedback,
    loading,
    googleConsent,
    googlePasswordHint,
    unverifiedEmail,
    resendSecondsLeft,
    resendOnCooldown,
    setEmail,
    setPassword,
    setRemember,
    setGoogleConsent,
    handleSubmit,
    handleGoogle,
    handleResendEmail,
  };
}
