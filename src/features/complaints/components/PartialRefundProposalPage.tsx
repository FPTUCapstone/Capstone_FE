"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { ActionButton } from "@/components/ui/ActionButton";
import { FeedbackAlert } from "@/components/ui/FeedbackAlert";
import { useWebSession } from "@/features/auth/session/useWebSession";
import { ROUTES } from "@/lib/routes";

import {
  PARTIAL_REFUND_ERROR_CODES as CODES,
  partialRefundMessages as MSG,
} from "../resources/partialRefundMessages";

type Decision = "Accept" | "Decline";

type PartialRefundProposal = {
  complaintId: number;
  bookingId: number;
  bookingCode: string;
  proposedAmount: number;
  responseDeadlineUtc: string;
  status: string;
  canRespond: boolean;
};

type Notice = { tone: "success" | "error"; text: string };

type FetchResult =
  | { kind: "ok"; proposal: PartialRefundProposal }
  | { kind: "unauthenticated" }
  | { kind: "error"; text: string };

function formatVnd(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDeadline(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Ho_Chi_Minh",
      }).format(date);
}

function statusCopy(proposal: PartialRefundProposal) {
  switch (proposal.status) {
    case "AwaitingTravelerResponse":
      return {
        label: "Awaiting your response",
        tone: "bg-amber-100 text-amber-800",
        description:
          "Accept or decline before the response deadline (Vietnam time). No response by then counts as Decline.",
      };
    case "Approved":
      return {
        label: "Accepted",
        tone: "bg-emerald-100 text-emerald-800",
        description: `The refund of ${formatVnd(proposal.proposedAmount)} is paid after the Tour Operator confirms it.`,
      };
    case "Declined":
      return {
        label: "Declined",
        tone: "bg-slate-200 text-slate-700",
        description: "The proposal has ended. The complaint is handled under the partnership contract.",
      };
    default:
      return {
        label: "Closed",
        tone: "bg-slate-200 text-slate-700",
        description: "This proposal can no longer be answered.",
      };
  }
}

function errorText(status: number, errorCode: unknown): string {
  if (status === 403 || errorCode === CODES.forbidden) return MSG.MSG126;
  if (status === 404 || errorCode === CODES.notFound) return MSG.notFound;
  return MSG.MSG127;
}

async function readErrorCode(response: Response): Promise<unknown> {
  const body: unknown = await response.json().catch(() => null);
  return body && typeof body === "object" && "errorCode" in body ? body.errorCode : null;
}

async function fetchProposal(complaintId: string): Promise<FetchResult> {
  try {
    const response = await fetch(
      `/api/v1/traveler/complaints/${encodeURIComponent(complaintId)}/partial-refund-proposal`,
      { cache: "no-store" },
    );
    if (response.status === 401) return { kind: "unauthenticated" };
    if (!response.ok) {
      return { kind: "error", text: errorText(response.status, await readErrorCode(response)) };
    }
    const payload: unknown = await response.json().catch(() => null);
    if (!payload || typeof payload !== "object") return { kind: "error", text: MSG.MSG127 };
    return { kind: "ok", proposal: payload as PartialRefundProposal };
  } catch {
    return { kind: "error", text: MSG.MSG127 };
  }
}

/** UC-75 screen #97: the Traveler accepts or declines a partial refund proposal (SRS §3.8.6.3). */
export function PartialRefundProposalPage({ complaintId }: { complaintId: string }) {
  // Another complaint id starts from a clean state: no answer, notice or proposal carries over.
  return <ProposalScreen key={complaintId} complaintId={complaintId} />;
}

