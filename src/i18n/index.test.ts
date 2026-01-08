import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SUPPORT_LOCALES, setLocale, getCurrentLocale, i18n, getInitialLocale } from './index'

describe('i18n Service', () => {
    beforeEach(() => {
        vi.stubGlobal('localStorage', {
            getItem: vi.fn(),
            setItem: vi.fn(),
            removeItem: vi.fn(),
            clear: vi.fn(),
        })
        vi.stubGlobal('navigator', {
            language: 'en-US'
        })
    })

    it('defines supported locales', () => {
        expect(SUPPORT_LOCALES).toContain('en')
        expect(SUPPORT_LOCALES).toContain('zh-CN')
    })

    it('sets and gets locale correctly', () => {
        setLocale('zh-CN')
        expect(getCurrentLocale()).toBe('zh-CN')
        expect(localStorage.setItem).toHaveBeenCalledWith('locale', 'zh-CN')
        
        setLocale('en')
        expect(getCurrentLocale()).toBe('en')
        expect(localStorage.setItem).toHaveBeenCalledWith('locale', 'en')
    })

    describe('getInitialLocale', () => {
        it('returns stored locale if valid', () => {
            vi.mocked(localStorage.getItem).mockReturnValue('zh-CN')
            expect(getInitialLocale()).toBe('zh-CN')
        })

        it('returns default if stored locale is invalid', () => {
            vi.mocked(localStorage.getItem).mockReturnValue('invalid')
            expect(getInitialLocale()).toBe('en')
        })

        it('returns zh-CN if browser language starts with zh', () => {
            vi.mocked(localStorage.getItem).mockReturnValue(null)
            vi.stubGlobal('navigator', { language: 'zh-TW' })
            expect(getInitialLocale()).toBe('zh-CN')
        })

        it('returns default if no stored locale and browser is English', () => {
            vi.mocked(localStorage.getItem).mockReturnValue(null)
            vi.stubGlobal('navigator', { language: 'en-GB' })
            expect(getInitialLocale()).toBe('en')
        })
    })

    it('has a valid i18n instance', () => {
        expect(i18n.global.locale.value).toBeDefined()
        expect(i18n.global.availableLocales).toContain('en')
        expect(i18n.global.availableLocales).toContain('zh-CN')
    })
})
