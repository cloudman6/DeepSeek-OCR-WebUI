// OCR Service - Placeholder implementation
// This service will handle text extraction from images using various OCR providers

import { DeepSeekOCRProvider } from './providers'
export interface OCRBox {
  label: 'title' | 'image' | 'table' | 'text' | string
  box: [number, number, number, number] // [x1, y1, x2, y2]
}

export interface OCRResult {
  success: boolean
  text: string
  raw_text: string
  boxes: OCRBox[]
  image_dims: { w: number; h: number }
  prompt_type: string
}

export interface OCROptions {
  prompt_type?: string
}

export interface OCRProvider {
  name: string
  process(imageData: Blob | string, options?: OCROptions): Promise<OCRResult>
}

export class OCRService {
  private providers: Map<string, OCRProvider> = new Map()

  constructor() {
    this.registerProvider('deepseek', new DeepSeekOCRProvider())
  }

  registerProvider(name: string, provider: OCRProvider) {
    this.providers.set(name, provider)
  }

  async processImage(
    imageData: Blob | string,
    providerName: string = 'deepseek',
    options?: OCROptions
  ): Promise<OCRResult> {
    const provider = this.providers.get(providerName)
    if (!provider) {
      throw new Error(`OCR provider '${providerName}' not found`)
    }

    return await provider.process(imageData, options)
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys())
  }
}

export const ocrService = new OCRService()