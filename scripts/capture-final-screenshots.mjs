import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE_URL = 'http://localhost:3008';
const OUT_DIR = resolve(process.cwd(), 'docs/ux/admin/screenshots/final');
mkdirSync(OUT_DIR, { recursive: true });

const VIEWPORTS = [
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'laptop-1024', width: 1024, height: 768 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'mobile-375', width: 375, height: 812 },
];

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const vp of VIEWPORTS) {
    console.log(`\n=== Testing Viewport: ${vp.name} (${vp.width}x${vp.height}) ===`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    // 1. Staff Session Login
    await page.goto(`${BASE_URL}/admin/login`);
    await page.waitForLoadState('networkidle');
    const staffResponse = await page.request.post(`${BASE_URL}/api/admin/demo-session`, {
      data: { role: 'Staff' },
    });
    console.log('Staff demo login status:', staffResponse.status());

    // 2. Staff Dashboard (/admin/staff)
    await page.goto(`${BASE_URL}/admin/staff`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    const staffOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    const staffShotPath = `${OUT_DIR}/staff-dashboard-${vp.name}.png`;
    await page.screenshot({ path: staffShotPath, fullPage: true });
    results.push({
      page: '/admin/staff',
      viewport: vp.name,
      horizontalOverflow: staffOverflow,
      path: staffShotPath,
    });
    console.log(`Captured /admin/staff on ${vp.name} (Overflow: ${staffOverflow})`);

    // 3. Create POI Screen (/admin/catalogue/points-of-interest/new)
    await page.goto(`${BASE_URL}/admin/catalogue/points-of-interest/new`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    const poiOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    const poiShotPath = `${OUT_DIR}/create-poi-${vp.name}.png`;
    await page.screenshot({ path: poiShotPath, fullPage: true });
    results.push({
      page: '/admin/catalogue/points-of-interest/new',
      viewport: vp.name,
      horizontalOverflow: poiOverflow,
      path: poiShotPath,
    });
    console.log(`Captured /admin/catalogue/points-of-interest/new on ${vp.name} (Overflow: ${poiOverflow})`);

    // 4. Switch to Administrator Session Login
    const adminResponse = await page.request.post(`${BASE_URL}/api/admin/demo-session`, {
      data: { role: 'Administrator' },
    });
    console.log('Administrator demo login status:', adminResponse.status());

    // 5. Administrator Dashboard with Analytics toggled on
    await page.goto(`${BASE_URL}/admin?analytics=1`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    const adminOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    const adminShotPath = `${OUT_DIR}/admin-dashboard-with-charts-${vp.name}.png`;
    await page.screenshot({ path: adminShotPath, fullPage: true });
    results.push({
      page: '/admin?analytics=1',
      viewport: vp.name,
      horizontalOverflow: adminOverflow,
      path: adminShotPath,
    });
    console.log(`Captured /admin?analytics=1 on ${vp.name} (Overflow: ${adminOverflow})`);

    await context.close();
  }

  await browser.close();
  console.log('\n=== VISUAL REGRESSION & OVERFLOW SUMMARY ===');
  console.log(JSON.stringify(results, null, 2));
}

capture().catch((err) => {
  console.error('Capture failed:', err);
  process.exit(1);
});
