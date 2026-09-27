import { proxyTourOperatorApplication } from '@/features/admin/tour-operator-applications/api/tourOperatorApplicationProxy';

export async function POST(request: Request, context: { params: Promise<{ userId: string }> }) {
  const { userId } = await context.params;
  return proxyTourOperatorApplication(request, userId, 'reject');
}
