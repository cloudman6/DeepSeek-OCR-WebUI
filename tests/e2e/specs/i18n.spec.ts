import { test, expect } from '../fixtures/base-test'
import { uploadFiles } from '../utils/file-upload'

// Helper function to reliably switch language
async function switchLanguage(page: import('playwright').Page, language: 'en' | 'zh-CN') {
  const langName = language === 'en' ? 'English' : '中文'
  const expectedLabel = language === 'en' ? 'English' : '中文'

  // Click language selector button
  await page.click('[data-testid="language-selector-button"]')

  // Wait for dropdown menu to appear
  await page.waitForSelector('.n-dropdown-menu', { timeout: 5000, state: 'visible' })

  // Find and click the language option
  const dropdownOption = page.locator(`.n-dropdown-option:has-text("${langName}")`).first()

  // Click the option
  await dropdownOption.click()

  // Wait for dropdown to close
  await page.waitForSelector('.n-dropdown-menu', { timeout: 5000, state: 'hidden' }).catch(() => {})

  // Wait for and verify the language actually changed
  await page.waitForFunction(
    (expected: string) => {
      const label = document.querySelector('[data-testid="current-language-label"]')
      return label?.textContent === expected
    },
    expectedLabel,
    { timeout: 5000 }
  )
}

test.describe('Internationalization (i18n)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test.describe('P0: Language Selector Visibility', () => {
    test('should display language selector button in header', async ({ page }) => {
      await expect(page.locator('[data-testid="language-selector-button"]')).toBeVisible()
    })

    test('should display current language label', async ({ page }) => {
      const label = page.locator('[data-testid="current-language-label"]')
      await expect(label).toBeVisible()
      const text = await label.textContent()
      expect(text).toMatch(/^(English|中文)$/)
    })
  })

  test.describe('P0: Language Switching', () => {
    test('should switch from English to Chinese', async ({ page }) => {
      // Use helper function to switch language
      await switchLanguage(page, 'zh-CN')

      // Verify key UI elements are in Chinese
      await expect(page.getByText('拖放 PDF 或图片到此处开始')).toBeVisible()
    })

    test('should switch from Chinese to English', async ({ page }) => {
      // First switch to Chinese
      await switchLanguage(page, 'zh-CN')

      // Verify in Chinese
      await expect(page.locator('[data-testid="current-language-label"]')).toContainText('中文')

      // Switch back to English using helper function
      await switchLanguage(page, 'en')

      // Verify key UI elements are in English
      await expect(page.getByText('Drop PDF or Images here to start')).toBeVisible()
    })

    test('should show both language options in dropdown', async ({ page }) => {
      // Click to open dropdown
      await page.click('[data-testid="language-selector-button"]')

      // Verify both language options are visible
      await expect(page.getByText('English')).toBeVisible()
      await expect(page.getByText('中文')).toBeVisible()
    })
  })

  test.describe('P0: Language Persistence', () => {
    test('should persist language preference after page reload', async ({ page }) => {
      // Switch to Chinese using helper function
      await switchLanguage(page, 'zh-CN')

      // Verify language changed
      await expect(page.locator('[data-testid="current-language-label"]')).toContainText('中文')

      // Reload page
      await page.reload()

      // Verify language persisted
      await expect(page.locator('[data-testid="current-language-label"]')).toContainText('中文')
      await expect(page.getByText('拖放 PDF 或图片到此处开始')).toBeVisible()
    })

    test('should persist English language after page reload', async ({ page }) => {
      // Ensure starting in English
      const currentLang = await page.locator('[data-testid="current-language-label"]').textContent()
      if (currentLang !== 'English') {
        await switchLanguage(page, 'en')
      }

      // Verify language is English
      await expect(page.locator('[data-testid="current-language-label"]')).toContainText('English')

      // Reload page
      await page.reload()

      // Verify language persisted
      await expect(page.locator('[data-testid="current-language-label"]')).toContainText('English')
      await expect(page.getByText('Drop PDF or Images here to start')).toBeVisible()
    })
  })

  test.describe('P1: Initial Language Detection', () => {
    test('should use default language (English) when no localStorage and browser is non-Chinese', async ({ page }) => {
      // Clear localStorage
      await page.evaluate(() => localStorage.clear())

      // Set browser language to non-Chinese
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9'
      })

      // Reload page
      await page.reload()

      // Verify default language is English
      await expect(page.locator('[data-testid="current-language-label"]')).toContainText('English')
    })

    test('should prioritize localStorage over browser language', async ({ page }) => {
      // Set Chinese in localStorage
      await page.evaluate(() => localStorage.setItem('locale', 'zh-CN'))

      // Set browser language to English
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9'
      })

      // Reload page
      await page.reload()

      // Verify localStorage takes priority
      await expect(page.locator('[data-testid="current-language-label"]')).toContainText('中文')
    })
  })

  test.describe('P1: UI Text Translation', () => {
    test('should translate all key UI elements to Chinese', async ({ page }) => {
      // Switch to Chinese using helper function
      await switchLanguage(page, 'zh-CN')

      // Verify key text elements are translated
      await expect(page.getByText('拖放 PDF 或图片到此处开始')).toBeVisible()

      // Verify header button text
      await expect(page.getByRole('button', { name: /导入文件/ })).toBeVisible()
    })

    test('should translate all key UI elements to English', async ({ page }) => {
      // Switch to English using helper function
      await switchLanguage(page, 'en')

      // Verify key text elements are translated
      await expect(page.getByText('Drop PDF or Images here to start')).toBeVisible()

      // Verify header button text
      await expect(page.getByRole('button', { name: /Import Files/ })).toBeVisible()
    })

    test('should translate empty state text correctly', async ({ page }) => {
      // Test in English
      await switchLanguage(page, 'en')
      await expect(page.getByText('Drop PDF or Images here to start')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Select Files' })).toBeVisible()

      // Test in Chinese
      await switchLanguage(page, 'zh-CN')
      await expect(page.getByText('拖放 PDF 或图片到此处开始')).toBeVisible()
      await expect(page.getByRole('button', { name: '选择文件' })).toBeVisible()
    })
  })

  test.describe('Cross-language Functionality', () => {
    test('should work correctly in Chinese - file upload button exists', async ({ page }) => {
      // Switch to Chinese using helper function
      await switchLanguage(page, 'zh-CN')

      // Verify import button exists with correct text
      await expect(page.getByRole('button', { name: /导入文件/ })).toBeVisible()

      // Verify empty state text
      await expect(page.getByText('拖放 PDF 或图片到此处开始')).toBeVisible()
      await expect(page.getByRole('button', { name: '选择文件' })).toBeVisible()
    })

    test('should work correctly in English - file upload button exists', async ({ page }) => {
      // Switch to English using helper function
      await switchLanguage(page, 'en')

      // Verify import button exists with correct text
      await expect(page.getByRole('button', { name: /Import Files/ })).toBeVisible()

      // Verify empty state text
      await expect(page.getByText('Drop PDF or Images here to start')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Select Files' })).toBeVisible()
    })

    test('should toggle between languages and maintain functionality', async ({ page }) => {
      // Start in English
      await switchLanguage(page, 'en')
      await expect(page.getByRole('button', { name: /Import Files/ })).toBeVisible()

      // Switch to Chinese
      await switchLanguage(page, 'zh-CN')
      await expect(page.getByRole('button', { name: /导入文件/ })).toBeVisible()
    })
  })

  test.describe('P1: UI Text Translation After File Upload', () => {
    test.beforeEach(async ({ page }) => {
      // Upload a sample PDF using the utility function
      await uploadFiles(page, ['tests/e2e/samples/sample.pdf'])

      // Wait for pages to be ready
      await page.waitForSelector('.page-item', { timeout: 15000 })
    })

    test('should translate page counter to Chinese', async ({ page }) => {
      // Switch to Chinese using helper function
      await switchLanguage(page, 'zh-CN')

      // Verify page counter in Chinese
      await expect(page.getByText(/已加载 \d{1,3} 个页面/)).toBeVisible()
    })

    test('should translate page counter to English', async ({ page }) => {
      // Switch to English using helper function
      await switchLanguage(page, 'en')

      // Verify page counter in English
      await expect(page.getByText(/\d{1,3} Pages Loaded/)).toBeVisible()
    })

    test('should translate page item buttons to Chinese', async ({ page }) => {
      // Switch to Chinese using helper function
      await switchLanguage(page, 'zh-CN')

      // Hover over a page item to show buttons
      const firstPageItem = page.locator('.page-item').first()
      await firstPageItem.hover()

      // Verify OCR and Delete buttons in Chinese
      await expect(page.getByRole('button', { name: '扫描为文档' }).first()).toBeVisible()
      await expect(page.getByRole('button', { name: '删除页面' }).first()).toBeVisible()
    })

    test('should translate page item buttons to English', async ({ page }) => {
      // Switch to English using helper function
      await switchLanguage(page, 'en')

      // Hover over a page item to show buttons
      const firstPageItem = page.locator('.page-item').first()
      await firstPageItem.hover()

      // Verify OCR and Delete buttons in English
      await expect(page.getByRole('button', { name: 'Scan to Document' }).first()).toBeVisible()
      await expect(page.getByRole('button', { name: 'Delete page' }).first()).toBeVisible()
    })

    test('should translate PageViewer text to Chinese', async ({ page }) => {
      // Switch to Chinese using helper function
      await switchLanguage(page, 'zh-CN')

      // Verify PageViewer placeholder text in Chinese
      await expect(page.getByText('选择一个页面查看')).toBeVisible()

      // Verify status text in Chinese
      await expect(page.getByText('状态:')).toBeVisible()
      await expect(page.getByText('就绪')).toBeVisible()

      // Verify fit button in Chinese
      await expect(page.getByRole('button', { name: '适应' })).toBeVisible()
    })

    test('should translate PageViewer text to English', async ({ page }) => {
      // Switch to English using helper function
      await switchLanguage(page, 'en')

      // Verify PageViewer placeholder text in English
      await expect(page.getByText('Select a page to view')).toBeVisible()

      // Verify status text in English
      await expect(page.getByText('Status:')).toBeVisible()
      await expect(page.getByText('Ready')).toBeVisible()

      // Verify fit button in English
      await expect(page.getByRole('button', { name: 'Fit' })).toBeVisible()
    })

    test('should translate Preview panel to Chinese', async ({ page }) => {
      // Switch to Chinese using helper function
      await switchLanguage(page, 'zh-CN')

      // Verify download button in Chinese (this validates preview panel is translated)
      await expect(page.getByRole('button', { name: '下载 MD' })).toBeVisible()
    })

    test('should translate Preview panel to English', async ({ page }) => {
      // Switch to English using helper function
      await switchLanguage(page, 'en')

      // Verify download button in English (this validates preview panel is translated)
      await expect(page.getByRole('button', { name: 'Download MD' })).toBeVisible()
    })

    test('should maintain translations when switching languages after file upload', async ({ page }) => {
      // Start in Chinese using helper function
      await switchLanguage(page, 'zh-CN')
      await expect(page.getByText(/已加载 \d{1,3} 个页面/)).toBeVisible()

      // Switch to English using helper function
      await switchLanguage(page, 'en')
      await expect(page.getByText(/\d{1,3} Pages Loaded/)).toBeVisible()

      // Switch back to Chinese to verify it still works
      await switchLanguage(page, 'zh-CN')
      await expect(page.getByText(/已加载 \d{1,3} 个页面/)).toBeVisible()
    })
  })
})
