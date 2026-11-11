import type { Metadata } from 'next';

import { TravelerRegistrationPage } from '@/features/traveler/registration/TravelerRegistrationPage';

export const metadata: Metadata = {
  title: 'Đăng ký Traveler',
  description: 'Lên lịch trình thông minh & khám phá trọn vẹn chuyến đi',
};

export default function RegisterPage() {
  return <TravelerRegistrationPage />;
}
