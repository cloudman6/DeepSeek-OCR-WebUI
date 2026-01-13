import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getRandomId } from './crypto'

describe('getRandomId', () => {
    const originalCrypto = globalThis.crypto

    function mockCrypto(config: any) {
        Object.defineProperty(globalThis, 'crypto', {
            value: config,
            configurable: true,
            writable: true
        })
    }

    beforeEach(() => {
        vi.resetModules()
    })

    afterEach(() => {
        mockCrypto(originalCrypto)
        vi.restoreAllMocks()
    })

    it('should return a non-empty string', () => {
        const id = getRandomId()
        expect(typeof id).toBe('string')
        expect(id.length).toBeGreaterThan(0)
    })

    it('should generate different IDs on subsequent calls', () => {
        const id1 = getRandomId()
        const id2 = getRandomId()
        expect(id1).not.toBe(id2)
    })

    it('should return hexadecimal characters or UUID segment', () => {
        const id = getRandomId()
        // Checking if it's alphanumeric hex-like
        expect(id).toMatch(/^[a-f0-9]+$/i)
    })

    it('should use crypto.randomUUID if available', () => {
        const mockUUID = '12345678-1234-1234-1234-123456789012'
        mockCrypto({
            ...originalCrypto,
            randomUUID: vi.fn().mockReturnValue(mockUUID),
        })

        const id = getRandomId()
        expect(id).toBe('12345678')
        expect(globalThis.crypto.randomUUID).toHaveBeenCalled()
    })

    it('should use crypto.getRandomValues if randomUUID is not available', () => {
        mockCrypto({
            ...originalCrypto,
            randomUUID: undefined,
            getRandomValues: vi.fn().mockImplementation((arr: Uint32Array) => {
                arr[0] = 0xabcdef
                return arr
            }),
        })

        const id = getRandomId()
        expect(id).toBe('abcdef')
        expect(globalThis.crypto.getRandomValues).toHaveBeenCalled()
    })

    it('should fallback to Math.random if crypto is not available', () => {
        mockCrypto(undefined)

        const id = getRandomId()
        expect(id).toMatch(/^[a-f0-9]+$/)
        expect(id.length).toBeGreaterThan(0)
    })
})
