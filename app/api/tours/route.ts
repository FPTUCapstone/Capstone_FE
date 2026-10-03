import { proxyTourRequest } from '@/features/public/tours/services/tourProxy';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  return proxyTourRequest([], searchParams);
}
