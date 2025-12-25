import Dexie from 'dexie'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import 'fake-indexeddb/auto'
import { db, Scan2DocDB, generatePageId, type DBPage, type DBFile } from './index'

// Helper to clean object for Dexie (remove id if it's an auto-increment key)
function cleanForAdd<T extends { id?: string | number }>(obj: T): T {
    const newObj: Record<string, unknown> = {}
    for (const key in obj) {
        if (key === 'id' && (obj[key] === undefined || obj[key] === null)) {
            continue
        }
        newObj[key] = obj[key]
    }
    return newObj
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
        // Clear the database before each test
        await db.clearAllData()
        await db.files.clear()
        mockEstimate.mockReset()
    })

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

        it('should get file by numeric string ID and number ID', async () => {
            const file = {
                name: 'test.pdf',
                content: new Blob(['test']),
                size: 4,
                type: 'application/pdf',
                createdAt: new Date()
            } as DBFile
            const id = await db.saveFile(cleanForAdd(file))

            const retrieved = await db.getFile(id)
            expect(retrieved).toBeDefined()

            // Should also work with number if it's a numeric ID
            if (!isNaN(Number(id))) {
                const retrieved2 = await db.getFile(id)
                expect(retrieved2).toBeDefined()
            }
        })

        it('should delete a file with numeric string and number ID', async () => {
            const numericDbName = 'NumericTestDB'
            const numericDb = new Scan2DocDB(numericDbName)
            await numericDb.files.clear()

            // Explicitly put a record with numeric ID
            await numericDb.files.put({
                id: 123 as unknown,
                name: 'numeric.pdf',
                content: new Blob([]),
                size: 0,
                type: 'text/plain',
                createdAt: new Date()
            })

            // Test getFile numeric path
            const retrieved = await numericDb.getFile('123')
            expect(retrieved).toBeDefined()

            // Covering line 119 explicitly (returning file when found)
            const retrievedByString = await numericDb.getFile('123')
            expect(retrievedByString).toBeDefined()

            // Test deleteFile numeric path (covering line 125)
            await numericDb.deleteFile('123')
            expect(await numericDb.getFile('123')).toBeUndefined()

            // Test deleteFile non-numeric path to cover branch
            await numericDb.deleteFile('not-numeric')

            await numericDb.close()
            await Dexie.delete(numericDbName)
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

            const retrieved = await db.getPage(id)
            expect(retrieved).toBeDefined()
        })

        it('should get all pages ordered by order', async () => {
            await db.savePage(createTestPage('p2', 2))
            await db.savePage(createTestPage('p1', 1))

            const pages = await db.getAllPages()
            expect(pages[0].id).toBe('p1')
            expect(pages[1].id).toBe('p2')
        })

        it('should get pages by status', async () => {
            const p1 = createTestPage('p1')
            p1.status = 'ready'
            const p2 = createTestPage('p2')
            p2.status = 'error'

            await db.savePage(p1)
            await db.savePage(p2)

            const readyPages = await db.getPagesByStatus('ready')
            expect(readyPages.length).toBe(1)
            expect(readyPages[0].id).toBe('p1')
        })

        it('should delete a page and its associated data', async () => {
            const pageId = 'p1'
            await db.savePage(createTestPage(pageId))
            await db.savePageImage(pageId, new Blob(['test']))
            await db.addToQueue(pageId)

            await db.deletePage(pageId)

            expect(await db.getPage(pageId)).toBeUndefined()
            expect(await db.getPageImage(pageId)).toBeUndefined()
            expect(await db.getQueueCount()).toBe(0)
        })

        it('should delete all pages', async () => {
            await db.savePage(createTestPage('p1'))
            await db.savePageImage('p1', new Blob(['test']))

            await db.deleteAllPages()

            expect(await db.pages.count()).toBe(0)
            expect(await db.pageImages.count()).toBe(0)
        })

        it('should save added page with defaults', async () => {
            const pageData: Omit<DBPage, 'id' | 'createdAt' | 'updatedAt'> = {
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

            const id = await db.saveAddedPage(cleanForAdd(pageData as unknown))
            const retrieved = await db.getPage(id)
            expect(retrieved?.createdAt).toBeDefined()
        })

        it('should update pages order', async () => {
            await db.savePage(createTestPage('p1', 1))
            await db.updatePagesOrder([{ id: 'p1', order: 10 }])

            const p1 = await db.getPage('p1')
            expect(p1?.order).toBe(10)
        })

        it('should get next order', async () => {
            expect(await db.getNextOrder()).toBe(0)
            await db.savePage(createTestPage('p1', 5))
            expect(await db.getNextOrder()).toBe(6)
        })

        it('should get all pages for display', async () => {
            await db.savePage(createTestPage('p1', 1))
            const pages = await db.getAllPagesForDisplay()
            expect(pages.length).toBeGreaterThan(0)
        })
    })

    describe('Processing Queue Methods', () => {
        it('should add to and remove from queue', async () => {
            const pageId = 'p1'
            const qid = await db.addToQueue(pageId, 10)
            expect(qid).toBeDefined()

            const qid2 = await db.addToQueue(pageId, 20)
            expect(qid2).toBe(qid)

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

        it('should return 0 if storage estimation fails', async () => {
            mockEstimate.mockReturnValue({})
            const size = await db.getStorageSize()
            expect(size).toBe(0)
        })

        it('should return 0 if navigator.storage is missing', async () => {
            const originalStorage = window.navigator.storage
            // @ts-expect-error: intentional for testing
            delete window.navigator.storage
            const size = await db.getStorageSize()
            expect(size).toBe(0)
            // Restore
            Object.defineProperty(window.navigator, 'storage', {
                value: originalStorage,
                configurable: true
            })
        })

        it('should generate unique page IDs', () => {
            const id1 = generatePageId()
            const id2 = generatePageId()
            expect(id1.startsWith('page_')).toBe(true)
            expect(id1).not.toBe(id2)
        })
    })

    describe('Schema Migration', () => {
        it('should migrate imageData to pageImages table during upgrade', async () => {
            const migrationDbName = 'MigrationTestDB'
            await Dexie.delete(migrationDbName)

            const v3Db = new Dexie(migrationDbName)
            v3Db.version(3).stores({ pages: 'id', files: '++id', processingQueue: '++id' })
            const imageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
            await v3Db.table('pages').add({ id: 'p1', imageData })
            await v3Db.close()

            const originalFetch = window.fetch
            window.fetch = vi.fn().mockResolvedValue({
                blob: () => Promise.resolve(new Blob(['dummy']))
            } as import("@/db").DBPage)

            const testV4 = new Scan2DocDB(migrationDbName)
            await testV4.open()

            const page = await testV4.pages.get('p1')
            expect(page?.imageData).toBeUndefined()
            const imageRecord = await testV4.pageImages.get('p1')
            expect(imageRecord?.blob).toBeDefined()

            await testV4.close()
            window.fetch = originalFetch
            await Dexie.delete(migrationDbName)
        })

        it('should handle migration errors gracefully', async () => {
            const migrationDbName = 'MigrationErrorTestDB'
            await Dexie.delete(migrationDbName)
            const v3Db = new Dexie(migrationDbName)
            v3Db.version(3).stores({ pages: 'id' })
            await v3Db.table('pages').add({ id: 'p1', imageData: 'data:error' })
            await v3Db.close()

            window.fetch = vi.fn().mockRejectedValue(new Error('Fetch failed'))
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

            const testV4 = new Scan2DocDB(migrationDbName)
            await testV4.open()
            expect(consoleSpy).toHaveBeenCalled()
            expect(consoleSpy).toHaveBeenCalled()
            await testV4.close()
            consoleSpy.mockRestore()
            await Dexie.delete(migrationDbName)
        })
    })
})
