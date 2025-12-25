import { beforeAll, afterEach, vi } from 'vitest'
import 'fake-indexeddb/auto'

// Mock browser global variables
if (typeof global.URL.createObjectURL === 'undefined') {
    global.URL.createObjectURL = vi.fn(() => 'mock-url')
}

if (typeof global.URL.revokeObjectURL === 'undefined') {
    global.URL.revokeObjectURL = vi.fn()
}

// Mock DOMMatrix for pdfjs-dist
type MockDOMMatrix = {
    new(): DOMMatrix
    fromFloat32Array(): DOMMatrix
    fromFloat64Array(): DOMMatrix
    fromMatrix(): DOMMatrix
}

if (typeof global.DOMMatrix === 'undefined') {
    global.DOMMatrix = class DOMMatrix {
        constructor() { }
        static fromFloat32Array() { return new DOMMatrix() }
        static fromFloat64Array() { return new DOMMatrix() }
        static fromMatrix() { return new DOMMatrix() }
    } as unknown as MockDOMMatrix
}

// Do not mock OCR service globally if we want to test it
// vi.mock('@/services/ocr', () => ({
//     performOCR: vi.fn(async () => 'Mocked OCR Text')
// }))

beforeAll(() => {
    // Global initialization logic
})

afterEach(() => {
    // Cleanup logic after each test
    vi.clearAllMocks()
})
