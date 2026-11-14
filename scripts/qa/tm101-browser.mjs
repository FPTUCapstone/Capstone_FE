import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const delivery = path.resolve(process.env.TM101_BROWSER_ARTIFACT_DIR || path.join(repoRoot, '.qa', 'tm101'));
const session = JSON.parse(fs.readFileSync(path.join(delivery, 'browser-session.json'), 'utf8'));
const secret = crypto.randomBytes(32);
let mapToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.startsWith('pk.') ? process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN : '';
try { if (!mapToken && process.env.TM101_MAPBOX_TOKEN_SOURCE) mapToken = fs.readFileSync(process.env.TM101_MAPBOX_TOKEN_SOURCE, 'utf8').match(/^NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN\s*=\s*["']?(pk\.[^\s"']+)/m)?.[1] ?? ''; } catch {}
const log = fs.openSync(path.join(delivery, 'frontend-browser-host.log'), 'a');
const child = spawn(process.execPath, [path.join(repoRoot, 'node_modules/next/dist/bin/next'), 'dev', '--hostname', '127.0.0.1', '-p', '3021'], { cwd: repoRoot, windowsHide: true, env: { ...process.env, TRIPMATE_API_BASE_URL: session.backendUrl, TRIPMATE_WEB_ORIGIN: 'http://127.0.0.1:3021', TRIPMATE_ADMIN_SESSION_SECRET: secret.toString('base64url'), NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: mapToken }, stdio: ['ignore', log, log] });
const base = 'http://127.0.0.1:3021';
const report = { backend: session.backendUrl, mapTokenConfigured: Boolean(mapToken), checks: [], mapResponses: [], pageErrors: [] };
async function ready() { for (let i = 0; i < 90; i++) { try { const r = await fetch(base + '/admin/login'); if (r.ok) return; } catch {} await new Promise(r => setTimeout(r, 500)); } throw Error('Frontend did not start'); }
async function main() {
  await ready();
  const browser = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const now = Date.now();
    const payload = Buffer.from(JSON.stringify({ v: 'v1', role: 'Staff', uid: session.userId, th: crypto.createHash('sha256').update(session.accessToken).digest('base64url'), iat: now, exp: now + 600000 })).toString('base64url');
    const input = `v1.${payload}`;
    const seal = `${input}.${crypto.createHmac('sha256', secret).update(input).digest('base64url')}`;
    await context.addCookies([{ name: 'tripmate_admin_access_token', value: session.accessToken, url: base, httpOnly: true, sameSite: 'Strict' }, { name: 'tripmate_admin_session_seal', value: seal, url: base, httpOnly: true, sameSite: 'Strict' }]);
    const page = await context.newPage();
    page.on('pageerror', error => report.pageErrors.push(error.message));
    page.on('response', response => { if (response.url().includes('api.mapbox.com/directions')) report.mapResponses.push({ status: response.status() }); });
    page.on('requestfailed', request => { if (request.url().includes('api.mapbox.com')) { report.mapRequestFailures ??= []; report.mapRequestFailures.push(request.failure()?.errorText); } });
    await page.goto(base + '/admin/routes');
    await page.getByRole('heading', { name: 'Routes List', exact: true }).waitFor({ timeout: 60000 });
    await page.getByRole('link', { name: 'Create Route', exact: true }).click();
    await page.getByLabel('Origin Point of Interest', { exact: true }).waitFor({ timeout: 45000 });
    report.checks.push('Staff opens Routes List and Create Route with real backend Active POI options');
    await page.getByRole('button', { name: 'Create Route', exact: true }).click();
    await page.getByText('This field is required.', { exact: true }).first().waitFor();
    await page.screenshot({ path: path.join(delivery, 'required-errors-debug.png'), fullPage: true });
    const requiredFields = ['Origin Point of Interest', 'Destination Point of Interest', 'Distance (km)', 'Estimated Travel Time (minutes)', 'Transport Mode'];
    for (const label of requiredFields) {
      const field = page.getByLabel(label, { exact: true });
      if (await field.getAttribute('aria-invalid') !== 'true') throw Error(`Missing invalid state for ${label}`);
      const errorId = await field.getAttribute('aria-describedby');
      if (!errorId || !(await page.locator(`[id="${errorId}"]`).innerText()).includes('This field is required.')) throw Error(`Missing inline required error for ${label}`);
    }
    report.checks.push('Required errors rendered inline without a write');
    await page.getByLabel('Origin Point of Interest', { exact: true }).selectOption(String(session.fromPoiId));
    await page.getByLabel('Destination Point of Interest', { exact: true }).selectOption(String(session.toPoiId));
    await page.getByLabel('Distance (km)', { exact: true }).fill('2.5');
    await page.getByLabel('Estimated Travel Time (minutes)', { exact: true }).fill('15');
    await page.getByLabel('Transport Mode', { exact: true }).selectOption('Walking');
    await page.getByLabel('Route Note', { exact: false }).fill('TM101 real browser E2E');
    try {
      await page.waitForFunction(() => {
        const canvas = document.querySelector('.mapboxgl-canvas');
        return canvas && canvas.getBoundingClientRect().width > 0 && ![...document.querySelectorAll('[role="status"]')].some(node => node.textContent.includes('Loading route preview'));
      }, null, { timeout: 45000 });
      report.mapPreviewVerified = report.mapResponses.some(response => response.status === 200);
    } catch { report.mapPreviewVerified = false; report.mapFailure = 'Live Mapbox preview did not become ready in this environment.'; }
    if (!report.mapPreviewVerified) throw Error('Live Mapbox preview verification is required for this end-to-end test.');
    for (const width of [375, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const crumb = await page.getByRole('navigation', { name: 'Breadcrumb', exact: true }).locator('[aria-current="page"]').boundingBox();
      if (!crumb || crumb.y < 0 || crumb.y + crumb.height > 64) throw Error(`Breadcrumb clipped at ${width}`);
      if (report.mapPreviewVerified) {
        const mapBounds = await page.locator('.mapboxgl-canvas').boundingBox();
        for (const marker of await page.locator('.mapboxgl-marker').all()) {
          const pin = await marker.boundingBox();
          if (!pin || pin.x < mapBounds.x || pin.x + pin.width > mapBounds.x + mapBounds.width || pin.y < mapBounds.y || pin.y + pin.height > mapBounds.y + mapBounds.height) throw Error(`Map endpoint clipped at ${width}`);
        }
      }
      await page.screenshot({ path: path.join(delivery, `create-route-${width}.png`), fullPage: true });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      if (overflow) throw Error(`Horizontal overflow at ${width}`);
      report.checks.push(`Responsive ${width}px has no horizontal document overflow`);
    }
    await page.getByLabel('Origin Point of Interest', { exact: true }).focus();
    await page.keyboard.press('Tab');
    if (await page.getByLabel('Destination Point of Interest', { exact: true }).evaluate(node => node === document.activeElement) !== true) throw Error('Keyboard order failed');
    report.checks.push('Keyboard Tab moves from Origin to Destination');
    const postResponse = page.waitForResponse(response => response.url().endsWith('/api/admin/routes') && response.request().method() === 'POST');
    await page.getByRole('button', { name: 'Create Route', exact: true }).click();
    const response = await postResponse;
    report.creationHttpStatus = response.status();
    const created = await response.json();
    if (response.status() !== 201 || created.status !== 'Active') throw Error(`Create returned ${response.status()} ${JSON.stringify(created)}`);
    report.createdRouteId = created.id;
    await page.waitForURL(base + '/admin/routes', { timeout: 30000 });
    await page.getByText('Route created successfully.', { exact: true }).waitFor({ timeout: 30000 });
    await page.getByRole('cell', { name: 'Active', exact: true }).first().waitFor();
    report.checks.push('Real SQL-backed create returns201 Active MSG139 and refreshed server list shows route');
    await page.screenshot({ path: path.join(delivery, 'routes-list-created.png'), fullPage: true });
    await page.goBack();
    await page.getByRole('heading', { name: 'Create Route', exact: true }).waitFor();
    await page.goForward();
    await page.getByRole('cell', { name: 'Active', exact: true }).first().waitFor();
    if (await page.getByText('Route created successfully.', { exact: true }).count()) throw Error('Success replayed on client history');
    await page.reload();
    await page.getByRole('cell', { name: 'Active', exact: true }).first().waitFor();
    if (await page.getByText('Route created successfully.', { exact: true }).count()) throw Error('Success replayed after reload');
    await page.goto(base + `/admin/routes?created=${created.id}`);
    await page.getByRole('cell', { name: 'Active', exact: true }).first().waitFor();
    if (await page.getByText('Route created successfully.', { exact: true }).count()) throw Error('Bookmark fabricated success');
    await page.goBack();
    await page.goForward();
    await page.getByRole('cell', { name: 'Active', exact: true }).first().waitFor();
    if (await page.getByText('Route created successfully.', { exact: true }).count()) throw Error('History replayed success');
    report.checks.push('Refresh, bookmarked route ID, and browser history do not replay MSG139');
    fs.writeFileSync(path.join(delivery, 'browser-complete'), String(created.id));
  } finally { await browser.close(); }
}
main().catch(error => { report.error = error.message; process.exitCode = 1; }).finally(() => { fs.writeFileSync(path.join(delivery, 'browser-results.json'), JSON.stringify(report, null, 2)); child.kill(); fs.closeSync(log); console.log(JSON.stringify(report)); });
