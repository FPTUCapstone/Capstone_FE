import Link from 'next/link';

import { ROUTES } from '@/lib/routes';

export function PayoutSettlementUnavailableView() {
  return (
    <div className="pb-16 text-[#1C2923]">
      <section className="mx-auto max-w-6xl">
        {/* Workspace Header - Forest Charcoal Authority */}
        <header className="rounded-2xl border border-[#2A3B33] bg-[#1C2923] p-6 text-[#F7F6F2] shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#758B74] bg-[#273830] px-3 py-1 text-xs font-bold tracking-wider text-[#E8EFE9] uppercase">
                <span className="h-2 w-2 rounded-full bg-[#758B74]" aria-hidden="true" />
                <span>Financial Governance — UC-65</span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#FFFFFF] sm:text-3xl">
                Payout Settlement Processing
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#A3B3AB]">
                Disburse approved tour operator earnings, manage banking gateway batches, and track electronic transfer reconciliations across platform transactions.
              </p>
            </div>
            <div className="shrink-0">
              <Link
                href={ROUTES.admin.dashboard}
                className="inline-flex items-center justify-center rounded-xl bg-[#245747] border border-[#758B74] px-4 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-[#1B4337] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#758B74]"
              >
                Return to Overview
              </Link>
            </div>
          </div>
        </header>

        {/* Honest Architecture & Integration Notice - Warm Ivory / Muted Copper */}
        <section
          aria-labelledby="settlement-status-heading"
          className="mt-6 rounded-2xl border border-[#F2D8B3] bg-[#FBF3E8] p-5 sm:p-6 text-[#1C2923]"
        >
          <div className="flex items-start gap-3">
            <span
              className="material-symbols-outlined mt-0.5 text-[22px] text-[#8F5419]"
              aria-hidden="true"
            >
              account_balance
            </span>
            <div>
              <span className="inline-flex rounded-full border border-[#F2D8B3] bg-[#F7EBE5] px-3 py-1 text-xs font-bold text-[#8F5419]">
                Pending Backend Settlement Service
              </span>
              <h2 id="settlement-status-heading" className="mt-3 text-lg font-extrabold text-[#1C2923]">
                Automated Payment Gateway & Disbursement Integration Pending
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#4A5851]">
                Banking API webhooks, automated payout scheduling, and batch remittance services are scheduled for future backend release. Payout records verification is operational in the Staff review workspace.
              </p>
            </div>
          </div>
        </section>

        {/* Disabled Workspace Form / Controls Placeholder */}
        <section className="mt-6 rounded-2xl border border-[#E6E4DD] bg-[#FFFFFF] p-5 shadow-xs sm:p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="block text-sm font-bold text-[#1C2923]">
              Settlement Batch ID
              <input
                disabled
                placeholder="e.g. BATCH-2026-10-A"
                type="text"
                className="mt-2 w-full rounded-xl border border-[#D8D5CC] bg-[#EDECE8] px-3 py-2.5 text-sm text-[#74827B] disabled:cursor-not-allowed"
              />
            </label>
            <label className="block text-sm font-bold text-[#1C2923]">
              Disbursement Cycle
              <select
                disabled
                defaultValue=""
                className="mt-2 w-full rounded-xl border border-[#D8D5CC] bg-[#EDECE8] px-3 py-2.5 text-sm text-[#74827B] disabled:cursor-not-allowed"
              >
                <option value="">Bi-weekly Settlement (Default)</option>
              </select>
            </label>
            <label className="block text-sm font-bold text-[#1C2923]">
              Gateway Status
              <input
                disabled
                value="Integration Standby"
                type="text"
                className="mt-2 w-full rounded-xl border border-[#D8D5CC] bg-[#EDECE8] px-3 py-2.5 text-sm text-[#74827B] disabled:cursor-not-allowed"
              />
            </label>
          </div>

          <div className="mt-6 rounded-xl border border-dashed border-[#D8D5CC] bg-[#F7F6F2] p-8 text-center">
            <span
              className="material-symbols-outlined text-[36px] text-[#758B74]"
              aria-hidden="true"
            >
              account_balance_wallet
            </span>
            <h3 className="mt-2 text-base font-bold text-[#4A5851]">
              No Settlement Batches Queued
            </h3>
            <p className="mt-1 text-sm text-[#74827B]">
              Settlement batches will be generated automatically once financial gateway integration is activated.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={ROUTES.admin.dashboard}
              className="inline-flex items-center justify-center rounded-xl bg-[#245747] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#1B4337] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#758B74]"
            >
              Return to Control Center
            </Link>
            <Link
              href={ROUTES.admin.reports}
              className="inline-flex items-center justify-center rounded-xl border border-[#D8D5CC] bg-white px-4 py-2.5 text-sm font-bold text-[#1C2923] transition hover:bg-[#F7F6F2]"
            >
              View Financial Reports
            </Link>
          </div>
        </section>
      </section>
    </div>
  );
}
