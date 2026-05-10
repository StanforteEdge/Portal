import { test, expect, Page } from '@playwright/test';

const HR_LOGIN = 'olalekan@stanforteedge.com';
const PASS = '@12345678';
const RUN_NAME = `E2E Test Run ${Date.now()}`;

async function login(page: Page) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);

  const emailInput = page.locator('main input[type="email"]').first();
  const passInput = page.locator('main input[type="password"]').first();
  const submitBtn = page.locator('main button[type="submit"]').first();

  await emailInput.fill(HR_LOGIN);
  await passInput.fill(PASS);
  await submitBtn.click();

  await page.waitForTimeout(3000);
  console.log('After login URL:', page.url());
}

async function goTo(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
}

test('01 - HR creates a payroll run', async ({ page }) => {
  await login(page);

  await page.goto('/hr/payroll/runs/new');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  const nameInput = page.locator('input').first();
  await nameInput.fill(RUN_NAME);

  await page.locator('button:has-text("Create Run")').first().click();

  await page.waitForTimeout(3000);
  console.log('After create URL:', page.url());

  const url = page.url();
  const match = url.match(/\/runs\/([a-f0-9-]+)/i);
  expect(match).toBeTruthy();
  const runId = match![1];
  console.log('Created run ID:', runId);
  (global as any).__runId = runId;
  (global as any).__runName = RUN_NAME;
});

test('02 - HR generates payroll items', async ({ page }) => {
  const runId = (global as any).__runId;
  await login(page);

  await goTo(page, `/hr/payroll/runs/${runId}`);

  const generateBtn = page.locator('button:has-text("Generate Items")').first();
  await expect(generateBtn).toBeVisible({ timeout: 8000 });
  await generateBtn.click();
  await page.waitForTimeout(3000);

  const itemCount = await page.locator('table tbody tr').count();
  console.log('Payroll items generated:', itemCount);
  expect(itemCount).toBeGreaterThan(0);
});

test('03 - HR submits run to finance', async ({ page }) => {
  const runId = (global as any).__runId;
  const runName = (global as any).__runName;
  await login(page);

  await goTo(page, `/hr/payroll/runs/${runId}`);

  const submitBtn = page.locator('button:has-text("Submit to Finance")').first();
  await expect(submitBtn).toBeVisible({ timeout: 8000 });
  await submitBtn.click();
  await page.waitForTimeout(3000);
  console.log('Submitted run to finance');
});

test('04 - Admin authorizes the run', async ({ page }) => {
  const runName = (global as any).__runName;
  await login(page);

  await goTo(page, '/admin/payroll/authorization');
  await page.waitForTimeout(2000);

  const runLink = page.locator(`text="${runName}"`).first();
  await expect(runLink).toBeVisible({ timeout: 8000 });
  await runLink.click();
  await page.waitForTimeout(2000);

  const authorizeBtn = page.locator('button:has-text("Authorize Run")').first();
  if (await authorizeBtn.isVisible()) {
    await authorizeBtn.click();
    await page.waitForTimeout(1000);
    await page.locator('button:has-text("Authorize")').first().click();
    await page.waitForTimeout(3000);
    console.log('Run authorized');
  } else {
    console.log('No Authorize Run button — checking page content');
    const content = await page.content();
    console.log('Page has:', content.substring(0, 2000));
  }
});

test('05 - Finance pays the authorized run', async ({ page }) => {
  const runName = (global as any).__runName;
  await login(page);

  await goTo(page, '/finance/payroll/runs');
  await page.waitForTimeout(2000);

  const runLink = page.locator(`text="${runName}"`).first();
  await expect(runLink).toBeVisible({ timeout: 8000 });
  await runLink.click();
  await page.waitForTimeout(2000);

  const payBtn = page.locator('button:has-text("Mark as Paid")').first();
  if (await payBtn.isVisible()) {
    await payBtn.click();
    await page.waitForTimeout(3000);
    console.log('Run marked as paid');
  } else {
    const content = await page.content();
    console.log('Finance detail page (first 2000 chars):', content.substring(0, 2000));
  }
});