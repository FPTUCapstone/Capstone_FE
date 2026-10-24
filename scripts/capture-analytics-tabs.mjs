import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const VIEWPORTS = [
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'tablet-1024', width: 1024, height: 768 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'mobile-375', width: 375, height: 812 },
];

const OUT_DIR = 'docs/ux/analytics-tabs';
if (!existsSync(OUT_DIR)) {
  mkdirSync(OUT_DIR, { recursive: true });
}

function makeSessionCookies(role) {
  const secretStr = process.env.TRIPMATE_ADMIN_SESSION_SECRET || 'MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY';
  const secret = Buffer.from(secretStr, 'base64url');
  const nowSec = Math.floor(Date.now() / 1000);
  const nowMs = nowSec * 1000;
  const expMs = nowMs + 15 * 60 * 1000;
  const token = `header.${Buffer.from(JSON.stringify({ sub: '1', role, exp: nowSec + 3600 })).toString('base64url')}.sig`;
  const tokenHash = crypto.createHash('sha256').update(token, 'utf8').digest('base64url');
  const payload = {
    v: 'v1',
    role,
    uid: 1,
    th: tokenHash,
    iat: nowMs,
    exp: expMs,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(payloadB64, 'utf8').digest('base64url');
  const seal = `${payloadB64}.${sig}`;
  return [
    { name: 'tripmate_admin_access_token', value: token, domain: 'localhost', path: '/' },
    { name: 'tripmate_admin_session_seal', value: seal, domain: 'localhost', path: '/' },
  ];
}

async function checkOverflow(page, label) {
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  const hasOverflow = scrollWidth > clientWidth;
  if (hasOverflow) {
    console.error(`[OVERFLOW] ${label}: scrollWidth=${scrollWidth} > clientWidth=${clientWidth}`);
  } else {
    console.log(`[OK] ${label}: No horizontal overflow (${clientWidth}px)`);
  }
  return hasOverflow;
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  let totalOverflows = 0;

  for (const vp of VIEWPORTS) {
    console.log(`\n=================== Testing Viewport: ${vp.name} (${vp.width}x${vp.height}) ===================`);
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    await context.addCookies(makeSessionCookies('Administrator'));
    const page = await context.newPage();

    // 1. Administrator Overview
    await page.goto('http://localhost:3008/admin');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(600);
    if (await checkOverflow(page, `Admin Overview (${vp.name})`)) totalOverflows++;
    if (vp.name === 'desktop-1440') {
      await page.screenshot({ path: path.join(OUT_DIR, `admin-overview-${vp.name}.png`), fullPage: true });
    }

    // 2. Administrator Analytics Tab - Revenue Empty State
    await page.goto('http://localhost:3008/admin?tab=analytics');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(600);
    if (await checkOverflow(page, `Admin Analytics Revenue (${vp.name})`)) totalOverflows++;
    await page.screenshot({ path: path.join(OUT_DIR, `admin-analytics-revenue-${vp.name}.png`), fullPage: true });

    // 3. POI Catalog
    await page.goto('http://localhost:3008/admin/catalogue/points-of-interest');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(600);
    if (await checkOverflow(page, `POI Catalog (${vp.name})`)) totalOverflows++;

    // 4. Tour Operator Applications
    await page.goto('http://localhost:3008/admin/tour-operator-applications');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(600);
    if (await checkOverflow(page, `Tour Operator Applications (${vp.name})`)) totalOverflows++;

    // 5. Staff Context
    const staffContext = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    await staffContext.addCookies(makeSessionCookies('Staff'));
    const staffPage = await staffContext.newPage();

    // Staff Overview
    await staffPage.goto('http://localhost:3008/admin/staff');
    await staffPage.waitForLoadState('domcontentloaded');
    await staffPage.waitForTimeout(600);
    if (await checkOverflow(staffPage, `Staff Overview (${vp.name})`)) totalOverflows++;
    if (vp.name === 'desktop-1440') {
      await staffPage.screenshot({ path: path.join(OUT_DIR, `staff-overview-${vp.name}.png`), fullPage: true });
    }

    // Staff Analytics Tab
    await staffPage.goto('http://localhost:3008/admin/staff?tab=analytics');
    await staffPage.waitForLoadState('domcontentloaded');
    await staffPage.waitForTimeout(600);
    if (await checkOverflow(staffPage, `Staff Analytics Workload (${vp.name})`)) totalOverflows++;
    await staffPage.screenshot({ path: path.join(OUT_DIR, `staff-analytics-workload-${vp.name}.png`), fullPage: true });

    // Staff Create POI
    await staffPage.goto('http://localhost:3008/admin/catalogue/points-of-interest/new');
    await staffPage.waitForLoadState('domcontentloaded');
    await staffPage.waitForTimeout(600);
    if (await checkOverflow(staffPage, `Create POI (${vp.name})`)) totalOverflows++;

    await context.close();
    await staffContext.close();
  }

  await browser.close();

  if (totalOverflows > 0) {
    console.error(`\nFAILED: Found ${totalOverflows} horizontal overflows!`);
    process.exit(1);
  } else {
    console.log(`\nALL VISUAL TESTS PASSED! 0 horizontal overflows across all 4 viewports!`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
