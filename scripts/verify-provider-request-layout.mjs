import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const baseURL = process.env.TM225_WEB_ORIGIN ?? 'http://localhost:3002';
const email = process.env.TM225_PROVIDER_EMAIL;
const password = process.env.TM225_PROVIDER_PASSWORD;

assert(email && password, 'Set TM225_PROVIDER_EMAIL and TM225_PROVIDER_PASSWORD for an active provider account.');

const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}),
});

try {
  const page = await browser.newPage({ baseURL });
  await page.goto('/sign-in');
  await page.locator('input[type=email]').fill(email);
  await page.locator('input[autocomplete=current-password]').fill(password);
  await page.locator('button[type=submit]').click();
  await page.waitForURL('**/provider/bookings');

  for (const width of [1365, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    const search = page.getByRole('button', { name: 'Search', exact: true });
    const reset = page.getByRole('button', { name: 'Reset', exact: true });
    await reset.waitFor();
    const form = await reset.locator('xpath=ancestor::form').boundingBox();
    assert(form, `Filter form is visible at ${width}px`);

    for (const button of [search, reset]) {
      const bounds = await button.boundingBox();
      assert(bounds, `Filter action is visible at ${width}px`);
      assert(bounds.x >= form.x - 1 && bounds.x + bounds.width <= form.x + form.width + 1,
        `Filter action stays inside its form at ${width}px`);
      assert(bounds.height >= 44, `Filter action has a 44px touch target at ${width}px`);
    }

    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      `Page has no horizontal overflow at ${width}px`);
    console.log(`PASS provider request filter layout at ${width}px`);
  }
} finally {
  await browser.close();
}
