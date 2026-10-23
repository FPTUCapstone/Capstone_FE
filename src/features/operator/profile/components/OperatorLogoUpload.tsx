'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { OPERATOR_PROFILE_MESSAGES } from '../types/operatorProfile';

interface OperatorLogoUploadProps {
  logoUrl?: string;
  onLogoChange: (file: File | null, previewUrl: string | null) => void;
  disabled?: boolean;
  isDemo?: boolean;
  error?: string;
  className?: string;
}

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB per BR-16

export function OperatorLogoUpload({
  logoUrl,
  onLogoChange,
  disabled = false,
  isDemo = false,
  error,
  className = '',
}: OperatorLogoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createdUrlsRef = useRef<Set<string>>(new Set());
  const [localError, setLocalError] = useState<string | null>(null);

  // Revoke all created object URLs strictly on component unmount
  useEffect(() => {
    const createdUrls = createdUrlsRef.current;
    return () => {
      createdUrls.forEach((url) => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
      createdUrls.clear();
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isDemo || disabled) return;
    setLocalError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // BR-16: Uploaded logo must be an image file whose size does not exceed 5 MB.
    const isImage = file.type.toLowerCase().startsWith('image/');

    if (!isImage || file.size > MAX_BYTES) {
      setLocalError(OPERATOR_PROFILE_MESSAGES.INVALID_LOGO);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Create object URL for local preview in demo mode
    const previewUrl = URL.createObjectURL(file);
    createdUrlsRef.current.add(previewUrl);
    onLogoChange(file, previewUrl);
  };

  const handleRemove = () => {
    if (!isDemo || disabled) return;
    if (logoUrl && logoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(logoUrl);
      createdUrlsRef.current.delete(logoUrl);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    setLocalError(null);
    onLogoChange(null, null);
  };

  const displayError = error || localError;

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-xs ${className}`}
    >
      <h3 className="text-sm font-extrabold text-[#00152A]">Logo doanh nghiệp</h3>
      <p className="mt-0.5 text-xs text-slate-500">
        Tệp hình ảnh &bull; Dung lượng tối đa 5MB (BR-16)
      </p>

      {/* Logo Preview Container */}
      <div className="mt-4 flex flex-col items-center justify-center">
        <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 shadow-2xs">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt="Logo doanh nghiệp"
              fill
              sizes="96px"
              className="object-contain p-2"
              unoptimized={logoUrl.startsWith('blob:') || logoUrl.startsWith('data:')}
            />
          ) : (
            <span
              className="material-symbols-outlined text-[36px] text-slate-400"
              aria-hidden="true"
            >
              domain
            </span>
          )}
        </div>

        {/* Hidden native file input */}
        <input
          ref={fileInputRef}
          type="file"
          id="operator-logo-input"
          accept="image/*"
          onChange={handleFileChange}
          disabled={disabled || !isDemo}
          className="sr-only"
          aria-label="Tải lên ảnh logo doanh nghiệp"
          aria-describedby={displayError ? 'logo-error-msg' : undefined}
        />

        {/* Action Controls */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          {isDemo ? (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#006B5F] bg-[#E6F4F1] px-3 py-1.5 text-xs font-bold text-[#006B5F] transition hover:bg-[#d2ede8] active:scale-95 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                  upload
                </span>
                {logoUrl ? 'Thay đổi logo' : 'Tải lên logo'}
              </button>

              {logoUrl ? (
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={disabled}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 active:scale-95 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                    delete
                  </span>
                  Xóa
                </button>
              ) : null}
            </>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-semibold text-amber-800">
              <span className="material-symbols-outlined inline-block align-middle text-[14px] mr-1">
                info
              </span>
              Tính năng tải logo đang chờ kết nối máy chủ
            </div>
          )}
        </div>

        {/* Demo note */}
        {isDemo && logoUrl ? (
          <p className="mt-2 text-[10px] text-amber-700">
            Xem trước cục bộ &bull; Ảnh chưa tải lên máy chủ
          </p>
        ) : null}

        {/* Error message */}
        {displayError && (
          <p
            id="logo-error-msg"
            role="alert"
            className="mt-2 text-xs font-semibold text-rose-600"
          >
            {displayError}
          </p>
        )}
      </div>
    </div>
  );
}
