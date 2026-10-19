'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWebSession } from '@/features/auth/session/useWebSession';
import { PartnerWorkspaceNav } from '@/features/operator/common/PartnerWorkspaceNav';
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

  return (
    <div className="flex min-h-screen bg-[#F3F6F7] text-[#00152A]" lang="vi">
      {/* Workspace Sidebar / Mobile Drawer Navigation */}
      <PartnerWorkspaceNav
        activeTab="profile"
        operatorName={profile?.businessName || context?.fullName}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Workspace Top Bar (Screen #76 tbar) */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3.5 shadow-2xs sm:px-8">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-[#E6F4F1] px-1.5 py-0.5 text-[10px] font-bold text-[#006B5F] uppercase">
                  UC-34
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  Tour Operator Workspace
                </span>
              </div>
              <h1 className="mt-0.5 text-lg font-black text-[#00152A] sm:text-xl">
                Hồ sơ doanh nghiệp
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-600" />
              Đang hoạt động (Approved)
            </span>

            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#006B5F] to-[#00152A] text-xs font-black text-white shadow-2xs"
              title={profile?.businessName || context?.fullName}
            >
              {profile?.businessName
                ? profile.businessName.slice(0, 2).toUpperCase()
                : 'TO'}
            </div>
          </div>
        </header>

        {/* Workspace Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
          {loading || authStatus === 'restoring' ? (
            <div
              role="status"
              aria-label="Đang tải dữ liệu hồ sơ"
              className="flex h-64 items-center justify-center"
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
        </main>
      </div>
    </div>
  );
}
