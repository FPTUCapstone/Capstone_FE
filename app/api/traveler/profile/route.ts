import { proxyTravelerProfile } from '@/features/account/profile/travelerProfileProxy';

export const dynamic = 'force-dynamic';

export function GET(request: Request): Promise<Response> {
  return proxyTravelerProfile(request);
}

export function PUT(request: Request): Promise<Response> {
  return proxyTravelerProfile(request);
}
