'use client';

import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export interface PageHeaderProps {
  title: string;
  description?: string;
  actionSlot?: ReactNode;
  badge?: ReactNode;
  backHref?: string;
  onBack?: () => void;
  className?: string;
}

export function PageHeader({
  title,
  description,
  actionSlot,
  badge,
  backHref,
  onBack,
  className = '',
}: PageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  const showBackButton = Boolean(onBack || backHref);

  return (
    <div className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3 min-w-0">
          {showBackButton && (
            <button
              type="button"
              onClick={handleBack}
              aria-label="Quay lại"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#006B5F]"
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                arrow_back
              </span>
            </button>
          )}
          <div className="flex flex-wrap items-center gap-2.5 min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-[#00152A] sm:text-2xl break-words min-w-0">
              {title}
            </h1>
            {badge && <div className="shrink-0">{badge}</div>}
          </div>
        </div>
        {description && (
          <p className="mt-1 text-xs text-slate-500 sm:text-sm break-words">
            {description}
          </p>
        )}
      </div>

      {actionSlot && (
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto sm:shrink-0">
          {actionSlot}
        </div>
      )}
    </div>
  );
}
