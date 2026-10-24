'use client';

import { useCallback, useEffect } from 'react';

export type DashboardTab = 'overview' | 'analytics';

interface DashboardMainTabsProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  overviewLabel?: string;
  analyticsLabel?: string;
  badgeLabel?: string;
}

export function DashboardMainTabs({
  activeTab,
  onTabChange,
  overviewLabel = 'Overview',
  analyticsLabel = 'Analytics',
  badgeLabel = 'New',
}: DashboardMainTabsProps) {
  // Listen to popstate (browser back/forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const tab =
          params.get('tab') === 'analytics' || params.get('analytics') === '1'
            ? 'analytics'
            : 'overview';
        onTabChange(tab);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [onTabChange]);

  const handleSelectTab = useCallback(
    (tab: DashboardTab) => {
      onTabChange(tab);

      // Deep link without full page reload
      if (typeof window !== 'undefined') {
        try {
          const url = new URL(window.location.href);
          if (tab === 'analytics') {
            url.searchParams.set('tab', 'analytics');
          } else {
            url.searchParams.delete('tab');
            url.searchParams.delete('analytics');
            url.searchParams.delete('preview');
          }
          window.history.pushState(null, '', url.toString());
        } catch {
          // Ignore in environments where window.location is mock
        }
      }
    },
    [onTabChange],
  );

  return (
    <div className="mb-6 flex items-center justify-between border-b border-[#E6E4DD] pb-3">
      <div
        role="tablist"
        aria-label="Dashboard views"
        className="inline-flex rounded-2xl bg-[#EFECE6] p-1.5 border border-[#DCD8CF]"
      >
        <button
          type="button"
          role="tab"
          id="tab-overview"
          aria-selected={activeTab === 'overview'}
          aria-controls="panel-overview"
          tabIndex={activeTab === 'overview' ? 0 : -1}
          onClick={() => handleSelectTab('overview')}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-[#FFFFFF] text-[#1C2923] shadow-xs'
              : 'text-[#4A5851] hover:text-[#1C2923] hover:bg-[#FFFFFF]/50'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
            dashboard
          </span>
          <span>{overviewLabel}</span>
        </button>

        <button
          type="button"
          role="tab"
          id="tab-analytics"
          aria-selected={activeTab === 'analytics'}
          aria-controls="panel-analytics"
          tabIndex={activeTab === 'analytics' ? 0 : -1}
          onClick={() => handleSelectTab('analytics')}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-[#245747] text-white shadow-xs'
              : 'text-[#4A5851] hover:text-[#1C2923] hover:bg-[#FFFFFF]/50'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
            monitoring
          </span>
          <span>{analyticsLabel}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              activeTab === 'analytics'
                ? 'bg-[#1C2923] text-[#A3D2BA]'
                : 'bg-[#DFDBD1] text-[#245747]'
            }`}
          >
            {badgeLabel}
          </span>
        </button>
      </div>
    </div>
  );
}
