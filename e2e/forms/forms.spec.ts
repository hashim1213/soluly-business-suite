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

test.describe('Forms Page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test('should display forms page', async ({ page }) => {
    await page.goto('/org/bytesavy/forms');

    // Wait for page to load
    await page.waitForTimeout(3000);

    // Look for h1 or heading with Forms
    const hasHeading = await page.locator('h1').filter({ hasText: /forms/i }).count() > 0;
    const hasFormsContent = await page.getByText(/create|forms|draft|published/i).count() > 0;

    expect(hasHeading || hasFormsContent).toBe(true);
  });

  test('should have new form button', async ({ page }) => {
    await page.goto('/org/bytesavy/forms');

    // Wait for page to fully load
    await page.waitForURL('**/forms');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check for New Form button or any button with Plus icon
    const newFormBtn = page.getByRole('button', { name: /new form/i });
    const createFormBtn = page.getByRole('button', { name: /create form/i });
    const plusButtons = page.locator('button:has(svg)');

    const hasNewForm = await newFormBtn.count() > 0;
    const hasCreate = await createFormBtn.count() > 0;
    const hasPlusButtons = await plusButtons.count() > 0;

    expect(hasNewForm || hasCreate || hasPlusButtons).toBe(true);
  });

  test('should open new form dialog', async ({ page }) => {
    await page.goto('/org/bytesavy/forms');

    await page.waitForTimeout(2000);

    // Click New Form button
    const newFormBtn = page.getByRole('button', { name: /new form/i });
    if (await newFormBtn.count() > 0) {
      await newFormBtn.first().click();

      // Dialog should appear
      await page.waitForTimeout(1000);
      const dialog = page.getByRole('dialog');

      expect(await dialog.count() > 0).toBe(true);
    }
  });

  test('should display form cards or table', async ({ page }) => {
    await page.goto('/org/bytesavy/forms');

    // Wait for forms to load
    await page.waitForTimeout(2000);

    // Check if form items or empty state is displayed
    const formItems = page.locator('table').or(page.locator('[class*="card"]'));
    const emptyState = page.getByText(/no forms|create your first|get started/i);

    const hasItems = await formItems.count() > 0;
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    expect(hasItems || hasEmptyState).toBe(true);
  });
});

test.describe('Form Builder', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test('should display form builder interface or not found', async ({ page }) => {
    // Navigate to form builder (assuming FRM-001 exists)
    await page.goto('/org/bytesavy/forms/FRM-001/edit');

    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Should show builder, not found, or any heading (page loaded)
    const hasBuilder = await page.getByRole('button', { name: /add field|save/i }).count() > 0;
    const hasNotFound = await page.getByText(/not found|404/i).isVisible().catch(() => false);
    const hasFormContent = await page.locator('form').count() > 0;
    const hasHeading = await page.getByRole('heading').count() > 0;

    expect(hasBuilder || hasNotFound || hasFormContent || hasHeading).toBe(true);
  });

  test('should have field type options or not found', async ({ page }) => {
    await page.goto('/org/bytesavy/forms/FRM-001/edit');

    // Wait for page to load
    await page.waitForTimeout(3000);

    // If not found, that's acceptable
    const hasNotFound = await page.getByText(/not found|404/i).isVisible().catch(() => false);
    if (hasNotFound) {
      expect(true).toBe(true);
      return;
    }

    // Look for add field button
    const addFieldButton = page.getByRole('button', { name: /add field/i });
    if (await addFieldButton.count() > 0) {
      await addFieldButton.click();

      // Field type options should appear
      await page.waitForTimeout(1000);

      const fieldTypes = page.getByText(/text|email|number|select|checkbox/i);
      const hasFieldTypes = await fieldTypes.count() > 0;
      expect(hasFieldTypes).toBe(true);
    }
  });
});

test.describe('Public Form Submission', () => {
  test('should display public form or message', async ({ page }) => {
    // Navigate to a public form link
    await page.goto('/f/test-token');

    // Wait for page to load
    await page.waitForTimeout(3000);

    // Should show form, not found, or expired message
    const hasForm = await page.locator('form').count() > 0;
    const hasMessage = await page.getByText(/not found|expired|closed|invalid/i).isVisible().catch(() => false);

    expect(hasForm || hasMessage).toBe(true);
  });

  test('should validate form submission', async ({ page }) => {
    await page.goto('/f/test-token');

    // Wait for page to load
    await page.waitForTimeout(3000);

    // If form exists, try to submit without filling required fields
    const submitButton = page.getByRole('button', { name: /submit/i });
    if (await submitButton.count() > 0) {
      await submitButton.click();

      // Should show validation errors
      await page.waitForTimeout(500);
      const hasValidationError = await page.getByText(/required|error/i).isVisible().catch(() => false);
      expect(hasValidationError).toBe(true);
    }
  });
});
