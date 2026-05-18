# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: payroll-e2e.spec.ts >> 03 - HR submits run to finance
- Location: e2e/payroll-e2e.spec.ts:70:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('button:has-text("Submit to Finance")').first()
Expected: visible
Timeout: 8000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 8000ms
  - waiting for locator('button:has-text("Submit to Finance")').first()

```

# Page snapshot

```yaml
- main [ref=e3]:
  - generic [ref=e4]:
    - img "Stanforte Edge" [ref=e6]
    - generic [ref=e7]:
      - generic [ref=e8]: Support
      - generic [ref=e9]: Documentation
  - generic [ref=e11]:
    - generic [ref=e12]:
      - heading "Staff Portal Access" [level=1] [ref=e13]
      - paragraph [ref=e14]: Secure login for authorized Stanforte Edge personnel.
      - generic [ref=e15]:
        - generic [ref=e16]:
          - generic [ref=e17]: Work Email
          - generic [ref=e18]:
            - generic: mail
            - textbox "Work Email" [ref=e19]:
              - /placeholder: name@stanforteedge.com
        - generic [ref=e20]:
          - generic [ref=e21]:
            - generic [ref=e22]: Password
            - link "Forgot Password?" [ref=e23] [cursor=pointer]:
              - /url: /forgot-password
          - generic [ref=e24]:
            - generic: lock
            - textbox "Password Forgot Password? Show password" [ref=e25]:
              - /placeholder: ••••••••
            - button "Show password" [ref=e26] [cursor=pointer]:
              - generic [ref=e27]: visibility
        - button "Log In" [ref=e28] [cursor=pointer]:
          - text: Log In
          - generic [ref=e29]: arrow_forward
    - complementary [ref=e30]:
      - generic [ref=e31]:
        - heading "One Portal, Daily Workflows" [level=2] [ref=e32]
        - paragraph [ref=e33]: Handle staff requests, attendance, and approvals in one secure workspace built for multi-organization teams.
        - generic [ref=e34]:
          - article [ref=e35]:
            - generic [ref=e36]:
              - generic [ref=e38]: assignment
              - generic [ref=e39]:
                - heading "Requests & Approvals" [level=3] [ref=e40]
                - paragraph [ref=e41]: Submit, review, and track request decisions end-to-end.
          - article [ref=e42]:
            - generic [ref=e43]:
              - generic [ref=e45]: pending_actions
              - generic [ref=e46]:
                - heading "Attendance Ops" [level=3] [ref=e47]
                - paragraph [ref=e48]: Clock-in, corrections, and exceptions with clear audit trails.
          - article [ref=e49]:
            - generic [ref=e50]:
              - generic [ref=e52]: security
              - generic [ref=e53]:
                - heading "Security by Default" [level=3] [ref=e54]
                - paragraph [ref=e55]: Session protection, role controls, and monitored access.
