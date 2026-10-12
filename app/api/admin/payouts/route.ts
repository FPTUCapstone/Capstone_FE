import { proxyPayoutRecords } from '@/features/admin/payout-records/payoutRecordsProxy';

export async function GET(request: Request) {
  return proxyPayoutRecords(request);
}
