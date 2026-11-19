import { proxyOperatorComplaintList } from '@/features/operator/post-trip-complaints/operatorPostTripComplaintsProxy';

export async function GET(request: Request) {
  return proxyOperatorComplaintList(request);
}
