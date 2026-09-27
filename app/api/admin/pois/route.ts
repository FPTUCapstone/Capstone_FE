import { proxyPoi } from '@/features/admin/create-poi/services/poi-proxy';

export async function POST(request: Request) {
  return proxyPoi(request, '/api/v1/admin/pois');
}
