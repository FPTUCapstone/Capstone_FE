import type { Metadata } from 'next';
import { Suspense } from 'react';

import { ActiveTripsScreen } from '@/features/admin/active-trips/ActiveTripsScreen';

export const metadata: Metadata = { title: 'Active Trips | TripMate Admin' };

export default function ActiveTripsPage() {
  return (
    <Suspense fallback={<div role="status" className="mx-auto max-w-7xl px-4 py-8 text-[#486581]">Loading active trips…</div>}>
      <ActiveTripsScreen />
    </Suspense>
  );
}
