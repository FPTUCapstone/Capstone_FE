import { redirect } from 'next/navigation';
import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import { TourOperatorApplicationDetailView } from '@/features/admin/tour-operator-applications/components/TourOperatorApplicationDetailView';
import { tourOperatorApplicationEn } from '@/features/admin/tour-operator-applications/resources/en';
import { parseApplicationId } from '@/features/admin/tour-operator-applications/utils/applicationId';
import { ROUTES } from '@/lib/routes';
import { resolveWebSession } from '@/lib/server/webSession';

interface PageProps {
  params: Promise<{
    userId: string;
  }>;
}

export default async function TourOperatorApplicationDetailPage({ params }: PageProps) {
  const session = await resolveWebSession();

  if (!session) {
    return redirect(ROUTES.signIn);
  }

  if (session.role === 'Staff') {
    return <AdminAccessDeniedView />;
  }

  const resolvedParams = await params;
  const userIdNumber = parseApplicationId(resolvedParams.userId);

  if (userIdNumber === null) {
    return (
      <div className="mx-auto max-w-4xl p-8 text-center text-slate-400">
        <h2 className="text-xl font-bold text-rose-400 mb-2">{tourOperatorApplicationEn.invalidId.title}</h2>
        <p className="text-sm">{tourOperatorApplicationEn.invalidId.body}</p>
      </div>
    );
  }

  return <TourOperatorApplicationDetailView userId={userIdNumber} />;
}
