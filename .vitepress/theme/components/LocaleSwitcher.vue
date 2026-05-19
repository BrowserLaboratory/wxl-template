<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vitepress'
import { persistLocale, type Locale } from '../i18n'

const { t, locale } = useI18n()
const router = useRouter()

const open = ref(false)
const rootEl = ref<HTMLElement | null>(null)

const currentLabel = computed(() =>
  locale.value === 'zh-TW' ? t('locale_switcher.tw_label') : t('locale_switcher.english_label')
)

function buildTargetPath(currentPath: string, target: Locale): string {
  let basePath = currentPath
  if (currentPath === '/zh-TW' || currentPath === '/zh-TW/') {
    basePath = '/'
  } else if (currentPath.startsWith('/zh-TW/')) {
    basePath = currentPath.slice('/zh-TW'.length)
  }
  if (target === 'zh-TW') {
    return basePath === '/' ? '/zh-TW/' : `/zh-TW${basePath}`
  }
  return basePath
}

function select(target: Locale) {
  open.value = false
  if (locale.value === target) return

  locale.value = target
  persistLocale(target)

  if (typeof window !== 'undefined') {
    const nextPath =
      buildTargetPath(window.location.pathname, target) +
      window.location.search +
      window.location.hash
    router.go(nextPath)
  }
}

function onDocumentClick(ev: MouseEvent) {
  if (!rootEl.value) return
  if (!rootEl.value.contains(ev.target as Node)) {
    open.value = false
  }
}

onMounted(() => {
  if (typeof document !== 'undefined') {
    document.addEventListener('click', onDocumentClick)
  }
})
onUnmounted(() => {
  if (typeof document !== 'undefined') {
    document.removeEventListener('click', onDocumentClick)
  }
})

defineExpose({ buildTargetPath })
</script>

<template>
  <div ref="rootEl" class="relative inline-block">
    <button
      data-locale-switcher-toggle
      class="ch-nav-icon-btn flex items-center gap-1"
      :aria-label="t('locale_switcher.button_aria')"
      :aria-expanded="open"
      aria-haspopup="listbox"
      @click="open = !open"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
      <span class="hidden md:inline text-[0.8em]">{{ currentLabel }}</span>
    </button>

    <ul
      v-if="open"
      data-locale-switcher-menu
      role="listbox"
      class="absolute right-0 top-full mt-1 min-w-[140px] rounded border border-[var(--ch-border)] bg-[var(--ch-bg-card)] shadow-lg py-1 z-50 list-none m-0 pl-0"
    >
      <li
        :class="['cursor-pointer px-3 py-1.5 text-[0.85em] hover:bg-[var(--ch-bg-soft)]', locale === 'en' ? 'color-[var(--ch-accent)] font-semibold' : 'color-[var(--ch-text-1)]']"
        role="option"
        :aria-selected="locale === 'en'"
        data-locale-option="en"
        @click="select('en')"
      >{{ t('locale_switcher.english_label') }}</li>
      <li
        :class="['cursor-pointer px-3 py-1.5 text-[0.85em] hover:bg-[var(--ch-bg-soft)]', locale === 'zh-TW' ? 'color-[var(--ch-accent)] font-semibold' : 'color-[var(--ch-text-1)]']"
        role="option"
        :aria-selected="locale === 'zh-TW'"
        data-locale-option="zh-TW"
        @click="select('zh-TW')"
      >{{ t('locale_switcher.tw_label') }}</li>
    </ul>
  </div>
</template>
