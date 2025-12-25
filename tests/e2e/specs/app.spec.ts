import { test, expect } from '@playwright/test';

test('Smoke Verification', async ({ page }) => {
    await page.goto('/');

    // Verify title
    await expect(page).toHaveTitle(/scan2doc/i);

    // Verify main layout elements
    await expect(page.locator('.app-container')).toBeVisible();
    await expect(page.locator('.app-header')).toBeVisible();
    // Use first() to be robust against potential duplicate elements or transition states
    await expect(page.locator('.page-list-container').first()).toBeVisible();
});
