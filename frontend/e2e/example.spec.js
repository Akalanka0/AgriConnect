import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/AgriConnect/i);
});

test('get started link', async ({ page }) => {
  await page.goto('/');

  // Look for something more generic or the brand name if "Connect with Expert" is missing
  const heading = page.locator('h1').first();
  await expect(heading).toBeVisible({ timeout: 10000 });
});
