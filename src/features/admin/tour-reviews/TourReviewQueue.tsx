import Link from 'next/link';

import { StatusBadge } from '@/components/ui/StatusBadge';
import { adminTourReviews } from '@/data/adminTourQueue';
import { ROUTES } from '@/lib/routes';

export function TourReviewQueue() {
  return (
    <main className="min-h-[calc(100vh-65px)] bg-[#f7f9fc] px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#c3c6ce] pb-6 sm:flex-row sm:items-end">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#006b5f]">Tour moderation</span>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-[#00152a]">Hàng đợi kiểm duyệt Tour</h1>
            <p className="mt-2 text-sm text-[#43474d]">Dữ liệu hiện tại là mock và được giữ lại từ prototype Vite.</p>
          </div>
          <StatusBadge tone="coral">{adminTourReviews.length} tour mẫu</StatusBadge>
        </div>

        <section className="overflow-hidden rounded-2xl border border-[#c3c6ce] bg-white shadow-xs">
          <div className="hidden grid-cols-[1.4fr_2fr_0.7fr_0.7fr_auto] gap-4 border-b border-[#c3c6ce] bg-[#eceef1] px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#74777e] md:grid">
            <span>Operator</span>
            <span>Tour</span>
            <span>Giá</span>
            <span>Thời lượng</span>
            <span>Trạng thái</span>
          </div>

          <div className="divide-y divide-[#eceef1]">
            {adminTourReviews.map((review) => (
              <Link
                key={review.id}
                href={ROUTES.admin.tourReview(review.id)}
                className="grid gap-3 px-5 py-5 transition-colors hover:bg-[#f7f9fc] md:grid-cols-[1.4fr_2fr_0.7fr_0.7fr_auto] md:items-center md:gap-4"
              >
                <div>
                  <span className="text-xs font-bold text-[#006b5f]">{review.operatorName}</span>
                  <span className="mt-0.5 block text-[11px] text-[#74777e]">Gửi {review.submittedTime}</span>
                </div>
                <h2 className="text-sm font-bold text-[#00152a]">{review.tourName}</h2>
                <span className="font-mono text-xs font-bold text-[#00152a]">{review.price}</span>
                <span className="text-xs text-[#43474d]">{review.duration}</span>
                <StatusBadge tone={review.status === 'pending' ? 'coral' : 'neutral'}>
                  {review.status === 'pending' ? 'Cần duyệt' : review.status}
                </StatusBadge>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
