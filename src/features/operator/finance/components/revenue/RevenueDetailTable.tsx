'use client';

import { formatVndCurrency } from '../../utils/financeFormat';
import { financeEn } from '../../resources/en';
import type { TourRevenueDetailItem } from '../../types/revenueLifecycle';

interface RevenueDetailTableProps {
  items: TourRevenueDetailItem[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
}

export function RevenueDetailTable({
  items,
  totalCount,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
}: RevenueDetailTableProps) {
  const startRecord = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-sm font-bold text-[#00152A]">
            {financeEn.revenue.detailTable.title}
          </h3>
          <p className="text-xs text-slate-500">
            {financeEn.revenue.detailTable.subtitle}
          </p>
        </div>
        <div className="text-xs font-semibold text-slate-500">
          {financeEn.revenue.detailTable.showingRange
            .replace('{start}', String(startRecord))
            .replace('{end}', String(endRecord))
            .replace('{total}', String(totalCount))}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="my-10 flex flex-col items-center justify-center text-center text-slate-400">
          <span className="material-symbols-outlined text-4xl">folder_off</span>
          <p className="mt-2 text-xs">{financeEn.revenue.detailTable.empty}</p>
        </div>
      ) : (
        <>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
              <thead className="bg-slate-50 font-semibold text-slate-700">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    {financeEn.revenue.detailTable.colTour}
                  </th>
                  <th scope="col" className="px-4 py-3 text-center">
                    {financeEn.revenue.detailTable.colBookings}
                  </th>
                  <th scope="col" className="px-4 py-3 text-center">
                    {financeEn.revenue.detailTable.colParticipants}
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    {financeEn.revenue.detailTable.colGross}
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    {financeEn.revenue.detailTable.colRefunded}
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    {financeEn.revenue.detailTable.colCommission}
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    {financeEn.revenue.detailTable.colNet}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-slate-600">
                {items.map((tour) => (
                  <tr key={tour.tourId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-[#00152A]">
                        {tour.tourName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {tour.tourCode}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center font-medium">
                      {tour.bookingsCount}
                    </td>
                    <td className="px-4 py-3.5 text-center font-medium">
                      {tour.participantsCount}
                    </td>
                    <td className="px-4 py-3.5 text-right font-medium text-emerald-700">
                      {formatVndCurrency(tour.grossRevenue)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-medium text-rose-600">
                      {formatVndCurrency(tour.refundedAmount)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-medium text-amber-700">
                      {formatVndCurrency(tour.commission)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-[#006B5F]">
                      {formatVndCurrency(tour.netAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination (CR-01) */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="text-xs text-slate-500">
                {financeEn.revenue.detailTable.pageIndicator
                  .replace('{page}', String(currentPage))
                  .replace('{totalPages}', String(totalPages))}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
                >
                  {financeEn.revenue.detailTable.prevBtn}
                </button>
                <button
                  type="button"
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
                >
                  {financeEn.revenue.detailTable.nextBtn}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
