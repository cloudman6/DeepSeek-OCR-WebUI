
export interface AppConfig {
    ocrApiEndpoint: string
}

export const config: AppConfig = {
    // OCR API Endpoint (Cloudflare Tunnel to Local Backend)
    // ocrApiEndpoint: 'https://ocr.cloudmantools.top/ocr',
    // Local development endpoint (internal network, not exposed to internet)
    // eslint-disable-next-line sonarjs/no-clear-text-protocols
    ocrApiEndpoint: 'http://192.168.1.14:8001/ocr',
}
