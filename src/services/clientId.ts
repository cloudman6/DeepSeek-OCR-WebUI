const SESSION_KEY = 'ocr-client-id'

export function getClientId(): string {
    let id = sessionStorage.getItem(SESSION_KEY)
    if (!id) {
        id = crypto.randomUUID()
        sessionStorage.setItem(SESSION_KEY, id)
    }
    return id
}
