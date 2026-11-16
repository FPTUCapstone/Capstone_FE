import { proxyRoutes } from '@/features/admin/routes/services/route-proxy';
export const GET = (request: Request) => proxyRoutes(request, true);
