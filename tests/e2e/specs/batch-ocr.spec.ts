import { test, expect } from '../fixtures/base-test';
import { getPdfPageCount } from '../utils/pdf-utils';
import { uploadFiles } from '../utils/file-upload';
import { Route } from 'playwright';
import fs from 'fs';
import path from 'path';

interface PageStatus {
  status: string;
}

interface PageStoreResult {
  success: boolean;
  pages?: PageStatus[];
}

// Helper function to check if pages are past ready state
function checkPagesPastReadyState(pages: PageStatus[]): boolean {
  if (!pages || pages.length === 0) return false;

  for (const page of pages) {
    if (page.status === 'ready' || page.status === 'pending_render' || page.status === 'rendering') {
      return false;
    }
  }
  return true;
}

// Helper function to verify pages are past ready state after evaluate
function verifyPagesPastReadyState(result: PageStoreResult): boolean {
  if (!result.success) return false;
  return checkPagesPastReadyState(result.pages || []);
}

// Helper function to get page store data
async function getPageStoreData(page: import('@playwright/test').Page, expectedCount: number): Promise<PageStoreResult> {
  return page.evaluate((expectedCount) => {
    const pages = window.pagesStore?.pages || [];
    if (pages.length !== expectedCount) return { success: false };

    return {
      success: true,
      pages: pages.map(p => ({ status: p.status }))
    };
  }, expectedCount);
}

// Helper function to create delayed OCR route handler
function createDelayedOCRHandler(completeFlag: { value: boolean }) {
  return async (route: Route) => {
    // Wait for complete flag before responding
    while (!completeFlag.value) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    const mockResponse = JSON.parse(fs.readFileSync(path.resolve('tests/e2e/samples/sample.json'), 'utf-8'));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockResponse),
    });
  };
}

// Helper function to check if page has completed OCR
function checkPagePastOCR(idx: number): boolean {
  const pages = window.pagesStore?.pages || [];
  const status = pages[idx]?.status;
  return ['ocr_success', 'pending_gen', 'generating_markdown', 'markdown_success',
          'generating_pdf', 'pdf_success', 'generating_docx', 'completed'].includes(status || '');
}

// Helper function to check if count pages are in processing state
function checkProcessingPagesCount(count: number): boolean {
  const pages = window.pagesStore?.pages || [];
  const processingCount = pages.filter(p => p.status === 'pending_ocr' || p.status === 'recognizing').length;
  return processingCount === count;
}

// Helper function to check if all pages completed OCR
function checkAllPagesCompletedOCR(): boolean {
  const pages = window.pagesStore?.pages || [];
  return pages.every(p =>
    ['ocr_success', 'pending_gen', 'generating_markdown', 'markdown_success',
     'generating_pdf', 'pdf_success', 'generating_docx', 'completed'].includes(p.status)
  );
}

