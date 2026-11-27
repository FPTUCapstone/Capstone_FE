import { proxyOperatorMockCommissionPayment } from '@/features/commission/operator/commissionProxy';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return proxyOperatorMockCommissionPayment(request, (await context.params).id);
}
