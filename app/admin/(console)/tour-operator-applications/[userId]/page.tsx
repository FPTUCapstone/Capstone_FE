import { use } from 'react';
import { TourOperatorApplicationDetailView } from '@/features/admin/tour-operator-applications/components/TourOperatorApplicationDetailView';
import { parseApplicationId } from '@/features/admin/tour-operator-applications/utils/applicationId';

interface PageProps {
  params: Promise<{
    userId: string;
  }>;
}

export default function TourOperatorApplicationDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const userIdNumber = parseApplicationId(resolvedParams.userId);

  if (userIdNumber === null) {
    return (
      <div className="mx-auto max-w-4xl p-8 text-center text-slate-400">
        <h2 className="text-xl font-bold text-rose-400 mb-2">Invalid Application ID</h2>
        <p className="text-sm">The provided application parameter is not a valid numeric user ID.</p>
      </div>
    );
  }

  return <TourOperatorApplicationDetailView userId={userIdNumber} />;
}
