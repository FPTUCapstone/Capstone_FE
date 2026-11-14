import type { Metadata } from 'next';
import { CommissionReconciliationView } from '@/features/hotel-service-provider/components/w106/CommissionReconciliationView';
import { ToastProvider } from '@/features/hotel-service-provider/components/common/Toast';

export const metadata: Metadata = {
  title: 'Đối soát hoa hồng đối tác | TripMate Staff',
  description: 'Kiểm tra giao dịch chuyển khoản hoa hồng của đối tác với sao kê ngân hàng và xác nhận thu tiền.',
};

export default function CommissionReconciliationPage() {
  return (
    <ToastProvider>
      <CommissionReconciliationView />
    </ToastProvider>
  );
}
