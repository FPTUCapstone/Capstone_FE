'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  OPERATOR_COUPON_DEFAULT_PAGE_SIZE,
  type CouponDto,
  type CouponStatus,
} from '../types/couponLifecycle';
import {
  OPERATOR_COUPON_ROUTES,
  buildCouponListUrl,
  withCouponDemoMode,
} from '../routes';
import { OperatorCouponStatusBadge } from './OperatorCouponStatusBadge';
import { couponEn } from '../resources/en';

interface OperatorCouponListViewProps {
  coupons: CouponDto[];
  isDemo?: boolean;
}

type FilterTab = 'ALL' | CouponStatus;

const VALID_STATUSES: FilterTab[] = ['ALL', 'Active', 'Scheduled', 'Inactive'];

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
}

function formatDiscountSummary(coupon: CouponDto): string {
  if (coupon.discountType === 'Percentage') {
    const maxPart = coupon.maxDiscountAmount
      ? ` (Max ${formatCurrency(coupon.maxDiscountAmount)})`
      : '';
    return `${coupon.discountValue}%${maxPart}`;
  }
  return formatCurrency(coupon.discountValue);
}

export function OperatorCouponListView({
  coupons,
  isDemo = false,
}: OperatorCouponListViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse initial query params (CR-01)
  const initialStatusParam = searchParams?.get('status') as FilterTab | null;
  const initialStatus: FilterTab =
    initialStatusParam && VALID_STATUSES.includes(initialStatusParam)
      ? initialStatusParam
      : 'ALL';

  const initialPageParam = parseInt(searchParams?.get('page') || '1', 10);
  const initialPage = Number.isFinite(initialPageParam) && initialPageParam > 0 ? initialPageParam : 1;

  const [activeTab, setActiveTab] = useState<FilterTab>(initialStatus);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);

  // Filter coupons by activeTab
  const filteredCoupons = useMemo(() => {
    if (activeTab === 'ALL') return coupons;
    return coupons.filter((c) => c.status === activeTab);
  }, [coupons, activeTab]);

  // Pagination calculation (CR-01: 20 per page)
  const totalItems = filteredCoupons.length;
  const pageSize = OPERATOR_COUPON_DEFAULT_PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedCoupons = useMemo(() => {
    const startIndex = (safePage - 1) * pageSize;
    return filteredCoupons.slice(startIndex, startIndex + pageSize);
  }, [filteredCoupons, safePage, pageSize]);

  const startIndexDisplay = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endIndexDisplay = Math.min(safePage * pageSize, totalItems);

  // Update URL on filter or page change (preserving demo=1)
  const updateUrl = (newPage: number, newStatus: FilterTab) => {
    const url = buildCouponListUrl({
      page: newPage,
      status: newStatus,
      isDemo,
    });
    router.replace(url, { scroll: false });
  };

  const handleTabChange = (tab: FilterTab) => {
    setActiveTab(tab);
    setCurrentPage(1); // CR-01: changing filter resets page to 1
    updateUrl(1, tab);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    updateUrl(newPage, activeTab);
  };

  const stats = useMemo(() => {
    const total = coupons.length;
    const active = coupons.filter((c) => c.status === 'Active').length;
    const totalRedemptions = coupons.reduce((sum, c) => sum + (c.usageCount || 0), 0);
    return { total, active, totalRedemptions };
  }, [coupons]);

  // Current list URL with context for back navigation from detail/create/edit
  const currentListUrl = buildCouponListUrl({
    page: safePage,
    status: activeTab,
    isDemo,
  });

  const createHref = withCouponDemoMode(
    `${OPERATOR_COUPON_ROUTES.create}?returnUrl=${encodeURIComponent(currentListUrl)}`,
    isDemo
  );

  return (
    <div className="space-y-6">
      {/* Production Truthfulness Banner */}
      {!isDemo && (
        <div
          role="status"
          className="rounded-2xl border border-blue-200 bg-blue-50/80 p-4 text-xs text-blue-900 shadow-xs"
        >
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[20px] text-blue-600 shrink-0">
              info
            </span>
            <div className="space-y-1">
              <p className="font-extrabold">{couponEn.list.banners.productionTitle}</p>
              <p className="text-blue-700 leading-relaxed">
                {couponEn.list.banners.productionBody}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Demo Mode Notice */}
      {isDemo && (
        <div
          role="status"
          className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-xs text-amber-900 shadow-xs"
        >
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[20px] text-amber-600 shrink-0">
              science
            </span>
            <div className="space-y-1">
              <p className="font-extrabold">{couponEn.list.banners.demoTitle}</p>
              <p className="text-amber-800 leading-relaxed">
                {couponEn.list.banners.demoBody}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Workspace Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[#00152A] sm:text-2xl">
            {couponEn.list.title}
          </h1>
          <p className="mt-1 text-xs text-slate-500">{couponEn.list.description}</p>
        </div>

        <Link
          href={createHref}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#006B5F] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#005249] transition"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>{couponEn.list.createButton}</span>
        </Link>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {couponEn.list.kpi.total}
          </p>
          <p className="mt-1 text-2xl font-black text-[#00152A]">{stats.total}</p>
          <p className="mt-1 text-[11px] text-slate-500">{couponEn.list.kpi.totalSubtext}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {couponEn.list.kpi.active}
          </p>
          <p className="mt-1 text-2xl font-black text-emerald-600">{stats.active}</p>
          <p className="mt-1 text-[11px] text-slate-500">{couponEn.list.kpi.activeSubtext}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {couponEn.list.kpi.redemptions}
          </p>
          <p className="mt-1 text-2xl font-black text-blue-600">{stats.totalRedemptions}</p>
          <p className="mt-1 text-[11px] text-slate-500">
            {couponEn.list.kpi.redemptionsSubtext}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-slate-200">
        <nav
          className="flex space-x-2 overflow-x-auto pb-1"
          aria-label={couponEn.list.filterTabs.ariaLabel}
        >
          {(
            [
              { key: 'ALL', label: couponEn.list.filterTabs.all },
              { key: 'Active', label: couponEn.list.filterTabs.active },
              { key: 'Scheduled', label: couponEn.list.filterTabs.scheduled },
              { key: 'Inactive', label: couponEn.list.filterTabs.inactive },
            ] as const
          ).map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabChange(tab.key)}
                className={`whitespace-nowrap border-b-2 px-3 py-2 text-xs font-bold transition ${
                  isActive
                    ? 'border-[#006B5F] text-[#006B5F]'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Coupons List / Table */}
      {filteredCoupons.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <span className="material-symbols-outlined text-[48px] text-slate-300">
            confirmation_number
          </span>
          <h3 className="mt-2 text-sm font-bold text-slate-700">
            {couponEn.list.empty.title}
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            {couponEn.list.empty.description}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-extrabold uppercase text-slate-500">
                <tr>
                  <th scope="col" className="px-5 py-3.5">
                    {couponEn.list.table.codeAndName}
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    {couponEn.list.table.discount}
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    {couponEn.list.table.usageProgress}
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    {couponEn.list.table.validityPeriod}
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    {couponEn.list.table.scope}
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    {couponEn.list.table.status}
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-right">
                    {couponEn.list.table.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedCoupons.map((coupon) => {
                  const usagePercentage = Math.min(
                    100,
                    Math.round(((coupon.usageCount || 0) / coupon.usageLimit) * 100)
                  );
                  const editHref = withCouponDemoMode(
                    `${OPERATOR_COUPON_ROUTES.edit(coupon.id)}?returnUrl=${encodeURIComponent(currentListUrl)}`,
                    isDemo
                  );

                  return (
                    <tr key={coupon.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono text-xs font-black tracking-wider text-[#00152A]">
                            {coupon.couponCode}
                          </span>
                          <span className="text-slate-600 font-medium line-clamp-1">
                            {coupon.name}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4 font-bold text-[#006B5F]">
                        {formatDiscountSummary(coupon)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="w-32">
                          <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                            <span>
                              {couponEn.list.table.usagesCount.replace(
                                '{count}',
                                String(coupon.usageCount)
                              )}
                            </span>
                            <span>
                              {couponEn.list.table.usagesLimit.replace(
                                '{limit}',
                                String(coupon.usageLimit)
                              )}
                            </span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-[#006B5F]"
                              style={{ width: `${usagePercentage}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-slate-600 whitespace-nowrap">
                        <span>{formatDate(coupon.validFrom)}</span>
                        <span className="mx-1 text-slate-400">&ndash;</span>
                        <span>{formatDate(coupon.validTo)}</span>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {coupon.appliesToAllTours ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700">
                            <span className="material-symbols-outlined text-[16px] text-slate-400">
                              public
                            </span>
                            {couponEn.list.table.allTours}
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-slate-700">
                            {couponEn.list.table.toursCount.replace(
                              '{count}',
                              String(coupon.appliedTourIds.length)
                            )}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <OperatorCouponStatusBadge status={coupon.status} />
                      </td>

                      <td className="px-5 py-4 text-right">
                        <Link
                          href={editHref}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-[#006B5F] transition"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                          <span>{couponEn.list.table.editAction}</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile / Tablet Cards View */}
          <div className="lg:hidden divide-y divide-slate-100">
            {paginatedCoupons.map((coupon) => {
              const usagePercentage = Math.min(
                100,
                Math.round(((coupon.usageCount || 0) / coupon.usageLimit) * 100)
              );
              const editHref = withCouponDemoMode(
                `${OPERATOR_COUPON_ROUTES.edit(coupon.id)}?returnUrl=${encodeURIComponent(currentListUrl)}`,
                isDemo
              );

              return (
                <div key={coupon.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-mono text-sm font-black tracking-wider text-[#00152A]">
                        {coupon.couponCode}
                      </span>
                      <p className="mt-0.5 text-xs font-bold text-slate-700">{coupon.name}</p>
                    </div>
                    <OperatorCouponStatusBadge status={coupon.status} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-50">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">
                        {couponEn.list.table.discount}:
                      </span>
                      <p className="font-bold text-[#006B5F]">{formatDiscountSummary(coupon)}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">
                        {couponEn.list.table.validityPeriod}:
                      </span>
                      <p className="text-slate-600 font-medium">
                        {formatDate(coupon.validFrom)} &ndash; {formatDate(coupon.validTo)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-medium text-slate-500">
                      <span>{couponEn.list.table.usageProgress}</span>
                      <span>
                        {coupon.usageCount} / {coupon.usageLimit}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-[#006B5F]"
                        style={{ width: `${usagePercentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-[11px] text-slate-500">
                      {coupon.appliesToAllTours
                        ? couponEn.list.table.allTours
                        : couponEn.list.table.toursCount.replace(
                            '{count}',
                            String(coupon.appliedTourIds.length)
                          )}
                    </span>
                    <Link
                      href={editHref}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                      <span>{couponEn.list.table.editAction}</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CR-01 Pagination Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/50 px-5 py-3 text-xs">
            <span className="font-medium text-slate-600">
              {couponEn.list.pagination.showing
                .replace('{start}', String(startIndexDisplay))
                .replace('{end}', String(endIndexDisplay))
                .replace('{total}', String(totalItems))}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlePageChange(safePage - 1)}
                disabled={safePage <= 1}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-bold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                <span>{couponEn.list.pagination.previous}</span>
              </button>

              <span className="px-2 font-bold text-slate-700">
                {couponEn.list.pagination.page
                  .replace('{current}', String(safePage))
                  .replace('{total}', String(totalPages))}
              </span>

              <button
                type="button"
                onClick={() => handlePageChange(safePage + 1)}
                disabled={safePage >= totalPages}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-bold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <span>{couponEn.list.pagination.next}</span>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
