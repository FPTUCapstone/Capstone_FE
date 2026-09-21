import { use } from 'react';
import { TourOperatorApplicationDetailView } from '@/features/admin/tour-operator-applications/components/TourOperatorApplicationDetailView';

interface PageProps {
  params: Promise<{
    userId: string;
  }>;
}

export default function TourOperatorApplicationDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const userIdNumber = parseInt(resolvedParams.userId, 10);

  if (isNaN(userIdNumber) || userIdNumber <= 0) {
    return (
      <div className="mx-auto max-w-4xl p-8 text-center text-slate-400">
        <h2 className="text-xl font-bold text-rose-400 mb-2">Invalid Application ID</h2>
        <p className="text-sm">The provided application parameter is not a valid numeric user ID.</p>
      </div>
    );
  }

  return <TourOperatorApplicationDetailView userId={userIdNumber} />;
}
