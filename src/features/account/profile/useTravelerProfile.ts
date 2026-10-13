import { useCallback, useEffect, useState } from 'react';

import {
  getTravelerProfile,
  TravelerProfileApiError,
  updateTravelerProfile,
  type TravelerProfileDto,
} from './travelerProfileApi';

export interface TravelerProfileFormFields {
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  avatarUrl: string;
}

export interface UseTravelerProfileOptions {
  initialProfile?: Partial<TravelerProfileDto>;
  onSuccess?: (profile: TravelerProfileDto) => void;
  onUnauthorized?: () => void;
}

export const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function validateFullName(name: string): string | undefined {
  const trimmed = name.trim();
  if (!trimmed) return 'Vui lòng nhập họ và tên.';
  if (trimmed.length > 100) return 'Họ và tên không được vượt quá 100 ký tự.';
  return undefined;
}

export function validatePhoneNumber(phone: string): string | undefined {
  const trimmed = phone.trim();
  if (trimmed && !/^0\d{9}$/.test(trimmed))
    return 'Số điện thoại không hợp lệ. Số điện thoại phải gồm 10 chữ số bắt đầu bằng số 0.';
  return undefined;
}

export function validateDateOfBirth(value: string): string | undefined {
  if (!value) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return 'Ngày sinh không hợp lệ.';
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day)
    return 'Ngày sinh không hợp lệ.';
  const today = new Date();
  const limit = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
  if (date > limit) return 'Người dùng phải từ 16 tuổi trở lên (BR-18).';
  return undefined;
}

export function validateAvatarFile(file: File): string | undefined {
  if (file.size === 0 || file.size > MAX_AVATAR_SIZE_BYTES)
    return 'Kích thước ảnh phải lớn hơn 0 và không vượt quá 5 MB.';
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type))
    return 'Định dạng hình ảnh không hợp lệ. Vui lòng chọn tệp JPG, PNG hoặc WEBP.';
  return undefined;
}

function asFields(profile: Partial<TravelerProfileDto>): TravelerProfileFormFields {
  return {
    fullName: profile.fullName ?? '',
    email: profile.email ?? '',
    phoneNumber: profile.phoneNumber ?? '',
    dateOfBirth: profile.dateOfBirth ?? '',
    avatarUrl: profile.avatarUrl ?? '',
  };
}

export function useTravelerProfile(options: UseTravelerProfileOptions = {}) {
  const { initialProfile, onSuccess, onUnauthorized } = options;
  const [fields, setFields] = useState<TravelerProfileFormFields>(() => asFields(initialProfile ?? {}));
  const [initialLoadedData, setInitialLoadedData] = useState<TravelerProfileDto | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | undefined>();
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    getTravelerProfile().then((data) => {
      if (!active) return;
      setInitialLoadedData(data);
      setFields(asFields(data));
      setLoadError(null);
    }).catch((error: unknown) => {
      if (!active) return;
      if (error instanceof TravelerProfileApiError && error.status === 401) onUnauthorized?.();
      setLoadError(error instanceof Error ? error.message : 'Không thể tải hồ sơ. Vui lòng thử lại.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [onUnauthorized, loadAttempt]);

  const retryLoad = useCallback(() => {
    setLoadError(null);
    setLoading(true);
    setLoadAttempt((count) => count + 1);
  }, []);

  const setField = useCallback(
    <K extends keyof TravelerProfileFormFields>(field: K, value: TravelerProfileFormFields[K]) => {
      setFields((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        delete next.form;
        return next;
      });
      setSuccess(false);
    }, []);

  const handleAvatarChange = useCallback((file: File) => {
    const error = validateAvatarFile(file);
    if (error) {
      setErrors((prev) => ({ ...prev, avatar: error }));
      return;
    }
    setErrors((prev) => ({ ...prev, avatar: '' }));
    setAvatarFile(file);
    setRemoveAvatar(false);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string')
        setFields((prev) => ({ ...prev, avatarUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
    setSuccess(false);
  }, []);

  const handleAvatarRemove = useCallback(() => {
    setAvatarFile(undefined);
    setRemoveAvatar(true);
    setFields((prev) => ({ ...prev, avatarUrl: '' }));
    setErrors((prev) => ({ ...prev, avatar: '' }));
    setSuccess(false);
  }, []);

  const reset = useCallback(() => {
    if (initialLoadedData) setFields(asFields(initialLoadedData));
    setAvatarFile(undefined);
    setRemoveAvatar(false);
    setErrors({});
    setSuccess(false);
  }, [initialLoadedData]);

  const handleSubmit = useCallback(async (): Promise<boolean> => {
    if (!initialLoadedData || loadError) return false;
    setSuccess(false);
    const fieldErrors: Record<string, string> = {};
    const nameError = validateFullName(fields.fullName);
    const phoneError = validatePhoneNumber(fields.phoneNumber);
    const dobError = validateDateOfBirth(fields.dateOfBirth);
    if (nameError) fieldErrors.fullName = nameError;
    if (phoneError) fieldErrors.phoneNumber = phoneError;
    if (dobError) fieldErrors.dateOfBirth = dobError;
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const result = await updateTravelerProfile({
        fullName: fields.fullName.trim(),
        phoneNumber: fields.phoneNumber.trim(),
        dateOfBirth: fields.dateOfBirth || undefined,
        avatarFile,
        removeAvatar,
      });
      setFields(asFields(result.profile));
      setInitialLoadedData(result.profile);
      setAvatarFile(undefined);
      setRemoveAvatar(false);
      setSuccess(true);
      onSuccess?.(result.profile);
      return true;
    } catch (error: unknown) {
      if (error instanceof TravelerProfileApiError && error.status === 401) {
        onUnauthorized?.();
      } else if (error instanceof TravelerProfileApiError && error.code === 'MSG_PHONE_DUP') {
        setErrors({ phoneNumber: error.message });
      } else {
        setErrors({ form: error instanceof Error ? error.message :
          'Không thể cập nhật hồ sơ lúc này. Vui lòng thử lại.' });
      }
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [avatarFile, fields, initialLoadedData, loadError, onSuccess, onUnauthorized, removeAvatar]);

  return { fields, errors, loading, loadError, submitting, success, retryLoad,
    setField, handleAvatarChange, handleAvatarRemove, handleSubmit, reset };
}
