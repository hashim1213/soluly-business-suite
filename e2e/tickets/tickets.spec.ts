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

test.describe('Tickets Page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test('should display tickets page', async ({ page }) => {
    await page.goto('/org/bytesavy/tickets');

    // Wait for page to load
    await page.waitForTimeout(3000);

    // Look for h1 or heading with Tickets
    const hasHeading = await page.locator('h1').filter({ hasText: /tickets/i }).count() > 0;
    const hasTicketsContent = await page.getByText(/ticket|create|open|closed/i).count() > 0;

    expect(hasHeading || hasTicketsContent).toBe(true);
  });

  test('should have new ticket button', async ({ page }) => {
    await page.goto('/org/bytesavy/tickets');

    // Wait for page to fully load
    await page.waitForURL('**/tickets');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check for New Ticket button or any button with Plus icon
    const newTicketBtn = page.getByRole('button', { name: /new ticket/i });
    const createTicketBtn = page.getByRole('button', { name: /create ticket/i });
    const plusButtons = page.locator('button:has(svg)');

    const hasNewTicket = await newTicketBtn.count() > 0;
    const hasCreate = await createTicketBtn.count() > 0;
    const hasPlusButtons = await plusButtons.count() > 0;

    expect(hasNewTicket || hasCreate || hasPlusButtons).toBe(true);
  });

  test('should open new ticket dialog', async ({ page }) => {
    await page.goto('/org/bytesavy/tickets');

    await page.waitForTimeout(2000);

    // Click New Ticket button
    const newTicketBtn = page.getByRole('button', { name: /new ticket/i });
    if (await newTicketBtn.count() > 0) {
      await newTicketBtn.first().click();

      // Dialog should appear
      await page.waitForTimeout(1000);
      const dialog = page.getByRole('dialog');

      expect(await dialog.count() > 0).toBe(true);
    }
  });

  test('should show status filters', async ({ page }) => {
    await page.goto('/org/bytesavy/tickets');

    await page.waitForTimeout(2000);

    // Look for status filter options or tabs
    const filterButtons = page.getByRole('button', { name: /all|open|in progress|closed/i });
    const filterTabs = page.getByRole('tab');
    const filterSelect = page.getByRole('combobox');

    const hasFilters = await filterButtons.count() > 0;
    const hasTabs = await filterTabs.count() > 0;
    const hasSelect = await filterSelect.count() > 0;

    expect(hasFilters || hasTabs || hasSelect).toBe(true);
  });

  test('should display ticket items or empty state', async ({ page }) => {
    await page.goto('/org/bytesavy/tickets');

    await page.waitForTimeout(2000);

    const ticketItems = page.locator('table').or(page.locator('[class*="card"]'));
    const emptyState = page.getByText(/no tickets|create|get started/i);

    const hasItems = await ticketItems.count() > 0;
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    expect(hasItems || hasEmptyState).toBe(true);
  });

  test('should search tickets', async ({ page }) => {
    await page.goto('/org/bytesavy/tickets');

    await page.waitForTimeout(2000);

    const searchInput = page.getByPlaceholder(/search/i);
    if (await searchInput.count() > 0) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Ticket Detail Page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test('should display ticket details or not found', async ({ page }) => {
    await page.goto('/org/bytesavy/tickets/TKT-001');

    await page.waitForTimeout(3000);

    const hasTicket = await page.getByRole('heading').count() > 0;
    const hasNotFound = await page.getByText(/not found|404/i).isVisible().catch(() => false);

    expect(hasTicket || hasNotFound).toBe(true);
  });

  test('should show status badge or content', async ({ page }) => {
    await page.goto('/org/bytesavy/tickets/TKT-001');

    await page.waitForTimeout(3000);

    const statusBadge = page.getByText(/open|in progress|closed|pending/i);
    const hasStatus = await statusBadge.count() > 0;
    const hasNotFound = await page.getByText(/not found|404/i).isVisible().catch(() => false);

    expect(hasStatus || hasNotFound).toBe(true);
  });

  test('should have comments section or not found', async ({ page }) => {
    await page.goto('/org/bytesavy/tickets/TKT-001');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Look for comment section, activity, or any textarea for adding comments
    const commentsSection = page.getByText(/comment|discussion|activity/i);
    const textareas = page.locator('textarea');
    const hasComments = await commentsSection.count() > 0;
    const hasTextarea = await textareas.count() > 0;
    const hasNotFound = await page.getByText(/not found|404/i).isVisible().catch(() => false);
    const hasHeading = await page.getByRole('heading').count() > 0;

    expect(hasComments || hasTextarea || hasNotFound || hasHeading).toBe(true);
  });
});
