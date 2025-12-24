import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  queuePDFPages, 
  queuePDFPageRender, 
  resumePDFProcessing, 
  pdfRenderQueue,
  getQueueStats,
  pauseQueue,
  resumeQueue,
  clearQueue
} from '@/services/pdf/pdfQueue'
import { db } from '@/db/index'
import { pdfEvents } from '@/services/pdf/events'
import { enhancedPdfRenderer } from '@/services/pdf/enhancedPdfRenderer'
import { queueLogger } from '@/services/logger'

// Mock dependencies
vi.mock('@/db/index', () => ({
  db: {
    getNextOrder: vi.fn().mockResolvedValue(1),
    savePage: vi.fn(),
    getPage: vi.fn(),
    savePageImage: vi.fn(),
    getAllPages: vi.fn().mockResolvedValue([]),
    getPagesByStatus: vi.fn().mockResolvedValue([]),
    getFile: vi.fn(),
    deleteFile: vi.fn(),
  },
  generatePageId: () => 'page-id-' + Math.random().toString(36).substr(2, 5)
}))

vi.mock('@/services/pdf/events', () => ({
  pdfEvents: {
    emit: vi.fn()
  }
}))

vi.mock('@/services/pdf/enhancedPdfRenderer', () => ({
  enhancedPdfRenderer: {
    getOptimalFallbackFont: vi.fn().mockResolvedValue('sans-serif'),
    destroyDocument: vi.fn()
  }
}))

vi.mock('@/services/logger', () => ({
  queueLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}))

// Mock PQueue
vi.mock('p-queue', () => {
  return {
    default: class MockPQueue {
      _queue: Function[] = []
      size = 0
      pending = 0
      isPaused = false
      concurrency = 2
      
      constructor(opts: any) {
        if (opts.concurrency) this.concurrency = opts.concurrency
      }

      async add(fn: Function) {
        this.size++
        try {
            this.pending++
            await fn()
        } finally {
            this.pending--
            this.size--
        }
      }
      
      pause() { this.isPaused = true }
      start() { this.isPaused = false }
      clear() { this.size = 0; this.pending = 0 }
    }
  }
})

// Module-level callback
let mockWorkerResponseCallback: ((worker: any, data: any) => void) | undefined
let mockWorkerLastMessage: any

// Mock Worker
class MockWorker {
  onmessage: any
  onerror: any
  
  constructor(scriptURL: string) {
      console.log('MockWorker constructed')
  }

  postMessage(data: any) {
    mockWorkerLastMessage = data
    setTimeout(() => {
        if (mockWorkerResponseCallback) {
            mockWorkerResponseCallback(this, data)
        } else {
            console.log('MockWorker: No responseCallback set')
        }
    }, 0)
  }

  addEventListener(type: string, listener: Function) {
    if (type === 'message') this.onmessage = listener
    if (type === 'error') this.onerror = listener
  }
  
  terminate() {}
}

// Globals setup
const originalWorker = global.Worker
const originalURL = global.URL
const originalImage = global.Image

