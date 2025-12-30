import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sandwichPDFBuilder } from './pdf'
import { PDFDocument } from 'pdf-lib'

// Mock pdf-lib
vi.mock('pdf-lib', async (importOriginal) => {
    const actual = await importOriginal() as typeof import('pdf-lib')
    return {
        ...actual,
        PDFDocument: {
            create: vi.fn(),
            load: vi.fn()
        },
        rgb: vi.fn()
    }
})

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

describe('SandwichPDFBuilder', () => {
    let mockPdfDoc: any
    let mockPage: any

    beforeEach(() => {
        vi.clearAllMocks()

        mockPage = {
            drawImage: vi.fn(),
            drawText: vi.fn(),
            getSize: vi.fn().mockReturnValue({ width: 100, height: 100 })
        }

        mockPdfDoc = {
            embedJpg: vi.fn().mockResolvedValue({ width: 100, height: 100 }),
            embedPng: vi.fn().mockResolvedValue({ width: 100, height: 100 }),
            addPage: vi.fn().mockReturnValue(mockPage),
            save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
            getPages: vi.fn().mockReturnValue([mockPage]),
            getPageCount: vi.fn().mockReturnValue(1)
        }

        vi.mocked(PDFDocument.create).mockResolvedValue(mockPdfDoc)
        vi.mocked(PDFDocument.load).mockResolvedValue(mockPdfDoc)
    })

    const mockBlob = new Blob(['fake-image'], { type: 'image/jpeg' })

    it('should generate a PDF from an image without text', async () => {
        const ocrResult = {
            success: true,
            text: 'text',
            raw_text: '',
            boxes: [],
            image_dims: { w: 1, h: 1 },
            prompt_type: 'document'
        }

        const pdfBlob = await sandwichPDFBuilder.generate(mockBlob, ocrResult)

        expect(PDFDocument.create).toHaveBeenCalled()
        expect(mockPdfDoc.embedJpg).toHaveBeenCalled()
        expect(mockPdfDoc.addPage).toHaveBeenCalled()
        expect(mockPage.drawImage).toHaveBeenCalled()
        expect(mockPdfDoc.save).toHaveBeenCalled()

        expect(pdfBlob).toBeInstanceOf(Blob)
        expect(pdfBlob.type).toBe('application/pdf')
    })

    it('should try PNG if JPG fails', async () => {
        mockPdfDoc.embedJpg.mockRejectedValueOnce(new Error('Not JPG'))

        const ocrResult = {
            success: true,
            text: 'text',
            raw_text: '',
            boxes: [],
            image_dims: { w: 1, h: 1 },
            prompt_type: 'document'
        }

        await sandwichPDFBuilder.generate(mockBlob, ocrResult)
        expect(mockPdfDoc.embedJpg).toHaveBeenCalled()
        expect(mockPdfDoc.embedPng).toHaveBeenCalled()
    })

    it('should generate a PDF with invisible text layer', async () => {
        const rawItems = [
            { text: 'Hello', box: [10, 10, 50, 20] }
        ]

        const ocrResult = {
            success: true,
            text: 'Hello World',
            raw_text: JSON.stringify(rawItems),
            boxes: [],
            image_dims: { w: 200, h: 200 },
            prompt_type: 'document'
        }

        await sandwichPDFBuilder.generate(mockBlob, ocrResult)

        expect(mockPage.drawText).toHaveBeenCalledWith('Hello', expect.objectContaining({
            opacity: 0,
            x: 10
        }))
    })

    it('should handle invalid raw_text gracefully (no overlay)', async () => {
        const ocrResult = {
            success: true,
            text: 'text',
            raw_text: 'Invalid JSON',
            boxes: [],
            image_dims: { w: 1, h: 1 },
            prompt_type: 'document'
        }

        await sandwichPDFBuilder.generate(mockBlob, ocrResult)

        expect(mockPage.drawText).not.toHaveBeenCalled()
    })

    it('should fail if both JPG and PNG embedding fails', async () => {
        mockPdfDoc.embedJpg.mockRejectedValue(new Error('Not JPG'))
        mockPdfDoc.embedPng.mockRejectedValue(new Error('Not PNG'))

        const ocrResult = {
            success: true,
            text: 'text',
            raw_text: '',
            boxes: [],
            image_dims: { w: 1, h: 1 },
            prompt_type: 'document'
        }

        await expect(sandwichPDFBuilder.generate(mockBlob, ocrResult))
            .rejects.toThrow('Unsupported image format')
    })

    it('should handle ArrayBuffer input', async () => {
        const arrayBuffer = new ArrayBuffer(8)
        const result = await sandwichPDFBuilder.generate(arrayBuffer, {
            success: true,
            text: '',
            raw_text: '',
            boxes: [],
            image_dims: { w: 100, h: 100 },
            prompt_type: 'document'
        })
        expect(result).toBeDefined()
    })

    it('should handle invalid raw_text type (not array)', async () => {
        const ocrResult = {
            success: true,
            text: 'text',
            raw_text: '"not an array"',
            boxes: [],
            image_dims: { w: 1, h: 1 },
            prompt_type: 'document'
        }
        await sandwichPDFBuilder.generate(mockBlob, ocrResult)
        expect(mockPage.drawText).not.toHaveBeenCalled()
    })

    it('should handle empty or malformed raw_text items', async () => {
        const raw_text = JSON.stringify([
            { text: '', box: [0, 0, 0, 0] },
            { text: 'test', box: [0, 0] }, // malformed box
            { text: 'ok', box: [0, 0, 10, 10] }
        ])
        const ocrResult = {
            success: true,
            text: '',
            raw_text,
            boxes: [],
            image_dims: { w: 100, h: 100 },
            prompt_type: 'document'
        }
        await sandwichPDFBuilder.generate(mockBlob, ocrResult)
        expect(mockPage.drawText).toHaveBeenCalledWith('ok', expect.any(Object))
    })
})
