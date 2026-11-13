import type { Metadata } from 'next';
import { CommissionReconciliationView } from '@/features/hotel-service-provider/components/w106/CommissionReconciliationView';
import { ToastProvider } from '@/features/hotel-service-provider/components/common/Toast';

export const metadata: Metadata = {
  title: 'Commission Reconciliation | TripMate Staff',
  description: 'Audit reported commission payments against bank statements and record official receipt (UC-83).',
};

export default function CommissionReconciliationPage() {
  return (
    <ToastProvider>
      <CommissionReconciliationView />
    </ToastProvider>
  );
}
