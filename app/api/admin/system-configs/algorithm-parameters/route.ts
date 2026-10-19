import { proxyAlgorithmParameters } from '@/features/admin/algorithm-config/algorithmConfigProxy';

export async function GET(request: Request) {
  return proxyAlgorithmParameters(request);
}

export async function PUT(request: Request) {
  return proxyAlgorithmParameters(request);
}
