import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DocumentService } from './index'
import { ocrEvents } from '@/services/ocr/events'
import { db } from '@/db'
import { imageProcessor } from './image-processor'
import { queueManager } from '@/services/queue'

// Polyfill for Blob.arrayBuffer
if (!Blob.prototype.arrayBuffer) {
    Blob.prototype.arrayBuffer = function () {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as ArrayBuffer)
            reader.onerror = reject
            reader.readAsArrayBuffer(this)
        })
    }
}

// Mock dependencies
vi.mock('@/db', () => ({
    db: {
        getPageImage: vi.fn(),
        savePageMarkdown: vi.fn(),
        savePageDOCX: vi.fn(),
        savePagePDF: vi.fn()
    }
}))

vi.mock('./image-processor', () => ({
    imageProcessor: {
        sliceImages: vi.fn()
    }
}))

vi.mock('./pdf', () => ({
    sandwichPDFBuilder: {
        generate: vi.fn().mockResolvedValue(new Blob(['pdf-content'], { type: 'application/pdf' }))
    }
}))

vi.mock('@/services/queue', () => ({
    queueManager: {
        addGenerationTask: vi.fn()
    }
}))

describe('DocumentService Integration', () => {
    let service: DocumentService

    beforeEach(() => {
        vi.clearAllMocks()
        service = new DocumentService()
    })

    it('should handle ocr:success and queue generation task', async () => {
        const pageId = 'page1'
        const result: any = {
            success: true,
            text: 'test',
            raw_text: '',
            boxes: [],
            image_dims: { w: 1, h: 1 },
            prompt_type: 'document'
        }

        // Trigger event
        ocrEvents.emit('ocr:success', { pageId, result })

        expect(queueManager.addGenerationTask).toHaveBeenCalledWith(pageId, expect.any(Function))
    })

    it('should generate markdown, docx and pdf', async () => {
        const pageId = 'page1'
        const result: any = {
            success: true,
            text: 'test',
            raw_text: '',
            boxes: [],
            image_dims: { w: 1, h: 1 },
            prompt_type: 'document'
        }
        const mockImage = new Blob(['image'], { type: 'image/png' })

        vi.mocked(db.getPageImage).mockResolvedValue(mockImage)
        vi.mocked(imageProcessor.sliceImages).mockResolvedValue(new Map())

        const startEvents: string[] = []
        const successEvents: string[] = []

        ocrEvents.on('doc:gen:start', (payload) => startEvents.push(payload.type))
        ocrEvents.on('doc:gen:success', (payload) => successEvents.push(payload.type))

        await service.generateMarkdown(pageId, result)

        expect(db.savePageMarkdown).toHaveBeenCalled()
        expect(db.savePageDOCX).toHaveBeenCalled()
        expect(db.savePagePDF).toHaveBeenCalled()

        expect(startEvents).toContain('markdown')
        expect(startEvents).toContain('docx')
        expect(startEvents).toContain('pdf')
        expect(successEvents).toContain('markdown')
        expect(successEvents).toContain('docx')
        expect(successEvents).toContain('pdf')
    })
})