```

# Test source

```ts
  1   | import { test, expect, Page } from '@playwright/test';
  2   | 
  3   | const HR_LOGIN = 'olalekan@stanforteedge.com';
  4   | const PASS = '@12345678';
  5   | const RUN_NAME = `E2E Test Run ${Date.now()}`;
  6   | 
  7   | async function login(page: Page) {
  8   |   await page.goto('/login');
  9   |   await page.waitForLoadState('networkidle');
  10  |   await page.waitForTimeout(1500);
  11  | 
  12  |   const emailInput = page.locator('main input[type="email"]').first();
  13  |   const passInput = page.locator('main input[type="password"]').first();
  14  |   const submitBtn = page.locator('main button[type="submit"]').first();
  15  | 
  16  |   await emailInput.fill(HR_LOGIN);
  17  |   await passInput.fill(PASS);
  18  |   await submitBtn.click();
  19  | 
  20  |   await page.waitForTimeout(3000);
  21  |   console.log('After login URL:', page.url());
  22  | }
  23  | 
  24  | async function goTo(page: Page, path: string) {
  25  |   await page.goto(path);
  26  |   await page.waitForLoadState('networkidle');
  27  |   await page.waitForTimeout(1500);
  28  | }
  29  | 
  30  | test('01 - HR creates a payroll run', async ({ page }) => {
  31  |   await login(page);
  32  | 
  33  |   await page.goto('/hr/payroll/runs/new');
  34  |   await page.waitForLoadState('networkidle');
  35  |   await page.waitForTimeout(2000);
  36  | 
  37  |   const nameInput = page.locator('input').first();
  38  |   await nameInput.fill(RUN_NAME);
  39  | 
  40  |   await page.locator('button:has-text("Create Run")').first().click();
  41  | 
  42  |   await page.waitForTimeout(3000);
  43  |   console.log('After create URL:', page.url());
  44  | 
  45  |   const url = page.url();
  46  |   const match = url.match(/\/runs\/([a-f0-9-]+)/i);
  47  |   expect(match).toBeTruthy();
  48  |   const runId = match![1];
  49  |   console.log('Created run ID:', runId);
  50  |   (global as any).__runId = runId;
  51  |   (global as any).__runName = RUN_NAME;
  52  | });
  53  | 
  54  | test('02 - HR generates payroll items', async ({ page }) => {
  55  |   const runId = (global as any).__runId;
  56  |   await login(page);
  57  | 
  58  |   await goTo(page, `/hr/payroll/runs/${runId}`);
  59  | 
  60  |   const generateBtn = page.locator('button:has-text("Generate Items")').first();
  61  |   await expect(generateBtn).toBeVisible({ timeout: 8000 });
  62  |   await generateBtn.click();
  63  |   await page.waitForTimeout(3000);
  64  | 
  65  |   const itemCount = await page.locator('table tbody tr').count();
  66  |   console.log('Payroll items generated:', itemCount);
  67  |   expect(itemCount).toBeGreaterThan(0);
  68  | });
  69  | 
  70  | test('03 - HR submits run to finance', async ({ page }) => {
  71  |   const runId = (global as any).__runId;
  72  |   const runName = (global as any).__runName;
  73  |   await login(page);
  74  | 
  75  |   await goTo(page, `/hr/payroll/runs/${runId}`);
  76  | 
  77  |   const submitBtn = page.locator('button:has-text("Submit to Finance")').first();
> 78  |   await expect(submitBtn).toBeVisible({ timeout: 8000 });
      |                           ^ Error: expect(locator).toBeVisible() failed
  79  |   await submitBtn.click();
  80  |   await page.waitForTimeout(3000);
  81  |   console.log('Submitted run to finance');
  82  | });
  83  | 
  84  | test('04 - Admin authorizes the run', async ({ page }) => {
  85  |   const runName = (global as any).__runName;
  86  |   await login(page);
  87  | 
  88  |   await goTo(page, '/admin/payroll/authorization');
  89  |   await page.waitForTimeout(2000);
  90  | 
  91  |   const runLink = page.locator(`text="${runName}"`).first();
  92  |   await expect(runLink).toBeVisible({ timeout: 8000 });
  93  |   await runLink.click();
  94  |   await page.waitForTimeout(2000);
  95  | 
  96  |   const authorizeBtn = page.locator('button:has-text("Authorize Run")').first();
  97  |   if (await authorizeBtn.isVisible()) {
  98  |     await authorizeBtn.click();
  99  |     await page.waitForTimeout(1000);
  100 |     await page.locator('button:has-text("Authorize")').first().click();
  101 |     await page.waitForTimeout(3000);
  102 |     console.log('Run authorized');
  103 |   } else {
  104 |     console.log('No Authorize Run button — checking page content');
  105 |     const content = await page.content();
  106 |     console.log('Page has:', content.substring(0, 2000));
  107 |   }
  108 | });
  109 | 
  110 | test('05 - Finance pays the authorized run', async ({ page }) => {
  111 |   const runName = (global as any).__runName;
  112 |   await login(page);
  113 | 
  114 |   await goTo(page, '/finance/payroll/runs');
  115 |   await page.waitForTimeout(2000);
  116 | 
  117 |   const runLink = page.locator(`text="${runName}"`).first();
  118 |   await expect(runLink).toBeVisible({ timeout: 8000 });
  119 |   await runLink.click();
  120 |   await page.waitForTimeout(2000);
  121 | 
  122 |   const payBtn = page.locator('button:has-text("Mark as Paid")').first();
  123 |   if (await payBtn.isVisible()) {
  124 |     await payBtn.click();
  125 |     await page.waitForTimeout(3000);
  126 |     console.log('Run marked as paid');
  127 |   } else {
  128 |     const content = await page.content();
  129 |     console.log('Finance detail page (first 2000 chars):', content.substring(0, 2000));
  130 |   }
  131 | });
```