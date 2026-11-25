import type { Metadata } from 'next';
import { Suspense } from 'react';

import { PageTransition } from '@/components/navigation/PageTransition';
import { WeatherForecastPage } from '@/features/public/weather/components/WeatherForecastPage';
import { WeatherPageSkeleton } from '@/features/public/weather/components/WeatherStates';

export const metadata: Metadata = {
  title: 'Dự báo thời tiết Miền Trung',
  description:
    'Xem dự báo thời tiết hiện tại, theo giờ và 5 ngày tới tại Đà Nẵng, Hội An, Huế, Bà Nà Hills và Sơn Trà theo chuẩn Tomorrow.io cùng TripMate.',
};

export default function WeatherPage() {
  return (
    <PageTransition>
      <Suspense
        fallback={
          <main
            className="mx-auto min-h-screen max-w-[1400px] bg-[#F7F5EF] px-4 py-6 sm:px-6 lg:px-8"
            lang="vi"
          >
            <h1 className="mb-4 text-xl font-black tracking-tight text-[#1C2928] sm:text-2xl">
              Dự báo thời tiết Miền Trung
            </h1>
            <WeatherPageSkeleton />
          </main>
        }
      >
        <WeatherForecastPage />
      </Suspense>
    </PageTransition>
  );
}
