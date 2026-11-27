"use client";

import { useCallback, useEffect, useState } from "react";

import { readStatement, commissionDate, type CommissionStatement } from '../operator/commission';
import { CommissionCalculationBreakdown } from '../operator/CommissionCalculationBreakdown';
type StatementDetail = CommissionStatement;

function formatVnd(n: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(n);
}


export function AdminCommissionStatementDetail({ statementId }: { statementId: string }) {
  const [stmt, setStmt] = useState<StatementDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/v1/admin/commission-statements/${encodeURIComponent(statementId)}`,
        { cache: "no-store" },
      );
      const payload: unknown = await res.json().catch(() => null);
      if (!res.ok || !payload) {
        setError(res.status === 404 ? "Statement not found." : "Could not load statement.");
        return;
      }
      const inner = payload && typeof payload === "object" && "data" in payload
        ? (payload as { data: unknown }).data
        : payload;
      setStmt(readStatement(inner)); setError(null);
    } catch {
      setError("Could not load statement.");
    }
  }, [statementId]);

  useEffect(() => {
    const tid = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(tid);
  }, [load]);

  if (error) return <p className="py-10 text-center text-sm text-rose-700">{error}</p>;
  if (!stmt) return <p className="py-10 text-center text-sm text-slate-500">Loading…</p>;

  return (
    <div className="space-y-6 text-sm">
      <h2 className="text-lg font-bold text-[#1C2928]">Commission Statement — {stmt.period}</h2>
      <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200">
        <Row label="Period" value={stmt.period} />
        <Row label="Tour Operator" value={`TO #${stmt.tourOperatorUserId ?? '—'}`} />
        <Row label="Commission" value={formatVnd(stmt.commissionAmountVnd)} />
        <Row label="Eligible base" value={formatVnd(stmt.eligibleBaseVnd)} />
        <Row label="Rate snapshot" value={`${(stmt.commissionRateSnapshot * 100).toFixed(2)}%`} />
        <Row label="Status" value={stmt.commissionAmountVnd === 0 ? 'Không cần thanh toán' : stmt.status} />
        <Row label="Issued" value={commissionDate(stmt.issuedAtUtc)} />
        <Row label="Due" value={stmt.commissionAmountVnd === 0 ? '—' : commissionDate(stmt.dueAtUtc)} />
        {stmt.paidAtUtc && <Row label="Paid" value={commissionDate(stmt.paidAtUtc)} />}
      </dl>
      {stmt.calculation ? <CommissionCalculationBreakdown calculation={stmt.calculation} /> : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-semibold text-slate-800">{value}</dd>
    </div>
  );
}
