import { proxyDevTourRequest } from '@/features/public/tours/services/devTourProxy';

export async function GET(request: Request) {
  return proxyDevTourRequest(request, 'categories');
}
