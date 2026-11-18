export default function UserAccountsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <p role="status" className="sr-only">
        Loading account information…
      </p>
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-pulse">
        <div>
          <div className="h-8 w-48 rounded-lg bg-slate-200" />
          <div className="mt-2 h-4 w-96 rounded-md bg-slate-200" />
        </div>
        <div className="h-10 w-44 rounded-xl bg-slate-200" />
      </div>

      {/* Filter Toolbar Skeleton */}
      <div className="rounded-2xl border border-[#DCE5E2] bg-white p-5 sm:p-6 shadow-xs animate-pulse">
        <div className="flex flex-wrap items-end gap-3.5">
          <div className="h-14 flex-1 min-w-[200px] rounded-xl bg-slate-100" />
          <div className="h-14 w-44 rounded-xl bg-slate-100" />
          <div className="h-14 w-44 rounded-xl bg-slate-100" />
          <div className="h-14 w-36 rounded-xl bg-slate-100" />
          <div className="h-14 w-36 rounded-xl bg-slate-100" />
          <div className="h-10 w-28 rounded-xl bg-slate-200" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="overflow-hidden rounded-2xl border border-[#DCE5E2] bg-white shadow-xs animate-pulse">
        <div className="h-11 bg-[#F5F7F6]" />
        <div className="divide-y divide-[#DCE5E2]">
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="flex items-center justify-between px-5 py-4">
              <div className="h-5 w-36 rounded bg-slate-200" />
              <div className="h-4 w-48 rounded bg-slate-100" />
              <div className="h-6 w-20 rounded-full bg-slate-100" />
              <div className="h-6 w-16 rounded-full bg-slate-100" />
              <div className="h-4 w-24 rounded bg-slate-100" />
              <div className="h-4 w-24 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
