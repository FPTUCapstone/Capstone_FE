'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWebSession } from '@/features/auth/session/useWebSession';
import { PartnerWorkspaceLayout } from '@/features/operator/common/components/PartnerWorkspaceLayout';
import { PageContentContainer } from '@/features/operator/common/components/PageContentContainer';
import { PageHeader } from '@/features/operator/common/components/PageHeader';
import { getOperatorProfile } from '../services/operatorProfileService';
import type { OperatorProfileDto } from '../types/operatorProfile';
import { OperatorProfileView } from './OperatorProfileView';

export function OperatorProfilePage() {
  const searchParams = useSearchParams();
  const demoParam = searchParams.get('demo');
  const isDemoRequested = demoParam === '1' || demoParam === 'true';

  const { status: authStatus, context } = useWebSession();
  const [profile, setProfile] = useState<OperatorProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
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
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [isDemoRequested, context?.email]);

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

        {loading || authStatus === 'restoring' ? (
          <div
            role="status"
            aria-label="Đang tải dữ liệu hồ sơ"
            className="flex h-64 items-center justify-center rounded-2xl bg-white border border-slate-200 p-8 shadow-xs"
          >
            <div className="flex flex-col items-center gap-3">
              <div
                className="h-8 w-8 animate-spin rounded-full border-3 border-[#006B5F] border-t-transparent"
                aria-hidden="true"
              />
              <p className="text-xs font-semibold text-slate-500">
                Đang tải thông tin hồ sơ doanh nghiệp…
              </p>
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
