'use client';

import { useState } from 'react';
import type {
  OperatorProfileDto,
  OperatorProfileValidationErrors,
  UpdateOperatorProfilePayload,
} from '../types/operatorProfile';
import { OPERATOR_PROFILE_MESSAGES } from '../types/operatorProfile';
import {
  OperatorProfileValidationError,
  updateOperatorProfile,
  validateOperatorProfile,
} from '../services/operatorProfileService';
import { OperatorLogoUpload } from './OperatorLogoUpload';

interface OperatorProfileViewProps {
  initialProfile: OperatorProfileDto;
  isDemo?: boolean;
  onProfileUpdated?: (updated: OperatorProfileDto) => void;
}

export function OperatorProfileView({
  initialProfile,
  isDemo = false,
  onProfileUpdated,
}: OperatorProfileViewProps) {
  // Form input states
  const [businessName, setBusinessName] = useState(initialProfile.businessName || '');
  const [businessDescription, setBusinessDescription] = useState(
    initialProfile.businessDescription || ''
  );
  const [businessAddress, setBusinessAddress] = useState(initialProfile.businessAddress || '');
  const [contactPhone, setContactPhone] = useState(initialProfile.contactPhone || '');
  const [contactEmail, setContactEmail] = useState(initialProfile.contactEmail || '');
  const [website, setWebsite] = useState(initialProfile.website || '');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(
    initialProfile.logoUrl || null
  );

  // Status & error states
  const [errors, setErrors] = useState<OperatorProfileValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [pendingIntegrationMessage, setPendingIntegrationMessage] = useState<string | null>(null);
  const [serverErrorMessage, setServerErrorMessage] = useState<string | null>(null);

  const handleLogoChange = (file: File | null, previewUrl: string | null) => {
    setLogoFile(file);
    setLogoPreviewUrl(previewUrl);
    if (errors.logo) {
      setErrors((prev) => ({ ...prev, logo: undefined }));
    }
  };

  const handleCancel = () => {
    // Restores last loaded baseline values (Section 22)
    setBusinessName(initialProfile.businessName || '');
    setBusinessDescription(initialProfile.businessDescription || '');
    setBusinessAddress(initialProfile.businessAddress || '');
    setContactPhone(initialProfile.contactPhone || '');
    setContactEmail(initialProfile.contactEmail || '');
    setWebsite(initialProfile.website || '');
    setLogoFile(null);
    setLogoPreviewUrl(initialProfile.logoUrl || null);
    setErrors({});
    setSaveSuccessMessage(null);
    setPendingIntegrationMessage(null);
    setServerErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccessMessage(null);
    setPendingIntegrationMessage(null);
    setServerErrorMessage(null);

    const payload: UpdateOperatorProfilePayload = {
      businessName,
      businessDescription,
      businessAddress,
      contactPhone,
      contactEmail,
      website,
      logoFile,
      logoPreviewUrl,
    };

    // Pre-validate locally
    const validationErrors = validateOperatorProfile(payload);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Accessibility: focus first invalid field
      const firstInvalidId = Object.keys(validationErrors)[0];
      const el = document.getElementById(`field-${firstInvalidId}`);
      if (el) el.focus();
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const result = await updateOperatorProfile(payload, {
        allowDemo: isDemo,
        currentProfile: initialProfile,
      });

      if (result.status === 'SUCCESS' && result.profile) {
        setSaveSuccessMessage(
          result.message || OPERATOR_PROFILE_MESSAGES.UPDATE_SUCCESS
        );
        if (onProfileUpdated) onProfileUpdated(result.profile);
      } else if (result.status === 'PENDING_BE_INTEGRATION') {
        setPendingIntegrationMessage(
          result.message || OPERATOR_PROFILE_MESSAGES.PENDING_BE_INTEGRATION
        );
      }
    } catch (err) {
      if (err instanceof OperatorProfileValidationError) {
        setErrors(err.errors);
      } else {
        setServerErrorMessage(
          err instanceof Error ? err.message : OPERATOR_PROFILE_MESSAGES.SYSTEM_FAILURE
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Top Banner Notifications */}
      {isDemo && (
        <div className="flex items-center justify-between rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-amber-600" aria-hidden="true">
              preview
            </span>
            <span>
              <strong>Bản xem trước DEMO:</strong> Đang xem hồ sơ doanh nghiệp mẫu ({initialProfile.businessName}).
            </span>
          </div>
          <span className="rounded bg-amber-200 px-2 py-0.5 font-bold uppercase text-[10px] text-amber-800">
            DEMO ONLY
          </span>
        </div>
      )}

      {/* Real Mode Pending Backend Integration Banner */}
      {!isDemo && (
        <div
          role="status"
          className="rounded-2xl border border-amber-300 bg-amber-50/90 p-4 text-xs text-amber-950 shadow-xs"
        >
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[24px] text-amber-600 shrink-0" aria-hidden="true">
              pending_actions
            </span>
            <div>
              <h3 className="text-sm font-bold text-amber-950">
                Tính năng hồ sơ đối tác đang chờ kết nối máy chủ
              </h3>
              <p className="mt-1 leading-relaxed text-amber-900">
                Giao diện và các quy tắc kiểm tra tính hợp lệ (tên doanh nghiệp, email, số điện thoại, định dạng logo) đã sẵn sàng.
                Dữ liệu hiện tại chưa được lưu trữ vào hệ thống máy chủ (Capstone_BE).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {saveSuccessMessage && (
        <div
          role="status"
          className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-900 shadow-xs"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-emerald-600" aria-hidden="true">
              check_circle
            </span>
            <span>{saveSuccessMessage}</span>
          </div>
        </div>
      )}

      {/* Pending Save Banner */}
      {pendingIntegrationMessage && (
        <div
          role="status"
          className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs font-bold text-amber-900 shadow-xs"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-amber-600" aria-hidden="true">
              info
            </span>
            <span>{pendingIntegrationMessage}</span>
          </div>
        </div>
      )}

      {/* Error Notification */}
      {serverErrorMessage && (
        <div
          role="alert"
          className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800 shadow-xs"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-rose-600" aria-hidden="true">
              error
            </span>
            <span>{serverErrorMessage}</span>
          </div>
        </div>
      )}

      {/* 2-Column Responsive Layout (Report 3 Screen #76 gr23) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Column (2/3 width on desktop): Company Information Form */}
        <div className="space-y-6 lg:col-span-2">
          <section
            aria-labelledby="section-company-info"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 id="section-company-info" className="text-base font-extrabold text-[#00152A]">
                  Thông tin doanh nghiệp
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Thông tin này sẽ được hiển thị công khai tới du khách trên các trang chi tiết tour.
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
                UC-34
              </span>
            </div>

            <div className="mt-5 space-y-4">
              {/* Business Name (Editable) */}
              <div>
                <label
                  htmlFor="field-businessName"
                  className="block text-xs font-bold text-[#00152A]"
                >
                  Tên doanh nghiệp lữ hành
                </label>
                <input
                  id="field-businessName"
                  type="text"
                  value={businessName}
                  onChange={(e) => {
                    setBusinessName(e.target.value);
                    if (errors.businessName) setErrors((prev) => ({ ...prev, businessName: undefined }));
                  }}
                  disabled={!isDemo && submitting}
                  placeholder="Ví dụ: Han River Travel Co., Ltd"
                  aria-invalid={Boolean(errors.businessName)}
                  aria-describedby={errors.businessName ? 'err-businessName' : undefined}
                  className={`mt-1.5 w-full rounded-xl border p-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#006B5F]/20 ${
                    errors.businessName
                      ? 'border-rose-400 focus:border-rose-500'
                      : 'border-slate-300 focus:border-[#006B5F]'
                  }`}
                />
                {errors.businessName && (
                  <p id="err-businessName" role="alert" className="mt-1.5 text-xs font-semibold text-rose-600">
                    {errors.businessName}
                  </p>
                )}
              </div>

              {/* Grid 2 Columns: Contact Phone & Business Email */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Contact Email (Editable per §3.8.1 -> MSG02 format check) */}
                <div>
                  <label
                    htmlFor="field-contactEmail"
                    className="block text-xs font-bold text-[#00152A]"
                  >
                    Email liên hệ công việc
                  </label>
                  <input
                    id="field-contactEmail"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => {
                      setContactEmail(e.target.value);
                      if (errors.contactEmail) setErrors((prev) => ({ ...prev, contactEmail: undefined }));
                    }}
                    disabled={!isDemo && submitting}
                    placeholder="contact@hanrivertravel.vn"
                    aria-invalid={Boolean(errors.contactEmail)}
                    aria-describedby={errors.contactEmail ? 'err-contactEmail' : undefined}
                    className={`mt-1.5 w-full rounded-xl border p-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#006B5F]/20 ${
                      errors.contactEmail
                        ? 'border-rose-400 focus:border-rose-500'
                        : 'border-slate-300 focus:border-[#006B5F]'
                    }`}
                  />
                  {errors.contactEmail && (
                    <p id="err-contactEmail" role="alert" className="mt-1.5 text-xs font-semibold text-rose-600">
                      {errors.contactEmail}
                    </p>
                  )}
                </div>

                {/* Contact Phone (Editable) */}
                <div>
                  <label
                    htmlFor="field-contactPhone"
                    className="block text-xs font-bold text-[#00152A]"
                  >
                    Số điện thoại liên hệ
                  </label>
                  <input
                    id="field-contactPhone"
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => {
                      setContactPhone(e.target.value);
                      if (errors.contactPhone) setErrors((prev) => ({ ...prev, contactPhone: undefined }));
                    }}
                    disabled={!isDemo && submitting}
                    placeholder="0236 388 1234"
                    aria-invalid={Boolean(errors.contactPhone)}
                    aria-describedby={errors.contactPhone ? 'err-contactPhone' : undefined}
                    className={`mt-1.5 w-full rounded-xl border p-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#006B5F]/20 ${
                      errors.contactPhone
                        ? 'border-rose-400 focus:border-rose-500'
                        : 'border-slate-300 focus:border-[#006B5F]'
                    }`}
                  />
                  {errors.contactPhone && (
                    <p id="err-contactPhone" role="alert" className="mt-1.5 text-xs font-semibold text-rose-600">
                      {errors.contactPhone}
                    </p>
                  )}
                </div>
              </div>

              {/* Head office address (Editable) */}
              <div>
                <label
                  htmlFor="field-businessAddress"
                  className="block text-xs font-bold text-[#00152A]"
                >
                  Địa chỉ trụ sở chính
                </label>
                <input
                  id="field-businessAddress"
                  type="text"
                  value={businessAddress}
                  onChange={(e) => {
                    setBusinessAddress(e.target.value);
                    if (errors.businessAddress) setErrors((prev) => ({ ...prev, businessAddress: undefined }));
                  }}
                  disabled={!isDemo && submitting}
                  placeholder="02 Nguyễn Văn Linh, Hải Châu, Đà Nẵng"
                  aria-invalid={Boolean(errors.businessAddress)}
                  aria-describedby={errors.businessAddress ? 'err-businessAddress' : undefined}
                  className={`mt-1.5 w-full rounded-xl border p-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#006B5F]/20 ${
                    errors.businessAddress
                      ? 'border-rose-400 focus:border-rose-500'
                      : 'border-slate-300 focus:border-[#006B5F]'
                  }`}
                />
                {errors.businessAddress && (
                  <p id="err-businessAddress" role="alert" className="mt-1.5 text-xs font-semibold text-rose-600">
                    {errors.businessAddress}
                  </p>
                )}
              </div>

              {/* Website: listed as UC-34 input data, but Report 3 does not explicitly identify it as a required field (SRS_AMBIGUITY_REQUIRED_FIELDS) */}
              <div>
                <label
                  htmlFor="field-website"
                  className="block text-xs font-bold text-[#00152A]"
                >
                  Website chính thức
                </label>
                <input
                  id="field-website"
                  type="text"
                  value={website}
                  onChange={(e) => {
                    setWebsite(e.target.value);
                    if (errors.website) setErrors((prev) => ({ ...prev, website: undefined }));
                  }}
                  disabled={!isDemo && submitting}
                  placeholder="https://hanrivertravel.vn"
                  className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#006B5F] focus:outline-hidden focus:ring-2 focus:ring-[#006B5F]/20"
                />
              </div>

              {/* Company description (Editable) */}
              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="field-businessDescription"
                    className="block text-xs font-bold text-[#00152A]"
                  >
                    Mô tả giới thiệu doanh nghiệp
                  </label>
                  <span className="text-xs font-semibold text-slate-400">
                    {businessDescription.trim().length} ký tự
                  </span>
                </div>
                <textarea
                  id="field-businessDescription"
                  rows={4}
                  value={businessDescription}
                  onChange={(e) => {
                    setBusinessDescription(e.target.value);
                    if (errors.businessDescription) setErrors((prev) => ({ ...prev, businessDescription: undefined }));
                  }}
                  disabled={!isDemo && submitting}
                  placeholder="Giới thiệu kinh nghiệm, lĩnh vực thế mạnh và cam kết chất lượng tour của doanh nghiệp..."
                  aria-invalid={Boolean(errors.businessDescription)}
                  aria-describedby={errors.businessDescription ? 'err-businessDescription' : undefined}
                  className={`mt-1.5 w-full rounded-xl border p-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#006B5F]/20 ${
                    errors.businessDescription
                      ? 'border-rose-400 focus:border-rose-500'
                      : 'border-slate-300 focus:border-[#006B5F]'
                  }`}
                />
                {errors.businessDescription && (
                  <p id="err-businessDescription" role="alert" className="mt-1.5 text-xs font-semibold text-rose-600">
                    {errors.businessDescription}
                  </p>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Secondary Column (1/3 width on desktop): Logo & Read-Only Legal Identity */}
        <div className="space-y-6">
          {/* Logo Upload Component (BR-16) */}
          <OperatorLogoUpload
            logoUrl={logoPreviewUrl || undefined}
            onLogoChange={handleLogoChange}
            disabled={submitting}
            isDemo={isDemo}
            error={errors.logo}
          />

          {/* Legal Documents Card (Read-only per BR-08, BR-17 & Screen #76) */}
          <section
            aria-labelledby="section-legal-docs"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 id="section-legal-docs" className="text-sm font-extrabold text-[#00152A]">
                Thông tin pháp lý & Tài khoản
              </h3>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                Cố định &bull; BR-08
              </span>
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              {/* Business Licence Number (Read-only, BR-08) */}
              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                <span className="text-slate-500">Số GPKD lữ hành:</span>
                <span className="font-mono font-bold text-[#00152A]">
                  {initialProfile.businessLicenceNumber || (
                    <span className="italic text-slate-400 font-sans">Chờ tích hợp máy chủ</span>
                  )}
                </span>
              </div>

              {/* Tax Code (Read-only, BR-08) */}
              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                <span className="text-slate-500">Mã số thuế:</span>
                <span className="font-mono font-bold text-[#00152A]">
                  {initialProfile.taxCode || (
                    <span className="italic text-slate-400 font-sans">Chờ tích hợp máy chủ</span>
                  )}
                </span>
              </div>

              {/* Approval Status (Read-only) */}
              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                <span className="text-slate-500">Trạng thái đối tác:</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  {initialProfile.approvalStatus === 'Approved' ? 'Đã duyệt (Hoạt động)' : initialProfile.approvalStatus}
                </span>
              </div>

              {/* Account Email (Read-only per BR-17) */}
              <div className="flex flex-col gap-1 border-b border-slate-50 pb-2">
                <span className="text-slate-500">Email tài khoản đăng nhập (BR-17):</span>
                <span className="font-medium text-slate-700 break-all">
                  {initialProfile.accountEmail || (
                    <span className="italic text-slate-400">Không có dữ liệu</span>
                  )}
                </span>
              </div>
            </div>

            {/* Legal Notice note from Screen #76 */}
            <p className="mt-4 rounded-xl bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-600 border border-slate-100">
              <span className="font-bold text-[#00152A]">Lưu ý:</span> Số giấy phép kinh doanh và mã số thuế là duy nhất và không thể tự chỉnh sửa qua chức năng này (BR-08). Mọi thay đổi thông tin pháp lý cần gửi hồ sơ để Quản trị viên xét duyệt lại.
            </p>
          </section>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="flex flex-wrap items-center justify-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <button
          type="button"
          onClick={handleCancel}
          disabled={submitting}
          className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 active:scale-95 disabled:opacity-50"
        >
          Hủy
        </button>

        <button
          type="submit"
          disabled={submitting || (!isDemo && true /* Section 21: disabled production mutation for maximum truthfulness */)}
          title={!isDemo ? 'Tính năng lưu đang chờ kết nối dịch vụ máy chủ' : undefined}
          className={`rounded-xl px-6 py-2.5 text-xs font-bold text-white shadow-2xs transition active:scale-95 ${
            !isDemo
              ? 'bg-slate-400 cursor-not-allowed'
              : 'bg-[#006B5F] hover:bg-[#00574D]'
          }`}
        >
          {submitting ? 'Đang lưu...' : !isDemo ? 'Lưu thông tin (Chờ máy chủ)' : 'Lưu thông tin'}
        </button>
      </div>
    </form>
  );
}
