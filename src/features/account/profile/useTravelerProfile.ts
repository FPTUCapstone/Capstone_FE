import { useCallback, useEffect, useState } from 'react';

import { isApiError } from '@/lib/authApi';
import {
  getTravelerProfile,
  LocalProfileStorageError,
  updateTravelerProfile,
  type TravelerProfileDto,
  type UpdateTravelerProfilePayload,
} from './travelerProfileApi';

export interface TravelerProfileFormFields {
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other' | '';
  address: string;
  avatarUrl: string;
}

export interface UseTravelerProfileOptions {
  accessToken?: string;
  initialProfile?: Partial<TravelerProfileDto>;
  onSuccess?: (profile: TravelerProfileDto) => void;
  onUnauthorized?: () => void;
}

export const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024; // 5MB (BR-16)
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function validateFullName(name: string): string | undefined {
  const trimmed = name.trim();
  if (!trimmed) {
    return 'Vui lòng nhập họ và tên.';
  }
  if (trimmed.length > 100) {
    return 'Họ và tên không được vượt quá 100 ký tự.';
  }
  return undefined;
}

export function validatePhoneNumber(phone: string): string | undefined {
  const trimmed = phone.trim();
  if (!trimmed) {
    return 'Vui lòng nhập số điện thoại.';
  }
  // Vietnamese phone format: 10 digits starting with 0 (MSG04)
  if (!/^0\d{9}$/.test(trimmed)) {
    return 'Số điện thoại không hợp lệ. Số điện thoại phải gồm 10 chữ số bắt đầu bằng số 0.';
  }
  return undefined;
}

export function validateDateOfBirth(dobStr: string): string | undefined {
  if (!dobStr) {
    return undefined; // Optional if not yet specified
  }

  const dob = new Date(dobStr);
  if (isNaN(dob.getTime())) {
    return 'Ngày sinh không hợp lệ.';
  }

  const today = new Date();
  if (dob > today) {
    return 'Ngày sinh không thể ở trong tương lai.';
  }

  // BR-18: User must be at least 16 years old
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  if (age < 16) {
    return 'Người dùng phải từ 16 tuổi trở lên (BR-18).';
  }

  return undefined;
}

export function validateAvatarFile(file: File): string | undefined {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return 'Định dạng hình ảnh không hợp lệ. Vui lòng chọn tệp JPG, PNG hoặc WEBP.';
  }
  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    return 'Kích thước tệp vượt quá 5MB. Vui lòng chọn hình ảnh nhỏ hơn (BR-16).';
  }
  return undefined;
}

