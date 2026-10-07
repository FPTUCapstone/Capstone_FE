import { Suspense } from 'react';
import type { Metadata } from 'next';
import { OperatorRevenueView } from '@/features/operator/finance/components/revenue/OperatorRevenueView';
import { OperatorFinanceNav } from '@/features/operator/finance/components/layout/OperatorFinanceNav';
import { FinanceRouteGuard } from '@/features/operator/finance/guards/FinanceRouteGuard';

export const metadata: Metadata = {
  title: 'Revenue & Analytics | Tour Operator | TripMate',
  description:
    'Review gross revenue, platform commission, completed refunds, and net earnings for your tour packages.',
};

export default function PartnerRevenuePage() {
  return (
    <FinanceRouteGuard>
      <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-8 lg:flex-row">
            <Suspense fallback={<aside className="w-full shrink-0 lg:w-64" />}>
              <OperatorFinanceNav activeTab="revenue" />
            </Suspense>
            <main className="flex-1 min-w-0">
              <Suspense
                fallback={
                  <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">
                    <span className="material-symbols-outlined animate-spin text-[32px] text-[#006B5F]">
                      progress_activity
                    </span>
                    <p className="mt-2 text-xs font-bold">
                      Loading revenue analytics…
                    </p>
                  </div>
                }
              >
                <OperatorRevenueView />
              </Suspense>
            </main>
          </div>
        </div>
      </div>
    </FinanceRouteGuard>
  );
}
