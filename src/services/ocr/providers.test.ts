import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DeepSeekOCRProvider } from './providers'

// Mock config
vi.mock('@/config', () => ({
    config: {
        // eslint-disable-next-line sonarjs/no-clear-text-protocols
        ocrApiEndpoint: 'http://mock-api/ocr'
    }
}))

// Mock fetch
const fetchMock = vi.fn()
global.fetch = fetchMock

describe('DeepSeekOCRProvider', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        fetchMock.mockReset()
    })

    const mockResponse = {
        success: true,
        text: 'test output',
        raw_text: 'raw',
        boxes: [],
        image_dims: { w: 100, h: 100 },
        prompt_type: 'document',
        metadata: { some: 'meta' }
    }

    it('should implement name property correctly', () => {
        const provider = new DeepSeekOCRProvider()
        expect(provider.name).toBe('deepseek')
    })

    it('should send POST request with FormData', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => mockResponse
        })

        const provider = new DeepSeekOCRProvider()
        const blob = new Blob(['fake-image'], { type: 'image/jpeg' })

        const result = await provider.process(blob)

        expect(fetchMock).toHaveBeenCalledTimes(1)
        const [url, options] = fetchMock.mock.calls[0]

        // eslint-disable-next-line sonarjs/no-clear-text-protocols
        expect(url).toBe('http://mock-api/ocr')
        expect(options.method).toBe('POST')
        expect(options.body).toBeInstanceOf(FormData)

        // Check FormData contents
        const formData = options.body as FormData
        expect(formData.get('file')).toBeInstanceOf(Blob)
        expect(formData.get('prompt_type')).toBe('document')

        // Verify result mapping
        expect(result).toEqual({
            success: true,
            text: 'test output',
            raw_text: 'raw',
            boxes: [],
            image_dims: { w: 100, h: 100 },
            prompt_type: 'document'
        })
    })

    it('should handle API errors', async () => {
        fetchMock.mockResolvedValue({
            ok: false,
            status: 500,
            statusText: 'Server Error'
        })

        const provider = new DeepSeekOCRProvider()
        const blob = new Blob([''], { type: 'image/jpeg' })

        await expect(provider.process(blob)).rejects.toThrow('OCR API Error: 500 Server Error')
    })

    it('should handle network errors', async () => {
        fetchMock.mockRejectedValue(new Error('Network Failure'))

        const provider = new DeepSeekOCRProvider()
        const blob = new Blob([''], { type: 'image/jpeg' })

        await expect(provider.process(blob)).rejects.toThrow('Network Failure')
    })
    it('should pass AbortSignal to fetch', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => mockResponse
        })

        const provider = new DeepSeekOCRProvider()
        const blob = new Blob([''], { type: 'image/jpeg' })
        const controller = new AbortController()

        await provider.process(blob, { signal: controller.signal })

        expect(fetchMock).toHaveBeenCalledTimes(1)
        const [, options] = fetchMock.mock.calls[0]
        expect(options.signal).toBe(controller.signal)
    })
})
