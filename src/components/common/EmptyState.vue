<template>
  <div class="empty-state-container">
    <div class="empty-state-hero">
      <div class="icon-wrapper">
        <n-icon
          size="120"
          color="#e0e0e0"
        >
          <CloudUpload />
        </n-icon>
      </div>
      <h1 class="hero-title">
        {{ $t('emptyState.title') }}
      </h1>
      <p class="hero-subtitle">
        {{ $t('emptyState.subtitle') }}
      </p>

      <n-button
        type="primary"
        size="large"
        class="select-files-btn"
        @click="$emit('add-files')"
      >
        <template #icon>
          <n-icon>
            <Add />
          </n-icon>
        </template>
        {{ $t('emptyState.selectFiles') }}
      </n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NIcon, NButton } from 'naive-ui'
import { CloudUpload, Add } from '@vicons/ionicons5'

defineEmits<{
  (e: 'add-files'): void
}>()
</script>

<style scoped>
.empty-state-container {
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f9fafb;
}

.empty-state-hero {
  text-align: center;
  padding: 40px;
  max-width: 600px;
}

.icon-wrapper {
  margin-bottom: 24px;
  animation: float 6s ease-in-out infinite;
}

.hero-title {
  font-size: 32px;
  font-weight: 800;
  color: #333;
  margin: 0 0 16px 0;
  letter-spacing: -1px;
}

.hero-subtitle {
  font-size: 18px;
  color: #666;
  margin: 0 0 32px 0;
}

.select-files-btn {
  font-weight: 600;
  padding: 0 32px;
  height: 48px;
  font-size: 16px;
  box-shadow: 0 4px 14px 0 rgba(24, 160, 88, 0.39);
}

@keyframes float {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0px);
  }
}
</style>
