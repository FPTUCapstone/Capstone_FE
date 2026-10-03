'use client';

import { ActionButton } from '@/components/ui/ActionButton';
import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { PasswordField } from '@/components/ui/FormControls';
import { StatusBadge } from '@/components/ui/StatusBadge';

import {
  pendingChangePasswordCapability,
  type ChangePasswordCapability,
} from './changePasswordCapability';
import { useChangePassword } from './useChangePassword';

export interface UserDisplayInfo {
  name?: string;
  email?: string;
  role?: string;
}

export interface ChangePasswordFormProps {
  userDisplay?: UserDisplayInfo;
  onCancel?: () => void;
  onSuccess?: () => void;
  capability?: ChangePasswordCapability;
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
  onSuccess,
  capability = pendingChangePasswordCapability,
  className = '',
}: ChangePasswordFormProps) {
  const { fields, errors, submitting, success, setField, handleSubmit, reset } =
    useChangePassword({ capability, onSuccess });
  const integrationPending = capability.status === 'pending';
  const initials = getInitials(userDisplay?.name, userDisplay?.email);

  function handleCancelClick() {
    reset();
    onCancel?.();
  }

  return (
    <section
      aria-labelledby="change-password-heading"
      className={`rounded-2xl border border-[#D8E1E4] bg-white p-6 shadow-xs sm:p-8 ${className}`}
      data-integration-status={
        integrationPending ? capability.integrationStatus : 'AVAILABLE'
      }
    >
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
          Kiểm tra yêu cầu bảo mật cho mật khẩu hiện tại và mật khẩu mới của bạn.
        </p>
      </div>

      {userDisplay?.email || userDisplay?.name ? (
        <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-[#E1E8F3] bg-[#F8FAFB] p-3.5 sm:p-4">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#00152A] text-xs font-bold text-white"
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

      {integrationPending ? (
        <div id="change-password-pending-description" className="mb-6">
          <FeedbackAlert tone="warning" title="Chức năng chưa khả dụng">
            <p>Tính năng đổi mật khẩu đang chờ tích hợp máy chủ.</p>
            <p>Bạn chưa thể cập nhật mật khẩu ở thời điểm hiện tại.</p>
          </FeedbackAlert>
        </div>
      ) : null}

      {success ? (
        <div className="mb-6">
          <FeedbackAlert tone="success" title="Thành công">
            Mật khẩu đã được cập nhật thành công. Bạn có thể sử dụng mật khẩu mới cho
            các lần đăng nhập tiếp theo.
          </FeedbackAlert>
        </div>
      ) : null}

      {errors.form ? (
        <div className="mb-6">
          <FeedbackAlert tone="error" title="Không thể đổi mật khẩu">
            {errors.form}
          </FeedbackAlert>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <PasswordField
          id="current-password"
          label="Mật khẩu hiện tại"
          autoComplete="current-password"
          value={fields.currentPassword}
          onChange={(event) => setField('currentPassword', event.target.value)}
          error={errors.currentPassword}
          disabled={submitting || integrationPending}
          placeholder="••••••••"
        />

        <div className="border-t border-[#E1E8F3]" />

        <PasswordField
          id="new-password"
          label="Mật khẩu mới"
          autoComplete="new-password"
          value={fields.newPassword}
          onChange={(event) => setField('newPassword', event.target.value)}
          error={errors.newPassword}
          disabled={submitting || integrationPending}
          placeholder="••••••••"
          help="Ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt."
        />

        <PasswordField
          id="confirm-password"
          label="Xác nhận mật khẩu mới"
          autoComplete="new-password"
          value={fields.confirmPassword}
          onChange={(event) => setField('confirmPassword', event.target.value)}
          error={errors.confirmPassword}
          disabled={submitting || integrationPending}
          placeholder="••••••••"
        />

        <div className="rounded-xl border border-[#D8E1E4] bg-[#F8FAFB] p-3.5 text-xs leading-relaxed text-[#59616B]">
          <p className="mb-1 font-bold text-[#00152A]">Yêu cầu bảo mật:</p>
          <ul className="list-disc space-y-0.5 pl-4">
            <li>Tối thiểu 8 ký tự và không chứa khoảng trắng.</li>
            <li>Có ít nhất một chữ hoa (A–Z) và một chữ thường (a–z).</li>
            <li>Có ít nhất một chữ số (0–9) và một ký tự đặc biệt (!@#$%...).</li>
            <li>Mật khẩu mới không được trùng với mật khẩu hiện tại.</li>
          </ul>
        </div>

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
            disabled={submitting || integrationPending}
            aria-describedby={
              integrationPending ? 'change-password-pending-description' : undefined
            }
            className="w-full sm:w-auto"
          >
            Đổi mật khẩu
          </ActionButton>
        </div>
      </form>
    </section>
  );
}
