import Dexie, { type EntityTable, type Transaction } from 'dexie'
import type { PageProcessingLog, PageOutput } from '@/stores/pages'
import { isWebkit } from '@/utils/browser'

export interface DBFile {
  id?: string
  name: string
  content: Blob | ArrayBuffer
  size: number
  type: string
  createdAt: Date
}

export interface DBPage {
  id?: string
  fileId?: string // Reference to DBFile
  pageNumber?: number // Page number in the original file
  fileName: string
  fileSize: number
  fileType: string
  origin: 'upload' | 'pdf_generated' | 'scanner'
  status: 'pending_render' | 'rendering' | 'ready' | 'recognizing' | 'completed' | 'error'
  progress: number
  order: number  // Sort order for drag and drop
  imageData?: string  // base64 image data
  thumbnailData?: string  // base64 thumbnail data
  width?: number
  height?: number
  ocrText?: string
  ocrConfidence?: number
  outputs: PageOutput[]
  logs: PageProcessingLog[]
  createdAt: Date
  updatedAt: Date
  processedAt?: Date
  // Store original PDF data for reliable re-rendering
  originalPdfData?: ArrayBuffer
  // Store PDF base64 for easier reconstruction
  pdfBase64?: string
}

export interface DBProcessingQueue {
  id?: string
  pageId: string
  priority: number
  addedAt: Date
}

export interface PageImage {
  pageId: string
  blob: Blob | ArrayBuffer
}

export class Scan2DocDB extends Dexie {
  files!: EntityTable<DBFile, 'id'>
  pages!: EntityTable<DBPage, 'id'>
  processingQueue!: EntityTable<DBProcessingQueue, 'id'>
  pageImages!: EntityTable<PageImage, 'pageId'>
  counters!: EntityTable<{ id: string; value: number }, 'id'>

  constructor() {
    super('Scan2Doc_V1')

    // Define the final schema directly as Version 1
    // No migration history needed for development reset
    this.version(1).stores({
      files: 'id, name, type, createdAt',
      pages: 'id, fileName, fileId, status, order, createdAt',
      processingQueue: 'id, pageId, priority, addedAt',
      pageImages: 'pageId',
      counters: 'id'
    })
  }

  // File methods
  async saveFile(file: DBFile): Promise<string> {
    const cleanFile = { ...file }

    // Ensure ID exists
    if (!cleanFile.id) {
      cleanFile.id = generateFileId()
    }

    if (isWebkit() && cleanFile.content instanceof Blob) {
      try {
        cleanFile.content = await cleanFile.content.arrayBuffer()
      } catch (e) {
        console.error('[DB-ERROR] Failed to convert file content to arrayBuffer', e)
      }
    }

    if (file.id) { // If original file had ID, it's an update
      await this.files.put(cleanFile)
    } else {
      // New file
      await this.files.add(cleanFile)
    }

    return cleanFile.id
  }

  async getFile(id: string): Promise<DBFile | undefined> {
    const file = await this.files.get(id)
    return file ? this.ensureBlobContent(file) : undefined
  }

  private ensureBlobContent(file: DBFile): DBFile {
    if (file.content instanceof ArrayBuffer) {
      file.content = new Blob([file.content], { type: file.type })
    }
    return file
  }

  async deleteFile(id: string): Promise<void> {
    await this.files.delete(id)
  }

  // Page Image methods
  async savePageImage(pageId: string, blob: Blob): Promise<void> {
    try {
      let dataToSave: Blob | ArrayBuffer = blob
      if (isWebkit()) {
        dataToSave = await blob.arrayBuffer()
      }
      await this.pageImages.put({ pageId, blob: dataToSave })
    } catch (error) {
      console.error(`[DB-ERROR] Failed to save image for page ${pageId}:`, error)
      throw error
    }
  }

  async getPageImage(pageId: string): Promise<Blob | undefined> {
    try {
      const record = await this.pageImages.get(pageId)
      if (!record) return undefined
      if (record.blob instanceof ArrayBuffer) {
        return new Blob([record.blob], { type: 'image/png' })
      }
      return record.blob
    } catch (error) {
      console.error(`[DB-ERROR] Failed to get image for page ${pageId}:`, error)
      return undefined
    }
  }

  // Page methods
  async savePage(page: DBPage): Promise<string> {
    const cleanPage = { ...page } as DBPage
    if (cleanPage.order === undefined || cleanPage.order === -1) {
      cleanPage.order = await this.getNextOrder()
    }
    if (!cleanPage.id) {
      cleanPage.id = generatePageId()
    }
    await this.pages.put(cleanPage)
    return cleanPage.id
  }

