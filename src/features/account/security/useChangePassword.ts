'use client';

import { useState } from 'react';

import {
  getPasswordPolicyIssue,
  type PasswordPolicyIssue,
} from '@/lib/passwordPolicy';

import {
  pendingChangePasswordCapability,
  type ChangePasswordCapability,
  type ChangePasswordFormValues,
} from './changePasswordCapability';

export type ChangePasswordFormState = ChangePasswordFormValues;

export interface ChangePasswordErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  form?: string;
}

export interface UseChangePasswordOptions {
  capability?: ChangePasswordCapability;
  onSuccess?: () => void;
}

const VIETNAMESE_PASSWORD_POLICY_MESSAGES: Record<PasswordPolicyIssue, string> = {
  required: 'Vui lòng nhập mật khẩu.',
  whitespace: 'Mật khẩu không được chứa khoảng trắng.',
  tooShort: 'Mật khẩu phải có ít nhất 8 ký tự.',
  tooLong: 'Mật khẩu không được vượt quá 72 ký tự.',
  missingAllCharacterClasses:
    'Mật khẩu phải bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.',
  missingUpperNumberAndSpecial:
    'Mật khẩu phải bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.',
  missingUpperAndSpecial:
    'Mật khẩu phải bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.',
  missingSpecial:
    'Mật khẩu phải bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.',
  missingCharacterClasses:
    'Mật khẩu phải bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.',
};

const initialFields: ChangePasswordFormState = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

function validateChangePassword(
  data: ChangePasswordFormState,
): ChangePasswordErrors {
  const nextErrors: ChangePasswordErrors = {};

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

  const policyIssue = getPasswordPolicyIssue(data.newPassword);
  if (policyIssue) {
    nextErrors.newPassword = VIETNAMESE_PASSWORD_POLICY_MESSAGES[policyIssue];
  }

  if (!nextErrors.newPassword && data.newPassword === data.currentPassword) {
    nextErrors.newPassword = 'Mật khẩu mới phải khác mật khẩu hiện tại.';
  }

  if (data.newPassword !== data.confirmPassword) {
    nextErrors.confirmPassword = 'Mật khẩu xác nhận không khớp. Vui lòng nhập lại.';
  }

  return nextErrors;
}

export function useChangePassword(options: UseChangePasswordOptions = {}) {
  const capability = options.capability ?? pendingChangePasswordCapability;
  const [fields, setFields] = useState<ChangePasswordFormState>(initialFields);
  const [errors, setErrors] = useState<ChangePasswordErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  function setField(name: keyof ChangePasswordFormState, value: string) {
    setFields((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => {
      if (!previous[name] && !previous.form) return previous;
      const next = { ...previous };
      delete next[name];
      delete next.form;
      return next;
    });
    setSuccess(false);
  }

  async function handleSubmit(event?: React.FormEvent): Promise<boolean> {
    event?.preventDefault();

    // Defense in depth for programmatic form submission and Enter-key paths.
    // The visible action is also disabled while the production capability is pending.
    if (capability.status === 'pending') {
      setSuccess(false);
      return false;
    }

    const validationErrors = validateChangePassword(fields);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setSuccess(false);
      return false;
    }

    setSubmitting(true);
    setErrors({});
    setSuccess(false);

    try {
      await capability.execute({ ...fields });
      setSuccess(true);
      setFields(initialFields);
      options.onSuccess?.();
      return true;
    } catch {
      setErrors({ form: 'Không thể đổi mật khẩu. Vui lòng thử lại.' });
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
    capabilityStatus: capability.status,
    setField,
    handleSubmit,
    reset,
  };
}
