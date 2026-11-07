'use client';

import React, { Suspense } from 'react';
import { PartnerWorkspaceLayout } from '@/features/operator/common/components/PartnerWorkspaceLayout';
import { WeatherSafetyReviewListPage } from '@/features/operator/weather-safety/components/WeatherSafetyReviewListPage';

export default function PartnerWeatherSafetyReviewsPage() {
  return (
    <PartnerWorkspaceLayout activeTab="weatherSafety">
      <Suspense fallback={<div className="p-8 text-center text-slate-500">Đang tải...</div>}>
        <WeatherSafetyReviewListPage />
      </Suspense>
    </PartnerWorkspaceLayout>
  );
}
