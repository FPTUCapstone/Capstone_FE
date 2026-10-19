import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { isValidTripId } from '@/features/admin/active-trip-details/activeTripDetails';
import { ActiveTripDetailsScreen } from '@/features/admin/active-trip-details/ActiveTripDetailsScreen';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: isValidTripId(id) ? `Active Trip TRIP-${id}` : 'Active Trip Not Found' };
}

export default async function ActiveTripDetailsPage({ params }: PageProps) {
  const { id } = await params;
  if (!isValidTripId(id)) notFound();
  return <ActiveTripDetailsScreen tripId={id} />;
}
