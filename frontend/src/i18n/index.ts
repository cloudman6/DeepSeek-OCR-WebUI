import { createI18n } from 'vue-i18n'
import en from './locales/en'
import zhCN from './locales/zh-CN'

export const SUPPORT_LOCALES = ['en', 'zh-CN'] as const
export type SupportedLocale = (typeof SUPPORT_LOCALES)[number]

export const DEFAULT_LOCALE: SupportedLocale = 'en'

// Get locale from localStorage or browser settings
export function getInitialLocale(): SupportedLocale {
  const stored = localStorage.getItem('locale')
  if (stored && SUPPORT_LOCALES.includes(stored as SupportedLocale)) {
    return stored as SupportedLocale
  }

  // Detect browser language
  const browserLang = navigator.language
  if (browserLang.startsWith('zh')) {
    return 'zh-CN'
  }
  return DEFAULT_LOCALE
}

export const i18n = createI18n({
  legacy: false,
  locale: getInitialLocale(),
  fallbackLocale: DEFAULT_LOCALE,
  messages: { en, 'zh-CN': zhCN },
  globalInjection: true
})

// Save locale preference to localStorage
export function setLocale(locale: SupportedLocale): void {
  i18n.global.locale.value = locale
  localStorage.setItem('locale', locale)
}

export function getCurrentLocale(): SupportedLocale {
  return i18n.global.locale.value as SupportedLocale
}
