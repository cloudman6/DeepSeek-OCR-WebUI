import { test, expect } from '../fixtures/base-test';
import { AppPage } from '../pages/AppPage';
import { PageListPage } from '../pages/PageListPage';
import { OCRPage } from '../pages/OCRPage';
import { ExportPage } from '../pages/ExportPage';
import { APIMocks } from '../mocks/APIMocks';
import { TestData } from '../data/TestData';
import { waitForHealthyService } from '../helpers/ocr-helpers';

test.describe('Error Handling', () => {
  let app: AppPage;
  let pageList: PageListPage;
  let ocrPage: OCRPage;
  let exportPage: ExportPage;
  let apiMocks: APIMocks;

  test.beforeEach(async ({ page }) => {
    app = new AppPage(page);
    pageList = new PageListPage(page);
    ocrPage = new OCRPage(page);
    exportPage = new ExportPage(page);
    apiMocks = new APIMocks(page);

    await apiMocks.mockHealth({ status: 'healthy' });
    await app.goto();
    await app.waitForAppReady();
  });

  test('should auto-retry on HTTP 500 server error', async ({ page }) => {
    // Verify that HTTP 5xx errors trigger automatic retry
    let callCount = 0;

    // Upload file first
    await pageList.uploadAndWaitReady([TestData.files.samplePNG()]);
    await waitForHealthyService(page);

    // Set up route AFTER health check completes
    await page.route('**/ocr', async (route) => {
      callCount++;
      if (callCount <= 2) {
        // First 2 attempts fail with 500
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Internal Server Error' })
        });
      } else {
        // 3rd attempt succeeds
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(TestData.ocrResponse.default())
        });
      }
    });

    // Trigger OCR
    await ocrPage.triggerOCR(0);

    // Verify task eventually succeeds after retries
    await ocrPage.waitForOCRSuccess(0, 30000);
    expect(callCount).toBe(3); // Should have retried 2 times

    // Verify no error message shown to user (silent retry)
    await expect(page.locator('.n-message')).not.toBeVisible();
  });

  test('should auto-retry on network error', async ({ page, browserName }) => {
    // Skip on Firefox due to different handling of route.abort()
    test.skip(browserName === 'firefox', 'Firefox handles network errors differently');

    // Verify that network errors (Failed to fetch) trigger retry
    let callCount = 0;

    //Upload file and wait for health check
    await pageList.uploadAndWaitReady([TestData.files.samplePNG()]);
    await waitForHealthyService(page);

    // Set up route AFTER health check
    await page.route('**/ocr', async (route) => {
      callCount++;
      if (callCount === 1) {
        // First attempt: network failure
        await route.abort('failed');
      } else {
        // Second attempt: success
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(TestData.ocrResponse.default())
        });
      }
    });

    await ocrPage.triggerOCR(0);

    // Verify task eventually succeeds
    await ocrPage.waitForOCRSuccess(0, 30000);
    expect(callCount).toBe(2); // Should have retried once

    // No error message shown
    await expect(page.locator('.n-message')).not.toBeVisible();
  });

  test('should handle long processing time gracefully', async ({ page }) => {
    // This test verifies the system remains stable during long OCR processing
    // (Not testing timeout retry, just stability)
    await apiMocks.mockOCR({ delay: 10000 });

    await pageList.uploadAndWaitReady([TestData.files.samplePNG()]);
    await waitForHealthyService(page);
    await ocrPage.triggerOCR(0);

    // Verify system stays in recognizing state during long processing
    await expect.poll(async () => await ocrPage.getPageStatus(0), {
      timeout: 5000
    }).toBe('recognizing');

    // Eventually succeeds
    await ocrPage.waitForOCRSuccess(0, 20000);
  });

  test('should handle export failure gracefully', async ({ page }) => {
    // 上传文件并完成 OCR
    await apiMocks.mockOCR();
    await pageList.uploadAndWaitReady([TestData.files.samplePNG()]);
    await waitForHealthyService(page);
    await ocrPage.triggerOCR(0);
    await ocrPage.waitForOCRSuccess(0);

    // 选中页面
    await pageList.selectAll();

    // 模拟导出失败
    await apiMocks.mockExport({ shouldFail: true, statusCode: 500 });

    // 尝试导出
    await exportPage.clickExportButton();
    await exportPage.selectExportFormat('Markdown');

    // 验证错误消息出现
    // 注意: Naive UI 的 message API 不支持 class 选项，通过通用的 .n-message 验证
    await expect(page.locator('.n-message').first()).toBeVisible({ timeout: 10000 });
  });

  test('should handle offline status during export', async ({ page, context }) => {
    // 上传文件并完成 OCR
    await apiMocks.mockOCR();
    await pageList.uploadAndWaitReady([TestData.files.samplePNG()]);
    await waitForHealthyService(page);
    await ocrPage.triggerOCR(0);
    await ocrPage.waitForOCRSuccess(0);

    await pageList.selectAll();

    // 模拟断网
    await context.setOffline(true);

    // 尝试导出
    await exportPage.clickExportButton();
    await exportPage.selectExportFormat('Markdown');

    // 验证错误消息出现（网络错误也会触发导出错误）
    // 注意: Naive UI 的 message API 不支持 class 选项，通过通用的 .n-message 验证
    await expect(page.locator('.n-message').first()).toBeVisible({ timeout: 10000 });

    // 恢复网络
    await context.setOffline(false);
  });
});
