'use client';

import { useId, useMemo, useRef } from 'react';

import { ActionButton } from '@/components/ui/ActionButton';
import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { TextField } from '@/components/ui/FormControls';
import {
  useTravelerProfile,
  type TravelerProfileFormFields,
  type UseTravelerProfileOptions,
} from './useTravelerProfile';

export interface TravelerProfileFormProps extends UseTravelerProfileOptions {
  onCancel?: () => void;
  className?: string;
}

function getInitials(name?: string, email?: string): string {
  const source = name?.trim() || email?.trim() || 'TM';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function TravelerProfileForm({
  accessToken,
  initialProfile,
  onSuccess,
  onUnauthorized,
  onCancel,
  className = '',
}: TravelerProfileFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const genderSelectId = useId();

  const {
    fields,
    errors,
    loading,
    submitting,
    success,
    successMessage,
    backendFallbackNotice,
    setField,
    handleAvatarChange,
    handleAvatarRemove,
    handleSubmit,
    reset,
  } = useTravelerProfile({
    accessToken,
    initialProfile,
    onSuccess,
    onUnauthorized,
  });

  // Calculate the max date for 16 years old (BR-18)
  const maxDobDate = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 16);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      handleAvatarChange(file);
    }
    // Clear input so selecting the same file again triggers change
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function handleCancelClick() {
    reset();
    if (onCancel) {
      onCancel();
    }
  }

  const initials = getInitials(fields.fullName, fields.email);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-8 w-8 animate-spin rounded-full border-3 border-[#006B5F] border-t-transparent"
            aria-hidden="true"
          />
          <p className="text-xs font-semibold text-[#59616B]">Đang tải thông tin hồ sơ…</p>
        </div>
      </div>
    );
  }

  return (
    <section
      aria-labelledby="traveler-profile-heading"
      className={`rounded-2xl border border-[#D8E1E4] bg-white p-6 shadow-xs sm:p-8 ${className}`}
    >
      {/* Header Eyebrow & Title */}
      <div className="mb-6">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#006B5F]">
          Hồ sơ cá nhân
        </p>
        <h1
          id="traveler-profile-heading"
          className="mt-1 text-2xl font-black tracking-tight text-[#00152A] sm:text-3xl"
        >
          Thông tin cá nhân
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[#59616B]">
          Cập nhật thông tin định danh và liên hệ của bạn để có trải nghiệm du lịch cá nhân hóa tốt nhất.
        </p>
      </div>

      {/* Top-Level Success Feedback (MSG20) */}
      {success ? (
        <div className="mb-6">
          <FeedbackAlert tone="success" title="Thành công">
            {successMessage || 'Cập nhật thông tin hồ sơ thành công.'}
          </FeedbackAlert>
        </div>
      ) : null}

      {/* Top-Level Backend Notice (PENDING_BE_INTEGRATION) */}
      {backendFallbackNotice ? (
        <div className="mb-6">
          <FeedbackAlert tone="warning" title="Chế độ mô phỏng máy chủ">
            {backendFallbackNotice}
          </FeedbackAlert>
        </div>
      ) : null}

      {/* Top-Level Form Error Feedback */}
      {errors.form ? (
        <div className="mb-6">
          <FeedbackAlert tone="error" title="Lỗi cập nhật">
            {errors.form}
          </FeedbackAlert>
        </div>
      ) : null}

      {/* Avatar Management Section (BR-16) */}
      <div className="mb-8 rounded-xl border border-[#E1E8F3] bg-[#F8FAFB] p-5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Ảnh đại diện (Avatar)
        </h2>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-[#00152A] shadow-md">
            {fields.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={fields.avatarUrl}
                alt={`Ảnh đại diện của ${fields.fullName || 'người dùng'}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xl font-bold text-white" aria-hidden="true">
                {initials}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                id="avatar-upload-input"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={handleFileSelected}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#006B5F]"
              >
                <span className="material-symbols-outlined text-sm" aria-hidden="true">
                  photo_camera
                </span>
                Chọn ảnh mới
              </button>

              {fields.avatarUrl ? (
                <button
                  type="button"
                  onClick={handleAvatarRemove}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400"
                >
                  <span className="material-symbols-outlined text-sm" aria-hidden="true">
                    delete
                  </span>
                  Xóa ảnh
                </button>
              ) : null}
            </div>

            <p className="text-[11px] text-[#59616B]">
              Định dạng cho phép: JPG, PNG, WEBP. Dung lượng tối đa: 5MB (BR-16).
            </p>

            {errors.avatar ? (
              <p role="alert" className="text-[11px] font-semibold text-red-600">
                <span aria-hidden="true">⚠ </span>
                {errors.avatar}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Main Profile Form */}
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="space-y-5"
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Full Name (Required, MSG01) */}
          <TextField
            id="profile-fullname"
            label="Họ và tên"
            name="fullName"
            value={fields.fullName}
            onChange={(e) => setField('fullName', e.target.value)}
            error={errors.fullName}
            placeholder="Ví dụ: Nguyễn Văn A"
            autoComplete="name"
            disabled={submitting}
            required
          />

          {/* Email (Read-only, BR-17) */}
          <div>
            <label
              htmlFor="profile-email"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
            >
              <span className="flex items-center justify-between gap-2">
                <span>Địa chỉ Email</span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 normal-case tracking-normal">
                  Chỉ đọc (BR-17)
                </span>
              </span>
            </label>
            <div className="relative mt-1.5">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  lock
                </span>
              </span>
              <input
                id="profile-email"
                type="email"
                value={fields.email}
                readOnly
                disabled
                aria-readonly="true"
                className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3.5 text-sm text-slate-500 shadow-[0_1px_2px_rgba(15,27,45,0.06)]"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Email dùng để xác thực và nhận thông báo bảo mật, không thể thay đổi trực tiếp.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Phone Number (Required, 10 digits starting with 0, MSG04) */}
          <TextField
            id="profile-phone"
            label="Số điện thoại"
            name="phoneNumber"
            type="tel"
            value={fields.phoneNumber}
            onChange={(e) => setField('phoneNumber', e.target.value)}
            error={errors.phoneNumber}
            placeholder="0912345678"
            autoComplete="tel"
            disabled={submitting}
            required
            help="Số điện thoại di động 10 chữ số bắt đầu bằng 0 (MSG04)."
          />

          {/* Date of Birth (Optional, age >= 16, BR-18) */}
          <div>
            <label
              htmlFor="profile-dob"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
            >
              <span className="flex items-center justify-between gap-2">
                <span>Ngày sinh</span>
                <span className="font-medium normal-case tracking-normal text-slate-400">
                  Tối thiểu 16 tuổi (BR-18)
                </span>
              </span>
            </label>
            <div className="relative mt-1.5">
              <input
                id="profile-dob"
                type="date"
                max={maxDobDate}
                value={fields.dateOfBirth}
                onChange={(e) => setField('dateOfBirth', e.target.value)}
                disabled={submitting}
                aria-invalid={Boolean(errors.dateOfBirth)}
                className={`w-full rounded-xl border bg-white px-3.5 py-3 text-sm text-slate-800 shadow-[0_1px_2px_rgba(15,27,45,0.06)] transition focus:border-[#006B5F] focus:outline-none focus:ring-2 focus:ring-[#006B5F]/30 ${
                  errors.dateOfBirth
                    ? 'border-red-500 bg-red-50'
                    : 'border-[#D8E1E4] hover:border-slate-400'
                }`}
              />
            </div>
            {errors.dateOfBirth ? (
              <span
                role="alert"
                className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-red-600"
              >
                <span aria-hidden="true">⚠</span> {errors.dateOfBirth}
              </span>
            ) : (
              <span className="mt-1 flex items-center gap-1 text-[11px] text-[#59616B]">
                <span className="material-symbols-outlined text-[14px] text-[#006B5F]" aria-hidden="true">
                  info
                </span>
                Người dùng phải từ 16 tuổi trở lên tính đến thời điểm hiện tại.
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Gender */}
          <div>
            <label
              htmlFor={genderSelectId}
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
            >
              Giới tính
            </label>
            <div className="relative mt-1.5">
              <select
                id={genderSelectId}
                name="gender"
                value={fields.gender}
                onChange={(e) =>
                  setField('gender', e.target.value as TravelerProfileFormFields['gender'])
                }
                disabled={submitting}
                className="w-full rounded-xl border border-[#D8E1E4] bg-white px-3.5 py-3 text-sm text-slate-800 shadow-[0_1px_2px_rgba(15,27,45,0.06)] transition hover:border-slate-400 focus:border-[#006B5F] focus:outline-none focus:ring-2 focus:ring-[#006B5F]/30"
              >
                <option value="">-- Chưa chọn --</option>
                <option value="Male">Nam</option>
                <option value="Female">Nữ</option>
                <option value="Other">Khác</option>
              </select>
            </div>
          </div>

          {/* Address */}
          <TextField
            id="profile-address"
            label="Địa chỉ cư trú"
            name="address"
            value={fields.address}
            onChange={(e) => setField('address', e.target.value)}
            placeholder="Ví dụ: Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh"
            disabled={submitting}
            optional
          />
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
          <ActionButton
            type="button"
            variant="outline"
            onClick={handleCancelClick}
            disabled={submitting}
          >
            Hủy thay đổi
          </ActionButton>

          <ActionButton
            type="submit"
            variant="teal"
            loading={submitting}
            disabled={submitting}
          >
            Lưu thay đổi
          </ActionButton>
        </div>
      </form>
    </section>
  );
}
