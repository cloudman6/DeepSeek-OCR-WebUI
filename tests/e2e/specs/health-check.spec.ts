import { test, expect } from '../fixtures/base-test';
import { AppPage } from '../pages/AppPage';
import { PageListPage } from '../pages/PageListPage';
import { OCRPage } from '../pages/OCRPage';
import { APIMocks } from '../mocks/APIMocks';
import { TestData } from '../data/TestData';

test.describe('OCR Health Check & Queue Recovery', () => {
    let app: AppPage;
    let pageList: PageListPage;
    let ocrPage: OCRPage;
    let apiMocks: APIMocks;

    test.beforeEach(async ({ page }) => {
        app = new AppPage(page);
        pageList = new PageListPage(page);
        ocrPage = new OCRPage(page);
        apiMocks = new APIMocks(page);

        // 默认设置为健康状态，避免干扰初始加载
        await apiMocks.mockHealth({ status: 'healthy' });
        await app.goto();
        await app.waitForAppReady();
    });

    test('should reflect health status in UI indicator', async ({ page }) => {
        // 1. 验证初始状态为健康 (success)
        expect(await app.getHealthStatusType()).toBe('success');

        // 2. Mock 变为不健康
        await apiMocks.mockHealth({ status: 'unhealthy' });

        // 3. 等待轮询周期 (5s) 并验证 UI 变化
        // 我们在页面上等待指示器变为 error 类型
        await expect.poll(async () => await app.getHealthStatusType(), {
            timeout: 10000,
            intervals: [1000]
        }).toBe('error');

        // 4. 验证 Tooltip 文本
        const statusText = await app.getHealthStatusText();
        expect(statusText).toContain('Unavailable');
    });

    test('should block OCR requests when service is unhealthy', async ({ page }) => {
        // 1. 设置服务不健康
        await apiMocks.mockHealth({ status: 'unhealthy' });

        // 等待轮询生效，使 Store 更新
        await expect.poll(async () => await app.getHealthStatusType(), { timeout: 10000 }).toBe('error');

        // 2. 上传文件
        await pageList.uploadAndWaitReady([TestData.files.samplePNG()]);

        // 3. 尝试触发 OCR
        await ocrPage.triggerOCR(0);

        // 4. 验证错误消息提示 (OCRService 会抛出错误，UI 会弹出对话框)
        await expect(page.getByText(/unavailable/i).first()).toBeVisible({ timeout: 10000 });

        // 验证没有成功提示显示 (Added to Queue)
        // Naive UI 的 notification 容器通常是 .n-notification-container
        await expect(page.locator('.n-notification')).not.toBeVisible();

        // 5. 验证页面状态变为 error
        expect(await ocrPage.getPageStatus(0)).toBe('error');
    });

    test('should auto-resume queued tasks when service recovers', async ({ page }) => {
        // 1. 初始健康
        await apiMocks.mockHealth({ status: 'healthy' });
        await apiMocks.mockOCR({ delay: 1000 }); // 让 OCR 慢一点

        // 2. 上传并触发第一个任务
        await pageList.uploadAndWaitReady([TestData.files.samplePNG()]);
        await ocrPage.triggerOCR(0);
        // 等待状态变为 Recognizing 或 Scanning (取决于具体的 I18N 文本)
        await page.waitForTimeout(500); // 极短缓冲
        await expect(page.getByTestId('ocr-status-tag').first()).toBeVisible();

        // 3. 在任务执行期间，服务变为不健康
        await apiMocks.mockHealth({ status: 'unhealthy' });

        // 4. 上传第二个文件并尝试触发 (此时应该会因为健康检查失败而无法【开始执行】)
        // 注意：addOCRTask 内部会先等待健康检查。
        await pageList.uploadAndWaitReady([TestData.files.samplePNG()]);
        await ocrPage.triggerOCR(1);

        // 验证第二个页面处于 pending 状态 (因为队列并发为1，第一个在执行，第二个在排队)
        // 且因为服务已不健康，即便第一个完成，第二个也应该卡在 waitForHealthyService
        await expect.poll(async () => await ocrPage.getPageStatus(1), { timeout: 5000 }).toBe('pending_ocr');

        // 5. 恢复服务健康
        await apiMocks.mockHealth({ status: 'healthy' });

        // 6. 验证第二个任务最终成功
        await ocrPage.waitForOCRSuccess(1, 15000);
        expect(await ocrPage.getPageStatus(1)).toBe('ocr_success');
    });
});
