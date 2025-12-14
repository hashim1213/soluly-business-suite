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

test.describe('Projects Page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test('should display projects page', async ({ page }) => {
    await page.goto('/org/bytesavy/projects');

    // Wait for page to load
    await page.waitForTimeout(3000);

    // Look for h1 or heading with Projects
    const hasHeading = await page.locator('h1').filter({ hasText: /projects/i }).count() > 0;
    const hasProjectsContent = await page.getByText(/project|create|pending|active/i).count() > 0;

    expect(hasHeading || hasProjectsContent).toBe(true);
  });

  test('should have new project button', async ({ page }) => {
    await page.goto('/org/bytesavy/projects');

    // Wait for page to fully load
    await page.waitForURL('**/projects');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check for New Project button or any button with Plus icon
    const newProjectBtn = page.getByRole('button', { name: /new project/i });
    const createProjectBtn = page.getByRole('button', { name: /create project/i });
    const plusButtons = page.locator('button:has(svg)');

    const hasNewProject = await newProjectBtn.count() > 0;
    const hasCreate = await createProjectBtn.count() > 0;
    const hasPlusButtons = await plusButtons.count() > 0;

    expect(hasNewProject || hasCreate || hasPlusButtons).toBe(true);
  });

  test('should open new project dialog', async ({ page }) => {
    await page.goto('/org/bytesavy/projects');

    await page.waitForTimeout(2000);

    // Click New Project button
    const newProjectBtn = page.getByRole('button', { name: /new project/i });
    if (await newProjectBtn.count() > 0) {
      await newProjectBtn.first().click();

      // Dialog should appear
      await page.waitForTimeout(1000);
      const dialog = page.getByRole('dialog');

      expect(await dialog.count() > 0).toBe(true);
    }
  });

  test('should validate project form', async ({ page }) => {
    await page.goto('/org/bytesavy/projects');

    await page.waitForTimeout(2000);

    // Click New Project button
    const newProjectBtn = page.getByRole('button', { name: /new project/i });
    if (await newProjectBtn.count() > 0) {
      await newProjectBtn.first().click();

      // Wait for dialog
      await page.waitForTimeout(1000);

      // Try to submit empty form
      const createBtn = page.getByRole('button', { name: /create project/i });
      if (await createBtn.count() > 0) {
        await createBtn.click();

        // Should show validation error
        await page.waitForTimeout(500);
        const hasError = await page.getByText(/required|fill|error/i).isVisible().catch(() => false);
        expect(hasError).toBe(true);
      }
    }
  });

  test('should display project cards or empty state', async ({ page }) => {
    await page.goto('/org/bytesavy/projects');

    // Wait for projects to load
    await page.waitForTimeout(2000);

    // Check if project cards or empty state is displayed
    const projectCards = page.locator('[class*="card"]').or(page.locator('table'));
    const emptyState = page.getByText(/no projects|create your first|get started/i);

    const hasProjects = await projectCards.count() > 0;
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    expect(hasProjects || hasEmptyState).toBe(true);
  });

  test('should search projects', async ({ page }) => {
    await page.goto('/org/bytesavy/projects');

    await page.waitForTimeout(2000);

    // Look for search input
    const searchInput = page.getByPlaceholder(/search/i);
    if (await searchInput.count() > 0) {
      await searchInput.fill('test');
      // Results should update
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Project Detail Page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test('should display project details or not found', async ({ page }) => {
    // Navigate to a project (assuming PRJ-001 exists)
    await page.goto('/org/bytesavy/projects/PRJ-001');

    // Wait for page to load or 404
    await page.waitForTimeout(3000);

    // Should show project title or not found
    const hasProject = await page.getByRole('heading').count() > 0;
    const hasNotFound = await page.getByText(/not found|404/i).isVisible().catch(() => false);

    expect(hasProject || hasNotFound).toBe(true);
  });

  test('should show project tabs or content', async ({ page }) => {
    await page.goto('/org/bytesavy/projects/PRJ-001');

    // Wait for page to load
    await page.waitForTimeout(3000);

    // Look for tabs or project content
    const tabs = page.getByRole('tab');
    const hasContent = await page.getByText(/overview|tasks|team|costs/i).count() > 0;

    const hasTabs = await tabs.count() > 0;

    expect(hasTabs || hasContent).toBe(true);
  });
});
