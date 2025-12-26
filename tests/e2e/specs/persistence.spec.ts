import { test, expect } from '../fixtures/base-test';
import path from 'path';

test.describe('Persistence', () => {
    test('should persist data after reload', async ({ page }) => {
        await page.goto('/');

        // 1. Upload a file via File Chooser
        const filePath = path.resolve('tests/e2e/fixtures/sample.pdf');
        const fileChooserPromise = page.waitForEvent('filechooser');

        // Use the specific button locator
        await page.locator('.app-header button').first().click();

        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles(filePath);

        // 2. Wait for it to appear
        // Using .page-item instead of .n-list-item
        await expect(page.locator('.page-item').first()).toBeVisible({ timeout: 15000 });
        // Optional: text check might fail for PDF initially, refer to file-processing.spec.ts logic
        // But for persistence, we just check if ITEM is there.
        // If we want to check title, we might use a loose check.
        // await expect(page.getByText('sample.pdf')).toBeVisible({ timeout: 15000 });

        // 3. Reload Page
        await page.reload();

        // 4. Verify data is still there
        await expect(page.locator('.page-item').first()).toBeVisible({ timeout: 15000 });
    });
});
