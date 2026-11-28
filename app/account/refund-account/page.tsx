import type { Metadata } from 'next';
import { RefundAccountPage } from '@/features/account/refund-account/RefundAccountPage';

export const metadata: Metadata = { title: 'Tài khoản nhận hoàn tiền | TripMate' };
export default function Page() { return <RefundAccountPage />; }
