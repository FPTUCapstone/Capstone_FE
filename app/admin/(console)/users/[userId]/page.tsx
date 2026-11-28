import { notFound, redirect } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { AccountModerationForm } from '@/features/admin/user-accounts/components/AccountModerationForm';
import { accountDate, accountSession, accountStatusLabel, accountTimestamp, canManageAccount, fetchAccounts, type AccountDetail } from '@/features/admin/user-accounts/server/accounts';
import { parseUserAccountRouteId } from '@/features/admin/user-accounts/server/userAccountRouteId';

const actionLabels = new Map([
  ['USER_ACCOUNT_LOCKED', 'Locked'],
  ['USER_ACCOUNT_UNLOCKED', 'Unlocked'],
  ['UnlockUserAccount', 'Unlocked'],
  ['TOUR_OPERATOR_AUTO_LOCKED', 'Automatically locked'],
  ['SERVICE_PROVIDER_AUTO_LOCKED', 'Automatically locked'],
  ['TOUR_OPERATOR_UNLOCKED', 'Unlocked after debt recovery'],
  ['ApproveOperatorApplication', 'Application approved'],
  ['RejectOperatorApplication', 'Application rejected'],
  ['ResubmitOperatorApplication', 'Application resubmitted'],
]);
const lockActions = new Set(['USER_ACCOUNT_LOCKED', 'TOUR_OPERATOR_AUTO_LOCKED', 'SERVICE_PROVIDER_AUTO_LOCKED']);
const unlockActions = new Set(['USER_ACCOUNT_UNLOCKED', 'UnlockUserAccount', 'TOUR_OPERATOR_UNLOCKED']);

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

  const statusLabel = detail ? accountStatusLabel(detail.account.status) : '';
  const locked = detail?.account.status === 'Locked';
  const latestLockChange = locked ? detail.moderationHistory.find(
    (item) => lockActions.has(item.action) || unlockActions.has(item.action),
  ) : undefined;
  const currentLock = latestLockChange && lockActions.has(latestLockChange.action)
    ? {
        reason: latestLockChange.reason,
        actor: latestLockChange.actorAttribution,
        at: accountTimestamp(latestLockChange.atUtc),
      }
    : undefined;
  const statusTone =
    detail?.account.status === 'Active'
      ? 'border-[#CBE0D4] bg-[#E8F0EA] text-[#103B39]'
      : detail?.account.status === 'Locked'
      ? 'border-[#F7C9D3] bg-[#FDECEF] text-[#8C1030]'
      : 'border-[#DCE2DD] bg-[#F7F5EF] text-[#5B6E69]';

  return (
    <section className="mx-auto max-w-5xl space-y-6 pb-12 text-[#1C2928]">
      {!detail ? (
        <>
          <PageHeader
            backLink={{ href: '/admin/users', label: 'Back to user accounts' }}
            title="Account details"
          />
          <div
            role="alert"
            className="rounded-2xl border border-[#F7C9D3] bg-[#FDECEF] p-5 text-sm font-semibold text-[#8C1030]"
          >
            {response?.status === 403
              ? 'You do not have permission to view user accounts.'
              : 'Account details could not be loaded.'}
          </div>
        </>
      ) : (
        <>
          <PageHeader
            backLink={{ href: '/admin/users', label: 'Back to user accounts' }}
            title={detail.account.fullName}
            description={detail.account.email ?? 'No email address on file'}
            badge={
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-[#DCE2DD] bg-white px-2.5 py-0.5 text-xs font-bold text-[#1C2928]">
                  {detail.account.role}
                </span>
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${statusTone}`}>
                  {statusLabel}
                </span>
              </div>
            }
          />

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Account metadata card */}
            <article className="rounded-2xl border border-[#DCE2DD] bg-white p-5 shadow-xs sm:p-6 lg:col-span-2">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#5B6E69]">
                Account profile
              </h2>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-[#ECEEEB] bg-[#F7F5EF]/60 px-4 py-3 [&>dt]:text-xs [&>dt]:font-semibold [&>dt]:text-[#5B6E69] [&>dd]:mt-1 [&>dd]:break-all [&>dd]:text-sm [&>dd]:font-bold [&>dd]:text-[#1C2928]">
                  <dt>Email</dt><dd>{detail.account.email ?? '—'}</dd>
                </div>
                <div className="rounded-xl border border-[#ECEEEB] bg-[#F7F5EF]/60 px-4 py-3 [&>dt]:text-xs [&>dt]:font-semibold [&>dt]:text-[#5B6E69] [&>dd]:mt-1 [&>dd]:text-sm [&>dd]:font-bold [&>dd]:text-[#1C2928]">
                  <dt>Role</dt><dd>{detail.account.role}</dd>
                </div>
                <div className="rounded-xl border border-[#ECEEEB] bg-[#F7F5EF]/60 px-4 py-3 [&>dt]:text-xs [&>dt]:font-semibold [&>dt]:text-[#5B6E69] [&>dd]:mt-1 [&>dd]:text-sm [&>dd]:font-bold [&>dd]:text-[#1C2928]">
                  <dt>Status</dt><dd>{statusLabel}</dd>
                </div>
                <div className="rounded-xl border border-[#ECEEEB] bg-[#F7F5EF]/60 px-4 py-3 [&>dt]:text-xs [&>dt]:font-semibold [&>dt]:text-[#5B6E69] [&>dd]:mt-1 [&>dd]:text-sm [&>dd]:font-bold [&>dd]:text-[#1C2928]">
                  <dt>Associated bookings</dt><dd>{detail.bookingCount ?? 'N/A'}</dd>
                </div>
                <div className="rounded-xl border border-[#ECEEEB] bg-[#F7F5EF]/60 px-4 py-3 [&>dt]:text-xs [&>dt]:font-semibold [&>dt]:text-[#5B6E69] [&>dd]:mt-1 [&>dd]:text-sm [&>dd]:font-bold [&>dd]:text-[#1C2928]">
                  <dt>Registered</dt><dd>{accountDate(detail.account.createdAtUtc)}</dd>
                </div>
                <div className="rounded-xl border border-[#ECEEEB] bg-[#F7F5EF]/60 px-4 py-3 [&>dt]:text-xs [&>dt]:font-semibold [&>dt]:text-[#5B6E69] [&>dd]:mt-1 [&>dd]:text-sm [&>dd]:font-bold [&>dd]:text-[#1C2928]">
                  <dt>Last sign-in</dt><dd>{accountDate(detail.account.lastLoginAtUtc)}</dd>
                </div>
              </dl>
            </article>

            {/* Account moderation controls */}
            <aside className="h-fit rounded-2xl border border-[#DCE2DD] bg-white p-5 shadow-xs sm:p-6">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#5B6E69]">
                Moderation actions
              </h2>
              {detail.account.status !== 'Inactive' ? (
                <div className="mt-4">
                  <AccountModerationForm
                    accountId={String(userId)}
                    account={{
                      fullName: detail.account.fullName,
                      email: detail.account.email,
                      role: detail.account.role,
                      status: statusLabel,
                    }}
                    locked={locked}
                    currentLock={currentLock}
                  />
                </div>
              ) : (
                <p className="mt-3 rounded-xl bg-[#F7F5EF] p-3.5 text-xs leading-relaxed text-[#5B6E69]">
                  Inactive accounts cannot be locked or unlocked.
                </p>
              )}
            </aside>
          </div>

          {/* Moderation history card */}
          <article className="rounded-2xl border border-[#DCE2DD] bg-white p-5 shadow-xs sm:p-6">
            <h2 className="text-base font-extrabold text-[#1C2928]">Moderation history</h2>
            {detail.moderationHistory.length === 0 ? (
              <p className="mt-3 rounded-xl border border-dashed border-[#DCE2DD] bg-[#F7F5EF]/60 p-5 text-center text-sm text-[#5B6E69]">
                No moderation history.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-[#ECEEEB]">
                {detail.moderationHistory.map((item, index) => (
                  <li key={index} className="flex flex-wrap items-baseline gap-x-2 gap-y-1 py-3 text-sm text-[#1C2928] first:pt-0 last:pb-0">
                    <time dateTime={item.atUtc} className="font-mono text-xs font-semibold text-[#5B6E69]">
                      {accountTimestamp(item.atUtc)}
                    </time>
                    <span aria-hidden="true" className="text-[#94A59F]">·</span>
                    <span className="font-bold text-[#103B39]">
                      {actionLabels.get(item.action) ?? 'Account moderation'}
                    </span>
                    <span aria-hidden="true" className="text-[#94A59F]">·</span>
                    <span className="text-[#5B6E69]">{item.actorAttribution}</span>
                    {item.reason ? (
                      <>
                        <span aria-hidden="true" className="text-[#94A59F]">·</span>
                        <span className="text-[#1C2928]">{item.reason}</span>
                      </>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </article>
        </>
      )}
    </section>
  );
}
