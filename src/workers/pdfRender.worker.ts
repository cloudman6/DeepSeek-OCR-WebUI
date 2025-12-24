import * as pdfjsLib from 'pdfjs-dist'
import { CMAP_URL, CMAP_PACKED } from '../services/pdf/config'
import { workerLogger } from '@/utils/logger'

// Configure PDF.js worker
import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

interface PDFRenderMessage {
  type: 'render'
  payload: {
    pdfData: ArrayBuffer
    pageId: string
    pageNumber: number
    scale?: number
    imageFormat?: 'png' | 'jpeg'
    quality?: number
    fallbackFontFamily?: string
  }
}

interface PDFRenderResult {
  pageId: string
  imageBlob: Blob // Directly return binary data
  width: number
  height: number
  pageNumber: number
  fileSize: number
}

interface PDFErrorMessage {
  pageId: string
  error: string
}

type WorkerMessage = PDFRenderMessage
type WorkerResponse = PDFRenderResult | { type: 'error'; payload: PDFErrorMessage }

// Polyfill global document for PDF.js internals that expect it even in workers
if (typeof self !== 'undefined' && !self.document) {
  // @ts-ignore
  (self as any).document = {
    createElement: (name: string) => {
      if (name === 'canvas') {
        return new OffscreenCanvas(1, 1);
      }
      return null;
    }
  } as any;
}

// Custom CanvasFactory for Web Worker using OffscreenCanvas
class OffscreenCanvasFactory {
  create(width: number, height: number) {
    const canvas = new OffscreenCanvas(Math.max(1, width), Math.max(1, height));
    return {
      canvas,
      context: canvas.getContext('2d'),
    };
  }

  reset(canvasAndContext: any, width: number, height: number) {
    if (canvasAndContext.canvas) {
      canvasAndContext.canvas.width = Math.max(1, width);
      canvasAndContext.canvas.height = Math.max(1, height);
    }
  }

  destroy(canvasAndContext: any) {
    if (canvasAndContext.canvas) {
      canvasAndContext.canvas.width = 0;
      canvasAndContext.canvas.height = 0;
      canvasAndContext.canvas = null;
    }
    canvasAndContext.context = null;
  }
}

// Worker implementation
self.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data

  if (type !== 'render') {
    return
  }

  let pageId: string | undefined
  let pageNumber: number | undefined

  try {
    const {
      pdfData,
      pageId: inputPageId,
      pageNumber: inputPageNumber,
      scale = 2.5,  // Higher scale for better text quality
      imageFormat = 'png',
      quality = 0.95,  // Higher quality for better text rendering
      fallbackFontFamily
    } = payload

    // Store values for error handling
    pageId = inputPageId
    pageNumber = inputPageNumber

    // Validate inputs
    if (!pageId) {
      throw new Error('pageId is required')
    }
    if (!pageNumber || pageNumber < 1) {
      throw new Error(`Invalid pageNumber: ${pageNumber}`)
    }
    if (!pdfData || pdfData.byteLength === 0) {
      throw new Error('pdfData is empty or invalid')
    }

    // Load PDF document with enhanced font configuration
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(pdfData),
      cMapUrl: CMAP_URL,
      cMapPacked: CMAP_PACKED,
      // Enable font fallback for better text rendering
      useSystemFonts: true,
      // Increase font rendering quality
      fontExtraProperties: true,
      // Use custom canvas factory for worker environment
      canvasFactory: new OffscreenCanvasFactory(),
      // Enable enhanced font rendering
      verbosity: 0 // Reduce font loading warnings
    } as any)

    const pdfDocument = await loadingTask.promise

    // Get page
    const page = await pdfDocument.getPage(pageNumber)

    // Calculate viewport with scale
    const viewport = page.getViewport({ scale })

    // Create canvas
    const canvas = new OffscreenCanvas(viewport.width, viewport.height)
    const context = canvas.getContext('2d', {
      // Enable better text rendering settings
      alpha: false,  // Disable alpha channel for better text clarity
      desynchronized: true,  // Improve rendering performance
      willReadFrequently: false
    })!

    // Set rendering context properties for better text quality
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'

    // Apply font fallback if provided
    if (fallbackFontFamily) {
      (context as any).font = `${16 * scale}px ${fallbackFontFamily}`
    }

    // Enhanced text rendering with font fallback
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
      // Enable render for better text quality
      intent: 'print',  // Use print intent for higher quality rendering
      // Enhanced text rendering options
      renderInteractiveForms: true,
      // CRITICAL: Also pass canvasFactory here if PDF.js needs to create temporary canvases
      // Use both naming conventions for safety across versions
      canvasFactory: new OffscreenCanvasFactory(),
      CanvasFactory: OffscreenCanvasFactory
    }

    try {
      await (page.render(renderContext as any).promise)
    } catch (renderError) {
      workerLogger.warn('Enhanced rendering failed, falling back to standard rendering:', renderError)
      // Fallback to basic rendering if enhanced fails
      const fallbackFactory = new OffscreenCanvasFactory();
      await (page.render({
        canvasContext: context,
        viewport: viewport,
        intent: 'print',
        canvasFactory: fallbackFactory,
        CanvasFactory: OffscreenCanvasFactory
      } as any).promise)
    }

    // Convert canvas to base64 using convertToBlob (correct method for OffscreenCanvas)
    const mimeType = imageFormat === 'jpeg' ? 'image/jpeg' : 'image/png'

    // Create a blob from the OffscreenCanvas
    const blob = await canvas.convertToBlob({
      type: mimeType,
      quality: imageFormat === 'jpeg' ? quality : undefined
    })

    // Clean up resources to prevent memory leaks
    try {
      page.cleanup()
    } catch (e) { }

    try {
      await pdfDocument.destroy()
    } catch (e) { }

    // Send result back to main thread
    const response: PDFRenderResult = {
      pageId: pageId!,
      imageBlob: blob, // Send Blob directly
      pageNumber: pageNumber!,
      width: viewport.width,
      height: viewport.height,
      fileSize: blob.size
    }

    self.postMessage(response)

  } catch (error) {
    workerLogger.error('PDF rendering error:', error)

    // Ensure we have pageId for error response
    const errorPageId = pageId || payload?.pageId || 'unknown'

    const errorResponse: WorkerResponse = {
      type: 'error',
      payload: {
        pageId: errorPageId,
        error: error instanceof Error ? error.message : 'Unknown rendering error'
      }
    }

    self.postMessage(errorResponse)
  }
})