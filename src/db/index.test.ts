import 'dexie'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import 'fake-indexeddb/auto'
import { db, type DBPage, type DBFile } from './index'
import { createPinia, setActivePinia } from 'pinia'

// Helper to clean object for Dexie (remove id if it's an auto-increment key)
function cleanForAdd<T extends { id?: string | number }>(obj: T): T {
    const newObj: Record<string, unknown> = { ...obj }
    delete newObj.id
    return newObj as T
}

const createTestPage = (id: string, order: number = 0): DBPage => ({
    id,
    fileName: 'test.pdf',
    fileSize: 100,
    fileType: 'application/pdf',
    origin: 'upload',
    status: 'ready',
    progress: 100,
    order,
    outputs: [],
    logs: [],
    createdAt: new Date(),
    updatedAt: new Date()
})

// Mock storage estimate
const mockEstimate = vi.fn()
if (typeof window !== 'undefined') {
    if (!window.navigator.storage) {
        Object.defineProperty(window.navigator, 'storage', {
            value: { estimate: mockEstimate },
            writable: true,
            configurable: true
        })
    } else {
        vi.spyOn(window.navigator.storage, 'estimate').mockImplementation(mockEstimate)
    }
}

describe('Scan2DocDB', () => {
    beforeEach(async () => {
        setActivePinia(createPinia())
        // Thoroughly clear ALL tables before each test
        await db.pages.clear()
        await db.files.clear()
        await db.pageImages.clear()
        await db.processingQueue.clear()
        await db.counters.clear()
        mockEstimate.mockReset()
    })

    // Skip: These tests have issues with fake-indexeddb's strict add() validation
    // They work in real browser environments but fail in vitest/jsdom
    describe('File Methods', () => {
        it('should save and get a file', async () => {
            const file = {
                name: 'test.pdf',
                content: new Blob(['test']),
                size: 4,
                type: 'application/pdf',
                createdAt: new Date()
            } as DBFile

            const id = await db.saveFile(cleanForAdd(file))
            expect(id).toBeDefined()

            const retrieved = await db.getFile(id)
            expect(retrieved?.name).toBe('test.pdf')
        })

        it('should update an existing file if it has an id', async () => {
            const file = {
                name: 'test.pdf',
                content: new Blob(['test']),
                size: 4,
                type: 'application/pdf',
                createdAt: new Date()
            } as DBFile

            const id = await db.saveFile(cleanForAdd(file))
            const retrievedBefore = await db.getFile(id)

            const updatedFile = { ...retrievedBefore!, name: 'updated.pdf' }
            await db.saveFile(updatedFile)

            const retrievedAfter = await db.getFile(id)
            expect(retrievedAfter?.name).toBe('updated.pdf')
        })
    })

    describe('Page Image Methods', () => {
        it('should save and get a page image', async () => {
            const pageId = 'page1'
            const blob = new Blob(['image data'], { type: 'image/jpeg' })

            await db.savePageImage(pageId, blob)
            const retrieved = await db.getPageImage(pageId)
            expect(retrieved).toBeDefined()
        })

        it('should return undefined for non-existent page image', async () => {
            const retrieved = await db.getPageImage('nonexistent')
            expect(retrieved).toBeUndefined()
        })
    })

    describe('Page Methods', () => {
        it('should save and get a page', async () => {
            const page = createTestPage('page1')
            await db.savePage(page)

            const retrieved = await db.getPage('page1')
            expect(retrieved?.fileName).toBe('test.pdf')
        })

        it('should add a page without id', async () => {
            const page = {
                fileName: 'test.pdf',
                fileSize: 100,
                fileType: 'application/pdf',
                origin: 'upload',
                status: 'ready',
                progress: 100,
                order: 0,
                outputs: [],
                logs: [],
                createdAt: new Date(),
                updatedAt: new Date()
            } as DBPage

            const id = await db.savePage(cleanForAdd(page))
            expect(id).toBeDefined()
            expect(await db.getPage(id)).toBeDefined()
        })

        it('should get all pages ordered by order', async () => {
            await db.savePage(createTestPage('p2', 2))
            await db.savePage(createTestPage('p1', 1))

            const pages = await db.getAllPages()
            expect(pages.length).toBe(2)
            expect(pages[0]!.id).toBe('p1')
            expect(pages[1]!.id).toBe('p2')
        })

        it('should get pages by status', async () => {
            const pa = createTestPage('pa')
            pa.status = 'ready'
            const pb = createTestPage('pb')
            pb.status = 'error'

            await db.savePage(pa)
            await db.savePage(pb)

            const readyPages = await db.getPagesByStatus('ready')
            expect(readyPages.length).toBe(1)
            expect(readyPages[0]!.id).toBe('pa')
        })

        it('should delete a page and its associated data', async () => {
            const pageId = 'p1'
            await db.savePage(createTestPage(pageId))
            await db.savePageImage(pageId, new Blob(['test']))
            await db.addToQueue(pageId, 1)

            await db.deletePage(pageId)

            expect(await db.getPage(pageId)).toBeUndefined()
            expect(await db.getPageImage(pageId)).toBeUndefined()
            expect(await db.getQueueCount()).toBe(0)
        })

        it('should save added page with defaults', async () => {
            const pageData = {
                fileName: 'test.pdf',
                fileSize: 100,
                fileType: 'application/pdf',
                origin: 'upload',
                status: 'ready',
                progress: 100,
                order: 0,
                outputs: [],
                logs: []
            }

            const id = await db.saveAddedPage(pageData as Omit<DBPage, 'id' | 'createdAt' | 'updatedAt' | 'order'>)
            const retrieved = await db.getPage(id)
            expect(retrieved?.createdAt).toBeDefined()
        })

        it('should get next order', async () => {
            // Check implicit order assignment (consumes 0)
            const id1 = await db.savePage(createTestPage('p1', -1))
            const p1 = await db.getPage(id1)
            expect(p1?.order).toBe(0)

            // Check explicit fetch (consumes 1)
            expect(await db.getNextOrder()).toBe(1)

            // Check next implicit assignment (consumes 2)
            const id2 = await db.savePage(createTestPage('p2', -1))
            const p2 = await db.getPage(id2)
            expect(p2?.order).toBe(2)
        })

        it('should correctly save batch with atomic orders', async () => {
            await db.savePagesBatch([
                createTestPage('b1', -1),
                createTestPage('b2', -1)
            ] as DBPage[])

            const pages = await db.getAllPages()
            expect(pages.length).toBe(2)
            expect(pages[0]!.order).toBe(0)
            expect(pages[1]!.order).toBe(1)
        })
    })

    describe('Processing Queue Methods', () => {
        it('should add to and remove from queue', async () => {
            const pageId = 'p1'
            const qid = await db.addToQueue(pageId, 10)
            expect(qid).toBeDefined()

            await db.removeFromQueue(pageId)
            expect(await db.getQueueCount()).toBe(0)
        })

        it('should get next from queue based on priority', async () => {
            await db.addToQueue('p1', 1)
            await db.addToQueue('p2', 10)

            const next = await db.getNextFromQueue()
            expect(next?.pageId).toBe('p2')
        })
    })

    describe('Utility Methods', () => {
        it('should clear all data', async () => {
            await db.savePage(createTestPage('p1'))
            await db.clearAllData()
            expect(await db.pages.count()).toBe(0)
        })

        it('should get storage size', async () => {
            mockEstimate.mockResolvedValue({ usage: 1024 })
            const size = await db.getStorageSize()
            expect(size).toBe(1024)
        })
    })


})
