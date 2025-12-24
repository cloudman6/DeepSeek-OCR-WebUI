import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { FontLoaderService, fontLoader, type FontConfig } from '@/services/font/fontLoader'
import { pdfLogger } from '@/utils/logger'

// Mock logger
vi.mock('@/utils/logger', () => ({
  pdfLogger: {
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn()
  }
}))

describe('FontLoaderService', () => {
  // Save original globals to restore after tests
  const originalFontFace = global.FontFace
  const originalDocumentFonts = document.fonts
  const originalOffscreenCanvas = global.OffscreenCanvas
  
  // Mock tracking
  let loadedFontsSet: Set<string>
  let addedFontsToDocument: Set<string>

  beforeEach(() => {
    // Reset internal state of the singleton
    // We need to access the private instance to reset it or just create a new one if possible
    // Since it's a singleton, we can't easily destroy it, but we can clear its internal state if we exposed methods
    // Or we can just use the exported `fontLoader` but we must be careful about state carry-over.
    // Better: Reset the private static instance by casting to any
    (FontLoaderService as any).instance = undefined
    
    loadedFontsSet = new Set()
    addedFontsToDocument = new Set()

    // Mock FontFace
    global.FontFace = class MockFontFace {
      family: string
      source: string
      descriptors: any
      status: string = 'unloaded'
      
      constructor(family: string, source: string, descriptors?: any) {
        this.family = family
        this.source = source
        this.descriptors = descriptors
      }

      async load() {
        if (this.family === 'ErrorFont') {
          this.status = 'error'
          throw new Error('Failed to load font')
        }
        this.status = 'loaded'
        return this
      }
    } as any

    // Mock document.fonts
    Object.defineProperty(document, 'fonts', {
      value: {
        add: vi.fn((font: any) => {
          addedFontsToDocument.add(font.family)
        }),
        check: vi.fn(() => true),
        ready: Promise.resolve()
      },
      writable: true
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    global.FontFace = originalFontFace
    Object.defineProperty(document, 'fonts', {
      value: originalDocumentFonts,
      writable: true
    })
    global.OffscreenCanvas = originalOffscreenCanvas
  })

  describe('getInstance', () => {
    it('should return the same instance', () => {
      const instance1 = FontLoaderService.getInstance()
      const instance2 = FontLoaderService.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('loadFont', () => {
    it('should handle system fonts correctly', async () => {
      const service = FontLoaderService.getInstance()
      const config: FontConfig = { family: 'Arial', source: 'system' }
      
      const result = await service.loadFont(config)
      
      expect(result).toBe(true)
      // Should verify internal set has it, but it's private. 
      // We can infer by calling loadFont again and it should return true immediately
      const result2 = await service.loadFont(config)
      expect(result2).toBe(true)
    })

    it('should load web fonts correctly', async () => {
      const service = FontLoaderService.getInstance()
      const config: FontConfig = { 
        family: 'CustomFont', 
        source: 'https://example.com/font.woff2',
        weight: 'bold',
        style: 'italic'
      }
      
      const result = await service.loadFont(config)
      
      expect(result).toBe(true)
      expect(addedFontsToDocument.has('CustomFont')).toBe(true)
    })

    it('should return true if font is already loaded', async () => {
      const service = FontLoaderService.getInstance()
      const config: FontConfig = { family: 'ExistingFont', source: 'system' }
      
      await service.loadFont(config)
      const result = await service.loadFont(config) // Second call
      
      expect(result).toBe(true)
      // document.fonts.add should not be called for system fonts, 
      // but let's check for a web font case to be sure about caching logic
      
      const webConfig: FontConfig = { family: 'WebFont', source: 'url' }
      await service.loadFont(webConfig)
      expect(document.fonts.add).toHaveBeenCalledTimes(1)
      
      await service.loadFont(webConfig)
      expect(document.fonts.add).toHaveBeenCalledTimes(1) // Should not increase
    })

    it('should handle font loading errors gracefully', async () => {
      const service = FontLoaderService.getInstance()
      const config: FontConfig = { family: 'ErrorFont', source: 'url' }
      
      const result = await service.loadFont(config)
      
      expect(result).toBe(false)
      expect(pdfLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load font'), 
        expect.any(Error)
      )
    })

    it('should return false if source is missing', async () => {
      const service = FontLoaderService.getInstance()
      const config: FontConfig = { family: 'NoSourceFont' }
      
      const result = await service.loadFont(config)
      
      expect(result).toBe(false)
    })
  })

  describe('isFontAvailable', () => {
    // Setup Canvas mocks for this suite
    const mockMeasureText = vi.fn()
    
    // We define a set of "available" fonts for our mock
    const availableFonts = new Set(['Arial', 'Helvetica', 'PingFang SC', 'AvailableFont'])

    const createMockContext = () => ({
      font: '',
      measureText: (text: string) => {
        // Logic: if font contains 'monospace', return fixed width 10
        // If font contains a known available font, return width 20
        // Otherwise (fallback), return width 10
        const currentFont = this?.font || '' // 'this' context might be tricky in arrow functions if bound incorrectly, but standard mocking usually works
        
        let width = 10 // default/monospace
        
        // Simple check if any available font is in the font string
        for (const font of availableFonts) {
          if (mockContext.font.includes(font)) {
            width = 20
            break
          }
        }
        
        return { width }
      }
    })

    let mockContext: any

    beforeEach(() => {
        mockContext = {
            font: '',
            measureText: vi.fn((text) => {
                // If it's monospace, return 10
                if (mockContext.font.includes('monospace')) {
                    return { width: 10 }
                }
                // If it includes an available font, return 20 (different from monospace)
                for (const font of availableFonts) {
                    if (mockContext.font.includes(font)) {
                        return { width: 20 }
                    }
                }
                // Otherwise simulate fallback (same as monospace)
                return { width: 10 }
            })
        }
    })

    it('should use OffscreenCanvas if available', () => {
      const service = FontLoaderService.getInstance()
      
      // Mock OffscreenCanvas
      global.OffscreenCanvas = class MockOffscreenCanvas {
        constructor(w: number, h: number) {}
        getContext() { return mockContext }
      } as any

      const isAvailable = service.isFontAvailable('AvailableFont')
      expect(isAvailable).toBe(true)
      
      const isUnavailable = service.isFontAvailable('UnknownFont')
      expect(isUnavailable).toBe(false)
    })

    it('should fallback to HTMLCanvasElement if OffscreenCanvas is undefined', () => {
      const service = FontLoaderService.getInstance()
      
      // Remove OffscreenCanvas
      const originalOffscreen = global.OffscreenCanvas
      delete (global as any).OffscreenCanvas

      // Spy on createElement
      const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
        if (tagName === 'canvas') {
          return {
            width: 0,
            height: 0,
            getContext: () => mockContext
          } as any
        }
        return document.createElement(tagName)
      })

      const isAvailable = service.isFontAvailable('AvailableFont')
      expect(isAvailable).toBe(true)
      expect(createElementSpy).toHaveBeenCalledWith('canvas')
      
      // Restore
      global.OffscreenCanvas = originalOffscreen
    })

    it('should return false on error during check', () => {
      const service = FontLoaderService.getInstance()
      
      // Force an error
      global.OffscreenCanvas = class MockOffscreenCanvas {
        getContext() { throw new Error('Canvas error') }
      } as any

      const result = service.isFontAvailable('Arial')
      expect(result).toBe(false)
      expect(pdfLogger.warn).toHaveBeenCalled()
    })
  })

  describe('getBestFont', () => {
    // We need the same mock setup as isFontAvailable because getBestFont calls it
    const availableFonts = new Set(['PingFang SC', 'Helvetica', 'Arial'])
    let mockContext: any

    beforeEach(() => {
        mockContext = {
            font: '',
            measureText: vi.fn((text) => {
                if (mockContext.font.includes('monospace')) return { width: 10 }
                for (const font of availableFonts) {
                    if (mockContext.font.includes(font)) return { width: 20 }
                }
                return { width: 10 }
            })
        }

        global.OffscreenCanvas = class MockOffscreenCanvas {
            constructor(w: number, h: number) {}
            getContext() { return mockContext }
        } as any
    })

    it('should return a CJK font for CJK text', () => {
      const service = FontLoaderService.getInstance()
      const cjkText = '你好'
      
      // 'PingFang SC' is in our availableFonts set and is the first choice in the service for CJK
      const font = service.getBestFont(cjkText)
      expect(font).toBe('PingFang SC')
    })

    it('should fallback to sans-serif if no CJK font is available', () => {
      const service = FontLoaderService.getInstance()
      const cjkText = '你好'
      
      // Clear available fonts to force fallback
      availableFonts.clear()
      
      const font = service.getBestFont(cjkText)
      expect(font).toBe('sans-serif')
    })

    it('should return a standard font for non-CJK text', () => {
      const service = FontLoaderService.getInstance()
      const text = 'Hello World'
      
      // Reset available fonts
      availableFonts.add('Helvetica')
      
      const font = service.getBestFont(text)
      expect(font).toBe('Helvetica')
    })
  })

  describe('loadCJKFallbackFonts', () => {
    it('should iterate and load fallback fonts', async () => {
      const service = FontLoaderService.getInstance()
      const loadFontSpy = vi.spyOn(service, 'loadFont').mockResolvedValue(true)
      
      await service.loadCJKFallbackFonts()
      
      // There are 13 fonts in the list in source code
      expect(loadFontSpy).toHaveBeenCalledTimes(13)
      expect(loadFontSpy).toHaveBeenCalledWith(expect.objectContaining({
        family: 'Noto Sans CJK SC',
        source: 'system'
      }))
    })
  })

  describe('preloadCommonFonts', () => {
    it('should call loadCJKFallbackFonts', async () => {
      const service = FontLoaderService.getInstance()
      const spy = vi.spyOn(service, 'loadCJKFallbackFonts').mockResolvedValue()
      
      await service.preloadCommonFonts()
      
      expect(spy).toHaveBeenCalled()
    })
  })
})
