import { describe, it, expect, vi } from 'vitest'
import { OCRService, type OCRProvider, type OCRResult } from './index'

describe('OCRService', () => {
  const mockResult: OCRResult = {
    text: 'test text',
    confidence: 0.95,
    processingTime: 100
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
    
    const result = await service.processImage('data:image/png;base64,...', 'test')
    
    expect(result).toEqual(mockResult)
    expect(mockProvider.process).toHaveBeenCalledWith('data:image/png;base64,...', undefined)
  })

  it('should throw error if provider is not found', async () => {
    const service = new OCRService()
    
    await expect(service.processImage('data...', 'unknown'))
      .rejects.toThrow("OCR provider 'unknown' not found")
  })

  it('should pass options to provider', async () => {
    const service = new OCRService()
    service.registerProvider('test', mockProvider)
    const options = { language: 'eng', confidence: 0.8 }
    
    await service.processImage('data...', 'test', options)
    
    expect(mockProvider.process).toHaveBeenCalledWith('data...', options)
  })
})
