import { test, expect } from '@playwright/test';

test.describe('Mobile header drawer', () => {
  test.use({ viewport: { width: 414, height: 800 } });

  test('mobile menu toggle is visible on small viewport', async ({ page }) => {
    await page.goto('/ar');
    const toggle = page.locator('.br-menu-toggle');
    await expect(toggle).toBeVisible();
  });

  test('clicking toggle opens the drawer', async ({ page }) => {
    await page.goto('/ar');
    const toggle = page.locator('.br-menu-toggle');
    await toggle.click();
    await expect(page.locator('.br-mobile-drawer.is-open')).toBeVisible();
  });

  test('Escape closes the drawer', async ({ page }) => {
    await page.goto('/ar');
    const toggle = page.locator('.br-menu-toggle');
    await toggle.click();
    await expect(page.locator('.br-mobile-drawer.is-open')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.br-mobile-drawer.is-open')).toHaveCount(0);
  });
});