function ProposalScreen({ complaintId }: { complaintId: string }) {
  const { status: sessionStatus } = useWebSession();
  const router = useRouter();
  const [proposal, setProposal] = useState<PartialRefundProposal | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingDecision, setPendingDecision] = useState<Decision | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [responded, setResponded] = useState(false);

  const signInUrl = `${ROUTES.signIn}?returnUrl=${encodeURIComponent(
    ROUTES.account.partialRefundProposal(complaintId),
  )}`;

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const result = await fetchProposal(complaintId);
    if (result.kind === "unauthenticated") {
      router.replace(signInUrl);
      return;
    }
    if (result.kind === "error") setLoadError(result.text);
    else setProposal(result.proposal);
    setLoading(false);
  }, [complaintId, router, signInUrl]);

  useEffect(() => {
    if (sessionStatus !== "authenticated") return;
    const timeoutId = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [load, sessionStatus]);

  useEffect(() => {
    if (sessionStatus === "unauthenticated") router.replace(signInUrl);
  }, [router, sessionStatus, signInUrl]);

  async function submit(decision: Decision) {
    setSubmitting(true);
    setNotice(null);
    try {
      const response = await fetch(
        `/api/v1/traveler/complaints/${encodeURIComponent(complaintId)}/partial-refund-proposal/response`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ decision }),
        },
      );
      if (response.status === 401) {
        router.replace(signInUrl);
        return;
      }
      if (response.ok) {
        const outcome: unknown = await response.json().catch(() => null);
        const status =
          outcome && typeof outcome === "object" && "status" in outcome && typeof outcome.status === "string"
            ? outcome.status
            : decision === "Accept"
              ? "Approved"
              : "Declined";
        setProposal((current) => (current ? { ...current, status, canRespond: false } : current));
        setResponded(true);
        setNotice({ tone: "success", text: MSG.MSG164 });
        return;
      }
      const errorCode = await readErrorCode(response);
      if (response.status === 409 || errorCode === CODES.responseClosed) {
        // G1/G5: answered already or past the deadline. Nothing changed; show the current state.
        setProposal((current) => (current ? { ...current, canRespond: false } : current));
        const reloaded = await fetchProposal(complaintId);
        if (reloaded.kind === "ok") setProposal(reloaded.proposal);
        return;
      }
      setNotice({ tone: "error", text: errorText(response.status, errorCode) });
    } catch {
      setNotice({ tone: "error", text: MSG.MSG127 });
    } finally {
      setSubmitting(false);
      setPendingDecision(null);
    }
  }

  const content =
    loading || sessionStatus !== "authenticated" ? (
      <p className="py-14 text-center text-sm text-slate-600">Loading the proposal…</p>
    ) : loadError ? (
      <div className="mt-6 space-y-4">
        <FeedbackAlert tone="error">{loadError}</FeedbackAlert>
        {loadError === MSG.MSG127 ? (
          <ActionButton type="button" onClick={() => void load()}>
            Try again
          </ActionButton>
        ) : null}
      </div>
    ) : proposal ? (
      <ProposalDetails
        proposal={proposal}
        notice={notice}
        responded={responded}
        submitting={submitting}
        onChoose={setPendingDecision}
      />
    ) : null;

  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      <Link href={ROUTES.account.trips} className="text-sm font-semibold text-[#174B4A]">
        ← Trip history
      </Link>
      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" lang="en">
        <h1 className="text-xl font-bold text-[#1C2928]">Partial refund proposal</h1>
        <p className="mt-1 text-sm text-slate-600">
          The Tour Operator has proposed a partial refund for your complaint.
        </p>
        {content}
      </section>
      {pendingDecision && proposal ? (
        <ConfirmDecisionDialog
          decision={pendingDecision}
          amount={proposal.proposedAmount}
          submitting={submitting}
          onConfirm={() => void submit(pendingDecision)}
          onCancel={() => setPendingDecision(null)}
        />
      ) : null}
    </main>
  );
}

function ProposalDetails({
  proposal,
  notice,
  responded,
  submitting,
  onChoose,
}: {
  proposal: PartialRefundProposal;
  notice: Notice | null;
  responded: boolean;
  submitting: boolean;
  onChoose: (decision: Decision) => void;
}) {
  const copy = statusCopy(proposal);
  return (
    <div className="mt-6 space-y-4 text-sm">
      {notice ? <FeedbackAlert tone={notice.tone}>{notice.text}</FeedbackAlert> : null}
      {!proposal.canRespond && !responded ? (
        <FeedbackAlert tone="warning">{MSG.MSG165}</FeedbackAlert>
      ) : null}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Booking</p>
            <p className="mt-1 break-all font-mono font-bold text-[#1C2928]">{proposal.bookingCode}</p>
          </div>
          <span className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${copy.tone}`}>{copy.label}</span>
        </div>
        <p className="mt-3 text-slate-600">{copy.description}</p>
      </div>
      <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200">
        <div className="flex items-start justify-between gap-4 px-4 py-3">
          <dt className="text-slate-500">Proposed amount</dt>
          <dd className="text-right text-base font-bold text-[#1C2928]">
            {formatVnd(proposal.proposedAmount)}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-4 px-4 py-3">
          <dt className="text-slate-500">Response deadline</dt>
          <dd className="text-right font-semibold text-slate-800">
            {formatDeadline(proposal.responseDeadlineUtc)}
          </dd>
        </div>
      </dl>
      {proposal.canRespond ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          <ActionButton
            type="button"
            className="flex-1"
            disabled={submitting}
            onClick={() => onChoose("Accept")}
          >
            Accept
          </ActionButton>
          <ActionButton
            type="button"
            variant="outline"
            className="flex-1"
            disabled={submitting}
            onClick={() => onChoose("Decline")}
          >
            Decline
          </ActionButton>
        </div>
      ) : null}
    </div>
  );
}

function ConfirmDecisionDialog({
  decision,
  amount,
  submitting,
  onConfirm,
  onCancel,
}: {
  decision: Decision;
  amount: number;
  submitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const accept = decision === "Accept";
  const dialogRef = useRef<HTMLDivElement>(null);

  // Same keyboard behavior as LogoutDialog: focus moves in, Tab stays in, focus returns on close.
  useLayoutEffect(() => {
    const previouslyFocused = document.activeElement;
    dialogRef.current?.querySelector<HTMLElement>("button:not([disabled])")?.focus();
    return () => {
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) onCancel();
      if (event.key !== "Tab") return;
      const controls = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>("button:not([disabled])") ?? [],
      );
      if (controls.length === 0) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onCancel, submitting]);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="partial-refund-confirm-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl" lang="en">
        <h2 id="partial-refund-confirm-title" className="text-lg font-bold text-[#1C2928]">
          {accept ? "Accept the partial refund?" : "Decline the partial refund?"}
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          {accept
            ? `You accept a refund of ${formatVnd(amount)}. It is paid after the Tour Operator confirms it.`
            : "The proposal ends and the complaint is handled under the partnership contract."}{" "}
          You cannot change this answer later.
        </p>
        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <ActionButton type="button" variant="outline" disabled={submitting} onClick={onCancel}>
            Go back
          </ActionButton>
          <ActionButton type="button" loading={submitting} onClick={onConfirm}>
            {accept ? "Confirm accept" : "Confirm decline"}
          </ActionButton>
        </div>
      </div>
    </div>
  );
}
