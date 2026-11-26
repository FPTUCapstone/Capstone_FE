import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { verifyAdminSessionFromCookies } from '@/lib/server/adminSession';
import { AccountProvisioningForm } from '@/features/hotel-service-provider/components/AccountProvisioningForm';
import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';

export default async function CreateAccountPage() {
  const session = verifyAdminSessionFromCookies(await cookies());
  if (!session) redirect('/admin/login');
  if (session.role !== 'Staff') return <AdminAccessDeniedView />;
  if (session.mustChangePassword) redirect('/admin/first-password');
  return (
    <div className="space-y-4">
      <div className="mx-auto max-w-6xl px-6 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#C2D6CC] bg-[#E8F0EA]/70 px-4 py-3 text-sm">
          <div className="flex items-center gap-2.5 text-[#1C2928]">
            <span className="material-symbols-outlined text-[20px] text-[#174B4A]" aria-hidden="true">
              verified_user
            </span>
            <span>
              Quản lý hồ sơ đại diện khách sạn gửi yêu cầu xác minh quyền quản lý cơ sở lưu trú.
            </span>
          </div>
          <Link
            href="/admin/stay-ownership-claims"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#174B4A] px-3.5 py-2 text-xs font-bold text-white transition hover:bg-[#103B39]"
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
              hotel
            </span>
            Duyệt quyền quản lý khách sạn
          </Link>
        </div>
      </div>
      <AccountProvisioningForm kind="provider" />
    </div>
  );
}
