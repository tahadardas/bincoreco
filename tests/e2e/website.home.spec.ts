import { test, expect } from '@playwright/test';

test.describe('Website homepage', () => {
  test('opens Arabic home and shows brand + main navigation', async ({ page }) => {
    await page.goto('/ar');
    await expect(page).toHaveTitle(/Banco Ricco/i);
    await expect(page.locator('text=Banco Ricco').first()).toBeVisible();
  });

  test('renders products/products navigation links', async ({ page }) => {
    await page.goto('/ar');
    const productsLink = page.locator('a[href$="/products"]').first();
    await expect(productsLink).toBeVisible();
  });

  test('Arabic RTL direction is set', async ({ page }) => {
    await page.goto('/ar');
    const dir = await page.evaluate(() => document.documentElement.dir);
    expect(dir).toBe('rtl');
  });
});
