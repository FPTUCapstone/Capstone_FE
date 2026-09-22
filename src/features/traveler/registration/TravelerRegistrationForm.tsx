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

import { getFirebaseAuth } from '@/lib/firebase';
import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { CheckboxField, PasswordField, TextField } from '@/components/ui/FormControls';
import { LegalModal, PrivacyContent, TermsContent } from '@/components/ui/LegalModal';
import { googleAuth, isApiError, registerTraveler, saveTokens } from '@/lib/authApi';
import {
  extractFieldErrors,
  getApiErrorMessage,
  mapFirebaseAuthError,
} from '@/lib/authErrorMapper';
import { validatePassword } from '@/lib/passwordPolicy';
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
  } else if (/[^\p{L}\p{Zs}]/u.test(trimmedName)) {
    e.fullName = 'Full name can only contain letters and spaces.';
  } else {
    const normalizedName = trimmedName.replace(/\s+/g, ' ');
    if (normalizedName.length < 2) {
      e.fullName = 'Full name must be at least 2 characters.';
    } else if (normalizedName.length > 150) {
      e.fullName = 'Full name must not exceed 150 characters.';
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

  // 4. Password (shared canonical FE policy)
  const passwordError = validatePassword(password);
  if (passwordError) {
    e.password = passwordError;
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
      const userCredential = await createUserWithEmailAndPassword(getFirebaseAuth(), normalizedEmail, password);
      createdFirebaseUser = userCredential.user;

      // 2. Get the ID token required by the current Backend contract.
      let idToken: string;
      try {
        idToken = await createdFirebaseUser.getIdToken();
      } catch (tokenError) {
        // Backend has not been called yet, so cleanup cannot remove a committed row.
        try {
          await createdFirebaseUser.delete();
        } catch {
          // Best-effort client rollback; Firebase may require server-side reconciliation.
        }
        throw tokenError;
      }

      // 3. Register the pending Traveler before email delivery. If delivery fails,
      // both account records remain recoverable through the resend screen.
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
        // A structured API response proves that Backend rejected registration.
        // For network/transport errors the commit outcome is unknown, so deleting
        // the Firebase user could instead orphan a successfully-created Backend row.
        const isDeterministicRejection =
          isApiError(backendError) && [400, 401, 403, 409, 422].includes(backendError.status);
        if (isDeterministicRejection) {
          try {
            await createdFirebaseUser.delete();
          } catch {
            // Best-effort client rollback; Firebase may require server-side reconciliation.
          }
        }
        throw backendError;
      }

      // 4. Send the Firebase verification link.
      let deliveryFailed = false;
      try {
        await sendEmailVerification(createdFirebaseUser, {
          url: `${window.location.origin}/verify-email`,
          handleCodeInApp: true,
        });
      } catch {
        deliveryFailed = true;
      }

      // 5. Continue to the resend-capable instruction screen even when the first
      // delivery attempt fails. Retrying registration would create duplicate state.
      const deliveryQuery = deliveryFailed ? '&delivery=failed' : '';
      router.push(
        `${ROUTES.verifyAccount}?email=${encodeURIComponent(normalizedEmail)}${deliveryQuery}`,
      );
    } catch (err: unknown) {
      if (
        !isApiError(err) &&
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        typeof (err as { code: unknown }).code === 'string'
      ) {
        const firebaseErr = err as { code: string; message?: string };
        if (firebaseErr.code === 'auth/email-already-in-use') {
          setErrors((prev) => ({
            ...prev,
            email: mapFirebaseAuthError(firebaseErr),
          }));
        } else if (firebaseErr.code === 'auth/weak-password') {
          setErrors((prev) => ({
            ...prev,
            password: mapFirebaseAuthError(firebaseErr),
          }));
        } else if (firebaseErr.code === 'auth/invalid-email') {
          setErrors((prev) => ({
            ...prev,
            email: mapFirebaseAuthError(firebaseErr),
          }));
        } else {
          setFeedback({
            tone: 'error',
            message: mapFirebaseAuthError(
              firebaseErr,
              'Registration failed. Please try again.',
            ),
          });
        }
      } else if (isApiError(err)) {
        if (err.errors) {
          const fieldMapped = extractFieldErrors(err.errors);
          setErrors({
            fullName: fieldMapped['FullName'] ?? fieldMapped['fullName'],
            email: fieldMapped['Email'] ?? fieldMapped['email'],
            phone: fieldMapped['PhoneNumber'] ?? fieldMapped['phoneNumber'] ?? fieldMapped['phone'],
            terms: fieldMapped['AcceptedTerms'] ?? fieldMapped['acceptedTerms'] ?? fieldMapped['terms'],
          });
        } else {
          setFeedback({ tone: 'error', message: getApiErrorMessage(err) });
        }
      } else {
        setFeedback({ tone: 'error', message: 'Registration failed. Please try again.' });
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
      const result = await signInWithPopup(getFirebaseAuth(), provider);
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
      const fallback = 'Google authentication failed. Please try again.';
      setFeedback({
        tone: 'error',
        message: isApiError(err)
          ? getApiErrorMessage(err, fallback)
          : mapFirebaseAuthError(err, fallback),
      });
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

      {/* Form card */}
      <div className="bg-brand-card rounded-3xl shadow-card-lg p-8 sm:p-10 border border-slate-100">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-brand-navy tracking-tight mb-2">
            Tạo tài khoản Traveler
          </h2>
          <p className="text-sm text-brand-textSecondary leading-relaxed">
            Lên lịch trình thông minh &amp; khám phá trọn vẹn chuyến đi
          </p>
        </div>

        <form className="space-y-4" noValidate onSubmit={handleSubmit}>
          {/* Full Name */}
          <TextField
            label="Họ và tên"
            name="fullName"
            autoComplete="name"
            maxLength={150}
            placeholder="Nguyễn Văn A"
            value={fullName}
            disabled={loading}
            error={errors.fullName}
            leading={
              <span className="material-symbols-outlined text-[20px]">person</span>
            }
            onChange={(e) => setFullName(e.target.value)}
          />

          {/* Email */}
          <TextField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            placeholder="traveler@example.com"
            value={email}
            disabled={loading}
            error={errors.email}
            leading={
              <span className="material-symbols-outlined text-[20px]">mail</span>
            }
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* Phone Number (Optional) */}
          <TextField
            label="Số điện thoại (không bắt buộc)"
            name="phone"
            type="tel"
            autoComplete="tel"
            maxLength={14}
            placeholder="0905 123 456"
            value={phone}
            disabled={loading}
            error={errors.phone}
            leading={
              <span className="material-symbols-outlined text-[20px]">phone</span>
            }
            onChange={(e) => setPhone(e.target.value)}
          />

          {/* Password */}
          <PasswordField
            label="Mật khẩu"
            name="password"
            autoComplete="new-password"
            maxLength={72}
            placeholder="••••••••••••"
            value={password}
            disabled={loading}
            error={errors.password}
            leading={
              <span className="material-symbols-outlined text-[20px]">lock</span>
            }
            help="Tối thiểu 8 ký tự gồm chữ hoa, số và ký tự đặc biệt"
            onChange={(e) => handlePasswordChange(e.target.value)}
          />

          {/* Confirm Password */}
          <PasswordField
            label="Xác nhận mật khẩu"
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="••••••••••••"
            value={confirmPassword}
            disabled={loading}
            error={errors.confirmPassword}
            leading={
              <span className="material-symbols-outlined text-[20px]">lock_reset</span>
            }
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (errors.confirmPassword || e.target.value) {
                setErrors((prev) => ({
                  ...prev,
                  confirmPassword:
                    e.target.value !== password ? 'Mật khẩu không khớp. Vui lòng nhập lại.' : undefined,
                }));
              }
            }}
          />

          {/* Terms Checkbox */}
          <div className="pt-1">
            <CheckboxField
              name="terms"
              checked={terms}
              disabled={loading}
              error={errors.terms}
              onChange={(e) => setTerms(e.target.checked)}
            >
              Tôi đồng ý với{' '}
              <button
                type="button"
                onClick={() => setLegalModal('terms')}
                className="text-brand-teal font-semibold hover:underline"
              >
                Điều khoản dịch vụ
              </button>{' '}
              và{' '}
              <button
                type="button"
                onClick={() => setLegalModal('privacy')}
                className="text-brand-teal font-semibold hover:underline"
              >
                Chính sách bảo mật
              </button>{' '}
              của TripMate
            </CheckboxField>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !terms}
              aria-busy={loading}
              aria-label={loading ? 'Đang đăng ký' : undefined}
              className="w-full h-12 bg-brand-teal hover:bg-brand-brightTeal active:scale-[0.98] text-white font-semibold text-base rounded-xl shadow-btn transition-all duration-200 flex items-center justify-center gap-2 group disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" />
              ) : (
                <>
                  <span>Đăng ký</span>
                  <span className="material-symbols-outlined text-[18px] transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true">arrow_forward</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 bg-brand-card text-slate-400 font-medium">Hoặc tiếp tục với</span>
          </div>
        </div>

        {/* Google Button */}
        <button
          type="button"
          disabled={loading}
          onClick={handleGoogle}
          className="w-full h-12 bg-white hover:bg-slate-50 active:scale-[0.98] border border-[#CBD5E1] rounded-xl text-[#1E293B] font-medium text-sm flex items-center justify-center gap-3 transition-all duration-200 shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Tiếp tục với Google</span>
        </button>

        {feedback ? (
          <div className="mt-3.5">
            <FeedbackAlert tone={feedback.tone}>{feedback.message}</FeedbackAlert>
          </div>
        ) : null}

        {/* Login link */}
        <p className="mt-6 text-center text-sm text-brand-textSecondary">
          Đã có tài khoản?
          <Link
            href={ROUTES.signIn}
            className="text-brand-teal font-bold hover:underline ml-1"
          >
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
