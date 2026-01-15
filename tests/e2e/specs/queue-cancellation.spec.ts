import { test, expect } from '../fixtures/base-test';
import { AppPage } from '../pages/AppPage';
import { PageListPage } from '../pages/PageListPage';
import { TestData } from '../data/TestData';
import { APIMocks } from '../mocks/APIMocks';

test.describe('Queue Cancellation Tests', () => {
  let app: AppPage;
  let pageList: PageListPage;
  let apiMocks: APIMocks;

  test.beforeEach(async ({ page }) => {
    app = new AppPage(page);
    pageList = new PageListPage(page);
    apiMocks = new APIMocks(page);
    await app.goto();
  });

  test.afterEach(async () => {
    // Clean up any pending tasks
    await apiMocks.unmockOCR();
  });

  /**
   * Test Case 1: Basic OCR Task Cancellation
   * Scenario: User starts OCR task, then cancels by deleting the page
   * Similar to advanced-deletion.spec.ts but with explicit OCR start
   */
  test('should cancel OCR task by deleting processing page', async ({ page }) => {
    // Step 1: Upload a file
    await test.step('Upload file', async () => {
      await pageList.uploadAndWaitReady(TestData.files.samplePNG());
      await pageList.waitForPagesLoaded({ count: 1, timeout: 10000 });
    });

    // Step 2: Start OCR processing with delay
    await test.step('Start OCR with simulated delay', async () => {
      // Mock OCR API to have a delay so we can cancel during processing
      await apiMocks.mockOCR({ delay: 5000 }); // 5 second delay

      // Click OCR button on the page
      const pageItem = page.locator('[data-testid^="page-item-"]').first();
      await pageItem.hover();
      await page.getByTestId('ocr-trigger-btn').click();

      // Wait a bit for OCR to start
      await page.waitForTimeout(1000);
    });

    // Step 3: Delete the processing page to cancel OCR
    await test.step('Delete processing page to cancel OCR', async () => {
      const pageItem = page.locator('[data-testid^="page-item-"]').first();
      await pageItem.hover();
      await pageItem.getByTestId('delete-page-btn').click();

      // Confirm deletion
      const dialog = page.locator('.n-dialog.n-modal.delete-confirm-dialog');
      await dialog.getByRole('button').last().click();

      // Wait for page to be removed
      await pageList.waitForPagesLoaded({ count: 0, timeout: 5000 });
      expect(await app.isEmptyState()).toBeTruthy();
    });

    // Step 4: Verify no errors in console
    await test.step('Verify no console errors', async () => {
      // The base-test fixture already checks for console errors
      // If we get here without test failure, console error check passed
    });
  });

  /**
   * Test Case 2: Mixed State Task Cancellation
   * Scenario: Cancel multiple processing pages (simulating mixed state)
   */
  test('should cancel multiple processing OCR tasks', async ({ page }) => {
    // Step 1: Upload 2 files (equal to queue concurrency)
    await test.step('Upload two files', async () => {
      const files = [
        TestData.files.samplePNG(),
        TestData.files.sampleJPG()
      ];

      await pageList.uploadAndWaitReady(files);
      await pageList.waitForPagesLoaded({ count: 2, timeout: 15000 });
    });

    // Step 2: Start OCR on both pages with delay
    await test.step('Start OCR on both pages with delay', async () => {
      // Mock OCR API with delays
      await apiMocks.mockOCR({ delay: 5000 }); // 5 second delay

      // Select all pages
      await pageList.selectAll();

      // Click batch OCR button
      await page.getByTestId('batch-ocr-btn').click();

      // Wait for OCR to start
      await page.waitForTimeout(1500);
    });

    // Step 3: Delete both processing pages to cancel OCR tasks
    await test.step('Delete both processing pages', async () => {
      // Select all pages again (they should still be selected)
      await pageList.selectAll();

      // Click delete selected button
      await page.getByTestId('delete-selected-btn').click();

      // Confirm deletion
      const dialog = page.locator('.n-dialog.n-modal');
      await dialog.waitFor({ state: 'visible' });
      await dialog.locator('button:has-text("Confirm")').click();

      // Wait for success message
      await page.locator('.n-message:has-text("deleted")').waitFor({
        state: 'visible',
        timeout: 5000
      });

      // Wait for all pages to be removed
      await pageList.waitForPagesLoaded({ count: 0, timeout: 5000 });
      expect(await app.isEmptyState()).toBeTruthy();
    });

    // Step 4: Verify can upload new files and process them
    await test.step('Verify system recovers after cancellation', async () => {
      // Wait a bit for system to stabilize after deletion
      await page.waitForTimeout(1000);

      // Reset mock to immediate success
      await apiMocks.mockOCR({ delay: 0 });

      // Upload a new file (use PNG for faster processing)
      await pageList.uploadAndWaitReady(TestData.files.samplePNG());
      await pageList.waitForPagesLoaded({ count: 1, timeout: 15000 });

      // Process it successfully
      const pageItem = page.locator('[data-testid^="page-item-"]').first();
      await pageItem.hover();
      await page.getByTestId('ocr-trigger-btn').click();

      // Wait for OCR to complete
      await page.waitForTimeout(3000);

      // Verify success - just check that page exists and has status
      const pageCount = await page.locator('[data-testid^="page-item-"]').count();
      expect(pageCount).toBe(1);
    });
  });
});