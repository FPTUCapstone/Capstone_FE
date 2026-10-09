import { proxyOperatorApplication } from '@/features/operator/application/operatorApplicationProxy';

export const dynamic = 'force-dynamic';

export function GET(request: Request): Promise<Response> {
  return proxyOperatorApplication(request);
}

