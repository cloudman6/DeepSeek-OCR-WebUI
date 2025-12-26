import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import PageViewer from './PageViewer.vue'
import { db } from '@/db'
import { uiLogger } from '@/utils/logger'

// Mock logger
vi.mock('@/utils/logger', () => ({
  uiLogger: {
    info: vi.fn(),
    error: vi.fn()
  }
}))

// Mock Naive UI components
vi.mock('naive-ui', () => ({
  NCard: {
    name: 'NCard',
    props: ['size', 'bordered'],
    template: '<div><slot></slot></div>'
  },
  NSpace: {
    name: 'NSpace',
    props: ['justify', 'align', 'size'],
    template: '<div><slot></slot></div>'
  },
  NButton: {
    name: 'NButton',
    props: ['disabled', 'type', 'loading', 'size'],
    template: '<button :disabled="disabled"><slot name="icon"></slot><slot></slot></button>'
  },
  NButtonGroup: {
    name: 'NButtonGroup',
    props: ['size'],
    template: '<div><slot></slot></div>'
  },
  NSpin: {
    name: 'NSpin',
    props: ['size'],
    template: '<div><slot name="description"></slot><slot></slot></div>'
  },
  NEmpty: {
    name: 'NEmpty',
    props: ['description'],
    template: '<div><slot name="icon"></slot>{{ description }}</div>'
  },
  NResult: {
    name: 'NResult',
    props: ['status', 'title'],
    template: '<div>{{ title }}</div>'
  },
  NText: {
    name: 'NText',
    props: ['type', 'depth'],
    template: '<span><slot></slot></span>'
  }
}))

// Mock db
vi.mock('@/db', () => ({
  db: {
    getPageImage: vi.fn()
  }
}))

// Mock URL methods
const mockObjectUrl = 'blob:http://localhost/mock-url'
globalThis.URL.createObjectURL = vi.fn(() => mockObjectUrl)
globalThis.URL.revokeObjectURL = vi.fn()

