import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAccountDateRangeValid } from '@/features/admin/user-accounts/accountDateRange';
import { AccountFilterForm } from '@/features/admin/user-accounts/components/AccountFilterForm';
import { accountDate, accountSession, accountStatusLabel, canManageAccount, fetchAccounts, type AccountPage } from '@/features/admin/user-accounts/server/accounts';
import { ROUTES } from '@/lib/routes';

const filterKeys = ['search', 'role', 'status', 'registeredFrom', 'registeredTo', 'page'] as const;
type Filters = Partial<Record<(typeof filterKeys)[number], string>>;

type PageProps = { searchParams?: Promise<Filters> };

function getStatusBadgeClass(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
      return 'bg-emerald-50 text-emerald-800 border border-emerald-200';
    case 'locked':
      return 'bg-red-50 text-red-800 border border-red-200';
    case 'inactive':
      return 'bg-slate-100 text-slate-700 border border-slate-200';
    case 'pendingapproval':
    case 'pendingcontractsignature':
    case 'pendingemailverification':
      return 'bg-amber-50 text-amber-800 border border-amber-200';
    case 'rejected':
      return 'bg-rose-50 text-rose-800 border border-rose-200';
    default:
      return 'bg-slate-100 text-slate-700 border border-slate-200';
  }
}

function getRoleBadgeClass(role: string): string {
  switch (role.toLowerCase()) {
    case 'administrator':
      return 'bg-purple-50 text-purple-800 border border-purple-200';
    case 'staff':
      return 'bg-teal-50 text-teal-800 border border-teal-200';
    case 'touroperator':
      return 'bg-blue-50 text-blue-800 border border-blue-200';
    case 'serviceprovider':
      return 'bg-indigo-50 text-indigo-800 border border-indigo-200';
    default:
      return 'bg-slate-100 text-slate-700 border border-slate-200';
  }
}

