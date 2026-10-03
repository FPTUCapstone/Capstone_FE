import type { Metadata } from 'next';

import { ChangePasswordPage } from '@/features/account/security/ChangePasswordPage';

export const metadata: Metadata = {
  title: 'Đổi mật khẩu | TripMate',
  description: 'Trang bảo mật mật khẩu cho tài khoản TripMate.',
};

export default function AccountSecurityPage() {
  return <ChangePasswordPage />;
}
