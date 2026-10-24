'use client';

import Link from 'next/link';
import * as nextNav from 'next/navigation';
import type { AdministrationRole } from '@/features/auth/session/authSession';
import { ROUTES } from '@/lib/routes';

interface AdminBreadcrumbsProps {
  role?: AdministrationRole;
  className?: string;
}

const ROUTE_LABELS: Record<string, string> = {
  admin: 'Administration',
  staff: 'Staff Operations',
  'tour-operator-applications': 'Tour Operator Applications',
  tours: 'Tours',
  reviews: 'Moderation Queue',
  payouts: 'Payout Records',
  settlement: 'Settlement',
  catalogue: 'Catalogue',
  'points-of-interest': 'Points of Interest',
  new: 'Create',
  routes: 'Routes & Network',
  create: 'Create Route',
  trips: 'Trips',
  active: 'Active Trips',
  users: 'User Accounts',
  'landing-content': 'Landing Content',
  settings: 'Settings',
  'algorithm-parameters': 'Algorithm Configuration',
  'audit-logs': 'Audit Logs',
  reports: 'Statistical Reports',
  account: 'Account',
  security: 'Security Settings',
};

function useSafePathname(): string {
  try {
    if (typeof nextNav.usePathname === 'function') {
      return nextNav.usePathname() || '/admin';
    }
  } catch {
    // outside router or incomplete mock
  }
  return '/admin';
}

export function AdminBreadcrumbs({ role = 'Administrator', className = '' }: AdminBreadcrumbsProps) {
  const pathname = useSafePathname();
  const segments = pathname.split('/').filter(Boolean);

  const homeHref = role === 'Staff' ? ROUTES.admin.staffDashboard : ROUTES.admin.dashboard;
  const homeLabel = role === 'Staff' ? 'Staff Workspace' : 'Admin Workspace';

  const crumbs = [];
  let currentPath = '';

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    currentPath += `/${segment}`;

    if (segment === 'admin') {
      crumbs.push({
        href: homeHref,
        label: homeLabel,
        isCurrent: i === segments.length - 1 || (segments.length === 2 && segments[1] === 'staff'),
      });
      continue;
    }

    if (segment === 'staff' && crumbs.length > 0) {
      continue;
    }

    const label = ROUTE_LABELS[segment] || (segment.length > 10 ? `${segment.slice(0, 8)}…` : segment);
    const isCurrent = i === segments.length - 1;

    crumbs.push({
      href: currentPath,
      label,
      isCurrent,
    });
  }

  if (crumbs.length <= 1) {
    return (
      <nav aria-label="Breadcrumb" className={`flex items-center text-xs text-[#4A5851] ${className}`}>
        <span className="font-semibold text-[#1C2923]">{homeLabel}</span>
      </nav>
    );
  }

  return (
    <nav aria-label="Breadcrumb" className={`flex items-center text-xs text-[#4A5851] ${className}`}>
      <ol className="flex items-center gap-1.5 flex-wrap">
        {crumbs.map((crumb, idx) => (
          <li key={crumb.href + idx} className="inline-flex items-center gap-1.5">
            {idx > 0 && (
              <span className="material-symbols-outlined text-[12px] text-[#74827B]" aria-hidden="true">
                chevron_right
              </span>
            )}
            {crumb.isCurrent ? (
              <span
                className="font-semibold text-[#1C2923]"
                aria-current="page"
              >
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="text-[#4A5851] hover:text-[#245747] transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
