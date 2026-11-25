import { proxyContractTemplates } from '@/features/admin/contract-templates/contractTemplatesProxy';

type Context = { params: Promise<{ path?: string[] }> };
async function handle(request: Request, context: Context) {
  return proxyContractTemplates(request, (await context.params).path);
}
export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const DELETE = handle;
