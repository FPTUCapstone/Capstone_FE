import type { Metadata } from "next";

import { CommissionStatementDetailScreen } from "@/features/commission/operator/CommissionStatementDetailScreen";
import { PartnerRouteGuard } from "@/features/operator/access/PartnerRouteGuard";

export const metadata: Metadata = {
  title: "Commission Statement Detail | Partner | TripMate",
};

export default async function PartnerCommissionStatementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PartnerRouteGuard route="dashboard">
      <div className="p-6">
        <CommissionStatementDetailScreen statementId={id} />
      </div>
    </PartnerRouteGuard>
  );
}
