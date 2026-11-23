import { NextResponse } from 'next/server';

import { BackendConfigurationError, fetchBackend } from '@/lib/server/backend';

export const dynamic = 'force-dynamic';

interface CategorySummary {
  id: number;
  name: string;
  poiCount: number;
}

interface UpstreamPagedPois {
  totalCount?: number;
  items?: Array<{
    categoryId?: number;
    categoryName?: string;
  }>;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
let cachedFallback: { key: string; expiresAt: number; data: CategorySummary[] } | null = null;

async function deriveCategoriesFromActivePois(): Promise<CategorySummary[]> {
  const cacheKey = process.env.TRIPMATE_API_BASE_URL ?? '';
  if (cachedFallback && cachedFallback.key === cacheKey && cachedFallback.expiresAt > Date.now()) {
    return cachedFallback.data;
  }

  const sampleResponse = await fetchBackend('/api/v1/pois?sort=rating&pageSize=100', {
    headers: { Accept: 'application/json' },
  });

  if (!sampleResponse.ok) {
    return [];
  }

  const sampleBody = (await sampleResponse.json()) as UpstreamPagedPois;
  const discovered = new Map<number, string>();
  for (const item of sampleBody.items ?? []) {
    if (typeof item.categoryId === 'number' && typeof item.categoryName === 'string' && !discovered.has(item.categoryId)) {
      discovered.set(item.categoryId, item.categoryName);
    }
  }

  const entries = Array.from(discovered.entries());
  const counted = await Promise.all(
    entries.map(async ([id, name]) => {
      try {
        const res = await fetchBackend(`/api/v1/pois?categoryId=${id}&pageSize=1`, {
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) return { id, name, poiCount: 0 };
        const body = (await res.json()) as UpstreamPagedPois;
        return {
          id,
          name,
          poiCount: typeof body.totalCount === 'number' ? body.totalCount : 0,
        };
      } catch {
        return { id, name, poiCount: 0 };
      }
    }),
  );

  const sorted = counted
    .filter((item) => item.poiCount > 0)
    .sort((a, b) => b.poiCount - a.poiCount || a.name.localeCompare(b.name, 'vi') || a.id - b.id);

  cachedFallback = {
    key: cacheKey,
    expiresAt: Date.now() + CACHE_TTL_MS,
    data: sorted,
  };

  return sorted;
}

export async function GET() {
  try {
    const upstream = await fetchBackend('/api/v1/pois/categories', {
      headers: { Accept: 'application/json, application/problem+json' },
    });

    if (upstream.ok) {
      const body = await upstream.arrayBuffer();
      return new Response(body, {
        status: upstream.status,
        headers: {
          'Content-Type': upstream.headers.get('content-type') ?? 'application/json',
          'Cache-Control': 'public, max-age=300',
        },
      });
    }

    // Older backend deployments match `/api/v1/pois/{id}` with 400 or return 404 before
    // the dedicated `/api/v1/pois/categories` endpoint is deployed; derive real active categories from live POIs.
    if (upstream.status === 400 || upstream.status === 404) {
      const derived = await deriveCategoriesFromActivePois();
      return NextResponse.json(derived, {
        status: 200,
        headers: { 'Cache-Control': 'public, max-age=300' },
      });
    }

    const body = await upstream.arrayBuffer();
    return new Response(body, {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('content-type') ?? 'application/problem+json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    if (error instanceof BackendConfigurationError) {
      return NextResponse.json(
        { status: 503, title: 'Dịch vụ khám phá chưa được cấu hình.', errorCode: 'Poi.ServiceUnavailable' },
        { status: 503, headers: { 'Content-Type': 'application/problem+json' } },
      );
    }
    return NextResponse.json(
      { status: 502, title: 'Không thể kết nối máy chủ khám phá.', errorCode: 'Poi.UpstreamUnavailable' },
      { status: 502, headers: { 'Content-Type': 'application/problem+json' } },
    );
  }
}
