import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { CommissionStatementsView } from '@/features/hotel-service-provider/components/w105/CommissionStatementsView';

export const metadata: Metadata = {
  title: 'Commission Statements | TripMate Partner',
  description: 'View monthly commission statements, audit completed stays, and report bank wire transfers (Screen W105, UC-82).',
};

export default function ProviderStatementsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-[#5B6E69]">
          <span className="material-symbols-outlined text-[28px] animate-spin text-[#174B4A] mb-2 block mx-auto">
            progress_activity
          </span>
          Loading commission statements...
        </div>
      }
    >
      <CommissionStatementsView />
    </Suspense>
  );
}
