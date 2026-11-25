import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';

let input = '';
for await (const chunk of process.stdin) input += chunk;
const fixture = JSON.parse(input);
const backend = new URL(fixture.origin);
assert.equal(backend.protocol, 'http:');
assert.ok(['127.0.0.1', 'localhost'].includes(backend.hostname));
assert.equal(backend.origin, fixture.origin);
const artifacts = process.env.TRIPMATE_NOTIFICATION_UAT_ARTIFACTS;
if (artifacts) await mkdir(artifacts, { recursive: true });

async function freePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => server.once('error', reject).listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  return port;
}

const port = await freePort();
const origin = 'http://127.0.0.1:' + port;
const server = spawn(process.execPath, [
  'node_modules/next/dist/bin/next', 'dev', '--hostname', '127.0.0.1', '--port', String(port),
], {
  env: {
    ...process.env,
    NEXT_PUBLIC_API_URL: '/api/v1',
    TRIPMATE_API_BASE_URL: fixture.origin,
    TRIPMATE_WEB_ORIGIN: origin,
    TRIPMATE_ADMIN_SESSION_SECRET: randomBytes(32).toString('base64url'),
    NEXT_TELEMETRY_DISABLED: '1',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
  windowsHide: true,
});
let serverLog = '';
for (const stream of [server.stdout, server.stderr]) {
  stream.on('data', chunk => { serverLog = (serverLog + chunk).slice(-9000); });
}
let browser;

try {
  let ready = false;
  for (let attempt = 0; attempt < 120 && server.exitCode === null; attempt++) {
    try {
      const result = await fetch(origin + '/robots.txt', { signal: AbortSignal.timeout(2000) });
      if (result.ok) { ready = true; break; }
    } catch { /* Next starts asynchronously. */ }
    await delay(500);
  }
  assert.ok(ready, 'Next.js local server did not start');
  browser = await chromium.launch({ headless: true });
  for (const actor of fixture.actors) {
    const context = await browser.newContext({ baseURL: origin, viewport: { width: 1440, height: 900 } });
    try {
      const consoleRole = actor.role === 'Administrator' || actor.role === 'Staff';
      const login = await context.request.post(consoleRole ? '/api/admin/session' : '/api/v1/auth/web/login', {
        headers: { Origin: origin },
        data: { email: actor.email, password: fixture.password, keepMeSignedIn: false },
      });
      assert.equal(login.status(), 200, actor.role + ' sign-in failed with ' + login.status());
      const page = await context.newPage();
      const inboxResponse = page.waitForResponse(response =>
        new URL(response.url()).pathname.endsWith('/notifications')
        && response.request().method() === 'GET' && response.ok(), { timeout: 45000 });
      await page.goto(actor.entry, { waitUntil: 'domcontentloaded' });
      const bell = page.getByRole('button', { name: 'Thông báo', exact: true });
      await bell.click({ timeout: 35000 });
      const unread = page.getByRole('button', { name: actor.title + ' · Chưa đọc', exact: true });
      await unread.waitFor({ timeout: 20000 });
      const badge = page.getByTestId('notification-badge');
      await badge.waitFor({ timeout: 10000 });
      const inbox = await inboxResponse;
      const foreignIds = fixture.actors.filter(candidate => candidate !== actor).map(candidate => candidate.noticeId);
      const entries = (await inbox.json()).items;
      assert.ok(!entries.some(entry => foreignIds.includes(entry.id)), actor.role + ' received a foreign notice');
      const headers = await inbox.request().allHeaders();
      const inboxPath = new URL(inbox.url()).pathname;
      const foreignRead = await context.request.post(inboxPath + '/' + foreignIds[0] + '/read', {
        headers: {
          Origin: origin,
          ...(headers.authorization && { Authorization: headers.authorization }),
          ...(headers['x-notification-session'] && { 'X-Notification-Session': headers['x-notification-session'] }),
        },
      });
      assert.equal(foreignRead.status(), 404, actor.role + ' could access another inbox item');
      if (artifacts) await page.screenshot({ path: path.join(artifacts, actor.role + '-unread.png') });
      const readResponse = page.waitForResponse(response =>
        new URL(response.url()).pathname.endsWith('/notifications/' + actor.noticeId + '/read')
        && response.request().method() === 'POST');
      await unread.click();
      assert.equal((await readResponse).status(), 204, actor.role + ' mark-read failed');
      if (actor.destination) {
        await page.waitForURL(url => url.pathname + url.search === actor.destination, { timeout: 25000 });
        if (actor.role === 'Administrator') {
          await page.getByText('Awaiting manual review', { exact: false }).first().waitFor({ timeout: 25000 });
        }
      }
      if (await bell.getAttribute('aria-expanded') !== 'true') await bell.click();
      await page.getByRole('button', { name: actor.title + ' · Đã đọc', exact: true }).waitFor({ timeout: 15000 });
      if (artifacts) await page.screenshot({ path: path.join(artifacts, actor.role + '-read.png') });
      console.log(actor.role + ' | ' + actor.noticeType + ' | inbox, badge, foreign read 404, own read 204 | ' +
        (actor.destination ?? 'message displayed in inbox'));
    } finally {
      await context.close();
    }
  }
} catch (error) {
  console.error(error instanceof Error ? error.stack : error);
  console.error(serverLog);
  process.exitCode = 1;
} finally {
  await browser?.close();
  if (server.exitCode === null) {
    if (process.platform === 'win32') {
      const cleanup = spawn('taskkill.exe', ['/PID', String(server.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
      await new Promise(resolve => { cleanup.once('exit', resolve); cleanup.once('error', resolve); });
    } else {
      server.kill('SIGTERM');
    }
  }
}
