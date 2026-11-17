import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAccountDateRangeValid } from '@/features/admin/user-accounts/accountDateRange';
import { AccountFilterForm } from '@/features/admin/user-accounts/components/AccountFilterForm';
import { accountDate, accountSession, canManageAccount, fetchAccounts, type AccountPage } from '@/features/admin/user-accounts/server/accounts';
import { ROUTES } from '@/lib/routes';

const filterKeys = ['search', 'role', 'status', 'registeredFrom', 'registeredTo', 'page'] as const;
type Filters = Partial<Record<(typeof filterKeys)[number], string>>;

export default async function UserAccountsPage({ searchParams }: { searchParams?: Promise<Filters> }) {
  const session = await accountSession();
  if (!session) return redirect('/admin/login?returnUrl=%2Fadmin%2Fusers');
  const filters = (await searchParams) ?? {};
  const filterParams = new URLSearchParams();
  for (const key of filterKeys) {
    const value = filters[key];
    if (typeof value === 'string' && value) filterParams.set(key, value);
  }
  const query = new URLSearchParams(filterParams);
  const from = query.get('registeredFrom') ?? '';
  const to = query.get('registeredTo') ?? '';
  const validRange = isAccountDateRangeValid(from, to);
  if (from) query.set('registeredFrom', `${from}T00:00:00+07:00`);
  if (to) query.set('registeredTo', `${to}T23:59:59.9999999+07:00`);
  const response = validRange ? await fetchAccounts(session.token, `?${query}`).catch(() => null) : null;
  if (response?.status === 401) return redirect('/admin/login?returnUrl=%2Fadmin%2Fusers');
  const data: AccountPage | null = response?.ok ? await response.json().catch(() => null) : null;
  const roles = ['Traveler', 'TourOperator', 'ServiceProvider', 'Staff'].filter((role) => canManageAccount(session.role, role));
  const accounts = data?.items.filter((account) => canManageAccount(session.role, account.role)) ?? [];
  const problem: unknown = response?.status === 400 ? await response.json().catch(() => null) : null;
  const invalidRange = !validRange || (typeof problem === 'object' && problem !== null
    && 'errorCode' in problem && problem.errorCode === 'account_management.invalid_date_range');
  const page = Number(filters.page) || 1;
  const link = (next: number) => {
    const params = new URLSearchParams(filterParams);
    params.set('page', String(next));
    return `/admin/users?${params}`;
  };

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">User accounts</h1>
        <nav aria-label="Account provisioning" className="flex flex-wrap gap-2">
          {session.role === 'Administrator' && (
            <Link className="rounded bg-teal-800 px-4 py-2 text-white" href={ROUTES.admin.createStaff}>
              Create Staff Account
            </Link>
          )}
          {session.role === 'Staff' && (
            <Link className="rounded bg-teal-800 px-4 py-2 text-white" href={ROUTES.admin.createServiceProvider}>
              Create Service Provider Account
            </Link>
          )}
        </nav>
      </header>
      <AccountFilterForm key={filterParams.toString()} invalidRange={invalidRange}>
        <label>Search <input className="block rounded border p-2" name="search" type="search" defaultValue={filters.search} maxLength={256} /></label>
        <label>Role <select className="block rounded border p-2" name="role" defaultValue={filters.role ?? ''}>
          <option value="">All permitted roles</option>
          {roles.map((role) => <option key={role}>{role}</option>)}
        </select></label>
        <label>Status <select className="block rounded border p-2" name="status" defaultValue={filters.status ?? ''}>
          <option value="">All statuses</option>
          {['Active', 'Locked', 'Inactive', 'PendingEmailVerification', 'PendingApproval', 'Rejected'].map((status) => <option key={status}>{status}</option>)}
        </select></label>
        <label>Registered from <input className="block rounded border p-2" type="date" name="registeredFrom" defaultValue={filters.registeredFrom} /></label>
        <label>Registered to <input className="block rounded border p-2" type="date" name="registeredTo" defaultValue={filters.registeredTo} /></label>
        <button className="rounded bg-teal-800 px-4 py-2 text-white">Apply filters</button>
      </AccountFilterForm>
      {!data ? !invalidRange && <p role="alert">{
        response?.status === 403 ? 'You do not have permission to view user accounts.' :
          response?.status === 400 ? 'Check the account filters.' : 'User accounts could not be loaded.'
      }</p> :
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead><tr>{['Name', 'Email', 'Role', 'Status', 'Registered', 'Last sign-in'].map((label) => <th className="p-2" scope="col" key={label}>{label}</th>)}</tr></thead>
            <tbody>{accounts.map((account) => (
              <tr className="border-t" key={account.userId}>
                <td className="p-2"><Link className="underline" href={`/admin/users/${encodeURIComponent(account.userId)}`}>{account.fullName}</Link></td>
                <td className="p-2">{account.email ?? '—'}</td><td className="p-2">{account.role}</td><td className="p-2">{account.status}</td>
                <td className="p-2">{accountDate(account.createdAtUtc)}</td><td className="p-2">{accountDate(account.lastLoginAtUtc)}</td>
              </tr>
            ))}</tbody>
          </table>
          {accounts.length === 0 && <p>No matching accounts.</p>}
          <nav className="mt-3 flex gap-4" aria-label="Account pages">
            {page > 1 && <Link href={link(page - 1)}>Previous</Link>}
            {page < data.totalPages && <Link href={link(page + 1)}>Next</Link>}
          </nav>
        </div>}
    </section>
  );
}
