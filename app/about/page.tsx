import type { Metadata } from 'next';
import { AboutTripMatePage } from '@/features/public/about/AboutTripMatePage';

export const metadata: Metadata = {
  title: 'Về TripMate — Nền tảng Du lịch Thông minh Miền Trung',
  description:
    'Tìm hiểu về sứ mệnh, công nghệ lập lịch tối ưu hóa ràng buộc (CSP), cơ chế ứng phó thời tiết và hệ sinh thái du lịch bản địa tại Đà Nẵng, Hội An, Huế cùng TripMate.',
  openGraph: {
    title: 'Về TripMate — Nền tảng Du lịch Thông minh Miền Trung',
    description:
      'Tìm hiểu về sứ mệnh, công nghệ lập lịch tối ưu hóa ràng buộc (CSP) và giải pháp du lịch bản địa tại miền Trung.',
    type: 'website',
  },
};

export default function AboutPage() {
  return <AboutTripMatePage />;
}
