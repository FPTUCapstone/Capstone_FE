import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PartnerWorkspaceNav } from '@/features/operator/common/PartnerWorkspaceNav';
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
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="flex min-h-screen">
        <PartnerWorkspaceNav activeTab="weatherSafety" />
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          <Suspense fallback={<div className="p-8 text-center text-slate-500">Đang tải...</div>}>
            <WeatherSafetyReviewDetailPage reviewId={parsedId} />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
