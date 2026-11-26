import Link from 'next/link';
import type { ReactNode } from 'react';

export interface PageHeaderBreadcrumb {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
  breadcrumbs?: PageHeaderBreadcrumb[];
  breadcrumbAriaLabel?: string;
  backLink?: {
    href: string;
    label: string;
  };
  as?: 'h1' | 'h2';
  titleId?: string;
  bordered?: boolean;
  className?: string;
}

export function PageHeader({
  title,
  description,
  eyebrow,
  badge,
  actions,
  breadcrumbs,
  breadcrumbAriaLabel = 'Đường dẫn điều hướng',
  backLink,
  as = 'h1',
  titleId,
  bordered = true,
  className = '',
}: PageHeaderProps) {
  const Heading = as;
  const hasTopRow = Boolean(backLink || (breadcrumbs && breadcrumbs.length > 0) || eyebrow);

  return (
    <header
      className={`${bordered ? 'border-b border-[#DCE2DD] pb-4' : ''} ${className}`.trim()}
    >
      {hasTopRow ? (
        <div className="mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          {backLink ? (
            <Link
              href={backLink.href}
              className="inline-flex items-center gap-1 font-semibold text-[#174B4A] transition hover:text-[#103B39] hover:underline"
            >
              <span aria-hidden="true">←</span>
              <span>{backLink.label}</span>
            </Link>
          ) : null}

          {breadcrumbs && breadcrumbs.length > 0 ? (
            <nav aria-label={breadcrumbAriaLabel} className="flex flex-wrap items-center gap-1.5 font-semibold text-[#5B6E69]">
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;
                return (
                  <span key={`${crumb.label}-${index}`} className="inline-flex items-center gap-1.5">
                    {index > 0 ? (
                      <span aria-hidden="true" className="text-[#94A59F]">
                        /
                      </span>
                    ) : null}
                    {crumb.href && !isLast ? (
                      <Link href={crumb.href} className="transition hover:text-[#174B4A]">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span aria-current={isLast ? 'page' : undefined} className={isLast ? 'text-[#1C2928]' : undefined}>
                        {crumb.label}
                      </span>
                    )}
                  </span>
                );
              })}
            </nav>
          ) : null}

          {eyebrow ? (
            <span className="inline-flex items-center gap-1.5 font-bold uppercase tracking-[0.14em] text-[#174B4A]">
              {eyebrow}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <Heading
              id={titleId}
              className="min-w-0 break-words text-xl font-black tracking-tight text-[#1C2928] sm:text-2xl"
            >
              {title}
            </Heading>
            {badge ? <div className="shrink-0">{badge}</div> : null}
          </div>
          {description ? (
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-[#5B6E69] sm:text-sm">
              {description}
            </p>
          ) : null}
        </div>

        {actions ? (
          <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}
