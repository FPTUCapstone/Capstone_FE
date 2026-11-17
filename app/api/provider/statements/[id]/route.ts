import { proxyProviderStatements } from '@/features/hotel-service-provider/server/workflowProxy';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyProviderStatements(request, id);
}
