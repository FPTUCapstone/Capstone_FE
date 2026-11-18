import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookies: vi.fn(),
  fetchBackend: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: mocks.cookies }));
vi.mock("@/lib/server/backend", () => ({
  fetchBackend: mocks.fetchBackend,
}));

import {
  proxyGetPartialRefundProposal,
  proxyRespondToPartialRefundProposal,
} from "./partialRefundProposalProxy";

const BASE = "https://tripmate.test/api/v1/traveler/complaints/501/partial-refund-proposal";

function getRequest() {
  return new Request(BASE);
}

function postRequest(body: unknown) {
  return new Request(`${BASE}/response`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function signedIn(role: "Traveler" | "TourOperator" | "Administrator" = "Traveler") {
  mocks.cookies.mockResolvedValue({ get: () => ({ value: "refresh" }) });
  mocks.fetchBackend.mockResolvedValueOnce(
    new Response(JSON.stringify({ data: { role, accessToken: "access-token" } }), {
      status: 200,
    }),
  );
}

function problem(status: number, errorCode?: string) {
  return new Response(JSON.stringify(errorCode ? { status, errorCode } : { status }), {
    status,
  });
}

const proposal = {
  complaintId: 501,
  bookingId: 301,
  bookingCode: "BK-UC75",
  proposedAmount: 500000,
  responseDeadlineUtc: "2026-11-09T03:00:00Z",
  status: "AwaitingTravelerResponse",
  canRespond: true,
};

beforeEach(() => {
  mocks.cookies.mockReset();
  mocks.fetchBackend.mockReset();
});

describe("proxyGetPartialRefundProposal", () => {
  it("rejects a malformed complaint id without calling the backend", async () => {
    const response = await proxyGetPartialRefundProposal(getRequest(), "abc");

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ errorCode: "complaint.not_found" });
    expect(mocks.fetchBackend).not.toHaveBeenCalled();
  });

  it("returns 401 without a browser session", async () => {
    mocks.cookies.mockResolvedValue({ get: () => undefined });

    const response = await proxyGetPartialRefundProposal(getRequest(), "501");

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ errorCode: "UNAUTHENTICATED" });
  });

  it("forwards the traveler token and returns the proposal", async () => {
    signedIn();
    mocks.fetchBackend.mockResolvedValueOnce(
      new Response(JSON.stringify(proposal), { status: 200 }),
    );

    const response = await proxyGetPartialRefundProposal(getRequest(), "501");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(proposal);
    expect(mocks.fetchBackend).toHaveBeenLastCalledWith(
      "/api/v1/traveler/complaints/501/partial-refund-proposal",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ Authorization: "Bearer access-token" }),
      }),
    );
  });

  it("maps a role-only 403 to the MSG126 code", async () => {
    signedIn("TourOperator");
    mocks.fetchBackend.mockResolvedValueOnce(new Response("", { status: 403 }));

    const response = await proxyGetPartialRefundProposal(getRequest(), "501");

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      errorCode: "complaint.partial_refund.forbidden",
    });
  });

  it("preserves the not-found code", async () => {
    signedIn();
    mocks.fetchBackend.mockResolvedValueOnce(problem(404, "complaint.not_found"));

    const response = await proxyGetPartialRefundProposal(getRequest(), "501");

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ errorCode: "complaint.not_found" });
  });

  it("maps backend failures to a retryable 503", async () => {
    signedIn();
    mocks.fetchBackend.mockResolvedValueOnce(problem(500));

    const response = await proxyGetPartialRefundProposal(getRequest(), "501");

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      errorCode: "PARTIAL_REFUND_UNAVAILABLE",
    });
  });
});

describe("proxyRespondToPartialRefundProposal", () => {
  it.each([
    [{ decision: "Counter" }, "INVALID_DECISION"],
    [{ decision: 1 }, "INVALID_DECISION"],
    [{}, "INVALID_DECISION"],
    [{ decision: "CounterOffer" }, "complaint.partial_refund.reason_required"],
    [{ decision: "CounterOffer", reason: "Need more" }, "complaint.partial_refund.counter_amount_invalid"],
  ])(
    "rejects %j without calling the backend",
    async (body, errorCode) => {
      const response = await proxyRespondToPartialRefundProposal(postRequest(body), "501");

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ errorCode });
      expect(mocks.fetchBackend).not.toHaveBeenCalled();
    },
  );

  it("sends only the decision and returns the recorded outcome", async () => {
    signedIn();
    const outcome = {
      complaintId: 501,
      status: "Approved",
      approvedAmount: 500000,
      respondedAtUtc: "2026-11-07T03:00:00Z",
    };
    mocks.fetchBackend.mockResolvedValueOnce(
      new Response(JSON.stringify(outcome), { status: 200 }),
    );

    const response = await proxyRespondToPartialRefundProposal(
      postRequest({ decision: "Accept", amount: 1 }),
      "501",
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(outcome);
    const [path, init] = mocks.fetchBackend.mock.calls.at(-1)!;
    expect(path).toBe("/api/v1/traveler/complaints/501/partial-refund-proposal/response");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ decision: "Accept" });
  });

  it("forwards a counter-offer with its reason and requested amount", async () => {
    signedIn();
    const outcome = {
      complaintId: 501,
      status: "AwaitingOperatorReconsideration",
      approvedAmount: null,
      counterOfferAmount: 10000,
      respondedAtUtc: "2026-11-07T03:00:00Z",
    };
    mocks.fetchBackend.mockResolvedValueOnce(new Response(JSON.stringify(outcome), { status: 200 }));

    const response = await proxyRespondToPartialRefundProposal(
      postRequest({ decision: "CounterOffer", reason: "The offer does not cover the missing service.", requestedAmount: 10000 }),
      "501",
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(outcome);
    const [, init] = mocks.fetchBackend.mock.calls.at(-1)!;
    expect(JSON.parse(init.body)).toEqual({
      decision: "CounterOffer",
      reason: "The offer does not cover the missing service.",
      requestedAmount: 10000,
    });
  });

  it("preserves the MSG165 conflict code", async () => {
    signedIn();
    mocks.fetchBackend.mockResolvedValueOnce(
      problem(409, "complaint.partial_refund.response_closed"),
    );

    const response = await proxyRespondToPartialRefundProposal(
      postRequest({ decision: "Decline", reason: "The final offer is not adequate." }),
      "501",
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      errorCode: "complaint.partial_refund.response_closed",
    });
  });

  it("maps a network failure to a retryable 503", async () => {
    signedIn();
    mocks.fetchBackend.mockRejectedValueOnce(new Error("offline"));

    const response = await proxyRespondToPartialRefundProposal(
      postRequest({ decision: "Decline", reason: "The final offer is not adequate." }),
      "501",
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      errorCode: "PARTIAL_REFUND_UNAVAILABLE",
    });
  });
});
