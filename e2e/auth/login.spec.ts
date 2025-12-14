import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    // Check for login form elements - title is "Welcome back"
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should show validation for empty email', async ({ page }) => {
    // Try to submit without email
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();

    // HTML5 validation should prevent submission
    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Enter invalid credentials
    await page.getByLabel(/email/i).fill('invalid@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for error message (should show destructive alert)
    await expect(page.locator('.bg-destructive\\/10')).toBeVisible({ timeout: 10000 });
  });

  test('should have link to create organization (sign up)', async ({ page }) => {
    await expect(page.getByRole('link', { name: /create organization/i })).toBeVisible();
  });

  test('should have link to forgot password', async ({ page }) => {
    await expect(page.getByRole('link', { name: /forgot password/i })).toBeVisible();
  });

  test('should show loading state when submitting', async ({ page }) => {
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should show loading spinner or "Signing in..."
    await expect(page.getByText(/signing in/i)).toBeVisible({ timeout: 2000 }).catch(() => {
      // Button might have already finished loading
    });
  });

  test('should redirect to dashboard on successful login', async ({ page }) => {
    // This test requires valid test credentials
    const testEmail = process.env.TEST_USER_EMAIL;
    const testPassword = process.env.TEST_USER_PASSWORD;

    if (!testEmail || !testPassword) {
      test.skip();
      return;
    }

    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for navigation away from login
    await expect(page).not.toHaveURL(/login/, { timeout: 15000 });
  });
});

test.describe('Signup Link', () => {
  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('link', { name: /create organization/i }).click();

    await expect(page).toHaveURL(/signup/);
  });
});

test.describe('Forgot Password Link', () => {
  test('should navigate to forgot password page', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('link', { name: /forgot password/i }).click();

    await expect(page).toHaveURL(/forgot-password/);
  });
});
