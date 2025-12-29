import PQueue from 'p-queue'
import { queueLogger } from '@/utils/logger'

export class QueueManager {
    private ocrQueue: PQueue
    private generationQueue: PQueue
    private controllers: Map<string, { controller: AbortController; type: 'ocr' | 'generation' }>

    constructor() {
        this.ocrQueue = new PQueue({ concurrency: 2 })
        this.generationQueue = new PQueue({ concurrency: 1 })
        this.controllers = new Map()

        this.ocrQueue.on('active', () => {
            queueLogger.debug(`[OCR Queue] Size: ${this.ocrQueue.size}  Pending: ${this.ocrQueue.pending}`)
        })

        this.generationQueue.on('active', () => {
            queueLogger.debug(`[Gen Queue] Size: ${this.generationQueue.size}  Pending: ${this.generationQueue.pending}`)
        })
    }

    /**
     * Add an OCR task to the queue
     * @param pageId The ID of the page to process
     * @param taskFn The task function that accepts an AbortSignal
     */
    async addOCRTask(pageId: string, taskFn: (signal: AbortSignal) => Promise<void>) {
        // If a task for this page already exists and is running/pending, we might want to cancel it first
        // or just let it be. For now, we assume explicit cancellation is handled by caller or we just overwrite.
        // Ideally, we should cancel previous task for same pageId to avoid duplicate processing.
        if (this.controllers.has(pageId)) {
            queueLogger.warn(`[QueueManager] Task for page ${pageId} already exists. Canceling previous task.`)
            this.cancel(pageId)
        }

        const controller = new AbortController()
        this.controllers.set(pageId, { controller, type: 'ocr' })

        try {
            await this.ocrQueue.add(async () => {
                if (controller.signal.aborted) {
                    queueLogger.info(`[QueueManager] Task for page ${pageId} was aborted before start.`)
                    return
                }

                try {
                    await taskFn(controller.signal)
                } catch (error) {
                    if (error instanceof Error && error.name === 'AbortError') {
                        queueLogger.info(`[QueueManager] Task for page ${pageId} aborted during execution.`)
                    } else {
                        queueLogger.error(`[QueueManager] Task for page ${pageId} failed:`, error)
                        throw error; // Re-throw to let p-queue handle it (metrics etc)
                    }
                } finally {
                    // Cleanup controller only if it's the same one (in case of race where new task added immediately)
                    const entry = this.controllers.get(pageId)
                    if (entry && entry.controller === controller) {
                        this.controllers.delete(pageId)
                    }
                }
            })
        } catch (err) {
            // Queue add error (rare)
            queueLogger.error(`[QueueManager] Failed to add task for page ${pageId}`, err)
        }
    }

    /**
      * Add a generation task (e.g. Markdown, PDF generation)
      */
    async addGenerationTask(pageId: string, taskFn: (signal: AbortSignal) => Promise<void>) {
        // Similar logic for generation queue, maybe separate controller map or shared?
        // Using shared map implies a page can't be doing OCR and Gen at same time (which is true locally)
        // But safer to allow if they are distinct steps. 
        // For simplicity and spec "Maintenance Map<pageId, AbortController>", assuming one active task per page.

        if (this.controllers.has(pageId)) {
            // If OCR is running, and we queue Gen, we shouldn't cancel OCR? 
            // Wait, Gen usually happens AFTER OCR.
            // If Gen is running and we queue Gen again (retry), we cancel previous.
            // Let's assume shared control for simplicity for now, but watch out for conflicts.
            queueLogger.warn(`[QueueManager] Task for page ${pageId} exists when adding Gen task. Canceling.`)
            this.cancel(pageId)
        }

        const controller = new AbortController()
        this.controllers.set(pageId, { controller, type: 'generation' })

        try {
            await this.generationQueue.add(async () => {
                if (controller.signal.aborted) return

                try {
                    await taskFn(controller.signal)
                } catch (error) {
                    if (error instanceof Error && error.name === 'AbortError') {
                        queueLogger.info(`[QueueManager] Gen Task for page ${pageId} aborted.`)
                    } else {
                        queueLogger.error(`[QueueManager] Gen Task for page ${pageId} failed:`, error)
                        throw error
                    }
                } finally {
                    const entry = this.controllers.get(pageId)
                    if (entry && entry.controller === controller) {
                        this.controllers.delete(pageId)
                    }
                }
            })
        } catch (err) {
            queueLogger.error(`[QueueManager] Failed to add generation task for page ${pageId}`, err)
        }
    }

    /**
     * Cancel task for a specific page
     */
    cancel(pageId: string) {
        const entry = this.controllers.get(pageId)
        if (entry) {
            entry.controller.abort()
            this.controllers.delete(pageId)
            queueLogger.info(`[QueueManager] Cancelled task for page ${pageId}`)
        }
    }

    /**
     * Clear all queues
     */
    clear() {
        this.ocrQueue.clear()
        this.generationQueue.clear()
        for (const [, entry] of this.controllers) {
            entry.controller.abort()
        }
        this.controllers.clear()
        queueLogger.info('[QueueManager] Cleared all queues')
    }

    getStats() {
        const activeOCR = Array.from(this.controllers.values()).filter(c => c.type === 'ocr').length
        const activeGen = Array.from(this.controllers.values()).filter(c => c.type === 'generation').length

        return {
            ocr: {
                effectiveSize: activeOCR,
                size: this.ocrQueue.size,
                pending: this.ocrQueue.pending,
                isPaused: this.ocrQueue.isPaused
            },
            generation: {
                effectiveSize: activeGen,
                size: this.generationQueue.size,
                pending: this.generationQueue.pending,
                isPaused: this.generationQueue.isPaused
            }
        }
    }
}

export const queueManager = new QueueManager()
