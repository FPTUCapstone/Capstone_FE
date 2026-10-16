'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { OperatorTourStatusBadge } from './OperatorTourStatusBadge';
import { OPERATOR_TOUR_ROUTES, withTourDemoMode } from '../routes';
import { removeOperatorTour } from '../services/operatorTourService';
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
  const [items, setItems] = useState(tours);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [tourPendingDeletion, setTourPendingDeletion] = useState<TourPackageDto | null>(null);
  const successTimeoutRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (successTimeoutRef.current !== null) window.clearTimeout(successTimeoutRef.current);
  }, []);

  const showDeleteSuccess = (tourTitle: string) => {
    if (successTimeoutRef.current !== null) window.clearTimeout(successTimeoutRef.current);
    setDeleteSuccess(`Đã xóa “${tourTitle}”.`);
    successTimeoutRef.current = window.setTimeout(() => {
      setDeleteSuccess(null);
      successTimeoutRef.current = null;
    }, 4000);
  };

  const confirmDelete = async () => {
    if (!tourPendingDeletion) return;
    const tour = tourPendingDeletion;
    setDeletingId(tour.id);
    setDeleteError(null);
    try {
      await removeOperatorTour(tour.id);
      setItems((current) => current.filter((item) => item.id !== tour.id));
      setTourPendingDeletion(null);
      showDeleteSuccess(tour.title);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Không thể xóa tour. Vui lòng thử lại.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredTours = items.filter((t) => {
    if (filter === 'ALL') return true;
    return t.status === filter;
  });

  const filterCounts = {
    ALL: items.length,
    Draft: items.filter((t) => t.status === 'Draft').length,
    Pending: items.filter((t) => t.status === 'Pending').length,
    Approved: items.filter((t) => t.status === 'Approved').length,
    Published: items.filter((t) => t.status === 'Published').length,
    Rejected: items.filter((t) => t.status === 'Rejected').length,
  };

  return (
    <div className="space-y-6">
      {deleteSuccess && (
        <div role="status" className="fixed right-4 top-4 z-[60] flex max-w-sm items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-emerald-800 shadow-lg">
          <span className="material-symbols-outlined text-[20px] text-emerald-600" aria-hidden="true">check_circle</span>
          {deleteSuccess}
        </div>
      )}
      {/* Top Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-[#00152A] sm:text-2xl">
            Quản lý gói tour
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Danh sách các gói tour thương mại, lịch trình khởi hành và trạng thái xét duyệt.
          </p>
        </div>

        <Link
          href={withTourDemoMode(OPERATOR_TOUR_ROUTES.create, isDemo)}
          className="flex items-center gap-2 rounded-xl bg-[#006B5F] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#005249] transition"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Tạo gói tour mới
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

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {[
          { key: 'ALL', label: 'Tất cả' },
          { key: 'Draft', label: 'Bản nháp' },
          { key: 'Pending', label: 'Chờ duyệt' },
          { key: 'Approved', label: 'Đã duyệt' },
          { key: 'Published', label: 'Đã xuất bản' },
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
                  const canEdit =
                    t.status === 'Draft' || t.status === 'Rejected' || t.status === 'Approved' || t.status === 'Published';
                  const canSubmit = t.status === 'Draft' || t.status === 'Rejected';
                  const canDelete = canSubmit;

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
                        <div className="flex flex-nowrap items-center justify-end gap-2 whitespace-nowrap">
                          {canEdit && (
                            <Link
                              href={withTourDemoMode(OPERATOR_TOUR_ROUTES.edit(t.id), isDemo)}
                              className="inline-flex shrink-0 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition"
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
                              className="inline-flex shrink-0 rounded-lg bg-[#006B5F] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#005249] transition shadow-2xs"
                            >
                              Gửi duyệt
                            </Link>
                          )}
                          {canDelete && (
                            <button type="button" disabled={deletingId === t.id} aria-label={`Xóa ${t.title}`} onClick={() => {
                              setDeleteError(null);
                              setTourPendingDeletion(t);
                            }} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-rose-600 hover:bg-rose-50 disabled:opacity-50" title="Xóa tour">
                              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">delete</span>
                            </button>
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
      {deleteError && !tourPendingDeletion && <p role="alert" className="mt-3 text-sm font-medium text-rose-600">{deleteError}</p>}
      {tourPendingDeletion && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="delete-tour-title" aria-describedby="delete-tour-description" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <span className="material-symbols-outlined grid h-11 w-11 shrink-0 place-items-center rounded-full bg-rose-50 text-rose-600" aria-hidden="true">delete_forever</span>
              <div>
                <h2 id="delete-tour-title" className="text-lg font-extrabold text-slate-900">Xóa gói tour?</h2>
                <p id="delete-tour-description" className="mt-2 text-sm leading-6 text-slate-600">
                  Bạn sắp xóa <strong className="font-bold text-slate-900">{tourPendingDeletion.title}</strong>. Dữ liệu bản nháp và lịch khởi hành của tour này sẽ bị xóa vĩnh viễn.
                </p>
              </div>
            </div>
            <div className="mt-6 border-t border-slate-100 pt-5">
              {deleteError && (
                <p role="alert" className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                  {deleteError}
                </p>
              )}
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
                <button type="button" onClick={() => setTourPendingDeletion(null)} disabled={deletingId !== null} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Hủy</button>
                <button type="button" onClick={() => void confirmDelete()} disabled={deletingId !== null} className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-50">
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">delete</span>
                  {deletingId ? 'Đang xóa…' : 'Xóa tour'}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
