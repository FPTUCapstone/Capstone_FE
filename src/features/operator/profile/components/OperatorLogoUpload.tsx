'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { OPERATOR_PROFILE_MESSAGES } from '../types/operatorProfile';

interface OperatorLogoUploadProps {
  logoUrl?: string;
  onLogoChange: (file: File | null, previewUrl: string | null) => void;
  onRemoveLogo?: () => void;
  disabled?: boolean;
  isDemo?: boolean;
  error?: string;
  className?: string;
}

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB per BR-16
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function OperatorLogoUpload({
  logoUrl,
  onLogoChange,
  onRemoveLogo,
  disabled = false,
  isDemo = false,
  error,
  className = '',
}: OperatorLogoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createdUrlsRef = useRef<Set<string>>(new Set());
  const [localError, setLocalError] = useState<string | null>(null);

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
    if (disabled) return;
    setLocalError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const mime = file.type.toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(mime) || file.size <= 0 || file.size > MAX_BYTES) {
      setLocalError(OPERATOR_PROFILE_MESSAGES.INVALID_LOGO);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    createdUrlsRef.current.add(previewUrl);
    onLogoChange(file, previewUrl);
  };

  const handleRemove = () => {
    if (disabled) return;
    if (logoUrl && logoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(logoUrl);
      createdUrlsRef.current.delete(logoUrl);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    setLocalError(null);
    if (onRemoveLogo) {
      onRemoveLogo();
    } else {
      onLogoChange(null, null);
    }
  };

  const displayError = error || localError;

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-xs ${className}`}
    >
      <h3 className="text-sm font-extrabold text-[#1C2928]">Logo doanh nghiệp</h3>
      <p className="mt-0.5 text-xs text-slate-500">
        JPG, PNG, WebP &bull; Dung lượng tối đa 5MB (BR-16)
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
              unoptimized={
                logoUrl.startsWith('blob:') ||
                logoUrl.startsWith('data:') ||
                logoUrl.startsWith('http://') ||
                logoUrl.startsWith('https://')
              }
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
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          disabled={disabled}
          className="sr-only"
          aria-label="Tải lên ảnh logo doanh nghiệp"
          aria-describedby={displayError ? 'logo-error-msg' : undefined}
        />

        {/* Action Controls */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#174B4A] bg-[#E6F4F1] px-3 py-1.5 text-xs font-bold text-[#174B4A] transition hover:bg-[#d2ede8] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                delete
              </span>
              Xóa
            </button>
          ) : null}
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