export function useTravelerProfile(options: UseTravelerProfileOptions = {}) {
  const { accessToken, initialProfile, onSuccess, onUnauthorized } = options;

  const [fields, setFields] = useState<TravelerProfileFormFields>({
    fullName: initialProfile?.fullName ?? '',
    email: initialProfile?.email ?? '',
    phoneNumber: initialProfile?.phoneNumber ?? '',
    dateOfBirth: initialProfile?.dateOfBirth ?? '',
    gender: (initialProfile?.gender as TravelerProfileFormFields['gender']) ?? '',
    address: initialProfile?.address ?? '',
    avatarUrl: initialProfile?.avatarUrl ?? '',
  });

  const [initialLoadedData, setInitialLoadedData] = useState<TravelerProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [backendFallbackNotice, setBackendFallbackNotice] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load existing profile on mount
  useEffect(() => {
    let active = true;

    async function fetchProfile() {
      try {
        setLoading(true);
        const data = await getTravelerProfile({ accessToken });
        if (active) {
          setInitialLoadedData(data);
          setFields({
            fullName: data.fullName ?? initialProfile?.fullName ?? '',
            email: data.email ?? initialProfile?.email ?? '',
            phoneNumber: data.phoneNumber ?? initialProfile?.phoneNumber ?? '',
            dateOfBirth: data.dateOfBirth ?? initialProfile?.dateOfBirth ?? '',
            gender: (data.gender as TravelerProfileFormFields['gender']) ?? initialProfile?.gender ?? '',
            address: data.address ?? initialProfile?.address ?? '',
            avatarUrl: data.avatarUrl ?? initialProfile?.avatarUrl ?? '',
          });
        }
      } catch {
        // Safe fallback
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchProfile();

    return () => {
      active = false;
    };
  }, [
    accessToken,
    initialProfile?.address,
    initialProfile?.avatarUrl,
    initialProfile?.dateOfBirth,
    initialProfile?.email,
    initialProfile?.fullName,
    initialProfile?.gender,
    initialProfile?.phoneNumber,
  ]);

  const setField = useCallback(
    <K extends keyof TravelerProfileFormFields>(field: K, value: TravelerProfileFormFields[K]) => {
      setFields((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => {
        if (!prev[field] && !prev.form) return prev;
        const next = { ...prev };
        delete next[field];
        delete next.form;
        return next;
      });
      setSuccess(false);
      setBackendFallbackNotice(null);
    },
    [],
  );

  const handleAvatarChange = useCallback((file: File) => {
    const error = validateAvatarFile(file);
    if (error) {
      setErrors((prev) => ({ ...prev, avatar: error }));
      return;
    }

    setErrors((prev) => {
      const next = { ...prev };
      delete next.avatar;
      return next;
    });

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setFields((prev) => ({ ...prev, avatarUrl: result }));
        setSuccess(false);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleAvatarRemove = useCallback(() => {
    setFields((prev) => ({ ...prev, avatarUrl: '' }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.avatar;
      return next;
    });
    setSuccess(false);
  }, []);

  const reset = useCallback(() => {
    if (initialLoadedData) {
      setFields({
        fullName: initialLoadedData.fullName ?? '',
        email: initialLoadedData.email ?? '',
        phoneNumber: initialLoadedData.phoneNumber ?? '',
        dateOfBirth: initialLoadedData.dateOfBirth ?? '',
        gender: (initialLoadedData.gender as TravelerProfileFormFields['gender']) ?? '',
        address: initialLoadedData.address ?? '',
        avatarUrl: initialLoadedData.avatarUrl ?? '',
      });
    }
    setErrors({});
    setSuccess(false);
    setBackendFallbackNotice(null);
  }, [initialLoadedData]);

  const handleSubmit = useCallback(async (): Promise<boolean> => {
    setSuccess(false);
    setBackendFallbackNotice(null);

    // Client-side validations
    const fieldErrors: Record<string, string> = {};

    const fullNameError = validateFullName(fields.fullName);
    if (fullNameError) fieldErrors.fullName = fullNameError;

    const phoneError = validatePhoneNumber(fields.phoneNumber);
    if (phoneError) fieldErrors.phoneNumber = phoneError;

    const dobError = validateDateOfBirth(fields.dateOfBirth);
    if (dobError) fieldErrors.dateOfBirth = dobError;

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return false;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const payload: UpdateTravelerProfilePayload = {
        fullName: fields.fullName.trim(),
        phoneNumber: fields.phoneNumber.trim(),
        dateOfBirth: fields.dateOfBirth || undefined,
        gender: fields.gender || undefined,
        address: fields.address.trim() || undefined,
        avatarUrl: fields.avatarUrl || undefined,
      };

      const result = await updateTravelerProfile(payload, { accessToken });

      setSuccess(true);
      setSuccessMessage(result.message || 'Thông tin tạm thời đã được lưu trên thiết bị này.');
      setBackendFallbackNotice(result.notice || 'Đồng bộ hồ sơ với máy chủ đang chờ tích hợp.');

      onSuccess?.(result.profile);
      return true;
    } catch (err: unknown) {
      if (isApiError(err)) {
        if (err.status === 401 && onUnauthorized) {
          onUnauthorized();
          return false;
        }

        if (err.errors) {
          setErrors(err.errors);
        } else {
          setErrors({
            form: err.message || 'Không thể cập nhật hồ sơ lúc này. Vui lòng thử lại sau.',
          });
        }
      } else if (err instanceof LocalProfileStorageError) {
        setErrors({
          form: err.message,
        });
      } else {
        setErrors({
          form: 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau.',
        });
      }
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [accessToken, fields, onSuccess, onUnauthorized]);

  return {
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
  };
}
