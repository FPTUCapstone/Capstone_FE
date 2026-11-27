import { proxyOperatorListDirectRefundCases } from '@/features/refunds/operator/directRefundOperatorProxy';

export const dynamic = 'force-dynamic';
export const GET = (request: Request) => proxyOperatorListDirectRefundCases(request);
