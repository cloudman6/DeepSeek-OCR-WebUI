import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Preview from './Preview.vue'
import { db } from '@/db'
import { NTabs } from 'naive-ui'

// Basic mock for Naive UI
vi.mock('naive-ui', () => ({
  NTabs: { template: '<div><slot></slot></div>' },
  NTabPane: { template: '<div><slot></slot></div>' },
  NEmpty: { template: '<div></div>' },
  NButton: { template: '<button></button>' },
  NSpin: { template: '<div></div>' },
  NSwitch: { template: '<div></div>' },
  NIcon: { template: '<div></div>' }
}))

// Mock DB
vi.mock('@/db', () => ({
  db: {
    getPageImage: vi.fn(),
    getPageMarkdown: vi.fn().mockResolvedValue({ content: '# Test' }),
    getPageExtractedImage: vi.fn().mockResolvedValue(undefined),
    getPageDOCX: vi.fn(),
    getPagePDF: vi.fn()
  }
}))

// Mock URL
globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock')
globalThis.URL.revokeObjectURL = vi.fn()

describe('Preview.vue', () => {
  it('mounts correctly', async () => {
    const wrapper = mount(Preview, {
      props: {
        currentPage: {
          id: '1',
          status: 'ready',
          outputs: [],
          fileName: 'test.pdf',
          fileSize: 1024,
          fileType: 'application/pdf',
          origin: 'upload',
          createdAt: new Date(),
          updatedAt: new Date(),
          logs: [],
          progress: 100,
          order: 0
        }
      }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('renders pdf iframe when pdf view is selected and blob exists', async () => {
    const mockBlob = new Blob(['pdf'], { type: 'application/pdf' })
    vi.mocked(db.getPagePDF).mockResolvedValue(mockBlob)

    const wrapper = mount(Preview, {
      props: {
        currentPage: {
          id: '1',
          status: 'ready',
          outputs: [],
          fileName: 'test.pdf',
          fileSize: 1024,
          fileType: 'application/pdf',
          origin: 'upload',
          createdAt: new Date(),
          updatedAt: new Date(),
          logs: [],
          progress: 100,
          order: 0
        }
      }
    })

    const tabs = wrapper.findComponent(NTabs)
    await tabs.vm.$emit('update:value', 'pdf')

    await new Promise(r => setTimeout(r, 0)) // Wait for watcher
    await new Promise(r => setTimeout(r, 0)) // Wait for async checkBinaryStatus

    expect(db.getPagePDF).toHaveBeenCalledWith('1')
    expect(globalThis.URL.createObjectURL).toHaveBeenCalledWith(mockBlob)

    const iframe = wrapper.find('iframe')
    expect(iframe.exists()).toBe(true)
    expect(iframe.attributes('src')).toBe('blob:mock')
  })
})
