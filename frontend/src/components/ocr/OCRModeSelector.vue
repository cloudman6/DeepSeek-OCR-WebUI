<template>
  <div class="ocr-mode-selector">
    <NButtonGroup size="small">
      <NButton
        data-testid="ocr-trigger-btn"
        role="button"
        :type="buttonType"
        :loading="loading"
        :disabled="isDisabled"
        class="trigger-btn keep-queue-open"
        @click="handleMainClick"
      >
        <template #icon>
          <NIcon>
            <component :is="currentIcon" />
          </NIcon>
        </template>
        {{ currentLabel }}
      </NButton>
      <NDropdown
        trigger="click"
        :options="menuOptions"
        @select="handleSelect"
      >
        <NButton
          data-testid="ocr-mode-dropdown"
          role="button"
          :type="buttonType"
          :disabled="isDisabled"
          class="dropdown-trigger keep-queue-open"
        >
          <template #icon>
            <NIcon>
              <ChevronDownOutline />
            </NIcon>
          </template>
        </NButton>
      </NDropdown>
    </NButtonGroup>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { useI18n } from 'vue-i18n'
import { NButton, NButtonGroup, NDropdown, NIcon, useDialog } from 'naive-ui'
import type { DropdownOption } from 'naive-ui'
import {
  DocumentTextOutline,
  ScanOutline,
  TextOutline,
  ImageOutline,
  ChatboxEllipsesOutline,
  SearchOutline,
  CreateOutline,
  ChevronDownOutline
} from '@vicons/ionicons5'
import type { OCRPromptType } from '@/services/ocr'
import { useHealthStore } from '@/stores/health'

interface Props {
  loading?: boolean
  disabled?: boolean
}

interface Emits {
  (e: 'run', mode: OCRPromptType): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  disabled: false
})

const { t } = useI18n()
const emit = defineEmits<Emits>()
const healthStore = useHealthStore()
const dialog = useDialog()

const selectedMode = ref<OCRPromptType>('document')

const MODE_CONFIG: Record<OCRPromptType, { key: string, icon: import('vue').Component }> = {
  document: { key: 'ocr.scanToDocument', icon: DocumentTextOutline },
  ocr: { key: 'ocr.generalOCR', icon: ScanOutline },
  free: { key: 'ocr.extractRawText', icon: TextOutline },
  figure: { key: 'ocr.parseFigure', icon: ImageOutline },
  describe: { key: 'ocr.describeImage', icon: ChatboxEllipsesOutline },
  find: { key: 'ocr.locateObject', icon: SearchOutline },
  freeform: { key: 'ocr.customPrompt', icon: CreateOutline }
}

const currentLabel = computed(() => t(MODE_CONFIG[selectedMode.value].key))
const currentIcon = computed(() => MODE_CONFIG[selectedMode.value].icon)
const buttonType = computed(() => props.loading ? 'info' : 'primary')

// 按钮应保持启用状态，即使服务不可用或队列满
// 点击时由 checkHealth() 进行拦截并显示对话框
const isDisabled = computed(() => props.disabled) // 只尊重外部传入的 disabled 属性


const menuOptions = computed<DropdownOption[]>(() => {
  return (Object.keys(MODE_CONFIG) as OCRPromptType[]).map(key => ({
    label: t(MODE_CONFIG[key].key),
    key: key,
    icon: () => h(NIcon, null, { default: () => h(MODE_CONFIG[key].icon) }),
    props: {
      class: 'keep-queue-open'
    }
  }))
})

async function handleMainClick() {
  if (!await checkHealth()) return
  emit('run', selectedMode.value)
}

async function handleSelect(key: OCRPromptType) {
  if (!await checkHealth()) return
  selectedMode.value = key
  emit('run', key)
}

/**
 * Check OCR service health status and show error dialog if unavailable
 * @returns true if healthy, false otherwise
 */
async function checkHealth(): Promise<boolean> {
  // Force update status from service to ensure we have the absolute latest state
  // This eliminates the 1s sync lag between service and store in E2E tests
  await healthStore.refreshStatus()
  
  const isUnavailable = !healthStore.isAvailable
  const isQueueFull = healthStore.isFull
  
  // Debug logging for E2E tests
  console.log('[OCRModeSelector] checkHealth called:', {
    isAvailable: healthStore.isAvailable,
    isFull: isQueueFull,
    isUnavailable,
    healthInfo: healthStore.healthInfo
  })
  
  if (isUnavailable || isQueueFull) {
    dialog.error({
      title: isQueueFull ? t('errors.ocrQueueFullTitle') : t('errors.ocrServiceUnavailableTitle'),
      content: isQueueFull ? t('errors.ocrQueueFull') : t('errors.ocrServiceUnavailable'),
      positiveText: t('common.ok')
    })
    return false
  }
  return true
}
</script>

<style scoped>
.ocr-mode-selector {
  display: inline-flex;
}
</style>
