'use client';

import { ActionButton } from '@/components/ui/ActionButton';
import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { PasswordField } from '@/components/ui/FormControls';
import { StatusBadge } from '@/components/ui/StatusBadge';

import { useChangePassword, type UseChangePasswordOptions } from './useChangePassword';

export interface UserDisplayInfo {
  name?: string;
  email?: string;
  role?: string;
}

export interface ChangePasswordFormProps extends UseChangePasswordOptions {
  userDisplay?: UserDisplayInfo;
  onCancel?: () => void;
  className?: string;
}

function roleBadgeTone(role?: string): 'teal' | 'coral' | 'neutral' {
  if (!role) return 'neutral';
  const normalized = role.toLowerCase();
  if (normalized.includes('admin')) return 'coral';
  if (normalized.includes('operator')) return 'teal';
  return 'neutral';
}

function getInitials(name?: string, email?: string): string {
  const source = name?.trim() || email?.trim() || 'TM';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function ChangePasswordForm({
  userDisplay,
  onCancel,
  accessToken,
  onSuccess,
  onUnauthorized,
  className = '',
}: ChangePasswordFormProps) {
  const { fields, errors, submitting, success, setField, handleSubmit, reset } =
    useChangePassword({
      accessToken,
      onSuccess,
      onUnauthorized,
    });

  function handleCancelClick() {
    reset();
    if (onCancel) {
      onCancel();
    }
  }

  const initials = getInitials(userDisplay?.name, userDisplay?.email);

  return (
    <section
      aria-labelledby="change-password-heading"
      className={`rounded-2xl border border-[#D8E1E4] bg-white p-6 shadow-xs sm:p-8 ${className}`}
    >
      {/* Header Eyebrow & Title */}
      <div className="mb-6">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#006B5F]">
          Bảo mật tài khoản
        </p>
        <h1
          id="change-password-heading"
          className="mt-1 text-2xl font-black tracking-tight text-[#00152A] sm:text-3xl"
        >
          Đổi mật khẩu
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[#59616B]">
          Nhập mật khẩu hiện tại và mật khẩu mới để cập nhật thông tin đăng nhập của bạn.
        </p>
      </div>

      {/* User Identity Banner (if provided) */}
      {userDisplay?.email || userDisplay?.name ? (
        <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-[#E1E8F3] bg-[#F8FAFB] p-3.5 sm:p-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#00152A] font-bold text-xs text-white"
              aria-hidden="true"
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[#00152A]">
                {userDisplay.name || userDisplay.email}
              </p>
              <p className="truncate text-xs text-[#59616B]">{userDisplay.email}</p>
            </div>
          </div>
          {userDisplay.role ? (
            <StatusBadge tone={roleBadgeTone(userDisplay.role)}>
              {userDisplay.role}
            </StatusBadge>
          ) : null}
        </div>
      ) : null}

      {/* Top-Level Success Feedback (MSG18) */}
      {success ? (
        <div className="mb-6">
          <FeedbackAlert tone="success" title="Thành công">
            Mật khẩu đã được cập nhật thành công. Bạn có thể sử dụng mật khẩu mới cho các lần đăng nhập tiếp theo.
          </FeedbackAlert>
        </div>
      ) : null}

      {/* Top-Level Form Error Feedback (MSG127 or generic) */}
      {errors.form ? (
        <div className="mb-6">
          <FeedbackAlert tone="error" title="Không thể đổi mật khẩu">
            {errors.form}
          </FeedbackAlert>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Current Password Field */}
        <div>
          <PasswordField
            id="current-password"
            label="Mật khẩu hiện tại"
            autoComplete="current-password"
            value={fields.currentPassword}
            onChange={(e) => setField('currentPassword', e.target.value)}
            error={errors.currentPassword}
            disabled={submitting}
            placeholder="••••••••"
          />
        </div>

        <div className="border-t border-[#E1E8F3]" />

        {/* New Password Field */}
        <div>
          <PasswordField
            id="new-password"
            label="Mật khẩu mới"
            autoComplete="new-password"
            value={fields.newPassword}
            onChange={(e) => setField('newPassword', e.target.value)}
            error={errors.newPassword}
            disabled={submitting}
            placeholder="••••••••"
            help="Ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt."
          />
        </div>

        {/* Confirm New Password Field */}
        <div>
          <PasswordField
            id="confirm-password"
            label="Xác nhận mật khẩu mới"
            autoComplete="new-password"
            value={fields.confirmPassword}
            onChange={(e) => setField('confirmPassword', e.target.value)}
            error={errors.confirmPassword}
            disabled={submitting}
            placeholder="••••••••"
          />
        </div>

        {/* Password Policy Reminder Card */}
        <div className="rounded-xl border border-[#D8E1E4] bg-[#F8FAFB] p-3.5 text-xs leading-relaxed text-[#59616B]">
          <p className="font-bold text-[#00152A] mb-1">Yêu cầu bảo mật:</p>
          <ul className="list-disc pl-4 space-y-0.5">
            <li>Tối thiểu 8 ký tự và không chứa khoảng trắng.</li>
            <li>Có ít nhất một chữ hoa (A–Z) và một chữ thường (a–z).</li>
            <li>Có ít nhất một chữ số (0–9) và một ký tự đặc biệt (!@#$%...).</li>
            <li>Mật khẩu mới không được trùng với mật khẩu hiện tại.</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          {onCancel ? (
            <ActionButton
              type="button"
              variant="outline"
              onClick={handleCancelClick}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              Hủy
            </ActionButton>
          ) : null}

          <ActionButton
            type="submit"
            variant="primary"
            loading={submitting}
            disabled={submitting}
            className="w-full sm:w-auto"
          >
            Đổi mật khẩu
          </ActionButton>
        </div>
      </form>
    </section>
  );
}
