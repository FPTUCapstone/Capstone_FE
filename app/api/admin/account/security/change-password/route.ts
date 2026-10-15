import { proxyAdminChangePassword } from '@/features/admin/account/changePasswordProxy';

export async function POST(request: Request) {
  return proxyAdminChangePassword(request);
}
