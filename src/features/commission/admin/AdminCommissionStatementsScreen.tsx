"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { commissionDate, readStatementPage } from '../operator/commission';

type StatementRow = {
  id: number;
  tourOperatorName?: string;
  tourOperatorUserId?: number;
  period: string;
  commissionAmountVnd: number;
  status: string;
  issuedAtUtc?: string;
  dueAtUtc?: string | null;
};

type IssueState = "idle" | "open" | "submitting";
type ListState =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "ready"; rows: StatementRow[] };

function formatVnd(n: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(n);
}


function statusBadge(status: string): string {
  if (status === "Paid") return "bg-emerald-100 text-emerald-800";
  if (status === "Overdue") return "bg-rose-100 text-rose-800";
  return "bg-amber-100 text-amber-800";
}

export function AdminCommissionStatementsScreen({ canIssue = true }: { canIssue?: boolean }) {
  const [listState, setListState] = useState<ListState>({ phase: "loading" });
  const [issueState, setIssueState] = useState<IssueState>("idle");
  const [toUserId, setToUserId] = useState("");
  const [period, setPeriod] = useState("");
  const [issueError, setIssueError] = useState<string | null>(null);
  const toUserIdRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setListState({ phase: "loading" });
    try {
      const res = await fetch(
        "/api/v1/admin/commission-statements?pageNumber=1&pageSize=100",
        { cache: "no-store" },
      );
      const payload: unknown = await res.json().catch(() => null);
      if (!res.ok || !payload) {
        setListState({ phase: "error", message: "Could not load commission statements." });
        return;
      }
      const list = readStatementPage(payload).items;
      setListState({ phase: "ready", rows: list });
    } catch {
      setListState({ phase: "error", message: "Network error." });
    }
  }, []);

  useEffect(() => {
    const tid = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(tid);
  }, [load]);

  async function issueStatement() {
    const uid = Number(toUserId.trim());
    if (!Number.isFinite(uid) || uid <= 0) {
      setIssueError("Valid Tour Operator user ID required.");
      return;
    }
    if (!/^\d{4}-\d{2}$/.test(period.trim())) {
      setIssueError("Period must be YYYY-MM.");
      return;
    }
    setIssueState("submitting");
    setIssueError(null);
    try {
      const res = await fetch("/api/v1/admin/commission-statements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ tourOperatorUserId: uid, period: period.trim() }),
      });
      if (!res.ok) {
        const err: unknown = await res.json().catch(() => null);
        const msg =
          err && typeof err === "object" && "title" in err
            ? String((err as { title: unknown }).title)
            : "Could not issue statement.";
        setIssueError(msg);
        setIssueState("open");
        return;
      }
      setIssueState("idle");
      setToUserId("");
      setPeriod("");
      await load();
    } catch {
      setIssueError("Network error. Please try again.");
      setIssueState("open");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#1C2928]">Commission Statements</h1>
        <div className="flex gap-2">
          <button type="button" onClick={() => void load()}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
            Refresh
          </button>
          {canIssue ? <button type="button"
            onClick={() => { setIssueState("open"); setTimeout(() => toUserIdRef.current?.focus(), 50); }}
            className="rounded-xl bg-[#174B4A] px-3 py-1.5 text-sm font-bold text-white">
            Issue statement
          </button> : null}
        </div>
      </div>

      {/* Issue form */}
      {(issueState === "open" || issueState === "submitting") && (
        <div className="rounded-xl border border-slate-200 p-4 space-y-3 text-sm">
          <p className="font-semibold">Issue new commission statement</p>
          <label className="block">
            <span className="text-xs text-slate-500">Tour Operator user ID</span>
            <input ref={toUserIdRef} type="number" value={toUserId}
              onChange={(e) => setToUserId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#174B4A]"
              placeholder="12345" />
          </label>
          <label className="block">
            <span className="text-xs text-slate-500">Period (YYYY-MM)</span>
            <input type="text" value={period} onChange={(e) => setPeriod(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#174B4A]"
              placeholder="2026-11" maxLength={7} />
          </label>
          {issueError && (
            <p className="text-xs text-rose-700">{issueError}</p>
          )}
          <div className="flex gap-2">
            <button type="button" disabled={issueState === "submitting"}
              onClick={() => void issueStatement()}
              className="rounded-xl bg-[#174B4A] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
              {issueState === "submitting" ? "Issuing…" : "Issue"}
            </button>
            <button type="button"
              onClick={() => { setIssueState("idle"); setIssueError(null); }}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-600">
              Cancel
            </button>
          </div>
        </div>
      )}

      {listState.phase === "loading" && (
        <p className="py-10 text-center text-sm text-slate-500">Loading…</p>
      )}
      {listState.phase === "error" && (
        <div className="py-10 text-center">
          <p className="text-sm text-rose-700">{listState.message}</p>
          <button type="button" onClick={() => void load()}
            className="mt-3 rounded-xl bg-[#174B4A] px-4 py-2 text-sm font-bold text-white">
            Try again
          </button>
        </div>
      )}
      {listState.phase === "ready" && (
        listState.rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">No commission statements.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Period</th>
                  <th className="px-4 py-3 text-left">Operator</th>
                  <th className="px-4 py-3 text-right">Commission</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Issued</th>
                  <th className="px-4 py-3 text-left">Due</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {listState.rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono">{row.period}</td>
                    <td className="px-4 py-3">{row.tourOperatorName ?? `TO #${row.tourOperatorUserId ?? '—'}`}</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatVnd(row.commissionAmountVnd)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${statusBadge(row.status)}`}>
                        {row.commissionAmountVnd === 0 ? 'Không cần thanh toán' : row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{commissionDate(row.issuedAtUtc)}</td>
                    <td className="px-4 py-3">{row.commissionAmountVnd === 0 ? '—' : commissionDate(row.dueAtUtc)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/commission-statements/${row.id}`}
                        className="text-[#174B4A] font-semibold hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
