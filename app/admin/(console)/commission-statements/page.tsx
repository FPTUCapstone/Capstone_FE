import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AdminCommissionStatementsScreen } from "@/features/commission/admin/AdminCommissionStatementsScreen";
import { ROUTES } from "@/lib/routes";
import { verifyAdminSessionFromCookies } from "@/lib/server/adminSession";

export const metadata: Metadata = {
  title: "Commission Statements | TripMate Admin Console",
};

export default async function AdminCommissionStatementsPage() {
  let session: ReturnType<typeof verifyAdminSessionFromCookies> = null;
  try {
    session = verifyAdminSessionFromCookies(await cookies());
  } catch {
    session = null;
  }
  if (!session) redirect(ROUTES.admin.login);

  return <AdminCommissionStatementsScreen canIssue={session.role === "Administrator"} />;
}
