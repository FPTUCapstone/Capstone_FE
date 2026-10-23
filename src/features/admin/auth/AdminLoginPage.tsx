import { AdminSignInForm } from '@/features/admin/auth/AdminSignInForm';
import { AuthShell } from '@/components/layout/AuthShell';
import { adminStaffEn } from '@/features/admin/staff/resources/en';
import { ROUTES } from '@/lib/routes';

interface AdminLoginPageProps {
  returnUrl?: string;
}

export function AdminLoginPage({ returnUrl }: AdminLoginPageProps) {
  return (
    <AuthShell
      admin
      backHref={ROUTES.home}
      backLabel={adminStaffEn.login.backLabel}
      eyebrow={adminStaffEn.login.eyebrow}
      title={adminStaffEn.login.title}
      description={adminStaffEn.login.description}
    >
      <AdminSignInForm returnUrl={returnUrl} />
    </AuthShell>
  );
}
