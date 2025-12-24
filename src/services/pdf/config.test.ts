import { describe, it, expect, vi } from 'vitest'

// Mock pdfjs-dist BEFORE import
vi.mock('pdfjs-dist', () => ({
  version: '2.10.377'
}))

import { CMAP_URL, CMAP_PACKED, DOCUMENT_INIT_PARAMS, PDF_JS_VERSION } from '@/services/pdf/config'

describe('PDF Service Config', () => {
  it('should export correct constants', () => {
    expect(CMAP_URL).toBe('/cmaps/')
    expect(CMAP_PACKED).toBe(true)
    expect(PDF_JS_VERSION).toBe('2.10.377')
  })

  it('should export correct document init params', () => {
    expect(DOCUMENT_INIT_PARAMS).toEqual({
      cMapUrl: '/cmaps/',
      cMapPacked: true,
      useSystemFonts: true,
      fontExtraProperties: true,
    })
  })
})
