import Link from 'next/link';

import { adminUserAccountsEn } from '@/features/admin/user-accounts/resources/en';

interface UserAccountDetailUnavailableViewProps {
  userId: number;
}

export function UserAccountDetailUnavailableView({ userId }: UserAccountDetailUnavailableViewProps) {
  const copy = adminUserAccountsEn.detail;

  return (
    <div className="pb-16 text-[#1C2928]">
      <section className="mx-auto max-w-4xl rounded-2xl border border-[#DCE2DD] bg-[#FFFFFF] p-6 shadow-xs sm:p-8">
        <p className="text-xs font-bold tracking-wider text-[#174B4A] uppercase">{copy.eyebrow}</p>
        <span className="mt-3 inline-flex rounded-full border border-[#F2D8B3] bg-[#FBF3E8] px-3 py-1 text-xs font-bold text-[#8F5419]">
          {copy.pendingBadge}
        </span>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-[#1C2928] sm:text-3xl">
          {copy.title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#5B6E69]">{copy.pendingDescription}</p>

        <dl className="mt-6 rounded-xl border border-[#DCE2DD] bg-[#F7F5EF] p-4">
          <dt className="text-xs font-bold tracking-wide text-[#5B6E69] uppercase">
            {copy.requestedAccountIdLabel}
          </dt>
          <dd className="mt-1 text-base font-extrabold text-[#1C2928]">{userId}</dd>
        </dl>

        <section
          aria-label={copy.operationsLabel}
          className="mt-6 rounded-xl border border-dashed border-[#DCE2DD] bg-[#F7F5EF] p-4"
        >
          <h2 className="text-sm font-bold text-[#5B6E69]">{copy.operationsLabel}</h2>
          <p className="mt-1 text-sm text-[#5B6E69]">{copy.pendingDescription}</p>
        </section>

        <Link
          href="/admin/users"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#174B4A] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#103B39] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B6E69]"
        >
          {copy.backToDirectoryLabel}
        </Link>
      </section>
    </div>
  );
}
