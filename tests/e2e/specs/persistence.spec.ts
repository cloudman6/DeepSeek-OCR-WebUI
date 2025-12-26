import { test, expect } from '../fixtures/base-test';
import { getPdfPageCount } from '../utils/pdf-utils';
import path from 'path';

test.describe('Persistence', () => {
    test('should persist data after reload', async ({ page }) => {
        // Reasonable timeout for reload stability and multi-page processing
        test.setTimeout(30000);

        await page.goto('/');

        // 1. Upload sample.pdf (6 pages) to verify PDF.js FontLoader fix
        const filePath = path.resolve('tests/e2e/fixtures/sample.pdf');
        const expectedPageCount = await getPdfPageCount(filePath);

        const fileChooserPromise = page.waitForEvent('filechooser');

        // Use the specific button locator
        await page.locator('.app-header button').first().click();

        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles(filePath);

        // 2. Wait for items to appear and be ready
        const pageItems = page.locator('.page-item');
        await expect(async () => {
            const count = await pageItems.count();
            expect(count).toBe(expectedPageCount);
        }).toPass({ timeout: 30000 });

        // Ensure processed before reload
        for (let i = 0; i < expectedPageCount; i++) {
            await expect(pageItems.nth(i).locator('.thumbnail-img')).toBeVisible({ timeout: 30000 });
        }

        // 3. Reload Page
        await page.reload();

        // 4. Verify exact data and state is restored
        await expect(async () => {
            const count = await pageItems.count();
            expect(count).toBe(expectedPageCount);
        }).toPass({ timeout: 30000 });

        for (let i = 0; i < expectedPageCount; i++) {
            await expect(pageItems.nth(i).locator('.thumbnail-img')).toBeVisible({ timeout: 30000 });
        }
    });
});
