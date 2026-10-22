"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { PublicNavigation } from "@/components/navigation/PublicNavigation";
import { useWebSession } from "@/features/auth/session/useWebSession";
import { ROUTES } from "@/lib/routes";

type RefundProgress = {
  bookingId: number;
  bookingCode: string;
  refundAmount: number;
  status:
    | "Pending"
    | "Processing"
    | "RetryPending"
    | "ManualReview"
    | "Processed"
    | "Failed"
    | "Rejected";
  gatewayReference?: string | null;
  attemptCount: number;
  requestedAtUtc: string;
  processedAtUtc?: string | null;
  nextAttemptAtUtc?: string | null;
  lastErrorCode?: string | null;
};

function formatVnd(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Ho_Chi_Minh",
      }).format(date);
}

function statusCopy(status: RefundProgress["status"]) {
  switch (status) {
    case "Processed":
      return {
        label: "Refund completed",
        tone: "bg-emerald-100 text-emerald-800",
        description:
          "The refund has been completed through the original payment channel.",
      };
    case "ManualReview":
      return {
        label: "Under manual review",
        tone: "bg-amber-100 text-amber-800",
        description:
          "Our team is verifying this refund with the payment provider.",
      };
    case "Failed":
      return {
        label: "Needs attention",
        tone: "bg-rose-100 text-rose-800",
        description:
          "We could not complete the refund automatically. Support will follow up.",
      };
    case "Rejected":
      return {
        label: "Refund not approved",
        tone: "bg-slate-200 text-slate-700",
        description:
          "This refund was not approved under the applicable policy.",
      };
    case "RetryPending":
      return {
        label: "Retry scheduled",
        tone: "bg-sky-100 text-sky-800",
        description: "We will retry the refund shortly.",
      };
    case "Processing":
      return {
        label: "Processing refund",
        tone: "bg-blue-100 text-blue-800",
        description: "The payment provider is processing your refund.",
      };
    default:
      return {
        label: "Refund requested",
        tone: "bg-blue-100 text-blue-800",
        description: "Your refund request has been received.",
      };
  }
}

export function RefundProgressPage({ bookingId }: { bookingId: string }) {
  const { status: sessionStatus } = useWebSession();
  const router = useRouter();
  const [progress, setProgress] = useState<RefundProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/v1/bookings/${encodeURIComponent(bookingId)}/refund`,
        { cache: "no-store" },
      );
      const payload: unknown = await response.json().catch(() => null);
      if (response.status === 401) {
        router.replace(
          `${ROUTES.signIn}?returnUrl=${encodeURIComponent(`/bookings/${bookingId}/refund`)}`,
        );
        return;
      }
      if (!response.ok || !payload || typeof payload !== "object") {
        setError(
          response.status === 404
            ? "No refund record was found for this booking."
            : "We could not load refund progress. Please try again.",
        );
        return;
      }
      setProgress(payload as RefundProgress);
    } catch {
      setError(
        "We could not load refund progress. Please check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [bookingId, router]);

  useEffect(() => {
    if (sessionStatus !== "authenticated") return;
    const timeoutId = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [load, sessionStatus]);

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.replace(
        `${ROUTES.signIn}?returnUrl=${encodeURIComponent(`/bookings/${bookingId}/refund`)}`,
      );
    }
  }, [bookingId, router, sessionStatus]);

  const content =
    loading || sessionStatus === "restoring" ? (
      <p className="py-14 text-center text-sm text-slate-600">
        Loading refund progress…
      </p>
    ) : error ? (
      <div className="py-10 text-center">
        <p className="text-sm text-rose-700">{error}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-4 rounded-xl bg-[#006B5F] px-4 py-2 text-sm font-bold text-white"
        >
          Try again
        </button>
      </div>
    ) : progress ? (
      <RefundDetails progress={progress} />
    ) : null;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <PublicNavigation />
      <main className="mx-auto max-w-xl px-4 py-8">
        <Link
          href={ROUTES.home}
          className="text-sm font-semibold text-[#006B5F]"
        >
          ← Back to TripMate
        </Link>
        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h1 className="text-xl font-bold text-[#00152A]">Refund progress</h1>
          <p className="mt-1 text-sm text-slate-600">
            Track the refund for booking {bookingId}.
          </p>
          {content}
        </section>
      </main>
    </div>
  );
}

function RefundDetails({ progress }: { progress: RefundProgress }) {
  const copy = statusCopy(progress.status);
  return (
    <div className="mt-6 space-y-4 text-sm">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Booking
            </p>
            <p className="mt-1 font-mono font-bold text-[#00152A]">
              {progress.bookingCode}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${copy.tone}`}
          >
            {copy.label}
          </span>
        </div>
        <p className="mt-3 text-slate-600">{copy.description}</p>
      </div>
      <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200">
        <Detail
          label="Refund amount"
          value={formatVnd(progress.refundAmount)}
        />
        <Detail label="Requested" value={formatDate(progress.requestedAtUtc)} />
        <Detail label="Completed" value={formatDate(progress.processedAtUtc)} />
        {progress.nextAttemptAtUtc && (
          <Detail
            label="Next attempt"
            value={formatDate(progress.nextAttemptAtUtc)}
          />
        )}
        {progress.gatewayReference && (
          <Detail label="Reference" value={progress.gatewayReference} mono />
        )}
        {progress.attemptCount > 0 && (
          <Detail label="Attempts" value={String(progress.attemptCount)} />
        )}
      </dl>
      {progress.status === "Failed" && (
        <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
          No action is needed from you. Our support team will contact you if
          more information is required.
        </p>
      )}
    </div>
  );
}

function Detail({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <dt className="text-slate-500">{label}</dt>
      <dd
        className={`text-right font-semibold text-slate-800 ${mono ? "font-mono text-xs" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}
