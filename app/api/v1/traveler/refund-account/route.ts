import { proxyRefundAccount } from '@/features/account/refund-account/refundAccountProxy';

export const dynamic = 'force-dynamic';
export const GET = (request: Request) => proxyRefundAccount(request);
export const PUT = (request: Request) => proxyRefundAccount(request);
