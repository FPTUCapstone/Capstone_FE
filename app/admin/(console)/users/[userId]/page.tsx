import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { AccountModerationForm } from '@/features/admin/user-accounts/components/AccountModerationForm';
import { accountDate, accountSession, canManageAccount, fetchAccounts, type AccountDetail } from '@/features/admin/user-accounts/server/accounts';
import { parseUserAccountRouteId } from '@/features/admin/user-accounts/server/userAccountRouteId';

export default async function UserAccountDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const session = await accountSession();
  if (!session) return redirect('/admin/login?returnUrl=%2Fadmin%2Fusers');
  const userId = parseUserAccountRouteId((await params).userId);
  if (!userId) return notFound();

  const response = await fetchAccounts(session.token, `/${userId}`).catch(() => null);
  if (response?.status === 401) return redirect('/admin/login?returnUrl=%2Fadmin%2Fusers');
  if (response?.status === 404) return notFound();
  const detail: AccountDetail | null = response?.ok ? await response.json().catch(() => null) : null;
  if (detail && !canManageAccount(session.role, detail.account.role)) return notFound();

  return (
    <section className="max-w-2xl space-y-5">
      <Link className="underline" href="/admin/users">Back to user accounts</Link>
      {!detail ? <p role="alert">Account details could not be loaded.</p> : <>
        <h1 className="text-2xl font-semibold">{detail.account.fullName}</h1>
        <dl className="grid grid-cols-2 gap-2">
          <dt>Email</dt><dd>{detail.account.email ?? '—'}</dd>
          <dt>Role</dt><dd>{detail.account.role}</dd>
          <dt>Status</dt><dd>{detail.account.status}</dd>
          <dt>Registered</dt><dd>{accountDate(detail.account.createdAtUtc)}</dd>
          <dt>Last sign-in</dt><dd>{accountDate(detail.account.lastLoginAtUtc)}</dd>
          <dt>Bookings</dt><dd>{detail.bookingCount}</dd>
        </dl>
        {detail.account.status !== 'Inactive' && <AccountModerationForm
          accountId={String(userId)} locked={detail.account.status === 'Locked'} />}
        <h2 className="text-lg font-semibold">Moderation history</h2>
        {detail.moderationHistory.length === 0 ? <p>No moderation history.</p> :
          <ul className="space-y-2">{detail.moderationHistory.map((item, index) => (
            <li key={index}>{accountDate(item.atUtc)} · {item.action === 'USER_ACCOUNT_LOCKED' ? 'Locked' : 'Unlocked'} · {item.reason}</li>
          ))}</ul>}
      </>}
    </section>
  );
}
