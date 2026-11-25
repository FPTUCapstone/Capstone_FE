'use client';

import type { ReactNode } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { publicSearchCopy, type SearchLocale } from '../resources/publicSearch';

interface TourEditorialHeroProps {
  onExploreClick?: () => void;
  locale?: SearchLocale;
  actionsSlot?: ReactNode;
}

export function TourEditorialHero({
  onExploreClick,
  locale = 'vi',
  actionsSlot,
}: TourEditorialHeroProps) {
  const copy = publicSearchCopy(locale).hero;
  function handleScrollDown() {
    if (onExploreClick) {
      onExploreClick();
      return;
    }
    const target = document.getElementById('tours-discovery-workspace');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  }

  const showScrollAction = Boolean(onExploreClick || !actionsSlot);

  return (
    <section aria-label={copy.label}>
      <PageHeader
        breadcrumbs={[
          { label: locale === 'vi' ? 'Trang chủ' : 'Home', href: '/' },
          { label: locale === 'vi' ? 'Khám phá tour' : 'Explore tours' },
        ]}
        breadcrumbAriaLabel={locale === 'vi' ? 'Đường dẫn điều hướng' : 'Breadcrumb'}
        title={
          <>
            {copy.title} <span className="text-[#174B4A]">{copy.emphasis}</span>
          </>
        }
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#CBE0D4] bg-[#E8F0EA] px-2.5 py-0.5 text-xs font-bold text-[#103B39]">
            <span className="material-symbols-outlined text-[14px]" aria-hidden="true">explore</span>
            <span>{copy.badge}</span>
          </span>
        }
        description={copy.description}
        actions={
          <>
            {actionsSlot}
            {showScrollAction ? (
              <button
                type="button"
                onClick={handleScrollDown}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#103B39] px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#174B4A]"
              >
                <span>{copy.action}</span>
                <span className="material-symbols-outlined text-sm" aria-hidden="true">arrow_downward</span>
              </button>
            ) : null}
          </>
        }
      />
    </section>
  );
}
