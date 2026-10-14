import { proxyLandingContent } from '@/features/admin/landing-content/landingContentProxy';

type RouteContext = { params: Promise<{ path?: string[] }> };

async function handle(request: Request, { params }: RouteContext) {
  const { path } = await params;
  return proxyLandingContent(request, path);
}

export const GET = handle;
export const PUT = handle;
export const POST = handle;
