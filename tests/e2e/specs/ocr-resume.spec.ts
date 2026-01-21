import { test, expect } from '../fixtures/base-test';
import { AppPage } from '../pages/AppPage';
import { PageListPage } from '../pages/PageListPage';
import { OCRPage } from '../pages/OCRPage';
import { APIMocks } from '../mocks/APIMocks';
import { TestData } from '../data/TestData';
import { waitForHealthyService } from '../helpers/ocr-helpers';

/**
 * OCR Resume Tests - Verifies that OCR tasks correctly resume after page reload
 * 
 * Key scenarios:
 * 1. Service unavailable during reload → Tasks should wait, not fail
 * 2. Queue full during reload → Tasks should wait, not fail
 */
test.describe('OCR Resume After Page Reload', () => {
    let app: AppPage;
    let pageList: PageListPage;
    let ocrPage: OCRPage;
    let apiMocks: APIMocks;

    test.beforeEach(async ({ page }) => {
        app = new AppPage(page);
        pageList = new PageListPage(page);
        ocrPage = new OCRPage(page);
        apiMocks = new APIMocks(page);

        // Start with healthy service
        await apiMocks.mockHealth({ status: 'healthy' });
        await apiMocks.mockOCR({ delay: 15000 }); // Long delay to control timing
        await app.goto();
        await app.waitForAppReady();
    });

    test('should not fail when resuming tasks with service unavailable', async ({ page }) => {
        // Core test: Verifies the fix for tasks being rejected when isAvailable=false during reload

        // 1. Upload and trigger OCR
        await pageList.uploadAndWaitReady([TestData.files.samplePNG()]);
        await waitForHealthyService(page);
        await ocrPage.triggerOCR(0);

        // Wait for task to enter queue
        await expect.poll(async () => {
            const status = await ocrPage.getPageStatus(0);
            return ['pending_ocr', 'recognizing'].includes(status);
        }, { timeout: 10000 }).toBeTruthy();

        // 2. Mock service unavailable (simulates healthStore.isAvailable = false)
        await apiMocks.mockHealth({ status: 'healthy', shouldFail: true });
        await page.waitForTimeout(1000);

        // 3. Reload page
        await page.reload();
        await app.waitForAppReady();
        await page.waitForTimeout(2000); // Give resume logic time to process

        // 4. KEY ASSERTION: Task should NOT be in error state
        // It can be pending_ocr, recognizing, or even completed (if it finished quickly)
        // The important thing is it's NOT 'error' or back to 'ready'
        const statusAfterReload = await ocrPage.getPageStatus(0);
        expect(statusAfterReload).not.toBe('error');
        expect(statusAfterReload).not.toBe('ready');

        // Status should be one of the OCR-related states
        expect(['pending_ocr', 'recognizing', 'ocr_success', 'completed']).toContain(statusAfterReload);

        // 5. Restore service and verify final success
        await apiMocks.mockHealth({ status: 'healthy' });
        await apiMocks.mockOCR({ delay: 0 }); // Speed up completion

        await ocrPage.waitForOCRSuccess(0, 30000);
        expect(await ocrPage.isOCRCompleted(0)).toBeTruthy();
    });

    test('should not fail when resuming tasks with queue full', async ({ page }) => {
        // Verifies unified handling of 'full' and 'unavailable' states

        // 1. Upload and trigger OCR
        await pageList.uploadAndWaitReady([TestData.files.samplePNG()]);
        await waitForHealthyService(page);
        await ocrPage.triggerOCR(0);

        // Wait for task to enter queue
        await expect.poll(async () => {
            const status = await ocrPage.getPageStatus(0);
            return ['pending_ocr', 'recognizing'].includes(status);
        }, { timeout: 10000 }).toBeTruthy();

        // 2. Mock queue full
        await apiMocks.mockHealth({ status: 'full' });
        await page.waitForTimeout(1000);

        // 3. Reload page
        await page.reload();
        await app.waitForAppReady();
        await page.waitForTimeout(2000);

        // 4. KEY ASSERTION: Task should NOT fail
        const statusAfterReload = await ocrPage.getPageStatus(0);
        expect(statusAfterReload).not.toBe('error');
        expect(statusAfterReload).not.toBe('ready');
        expect(['pending_ocr', 'recognizing', 'ocr_success', 'completed']).toContain(statusAfterReload);

        // 5. Restore and verify success
        await apiMocks.mockHealth({ status: 'healthy' });
        await apiMocks.mockOCR({ delay: 0 });

        await ocrPage.waitForOCRSuccess(0, 30000);
        expect(await ocrPage.isOCRCompleted(0)).toBeTruthy();
    });

    test('should resume multiple tasks without errors', async ({ page }) => {
        test.setTimeout(90000);

        // 1. Upload multiple files
        await pageList.uploadAndWaitReady([
            TestData.files.samplePNG(),
            TestData.files.sampleJPG()
        ]);

        await waitForHealthyService(page);

        // 2. Trigger all OCR tasks
        await ocrPage.triggerOCR(0);
        await page.waitForTimeout(500);
        await ocrPage.triggerOCR(1);
        await page.waitForTimeout(1000);

        // 3. Mock service unavailable
        await apiMocks.mockHealth({ status: 'healthy', shouldFail: true });
        await page.waitForTimeout(1000);

        // 4. Reload
        await page.reload();
        await app.waitForAppReady();
        await page.waitForTimeout(2000);

        // 5. Verify NONE of the tasks are in error state
        for (let i = 0; i < 2; i++) {
            const status = await ocrPage.getPageStatus(i);
            expect(status).not.toBe('error');
            expect(status).not.toBe('ready');
        }

        // 6. Restore and verify all succeed
        await apiMocks.mockHealth({ status: 'healthy' });
        await apiMocks.mockOCR({ delay: 0 });

        await ocrPage.waitForOCRSuccess(0, 40000);
        await ocrPage.waitForOCRSuccess(1, 40000);

        expect(await ocrPage.isOCRCompleted(0)).toBeTruthy();
        expect(await ocrPage.isOCRCompleted(1)).toBeTruthy();
    });
});
