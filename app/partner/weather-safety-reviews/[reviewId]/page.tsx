import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PartnerWorkspaceLayout } from '@/features/operator/common/components/PartnerWorkspaceLayout';
import { WeatherSafetyReviewDetailPage } from '@/features/operator/weather-safety/components/WeatherSafetyReviewDetailPage';

export const metadata: Metadata = {
  title: 'Chi tiết cảnh báo an toàn thời tiết | TripMate Partner',
  description: 'Xem xét cảnh báo thời tiết và xử lý hủy tour khẩn cấp thủ công.',
};

interface PartnerWeatherSafetyReviewPageProps {
  params: Promise<{ reviewId: string }>;
}

export default async function PartnerWeatherSafetyReviewPage({
  params,
}: PartnerWeatherSafetyReviewPageProps) {
  const { reviewId } = await params;
  const parsedId = parseInt(reviewId, 10);

  return (
    <PartnerWorkspaceLayout activeTab="weatherSafety">
      <Suspense fallback={<div className="p-8 text-center text-slate-500">Đang tải...</div>}>
        <WeatherSafetyReviewDetailPage reviewId={parsedId} />
      </Suspense>
    </PartnerWorkspaceLayout>
  );
}
