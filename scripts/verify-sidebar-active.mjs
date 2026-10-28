import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Log in as Staff via demo session
  await page.goto('http://localhost:3008/admin/login');
  await page.waitForLoadState('domcontentloaded');

  const staffBtn = page.locator('button:has-text("Enter as Staff")');
  await staffBtn.waitFor({ state: 'visible', timeout: 5000 });
  await staffBtn.click();
  await page.waitForURL('**/admin/staff', { timeout: 10000 });
  console.log('Logged in as Staff.');

  // Test 1: On /admin/catalogue/points-of-interest (Catalog page)
  await page.goto('http://localhost:3008/admin/catalogue/points-of-interest');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(500);

  let poiCatalogClass = await page.locator('aside nav a[href="/admin/catalogue/points-of-interest"]').getAttribute('class');
  let createPoiClass = await page.locator('aside nav a[href="/admin/catalogue/points-of-interest/new"]').getAttribute('class');

  console.log('--- Test 1: On Catalog Page ---');
  console.log('POI Catalog isActive (expected TRUE):', poiCatalogClass.includes('bg-[#245747]'));
  console.log('Create POI isActive (expected FALSE):', createPoiClass.includes('bg-[#245747]'));

  if (!poiCatalogClass.includes('bg-[#245747]') || createPoiClass.includes('bg-[#245747]')) {
    throw new Error('Test 1 failed: Catalog page active state mismatch');
  }

  // Test 2: On /admin/catalogue/points-of-interest/new (Create POI page)
  await page.goto('http://localhost:3008/admin/catalogue/points-of-interest/new');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(500);

  poiCatalogClass = await page.locator('aside nav a[href="/admin/catalogue/points-of-interest"]').getAttribute('class');
  createPoiClass = await page.locator('aside nav a[href="/admin/catalogue/points-of-interest/new"]').getAttribute('class');

  console.log('--- Test 2: On Create POI Page ---');
  console.log('POI Catalog isActive (expected FALSE):', poiCatalogClass.includes('bg-[#245747]'));
  console.log('Create POI isActive (expected TRUE):', createPoiClass.includes('bg-[#245747]'));

  if (poiCatalogClass.includes('bg-[#245747]') || !createPoiClass.includes('bg-[#245747]')) {
    throw new Error('Test 2 failed: Create POI active state mismatch');
  }

  // Take screenshot of sidebar on Create POI page
  const sidebar = page.locator('aside');
  await sidebar.screenshot({ path: 'scripts/sidebar-fixed.png' });
  console.log('Screenshot saved to scripts/sidebar-fixed.png');

  await browser.close();
  console.log('ALL TESTS PASSED: Both pages have mutually exclusive, correct active menu indicators!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
