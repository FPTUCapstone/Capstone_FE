'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendEmailVerification,
  signInWithPopup,
} from 'firebase/auth';

import { auth } from '@/lib/firebase';
import { ActionButton } from '@/components/ui/ActionButton';
import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { CheckboxField, PasswordField, TextField } from '@/components/ui/FormControls';
import { LegalModal, PrivacyContent, TermsContent } from '@/components/ui/LegalModal';
import { type ApiError, googleAuth, registerTraveler, saveTokens } from '@/lib/authApi';
import { extractFieldErrors, mapAuthError } from '@/lib/authErrorMapper';
import { ROUTES } from '@/lib/routes';

// ─── Validation helpers ───────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = Partial<
  Record<'fullName' | 'email' | 'phone' | 'password' | 'confirmPassword' | 'terms', string>
>;

function validateForm(fields: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
}): FieldErrors {
  const e: FieldErrors = {};
  const { fullName, email, phone, password, confirmPassword, terms } = fields;

  // 1. Full Name
  const trimmedName = fullName.trim();
  if (!trimmedName) {
    e.fullName = 'Please enter your full name.';
  } else if (/\d/.test(trimmedName)) {
    e.fullName = 'Full name cannot contain digits.';
  } else if (/[^\p{L}\s]/u.test(trimmedName)) {
    e.fullName = 'Full name can only contain letters and spaces.';
  } else {
    const normalizedName = trimmedName.replace(/\s+/g, ' ');
    if (normalizedName.length < 2) {
      e.fullName = 'Full name must be at least 2 characters.';
    } else if (normalizedName.length > 100) {
      e.fullName = 'Full name must not exceed 100 characters.';
    }
  }

  // 2. Email Address
  const trimmedEmail = email.trim();
  if (!trimmedEmail) {
    e.email = 'Please enter your email.';
  } else if (trimmedEmail.length > 254 || !EMAIL_RE.test(trimmedEmail)) {
    e.email = 'Invalid email format. Please enter a valid email address.';
  }

  // 3. Phone Number (Optional)
  if (phone && phone.trim()) {
    const normalizedPhone = phone.replace(/\s+/g, '');
    if (!/^0\d{9}$/.test(normalizedPhone)) {
      e.phone = 'Invalid phone number. Phone number must be 10 digits starting with 0.';
    }
  }

  // 4. Password
  if (!password) {
    e.password = 'Please enter your password.';
  } else if (password.startsWith(' ') || password.endsWith(' ')) {
    e.password = 'Password cannot start or end with a space.';
  } else if (password.length < 8) {
    e.password = 'Password must be at least 8 characters.';
  } else if (password.length > 128) {
    e.password = 'Password must not exceed 128 characters.';
  } else {
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);

    if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
      if (!hasUpper && !hasLower && !hasDigit && !hasSpecial) {
        e.password = 'Password must contain uppercase, lowercase, number, and special character.';
      } else if (!hasUpper && !hasDigit && !hasSpecial) {
        e.password = 'Password must contain uppercase, number, and special character.';
      } else if (!hasUpper && !hasSpecial) {
        e.password = 'Password must contain uppercase and special character.';
      } else if (!hasSpecial) {
        e.password = 'Password must contain at least one special character.';
      } else {
        e.password = 'Password must contain uppercase, lowercase, number, and special character.';
      }
    }
  }

  // 5. Confirm Password
  if (!confirmPassword) {
    e.confirmPassword = 'Please confirm your password.';
  } else if (confirmPassword !== password) {
    e.confirmPassword = 'Passwords do not match. Please re-enter.';
  }

  // 6. Terms
  if (!terms) {
    e.terms = 'You must accept the Terms of Service and Privacy Policy to continue.';
  }

  return e;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TravelerRegistrationForm() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [terms, setTerms] = useState(false);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [feedback, setFeedback] = useState<{ tone: 'info' | 'error' | 'success'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Legal modals
  const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | null>(null);

  function handlePasswordChange(val: string) {
    setPassword(val);
    if (confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: val !== confirmPassword ? 'Passwords do not match. Please re-enter.' : undefined,
      }));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    const nextErrors = validateForm({ fullName, email, phone, password, confirmPassword, terms });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    let createdFirebaseUser = null;

    try {
      const normalizedFullName = fullName.trim().replace(/\s+/g, ' ');
      const normalizedEmail = email.trim();
      const normalizedPhone = phone ? phone.replace(/\s+/g, '') : undefined;

      // 1. Create account in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      createdFirebaseUser = userCredential.user;

      // 2. Send Firebase verification email link
      const actionCodeSettings = {
        url: `${window.location.origin}/verify-email`,
        handleCodeInApp: false,
      };
      await sendEmailVerification(createdFirebaseUser, actionCodeSettings);

      // 3. Get ID token from Firebase
      const idToken = await createdFirebaseUser.getIdToken();

      // 4. Register Traveler in TripMate Backend
      try {
        await registerTraveler(
          {
            email: normalizedEmail,
            password,
            fullName: normalizedFullName,
            phoneNumber: normalizedPhone,
            acceptedTerms: true,
          },
          idToken
        );
      } catch (backendError) {
        // Rollback: delete Firebase account if backend registration fails
        try {
          await createdFirebaseUser.delete();
        } catch (delErr) {
          console.error('Failed to rollback Firebase user:', delErr);
        }
        throw backendError;
      }

      // 5. Navigate to verify-account instruction screen
      router.push(`${ROUTES.verifyAccount}?email=${encodeURIComponent(normalizedEmail)}`);
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'code' in err && typeof (err as { code: unknown }).code === 'string') {
        const firebaseErr = err as { code: string; message?: string };
        if (firebaseErr.code === 'auth/email-already-in-use') {
          setErrors((prev) => ({
            ...prev,
            email: 'An account with this email already exists. Please sign in or use another email.',
          }));
        } else if (firebaseErr.code === 'auth/weak-password') {
          setErrors((prev) => ({
            ...prev,
            password: 'Password is too weak. Please use a stronger password.',
          }));
        } else if (firebaseErr.code === 'auth/invalid-email') {
          setErrors((prev) => ({
            ...prev,
            email: 'Invalid email format. Please enter a valid email address.',
          }));
        } else {
          setFeedback({
            tone: 'error',
            message: firebaseErr.message || 'Registration failed. Please try again.',
          });
        }
      } else {
        const apiErr = err as ApiError;
        if (apiErr.errors) {
          const fieldMapped = extractFieldErrors(apiErr.errors);
          setErrors({
            fullName: fieldMapped['FullName'] ?? fieldMapped['fullName'],
            email: fieldMapped['Email'] ?? fieldMapped['email'],
            phone: fieldMapped['PhoneNumber'] ?? fieldMapped['phoneNumber'] ?? fieldMapped['phone'],
            terms: fieldMapped['AcceptedTerms'] ?? fieldMapped['acceptedTerms'] ?? fieldMapped['terms'],
          });
        } else {
          setFeedback({ tone: 'error', message: mapAuthError(apiErr.code, apiErr.message) });
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    setFeedback(null);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      const res = await googleAuth(idToken);
      saveTokens(res.accessToken, res.refreshToken, {
        email: result.user.email || '',
        fullName: result.user.displayName || result.user.email || '',
      });
      router.push(ROUTES.home);
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
      const errorMsg =
        err instanceof Error ? err.message : 'Google authentication failed. Please try again.';
      setFeedback({ tone: 'error', message: errorMsg });
    } finally {
      setLoading(false);
    }
  }

  // ─── Registration form ────────────────────────────────────────────────────

  return (
    <div>
      {/* Legal modals */}
      {legalModal === 'terms' && (
        <LegalModal title="Terms of Service" onClose={() => setLegalModal(null)}>
          <TermsContent />
        </LegalModal>
      )}
      {legalModal === 'privacy' && (
        <LegalModal title="Privacy Policy" onClose={() => setLegalModal(null)}>
          <PrivacyContent />
        </LegalModal>
      )}

      <div className="mb-5">
        <h2 className="text-2xl font-bold tracking-tight text-[#0F1B2D]">
          Create Account
        </h2>
        <p className="mt-1 text-[12.5px] leading-relaxed text-[#6B7C97]">
          Join TripMate to plan one-day itineraries around your own time, budget and pace.
        </p>
      </div>

      <form className="space-y-3.5" noValidate onSubmit={handleSubmit}>
        <TextField
          label="Full name"
          name="fullName"
          autoComplete="name"
          maxLength={150}
          placeholder="Nguyen Minh Phuc"
          value={fullName}
          disabled={loading}
          error={errors.fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

        <TextField
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          maxLength={256}
          placeholder="phuc.nguyen@gmail.com"
          value={email}
          disabled={loading}
          error={errors.email}
          trailing={EMAIL_RE.test(email.trim()) ? <span className="badge-pill green">✓</span> : null}
          onChange={(e) => setEmail(e.target.value)}
        />

        <TextField
          label="Phone number"
          name="phone"
          type="tel"
          autoComplete="tel"
          optional
          placeholder="0905 123 456"
          value={phone}
          disabled={loading}
          error={errors.phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <PasswordField
          label="Password"
          name="password"
          autoComplete="new-password"
          maxLength={72}
          placeholder="At least 8 characters"
          value={password}
          disabled={loading}
          error={errors.password}
          help="Use upper case, lower case, a number and a special character."
          onChange={(e) => handlePasswordChange(e.target.value)}
        />

        <PasswordField
          label="Confirm password"
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="••••••••"
          value={confirmPassword}
          disabled={loading}
          error={errors.confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (errors.confirmPassword || e.target.value) {
              setErrors((prev) => ({
                ...prev,
                confirmPassword:
                  e.target.value !== password ? 'Passwords do not match. Please re-enter.' : undefined,
              }));
            }
          }}
        />

        <CheckboxField
          name="terms"
          checked={terms}
          disabled={loading}
          error={errors.terms}
          onChange={(e) => setTerms(e.target.checked)}
        >
          I agree to the{' '}
          <button
            type="button"
            onClick={() => setLegalModal('terms')}
            className="font-semibold text-[#1D4ED8] hover:underline"
          >
            Terms of Service
          </button>{' '}
          and the{' '}
          <button
            type="button"
            onClick={() => setLegalModal('privacy')}
            className="font-semibold text-[#1D4ED8] hover:underline"
          >
            Privacy Policy
          </button>
          .
        </CheckboxField>

        <ActionButton type="submit" variant="primary" loading={loading} className="w-full mt-2">
          Register
        </ActionButton>
      </form>

      <div className="my-3.5 flex items-center gap-3 text-xs text-[#6B7C97]" aria-hidden="true">
        <span className="h-px flex-1 bg-[#E1E8F3]" />
        or continue with
        <span className="h-px flex-1 bg-[#E1E8F3]" />
      </div>

      <ActionButton
        type="button"
        variant="outline"
        loading={loading}
        className="w-full font-semibold"
        onClick={handleGoogle}
      >
        <span className="font-bold text-[#4285f4] text-base" aria-hidden="true">G</span>
        Continue with Google
      </ActionButton>

      {feedback ? (
        <div className="mt-3.5">
          <FeedbackAlert tone={feedback.tone}>{feedback.message}</FeedbackAlert>
        </div>
      ) : null}

      <p className="mt-4 text-center text-xs text-[#6B7C97]">
        Already have an account?{' '}
        <Link
          href={ROUTES.signIn}
          className="font-semibold text-[#1D4ED8] hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
