import { RefundProgressPage } from "@/features/bookings/components/RefundProgressPage";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RefundProgressPage bookingId={id} />;
}
