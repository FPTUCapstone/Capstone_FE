import Link from 'next/link';

import { adminUserAccountsEn } from '@/features/admin/user-accounts/resources/en';

interface UserAccountDetailUnavailableViewProps {
  userId: number;
}

export function UserAccountDetailUnavailableView({ userId }: UserAccountDetailUnavailableViewProps) {
  const copy = adminUserAccountsEn.detail;

  return (
    <main className="min-h-screen bg-[#f7f9fc] px-4 py-8 text-[#191c1e] sm:px-6 md:px-8 md:py-10">
      <section className="mx-auto max-w-4xl rounded-2xl border border-[#d0d7de] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-bold tracking-wider text-[#006b5f] uppercase">{copy.eyebrow}</p>
        <span className="mt-3 inline-flex rounded-full bg-[#eef6ff] px-3 py-1 text-xs font-bold text-[#004b87]">
          {copy.pendingBadge}
        </span>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-[#00152a] sm:text-3xl">
          {copy.title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#475467]">{copy.pendingDescription}</p>

        <dl className="mt-6 rounded-xl border border-[#d0d7de] bg-[#f8fafc] p-4">
          <dt className="text-xs font-bold tracking-wide text-[#475467] uppercase">
            {copy.requestedAccountIdLabel}
          </dt>
          <dd className="mt-1 text-base font-extrabold text-[#00152a]">{userId}</dd>
        </dl>

        <section
          aria-label={copy.operationsLabel}
          className="mt-6 rounded-xl border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-4"
        >
          <h2 className="text-sm font-bold text-[#334155]">{copy.operationsLabel}</h2>
          <p className="mt-1 text-sm text-[#475467]">{copy.pendingDescription}</p>
        </section>

        <Link
          href="/admin/users"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#006b5f] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#005048] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006b5f]"
        >
          {copy.backToDirectoryLabel}
        </Link>
      </section>
    </main>
  );
}
