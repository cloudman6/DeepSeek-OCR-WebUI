import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { NButton } from 'naive-ui'
import { createTestingPinia } from '@pinia/testing'
import PageItem from './PageItem.vue'
import type { Page } from '@/stores/pages'
import { ocrService } from '@/services/ocr'
import { db } from '@/db'

// Mock dependencies
vi.mock('@/services/ocr', () => ({
    ocrService: {
        processImage: vi.fn(),
        queueOCR: vi.fn()
    }
}))

vi.mock('@/db', () => ({
    db: {
        getPageImage: vi.fn()
    }
}))

// Mock Naive UI components to simplify testing
vi.mock('naive-ui', () => ({
    NButton: {
        name: 'NButton',
        props: ['loading', 'disabled'],
        template: '<button :disabled="disabled || loading"><slot name="icon"></slot><slot></slot></button>'
    },
    NTag: {
        name: 'NTag',
        props: ['type', 'size'],
        template: '<span><slot></slot></span>'
    },
    NCheckbox: {
        name: 'NCheckbox',
        props: ['checked', 'size'],
        template: '<div><input type="checkbox" :checked="checked" @change="$emit(\'update:checked\', $event.target.checked)" /></div>'
    },
    NSpin: {
        name: 'NSpin',
        template: '<div>Spinning...</div>'
    },
    NIcon: {
        name: 'NIcon',
        props: ['size', 'color'],
        template: '<span><slot></slot></span>'
    },
    useMessage: () => ({
        success: vi.fn(),
        error: vi.fn(),
        warning: vi.fn(),
        info: vi.fn()
    })
}))

describe('PageItem.vue', () => {
    let mockPage: Page
    let pinia: ReturnType<typeof import("pinia").createPinia>

    beforeEach(() => {
        vi.clearAllMocks()

        mockPage = {
            id: 'page-1',
            fileName: 'test-file.pdf',
            fileSize: 1024 * 1024, // 1MB
            fileType: 'application/pdf',
            origin: 'upload',
            status: 'ready',
            progress: 100,
            order: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            outputs: [],
            logs: [],
            thumbnailData: 'data:image/png;base64,mock'
        }

        pinia = createTestingPinia({
            createSpy: vi.fn,
            initialState: {
                pages: {
                    selectedPageIds: []
                }
            }
        })
    })

    it('renders file name and formatted size correctly', () => {
        const wrapper = mount(PageItem, {
            props: { page: mockPage },
            global: {
                plugins: [pinia]
            }
        })

        expect(wrapper.find('.page-name').text()).toBe('test-file.pdf')
        expect(wrapper.find('.page-info').text()).toBeTruthy()
    })

    it('renders thumbnail when thumbnailData is present', () => {
        const wrapper = mount(PageItem, {
            props: { page: mockPage },
            global: {
                plugins: [pinia]
            }
        })

        expect(wrapper.find('.thumbnail-img').exists()).toBe(true)
        expect(wrapper.find('.thumbnail-img').attributes('src')).toBe(mockPage.thumbnailData)
    })

    it('emits click event when clicked', async () => {
        const wrapper = mount(PageItem, {
            props: { page: mockPage },
            global: {
                plugins: [pinia]
            }
        })

        await wrapper.find('.page-item').trigger('click')
        expect(wrapper.emitted('click')).toBeTruthy()
        expect(wrapper.emitted('click')![0]).toEqual([mockPage])
    })

    it('emits delete event when delete button is clicked', async () => {
        const wrapper = mount(PageItem, {
            props: { page: mockPage },
            global: {
                plugins: [pinia]
            }
        })

        const deleteBtn = wrapper.findAllComponents(NButton).find(c => c.attributes('title') === 'Delete page')
        expect(deleteBtn).toBeTruthy()
        await deleteBtn!.trigger('click')

        expect(wrapper.emitted('delete')).toBeTruthy()
        expect(wrapper.emitted('delete')![0]).toEqual([mockPage])
    })

    it('handles Scan button click', async () => {
        const wrapper = mount(PageItem, {
            props: { page: mockPage },
            global: {
                plugins: [pinia]
            }
        })

        // Mock DB and OCR success
        const mockBlob = new Blob(['img'], { type: 'image/jpeg' })
        vi.mocked(db.getPageImage).mockResolvedValue(mockBlob)
        vi.mocked(ocrService.queueOCR).mockResolvedValue()

        const scanBtn = wrapper.findAllComponents(NButton).find(c => c.attributes('title') === 'Scan to Document')
        expect(scanBtn).toBeTruthy()

        await scanBtn!.trigger('click')
        await flushPromises()

        expect(db.getPageImage).toHaveBeenCalledWith(mockPage.id)

        expect(ocrService.queueOCR).toHaveBeenCalledWith(mockPage.id, mockBlob)
    })
})
