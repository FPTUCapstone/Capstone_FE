import type { CommercialPoiItem, CreateServiceProviderPayload, CreateStaffPayload, ProvisionedAccount } from '../types';
import { record, WorkflowError, workflowRequest } from './workflowClient';

async function create(path: string, payload: CreateStaffPayload) {
  const data = record(await workflowRequest(path, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  }));
  if (!Number.isSafeInteger(data.userId) || typeof data.email !== 'string' || typeof data.fullName !== 'string' ||
    !['Staff', 'ServiceProvider'].includes(data.role as string) || data.status !== 'Active' ||
    typeof data.mustChangePassword !== 'boolean' || typeof data.emailDeliveryStatus !== 'string') throw new WorkflowError();
  return { success: true, account: data as unknown as ProvisionedAccount };
}

export const StaffProviderService = {
  async fetchCommercialPois(): Promise<CommercialPoiItem[]> {
    const data = await workflowRequest('/api/admin/service-provider-accounts/available-pois');
    if (!Array.isArray(data)) throw new WorkflowError();
    return data.map(value => {
      const poi = record(value);
      if (!Number.isSafeInteger(poi.id) || (poi.id as number) <= 0 || typeof poi.name !== 'string' || typeof poi.category !== 'string') throw new WorkflowError();
      return { id: poi.id as number, name: poi.name, category: poi.category };
    });
  },
  createServiceProviderAccount: (payload: CreateServiceProviderPayload) => create('/api/admin/service-provider-accounts', payload),
  createStaffAccount: (payload: CreateStaffPayload) => create('/api/admin/staff-accounts', payload),
};
