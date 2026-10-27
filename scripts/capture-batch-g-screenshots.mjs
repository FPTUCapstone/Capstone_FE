import { chromium } from 'playwright';
import { mkdirSync, copyFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE_URL = 'http://localhost:3001';
const OUT_DIR = resolve(process.cwd(), 'reports/evidence/batch-g');
const ARTIFACT_DIR = 'C:/Users/asus/.gemini/antigravity/brain/b95f04a2-0b7b-4f8e-93c1-30e8c7ccc056/evidence';

mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(ARTIFACT_DIR, { recursive: true });

const VIEWPORTS = [
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '375x812', width: 375, height: 812 },
];

const PUBLIC_PAGES = [
  { id: 'sign-in', path: '/sign-in', desc: 'Sign In (UC-04, Screen #36)' },
  { id: 'register', path: '/register', desc: 'Traveler Registration (UC-01, Screen #38)' },
  { id: 'verify-account', path: '/verify-account?email=traveler%40tripmate.com', desc: 'Confirm Email Instruction (UC-01, Screen #39)' },
  { id: 'partner-register', path: '/partner/register', desc: 'Tour Operator Registration (UC-02, Screen #40)' },
  { id: 'forgot-password', path: '/forgot-password', desc: 'Password Reset (UC-06, Screen #42)' },
  { id: 'admin-login', path: '/admin/login', desc: 'Admin Login Isolation (Screen #2)' },
  { id: 'admin-forgot-password', path: '/admin/forgot-password', desc: 'Admin Password Recovery (Screen #3)' },
];

async function capture() {
  const browser = await chromium.launch({ headless: true });
  console.log('Browser launched. Starting screenshot capture...');

  for (const vp of VIEWPORTS) {
    console.log(`\n=== Viewport: ${vp.name} (${vp.width}x${vp.height}) ===`);

    // 1. Capture Public Pages (Guest mode)
    for (const target of PUBLIC_PAGES) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
      });
      const page = await context.newPage();

      try {
        await page.goto(`${BASE_URL}${target.path}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForTimeout(1000);

        const filename = `${target.id}-${vp.name}.png`;
        const filePath = resolve(OUT_DIR, filename);
        await page.screenshot({ path: filePath, fullPage: true });

        // Copy to artifact directory for easy UI viewing
        const artifactPath = resolve(ARTIFACT_DIR, filename);
        copyFileSync(filePath, artifactPath);

        console.log(`✓ Captured ${target.id} (${vp.name}) -> ${filename}`);
      } catch (err) {
        console.error(`✗ Error capturing ${target.id} on ${vp.name}:`, err.message);
      } finally {
        await context.close();
      }
    }

    // 2. Capture Partner Application Status (Pending Review)
    {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
      });

      // Intercept auth refresh
      await context.route('**/auth/web/refresh', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            userId: 88,
            email: 'operator@saigontourist.vn',
            fullName: 'Nguyen Van Operator',
            role: 'TourOperator',
            status: 'Active',
            applicationStatus: 'PendingApproval',
            applicationUnresolved: false,
            accessToken: 'mock-access-token-operator',
            accessTokenExpiresAtUtc: new Date(Date.now() + 3600000).toISOString(),
          }),
        });
      });

      // Intercept application fetch
      await context.route('**/api/operator/application', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            userId: 88,
            userStatus: 'PendingApproval',
            approvalStatus: 'PendingApproval',
            companyName: 'Saigon Tourist Corporation',
            businessLicenseNo: '79-0123/2026/TCDL-GPLHQT',
            taxCode: '0315678901',
            businessAddress: '123 Le Loi, District 1, Ho Chi Minh City',
            contactPerson: 'Nguyen Van Operator',
            contactPhone: '0901234567',
            rejectionReason: null,
            reviewedAtUtc: null,
            resubmissionCount: 0,
            documents: [
              {
                documentId: 101,
                documentType: 'BusinessLicense',
                status: 'Submitted',
                uploadedAtUtc: '2026-10-25T10:00:00Z',
                downloadUrl: null,
                downloadUrlExpiresAtUtc: null,
              },
            ],
          }),
        });
      });

      const page = await context.newPage();
      try {
        await page.goto(`${BASE_URL}/partner/application`, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForTimeout(1000);

        const filename = `partner-application-${vp.name}.png`;
        const filePath = resolve(OUT_DIR, filename);
        await page.screenshot({ path: filePath, fullPage: true });

        const artifactPath = resolve(ARTIFACT_DIR, filename);
        copyFileSync(filePath, artifactPath);

        console.log(`✓ Captured partner-application (${vp.name}) -> ${filename}`);
      } catch (err) {
        console.error(`✗ Error capturing partner-application on ${vp.name}:`, err.message);
      } finally {
        await context.close();
      }
    }

    // 3. Capture Partner Application Resubmit (Rejected State)
    {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
      });

      // Intercept auth refresh as Rejected
      await context.route('**/auth/web/refresh', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            userId: 88,
            email: 'operator@saigontourist.vn',
            fullName: 'Nguyen Van Operator',
            role: 'TourOperator',
            status: 'Active',
            applicationStatus: 'Rejected',
            applicationUnresolved: false,
            accessToken: 'mock-access-token-operator',
            accessTokenExpiresAtUtc: new Date(Date.now() + 3600000).toISOString(),
          }),
        });
      });

      // Intercept application fetch with rejection reason
      await context.route('**/api/operator/application', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            userId: 88,
            userStatus: 'Rejected',
            approvalStatus: 'Rejected',
            companyName: 'Saigon Tourist Corporation',
            businessLicenseNo: '79-0123/2026/TCDL-GPLHQT',
            taxCode: '0315678901',
            businessAddress: '123 Le Loi, District 1, Ho Chi Minh City',
            contactPerson: 'Nguyen Van Operator',
            contactPhone: '0901234567',
            rejectionReason: 'The uploaded business licence document is unreadable/blurred. Please provide a clear scanned copy.',
            reviewedAtUtc: '2026-10-25T14:30:00Z',
            resubmissionCount: 1,
            documents: [
              {
                documentId: 101,
                documentType: 'BusinessLicense',
                status: 'Rejected',
                uploadedAtUtc: '2026-10-24T09:00:00Z',
                downloadUrl: null,
                downloadUrlExpiresAtUtc: null,
              },
            ],
          }),
        });
      });

      const page = await context.newPage();
      try {
        await page.goto(`${BASE_URL}/partner/application/resubmit`, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForTimeout(1000);

        const filename = `partner-application-resubmit-${vp.name}.png`;
        const filePath = resolve(OUT_DIR, filename);
        await page.screenshot({ path: filePath, fullPage: true });

        const artifactPath = resolve(ARTIFACT_DIR, filename);
        copyFileSync(filePath, artifactPath);

        console.log(`✓ Captured partner-application-resubmit (${vp.name}) -> ${filename}`);
      } catch (err) {
        console.error(`✗ Error capturing partner-application-resubmit on ${vp.name}:`, err.message);
      } finally {
        await context.close();
      }
    }
  }

  await browser.close();
  console.log('\nAll Batch G screenshot captures completed successfully!');
}

capture().catch((err) => {
  console.error('Capture script failed:', err);
  process.exit(1);
});
