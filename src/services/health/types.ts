export interface HealthResponse {
    status: string
    backend: string
    platform: string
    machine: string
    model_loaded: boolean
}

export interface HealthCheckState {
    isHealthy: boolean
    lastCheckTime: Date | null
    healthInfo: HealthResponse | null
    error: Error | null
}
