// OCR Service - Placeholder implementation
// This service will handle text extraction from images using various OCR providers

import { DeepSeekOCRProvider } from './providers'
export * from './types'
import type { OCRProvider, OCRResult, OCROptions } from './types'
import { QueueFullError } from './types'

import { db } from '@/db'
import { ocrEvents } from './events'
import { queueManager } from '@/services/queue'
import { useHealthStore } from '@/stores/health'
import { consola } from 'consola'

const ocrLogger = consola.withTag('OCR')

export class OCRService {
  private providers: Map<string, OCRProvider> = new Map()

  constructor() {
    this.registerProvider('deepseek', new DeepSeekOCRProvider())
  }

  registerProvider(name: string, provider: OCRProvider) {
    this.providers.set(name, provider)
  }

  /**
   * Queue an OCR task for a page
   * Tasks are enqueued regardless of current service state.
   * Retry logic for both "queue full" and "service unavailable" is handled
   * uniformly in executeWithRetry.
   */
  async queueOCR(
    pageId: string,
    imageData: Blob | string,
    options?: OCROptions
  ): Promise<void> {
    ocrEvents.emit('ocr:queued', { pageId })

    // Fire and forget - processing happens in queue
    queueManager.addOCRTask(pageId, async (signal) => {
      await this.executeWithRetry(pageId, imageData, options, signal)
    }).catch(err => {
      ocrLogger.error(`[OCRService] Task error for ${pageId}:`, err)
    })
  }

  // ...

  /**
   * Execute OCR with retry logic
   */
  private async executeWithRetry(
    pageId: string,
    imageData: Blob | string,
    options: OCROptions | undefined,
    signal: AbortSignal
  ): Promise<void> {
    const retryInterval = 5000
    const healthStore = useHealthStore()

    while (true) {
      if (signal.aborted) return

      // Unified retry for queue full OR service unavailable
      if (healthStore.isFull || !healthStore.isAvailable) {
        const reason = healthStore.isFull
          ? 'queue is full'
          : 'service is unavailable'
        ocrLogger.info(`[OCRService] Server ${reason}, waiting ${retryInterval}ms for page ${pageId}`)
        await this.delayWithSignal(retryInterval, signal)
        continue
      }

      const shouldContinue = await this.tryProcessOCR(pageId, imageData, options, signal, retryInterval)
      if (!shouldContinue) return
    }
  }

  /**
   * Try to process OCR, returns true if should retry
   */
  private async tryProcessOCR(
    pageId: string,
    imageData: Blob | string,
    options: OCROptions | undefined,
    signal: AbortSignal,
    retryInterval: number
  ): Promise<boolean> {
    try {
      ocrEvents.emit('ocr:start', { pageId })
      const result = await this.processImage(imageData, 'deepseek', { ...options, signal })
      if (signal.aborted) return false

      await db.savePageOCR({ pageId, data: result, createdAt: new Date() })
      ocrEvents.emit('ocr:success', { pageId, result })
      return false
    } catch (error) {
      if (signal.aborted) return false

      if (this.isRetryableError(error)) {
        ocrLogger.warn(`[OCRService] OCR task for page ${pageId} failed, retrying in ${retryInterval}ms...`, error)
        await this.delayWithSignal(retryInterval, signal)
        return true
      }

      const err = error instanceof Error ? error : new Error(String(error))
      ocrEvents.emit('ocr:error', { pageId, error: err })
      throw err
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof QueueFullError) return true

    if (error instanceof Error) {
      const message = error.message.toLowerCase()

      // Exclude generic rate limit errors
      if (message.includes('limit') || message.includes('at max')) {
        return false
      }

      return this.isNetworkError(message) ||
        this.isServerError(message) ||
        this.isTimeoutError(message, error)
    }

    return false
  }

  private isNetworkError(message: string): boolean {
    return (
      message.includes('failed to fetch') ||
      message.includes('load failed') ||
      message.includes('network error') ||
      message.includes('connection refused') ||
      message.includes('dns_probe_finished')
    )
  }

  private isServerError(message: string): boolean {
    return message.includes(' 5') && (message.includes('error') || message.includes('api'))
  }

  private isTimeoutError(message: string, error: Error): boolean {
    return message.includes('timeout') && error.name !== 'AbortError'
  }

  /**
   * Helper to wait for a specific duration while respecting an AbortSignal
   */
  private delayWithSignal(ms: number, signal: AbortSignal): Promise<void> {
    return new Promise((resolve) => {
      if (signal.aborted) {
        resolve()
        return
      }

      const timer = setTimeout(resolve, ms)

      const onAbort = () => {
        clearTimeout(timer)
        resolve()
      }

      signal.addEventListener('abort', onAbort, { once: true })
    })
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

  /**
   * Queue multiple pages for batch OCR processing
   * Skips pages that are currently in the OCR queue (pending or processing)
   * Allows re-OCR of pages that have already completed OCR
   * @param pages - Array of pages with id and status
   * @returns Statistics about queued, skipped, and failed pages
   */
  async queueBatchOCR(
    pages: Array<{ id: string; status: string }>
  ): Promise<{ queued: number; skipped: number; failed: number }> {
    let queued = 0
    let skipped = 0
    let failed = 0

    // Skip only pages that are currently being processed in the OCR queue
    const skipStatuses = [
      'pending_ocr',      // Already queued
      'recognizing'       // Currently processing OCR
    ]

    for (const page of pages) {
      const status = page.status

      // Skip if page is in a skip status
      if (skipStatuses.includes(status)) {
        skipped++
        continue
      }

      // Try to queue the page (ready or error status)
      try {
        const imageBlob = await db.getPageImage(page.id)
        if (imageBlob) {
          await this.queueOCR(page.id, imageBlob, {
            prompt_type: 'document'
          })
          queued++
        } else {
          failed++
        }
      } catch {
        failed++
      }
    }

    return { queued, skipped, failed }
  }

  /**
   * Resume interrupted OCR tasks on startup
   * Retries pages that were in 'pending_ocr' or 'recognizing' state
   * @param pages - Array of pages with id and status
   */
  async resumeBatchOCR(
    pages: Array<{ id: string; status: string }>
  ): Promise<void> {
    const resumeStatuses = ['pending_ocr', 'recognizing']

    for (const page of pages) {
      if (resumeStatuses.includes(page.status)) {
        try {
          const imageBlob = await db.getPageImage(page.id)
          if (imageBlob) {
            await this.queueOCR(page.id, imageBlob, {
              prompt_type: 'document'
            })
          }
        } catch (error) {
          console.error(`[OCRService] Failed to resume task for ${page.id}:`, error)
        }
      }
    }
  }
}

export const ocrService = new OCRService()