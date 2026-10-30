import { proxyPoiManagementList } from '@/features/admin/catalogue/services/poi-management-proxy';
import { proxyPoi } from '@/features/admin/create-poi/services/poi-proxy';

export async function GET(request: Request) {
  return proxyPoiManagementList(request);
}

export async function POST(request: Request) {
  return proxyPoi(request, '/api/v1/admin/pois');
}
