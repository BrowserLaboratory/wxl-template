<script setup lang="ts">
import { ref, computed } from 'vue'
import { useData } from 'vitepress'
import LocaleSwitcher from './LocaleSwitcher.vue'

const props = defineProps<{
  title: string
  difficulty: string
  category: string
  runtimeReady: boolean
  runtimeError: string | null
  noteCount: number
  descriptionCollapsed: boolean
}>()

defineEmits<{
  'open-notes': []
  'toggle-description': []
}>()

const { isDark, site } = useData()

const githubLink = computed(() => {
  const links = site.value.themeConfig?.socialLinks as { icon: string; link: string }[] | undefined
  return links?.find(l => l.icon === 'github')?.link ?? null
})

function toggleDark() {
  isDark.value = !isDark.value
}

const hamburgerOpen = ref(false)

const difficultyBadge: Record<string, string> = {
  easy: 'ch-badge-easy',
  medium: 'ch-badge-medium',
  hard: 'ch-badge-hard',
  mystery: 'ch-badge-mystery',
}

const categoryBadge: Record<string, string> = {
  web: 'ch-badge-web',
}
</script>

<template>
  <nav class="merged-nav border-b border-[var(--ch-border)] bg-[var(--ch-bg)] color-[var(--ch-text-1)]">
    <!-- Row 1: Desktop/Tablet = full row; Mobile = brand + back + utilities -->
    <div class="flex items-center h-[40px] px-3 gap-2">
      <!-- Left section: brand + back + title(desktop/tablet only) + badges(desktop/tablet only) -->
      <div class="flex items-center gap-2 flex-1 min-w-0">
        <!-- Brand -->
        <span class="font-bold text-[0.875em] color-[var(--ch-accent)] shrink-0">WXL</span>

        <span class="ch-nav-sep">|</span>

        <!-- Back link -->
        <a
          href="/challenges/"
          class="text-[0.8125em] color-[var(--ch-accent)] no-underline whitespace-nowrap hover:underline shrink-0"
        >
          <span class="hidden lg:inline">← Challenges</span>
          <span class="lg:hidden">←</span>
        </a>

        <!-- Title + badges: visible on md+ (tablet/desktop), hidden on mobile -->
        <span class="ch-nav-sep hidden md:inline">|</span>
        <span class="hidden md:inline font-semibold text-[0.875em] truncate">{{ title }}</span>
        <span
          v-if="difficulty"
          data-badge="difficulty"
          :class="[difficultyBadge[difficulty] ?? 'ch-badge', 'hidden md:inline-block']"
        >{{ difficulty }}</span>
        <span
          v-if="category"
          data-badge="category"
          :class="[categoryBadge[category] ?? 'ch-badge', 'hidden md:inline-block']"
        >{{ category }}</span>
      </div>

      <!-- Right section -->
      <div class="flex items-center gap-2 shrink-0">
        <!-- Runtime status -->
        <span
          v-if="runtimeReady"
          data-runtime-status="ready"
          class="w-[8px] h-[8px] rounded-full bg-green-500"
          title="Runtime ready"
        />
        <span
          v-else-if="runtimeError"
          data-runtime-status="error"
          class="w-[8px] h-[8px] rounded-full bg-red-500"
          :title="runtimeError"
        />
        <span
          v-else
          data-runtime-status="loading"
          class="w-[8px] h-[8px] rounded-full bg-yellow-500 animate-pulse"
          title="Loading runtime..."
        />

        <!-- Description toggle (hidden on mobile row 1, visible on md+ when collapsed) -->
        <button
          v-if="descriptionCollapsed"
          data-desc-toggle
          class="ch-nav-pill-btn text-[0.75em] hidden md:flex"
          @click="$emit('toggle-description')"
        >📖 {{ $t('merged_nav.description_toggle_label') }}</button>

        <!-- Notes button -->
        <button
          data-notes-btn
          class="ch-nav-pill-btn"
          @click="$emit('open-notes')"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
          <span class="hidden lg:inline">Notes</span>
          <span
            v-if="noteCount > 0"
            class="inline-flex items-center justify-center min-w-[16px] h-[16px] px-[3px] rounded-full bg-[var(--ch-accent)] color-white text-[10px] font-bold leading-none"
          >{{ noteCount }}</span>
        </button>

        <!-- Dark mode toggle -->
        <button
          data-darkmode-toggle
          class="ch-nav-icon-btn"
          :title="$t(isDark ? 'merged_nav.darkmode_to_light' : 'merged_nav.darkmode_to_dark')"
          @click="toggleDark"
        >
          <svg v-if="isDark" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        </button>

        <!-- Locale switcher -->
        <LocaleSwitcher />

        <!-- GitHub link (hidden on mobile, in hamburger) -->
        <a
          v-if="githubLink"
          :href="githubLink"
          target="_blank"
          rel="noopener noreferrer"
          class="ch-nav-icon-btn no-underline hidden md:flex"
          title="GitHub"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
          </svg>
        </a>

        <!-- Hamburger menu (mobile only) -->
        <button
          data-hamburger
          class="ch-nav-icon-btn md:hidden"
          @click="hamburgerOpen = !hamburgerOpen"
        >☰</button>
      </div>
    </div>

    <!-- Row 2: Mobile only — title + badges + 📖 toggle -->
    <div class="flex items-center h-[32px] px-3 gap-2 md:hidden border-t border-[var(--ch-border)]">
      <span class="font-semibold text-[0.8125em] truncate flex-1">{{ title }}</span>
      <span
        v-if="difficulty"
        data-badge="difficulty"
        :class="difficultyBadge[difficulty] ?? 'ch-badge'"
      >{{ difficulty }}</span>
      <span
        v-if="category"
        data-badge="category"
        :class="categoryBadge[category] ?? 'ch-badge'"
      >{{ category }}</span>
      <button
        v-if="descriptionCollapsed"
        data-desc-toggle
        class="ch-nav-pill-btn text-[0.75em] md:hidden"
        @click="$emit('toggle-description')"
      >📖 {{ $t('merged_nav.description_toggle_label') }}</button>
    </div>

    <!-- Hamburger dropdown (mobile only) -->
    <div
      v-if="hamburgerOpen"
      data-hamburger-menu
      class="md:hidden border-t border-[var(--ch-border)] bg-[var(--ch-bg-soft)] px-3 py-2 flex flex-col gap-1"
    >
      <a href="/" class="text-[0.8125em] color-[var(--ch-text-1)] no-underline py-1 hover:color-[var(--ch-accent)]">Home</a>
      <a href="/docs/" class="text-[0.8125em] color-[var(--ch-text-1)] no-underline py-1 hover:color-[var(--ch-accent)]">Docs</a>
      <a
        v-if="githubLink"
        :href="githubLink"
        target="_blank"
        rel="noopener noreferrer"
        class="text-[0.8125em] color-[var(--ch-text-1)] no-underline py-1 hover:color-[var(--ch-accent)]"
      >GitHub</a>
    </div>
  </nav>
</template>
