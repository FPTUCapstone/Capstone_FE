import type { NextRequest } from 'next/server';

import { proxyPoiRequest } from '@/features/public/pois/services/poiProxy';

export const dynamic = 'force-dynamic';

export function GET(request: NextRequest) {
  return proxyPoiRequest([], request.nextUrl.searchParams);
}
