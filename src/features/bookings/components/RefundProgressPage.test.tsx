import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RefundProgressPage } from "./RefundProgressPage";

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

vi.mock("@/components/navigation/PublicNavigation", () => ({
  PublicNavigation: () => <nav data-testid="public-navigation" />,
}));

describe("RefundProgressPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useWebSession.mockReturnValue({ status: "authenticated" });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads and renders the backend refund progress", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          bookingId: 42,
          bookingCode: "BK-20261022-00042",
          refundAmount: 500000,
          status: "RetryPending",
          attemptCount: 1,
          requestedAtUtc: "2026-10-22T01:00:00Z",
          nextAttemptAtUtc: "2026-10-22T02:00:00Z",
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<RefundProgressPage bookingId="42" />);

    await waitFor(() =>
      expect(screen.getByText("Retry scheduled")).toBeDefined(),
    );
    expect(screen.getByText("BK-20261022-00042")).toBeDefined();
    expect(screen.getByText(/500[.,]000/)).toBeDefined();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/bookings/42/refund",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("explains when the booking has no refund record", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("{}", { status: 404 })),
    );

    render(<RefundProgressPage bookingId="42" />);

    expect(
      await screen.findByText("No refund record was found for this booking."),
    ).toBeDefined();
  });

  it("returns to sign-in when the BFF reports an expired session", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("{}", { status: 401 })),
    );

    render(<RefundProgressPage bookingId="42" />);

    await waitFor(() =>
      expect(mocks.replace).toHaveBeenCalledWith(
        "/sign-in?returnUrl=%2Fbookings%2F42%2Frefund",
      ),
    );
    expect(
      screen.queryByText("Could not load refund progress. Please try again."),
    ).toBeNull();
  });
});
