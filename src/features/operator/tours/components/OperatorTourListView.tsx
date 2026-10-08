'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { OperatorTourStatusBadge } from './OperatorTourStatusBadge';
import { OPERATOR_TOUR_ROUTES, withTourDemoMode } from '../routes';
import {
  type TourLifecycleStatus,
  type TourPackageDto,
} from '../types/tourLifecycle';

interface OperatorTourListViewProps {
  tours: TourPackageDto[];
  isDemo?: boolean;
}

export function OperatorTourListView({ tours, isDemo = false }: OperatorTourListViewProps) {
  const [filter, setFilter] = useState<string>('ALL');

  const filteredTours = tours.filter((t) => {
    if (filter === 'ALL') return true;
    return t.status === filter;
  });

  const filterCounts = {
    ALL: tours.length,
    Draft: tours.filter((t) => t.status === 'Draft').length,
    Pending: tours.filter((t) => t.status === 'Pending').length,
    Approved: tours.filter((t) => t.status === 'Approved').length,
    Rejected: tours.filter((t) => t.status === 'Rejected').length,
  };

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-[#00152A] sm:text-2xl">
            Quản lý gói tour
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Danh sách các gói tour thương mại, lịch trình khởi hành và trạng thái xét duyệt (UC-35, UC-36, UC-37).
          </p>
        </div>

        <Link
          href={withTourDemoMode(OPERATOR_TOUR_ROUTES.create, isDemo)}
          className="flex items-center gap-2 rounded-xl bg-[#006B5F] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#005249] transition"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Tạo gói tour mới (UC-35)
        </Link>
      </div>

      {/* Demo Mode Indicator */}
      {isDemo && (
        <div className="flex items-center justify-between rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-amber-600" aria-hidden="true">
              preview
            </span>
            <span>
              <strong>Bản xem trước DEMO:</strong> Đang hiển thị danh sách gói tour mô phỏng với các trạng thái vòng đời khác nhau.
            </span>
          </div>
          <span className="rounded bg-amber-200 px-2 py-0.5 font-bold uppercase text-[10px] text-amber-800">
            DEMO ONLY
          </span>
        </div>
      )}

      {/* Real Mode Pending Backend Integration Banner */}
      {!isDemo && (
        <div
          role="status"
          className="rounded-2xl border border-amber-300 bg-amber-50/90 p-4 text-xs text-amber-950 shadow-xs"
        >
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[24px] text-amber-600 shrink-0" aria-hidden="true">
              pending_actions
            </span>
            <div>
              <h3 className="text-sm font-bold text-amber-950">
                Tính năng quản lý gói tour đang chờ kết nối dịch vụ máy chủ
              </h3>
              <p className="mt-1 leading-relaxed text-amber-900">
                Giao diện danh sách và bộ lọc trạng thái (Bản nháp, Chờ duyệt, Đã duyệt, Bị từ chối) đã hoàn thiện.
                Dữ liệu chưa được tải từ máy chủ (Capstone_BE).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {[
          { key: 'ALL', label: 'Tất cả' },
          { key: 'Draft', label: 'Bản nháp' },
          { key: 'Pending', label: 'Chờ duyệt' },
          { key: 'Approved', label: 'Đã xuất bản' },
          { key: 'Rejected', label: 'Bị từ chối' },
        ].map((tab) => {
          const isActive = filter === tab.key;
          const count = filterCounts[tab.key as keyof typeof filterCounts] ?? 0;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                isActive
                  ? 'bg-[#006B5F] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tours List Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        {filteredTours.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <span className="material-symbols-outlined text-[48px] text-slate-300">tour</span>
            <p className="mt-2 text-sm font-bold">Chưa có gói tour nào trong danh mục này</p>
            <p className="mt-1 text-xs text-slate-400">
              Hãy bấm &quot;Tạo gói tour mới&quot; để thiết lập chương trình tour đầu tiên của bạn.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/75 text-slate-600">
                <tr>
                  <th className="p-4 font-bold">Gói tour</th>
                  <th className="p-4 font-bold">Điểm đến</th>
                  <th className="p-4 font-bold">Thời lượng</th>
                  <th className="p-4 font-bold">Giá người lớn</th>
                  <th className="p-4 font-bold">Trạng thái</th>
                  <th className="p-4 font-bold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTours.map((t) => {
                  const canEdit = t.status === 'Draft' || t.status === 'Rejected' || t.status === 'Approved';
                  const canSubmit = t.status === 'Draft' || t.status === 'Rejected';

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#006B5F] font-bold">
                            <span className="material-symbols-outlined text-[20px]">tour</span>
                          </div>
                          <div>
                            <Link
                              href={withTourDemoMode(OPERATOR_TOUR_ROUTES.edit(t.id), isDemo)}
                              className="font-bold text-[#00152A] hover:text-[#006B5F] transition"
                            >
                              {t.title}
                            </Link>
                            <p className="font-mono text-[11px] text-slate-400">
                              {t.tourCode} · v{t.version}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-medium text-slate-700">{t.destination}</td>
                      <td className="p-4 text-slate-600">{t.durationDays} ngày</td>
                      <td className="p-4 font-mono font-bold text-[#00152A]">
                        {t.basePrice.toLocaleString()} đ
                      </td>
                      <td className="p-4">
                        <OperatorTourStatusBadge status={t.status as TourLifecycleStatus} />
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canEdit && (
                            <Link
                              href={withTourDemoMode(OPERATOR_TOUR_ROUTES.edit(t.id), isDemo)}
                              className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition"
                            >
                              Chỉnh sửa
                            </Link>
                          )}
                          {t.status === 'Pending' && (
                            <Link
                              href={withTourDemoMode(OPERATOR_TOUR_ROUTES.edit(t.id), isDemo)}
                              className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-500 hover:bg-slate-50 transition"
                            >
                              Xem chi tiết
                            </Link>
                          )}
                          {canSubmit && (
                            <Link
                              href={withTourDemoMode(OPERATOR_TOUR_ROUTES.submit(t.id), isDemo)}
                              className="rounded-lg bg-[#006B5F] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#005249] transition shadow-2xs"
                            >
                              Gửi duyệt
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
