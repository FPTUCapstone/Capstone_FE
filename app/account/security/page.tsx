import type { Metadata } from 'next';

import { ChangePasswordPage } from '@/features/account/security/ChangePasswordPage';

export const metadata: Metadata = {
  title: 'Đổi mật khẩu | TripMate',
  description: 'Cập nhật thông tin mật khẩu bảo mật tài khoản TripMate của bạn.',
};

export default function AccountSecurityPage() {
  return <ChangePasswordPage />;
}
