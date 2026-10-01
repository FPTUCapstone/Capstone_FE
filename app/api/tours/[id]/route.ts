import { proxyTourRequest } from '@/features/public/tours/services/tourProxy';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  return proxyTourRequest([id], searchParams);
}
