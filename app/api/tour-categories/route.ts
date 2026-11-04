import { fetchBackend } from '@/lib/server/backend';

export async function GET() {
  try {
    const upstream = await fetchBackend('/api/v1/tour-categories', {
      headers: { Accept: 'application/json, application/problem+json' },
    });
    return new Response(await upstream.arrayBuffer(), {
      status: upstream.status,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': upstream.headers.get('content-type') ?? 'application/json',
      },
    });
  } catch {
    return Response.json(
      { status: 502, title: 'Không thể tải danh mục tour.', errorCode: 'TourCategories.Unavailable' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
