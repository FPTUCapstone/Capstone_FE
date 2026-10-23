import { proxyCanonicalReview } from '@/features/reviews/services/canonicalReviewProxy';

interface Context { params: Promise<{ bookingId: string }> }
export async function GET(request: Request, context: Context) { return proxyCanonicalReview(request, 'commerceBooking', (await context.params).bookingId); }
export async function POST(request: Request, context: Context) { return proxyCanonicalReview(request, 'commerceBooking', (await context.params).bookingId); }
export async function PUT(request: Request, context: Context) { return proxyCanonicalReview(request, 'commerceBooking', (await context.params).bookingId); }