describe('pdfQueue', () => {
    beforeEach(() => {
      vi.clearAllMocks()
  
      // Reset default mock implementations
      vi.mocked(db.getNextOrder).mockResolvedValue(1)
      vi.mocked(db.savePage).mockResolvedValue('page-id-1')
      vi.mocked(db.getPage).mockResolvedValue({ id: 'page-id-1', status: 'pending_render', logs: [] } as any)
      vi.mocked(db.getAllPages).mockResolvedValue([])
      vi.mocked(db.getPagesByStatus).mockResolvedValue([])
      vi.mocked(db.getFile).mockResolvedValue({ name: 'test.pdf', content: new Blob([]), size: 100 } as any)
      vi.mocked(enhancedPdfRenderer.getOptimalFallbackFont).mockResolvedValue('sans-serif')
      
      global.Worker = MockWorker as any;
      mockWorkerResponseCallback = undefined;
      mockWorkerLastMessage = undefined;

      // Mock URL with constructor support
      global.URL = class MockURL {
          constructor(url: string, base?: string) {}
          static createObjectURL = vi.fn().mockReturnValue('blob:url')
          static revokeObjectURL = vi.fn()
      } as any

      global.Image = class MockImage {
        onload: any
        onerror: any
        src: string = ''
        width = 100
        height = 100
        
        constructor() {
          setTimeout(() => {
            if (this.src && this.onload) this.onload()
          }, 0)
        }
      } as any

      // Mock Canvas
      const mockContext = {
        drawImage: vi.fn(),
      }
      const mockCanvas = {
        getContext: vi.fn().mockReturnValue(mockContext),
        toDataURL: vi.fn().mockReturnValue('data:image/jpeg;base64,thumb'),
        width: 0,
        height: 0
      }
      // @ts-ignore
      document.createElement = vi.fn((tag) => {
        if (tag === 'canvas') return mockCanvas
        return document.createElement(tag)
      })
    })

  afterEach(() => {
    global.Worker = originalWorker
    global.URL = originalURL
    global.Image = originalImage
    clearQueue()
  })

  describe('queuePDFPages', () => {
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
    const pdfData = new ArrayBuffer(10)

    it('should create pages and add to queue', async () => {
      vi.mocked(db.savePage).mockResolvedValue('page-id-1')
      
      await queuePDFPages(file, pdfData, 2, 'file-id-1')

      expect(db.savePage).toHaveBeenCalled()
      expect(db.savePage).toHaveBeenCalledWith(expect.objectContaining({ status: 'pending_render' }))
      
      await new Promise(resolve => setTimeout(resolve, 50))
      
      expect(pdfEvents.emit).toHaveBeenCalledWith('pdf:processing-start', expect.anything())
      expect(pdfEvents.emit).toHaveBeenCalledWith('pdf:page:queued', expect.anything())
      // Since our MockPQueue executes immediately, render should have been called
      // Render calls getWorker, which posts message.
      expect(mockWorkerLastMessage).toBeDefined()
    })

    it('should handle errors during queueing', async () => {
      vi.mocked(db.savePage).mockRejectedValue(new Error('DB Error'))
      
      await queuePDFPages(file, pdfData, 1)

      expect(queueLogger.error).toHaveBeenCalled()
      expect(pdfEvents.emit).toHaveBeenCalledWith('pdf:processing-error', expect.anything())
    })
  })

  describe('render execution flow', () => {
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
    const pdfData = new ArrayBuffer(10)

    it('should render page and handle success', async () => {
      vi.mocked(db.savePage).mockResolvedValueOnce('page-id-1')
      vi.mocked(db.getPage).mockResolvedValue({ id: 'page-id-1', status: 'pending_render', logs: [] } as any)
      
      mockWorkerResponseCallback = (worker: MockWorker, request: any) => {
          if (request.type === 'render') {
              worker.onmessage({
                  data: {
                      pageId: request.payload.pageId,
                      imageBlob: new Blob(['image']),
                      width: 100, height: 100, pageNumber: 1, fileSize: 1000
                  }
              })
          }
      }

      await queuePDFPages(file, pdfData, 1, 'file-id-1')
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(queueLogger.info).toHaveBeenCalledWith(expect.stringContaining('Render success'))
      expect(db.savePageImage).toHaveBeenCalled()
      expect(pdfEvents.emit).toHaveBeenCalledWith('pdf:page:done', expect.anything())
      expect(db.savePage).toHaveBeenCalledWith(expect.objectContaining({ status: 'ready' }))
    })

    it('should handle worker error', async () => {
      vi.mocked(db.savePage).mockResolvedValueOnce('page-id-err')
      vi.mocked(db.getPage).mockResolvedValue({ id: 'page-id-err', status: 'pending_render', logs: [] } as any)
      
      mockWorkerResponseCallback = (worker: MockWorker, request: any) => {
          if (request.type === 'render') {
               worker.onmessage({
                   data: {
                       type: 'error',
                       payload: { pageId: request.payload.pageId, error: 'Render Failed' }
                   }
               })
          }
      }

      await queuePDFPages(file, pdfData, 1, 'file-id-err')
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(queueLogger.info).toHaveBeenCalledWith(expect.stringContaining('Render error'))
      expect(pdfEvents.emit).toHaveBeenCalledWith('pdf:page:error', expect.objectContaining({ error: 'Render Failed' }))
      expect(db.savePage).toHaveBeenCalledWith(expect.objectContaining({ status: 'error' }))
    })
  })

  describe('resumePDFProcessing', () => {
    it('should find incomplete pages and re-queue them', async () => {
      const incompletePage = {
        id: 'page-id-resume',
        fileId: 'file-id-1',
        fileName: 'test_1.png',
        status: 'pending_render',
        pageNumber: 1,
        origin: 'pdf_generated'
      }
      vi.mocked(db.getPagesByStatus).mockResolvedValueOnce([incompletePage as any])
      vi.mocked(db.getPagesByStatus).mockResolvedValueOnce([])
      
      const mockBlob = {
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(10)),
        size: 100,
        type: 'application/pdf'
      }

      vi.mocked(db.getFile).mockResolvedValue({
        name: 'test.pdf',
        content: mockBlob,
        size: 100
      } as any)
      
      vi.mocked(db.getPage).mockResolvedValue(incompletePage as any)

      vi.mocked(enhancedPdfRenderer.getOptimalFallbackFont).mockClear()

      await resumePDFProcessing()

      expect(db.getFile).toHaveBeenCalledWith('file-id-1')
      await new Promise(resolve => setTimeout(resolve, 100))
      
      if (vi.mocked(queueLogger.error).mock.calls.length > 0) {
        console.error('Queue Error calls:', vi.mocked(queueLogger.error).mock.calls)
      }

      expect(enhancedPdfRenderer.getOptimalFallbackFont).toHaveBeenCalled()
      expect(queueLogger.info).toHaveBeenCalledWith(expect.stringContaining('Successfully re-queued'))
    })

    it('should handle missing source file', async () => {
      const incompletePage = {
        id: 'page-id-missing',
        fileId: 'file-id-missing',
        origin: 'pdf_generated',
        fileName: 'test_1.png'
      }
      vi.mocked(db.getPagesByStatus).mockResolvedValueOnce([incompletePage as any])
      vi.mocked(db.getPagesByStatus).mockResolvedValueOnce([])
      vi.mocked(db.getFile).mockResolvedValue(undefined)

      await resumePDFProcessing()

      expect(db.savePage).toHaveBeenCalledWith(expect.objectContaining({ status: 'error' }))
      expect(pdfEvents.emit).toHaveBeenCalledWith('pdf:log', expect.objectContaining({ level: 'error' }))
    })
    
    it('should ignore non-pdf generated pages', async () => {
      const otherPage = { id: 'page-other', origin: 'scan', status: 'pending_render' }
      vi.mocked(db.getPagesByStatus).mockResolvedValueOnce([otherPage as any])
      vi.mocked(db.getPagesByStatus).mockResolvedValueOnce([])
      
      await resumePDFProcessing()
      
      expect(db.getFile).not.toHaveBeenCalled()
    })
  })

  describe('Coverage Improvements', () => {
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
    const pdfData = new ArrayBuffer(10)

    it('should handle render success when page is missing from DB', async () => {
       vi.mocked(db.savePage).mockResolvedValueOnce('page-id-missing')
       vi.mocked(db.getPage)
         .mockResolvedValueOnce({ id: 'page-id-missing', status: 'pending_render' } as any) // For renderPDFPage
         .mockResolvedValueOnce(undefined) // For handleRenderSuccess

       // Setup worker success
       mockWorkerResponseCallback = (worker: MockWorker, request: any) => {
          if (request.type === 'render') {
              worker.onmessage({
                  data: {
                      pageId: request.payload.pageId,
                      imageBlob: new Blob(['img']),
                      width: 100, height: 100, pageNumber: 1, fileSize: 100
                  }
              })
          }
       }

       await queuePDFPages(file, pdfData, 1, 'file-id-missing')
       await new Promise(resolve => setTimeout(resolve, 50))
       
       expect(queueLogger.warn).toHaveBeenCalledWith(expect.stringContaining('no longer in database'))
    })

    it('should handle render error when page is missing from DB', async () => {
       vi.mocked(db.savePage).mockResolvedValueOnce('page-id-missing-err')
       vi.mocked(db.getPage)
         .mockResolvedValueOnce({ id: 'page-id-missing-err', status: 'pending_render' } as any) // For renderPDFPage
         .mockResolvedValueOnce(undefined) // For handleRenderError

       // Setup worker error
       mockWorkerResponseCallback = (worker: MockWorker, request: any) => {
          if (request.type === 'render') {
              worker.onmessage({
                  data: { type: 'error', payload: { pageId: request.payload.pageId, error: 'Fail' } }
              })
          }
       }

       await queuePDFPages(file, pdfData, 1, 'file-id-missing-err')
       await new Promise(resolve => setTimeout(resolve, 50))
       
       expect(queueLogger.warn).toHaveBeenCalledWith(expect.stringContaining('no longer in database'))
    })

    it('should handle thumbnail generation failure gracefully', async () => {
       vi.mocked(db.savePage).mockResolvedValueOnce('page-id-thumb-fail')
       // We need getPage to succeed twice: renderPDFPage and handleRenderSuccess
       vi.mocked(db.getPage).mockResolvedValue({ id: 'page-id-thumb-fail', status: 'pending_render', logs: [] } as any)
       
       // Force image onload to fail
       const OriginalImage = global.Image
       global.Image = class ErrorImage {
         onerror: any
         src = ''
         constructor() {
           setTimeout(() => { if (this.onerror) this.onerror() }, 0)
         }
       } as any

       mockWorkerResponseCallback = (worker: MockWorker, request: any) => {
          if (request.type === 'render') {
              worker.onmessage({
                  data: {
                      pageId: request.payload.pageId,
                      imageBlob: new Blob(['img']),
                      width: 100, height: 100, pageNumber: 1, fileSize: 100
                  }
              })
          }
       }

       await queuePDFPages(file, pdfData, 1, 'file-id-thumb-fail')
       await new Promise(resolve => setTimeout(resolve, 100))
       
       expect(queueLogger.warn).toHaveBeenCalledWith(expect.stringContaining('Failed to generate thumbnail'), expect.anything())
       
       global.Image = OriginalImage
    })
    
    it('should cleanup source cache and delete file when all pages done', async () => {
       const pdfPage = { id: 'page-1', fileId: 'file-1', origin: 'pdf_generated', status: 'ready' }
       vi.mocked(db.getAllPages).mockResolvedValue([pdfPage as any])
       vi.mocked(db.getFile).mockResolvedValue({ name: 'test.pdf' } as any)
       
       vi.mocked(db.savePage).mockResolvedValueOnce('page-1')
       vi.mocked(db.getPage).mockResolvedValue({ id: 'page-1', status: 'pending_render', logs: [] } as any)

       mockWorkerResponseCallback = (worker: MockWorker, request: any) => {
          worker.onmessage({
              data: { pageId: request.payload.pageId, imageBlob: new Blob(['']), width: 100, height: 100, pageNumber: 1, fileSize: 100 }
          })
       }
       
       await queuePDFPages(file, pdfData, 1, 'file-1')
       await new Promise(resolve => setTimeout(resolve, 100))
       
       expect(enhancedPdfRenderer.destroyDocument).toHaveBeenCalledWith(expect.any(String))
       expect(db.deleteFile).toHaveBeenCalledWith('file-1')
       expect(pdfEvents.emit).toHaveBeenCalledWith('pdf:processing-complete', expect.anything())
    })

    it('should handle legacy pages in resume', async () => {
        vi.mocked(db.getPagesByStatus).mockResolvedValueOnce([
            { id: 'legacy-1', fileName: 'old_1.png', origin: 'pdf_generated' } as any
        ])
        vi.mocked(db.getPagesByStatus).mockResolvedValueOnce([])
        
        await resumePDFProcessing()
        
        expect(queueLogger.warn).toHaveBeenCalledWith(expect.stringContaining('legacy pages'))
        expect(db.savePage).toHaveBeenCalledWith(expect.objectContaining({ status: 'error' }))
    })

    it('should handle resume where page number cannot be determined', async () => {
        vi.mocked(db.getPagesByStatus).mockResolvedValueOnce([
            { id: 'no-num', fileId: 'file-1', fileName: 'bad-name.png', origin: 'pdf_generated' } as any
        ])
        vi.mocked(db.getPagesByStatus).mockResolvedValueOnce([])
        
        const mockBlob = {
             arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(10)),
             size: 100
        }
        vi.mocked(db.getFile).mockResolvedValue({ content: mockBlob, name: 'f.pdf' } as any)
        
        await resumePDFProcessing()
        
        expect(queueLogger.error).toHaveBeenCalledWith(expect.stringContaining('Could not determine page number'))
    })
    it('should skip queuing if page is already ready', async () => {
        vi.mocked(db.getPage).mockResolvedValue({ id: 'page-ready', status: 'ready' } as any)
        const addSpy = vi.spyOn(pdfRenderQueue, 'add')
        
        await queuePDFPageRender({ pageId: 'page-ready', pageNumber: 1, fileName: 'f.pdf', sourceId: 's1' })
        
        expect(addSpy).not.toHaveBeenCalled()
        expect(queueLogger.info).toHaveBeenCalledWith(expect.stringContaining('Skipping page'))
    })
  })

  describe('queue controls', () => {
    it('should return stats', () => {
      const stats = getQueueStats()
      expect(stats.size).toBe(0)
      expect(stats.pending).toBe(0)
      expect(stats.isPaused).toBe(false)
    })

    it('should pause and resume', () => {
      pauseQueue()
      expect(getQueueStats().isPaused).toBe(true)
      resumeQueue()
      expect(getQueueStats().isPaused).toBe(false)
    })
  })
})