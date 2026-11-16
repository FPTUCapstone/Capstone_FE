import { proxyGetMyPostTripComplaints } from '@/features/complaints/submit/services/postTripComplaintProxy';

export async function GET(request: Request) {
  return proxyGetMyPostTripComplaints(request);
}
