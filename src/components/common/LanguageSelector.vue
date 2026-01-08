<template>
  <n-dropdown
    placement="bottom-end"
    :options="languageOptions"
    data-testid="language-selector-dropdown"
    @select="handleLanguageChange"
  >
    <n-button
      secondary
      size="small"
      :title="$t('common.language')"
      data-testid="language-selector-button"
    >
      <template #icon>
        <n-icon>
          <LanguageOutline />
        </n-icon>
      </template>
      <span data-testid="current-language-label">{{ currentLabel }}</span>
    </n-button>
  </n-dropdown>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NButton, NIcon, NDropdown } from 'naive-ui'
import { LanguageOutline } from '@vicons/ionicons5'
import { useI18n } from 'vue-i18n'
import { setLocale, type SupportedLocale } from '@/i18n'

const { t, locale } = useI18n()

const languageOptions = computed(() => [
  {
    label: t('common.english'),
    key: 'en',
    disabled: locale.value === 'en'
  },
  {
    label: t('common.chinese'),
    key: 'zh-CN',
    disabled: locale.value === 'zh-CN'
  }
])

const currentLabel = computed(() => {
  return locale.value === 'en'
    ? t('common.english')
    : t('common.chinese')
})

function handleLanguageChange(key: string) {
  setLocale(key as SupportedLocale)
}
</script>

<style scoped>
/* No additional styles needed */
</style>
