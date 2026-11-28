import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { DirectRefundDisputeDetailScreen } from "@/features/refunds/admin-disputes/DirectRefundDisputeDetailScreen";
import { ROUTES } from "@/lib/routes";
import { verifyAdminSessionFromCookies } from "@/lib/server/adminSession";

export const metadata: Metadata = {
  title: "Dispute Detail | TripMate Admin Console",
};

export default async function DirectRefundDisputeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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

  const { id } = await params;
  return <DirectRefundDisputeDetailScreen caseId={id} />;
}
