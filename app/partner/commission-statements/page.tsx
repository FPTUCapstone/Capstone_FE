import type { Metadata } from "next";

import { CommissionStatementsScreen } from "@/features/commission/operator/CommissionStatementsScreen";
import { PartnerRouteGuard } from "@/features/operator/access/PartnerRouteGuard";

export const metadata: Metadata = {
  title: "Commission Statements | Partner | TripMate",
};

export default function PartnerCommissionStatementsPage() {
  return (
    <PartnerRouteGuard route="dashboard">
      <CommissionStatementsScreen />
    </PartnerRouteGuard>
  );
}
