<template>
  <div class="ocr-raw-text-panel">
    <div
      class="panel-header"
      @click="toggleExpand"
    >
      <div class="title-row">
        <n-icon :class="{ rotated: expanded }">
          <ChevronForwardOutline />
        </n-icon>
        <span class="title">{{ t('ocrRawTextPanel.title') }}</span>
      </div>
      <n-button
        size="tiny"
        secondary
        @click.stop="handleCopy"
      >
        <template #icon>
          <n-icon>
            <CopyOutline />
          </n-icon>
        </template>
        {{ t('ocrRawTextPanel.copy') }}
      </n-button>
    </div>
    
    <n-collapse-transition :show="expanded">
      <div class="panel-content">
        <n-scrollbar
          style="max-height: 300px"
          :x-scrollable="false"
        >
          <pre class="raw-text-content">{{ text || t('ocrRawTextPanel.noRawText') }}</pre>
        </n-scrollbar>
      </div>
    </n-collapse-transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { NButton, NIcon, NCollapseTransition, NScrollbar, useMessage } from 'naive-ui'
import { ChevronForwardOutline, CopyOutline } from '@vicons/ionicons5'
import { uiLogger } from '@/utils/logger'

interface Props {
  text: string
}

const props = defineProps<Props>()
const { t } = useI18n()
const expanded = ref(true)
const message = useMessage()

function toggleExpand() {
  expanded.value = !expanded.value
}

async function handleCopy() {
  if (!props.text) return

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
       await navigator.clipboard.writeText(props.text)
       message.success(t('ocrRawTextPanel.copied'))
    } else {
       // Fallback for older browsers or non-secure contexts
       const textArea = document.createElement('textarea')
       textArea.value = props.text
       document.body.appendChild(textArea)
       textArea.select()
       try {
         document.execCommand('copy')
         message.success(t('ocrRawTextPanel.copied'))
       } catch (err) {
         uiLogger.error('document.execCommand copy failed', err)
         message.error(t('ocrRawTextPanel.copyFailed'))
       }
       document.body.removeChild(textArea)
    }
  } catch (err) {
    uiLogger.error('handleCopy failed', err)
    message.error(t('ocrRawTextPanel.copyFailed'))
  }
}
</script>

<style scoped>
.ocr-raw-text-panel {
  border-top: 1px solid var(--n-border-color);
  background: #fff;
  min-width: 0;
  width: 100%;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  cursor: pointer;
  background: #fafafa;
  user-select: none;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--n-text-color-2);
}

.title-row .n-icon {
  transition: transform 0.2s;
}

.title-row .n-icon.rotated {
  transform: rotate(90deg);
}

.panel-content {
  padding: 0;
  border-top: 1px solid var(--n-border-color);
}

.raw-text-content {
  margin: 0;
  padding: 12px;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: v-mono, SF Mono, Menlo, Consolas, Courier, monospace;
  font-size: 13px;
  line-height: 1.5;
  color: var(--n-text-color);
  background: #fff;
}
</style>
