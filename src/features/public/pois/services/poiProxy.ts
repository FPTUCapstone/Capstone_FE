import 'server-only';

import { NextResponse } from 'next/server';

import { BackendConfigurationError, fetchBackend } from '@/lib/server/backend';

import { sanitizeProxyQuery } from '../utils/poiQuery';

const JSON_HEADERS = { 'Content-Type': 'application/problem+json' };

function problem(status: number, title: string, errorCode: string): NextResponse {
  return NextResponse.json({ status, title, errorCode }, { status, headers: JSON_HEADERS });
}

export async function proxyPoiRequest(
  segments: string[],
  incomingQuery = new URLSearchParams(),
): Promise<Response> {
  const safePath = segments.map((segment) => encodeURIComponent(segment)).join('/');
  const query = sanitizeProxyQuery(incomingQuery);
  const queryString = query.size > 0 ? `?${query.toString()}` : '';
  const relativePath = `/api/v1/pois${safePath ? `/${safePath}` : ''}${queryString}`;

  try {
    const upstream = await fetchBackend(relativePath, {
      headers: { Accept: 'application/json, application/problem+json' },
    });
    const body = await upstream.arrayBuffer();
    const contentType = upstream.headers.get('content-type') ?? 'application/json';
    return new Response(body, {
      status: upstream.status,
      headers: { 'Content-Type': contentType, 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    if (error instanceof BackendConfigurationError) {
      return problem(503, 'Dịch vụ khám phá chưa được cấu hình.', 'Poi.ServiceUnavailable');
    }
    return problem(502, 'Không thể kết nối máy chủ khám phá.', 'Poi.UpstreamUnavailable');
  }
}
