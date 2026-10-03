import { proxyPoi } from '@/features/admin/create-poi/services/poi-proxy';

export async function GET(request: Request) {
  return proxyPoi(request, '/api/v1/admin/pois/catalogue');
}
