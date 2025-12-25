import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ExportService, type ExportResult } from './index'

describe('ExportService', () => {
  let exportService: ExportService

  beforeEach(() => {
    exportService = new ExportService()
  })

  describe('generateFilename', () => {
    it('should generate a filename with default document name', async () => {
      const timestamp = new Date('2023-01-01T12:00:00Z')
      const filename = await exportService.generateFilename(undefined, 'md', timestamp)

      // Expected format: document_2023-01-01_12-00-00.md (timezone dependent, so we use regex)
      expect(filename).toMatch(/^document_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.md$/)
    })

    it('should sanitize document name', async () => {
      const timestamp = new Date('2023-01-01T12:00:00Z')
      const filename = await exportService.generateFilename('my document!@#', 'pdf', timestamp)

      expect(filename).toContain('my_document___')
      expect(filename.endsWith('.pdf')).toBe(true)
    })
  })

  describe('unimplemented methods', () => {
    const pages: unknown[] = []
    const options: Record<string, unknown> = { format: 'markdown' }

    it('should throw error for exportToMarkdown', async () => {
      await expect(exportService.exportToMarkdown(pages, options)).rejects.toThrow('Not implemented yet')
    })

    it('should throw error for exportToHTML', async () => {
      await expect(exportService.exportToHTML(pages, options)).rejects.toThrow('Not implemented yet')
    })

    it('should throw error for exportToDOCX', async () => {
      await expect(exportService.exportToDOCX(pages, options)).rejects.toThrow('Not implemented yet')
    })

    it('should throw error for exportToPDF', async () => {
      await expect(exportService.exportToPDF(pages, options)).rejects.toThrow('Not implemented yet')
    })
  })

  describe('downloadBlob', () => {
    it('should trigger download using DOM elements', () => {
      // Mock URL methods
      const createObjectURLMock = vi.fn().mockReturnValue('blob:url')
      const revokeObjectURLMock = vi.fn()
      globalThis.URL.createObjectURL = createObjectURLMock
      globalThis.URL.revokeObjectURL = revokeObjectURLMock

      // Mock document.createElement
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
        style: {}
      } as import("@/db").DBPage
      const createElementMock = vi.spyOn(document, 'createElement').mockReturnValue(mockLink)
      const appendChildMock = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink)
      const removeChildMock = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink)

      const mockResult: ExportResult = {
        blob: new Blob(['test'], { type: 'text/plain' }),
        filename: 'test.txt',
        mimeType: 'text/plain',
        size: 4
      }

      exportService.downloadBlob(mockResult)

      expect(createObjectURLMock).toHaveBeenCalledWith(mockResult.blob)
      expect(createElementMock).toHaveBeenCalledWith('a')
      expect(mockLink.href).toBe('blob:url')
      expect(mockLink.download).toBe('test.txt')
      expect(appendChildMock).toHaveBeenCalledWith(mockLink)
      expect(mockLink.click).toHaveBeenCalled()
      expect(removeChildMock).toHaveBeenCalledWith(mockLink)
      expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:url')

      // Cleanup mocks
      createElementMock.mockRestore()
      appendChildMock.mockRestore()
      removeChildMock.mockRestore()
    })
  })
})
