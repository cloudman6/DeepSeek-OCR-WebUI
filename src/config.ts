export interface AppConfig {
    ocrApiEndpoint: string
}

const DEV_OCR_API_ENDPOINT = 'https://ocr.cloudmantools.top/ocr'
const PROD_OCR_API_ENDPOINT = '/ocr'

export const config: AppConfig = {
    /**
     * OCR API Endpoint selection priority:
     * 1. Environment Variable: VITE_OCR_API_ENDPOINT (Injected during CI/CD, e.g., GitHub Actions)
     * 2. Development Mode: DEV_OCR_API_ENDPOINT (Used during local `npm run dev`)
     * 3. Production Default: PROD_OCR_API_ENDPOINT (Fallback for local `npm run build`)
     */
    ocrApiEndpoint: import.meta.env.VITE_OCR_API_ENDPOINT
        || (import.meta.env.DEV ? DEV_OCR_API_ENDPOINT : PROD_OCR_API_ENDPOINT),
}
