import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ROUTES } from "@/lib/routes";
import { verifyAdminSessionFromCookies } from "@/lib/server/adminSession";

export const metadata: Metadata = {
  title: "Commission Statement Detail | TripMate Admin Console",
};

// Admin detail is read-only — render inline to keep it lean.
export default async function AdminCommissionStatementDetailPage({
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

  const { id } = await params;

  // Lazy import to keep server component; detail is read-only so no mutations here.
  const { AdminCommissionStatementDetail } = await import(
    "@/features/commission/admin/AdminCommissionStatementDetail"
  );
  return <AdminCommissionStatementDetail statementId={id} />;
}
