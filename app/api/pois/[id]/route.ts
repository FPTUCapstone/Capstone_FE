import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { proxyPoiRequest } from '@/features/public/pois/services/poiProxy';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  if (!/^\d+$/.test(id) || Number(id) <= 0) {
    return NextResponse.json(
      {
        status: 400,
        title: 'Liên kết địa điểm không hợp lệ.',
        errors: { id: ['Mã địa điểm phải là số nguyên lớn hơn 0.'] },
      },
      { status: 400, headers: { 'Content-Type': 'application/problem+json' } },
    );
  }
  return proxyPoiRequest([id]);
}
