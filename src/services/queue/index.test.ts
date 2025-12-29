import { describe, it, expect, vi, beforeEach } from 'vitest'
import { queueManager } from './index'

describe('QueueManager', () => {
    beforeEach(() => {
        queueManager.clear()
        // Using real timers to avoid p-queue/fake-timer issues
    })

    it('should process OCR tasks', async () => {
        const taskFn = vi.fn().mockImplementation(async () => {
            await new Promise(resolve => setTimeout(resolve, 50))
        })

        const promise = queueManager.addOCRTask('page1', taskFn)

        // Wait a bit for it to start
        await new Promise(r => setTimeout(r, 10))

        expect(queueManager.getStats().ocr.pending).toBe(1)

        await promise

        expect(taskFn).toHaveBeenCalled()
        expect(queueManager.getStats().ocr.pending).toBe(0)
    })

    it('should support concurrency limit', async () => {
        // OCR queue has concurrency 2
        const slowTask = async () => new Promise(resolve => setTimeout(resolve, 100))

        const p1 = queueManager.addOCRTask('p1', slowTask)
        const p2 = queueManager.addOCRTask('p2', slowTask)
        const p3 = queueManager.addOCRTask('p3', slowTask)

        // Wait for start
        await new Promise(r => setTimeout(r, 10))

        expect(queueManager.getStats().ocr.pending).toBe(2)
        // Size = pending + queued = 2 + 1 = 3
        expect(queueManager.getStats().ocr.size).toBe(3)

        await Promise.all([p1, p2, p3])

        expect(queueManager.getStats().ocr.pending).toBe(0)
    })

    it('should cancel pending task', async () => {
        const taskFn = vi.fn()

        // Fill the queue first
        const p1 = queueManager.addOCRTask('p1', async () => new Promise(resolve => setTimeout(resolve, 50)))
        const p2 = queueManager.addOCRTask('p2', async () => new Promise(resolve => setTimeout(resolve, 50)))

        // Add waiting task
        const p3 = queueManager.addOCRTask('p3', taskFn)

        // Cancel p3 before it starts
        queueManager.cancel('p3')

        await Promise.all([p1, p2])

        // p3 promise might resolve (undefined) or reject?
        // addOCRTask catches errors?
        // If cancelled before start, my implementation returns early.
        await p3

        expect(taskFn).not.toHaveBeenCalled()
    })

    it('should abort running task', async () => {
        const abortFn = vi.fn()

        const taskPromise = queueManager.addOCRTask('p1', async (signal) => {
            signal.addEventListener('abort', abortFn)
            // Wait long enough to be aborted
            await new Promise(resolve => setTimeout(resolve, 200))
        })

        await new Promise(r => setTimeout(r, 50))
        expect(queueManager.getStats().ocr.pending).toBe(1)

        queueManager.cancel('p1')

        await new Promise(r => setTimeout(r, 50))
        expect(abortFn).toHaveBeenCalled()

        await taskPromise
    })

    it('should auto-cancel previous task for same pageId', async () => {
        const abortFn = vi.fn()
        const task1 = async (signal: AbortSignal) => {
            signal.addEventListener('abort', abortFn)
            await new Promise(resolve => setTimeout(resolve, 100))
        }

        const p1 = queueManager.addOCRTask('p1', task1)

        await new Promise(r => setTimeout(r, 20))

        // Add another task for p1 immediately
        const p2 = queueManager.addOCRTask('p1', async () => { })

        // Verify task1 was aborted
        await new Promise(r => setTimeout(r, 20))

        expect(abortFn).toHaveBeenCalled()

        await Promise.all([p1, p2])
    })
})
