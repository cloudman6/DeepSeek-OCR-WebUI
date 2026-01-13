/**
 * Generates a short random identifier that works in both secure and non-secure contexts.
 * Falls back to Math.random() if crypto.randomUUID() is not available.
 * 
 * @returns A random hex string or UUID segment
 */
export function getRandomId(): string {
    // Try to use secure randomUUID if available (modern browsers in secure context)
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID().split('-')[0] as string
    }

    // Fallback to crypto.getRandomValues if available
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
        const array = new Uint32Array(1)
        crypto.getRandomValues(array)
        const val = array[0]
        // eslint-disable-next-line sonarjs/pseudo-random
        return (val !== undefined ? val.toString(16) : Math.random().toString(16).substring(2, 10))
    }

    // Last resort fallback (non-secure context, old browsers)
    // eslint-disable-next-line sonarjs/pseudo-random
    return Math.random().toString(16).substring(2, 10)
}
