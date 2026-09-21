import { AuthShell } from '@/components/layout/AuthShell';
import { TravelerRegistrationForm } from '@/features/traveler/registration/TravelerRegistrationForm';

export function TravelerRegistrationPage() {
  return (
    <AuthShell
      eyebrow="HÀNH TRÌNH THÔNG MINH CHO NGƯỜI VIỆT"
      title={
        <>
          Lên kế hoạch{' '}
          <span className="text-brand-brightTeal">du lịch</span>
          {' '}chỉ trong vài phút.
        </>
      }
      description="Công cụ dành riêng cho traveler Việt — tối ưu lịch trình, khám phá điểm đến và đồng hành cùng bạn trên mọi chuyến đi."
      points={[
        '120+|Điểm đến nổi bật',
        '15K+|Traveler đang dùng',
        '4.9★|Đánh giá trung bình',
      ]}
      heroPanels={[
        {
          icon: 'route',
          title: 'Lịch trình thông minh',
          description: 'CSP Engine tối ưu giờ đi',
        },
        {
          icon: 'thunderstorm',
          title: 'Cảnh báo thời tiết',
          description: 'Tự động điều chỉnh kế hoạch',
        },
        {
          icon: 'groups',
          title: 'Đồng hành nhóm',
          description: 'Chia sẻ vị trí GPS thời gian thực',
        },
      ]}
    >
      <TravelerRegistrationForm />
    </AuthShell>
  );
}
