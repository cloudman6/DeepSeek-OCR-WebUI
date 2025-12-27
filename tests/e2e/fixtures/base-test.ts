import { test as base, expect } from '@playwright/test';

/**
 * Custom fixture that extends the base Playwright test.
 * It monitors the browser console for errors and warnings.
 * If any are found during a test, the test will fail.
 */
export const test = base.extend({
    page: async ({ page }, use) => {
        const logs: { type: string; text: string }[] = [];

        // Listen for console messages
        page.on('console', msg => {
            const type = msg.type();
            if (type === 'error' || type === 'warning') {
                logs.push({ type, text: msg.text() });
            }
        });

        // Listen for uncaught exceptions
        page.on('pageerror', exc => {
            logs.push({ type: 'pageerror', text: exc.message });
        });

        // Run the actual test
        await use(page);

        // After test completion, assert that no errors or warnings were logged
        if (logs.length > 0) {
            // Filter out known benign warnings
            const filteredLogs = logs.filter(log => {
                // Ignore Firefox scroll-linked positioning warning
                return !log.text.includes('scroll-linked positioning effect');
            });

            if (filteredLogs.length > 0) {
                const formattedLogs = filteredLogs
                    .map(log => `[${log.type.toUpperCase()}] ${log.text}`)
                    .join('\n');

                // We use a custom message for the expectation failure
                expect(filteredLogs, `Found browser console logs during test:\n${formattedLogs}`).toHaveLength(0);
            }
        }
    },
});

export { expect };
