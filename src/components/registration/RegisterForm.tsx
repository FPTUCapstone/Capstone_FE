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
import { LegalModal, PrivacyContent, TermsContent } from '@/components/ui/LegalModal';
import { googleAuth, isApiError, registerTraveler, saveTokens } from '@/lib/authApi';
import {
  extractFieldErrors,
  getApiErrorMessage,
  mapFirebaseAuthError,
} from '@/lib/authErrorMapper';
import { validatePassword } from '@/lib/passwordPolicy';
import { ROUTES } from '@/lib/routes';
import FormField from '@/components/registration/FormField';

// ─── Validation helpers ───────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^0\d{9,10}$/;

type FieldErrors = Partial<
  Record<'fullName' | 'contactInfo' | 'phone' | 'password' | 'confirmPassword' | 'terms', string>
>;

function validateForm(fields: {
  fullName: string;
  contactInfo: string;
  phone: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
}): FieldErrors {
  const e: FieldErrors = {};

  const trimmedName = fields.fullName.trim();
  if (!trimmedName) {
    e.fullName = 'Vui lòng nhập họ và tên.';
  } else if (/[^\p{L}\p{Zs}]/u.test(trimmedName)) {
    e.fullName = 'Họ và tên không được chứa ký tự đặc biệt.';
  } else if (trimmedName.length < 2) {
    e.fullName = 'Họ và tên phải có ít nhất 2 ký tự.';
  }

  const trimmed = fields.contactInfo.trim();
  if (!trimmed) {
    e.contactInfo = 'Vui lòng nhập email hoặc số điện thoại.';
  } else if (!EMAIL_RE.test(trimmed) && !PHONE_RE.test(trimmed.replace(/\s+/g, ''))) {
    e.contactInfo = 'Email hoặc số điện thoại không hợp lệ.';
  }

  const trimmedPhone = fields.phone.trim().replace(/\s+/g, '');
  if (trimmedPhone && !PHONE_RE.test(trimmedPhone)) {
    e.phone = 'Số điện thoại không hợp lệ (gồm 10-11 chữ số bắt đầu bằng 0).';
  }

  const passwordError = validatePassword(fields.password);
  if (passwordError) {
    e.password = passwordError;
  }

  if (!fields.confirmPassword) {
    e.confirmPassword = 'Vui lòng xác nhận mật khẩu.';
  } else if (fields.confirmPassword !== fields.password) {
    e.confirmPassword = 'Mật khẩu không khớp. Vui lòng nhập lại.';
  }

  if (!fields.terms) {
    e.terms = 'Bạn cần đồng ý với Điều khoản dịch vụ và Chính sách bảo mật để tiếp tục.';
  }

  return e;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RegisterForm() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [terms, setTerms] = useState(true);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [feedback, setFeedback] = useState<{ tone: 'info' | 'error' | 'success'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | null>(null);

  function handlePasswordChange(val: string) {
    setPassword(val);
    if (confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: val !== confirmPassword ? 'Mật khẩu không khớp. Vui lòng nhập lại.' : undefined,
      }));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    const nextErrors = validateForm({ fullName, contactInfo, phone, password, confirmPassword, terms });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    let createdFirebaseUser = null;

    try {
      const normalizedFullName = fullName.trim().replace(/\s+/g, ' ');
      const trimmed = contactInfo.trim().replace(/\s+/g, '');
      const isEmail = EMAIL_RE.test(trimmed);
      const normalizedEmail = isEmail ? trimmed : `${trimmed}@placeholder.phone`;
      const trimmedPhoneInput = phone.trim().replace(/\s+/g, '');
      const normalizedPhone = trimmedPhoneInput ? trimmedPhoneInput : (isEmail ? undefined : trimmed);

      // 1. Create Firebase account
      const userCredential = await createUserWithEmailAndPassword(getFirebaseAuth(), normalizedEmail, password);
      createdFirebaseUser = userCredential.user;

      // 2. Get ID token
      let idToken: string;
      try {
        idToken = await createdFirebaseUser.getIdToken();
      } catch (tokenError) {
        try { await createdFirebaseUser.delete(); } catch { /* best-effort */ }
        throw tokenError;
      }

      // 3. Register with Backend
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
        const isDeterministicRejection =
          isApiError(backendError) && [400, 401, 403, 409, 422].includes(backendError.status);
        if (isDeterministicRejection) {
          try { await createdFirebaseUser.delete(); } catch { /* best-effort */ }
        }
        throw backendError;
      }

      // 4. Send verification email
      let deliveryFailed = false;
      try {
        await sendEmailVerification(createdFirebaseUser, {
          url: `${window.location.origin}/verify-email`,
          handleCodeInApp: true,
        });
      } catch {
        deliveryFailed = true;
      }

      const deliveryQuery = deliveryFailed ? '&delivery=failed' : '';
      router.push(`${ROUTES.verifyAccount}?email=${encodeURIComponent(normalizedEmail)}${deliveryQuery}`);
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        typeof (err as { code: string }).code === 'string'
      ) {
        const firebaseErr = err as { code: string };
        if (firebaseErr.code === 'auth/email-already-in-use') {
          setErrors((prev) => ({ ...prev, contactInfo: mapFirebaseAuthError(firebaseErr) }));
        } else if (firebaseErr.code === 'auth/weak-password') {
          setErrors((prev) => ({ ...prev, password: mapFirebaseAuthError(firebaseErr) }));
        } else if (firebaseErr.code === 'auth/invalid-email') {
          setErrors((prev) => ({ ...prev, contactInfo: mapFirebaseAuthError(firebaseErr) }));
        } else {
          setFeedback({ tone: 'error', message: mapFirebaseAuthError(firebaseErr, 'Đăng ký thất bại. Vui lòng thử lại.') });
        }
      } else if (isApiError(err)) {
        if (err.errors) {
          const fieldMapped = extractFieldErrors(err.errors);
          setErrors({
            fullName: fieldMapped['FullName'] ?? fieldMapped['fullName'],
            contactInfo: fieldMapped['Email'] ?? fieldMapped['email'] ?? fieldMapped['contactInfo'],
            terms: fieldMapped['AcceptedTerms'] ?? fieldMapped['acceptedTerms'] ?? fieldMapped['terms'],
          });
        } else {
          setFeedback({ tone: 'error', message: getApiErrorMessage(err) });
        }
      } else {
        setFeedback({ tone: 'error', message: 'Đăng ký thất bại. Vui lòng thử lại.' });
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
        setFeedback(null);
        return;
      }
      const fallback = 'Đăng nhập Google thất bại. Vui lòng thử lại.';
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

  // ─── Render ─────────────────────────────────────────────────────────────────

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
          <FormField
            id="fullName"
            label="Họ và tên"
            icon="person"
            placeholder="Nguyễn Văn A"
            required
            value={fullName}
            disabled={loading}
            onChange={(e) => setFullName(e.target.value)}
          />
          {errors.fullName && (
            <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-red-500">
              <span>⚠</span> {errors.fullName}
            </p>
          )}

          {/* Email hoặc Số điện thoại */}
          <FormField
            id="contactInfo"
            label="Email hoặc Số điện thoại"
            icon="mail"
            placeholder="traveler@example.com hoặc 090xxxxxxx"
            required
            value={contactInfo}
            disabled={loading}
            onChange={(e) => setContactInfo(e.target.value)}
          />
          {errors.contactInfo && (
            <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-red-500">
              <span>⚠</span> {errors.contactInfo}
            </p>
          )}

          {/* Số điện thoại (Không bắt buộc) */}
          <FormField
            id="phone"
            label="Số điện thoại (Không bắt buộc)"
            icon="call"
            placeholder="0901234567"
            value={phone}
            disabled={loading}
            onChange={(e) => setPhone(e.target.value)}
          />
          {errors.phone && (
            <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-red-500">
              <span>⚠</span> {errors.phone}
            </p>
          )}

          {/* Password */}
          <FormField
            id="password"
            label="Mật khẩu"
            icon="lock"
            placeholder="••••••••••••"
            toggleable
            required
            value={password}
            disabled={loading}
            onChange={(e) => handlePasswordChange(e.target.value)}
            hint={
              <p className="text-[11px] text-brand-textSecondary mt-1.5 flex items-center gap-1 leading-snug">
                <span className="material-symbols-outlined text-[14px] text-brand-teal">info</span>
                Tối thiểu 8 ký tự gồm chữ hoa, số và ký tự đặc biệt
              </p>
            }
          />
          {errors.password && (
            <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-red-500">
              <span>⚠</span> {errors.password}
            </p>
          )}

          {/* Confirm Password */}
          <FormField
            id="confirmPassword"
            label="Xác nhận mật khẩu"
            icon="lock_reset"
            placeholder="••••••••••••"
            toggleable
            required
            value={confirmPassword}
            disabled={loading}
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
          {errors.confirmPassword && (
            <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-red-500">
              <span>⚠</span> {errors.confirmPassword}
            </p>
          )}

          {/* Terms */}
          <div className="pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                name="terms"
                required
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
                disabled={loading}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-brand-teal focus:ring-brand-teal/20 focus:ring-offset-0 transition"
              />
              <span className="text-xs text-slate-600 leading-snug">
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
              </span>
            </label>
            {errors.terms && (
              <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-red-500">
                <span>⚠</span> {errors.terms}
              </p>
            )}
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !terms}
              aria-busy={loading}
              className="group w-full h-12 bg-brand-teal hover:bg-brand-brightTeal active:scale-[0.98] text-white font-semibold text-base rounded-xl shadow-btn transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
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

        {/* Google */}
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
          Tiếp tục với Google
        </button>

        {/* Login redirect */}
        <p className="mt-6 text-center text-sm text-brand-textSecondary">
          Đã có tài khoản?
          <Link href={ROUTES.signIn} className="text-brand-teal font-bold hover:underline ml-1">
            Đăng nhập
          </Link>
        </p>

        {feedback ? (
          <div className="mt-3.5">
            <FeedbackAlert tone={feedback.tone}>{feedback.message}</FeedbackAlert>
          </div>
        ) : null}
      </div>
    </div>
  );
}
