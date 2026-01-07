import type { Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Upload files by directly injecting them into the store.
 * This method bypasses the file chooser UI for more reliable and faster testing.
 * 
 * Note: This method directly injects files into the pagesStore, so it doesn't test
 * the file selection UI. All E2E tests use this method for consistency and reliability.
 * 
 * @param page Playwright page instance
 * @param filePaths Array of file paths to upload
 * @param buttonSelector Optional selector for the upload button (not used, kept for API compatibility)
 * @param preferDirect Optional flag (not used, kept for API compatibility)
 * @returns Promise that resolves when files are uploaded
 */
export async function uploadFiles(
    page: Page,
    filePaths: string[],
    _buttonSelector?: string,
    _preferDirect?: boolean
): Promise<void> {
    // Read all files as buffers
    const fileBuffers = filePaths.map(filePath => fs.readFileSync(filePath));
    const fileNames = filePaths.map(filePath => path.basename(filePath));
    
    // Detect MIME types from file extensions
    const getMimeType = (filename: string): string => {
        const ext = path.extname(filename).toLowerCase();
        const mimeTypes: Record<string, string> = {
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.bmp': 'image/bmp',
            '.pdf': 'application/pdf',
        };
        return mimeTypes[ext] || 'application/octet-stream';
    };

    const mimeTypes = fileNames.map(getMimeType);

    // Wait for pagesStore to be available (it's exposed in onMounted)
    await page.waitForFunction(() => {
        return window.pagesStore && 'addFiles' in window.pagesStore && typeof window.pagesStore.addFiles === 'function';
    }, { timeout: 10000 }).catch(() => {
        throw new Error('pagesStore.addFiles is not available after waiting');
    });

    // Create File objects in the page context and add them directly
    const result = await page.evaluate(
        async (fileData: Array<{ data: number[]; name: string; type: string }>) => {
            const files = fileData.map(({ data, name, type }) => 
                new File([new Uint8Array(data)], name, { type })
            );
            
            if (window.pagesStore && 'addFiles' in window.pagesStore && typeof window.pagesStore.addFiles === 'function') {
                return await (window.pagesStore.addFiles as (files: File[]) => Promise<{ success: boolean; pages?: Array<{ id: string }> }>)(files);
            } else {
                throw new Error('pagesStore.addFiles is not available');
            }
        },
        fileBuffers.map((buffer, index) => ({
            data: Array.from(buffer),
            name: fileNames[index],
            type: mimeTypes[index],
        }))
    );

    // Wait for pages to appear in the DOM
    await page.waitForSelector('.page-item', { timeout: 10000 }).catch(() => {
        // If no pages appear, that's okay - might be PDF processing
    });

    // Simulate handleFileAdd behavior: select the last added page (newest page)
    // This mimics what App.vue's handleFileAdd does after addFiles succeeds
    // When adding files, the app selects the first page in the result, which is the first newly added page
    if (result.success && result.pages && result.pages.length > 0) {
        // Wait a bit for the pages to be fully processed and appear in the UI
        await page.waitForTimeout(300);
        
        // Find the page item that corresponds to the last newly added page
        // We need to find it by matching the page ID or by position (last page item)
        const pageItemCount = await page.locator('.page-item').count();
        
        if (pageItemCount > 0) {
            // Get the last page item (which should be the newly added one)
            const lastPageItem = page.locator('.page-item').last();
            
            // Check if it's already selected
            const isSelected = await lastPageItem.evaluate((el: HTMLElement) => {
                return el.classList.contains('active') || el.classList.contains('selected');
            }).catch(() => false);

            // If not selected, click it to select it
            if (!isSelected) {
                await lastPageItem.click({ timeout: 5000 }).catch(() => {
                    // If clicking fails, continue - selection might happen automatically
                });
                
                // Wait a bit for the selection to take effect
                await page.waitForTimeout(100);
            }
        }
    }
}
