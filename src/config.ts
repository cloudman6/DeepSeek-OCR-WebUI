
export interface AppConfig {
    ocrApiEndpoint: string
}

export const config: AppConfig = {
    // eslint-disable-next-line sonarjs/no-clear-text-protocols
    ocrApiEndpoint: 'https://ocr.cloudmantools.top/ocr'
}
