<template>
  <div class="preview">
    <n-tabs
      v-model:value="currentView"
      type="segment"
      animated
    >
      <n-tab-pane
        v-for="view in views"
        :key="view.key"
        :name="view.key"
        :tab="view.label"
      >
        <div class="preview-content">
          <div
            v-if="view.key === 'image'"
            class="image-wrapper"
          >
            <img
              v-if="fullImageUrl"
              :src="fullImageUrl"
              alt="Preview"
              class="preview-img"
            >
            <n-empty
              v-else
              :description="currentPage?.status === 'rendering' ? 'Rendering...' : 'No image available'"
            />
          </div>
          <pre
            v-else-if="view.key === 'md'"
            class="markdown-preview"
          >{{ currentPageContent?.md || 'No markdown content available' }}</pre>
          <div
            v-else-if="view.key === 'html'"
            class="html-preview"
            v-html="currentPageContent?.html || '<p>No HTML content available</p>'"
          />
        </div>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { NTabs, NTabPane, NEmpty } from 'naive-ui'
import { db } from '@/db'
import { uiLogger } from '@/utils/logger'

import type { Page } from '@/stores/pages'

interface Output {
  format: string
  content?: string
}

const props = defineProps<{
  currentPage?: Page | null
}>()

const currentView = ref<'image' | 'md' | 'html'>('image')
const fullImageUrl = ref<string>('')

const views = [
  { key: 'image' as const, label: 'Image' },
  { key: 'md' as const, label: 'Markdown' },
  { key: 'html' as const, label: 'HTML' }
]

const currentPageContent = computed(() => {
  if (!props.currentPage) return { md: '', html: '' }
  
  const outputs = (props.currentPage.outputs || []) as Output[]
  const md = outputs.find((o: Output) => o.format === 'markdown')?.content || ''
  const html = outputs.find((o: Output) => o.format === 'html')?.content || ''
  
  return { md, html }
})

// Watch for page change or status change to load image
watch(
  [() => props.currentPage?.id, () => props.currentPage?.status],
  async ([newPageId, newStatus], [oldPageId, oldStatus]) => {
    await handlePreviewPageChange(newPageId, newStatus, oldPageId, oldStatus)
  },
  { immediate: true }
)

/**
 * Handle page or status change for preview
 */
async function handlePreviewPageChange(
  newPageId: string | undefined,
  newStatus: string | undefined,
  oldPageId: string | undefined,
  oldStatus: string | undefined
) {
  const idChanged = newPageId !== oldPageId
  const becameReady = newStatus === 'ready' && oldStatus !== 'ready'

  if (!idChanged && !becameReady) return

  cleanupPreviewUrl(idChanged)

  if (!newPageId || newStatus === 'pending_render' || newStatus === 'rendering') return

  await loadPreviewBlob(newPageId)
}

/**
 * Cleanup preview object URL
 */
function cleanupPreviewUrl(idChanged: boolean) {
  if (idChanged && fullImageUrl.value) {
    URL.revokeObjectURL(fullImageUrl.value)
    fullImageUrl.value = ''
  }
}

/**
 * Load preview blob from DB
 */
async function loadPreviewBlob(pageId: string) {
  try {
    const blob = await db.getPageImage(pageId)
    if (blob) {
      fullImageUrl.value = URL.createObjectURL(blob)
    }
  } catch (error) {
    uiLogger.error('Failed to load image for preview', error)
  }
}

onUnmounted(() => {
  if (fullImageUrl.value) {
    URL.revokeObjectURL(fullImageUrl.value)
  }
})


</script>

<style scoped>
.preview {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.preview-content {
  flex: 1;
  padding: 16px;
  overflow: auto;
  height: 100%;
}

.image-preview {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-wrapper {
  max-width: 100%;
  max-height: 100%;
  display: flex;
  justify-content: center;
}

.preview-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

.markdown-preview {
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
  color: #374151;
  background: #f9fafb;
  padding: 16px;
  border-radius: 6px;
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.html-preview {
  padding: 16px;
  background: #f9fafb;
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.5;
  color: #374151;
}

.html-preview :deep(h1) {
  font-size: 1.5em;
  margin: 0.67em 0;
  font-weight: bold;
}

.html-preview :deep(h2) {
  font-size: 1.3em;
  margin: 0.75em 0;
  font-weight: bold;
}

.html-preview :deep(p) {
  margin: 1em 0;
}
</style>