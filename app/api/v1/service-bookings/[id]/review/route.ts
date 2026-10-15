import { proxyCanonicalReview } from '@/features/reviews/services/canonicalReviewProxy';

interface Context { params: Promise<{ id: string }> }
export async function GET(request: Request, context: Context) { return proxyCanonicalReview(request, 'serviceBooking', (await context.params).id); }
export async function POST(request: Request, context: Context) { return proxyCanonicalReview(request, 'serviceBooking', (await context.params).id); }
export async function PUT(request: Request, context: Context) { return proxyCanonicalReview(request, 'serviceBooking', (await context.params).id); }
