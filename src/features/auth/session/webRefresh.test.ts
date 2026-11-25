import { afterEach, expect, it, vi } from 'vitest';
import { webRefresh } from '@/lib/authApi';
import { AuthStorage } from './authSession';

const ctx = { userId: 42, email: 'user@example.com', fullName: 'User', role: 'Traveler', status: 'Active', applicationStatus: null, accessToken: 'test-access', accessTokenExpiresAtUtc: '2099-01-01T00:00:00Z' };
afterEach(() => { vi.unstubAllGlobals(); AuthStorage.clear(); });

it('restores the authoritative context from the cookie-only refresh endpoint', async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, data: ctx }), { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
  const context = await webRefresh();
  const [url, options] = fetchMock.mock.calls[0];
  expect(url).toMatch(/\/auth\/web\/refresh$/);
  expect(options.method).toBe('POST');
  expect(options.credentials).toBe('include');
  expect(options.body).toBeUndefined();
  expect(context.role).toBe('Traveler');
  expect(AuthStorage.getAccessToken()).toBe('test-access');
});

it('preserves operator applicationStatus on restore', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, data: { ...ctx, role: 'TourOperator', applicationStatus: 'PendingApproval' } }), { status: 200 })));
  const context = await webRefresh();
  expect(context.role).toBe('TourOperator');
  expect(context.applicationStatus).toBe('PendingApproval');
});

it('leaves the session unauthenticated when the refresh is rejected', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ errorCode: 'AUTH_TOKEN_INVALID' }), { status: 401 })));
  await expect(webRefresh()).rejects.toMatchObject({ status: 401 });
  expect(AuthStorage.getContext()).toBeNull();
});

it('discards a malformed success without authenticating', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, data: { ...ctx, role: 'Unknown' } }), { status: 200 })));
  await expect(webRefresh()).rejects.toThrow('INVALID_AUTH_CONTEXT');
  expect(AuthStorage.getContext()).toBeNull();
});

it('does not log out a valid chat session on a temporary refresh outage', async () => {
 AuthStorage.accept(ctx,false);vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('{}',{status:503})));
 await expect(webRefresh()).rejects.toMatchObject({status:503});expect(AuthStorage.getContext()?.userId).toBe(42);
});
it('does not resurrect a chat session when refresh completes after explicit logout',async()=>{
 AuthStorage.accept(ctx,false);let finish!:(v:Response)=>void;vi.stubGlobal('fetch',vi.fn(()=>new Promise(r=>{finish=r;})));
 const pending=webRefresh();AuthStorage.clear();finish(new Response(JSON.stringify({success:true,data:ctx})));
 await expect(pending).rejects.toMatchObject({code:'SESSION_CHANGED'});expect(AuthStorage.getContext()).toBeNull();
});
it('serializes cookie refresh across tabs and cancels a queued refresh after logout',async()=>{
 AuthStorage.accept(ctx,false);let enter:(()=>Promise<void>)|undefined;
 const locks={request:vi.fn((_name:string,run:()=>Promise<unknown>)=>new Promise((resolve,reject)=>{enter=async()=>{try{resolve(await run());}catch(e){reject(e);}};}))};
 vi.stubGlobal('navigator',{locks});const fetchMock=vi.fn().mockResolvedValue(new Response(JSON.stringify({success:true,data:ctx})));vi.stubGlobal('fetch',fetchMock);
 const pending=webRefresh();const usedLock=locks.request.mock.calls.length>0;
 if(enter){AuthStorage.clear();await enter();await expect(pending).rejects.toMatchObject({code:'SESSION_CHANGED'});expect(fetchMock).not.toHaveBeenCalled();}else{await pending;}
 expect(usedLock).toBe(true);
});