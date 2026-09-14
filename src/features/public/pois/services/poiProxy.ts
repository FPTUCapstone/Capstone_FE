import 'server-only';

import { NextResponse } from 'next/server';

import { sanitizeProxyQuery } from '../utils/poiQuery';

const JSON_HEADERS = { 'Content-Type': 'application/problem+json' };

function problem(status: number, title: string, errorCode: string): NextResponse {
  return NextResponse.json({ status, title, errorCode }, { status, headers: JSON_HEADERS });
}

function backendBaseUrl(): string | null {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  return configured ? configured.replace(/\/+$/, '') : null;
}

export async function proxyPoiRequest(
  segments: string[],
  incomingQuery = new URLSearchParams(),
): Promise<Response> {
  const baseUrl = backendBaseUrl();
  if (!baseUrl) {
    return problem(503, 'Dịch vụ khám phá chưa được cấu hình.', 'Poi.ServiceUnavailable');
  }

  const safePath = segments.map((segment) => encodeURIComponent(segment)).join('/');
  const query = sanitizeProxyQuery(incomingQuery);
  const upstreamUrl = `${baseUrl}/pois${safePath ? `/${safePath}` : ''}${query.size ? `?${query}` : ''}`;

  try {
    const upstream = await fetch(upstreamUrl, {
      cache: 'no-store',
      headers: { Accept: 'application/json, application/problem+json' },
    });
    const body = await upstream.arrayBuffer();
    const contentType = upstream.headers.get('content-type') ?? 'application/json';
    return new Response(body, {
      status: upstream.status,
      headers: { 'Content-Type': contentType, 'Cache-Control': 'no-store' },
    });
  } catch {
    return problem(502, 'Không thể kết nối máy chủ khám phá.', 'Poi.UpstreamUnavailable');
  }
}
