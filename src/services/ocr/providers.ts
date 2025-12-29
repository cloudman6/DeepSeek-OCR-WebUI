import { config } from '@/config'
import type { OCRProvider, OCRResult, OCROptions } from './index'

export class DeepSeekOCRProvider implements OCRProvider {
    name = 'deepseek'

    async process(imageData: Blob | string, options?: OCROptions): Promise<OCRResult> {
        const formData = new FormData()

        // Handle both Blob (from file/canvas) and base64 string (legacy/other sources)
        if (imageData instanceof Blob) {
            formData.append('file', imageData, 'image.jpg')
        } else {
            // If it's a string, assume it's a data URL, convert to Blob
            const blob = await (await fetch(imageData)).blob()
            formData.append('file', blob, 'image.jpg')
        }

        // Add options
        const promptType = options?.prompt_type || 'document'
        formData.append('prompt_type', promptType)

        try {
            const response = await fetch(config.ocrApiEndpoint, {
                method: 'POST',
                body: formData
            })

            if (!response.ok) {
                throw new Error(`OCR API Error: ${response.status} ${response.statusText}`)
            }

            const result = await response.json()

            // Map raw API response to OCRResult
            // API currently matches the interface exactly, but explicit mapping is safer
            return {
                success: result.success,
                text: result.text,
                raw_text: result.raw_text,
                boxes: result.boxes || [],
                image_dims: result.image_dims || { w: 0, h: 0 },
                prompt_type: result.prompt_type
            }
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Unknown error during OCR processing');
        }
    }
}
