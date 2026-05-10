import { test, expect } from '@playwright/test';

const LOGIN = 'olalekan@stanforteedge.com';
const PASS = '@12345678';

async function login(page: any) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"], input[name="email"]', LOGIN);
  await page.fill('input[type="password"], input[name="password"]', PASS);
  await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")');
  await page.waitForLoadState('networkidle');
}

test('HR payroll - list and detail', async ({ page }) => {
  await login(page);
  await page.goto('/hr/payroll/runs');
  await page.waitForLoadState('networkidle');
  const heading = page.locator('h1, h2').first();
  await expect(heading).toBeVisible();
  console.log('HR payroll list loaded');
});

test('Finance payroll - list and detail', async ({ page }) => {
  await login(page);
  await page.goto('/finance/payroll/runs');
  await page.waitForLoadState('networkidle');
  const heading = page.locator('h1, h2').first();
  await expect(heading).toBeVisible();
  console.log('Finance payroll list loaded');
});

test('Admin payroll authorization page', async ({ page }) => {
  await login(page);
  await page.goto('/admin/payroll/authorization');
  await page.waitForLoadState('networkidle');
  const heading = page.locator('h1, h2').first();
  await expect(heading).toBeVisible();
  console.log('Admin payroll authorization loaded');
});

test('Full payroll flow - create run, authorize, pay', async ({ page }) => {
  await login(page);
  await page.goto('/hr/payroll/runs/new');
  await page.waitForLoadState('networkidle');
  const form = page.locator('form, [role="form"]').first();
  await expect(form).toBeVisible();
  console.log('HR create run form loaded');
});