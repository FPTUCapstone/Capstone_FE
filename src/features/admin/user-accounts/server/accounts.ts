import 'server-only';

import { cookies } from 'next/headers';
import { ADMIN_ACCESS_TOKEN_COOKIE, verifyAdminSessionFromCookies } from '@/lib/server/adminSession';
import { fetchBackend } from '@/lib/server/backend';

export interface UserAccount {
  userId: string;
  fullName: string;
  email: string | null;
  role: string;
  status: string;
  createdAtUtc: string;
  lastLoginAtUtc: string | null;
}

export interface AccountPage {
  items: UserAccount[];
  totalPages: number;
}

export interface AccountDetail {
  account: UserAccount;
  bookingCount: number;
  moderationHistory: { action: string; reason: string | null; atUtc: string }[];
}

export function canManageAccount(actor: string, target: string) {
  return actor === 'Staff'
    ? ['Traveler', 'TourOperator', 'ServiceProvider'].includes(target)
    : actor === 'Administrator' && target === 'Staff';
}

export async function accountSession() {
  const store = await cookies();
  const session = verifyAdminSessionFromCookies(store);
  const token = store.get(ADMIN_ACCESS_TOKEN_COOKIE)?.value;
  return session && token ? { role: session.role, token } : null;
}

export async function fetchAccounts(token: string, suffix: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  headers.set('Authorization', `Bearer ${token}`);
  return fetchBackend(`/api/v1/admin/users${suffix}`, { ...init, headers });
}

export function accountDate(value: string | null) {
  return value ? new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(value)) : '—';
}
