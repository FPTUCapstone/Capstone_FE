import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AccountWorkspaceShell } from '@/features/account/common/AccountWorkspaceShell';

export const metadata: Metadata = {
  title: {
    default: 'Tài khoản cá nhân | TripMate',
    template: '%s | TripMate',
  },
  description:
    'Quản lý thông tin tài khoản, sở thích du lịch, bảo mật và lịch sử chuyến đi của bạn trên TripMate.',
};

export default function AccountLayout({ children }: { children: ReactNode }) {
  return <AccountWorkspaceShell>{children}</AccountWorkspaceShell>;
}
