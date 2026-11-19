import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PartialRefundProposalPage } from "./PartialRefundProposalPage";
import { partialRefundMessages } from "../resources/partialRefundMessages";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  useWebSession: vi.fn(),
  router: {} as { replace: ReturnType<typeof vi.fn> },
}));

mocks.router.replace = mocks.replace;

vi.mock("next/navigation", () => ({
  useRouter: () => mocks.router,
}));

vi.mock("@/features/auth/session/useWebSession", () => ({
  useWebSession: mocks.useWebSession,
}));

const GET_URL = "/api/v1/traveler/complaints/501/partial-refund-proposal";
const POST_URL = `${GET_URL}/response`;

const openProposal = {
  complaintId: 501,
  bookingId: 301,
  bookingCode: "BK-UC75",
  proposedAmount: 500000,
  responseDeadlineUtc: "2026-11-09T03:00:00Z",
  status: "AwaitingTravelerResponse",
  canRespond: true,
  canCounterOffer: true,
  refundableAmount: 500000,
};

const finalProposal = {
  ...openProposal,
  round: 2,
  canCounterOffer: false,
  canDeclineFinally: true,
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

function stubFetch(...responses: Response[]) {
  const fetchMock = vi.fn();
  for (const response of responses) fetchMock.mockResolvedValueOnce(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function renderLoaded() {
  render(<PartialRefundProposalPage complaintId="501" />);
  await waitFor(() => expect(screen.getByText("BK-UC75")).toBeDefined());
}

function postedDecision(fetchMock: ReturnType<typeof vi.fn>) {
  const call = fetchMock.mock.calls.find(([url]) => url === POST_URL);
  return call ? JSON.parse(call[1].body).decision : undefined;
}

describe("PartialRefundProposalPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useWebSession.mockReturnValue({ status: "authenticated" });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the proposed amount and the response deadline in Vietnam time", async () => {
    const fetchMock = stubFetch(jsonResponse(openProposal));

    await renderLoaded();

    expect(screen.getAllByText(/500[.,]000/).length).toBeGreaterThan(0);
    // 03:00 UTC is 10:00 in Asia/Ho_Chi_Minh.
    expect(screen.getByText(/9 Nov 2026.*10:00/)).toBeDefined();
    expect(screen.getByRole("button", { name: "Accept" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Send counter-offer" })).toBeDefined();
    expect(fetchMock).toHaveBeenCalledWith(
      GET_URL,
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("accepts after confirmation and shows MSG164", async () => {
    const fetchMock = stubFetch(
      jsonResponse(openProposal),
      jsonResponse({
        complaintId: 501,
        status: "Approved",
        approvedAmount: 500000,
        respondedAtUtc: "2026-11-07T03:00:00Z",
      }),
    );
    await renderLoaded();

    fireEvent.click(screen.getByRole("button", { name: "Accept" }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Confirm accept" }));

    await waitFor(() =>
      expect(screen.getByText(partialRefundMessages.MSG164)).toBeDefined(),
    );
    expect(postedDecision(fetchMock)).toBe("Accept");
    expect(screen.getByText("Accepted")).toBeDefined();
    expect(screen.queryByRole("button", { name: "Accept" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Send counter-offer" })).toBeNull();
  });

  it("sends one counter-offer with the requested amount and reason", async () => {
    const fetchMock = stubFetch(
      jsonResponse(openProposal),
      jsonResponse({ complaintId: 501, status: "AwaitingOperatorReconsideration" }),
    );
    await renderLoaded();

    fireEvent.change(screen.getByLabelText(/Requested refund amount/i), { target: { value: "450000" } });
    fireEvent.change(screen.getByLabelText("Why is this offer inadequate?"), { target: { value: "The missed itinerary items warrant a higher refund." } });
    fireEvent.click(screen.getByRole("button", { name: "Send counter-offer" }));

    await waitFor(() => expect(screen.getByText(partialRefundMessages.MSG164)).toBeDefined());
    const call = fetchMock.mock.calls.find(([url]) => url === POST_URL);
    expect(call).toBeDefined();
    expect(JSON.parse(call![1].body)).toEqual({
      decision: "CounterOffer",
      reason: "The missed itinerary items warrant a higher refund.",
      requestedAmount: 450000,
    });
    expect(screen.getByText("Closed")).toBeDefined();
  });

  it("records nothing when the traveler backs out of the acceptance confirmation", async () => {
    const fetchMock = stubFetch(jsonResponse(openProposal));
    await renderLoaded();

    fireEvent.click(screen.getByRole("button", { name: "Accept" }));
    fireEvent.click(screen.getByRole("button", { name: "Go back" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(postedDecision(fetchMock)).toBeUndefined();
  });

  it("moves focus into the dialog, closes it with Escape and returns focus", async () => {
    const fetchMock = stubFetch(jsonResponse(openProposal));
    await renderLoaded();
    const accept = screen.getByRole("button", { name: "Accept" });
    accept.focus();

    fireEvent.click(accept);

    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Go back" }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Accept" }));
    expect(postedDecision(fetchMock)).toBeUndefined();
  });

  it("keeps Tab inside the dialog", async () => {
    stubFetch(jsonResponse(openProposal));
    await renderLoaded();
    fireEvent.click(screen.getByRole("button", { name: "Accept" }));
    const confirm = screen.getByRole("button", { name: "Confirm accept" });
    confirm.focus();

    fireEvent.keyDown(document, { key: "Tab" });

    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Go back" }));
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(confirm);
  });

  it("ignores Escape while the answer is being sent", async () => {
    let finish: (value: Response) => void = () => {};
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(openProposal))
      .mockReturnValueOnce(new Promise<Response>((resolve) => { finish = resolve; }));
    vi.stubGlobal("fetch", fetchMock);
    await renderLoaded();
    fireEvent.click(screen.getByRole("button", { name: "Accept" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm accept" }));

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.getByRole("dialog")).toBeDefined();
    finish(jsonResponse({ complaintId: 501, status: "Approved", approvedAmount: 500000, respondedAtUtc: "2026-11-07T03:00:00Z" }));
    await waitFor(() => expect(screen.getByText(partialRefundMessages.MSG164)).toBeDefined());
  });

  it("declines the final proposal with a required reason and shows the declined outcome", async () => {
    const fetchMock = stubFetch(
      jsonResponse(finalProposal),
      jsonResponse({
        complaintId: 501,
        status: "Declined",
        approvedAmount: null,
        respondedAtUtc: "2026-11-07T03:00:00Z",
      }),
    );
    await renderLoaded();

    fireEvent.change(screen.getByLabelText("Reason for final decline"), { target: { value: "The revised offer is still inadequate." } });
    fireEvent.click(screen.getByRole("button", { name: "Decline final offer" }));

    await waitFor(() =>
      expect(screen.getByText(partialRefundMessages.MSG164)).toBeDefined(),
    );
    expect(postedDecision(fetchMock)).toBe("Decline");
    expect(screen.getByText("Declined")).toBeDefined();
  });

  it("shows MSG165 and hides the buttons when the window has already closed", async () => {
    stubFetch(jsonResponse({ ...openProposal, canRespond: false }));

    await renderLoaded();

    expect(screen.getByText(partialRefundMessages.MSG165)).toBeDefined();
    expect(screen.queryByRole("button", { name: "Accept" })).toBeNull();
  });

  it("shows MSG165 and reloads the proposal when the answer arrives too late", async () => {
    const fetchMock = stubFetch(
      jsonResponse(openProposal),
      jsonResponse({ errorCode: "complaint.partial_refund.response_closed" }, 409),
      jsonResponse({ ...openProposal, status: "Declined", canRespond: false }),
    );
    await renderLoaded();

    fireEvent.click(screen.getByRole("button", { name: "Accept" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm accept" }));

    await waitFor(() => expect(screen.getByText("Declined")).toBeDefined());
    expect(screen.getByText(partialRefundMessages.MSG165)).toBeDefined();
    expect(screen.queryByRole("button", { name: "Accept" })).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("keeps the proposal open and shows MSG127 when recording fails", async () => {
    stubFetch(
      jsonResponse(finalProposal),
      jsonResponse({ errorCode: "PARTIAL_REFUND_UNAVAILABLE" }, 503),
    );
    await renderLoaded();

    fireEvent.change(screen.getByLabelText("Reason for final decline"), { target: { value: "The revised offer is still inadequate." } });
    fireEvent.click(screen.getByRole("button", { name: "Decline final offer" }));

    await waitFor(() =>
      expect(screen.getByText(partialRefundMessages.MSG127)).toBeDefined(),
    );
    expect(screen.getByRole("button", { name: "Decline final offer" })).toBeDefined();
    expect(screen.getByText("Awaiting your response")).toBeDefined();
  });

  it("shows MSG126 when the booking belongs to another traveler", async () => {
    stubFetch(
      jsonResponse({ errorCode: "complaint.partial_refund.forbidden" }, 403),
    );

    render(<PartialRefundProposalPage complaintId="501" />);

    await waitFor(() =>
      expect(screen.getByText(partialRefundMessages.MSG126)).toBeDefined(),
    );
    expect(screen.queryByRole("button", { name: "Accept" })).toBeNull();
  });

  it("explains when no proposal exists for the complaint", async () => {
    stubFetch(jsonResponse({ errorCode: "complaint.not_found" }, 404));

    render(<PartialRefundProposalPage complaintId="501" />);

    await waitFor(() =>
      expect(screen.getByText(partialRefundMessages.notFound)).toBeDefined(),
    );
  });

  it("starts fresh when the page moves to another complaint", async () => {
    const fetchMock = stubFetch(
      jsonResponse(openProposal),
      jsonResponse({
        complaintId: 501,
        status: "Approved",
        approvedAmount: 500000,
        respondedAtUtc: "2026-11-07T03:00:00Z",
      }),
      jsonResponse({ ...openProposal, complaintId: 502, bookingCode: "BK-OTHER" }),
    );
    const { rerender } = render(<PartialRefundProposalPage complaintId="501" />);
    await waitFor(() => expect(screen.getByText("BK-UC75")).toBeDefined());
    fireEvent.click(screen.getByRole("button", { name: "Accept" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm accept" }));
    await waitFor(() =>
      expect(screen.getByText(partialRefundMessages.MSG164)).toBeDefined(),
    );

    rerender(<PartialRefundProposalPage complaintId="502" />);

    await waitFor(() => expect(screen.getByText("BK-OTHER")).toBeDefined());
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/v1/traveler/complaints/502/partial-refund-proposal",
      expect.anything(),
    );
    expect(screen.queryByText(partialRefundMessages.MSG164)).toBeNull();
    expect(screen.getByRole("button", { name: "Accept" })).toBeDefined();
  });

  it("sends signed-out visitors to sign-in and back", async () => {
    mocks.useWebSession.mockReturnValue({ status: "unauthenticated" });
    const fetchMock = stubFetch();

    render(<PartialRefundProposalPage complaintId="501" />);

    await waitFor(() =>
      expect(mocks.replace).toHaveBeenCalledWith(
        `/sign-in?returnUrl=${encodeURIComponent("/account/complaints/501/partial-refund-proposal")}`,
      ),
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
