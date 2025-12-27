import { test, expect } from '../fixtures/base-test';

test('Smoke Verification', async ({ page }) => {
    await page.goto('/');

    // Verify title
    await expect(page).toHaveTitle(/scan2doc/i);

    // Verify main layout elements
    // Verify main layout elements
    await expect(page.locator('.app-container').first()).toBeVisible();
    await expect(page.locator('.app-header').first()).toBeVisible();

    // Verify core business elements (Strict semantic matching)
    await expect(page.getByRole('button', { name: /import files/i })).toBeVisible();

    // Verify Empty State initially
    await expect(page.locator('.empty-state-hero')).toBeVisible();
    await expect(page.getByRole('button', { name: /select files/i })).toBeVisible();

    // Verify core three-column layout is HIDDEN initially
    await expect(page.locator('.page-list-container')).not.toBeVisible();
    await expect(page.locator('.page-viewer-container')).not.toBeVisible();
    await expect(page.locator('.preview-container')).not.toBeVisible();
});
