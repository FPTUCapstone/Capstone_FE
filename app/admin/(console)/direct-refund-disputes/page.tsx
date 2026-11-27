import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { DirectRefundDisputesScreen } from "@/features/refunds/admin-disputes/DirectRefundDisputesScreen";
import { ROUTES } from "@/lib/routes";
import { verifyAdminSessionFromCookies } from "@/lib/server/adminSession";

export const metadata: Metadata = {
  title: "Direct Refund Disputes | TripMate Admin Console",
};

export default async function DirectRefundDisputesPage() {
  let session: ReturnType<typeof verifyAdminSessionFromCookies> = null;
  try {
    session = verifyAdminSessionFromCookies(await cookies());
  } catch {
    session = null;
  }
  if (!session) redirect(ROUTES.admin.login);
  if (session.role !== "Administrator") {
    redirect(ROUTES.admin.dashboard);
  }

  return <DirectRefundDisputesScreen />;
}
