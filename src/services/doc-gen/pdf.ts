import { PDFDocument, rgb } from 'pdf-lib'
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
        let image

        // Try to embed as JPG, then PNG
        try {
            image = await pdfDoc.embedJpg(arrayBuffer)
        } catch {
            try {
                image = await pdfDoc.embedPng(arrayBuffer)
            } catch {
                throw new Error('Unsupported image format. Only JPG and PNG are supported.')
            }
        }

        const page = pdfDoc.addPage([image.width, image.height])
        page.drawImage(image, {
            x: 0,
            y: 0,
            width: image.width,
            height: image.height,
        })

        // Overlay text
        if (ocrResult.raw_text) {
            try {
                const rawItems: RawTextItem[] = JSON.parse(ocrResult.raw_text)

                if (Array.isArray(rawItems)) {
                    for (const item of rawItems) {
                        const { text, box } = item
                        if (!text || !box || box.length !== 4) continue

                        const [x1, y1, , y2] = box
                        const height = y2 - y1

                        // PDF coordinate system starts at bottom-left
                        // OCR coordinates typically start at top-left
                        // So flip Y
                        const pdfY = image.height - y2

                        // Simple heuristic for font size: height of the box
                        // Can be improved but sufficient for "selectable text"

                        page.drawText(text, {
                            x: x1,
                            y: pdfY,
                            size: height > 0 ? height : 12,
                            color: rgb(0, 0, 0),
                            opacity: 0, // Invisible
                        })
                    }
                }
            } catch (e) {
                console.warn('[SandwichPDFBuilder] Failed to parse raw_text, generating image-only PDF.', e)
                // Fallback: Embed full text as a hidden layer at 0,0?
                // For now, adhere to "Sandwich PDF" usually meaning alignment.
                // If we can't align, maybe better not to put garbage text layout.
            }
        }

        const pdfBytes = await pdfDoc.save()
        return new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' })
    }
}

export const sandwichPDFBuilder = new SandwichPDFBuilder()
