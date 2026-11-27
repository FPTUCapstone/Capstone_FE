import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { commissionMoney, type CommissionCalculation } from './commission';

export function CommissionCalculationBreakdown({ calculation: c }: { calculation: CommissionCalculation }) {
  const rows = [
    ['Doanh thu được ghi nhận kỳ này', c.grossRevenueVnd],
    ['Tiền hoàn đã hoàn tất được ghi nhận', c.completedRefundsVnd],
    ['Hoa hồng từ doanh thu', c.revenueCommissionVnd],
    ['Giảm hoa hồng do hoàn tiền', -c.refundCommissionCreditVnd],
    ['Khoản giảm còn dư từ kỳ trước', c.creditBroughtForwardVnd],
    ['Tổng khoản giảm đã áp dụng', -c.creditAppliedVnd],
    ['Khoản giảm còn dư chuyển kỳ sau', c.creditCarriedForwardVnd],
  ] as const;
  return <section className="space-y-3 rounded-2xl border border-brand-border bg-white p-5">
    <h2 className="font-bold">Chi tiết tính và chuyển kỳ</h2>
    <dl className="divide-y divide-brand-border text-sm">{rows.map(([label, value]) => <div key={label} className="flex justify-between gap-4 py-3"><dt className="text-brand-textSecondary">{label}</dt><dd className="text-right font-semibold tabular-nums">{commissionMoney(value)}</dd></div>)}</dl>
    <p className="rounded-lg bg-brand-lightTeal p-3 text-sm">Hoa hồng phải trả = hoa hồng doanh thu trừ khoản giảm do hoàn tiền và số dư giảm trừ kỳ trước. Nếu giảm trừ còn dư, phần dư được chuyển sang kỳ sau.</p>
    <p className="text-xs text-brand-textSecondary">Khoản giảm do hoàn tiền dùng tỷ lệ đã ghi nhận cho doanh thu gốc. Bảng đối soát đã phát hành được giữ nguyên; các khoản phát sinh muộn được ghi nhận ở kỳ sau.</p>
    {c.heldBookingCount > 0 ? <FeedbackAlert tone="info">{c.heldBookingCount} đơn còn chờ xử lý khiếu nại/hoàn tiền. Các đơn này sẽ được tính sau khi xử lý xong.</FeedbackAlert> : null}
    {c.ambiguousLegacyBookingCount > 0 ? <FeedbackAlert tone="warning">{c.ambiguousLegacyBookingCount} đơn lịch sử cần kiểm tra đối chiếu. Hệ thống chưa tự tính thêm tiền cho các đơn này.</FeedbackAlert> : null}
  </section>;
}
