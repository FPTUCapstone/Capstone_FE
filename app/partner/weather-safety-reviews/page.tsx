'use client';

import React, { Suspense } from 'react';
import { PartnerWorkspaceNav } from '@/features/operator/common/PartnerWorkspaceNav';
import { WeatherSafetyReviewListPage } from '@/features/operator/weather-safety/components/WeatherSafetyReviewListPage';

export default function PartnerWeatherSafetyReviewsPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="flex min-h-screen">
        <PartnerWorkspaceNav activeTab="weatherSafety" />
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          <Suspense fallback={<div className="p-8 text-center text-slate-500">Đang tải...</div>}>
            <WeatherSafetyReviewListPage />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
