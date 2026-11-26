'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes';
import { useSearchParams } from 'next/navigation';
import { useWebSession } from '@/features/auth/session/useWebSession';
import { PartnerWorkspaceLayout } from '@/features/operator/common/components/PartnerWorkspaceLayout';
import { PageContentContainer } from '@/features/operator/common/components/PageContentContainer';
import { PageHeader } from '@/features/operator/common/components/PageHeader';
import { getOperatorProfile } from '../services/operatorProfileService';
import { OPERATOR_PROFILE_MESSAGES, type OperatorProfileDto } from '../types/operatorProfile';
import { OperatorProfileView } from './OperatorProfileView';

export function OperatorProfilePage() {
  const searchParams = useSearchParams();
  const demoParam = searchParams.get('demo');
  const isDemoRequested = demoParam === '1' || demoParam === 'true';

  const { status: authStatus, context } = useWebSession();
  const [profile, setProfile] = useState<OperatorProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    if (!isDemoRequested && authStatus === 'restoring') {
      return;
    }

    let isMounted = true;

    async function loadProfile() {
      setLoading(true);
      setLoadError(null);
      try {
        const result = await getOperatorProfile({
          allowDemo: isDemoRequested,
          accountEmail: context?.email,
        });

        if (!isMounted) return;
        if (result.profile) {
          setProfile(result.profile);
        }
        setIsDemo(Boolean(result.isDemo));
      } catch (err) {
        if (!isMounted) return;
        setProfile(null);
        setLoadError(
          err instanceof Error ? err.message : OPERATOR_PROFILE_MESSAGES.SYSTEM_FAILURE
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [isDemoRequested, authStatus, context?.email, reloadTick]);

  const operatorName = profile?.businessName || context?.fullName;

  return (
    <PartnerWorkspaceLayout
      activeTab="profile"
      isDemo={isDemo}
      operatorName={operatorName}
    >
      <PageContentContainer>
        <PageHeader
          title="Hồ sơ doanh nghiệp"
          description="Quản lý và cập nhật thông tin hiển thị của doanh nghiệp đối tác lữ hành."
          badge={
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-600" />
              Đang hoạt động (Approved)
            </span>
          }
        />

        {context?.currentContractId && (
          <Link
            href={ROUTES.partner.contract}
            className="mb-5 inline-flex min-h-11 items-center rounded-xl border border-brand-border bg-white px-4 text-sm font-semibold text-primary"
          >
            Xem hợp đồng đối tác
          </Link>
        )}

        {loading || (!isDemoRequested && authStatus === 'restoring') ? (
          <div
            role="status"
            aria-label="Đang tải dữ liệu hồ sơ"
            className="flex h-64 items-center justify-center rounded-2xl bg-white border border-slate-200 p-8 shadow-xs"
          >
            <div className="flex flex-col items-center gap-3">
              <div
                className="h-8 w-8 animate-spin rounded-full border-3 border-[#174B4A] border-t-transparent"
                aria-hidden="true"
              />
              <p className="text-xs font-semibold text-slate-500">
                Đang tải thông tin hồ sơ doanh nghiệp…
              </p>
            </div>
          </div>
        ) : loadError ? (
          <div
            role="alert"
            className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-900 shadow-xs"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2.5">
                <span
                  className="material-symbols-outlined text-[22px] text-rose-600 shrink-0"
                  aria-hidden="true"
                >
                  error
                </span>
                <p className="font-semibold">{loadError}</p>
              </div>
              <button
                type="button"
                onClick={() => setReloadTick((prev) => prev + 1)}
                className="self-start sm:self-auto rounded-xl border border-rose-300 bg-white px-4 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
              >
                Thử lại
              </button>
            </div>
          </div>
        ) : profile ? (
          <OperatorProfileView
            initialProfile={profile}
            isDemo={isDemo}
            onProfileUpdated={(updated) => setProfile(updated)}
          />
        ) : null}
      </PageContentContainer>
    </PartnerWorkspaceLayout>
  );
}
