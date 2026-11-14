import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const BASE_URL = 'http://localhost:3005';
const SECRET = 'Bt4xW2Il6cGP3iuzPx7zYfU5UJgLKn5hGezTU4uOEBQ';

const outDirs = [
  path.resolve('docs/evidence/hotel-flow'),
  path.resolve('C:/Users/PC/.gemini/antigravity/brain/ec3d9b88-c002-496a-8f2f-7dd71dda3105/screenshots'),
];

for (const dir of outDirs) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function generateStaffCookies() {
  const token =
    'header.' +
    Buffer.from(
      JSON.stringify({
        role: 'Staff',
        userId: 99,
        exp: Math.floor(Date.now() / 1000) + 7200,
      })
    ).toString('base64url') +
    '.sig';

  const th = crypto.createHash('sha256').update(token, 'utf8').digest('base64url');
  const iat = Date.now();
  const exp = iat + 14 * 60 * 1000;
  const payload = { v: 'v1', role: 'Staff', uid: 99, th, iat, exp };
  const enc = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto
    .createHmac('sha256', Buffer.from(SECRET, 'base64url'))
    .update('v1.' + enc)
    .digest('base64url');
  const seal = 'v1.' + enc + '.' + sig;

  return [
    {
      name: 'tripmate_admin_access_token',
      value: token,
      url: BASE_URL,
    },
    {
      name: 'tripmate_admin_session_seal',
      value: seal,
      url: BASE_URL,
    },
  ];
}

async function saveScreenshot(page, filename) {
  for (const dir of outDirs) {
    const filePath = path.join(dir, filename);
    await page.screenshot({ path: filePath, fullPage: false });
  }
  console.log(`Saved screenshot: ${filename}`);
}

async function run() {
  console.log('Launching browser for Hotel Flow QA screenshots...');
  const browser = await chromium.launch({ headless: true });

  const viewports = [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'laptop', width: 1280, height: 800 },
    { name: 'tablet', width: 1024, height: 768 },
  ];

  for (const vp of viewports) {
    console.log(`\n--- Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2, // Retina quality
    });

    const staffCookies = generateStaffCookies();
    await context.addCookies(staffCookies);

    const page = await context.newPage();

    // ==========================================
    // SCREEN W102: Staff — Create Service Provider
    // ==========================================
    console.log('Capturing Screen W102...');
    await page.goto(`${BASE_URL}/admin/service-providers/create`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    await saveScreenshot(page, `w102-create-provider-${vp.name}.png`);

    if (vp.name === 'desktop') {
      // Fill out form to show interaction state
      await page.fill('#w102-business-name', 'Hội An Riverside Heritage Resort');
      await page.fill('#w102-rep-name', 'Trần Thị Lan');
      await page.fill('#w102-email', 'lan.tran@hoianriverside.vn');
      await page.fill('#w102-phone', '0905 123 456');
      await page.waitForTimeout(400);
      await saveScreenshot(page, `w102-create-provider-form-filled.png`);

      // Submit form to capture success state
      const submitBtn = page.locator('button[type="submit"]');
      await submitBtn.click();
      await page.waitForTimeout(1200);
      await saveScreenshot(page, `w102-create-provider-success-state.png`);
    }

    // ==========================================
    // SCREEN W103: Provider — Service Booking Requests
    // ==========================================
    console.log('Capturing Screen W103...');
    await page.goto(`${BASE_URL}/provider/bookings`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    await saveScreenshot(page, `w103-booking-requests-${vp.name}.png`);

    if (vp.name === 'desktop') {
      // Search interaction
      await page.fill('#w103-search', 'Trần Minh');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(800);
      await saveScreenshot(page, `w103-booking-requests-search-filtered.png`);

      // Reset
      await page.click('button[aria-label="Reset"]');
      await page.waitForTimeout(800);
    }

    // ==========================================
    // SCREEN W104: Provider — Booking Decision & Outcome
    // ==========================================
    console.log('Capturing Screen W104 (Pending)...');
    await page.goto(`${BASE_URL}/provider/bookings/req-001`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    await saveScreenshot(page, `w104-booking-decision-pending-${vp.name}.png`);

    if (vp.name === 'desktop') {
      // Capture Confirm dialog
      const confirmBtn = page.locator('button:has-text("Confirm Booking")');
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        await page.waitForTimeout(600);
        await saveScreenshot(page, `w104-decision-confirm-dialog.png`);
        // Cancel dialog
        await page.click('button:has-text("Cancel")');
        await page.waitForTimeout(400);
      }

      // Capture Reject dialog
      const rejectBtn = page.locator('button:has-text("Reject Booking")');
      if (await rejectBtn.isVisible()) {
        await rejectBtn.click();
        await page.waitForTimeout(600);
        await saveScreenshot(page, `w104-decision-reject-dialog.png`);
        await page.click('button:has-text("Cancel")');
        await page.waitForTimeout(400);
      }

      // Outcome Recording Screen (req-006: Confirmed & Check-in date passed)
      await page.goto(`${BASE_URL}/provider/bookings/req-006`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1200);
      await saveScreenshot(page, `w104-service-outcome-recording.png`);
    }

    // ==========================================
    // SCREEN W105: Provider — Commission Statements
    // ==========================================
    console.log('Capturing Screen W105...');
    await page.goto(`${BASE_URL}/provider/statements`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    await saveScreenshot(page, `w105-commission-statements-${vp.name}.png`);

    if (vp.name === 'desktop') {
      // Click on stmt-004 to show wire payment reporting form
      const statementRows = page.locator('tbody tr');
      const count = await statementRows.count();
      for (let i = 0; i < count; i++) {
        const text = await statementRows.nth(i).textContent();
        if (text && text.includes('27.750.000')) {
          await statementRows.nth(i).click();
          await page.waitForTimeout(800);
          break;
        }
      }
      await saveScreenshot(page, `w105-wire-transfer-reporting-form.png`);
    }

    // ==========================================
    // SCREEN W106: Staff — Commission Reconciliation
    // ==========================================
    console.log('Capturing Screen W106...');
    await page.goto(`${BASE_URL}/admin/commercial-settlements/reconciliation`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    await saveScreenshot(page, `w106-commission-reconciliation-${vp.name}.png`);

    if (vp.name === 'desktop') {
      // Click Confirm Receipt button on first payment reported row
      const receiptBtn = page.locator('button:has-text("Confirm Receipt")').first();
      if (await receiptBtn.isVisible()) {
        await receiptBtn.click();
        await page.waitForTimeout(600);
        await saveScreenshot(page, `w106-reconciliation-confirm-modal.png`);
        await page.click('button:has-text("Cancel")');
        await page.waitForTimeout(400);
      }
    }

    await context.close();
  }

  await browser.close();
  console.log('\nAll high-resolution screenshots captured successfully!');
}

run().catch((err) => {
  console.error('Error during screenshot capture:', err);
  process.exit(1);
});
