import { redirect } from 'next/navigation';

import { ROUTES } from '@/lib/routes';

export default function AccountIndexPage() {
  redirect(ROUTES.account.profile);
}