test.describe('Batch OCR', () => {
  test.describe('Basic Batch OCR', () => {
    test('should process all ready pages when batch OCR is clicked', async ({ page }) => {
      await page.goto('/');

      // Upload a multi-page PDF (sample.pdf has 6 pages)
      const filePath = path.resolve('tests/e2e/samples/sample.pdf');
      const expectedPageCount = await getPdfPageCount(filePath);

      // Mock OCR API
      await page.route('**/ocr', async (route) => {
        const mockResponse = JSON.parse(fs.readFileSync(path.resolve('tests/e2e/samples/sample.json'), 'utf-8'));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockResponse),
        });
      });

      // Upload file using direct injection
      await uploadFiles(page, [filePath], '.app-header button', true);

      // Wait for all pages to be ready (rendering complete)
      const pageItems = page.locator('.page-item');
      await expect(async () => {
        const count = await pageItems.count();
        expect(count).toBe(expectedPageCount);
      }).toPass({ timeout: 30000 });

      // Wait for thumbnails (indicates ready status)
      for (let i = 0; i < expectedPageCount; i++) {
        await expect(pageItems.nth(i).locator('.thumbnail-img')).toBeVisible({ timeout: 30000 });
      }

      // Select all pages
      await page.check('[data-testid="select-all-checkbox"]');

      // Click batch OCR button
      await page.click('[data-testid="batch-ocr-button"]');

      // Verify success notification
      await expect(page.locator('.n-notification').first()).toContainText(`Added ${expectedPageCount} pages to OCR queue`, { timeout: 5000 });

      // Wait for all pages to reach or pass ocr_success status
      for (let i = 0; i < expectedPageCount; i++) {
        await page.waitForFunction(checkPagePastOCR, i, { timeout: 30000 });
      }

      // Verify all pages are past ocr_success (completed OCR stage)
      for (let i = 0; i < expectedPageCount; i++) {
        const isPastOCR = await page.evaluate(checkPagePastOCR, i);
        expect(isPastOCR).toBeTruthy();
      }

      // Verify persistence after reload
      await page.reload();

      // Wait for page items to be visible after reload
      await expect(pageItems.first()).toBeVisible({ timeout: 10000 });

      // Verify pages are still in a completed state (not reset to ready)
      await expect(async () => {
        const result = await getPageStoreData(page, expectedPageCount);
        return verifyPagesPastReadyState(result);
      }).toPass({ timeout: 10000 });
    });
  });

  test.describe('Skip Currently Processing Pages', () => {
    test('should skip only pages currently in OCR queue (pending_ocr or recognizing)', async ({ page }) => {
      await page.goto('/');

      const firstBatchComplete = { value: false };

      // Mock OCR API with delay for first batch
      await page.route('**/ocr', createDelayedOCRHandler(firstBatchComplete));

      // Upload first PDF
      const filePath1 = path.resolve('tests/e2e/samples/sample.pdf');
      // Upload first file using direct injection
      await uploadFiles(page, [filePath1], '.app-header button', true);

      // Wait for pages to be ready
      let pageItems = page.locator('.page-item');
      await expect(async () => {
        const count = await pageItems.count();
        expect(count).toBeGreaterThan(0);
      }).toPass({ timeout: 30000 });

      const firstBatchCount = await pageItems.count();

      // Wait for thumbnails
      for (let i = 0; i < firstBatchCount; i++) {
        await expect(pageItems.nth(i).locator('.thumbnail-img')).toBeVisible({ timeout: 30000 });
      }

      // Select all and do batch OCR
      await page.check('[data-testid="select-all-checkbox"]');
      await page.click('[data-testid="batch-ocr-button"]');

      // Verify notification for first batch
      await expect(page.locator('.n-notification', { hasText: /Added \d+ pages to OCR queue/ })).toBeVisible({ timeout: 5000 });

      // Wait for first batch to reach pending_ocr status (they should be stuck there due to delay)
      await page.waitForFunction(checkProcessingPagesCount, firstBatchCount, { timeout: 10000 });

      // Clear selection
      await page.uncheck('[data-testid="select-all-checkbox"]');

      // Upload second file (PNG - single page, ready status)
      const filePath2 = path.resolve('tests/e2e/samples/sample.png');

      // Upload second file using direct injection
      await uploadFiles(page, [filePath2], '.app-header button', true);

      // Wait for new page to be ready
      pageItems = page.locator('.page-item');
      await expect(async () => {
        const count = await pageItems.count();
        expect(count).toBe(firstBatchCount + 1);
      }).toPass({ timeout: 30000 });

      // Wait for thumbnail
      await expect(pageItems.nth(firstBatchCount).locator('.thumbnail-img')).toBeVisible({ timeout: 30000 });

      // Select all pages (including those in OCR queue)
      await page.check('[data-testid="select-all-checkbox"]');

      // Click batch OCR
      await page.click('[data-testid="batch-ocr-button"]');

      // Verify notification shows only new page was queued (first batch was skipped because they're in queue)
      // Check for the specific notification with "skipped" text
      const skipNotification = page.locator('.n-notification', { hasText: /skipped/ });
      await expect(skipNotification).toBeVisible({ timeout: 5000 });
      await expect(skipNotification).toContainText(/Added 1 page to OCR queue.*skipped \d+/);

      // Now allow the first batch OCR to complete
      firstBatchComplete.value = true;

      // Wait for all pages to complete OCR (including the first batch and new page)
      await page.waitForFunction(checkAllPagesCompletedOCR, { timeout: 30000 });
    });
  });

  test.describe('Edge Cases', () => {
    test('should show warning when all selected pages are currently in OCR queue', async ({ page }) => {
      await page.goto('/');

      const allowOCRToComplete = { value: false };

      // Mock OCR API with delay to keep pages in queue
      await page.route('**/ocr', createDelayedOCRHandler(allowOCRToComplete));

      // Upload PDF
      const filePath = path.resolve('tests/e2e/samples/sample.pdf');

      // Upload file using direct injection
      await uploadFiles(page, [filePath], '.app-header button', true);

      // Wait for pages to be ready
      const pageItems = page.locator('.page-item');
      await expect(async () => {
        const count = await pageItems.count();
        expect(count).toBeGreaterThan(0);
      }).toPass({ timeout: 30000 });

      const pageCount = await pageItems.count();

      // Wait for thumbnails
      for (let i = 0; i < pageCount; i++) {
        await expect(pageItems.nth(i).locator('.thumbnail-img')).toBeVisible({ timeout: 30000 });
      }

      // Do batch OCR
      await page.check('[data-testid="select-all-checkbox"]');
      await page.click('[data-testid="batch-ocr-button"]');

      // Wait for all pages to enter OCR queue (pending_ocr status)
      await page.waitForFunction(checkProcessingPagesCount, pageCount, { timeout: 10000 });

      // All pages are now in OCR queue - try batch OCR again
      await page.click('[data-testid="batch-ocr-button"]');

      // Verify warning notification
      await expect(page.locator('.n-notification', { hasText: 'All selected pages are already processed or being processed' })).toBeVisible({ timeout: 5000 });

      // Now allow the OCR to complete
      allowOCRToComplete.value = true;

      // Wait for all pages to complete OCR
      await page.waitForFunction(checkAllPagesCompletedOCR, { timeout: 30000 });
    });
  });
});
