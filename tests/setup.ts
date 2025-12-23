import { beforeAll, afterEach, vi } from 'vitest'
import 'fake-indexeddb/auto'

// Mock browser global variables
if (typeof global.URL.createObjectURL === 'undefined') {
    global.URL.createObjectURL = vi.fn(() => 'mock-url')
}

if (typeof global.URL.revokeObjectURL === 'undefined') {
    global.URL.revokeObjectURL = vi.fn()
}

// You can add global mock logic here, such as mocks for the OCR API client
// Assuming there will be src/services/ocr/index.ts in the future
vi.mock('@/services/ocr', () => ({
    performOCR: vi.fn(async () => 'Mocked OCR Text')
}))

beforeAll(() => {
    // Global initialization logic
})

afterEach(() => {
    // Cleanup logic after each test
    vi.clearAllMocks()
})