  async savePagesBatch(pages: Omit<DBPage, 'id' | 'order'>[]): Promise<string[]> {
    return await this.transaction('rw', [this.pages, this.counters], async (tx) => {
      const startOrder = await this.getNextOrderBatch(pages.length, tx)
      const cleanPages = pages.map((page, index) => {
        const clean = {
          ...page,
          order: startOrder + index,
          createdAt: page.createdAt || new Date(),
          updatedAt: new Date()
        } as DBPage
        if (!clean.id) {
          clean.id = generatePageId()
        }
        return clean
      })
      await this.pages.bulkPut(cleanPages)
      return cleanPages.map(p => p.id!)
    })
  }

  private async getNextOrderBatch(count: number, tx?: Transaction): Promise<number> {
    const operation = async (transaction: Transaction) => {
      const countersTable = transaction.table('counters')
      const counterId = 'pages_order'
      const record = await countersTable.get(counterId)
      const current = record ? record.value : 0
      await countersTable.put({ id: counterId, value: current + count })
      return current
    }

    if (tx) {
      return await operation(tx)
    }

    return await this.transaction('rw', this.counters, async (transaction) => {
      return await operation(transaction)
    })
  }

  async getNextOrder(): Promise<number> {
    return await this.getNextOrderBatch(1)
  }

  async getPage(id: string): Promise<DBPage | undefined> {
    return await this.pages.get(id)
  }

  async getAllPages(): Promise<DBPage[]> {
    return await this.pages.orderBy('order').toArray()
  }

  async getPagesByStatus(status: DBPage['status']): Promise<DBPage[]> {
    return await this.pages.where('status').equals(status).toArray()
  }

  async deletePage(id: string): Promise<void> {
    await this.pages.delete(id)
    await this.pageImages.delete(id)
    await this.processingQueue.where('pageId').equals(id).delete()
  }

  async deleteAllPages(): Promise<void> {
    await this.transaction('rw', [this.pages, this.processingQueue, this.pageImages, this.counters], async () => {
      const pages = await this.pages.toArray()
      const pageIds = pages.map(p => p.id!).filter(Boolean)
      await this.pages.clear()
      await this.pageImages.clear()
      await this.counters.clear() // Clean up counters too
      if (pageIds.length > 0) {
        await this.processingQueue.where('pageId').anyOf(pageIds).delete()
      }
    })
  }

  // Processing queue methods
  async addToQueue(pageId: string, priority: number = 0): Promise<string> {
    const existing = await this.processingQueue.where('pageId').equals(pageId).first()
    if (existing) return existing.id!.toString()

    // Explicitly generate ID since schema is not auto-incrementing
    const newEntry: DBProcessingQueue = {
      id: generateQueueId(),
      pageId,
      priority,
      addedAt: new Date()
    }
    await this.processingQueue.add(newEntry)
    return newEntry.id!
  }

  async removeFromQueue(pageId: string): Promise<void> {
    await this.processingQueue.where('pageId').equals(pageId).delete()
  }

  async getNextFromQueue(): Promise<DBProcessingQueue | undefined> {
    return await this.processingQueue.orderBy('priority').reverse().first()
  }

  async getQueueCount(): Promise<number> {
    return await this.processingQueue.count()
  }

  async saveAddedPage(pageData: Omit<DBPage, 'id' | 'createdAt' | 'updatedAt' | 'order'>): Promise<string> {
    const order = await this.getNextOrder()
    const dbPage: DBPage = {
      ...pageData,
      id: generatePageId(),
      order,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    await this.pages.add(dbPage)
    return dbPage.id!
  }

  async getAllPagesForDisplay(): Promise<DBPage[]> {
    return await this.getAllPages()
  }

  async updatePagesOrder(pageOrders: { id: string; order: number }[]): Promise<void> {
    await this.transaction('rw', this.pages, async () => {
      for (const { id, order } of pageOrders) {
        await this.pages.update(id, { order, updatedAt: new Date() })
      }
    })
  }

  async clearAllData(): Promise<void> {
    await this.transaction('rw', [this.pages, this.processingQueue, this.pageImages, this.counters], async () => {
      await this.pages.clear()
      await this.processingQueue.clear()
      await this.pageImages.clear()
      await this.counters.clear()
    })
  }

  async getStorageSize(): Promise<number> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      return estimate.usage || 0
    }
    return 0
  }
}

export const db = new Scan2DocDB()

function getSecureRandomPart(): string {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  return array[0].toString(36)
}

export function generatePageId(): string {
  const randomPart = getSecureRandomPart()
  return `page_${Date.now()}_${randomPart}_${crypto.randomUUID().split('-')[0]}`
}

export function generateFileId(): string {
  const randomPart = getSecureRandomPart()
  return `file_${Date.now()}_${randomPart}_${crypto.randomUUID().split('-')[0]}`
}

function generateQueueId(): string {
  const randomPart = getSecureRandomPart()
  return `queue_${Date.now()}_${randomPart}`
}