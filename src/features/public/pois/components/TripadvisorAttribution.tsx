interface TripadvisorAttributionProps {
  rating: number | null;
  reviewCount: number;
  size?: 'sm' | 'md';
}

const countFormat = new Intl.NumberFormat('vi-VN');
const ratingFormat = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 });

/** A Tripadvisor score as plain text with a Vietnamese decimal comma: "4,2/5". */
export function formatTripadvisorScore(rating: number): string {
  return `${ratingFormat.format(rating)}/5`;
}

/**
 * Tripadvisor attribution (Review 2, spec §5) as plain text only: "Tripadvisor · 4,2/5 · 717 đánh giá",
 * or "Tripadvisor · 717 đánh giá" without a rating. No Tripadvisor image or logo is shown (the API's
 * `ratingImageUrl` is not rendered) and it never links out of TripMate to Tripadvisor.
 */
export function TripadvisorAttribution({ rating, reviewCount, size = 'md' }: TripadvisorAttributionProps) {
  const parts: string[] = [];
  if (rating !== null) parts.push(formatTripadvisorScore(rating));
  parts.push(`${countFormat.format(reviewCount)} đánh giá`);

  return (
    <span
      className={`inline-flex rounded-lg bg-white font-bold text-slate-900 ${
        size === 'sm' ? 'text-xs' : 'px-2 py-1 text-sm'
      }`}
    >
      {parts.join(' · ')}
    </span>
  );
}
