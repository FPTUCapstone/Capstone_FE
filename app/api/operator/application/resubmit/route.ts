import { proxyOperatorApplication } from '@/features/operator/application/operatorApplicationProxy';

export const dynamic = 'force-dynamic';

export function PUT(request: Request): Promise<Response> {
  return proxyOperatorApplication(request);
}
