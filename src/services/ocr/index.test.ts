import { describe, it, expect, vi } from 'vitest'
import { OCRService, type OCRProvider, type OCRResult } from './index'

describe('OCRService', () => {
  const mockResult: OCRResult = {
    success: true,
    text: 'test text',
    raw_text: '<|ref|>test text<|/ref|>',
    boxes: [],
    image_dims: { w: 100, h: 100 },
    prompt_type: 'document'
  }

  const mockProvider: OCRProvider = {
    name: 'test-provider',
    process: vi.fn().mockResolvedValue(mockResult)
  }

  it('should register and return available providers', () => {
    const service = new OCRService()
    service.registerProvider('test', mockProvider)

    expect(service.getAvailableProviders()).toContain('test')
  })

  it('should process image with a registered provider', async () => {
    const service = new OCRService()
    service.registerProvider('test', mockProvider)

    const blob = new Blob(['test'], { type: 'image/png' })
    const result = await service.processImage(blob, 'test')

    expect(result).toEqual(mockResult)
    expect(mockProvider.process).toHaveBeenCalledWith(blob, undefined)
  })

  it('should throw error if provider is not found', async () => {
    const service = new OCRService()

    await expect(service.processImage('data...', 'unknown'))
      .rejects.toThrow("OCR provider 'unknown' not found")
  })

  it('should pass options to provider', async () => {
    const service = new OCRService()
    service.registerProvider('test', mockProvider)
    const options = { prompt_type: 'format_instruction' }

    await service.processImage('data...', 'test', options)

    expect(mockProvider.process).toHaveBeenCalledWith('data...', options)
  })
})
