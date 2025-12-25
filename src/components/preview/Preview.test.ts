import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Preview from './Preview.vue'
import { db } from '@/db'

// Mock Naive UI components
vi.mock('naive-ui', () => ({
  NTabs: {
    name: 'NTabs',
    props: ['value', 'type', 'animated'],
    template: '<div><slot></slot></div>'
  },
  NTabPane: {
    name: 'NTabPane',
    props: ['name', 'tab'],
    template: '<div v-if="$parent.value === name"><slot></slot></div>'
  },
  NEmpty: {
    name: 'NEmpty',
    props: ['description'],
    template: '<div>{{ description }}</div>'
  }
}))

// Mock db
vi.mock('@/db', () => ({
  db: {
    getPageImage: vi.fn()
  }
}))

// Mock URL methods
const mockObjectUrl = 'blob:http://localhost/mock-preview-url'
globalThis.URL.createObjectURL = vi.fn(() => mockObjectUrl)
globalThis.URL.revokeObjectURL = vi.fn()

describe('Preview.vue', () => {
  let mockPage: Partial<import("@/stores/pages").Page>

  beforeEach(() => {
    mockPage = {
      id: 'page-1',
      status: 'ready',
      outputs: [
        { format: 'markdown', content: '# Hello Markdown' },
        { format: 'html', content: '<h1>Hello HTML</h1>' }
      ]
    } as any
    vi.clearAllMocks()
    vi.mocked(db.getPageImage).mockResolvedValue(new Blob(['mock-image'], { type: 'image/png' }))
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders image preview by default', async () => {
    const wrapper = mount(Preview, {
      props: { currentPage: mockPage }
    })

    const vm = wrapper.vm as unknown as { currentView: string }
    expect(vm.currentView).toBe('image')

    await vi.waitFor(() => {
      if (!wrapper.find('.preview-img').exists()) throw new Error('not found')
    })

    expect(wrapper.find('.preview-img').attributes('src')).toBe(mockObjectUrl)
  })

  it('displays markdown preview when switched', async () => {
    const wrapper = mount(Preview, {
      props: { currentPage: mockPage }
    })

    const vm = wrapper.vm as unknown as { currentView: string }
    vm.currentView = 'md'
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.markdown-preview').text()).toBe('# Hello Markdown')
  })

  it('displays html preview when switched', async () => {
    const wrapper = mount(Preview, {
      props: { currentPage: mockPage }
    })

    const vm = wrapper.vm as unknown as { currentView: string }
    vm.currentView = 'html'
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.html-preview').html()).toContain('<h1>Hello HTML</h1>')
  })

  it('shows empty state when no page is provided', () => {
    const wrapper = mount(Preview, {
      props: { currentPage: null }
    })

    // NaiveUI NEmpty renders content in default slot or specific structure, 
    // but based on our mock: template: '<div>{{ description }}</div>'
    // And we look for wrapper text
    expect(wrapper.text()).toContain('No image available')
  })

  it('shows rendering state when page is rendering', () => {
    const renderingPage = { ...mockPage, status: 'rendering' }
    const wrapper = mount(Preview, {
      props: { currentPage: renderingPage }
    })

    expect(wrapper.text()).toContain('Rendering...')
  })

  it('handles image loading error from DB', async () => {
    vi.mocked(db.getPageImage).mockRejectedValue(new Error('DB Error'))

    mount(Preview, {
      props: { currentPage: mockPage }
    })

    await vi.waitFor(() => {
      if (vi.mocked(db.getPageImage).mock.calls.length === 0) throw new Error('not called')
    })

    // imageError state is not explicitly used in template but logged
    expect(db.getPageImage).toHaveBeenCalled()
  })

  it('revokes URL when current page changes', async () => {
    const wrapper = mount(Preview, {
      props: { currentPage: mockPage }
    })

    await vi.waitFor(() => {
      if ((wrapper.vm as unknown as { fullImageUrl: string }).fullImageUrl === '') throw new Error('not loaded')
    })

    const vm = wrapper.vm as unknown as { fullImageUrl: string }
    const oldUrl = vm.fullImageUrl

    // Change page
    await wrapper.setProps({ currentPage: { ...mockPage, id: 'page-2' } })

    expect(URL.revokeObjectURL).toHaveBeenCalledWith(oldUrl)
  })

  it('renders no content messages when data is missing', async () => {
    const wrapper = mount(Preview, {
      props: { currentPage: { ...mockPage, outputs: [] } }
    })

    const vm = wrapper.vm as unknown as { currentView: string }
    vm.currentView = 'md'
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.markdown-preview').text()).toBe('No markdown content available')

    vm.currentView = 'html'
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.html-preview').text()).toBe('No HTML content available')
  })

  it('supports switching views via property assignment', async () => {
    const wrapper = mount(Preview, {
      props: { currentPage: mockPage }
    })

    // Initially image
    const vm = wrapper.vm as unknown as { currentView: string }
    expect(vm.currentView).toBe('image')

    // Switch to md
    vm.currentView = 'md'
    expect(vm.currentView).toBe('md')

    // Switch to html
    vm.currentView = 'html'
    expect(vm.currentView).toBe('html')
  })
})
