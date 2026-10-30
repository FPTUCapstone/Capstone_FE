import { describe, expect, it, vi } from 'vitest';

const { listProxyMock, createProxyMock } = vi.hoisted(() => ({
  listProxyMock: vi.fn(),
  createProxyMock: vi.fn(),
}));

vi.mock('@/features/admin/catalogue/services/poi-management-proxy', () => ({
  proxyPoiManagementList: listProxyMock,
}));
vi.mock('@/features/admin/create-poi/services/poi-proxy', () => ({ proxyPoi: createProxyMock }));

import { GET, POST } from './route';

describe('/api/admin/pois route delegation', () => {
  it('delegates GET to the dedicated read-only management proxy', async () => {
    const request = new Request('http://localhost:3001/api/admin/pois?page=2');
    listProxyMock.mockResolvedValue(Response.json({ items: [] }));
    await GET(request);
    expect(listProxyMock).toHaveBeenCalledWith(request);
  });

  it('preserves the original POST delegate and fixed create path exactly', async () => {
    const request = new Request('http://localhost:3001/api/admin/pois', { method: 'POST' });
    createProxyMock.mockResolvedValue(Response.json({ id: 7 }, { status: 201 }));
    await POST(request);
    expect(createProxyMock).toHaveBeenCalledWith(request, '/api/v1/admin/pois');
    expect(listProxyMock).not.toHaveBeenCalled();
  });
});
