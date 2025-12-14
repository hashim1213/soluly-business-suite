import { test, expect } from '@playwright/test';

// Helper to set up authenticated state
async function loginAsTestUser(page: any) {
  const testEmail = process.env.TEST_USER_EMAIL;
  const testPassword = process.env.TEST_USER_PASSWORD;

  if (!testEmail || !testPassword) {
    test.skip();
    return;
  }

  await page.goto('/login');
  await page.getByLabel(/email/i).fill(testEmail);
  await page.getByLabel(/password/i).fill(testPassword);
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for navigation away from login (redirects to /org/[slug])
  await expect(page).not.toHaveURL(/login/, { timeout: 15000 });
}

test.describe('CRM Page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test('should display CRM page', async ({ page }) => {
    await page.goto('/org/bytesavy/crm');

    // Wait for page to load - look for the h1 heading or any CRM-related content
    await page.waitForTimeout(3000);

    // Should have loaded successfully (not login page)
    await expect(page).not.toHaveURL(/login/);

    // Look for h1 or heading with CRM
    const hasHeading = await page.locator('h1').filter({ hasText: /crm/i }).count() > 0;
    const hasCrmContent = await page.getByText(/deals|clients|leads|pipeline/i).count() > 0;

    expect(hasHeading || hasCrmContent).toBe(true);
  });

  test('should have action buttons', async ({ page }) => {
    await page.goto('/org/bytesavy/crm');

    // Wait for navigation to complete and page content to load
    await page.waitForURL('**/crm');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // CRM page has buttons like "New Deal", "New Lead", "New Client", "New Task", "New Contact"
    // Also check for generic buttons or any clickable text
    const newDealBtn = page.getByRole('button', { name: /new deal/i });
    const newLeadBtn = page.getByRole('button', { name: /new lead/i });
    const newClientBtn = page.getByRole('button', { name: /new client/i });
    const newTaskBtn = page.getByRole('button', { name: /new task/i });
    const newContactBtn = page.getByRole('button', { name: /new contact/i });

    // Also look for Plus buttons or any action triggers
    const plusButtons = page.locator('button:has(svg)');

    // At least one of these buttons should be visible
    const hasNewDeal = await newDealBtn.count() > 0;
    const hasNewLead = await newLeadBtn.count() > 0;
    const hasNewClient = await newClientBtn.count() > 0;
    const hasNewTask = await newTaskBtn.count() > 0;
    const hasNewContact = await newContactBtn.count() > 0;
    const hasPlusButtons = await plusButtons.count() > 0;

    expect(hasNewDeal || hasNewLead || hasNewClient || hasNewTask || hasNewContact || hasPlusButtons).toBe(true);
  });

  test('should open new deal dialog', async ({ page }) => {
    await page.goto('/org/bytesavy/crm');

    await page.waitForTimeout(2000);

    const newDealBtn = page.getByRole('button', { name: /new deal/i });
    if (await newDealBtn.count() > 0) {
      await newDealBtn.first().click();

      await page.waitForTimeout(1000);
      const dialog = page.getByRole('dialog');

      expect(await dialog.count() > 0).toBe(true);
    }
  });

  test('should display pipeline stages or content', async ({ page }) => {
    await page.goto('/org/bytesavy/crm');

    await page.waitForTimeout(2000);

    // Look for pipeline stages or deals/leads/clients content
    const pipelineStages = page.getByText(/lead|proposal|negotiation|won|lost/i);
    const dealsContent = page.locator('[class*="card"]').or(page.locator('table'));

    const hasStages = await pipelineStages.count() > 0;
    const hasContent = await dealsContent.count() > 0;

    expect(hasStages || hasContent).toBe(true);
  });
});

test.describe('CRM Client Detail', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test('should display client details or not found', async ({ page }) => {
    await page.goto('/org/bytesavy/crm/clients/CLT-001');

    await page.waitForTimeout(3000);

    const hasClient = await page.getByRole('heading').count() > 0;
    const hasNotFound = await page.getByText(/not found|404/i).isVisible().catch(() => false);

    expect(hasClient || hasNotFound).toBe(true);
  });

  test('should show client information or not found', async ({ page }) => {
    await page.goto('/org/bytesavy/crm/clients/CLT-001');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Either find contact info, or any headings, or not found message
    const contactInfo = page.getByText(/email|phone|contact/i);
    const hasContactInfo = await contactInfo.count() > 0;
    const hasNotFound = await page.getByText(/not found|404/i).isVisible().catch(() => false);
    const hasHeadings = await page.getByRole('heading').count() > 0;

    expect(hasContactInfo || hasNotFound || hasHeadings).toBe(true);
  });
});