describe('PageViewer.vue', () => {
  let mockPage: import("@/stores/pages").Page

  beforeEach(() => {
    mockPage = {
      id: 'page-1',
      fileName: 'test.pdf',
      fileSize: 1024 * 1024,
      fileType: 'application/pdf',
      origin: 'upload',
      status: 'ready',
      progress: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
      outputs: [],
      logs: [],
      order: 0
    }
    vi.clearAllMocks()
    vi.mocked(db.getPageImage).mockResolvedValue(new Blob(['mock-image'], { type: 'image/png' }))
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders select placeholder when no page is provided', () => {
    const wrapper = mount(PageViewer, {
      props: { currentPage: null }
    })

    expect(wrapper.find('.placeholder-select').exists()).toBe(true)
    expect(wrapper.find('.placeholder-select').text()).toContain('Select a page to view')
  })

  it('loads and displays image when a page is provided', async () => {
    const wrapper = mount(PageViewer, {
      props: { currentPage: mockPage }
    })

    // Should call getPageImage
    expect(db.getPageImage).toHaveBeenCalledWith(mockPage.id)

    // Wait for async image loading
    await vi.waitFor(() => {
      if (!wrapper.find('.page-image').exists()) throw new Error('not found')
    })

    const img = wrapper.find('.page-image')
    expect(img.attributes('src')).toBe(mockObjectUrl)
  })

  it('handles zoom controls correctly', async () => {
    const wrapper = mount(PageViewer, {
      props: { currentPage: mockPage }
    })

    // Initial zoom is 1
    expect((wrapper.vm as any).zoomLevel).toBe(1)

    // Zoom in
    const buttons = wrapper.findAll('button')
    const zoomInBtn = buttons.find(b => b.text() === '+')
    await zoomInBtn?.trigger('click')
    expect((wrapper.vm as any).zoomLevel).toBe(1.25)

    // Zoom out
    const zoomOutBtn = buttons.find(b => b.text() === '−')
    await zoomOutBtn?.trigger('click')
    expect((wrapper.vm as any).zoomLevel).toBe(1.0)

    // Fit to screen
    const fitBtn = buttons.find(b => b.text() === 'Fit')
    await zoomInBtn?.trigger('click') // zoom to 1.25 again
    await fitBtn?.trigger('click')
    expect((wrapper.vm as any).zoomLevel).toBe(1)
  })

  it('limits zoom level between 0.25 and 3', async () => {
    const wrapper = mount(PageViewer, {
      props: { currentPage: mockPage }
    })

    const zoomInBtn = wrapper.findAll('button').find(b => b.text() === '+')
    const zoomOutBtn = wrapper.findAll('button').find(b => b.text() === '−')

    // Test upper limit
    for (let i = 0; i < 10; i++) await zoomInBtn?.trigger('click')
    expect((wrapper.vm as any).zoomLevel).toBe(3)
    expect(zoomInBtn?.attributes('disabled')).toBeDefined()

    // Test lower limit
    for (let i = 0; i < 15; i++) await zoomOutBtn?.trigger('click')
    expect((wrapper.vm as any).zoomLevel).toBe(0.25)
    expect(zoomOutBtn?.attributes('disabled')).toBeDefined()
  })

  it('shows error message if image is not found in DB', async () => {
    vi.mocked(db.getPageImage).mockResolvedValue(undefined)

    const wrapper = mount(PageViewer, {
      props: { currentPage: mockPage }
    })

    // Should call getPageImage (at least once, maybe twice due to retry)
    await vi.waitFor(() => {
      if (vi.mocked(db.getPageImage).mock.calls.length === 0) throw new Error('not called')
      // If it fails, wait long enough for the retry to finish (100ms delay in code)
      if (wrapper.find('.error-overlay').exists()) return
      throw new Error('error overlay not shown')
    }, { timeout: 1000 })

    expect(wrapper.find('.error-overlay').exists()).toBe(true)
    expect(db.getPageImage).toHaveBeenCalled()
  })

  it('displays correct status text for all statuses', () => {
    const statuses: string[] = ['pending_render', 'rendering', 'ready', 'recognizing', 'completed', 'error', 'unknown']
    const expectedTexts = ['Pending Render', 'Rendering', 'Ready', 'Recognizing', 'Completed', 'Error', 'Unknown']

    statuses.forEach((status, index) => {
      const wrapper = mount(PageViewer, {
        props: { currentPage: { ...mockPage, status: status as any } }
      })
      expect(wrapper.find('.viewer-toolbar').text()).toContain(`Status: ${expectedTexts[index]}`)
    })
  })

  it('covers all formatFileSize branches', () => {
    const testCases = [
      { bytes: 0, expected: '0 B' },
      { bytes: 500, expected: '500 B' },
      { bytes: 1024 * 1.5, expected: '1.5 KB' },
      { bytes: 1024 * 1024 * 2, expected: '2 MB' },
      { bytes: 1024 * 1024 * 1024 * 3.5, expected: '3.5 GB' }
    ]

    testCases.forEach(({ bytes, expected }) => {
      const wrapper = mount(PageViewer, {
        props: { currentPage: { ...mockPage, fileSize: bytes } }
      })
      expect(wrapper.find('.viewer-toolbar').text()).toContain(`File: ${expected}`)
    })
  })

  it('revokes URL when current page changes', async () => {
    const wrapper = mount(PageViewer, {
      props: { currentPage: mockPage }
    })

    await vi.waitFor(() => {
      if ((wrapper.vm as any).fullImageUrl === '') throw new Error('not loaded')
    })

    const oldUrl = (wrapper.vm as any).fullImageUrl

    // Change page
    await wrapper.setProps({ currentPage: { ...mockPage, id: 'page-2' } })

    expect(URL.revokeObjectURL).toHaveBeenCalledWith(oldUrl)
  })

  it('handles image error and updates state', async () => {
    const wrapper = mount(PageViewer, {
      props: { currentPage: mockPage }
    })

    await vi.waitFor(() => {
      if (!wrapper.find('.page-image').exists()) throw new Error('not found')
    })

    // Explicitly call the handler to ensure coverage of those lines
    await (wrapper.vm as unknown).onImageError()
    expect((wrapper.vm as unknown).imageSize).toBe('Load failed')
    expect((wrapper.vm as unknown).imageError).toBe('Failed to load image')
  })

  it('guards runOCR execution', () => {
    // 1. No current page
    const wrapper1 = mount(PageViewer, {
      props: { currentPage: null }
    })
      ; (wrapper1.vm as unknown).runOCR() // Should return early

    // 2. Status is processing (mocked as recognizing in this context for guard check)
    const processingPage = { ...mockPage, status: 'recognizing' }
    const wrapper2 = mount(PageViewer, {
      props: { currentPage: processingPage }
    })
      ; (wrapper2.vm as unknown).runOCR() // Should return early

    // 3. Normal execution
    const wrapper3 = mount(PageViewer, {
      props: { currentPage: mockPage }
    })
      ; (wrapper3.vm as unknown).runOCR() // Should log/execute
    expect(uiLogger.info).toHaveBeenCalledWith('Running OCR for page', mockPage.id)
  })

  it('disables OCR button when status is not ready', async () => {
    const processingPage = { ...mockPage, status: 'recognizing' as const }
    const wrapper = mount(PageViewer, {
      props: { currentPage: processingPage }
    })

    const ocrBtn = wrapper.findAll('button').find(b => b.text().includes('OCR'))
    expect(ocrBtn?.attributes('disabled')).toBeDefined()
  })
})
