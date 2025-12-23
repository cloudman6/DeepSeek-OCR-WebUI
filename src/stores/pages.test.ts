import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePagesStore } from '@/stores/pages'

describe('Pages Store', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
    })

    it('should correctly initialize state', () => {
        const store = usePagesStore()
        expect(store.pages).toEqual([])
        expect(store.selectedPageIds).toEqual([])
    })

    it('should be able to add a page (addPage)', async () => {
        const store = usePagesStore()
        const mockPageData = {
            fileName: 'test.png',
            fileSize: 1024,
            fileType: 'image/png',
            origin: 'upload' as const,
            status: 'pending_render' as const,
            progress: 0,
            outputs: [],
            logs: []
        }

        await store.addPage(mockPageData)

        expect(store.pages.length).toBe(1)
        expect(store.pages[0]?.fileName).toBe('test.png')
        expect(store.pages[0]?.id).toBeDefined()
    })

    it('should be able to manage selection state', async () => {
        const store = usePagesStore()
        const pageId = 'test-id'

        await store.addPage({
            id: pageId,
            fileName: 'test.png',
            fileSize: 1024,
            fileType: 'image/png',
            origin: 'upload' as const,
            status: 'pending_render' as const,
            progress: 0,
            outputs: [],
            logs: []
        })

        store.selectPage(pageId)
        expect(store.selectedPageIds).toContain(pageId)

        store.deselectPage(pageId)
        expect(store.selectedPageIds).not.toContain(pageId)
    })
})
