import { test, expect } from '../fixtures/base-test';
import { getPdfPageCount } from '../utils/pdf-utils';
import path from 'path';
import type { Page, Locator } from '@playwright/test';

test.describe('Page Deleting', () => {
    // Test file paths
    const TEST_FILES = [
        'sample.pdf',
        'sample2.pdf',
        'sample.png',
        'sample2.png',
        'sample.jpg',
        'sample2.jpg',
        'sample.jpeg',
        'sample2.jpeg'
    ];

    /**
     * Calculate expected total page count for all test files
     */
    async function calculateExpectedPageCount(filePaths: string[]): Promise<number> {
        let total = 0;
        for (const filePath of filePaths) {
            if (filePath.endsWith('.pdf')) {
                total += await getPdfPageCount(filePath);
            } else {
                // Image files count as 1 page each
                total += 1;
            }
        }
        return total;
    }

    /**
     * Upload test files and wait for all pages to be processed
     */
    async function uploadTestFiles(page: Page): Promise<number> {
        const filePaths = TEST_FILES.map(f => path.resolve(`tests/e2e/fixtures/${f}`));

        const fileChooserPromise = page.waitForEvent('filechooser');
        await page.locator('.app-header button').first().click();
        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles(filePaths);

        // Calculate expected page count
        const expectedCount = await calculateExpectedPageCount(filePaths);

        // Wait for all page items to appear
        const pageItems = page.locator('.page-item');
        await expect(async () => {
            expect(await pageItems.count()).toBe(expectedCount);
        }).toPass({ timeout: 30000 });

        // Wait for all thumbnails to load
        for (let i = 0; i < expectedCount; i++) {
            await expect(pageItems.nth(i).locator('.thumbnail-img')).toBeVisible({ timeout: 30000 });
        }

        return expectedCount;
    }

    /**
     * Get random page indices (avoiding duplicates)
     */
    function getRandomPageIndices(totalCount: number, selectCount: number): number[] {
        const indices = Array.from({ length: totalCount }, (_, i) => i);
        const selected: number[] = [];
        for (let i = 0; i < selectCount; i++) {
            // eslint-disable-next-line sonarjs/pseudo-random
            const randomIndex = Math.floor(Math.random() * indices.length);
            selected.push(indices[randomIndex]);
            indices.splice(randomIndex, 1);
        }
        return selected.sort((a, b) => a - b);
    }

    /**
     * Verify page selection state (CSS class + checkbox)
     */
    async function verifyPageSelected(pageItem: Locator, shouldBeSelected: boolean) {
        if (shouldBeSelected) {
            await expect(pageItem).toHaveClass(/selected/);
            // For NCheckbox, check the aria-checked attribute
            const checkbox = pageItem.locator('.page-checkbox');
            await expect(checkbox).toHaveAttribute('aria-checked', 'true');
        } else {
            await expect(pageItem).not.toHaveClass(/selected/);
            const checkbox = pageItem.locator('.page-checkbox');
            await expect(checkbox).toHaveAttribute('aria-checked', 'false');
        }
    }

    test('should delete a single page and persist after reload', async ({ page }) => {
        await page.goto('/');

        // Upload test files
        await uploadTestFiles(page);

        // Test deletion on multiple pages (loop 2 times to verify randomness)
        for (let testIndex = 0; testIndex < 2; testIndex++) {
            const currentPageCount = await page.locator('.page-item').count();

            // Select a random page (avoid first and last to prevent edge case bias)
            // eslint-disable-next-line sonarjs/pseudo-random
            const targetIndex = Math.floor(Math.random() * (currentPageCount - 2)) + 1;
            const targetPageItem = page.locator('.page-item').nth(targetIndex);

            // Hover to make delete button visible
            await targetPageItem.hover();

            // Click delete button
            await targetPageItem.locator('button[title="Delete page"]').click();

            // Verify page count decreased
            await expect(async () => {
                expect(await page.locator('.page-item').count()).toBe(currentPageCount - 1);
            }).toPass({ timeout: 5000 });

            // Verify toast appears
            const toast = page.locator('#toast-notification');
            await expect(toast).toBeVisible();
            await expect(toast).toContainText('deleted');
            await expect(toast.locator('button')).toContainText('Undo');

            // Wait for toast to auto-dismiss (increased timeout for reliability)
            await expect(toast).not.toBeVisible({ timeout: 15000 });

            // Reload page to verify persistence
            await page.reload();
            await page.waitForLoadState('networkidle');

            // Verify deletion persisted
            const pageItemsAfterReload = page.locator('.page-item');
            const remainingCount = currentPageCount - 1;

            await expect(async () => {
                expect(await pageItemsAfterReload.count()).toBe(remainingCount);
            }).toPass({ timeout: 10000 });

            // Wait for all thumbnails to load after reload
            for (let i = 0; i < remainingCount; i++) {
                await expect(pageItemsAfterReload.nth(i).locator('.thumbnail-img'))
                    .toBeVisible({ timeout: 30000 });
            }
        }
    });

    test('should undo single page deletion and persist after reload', async ({ page }) => {
        await page.goto('/');

        await uploadTestFiles(page);

        // Test undo on 2 different pages
        for (let testIndex = 0; testIndex < 2; testIndex++) {
            const currentPageCount = await page.locator('.page-item').count();
            // eslint-disable-next-line sonarjs/pseudo-random
            const targetIndex = Math.floor(Math.random() * (currentPageCount - 2)) + 1;
            const targetPageItem = page.locator('.page-item').nth(targetIndex);

            // Record the file name for verification
            const fileName = await targetPageItem.locator('.page-name').textContent();

            // Delete page
            await targetPageItem.hover();
            await targetPageItem.locator('button[title="Delete page"]').click();

            // Verify deletion
            await expect(async () => {
                expect(await page.locator('.page-item').count()).toBe(currentPageCount - 1);
            }).toPass({ timeout: 5000 });

            // Verify toast
            const toast = page.locator('#toast-notification');
            await expect(toast).toBeVisible();

            // Click Undo
            await toast.locator('button').click();

            // Verify page restored
            await expect(async () => {
                expect(await page.locator('.page-item').count()).toBe(currentPageCount);
            }).toPass({ timeout: 5000 });

            // Verify toast shows "restored"
            await expect(toast).toContainText('restored');
            await expect(toast).not.toBeVisible({ timeout: 5000 });

            // Reload to verify persistence
            await page.reload();
            await page.waitForLoadState('networkidle');

            const pageItemsAfterReload = page.locator('.page-item');
            await expect(async () => {
                expect(await pageItemsAfterReload.count()).toBe(currentPageCount);
            }).toPass({ timeout: 10000 });

            // Wait for all thumbnails
            for (let i = 0; i < currentPageCount; i++) {
                await expect(pageItemsAfterReload.nth(i).locator('.thumbnail-img'))
                    .toBeVisible({ timeout: 30000 });
            }

            // Verify the restored page exists
            await expect(page.locator('.page-name', { hasText: fileName || '' })).toBeVisible();
        }
    });

    test('should delete multiple pages and persist after reload', async ({ page }) => {
        await page.goto('/');

        const totalPages = await uploadTestFiles(page);
        const selectCount = Math.floor(totalPages / 3); // Select about 1/3 of pages

        // Randomly select pages
        const selectedIndices = getRandomPageIndices(totalPages, selectCount);

        // Select pages by clicking checkboxes
        for (const index of selectedIndices) {
            const pageItem = page.locator('.page-item').nth(index);
            await pageItem.locator('.page-checkbox').click();

            // Verify selection state (both CSS class and checkbox)
            await verifyPageSelected(pageItem, true);
        }

        // Verify delete button is visible
        const deleteBtn = page.locator('.delete-selected-btn');
        await expect(deleteBtn).toBeVisible();

        // Click batch delete
        await deleteBtn.click();

        // Verify page count decreased
        await expect(async () => {
            expect(await page.locator('.page-item').count()).toBe(totalPages - selectCount);
        }).toPass({ timeout: 5000 });

        // Verify toast
        const toast = page.locator('#toast-notification');
        await expect(toast).toBeVisible();
        await expect(toast).toContainText('pages deleted');
        await expect(toast).toContainText(selectCount.toString());

        // Wait for toast to dismiss
        await expect(toast).not.toBeVisible({ timeout: 10000 });

        // Reload to verify persistence
        await page.reload();
        await page.waitForLoadState('networkidle');

        const remainingCount = totalPages - selectCount;
        await expect(async () => {
            expect(await page.locator('.page-item').count()).toBe(remainingCount);
        }).toPass({ timeout: 10000 });

        // Wait for all thumbnails
        for (let i = 0; i < remainingCount; i++) {
            await expect(page.locator('.page-item').nth(i).locator('.thumbnail-img'))
                .toBeVisible({ timeout: 30000 });
        }
    });

    test('should undo batch deletion and persist after reload', async ({ page }) => {
        await page.goto('/');

        const totalPages = await uploadTestFiles(page);
        const selectCount = Math.floor(totalPages / 3);
        const selectedIndices = getRandomPageIndices(totalPages, selectCount);

        // Select and delete pages
        for (const index of selectedIndices) {
            await page.locator('.page-item').nth(index).locator('.page-checkbox').click();
        }

        await page.locator('.delete-selected-btn').click();

        await expect(async () => {
            expect(await page.locator('.page-item').count()).toBe(totalPages - selectCount);
        }).toPass({ timeout: 5000 });

        // Click Undo
        const toast = page.locator('#toast-notification');
        await toast.locator('button').click();

        // Verify all pages restored
        await expect(async () => {
            expect(await page.locator('.page-item').count()).toBe(totalPages);
        }).toPass({ timeout: 5000 });

        await expect(toast).toContainText('restored');
        await expect(toast).not.toBeVisible({ timeout: 5000 });

        // Reload to verify persistence
        await page.reload();
        await page.waitForLoadState('networkidle');

        await expect(async () => {
            expect(await page.locator('.page-item').count()).toBe(totalPages);
        }).toPass({ timeout: 10000 });

        // Wait for all thumbnails
        for (let i = 0; i < totalPages; i++) {
            await expect(page.locator('.page-item').nth(i).locator('.thumbnail-img'))
                .toBeVisible({ timeout: 30000 });
        }
    });

    test('should delete all pages and show empty state', async ({ page }) => {
        await page.goto('/');

        const totalPages = await uploadTestFiles(page);

        // Click select all checkbox
        const selectAllCheckbox = page.locator('.selection-toolbar .n-checkbox');
        await selectAllCheckbox.click();

        // Verify all selected (checkbox state)
        await expect(selectAllCheckbox).toHaveAttribute('aria-checked', 'true');

        // Verify each page is selected
        const pageItems = page.locator('.page-item');
        for (let i = 0; i < totalPages; i++) {
            await verifyPageSelected(pageItems.nth(i), true);
        }

        // Click delete
        await page.locator('.delete-selected-btn').click();

        // Verify all pages deleted
        await expect(async () => {
            expect(await page.locator('.page-item').count()).toBe(0);
        }).toPass({ timeout: 5000 });

        // Verify empty state
        const emptyState = page.locator('.empty-state');
        await expect(emptyState).toBeVisible();
        await expect(page.locator('text="No pages added"')).toBeVisible();

        // Verify toast
        const toast = page.locator('#toast-notification');
        await expect(toast).toBeVisible();

        // Wait for toast to dismiss
        await expect(toast).not.toBeVisible({ timeout: 10000 });

        // Reload to verify empty state persists
        await page.reload();
        await page.waitForLoadState('networkidle');

        await expect(page.locator('.page-item')).toHaveCount(0);
        await expect(emptyState).toBeVisible();
    });

    test('should undo delete all and restore all pages', async ({ page }) => {
        await page.goto('/');

        const totalPages = await uploadTestFiles(page);

        // Select all and delete
        await page.locator('.selection-toolbar .n-checkbox').click();
        await page.locator('.delete-selected-btn').click();

        // Verify all deleted
        await expect(async () => {
            expect(await page.locator('.page-item').count()).toBe(0);
        }).toPass({ timeout: 5000 });

        // Click Undo
        const toast = page.locator('#toast-notification');
        await toast.locator('button').click();

        // Verify all restored
        await expect(async () => {
            expect(await page.locator('.page-item').count()).toBe(totalPages);
        }).toPass({ timeout: 5000 });

        await expect(toast).toContainText('restored');

        // Reload to verify persistence
        await page.reload();
        await page.waitForLoadState('networkidle');

        await expect(async () => {
            expect(await page.locator('.page-item').count()).toBe(totalPages);
        }).toPass({ timeout: 10000 });

        // Wait for all thumbnails
        for (let i = 0; i < totalPages; i++) {
            await expect(page.locator('.page-item').nth(i).locator('.thumbnail-img'))
                .toBeVisible({ timeout: 30000 });
        }
    });
});
