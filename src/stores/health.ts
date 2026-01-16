import { defineStore } from 'pinia'
import { ref } from 'vue'
import { HealthCheckService } from '@/services/health'
import type { HealthResponse } from '@/services/health'
import { config } from '@/config'

export const useHealthStore = defineStore('health', () => {
    // State
    const isHealthy = ref(true)
    const healthInfo = ref<HealthResponse | null>(null)
    const lastCheckTime = ref<Date | null>(null)
    const error = ref<Error | null>(null)

    // Private members
    let healthService: HealthCheckService | null = null
    let checkInterval: number | null = null

    /**
     * Start health check polling
     */
    function startHealthCheck() {
        // Create service instance if not exists
        if (!healthService) {
            healthService = new HealthCheckService(config.apiBaseUrl)
        }

        // Start the service
        healthService.start()

        // Update status immediately
        updateStatus()

        // Set up periodic status updates
        if (checkInterval === null) {
            checkInterval = window.setInterval(() => {
                updateStatus()
            }, 1000) // Update UI every second
        }
    }

    /**
     * Stop health check polling
     */
    function stopHealthCheck() {
        if (healthService) {
            healthService.stop()
        }

        if (checkInterval !== null) {
            window.clearInterval(checkInterval)
            checkInterval = null
        }
    }

    /**
     * Update status from health service
     */
    function updateStatus() {
        if (!healthService) return

        isHealthy.value = healthService.getStatus()
        healthInfo.value = healthService.getHealthInfo()
        lastCheckTime.value = healthService.getLastCheckTime()
    }

    return {
        // State
        isHealthy,
        healthInfo,
        lastCheckTime,
        error,

        // Actions
        startHealthCheck,
        stopHealthCheck,
        updateStatus
    }
})
