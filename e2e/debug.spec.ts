import { test, Page } from '@playwright/test';

const HR_LOGIN = 'olalekan@stanforteedge.com';
const PASS = '@12345678';

test('login and take screenshot', async ({ page }) => {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  const pageHTML = await page.content();
  console.log('PAGE HTML (first 3000 chars):\n', pageHTML.substring(0, 3000));

  await page.screenshot({ path: '/tmp/login-page.png', fullPage: true });
  console.log('Screenshot saved to /tmp/login-page.png');

  const inputs = page.locator('input');
  const count = await inputs.count();
  console.log('Total inputs:', count);

  await page.fill('input[type="email"]:first-of-type', HR_LOGIN);
  await page.fill('input[type="password"]:first-of-type', PASS);
  await page.waitForTimeout(500);

  await page.screenshot({ path: '/tmp/after-fill.png', fullPage: true });

  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  await page.screenshot({ path: '/tmp/after-submit.png', fullPage: true });
  console.log('After submit URL:', page.url());
});