export default async function UserAccountsPage(): Promise<React.JSX.Element | never>;
export default async function UserAccountsPage(props: PageProps): Promise<React.JSX.Element | never>;
export default async function UserAccountsPage(props: PageProps = {}) {
  const session = await accountSession();
  if (!session) return redirect('/admin/login?returnUrl=%2Fadmin%2Fusers');
  const filters = (await props.searchParams) ?? {};
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

  const hasActiveFilters = Boolean(
    filters.search || filters.role || filters.status || filters.registeredFrom || filters.registeredTo,
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6 text-[#1D2D2B]">
      {/* Clean Breadcrumb */}
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5 text-xs text-[#61736F]">
          <li>
            <Link href="/admin" className="transition hover:text-[#1D2D2B]">
              Administration
            </Link>
          </li>
          <li>
            <span className="material-symbols-outlined text-xs" aria-hidden="true">
              chevron_right
            </span>
          </li>
          <li className="font-semibold text-[#1D2D2B]" aria-current="page">
            User Accounts
          </li>
        </ol>
      </nav>

      {/* Page Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1D2D2B]">
            User accounts
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#61736F]">
            Manage platform accounts, monitor role assignments, and review authentication status.
          </p>
        </div>
        <nav aria-label="Account provisioning" className="flex flex-wrap items-center gap-2.5">
          {session.role === 'Administrator' && (
            <Link
              className="inline-flex items-center gap-2 rounded-xl bg-[#0D5754] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#094743] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D5754]"
              href={ROUTES.admin.createStaff}
            >
              <span className="material-symbols-outlined text-base" aria-hidden="true">
                person_add
              </span>
              <span>Create Staff Account</span>
            </Link>
          )}
          {session.role === 'Staff' && (
            <Link
              className="inline-flex items-center gap-2 rounded-xl bg-[#0D5754] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#094743] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D5754]"
              href={ROUTES.admin.createServiceProvider}
            >
              <span className="material-symbols-outlined text-base" aria-hidden="true">
                domain_add
              </span>
              <span>Create Service Provider Account</span>
            </Link>
          )}
        </nav>
      </header>

      {/* Filter Toolbar */}
      <AccountFilterForm key={filterParams.toString()} invalidRange={invalidRange}>
        <label className="block flex-1 min-w-[200px] text-xs font-bold text-[#1D2D2B]">
          Search
          <div className="relative mt-1.5">
            <span
              className="material-symbols-outlined pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-base text-[#61736F]"
              aria-hidden="true"
            >
              search
            </span>
            <input
              className="w-full rounded-xl border border-[#DCE5E2] bg-white py-2.5 pr-3 pl-9 text-xs font-medium text-[#1D2D2B] placeholder:text-[#61736F] transition focus:border-[#0D5754] focus:ring-2 focus:ring-[#0D5754]/20 focus:outline-hidden"
              name="search"
              type="search"
              placeholder="Search by name or email..."
              defaultValue={filters.search}
              maxLength={256}
            />
          </div>
        </label>

        <label className="block w-full sm:w-44 text-xs font-bold text-[#1D2D2B]">
          Role
          <select
            className="mt-1.5 block w-full rounded-xl border border-[#DCE5E2] bg-white px-3 py-2.5 text-xs font-medium text-[#1D2D2B] transition focus:border-[#0D5754] focus:ring-2 focus:ring-[#0D5754]/20 focus:outline-hidden"
            name="role"
            defaultValue={filters.role ?? ''}
          >
            <option value="">All permitted roles</option>
            {roles.map((role) => (
              <option key={role}>{role}</option>
            ))}
          </select>
        </label>

        <label className="block w-full sm:w-44 text-xs font-bold text-[#1D2D2B]">
          Status
          <select
            className="mt-1.5 block w-full rounded-xl border border-[#DCE5E2] bg-white px-3 py-2.5 text-xs font-medium text-[#1D2D2B] transition focus:border-[#0D5754] focus:ring-2 focus:ring-[#0D5754]/20 focus:outline-hidden"
            name="status"
            defaultValue={filters.status ?? ''}
          >
            <option value="">All statuses</option>
            {['Active', 'Locked', 'Inactive', 'PendingEmailVerification', 'PendingApproval', 'PendingContractSignature', 'Rejected'].map((status) => (
              <option key={status} value={status}>{accountStatusLabel(status)}</option>
            ))}
          </select>
        </label>

        <label className="block w-full sm:w-36 text-xs font-bold text-[#1D2D2B]">
          Registered from
          <input
            className="mt-1.5 block w-full rounded-xl border border-[#DCE5E2] bg-white px-3 py-2.5 text-xs font-medium text-[#1D2D2B] transition focus:border-[#0D5754] focus:ring-2 focus:ring-[#0D5754]/20 focus:outline-hidden"
            type="date"
            name="registeredFrom"
            defaultValue={filters.registeredFrom}
          />
        </label>

        <label className="block w-full sm:w-36 text-xs font-bold text-[#1D2D2B]">
          Registered to
          <input
            className="mt-1.5 block w-full rounded-xl border border-[#DCE5E2] bg-white px-3 py-2.5 text-xs font-medium text-[#1D2D2B] transition focus:border-[#0D5754] focus:ring-2 focus:ring-[#0D5754]/20 focus:outline-hidden"
            type="date"
            name="registeredTo"
            defaultValue={filters.registeredTo}
          />
        </label>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#0D5754] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#094743] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D5754]"
          >
            <span className="material-symbols-outlined text-base" aria-hidden="true">
              filter_list
            </span>
            <span>Apply filters</span>
          </button>
          {hasActiveFilters && (
            <Link
              href="/admin/users"
              className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-xl border border-[#DCE5E2] bg-white px-3.5 py-2.5 text-xs font-bold text-[#61736F] transition hover:bg-[#F5F7F6] hover:text-[#1D2D2B]"
            >
              <span className="material-symbols-outlined text-base" aria-hidden="true">
                restart_alt
              </span>
              <span>Clear filters</span>
            </Link>
          )}
        </div>
      </AccountFilterForm>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div aria-label="Active filters" className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="font-semibold text-[#61736F]">Active filters:</span>
          {filters.search && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-[#E8F0EA] px-2.5 py-1 font-semibold text-[#0D5754]">
              Search: &ldquo;{filters.search}&rdquo;
            </span>
          )}
          {filters.role && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-[#E8F0EA] px-2.5 py-1 font-semibold text-[#0D5754]">
              Role: {filters.role}
            </span>
          )}
          {filters.status && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-[#E8F0EA] px-2.5 py-1 font-semibold text-[#0D5754]">
              Status: {filters.status}
            </span>
          )}
          {filters.registeredFrom && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-[#E8F0EA] px-2.5 py-1 font-semibold text-[#0D5754]">
              From: {filters.registeredFrom}
            </span>
          )}
          {filters.registeredTo && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-[#E8F0EA] px-2.5 py-1 font-semibold text-[#0D5754]">
              To: {filters.registeredTo}
            </span>
          )}
        </div>
      )}

      {/* Account Data Table & States */}
      {!data ? (
        !invalidRange && (
          <div
            role="alert"
            className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-800 shadow-xs"
          >
            <span className="material-symbols-outlined text-xl text-red-600" aria-hidden="true">
              error
            </span>
            <p>
              {response?.status === 403
                ? 'You do not have permission to view user accounts.'
                : response?.status === 400
                  ? 'Check the account filters.'
                  : 'User accounts could not be loaded.'}
            </p>
          </div>
        )
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#DCE5E2] bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#DCE5E2] bg-[#F5F7F6]">
                  {['Name', 'Email', 'Role', 'Status', 'Registered', 'Last sign-in'].map((label) => (
                    <th
                      className="px-5 py-3.5 text-[11px] font-bold tracking-wider text-[#61736F] uppercase"
                      scope="col"
                      key={label}
                    >
                      {label}
                    </th>
                  ))}
                  <th
                    className="px-5 py-3.5 text-right text-[11px] font-bold tracking-wider text-[#61736F] uppercase"
                    scope="col"
                  >
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE5E2]">
                {accounts.map((account) => (
                  <tr
                    className="transition hover:bg-[#F5F7F6]/60 focus-within:bg-[#F5F7F6]/80"
                    key={account.userId}
                  >
                    <td className="px-5 py-4">
                      <Link
                        className="font-bold text-[#0D5754] transition hover:text-[#094743] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D5754]"
                        href={`/admin/users/${encodeURIComponent(account.userId)}`}
                      >
                        {account.fullName}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-xs text-[#61736F]">
                      {account.email ?? '—'}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide ${getRoleBadgeClass(
                          account.role,
                        )}`}
                      >
                        {account.role}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide ${getStatusBadgeClass(
                          account.status,
                        )}`}
                      >
                        {accountStatusLabel(account.status)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs font-medium text-[#61736F]">
                      {accountDate(account.createdAtUtc)}
                    </td>
                    <td className="px-5 py-4 text-xs font-medium text-[#61736F]">
                      {accountDate(account.lastLoginAtUtc)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/admin/users/${encodeURIComponent(account.userId)}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#0D5754] transition hover:text-[#094743] hover:underline"
                        aria-label={`View details for ${account.fullName}`}
                      >
                        <span>Details</span>
                        <span className="material-symbols-outlined text-xs" aria-hidden="true">
                          arrow_forward
                        </span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {accounts.length === 0 && (
            <div className="py-12 px-4 text-center">
              <span
                className="material-symbols-outlined mx-auto mb-2 text-4xl text-[#61736F]/50"
                aria-hidden="true"
              >
                person_search
              </span>
              <p className="text-base font-bold text-[#1D2D2B]">
                {data.items.length > 0
                  ? 'No permitted accounts on this page.'
                  : 'No matching accounts.'}
              </p>
              <p className="mt-1 text-xs text-[#61736F]">
                {data.items.length > 0
                  ? `Accounts exist on this page, but none match your ${session.role} management scope. Please select a specific permitted role from the filter.`
                  : 'Try adjusting your search keyword or clearing filter constraints.'}
              </p>
            </div>
          )}

          {/* Pagination Footer */}
          <nav
            className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-[#DCE5E2] px-6 py-4 bg-[#FAFCFB]"
            aria-label="Account pages"
          >
            <p className="text-xs text-[#61736F]">
              Showing <strong className="text-[#1D2D2B] font-bold">{accounts.length}</strong>{' '}
              {typeof data.totalCount === 'number' ? (
                <>
                  of <strong className="text-[#1D2D2B] font-bold">{data.totalCount}</strong> total accounts
                </>
              ) : (
                <>{accounts.length === 1 ? 'account' : 'accounts'}</>
              )}{' '}
              · Page <strong className="text-[#1D2D2B] font-bold">{page}</strong> of{' '}
              <strong className="text-[#1D2D2B] font-bold">{data.totalPages || 1}</strong>
            </p>
            <div className="flex items-center gap-2">
              {page > 1 ? (
                <Link
                  href={link(page - 1)}
                  className="inline-flex items-center gap-1 rounded-xl border border-[#DCE5E2] bg-white px-3.5 py-1.5 text-xs font-bold text-[#1D2D2B] shadow-xs transition hover:bg-[#F5F7F6]"
                >
                  <span className="material-symbols-outlined text-sm" aria-hidden="true">
                    arrow_back
                  </span>
                  <span>Previous</span>
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-xl border border-[#DCE5E2]/60 bg-[#F5F7F6] px-3.5 py-1.5 text-xs font-bold text-[#61736F]/40 cursor-not-allowed">
                  <span className="material-symbols-outlined text-sm" aria-hidden="true">
                    arrow_back
                  </span>
                  <span>Previous</span>
                </span>
              )}

              {page < data.totalPages ? (
                <Link
                  href={link(page + 1)}
                  className="inline-flex items-center gap-1 rounded-xl border border-[#DCE5E2] bg-white px-3.5 py-1.5 text-xs font-bold text-[#1D2D2B] shadow-xs transition hover:bg-[#F5F7F6]"
                >
                  <span>Next</span>
                  <span className="material-symbols-outlined text-sm" aria-hidden="true">
                    arrow_forward
                  </span>
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-xl border border-[#DCE5E2]/60 bg-[#F5F7F6] px-3.5 py-1.5 text-xs font-bold text-[#61736F]/40 cursor-not-allowed">
                  <span>Next</span>
                  <span className="material-symbols-outlined text-sm" aria-hidden="true">
                    arrow_forward
                  </span>
                </span>
              )}
            </div>
          </nav>
        </div>
      )}
    </main>
  );
}
