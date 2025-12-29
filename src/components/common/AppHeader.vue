<template>
  <n-layout-header
    class="app-header"
    bordered
  >
    <!-- Left: Branding -->
    <div class="header-brand">
      <n-icon
        size="24"
        color="#18a058"
        class="brand-icon"
      >
        <DocumentText />
      </n-icon>
      <span class="app-title">Scan2Doc</span>
    </div>

    <!-- Right: Actions -->
    <div class="header-actions">
      <!-- Page Count Badge -->
      <n-tag 
        v-if="pageCount > 0" 
        round 
        :bordered="false" 
        type="info" 
        size="small"
        class="page-count-badge"
      >
        {{ pageCountText }}
      </n-tag>
      
      <!-- Primary CTA -->
      <n-button
        type="primary"
        size="medium"
        @click="$emit('add-files')"
      >
        <template #icon>
          <n-icon>
            <CloudUpload />
          </n-icon>
        </template>
        Import Files
      </n-button>
    </div>
  </n-layout-header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NLayoutHeader, NButton, NIcon, NTag } from 'naive-ui'
import { DocumentText, CloudUpload } from '@vicons/ionicons5'

const props = defineProps<{
  pageCount: number
}>()

defineEmits<{
  (e: 'add-files'): void
}>()

const pageCountText = computed(() => {
  return `${props.pageCount} ${props.pageCount > 1 ? 'Pages' : 'Page'} Loaded`
})
</script>

<style scoped>
.app-header {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background-color: #f6f7f8;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  user-select: none;
}

.brand-icon {
  display: flex;
}

.app-title {
  font-size: 18px;
  font-weight: 700;
  color: #333;
  letter-spacing: -0.5px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-count-badge {
  font-weight: 600;
}
</style>
