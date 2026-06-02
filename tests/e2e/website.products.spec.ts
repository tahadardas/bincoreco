import { test, expect } from '@playwright/test';

test.describe('Website product browsing', () => {
  test('products page loads without crashing', async ({ page }) => {
    await page.goto('/ar/products');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('products page has main content area', async ({ page }) => {
    await page.goto('/ar/products');
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});
