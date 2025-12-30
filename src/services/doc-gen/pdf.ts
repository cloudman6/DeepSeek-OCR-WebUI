import { PDFDocument, PDFPage, rgb } from 'pdf-lib'
import type { OCRResult } from '@/services/ocr'

interface RawTextItem {
    text: string
    box: [number, number, number, number] // [x1, y1, x2, y2]
}

export class SandwichPDFBuilder {
    /**
     * Generate a dual-layer PDF (Image + Invisible Text)
     */
    async generate(imageBlob: Blob | ArrayBuffer, ocrResult: OCRResult): Promise<Blob> {
        const arrayBuffer = imageBlob instanceof Blob ? await imageBlob.arrayBuffer() : imageBlob

        const pdfDoc = await PDFDocument.create()
        const image = await this.embedImage(pdfDoc, arrayBuffer)

        const page = pdfDoc.addPage([image.width, image.height])
        page.drawImage(image, {
            x: 0,
            y: 0,
            width: image.width,
            height: image.height,
        })

        // Overlay text
        if (ocrResult.raw_text) {
            this.overlayOcrText(page, ocrResult.raw_text, image.height)
        }

        const pdfBytes = await pdfDoc.save()
        // Use Uint8Array which is a valid BlobPart
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return new Blob([pdfBytes as any], { type: 'application/pdf' })
    }

    private async embedImage(pdfDoc: PDFDocument, arrayBuffer: ArrayBuffer) {
        try {
            return await pdfDoc.embedJpg(arrayBuffer)
        } catch {
            try {
                return await pdfDoc.embedPng(arrayBuffer)
            } catch {
                throw new Error('Unsupported image format. Only JPG and PNG are supported.')
            }
        }
    }

    private overlayOcrText(page: PDFPage, rawTextJson: string, imageHeight: number) {
        try {
            const rawItems: RawTextItem[] = JSON.parse(rawTextJson)
            if (!Array.isArray(rawItems)) return

            for (const item of rawItems) {
                const { text, box } = item
                if (!text || !box || box.length !== 4) continue

                const [x1, y1, , y2] = box
                const height = y2 - y1
                const pdfY = imageHeight - y2

                page.drawText(text, {
                    x: x1,
                    y: pdfY,
                    size: height > 0 ? height : 12,
                    color: rgb(0, 0, 0),
                    opacity: 0, // Invisible
                })
            }
        } catch (e) {
            console.warn('[SandwichPDFBuilder] Failed to parse raw_text, generating image-only PDF.', e)
        }
    }
}

export const sandwichPDFBuilder = new SandwichPDFBuilder()
