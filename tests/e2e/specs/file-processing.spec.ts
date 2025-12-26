import { test, expect } from '../fixtures/base-test';

import path from 'path';

test.describe('File Processing', () => {
    test('should process uploaded PDF and generate thumbnail', async ({ page }) => {
        await page.goto('/');

        // Prepare path
        const filePath = path.resolve('tests/e2e/fixtures/sample.pdf');

        // Setup file chooser
        const fileChooserPromise = page.waitForEvent('filechooser');

        // Click Add File
        await page.locator('.app-header button').first().click();

        // Handle chooser
        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles(filePath);

        // Assert: Wait for at least one item in the list
        // This confirms the PDF was processed (or at least a page was added)
        const pageItem = page.locator('.page-item').first();
        await expect(pageItem).toBeVisible({ timeout: 30000 });

        // Optional: Check if text appears *somewhere* (e.g. in the item)
        // await expect(page.getByText('sample.pdf')).toBeVisible();
    });
});
