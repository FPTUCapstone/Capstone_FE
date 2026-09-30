'use client';

import { useState } from 'react';

import { isApiError } from '@/lib/authApi';
import { validatePassword } from '@/lib/passwordPolicy';

import {
  changePassword,
  type ChangePasswordRequest,
  type ChangePasswordResponse,
} from './changePasswordApi';

export interface ChangePasswordFormState {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  form?: string;
}

export interface UseChangePasswordOptions {
  accessToken?: string;
  onSuccess?: (response: ChangePasswordResponse) => void;
  onUnauthorized?: () => void;
}

const initialFields: ChangePasswordFormState = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

export function useChangePassword(options: UseChangePasswordOptions = {}) {
  const [fields, setFields] = useState<ChangePasswordFormState>(initialFields);
  const [errors, setErrors] = useState<ChangePasswordErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  function setField(name: keyof ChangePasswordFormState, value: string) {
    setFields((prev) => ({ ...prev, [name]: value }));
    // Clear field-specific error as user types
    setErrors((prev) => {
      if (!prev[name] && !prev.form) return prev;
      const next = { ...prev };
      delete next[name];
      delete next.form;
      return next;
    });
    setSuccess(false);
  }

  function validate(data: ChangePasswordFormState): ChangePasswordErrors {
    const nextErrors: ChangePasswordErrors = {};

    // MSG01: Required field validation
    if (!data.currentPassword) {
      nextErrors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại.';
    }
    if (!data.newPassword) {
      nextErrors.newPassword = 'Vui lòng nhập mật khẩu mới.';
    }
    if (!data.confirmPassword) {
      nextErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới.';
    }

    if (nextErrors.currentPassword || nextErrors.newPassword || nextErrors.confirmPassword) {
      return nextErrors;
    }

    // MSG05: Password complexity policy (via canonical passwordPolicy)
    const policyError = validatePassword(data.newPassword);
    if (policyError) {
      nextErrors.newPassword = policyError;
    }

    // Abnormal Case 6.a1: New password cannot match current password
    if (!nextErrors.newPassword && data.newPassword === data.currentPassword) {
      nextErrors.newPassword = 'Mật khẩu mới phải khác mật khẩu hiện tại.';
    }

    // MSG06: Confirmation mismatch
    if (data.newPassword !== data.confirmPassword) {
      nextErrors.confirmPassword = 'Mật khẩu xác nhận không khớp. Vui lòng nhập lại.';
    }

    return nextErrors;
  }

  async function handleSubmit(event?: React.FormEvent) {
    if (event) {
      event.preventDefault();
    }

    const validationErrors = validate(fields);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setSuccess(false);
      return false;
    }

    setSubmitting(true);
    setErrors({});
    setSuccess(false);

    try {
      const payload: ChangePasswordRequest = {
        currentPassword: fields.currentPassword,
        newPassword: fields.newPassword,
        confirmPassword: fields.confirmPassword,
      };

      const result = await changePassword(payload, options.accessToken);
      setSuccess(true);
      setFields(initialFields);
      setErrors({});

      if (options.onSuccess) {
        options.onSuccess(result);
      }
      return true;
    } catch (err: unknown) {
      if (isApiError(err)) {
        if (err.status === 401) {
          if (options.onUnauthorized) {
            options.onUnauthorized();
            return false;
          }
        }

        // Map known BE error codes
        if (err.code === 'MSG17' || err.message?.includes('Current password')) {
          setErrors({ currentPassword: 'Mật khẩu hiện tại không chính xác.' });
        } else if (err.code === 'MSG05') {
          setErrors({
            newPassword:
              'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.',
          });
        } else if (err.code === 'MSG06') {
          setErrors({
            confirmPassword: 'Mật khẩu xác nhận không khớp. Vui lòng nhập lại.',
          });
        } else if (err.code === 'ENDPOINT_NOT_DEPLOYED') {
          setErrors({
            form: err.message ?? 'Chức năng đổi mật khẩu đang được đồng bộ máy chủ.',
          });
        } else if (err.errors && Object.keys(err.errors).length > 0) {
          setErrors({
            currentPassword: err.errors.currentPassword ?? err.errors.CurrentPassword,
            newPassword: err.errors.newPassword ?? err.errors.NewPassword,
            confirmPassword: err.errors.confirmPassword ?? err.errors.ConfirmPassword,
          });
        } else if (err.status === 0 || err.status >= 500) {
          // MSG127 generic server/network error
          setErrors({
            form: 'TripMate tạm thời không thể xử lý yêu cầu. Vui lòng kiểm tra kết nối và thử lại.',
          });
        } else {
          setErrors({
            form: err.message ?? 'Đổi mật khẩu không thành công. Vui lòng thử lại.',
          });
        }
      } else {
        setErrors({
          form: 'TripMate tạm thời không thể xử lý yêu cầu. Vui lòng kiểm tra kết nối và thử lại.',
        });
      }
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setFields(initialFields);
    setErrors({});
    setSuccess(false);
    setSubmitting(false);
  }

  return {
    fields,
    errors,
    submitting,
    success,
    setField,
    handleSubmit,
    reset,
  };
}
