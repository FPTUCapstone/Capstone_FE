"use client";

import Link from "next/link";

import { FeedbackAlert } from "@/components/ui/FeedbackAlert";
import { GoogleConsentModal } from "@/features/auth/google/GoogleConsentModal";
import { useSignInEngine } from "@/features/auth/sign-in/useSignInEngine";
import { ROUTES } from "@/lib/routes";

import FormField from "./FormField";

export default function LoginForm() {
  const {
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
  } = useSignInEngine();

  return (
    <div className="bg-brand-card rounded-3xl shadow-card-lg p-8 sm:p-10 border border-slate-100">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-brand-navy tracking-tight mb-2">
          Đăng nhập
        </h2>
        <p className="text-sm text-brand-textSecondary leading-relaxed">
          Chào mừng bạn quay lại với TripMate
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <FormField
          id="email"
          name="email"
          type="email"
          label="Email"
          icon="mail"
          placeholder="traveler@example.com"
          autoComplete="email"
          value={email}
          disabled={loading}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={Boolean(errors.email)}
          required
        />
        {errors.email ? (
          <p className="-mt-2 flex items-center gap-1 text-[11px] font-semibold text-red-600">
            <span>⚠</span> {errors.email}
          </p>
        ) : null}

        <FormField
          id="password"
          name="password"
          label="Mật khẩu"
          icon="lock"
          placeholder="••••••••••••"
          autoComplete="current-password"
          value={password}
          disabled={loading}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={Boolean(errors.password)}
          toggleable
          required
        />
        {errors.password ? (
          <p className="-mt-2 flex items-center gap-1 text-[11px] font-semibold text-red-600">
            <span>⚠</span> {errors.password}
          </p>
        ) : null}

        {/* Remember + Forgot */}
        <div className="pt-1 flex items-center justify-between gap-3">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              name="remember"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              disabled={loading}
              className="h-4 w-4 shrink-0 rounded border-slate-300 text-brand-teal focus:ring-brand-teal/20 focus:ring-offset-0 transition"
            />
            <span className="text-xs text-slate-600">Ghi nhớ đăng nhập</span>
          </label>

          <Link
            href={ROUTES.forgotPassword}
            className="text-xs text-brand-teal font-semibold hover:underline"
          >
            Quên mật khẩu?
          </Link>
        </div>

        {/* CTA */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="group w-full h-12 bg-brand-teal hover:bg-brand-brightTeal active:scale-[0.98] text-white font-semibold text-base rounded-xl shadow-btn transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <span>{loading ? "Đang xử lý..." : "Đăng nhập"}</span>
            {!loading ? (
              <span className="material-symbols-outlined text-[18px] transition-transform duration-200 group-hover:translate-x-0.5">
                arrow_forward
              </span>
            ) : (
              <span className="material-symbols-outlined text-[18px] animate-spin">
                progress_activity
              </span>
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
          <span className="px-3 bg-brand-card text-slate-400 font-medium">
            Hoặc tiếp tục với
          </span>
        </div>
      </div>

      {/* Google */}
      <button
        type="button"
        disabled={loading}
        onClick={() => { if (!loading) setGoogleConsent(true); }}
        className="w-full h-12 bg-white hover:bg-slate-50 active:scale-[0.98] border border-[#CBD5E1] rounded-xl text-[#1E293B] font-medium text-sm flex items-center justify-center gap-3 transition-all duration-200 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
        </svg>
        <span>Tiếp tục với Google</span>
      </button>

      {/* Register redirect */}
      <p className="mt-6 text-center text-sm text-brand-textSecondary">
        Chưa có tài khoản?
        <Link href={ROUTES.register} className="text-brand-teal font-bold hover:underline ml-1">
          Tạo tài khoản
        </Link>
      </p>

      {/* Feedback / verification resend / google hint */}
      {feedback ? (
        <div className="mt-4 space-y-3">
          <FeedbackAlert tone={feedback.tone}>{feedback.message}</FeedbackAlert>
          {googlePasswordHint ? (
            <p className="text-xs text-brand-textSecondary">
              <Link href={ROUTES.signIn} className="font-semibold text-brand-teal hover:underline">
                Đăng nhập bằng email và mật khẩu
              </Link>
            </p>
          ) : null}
          {unverifiedEmail ? (
            <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-brand-surface p-3 text-xs text-brand-textSecondary">
              <p>
                Chưa nhận được email xác minh? Kiểm tra thư mục spam hoặc gửi lại bên dưới.
              </p>
              <button
                type="button"
                disabled={resendOnCooldown || loading}
                onClick={() => { void handleResendEmail(); }}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white text-xs font-semibold text-brand-navy hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {resendOnCooldown ? `Gửi lại (${resendSecondsLeft}s)` : "Gửi lại email xác minh"}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {googleConsent ? (
        <GoogleConsentModal onCancel={() => setGoogleConsent(false)} onAgree={handleGoogle} />
      ) : null}
    </div>
  );
}
