<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { withBase } from 'vitepress'
import type { ChallengeData } from '../../../docs/shared/challenges.data'

const props = defineProps<{
  challenges: ChallengeData[]
}>()

// ─── Reactive state ─────────────────────────────────────────────────────────
const searchQuery = ref('')
const debouncedQuery = ref('')
const difficultyFilter = ref('')
const categoryFilter = ref('')
const sortField = ref<'id' | 'difficulty' | 'category' | 'date'>('id')
const sortDir = ref<'asc' | 'desc'>('asc')
const viewMode = ref<'grid' | 'list'>('list')

// ─── Inline debounce (300ms) ─────────────────────────────────────────────────
let debounceTimer: ReturnType<typeof setTimeout>
watch(searchQuery, (val) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { debouncedQuery.value = val }, 300)
})

// ─── Computed ────────────────────────────────────────────────────────────────
const categories = computed(() =>
  [...new Set(props.challenges.map(c => c.category).filter(Boolean))] as string[]
)

const DIFFICULTY_ORDER = ['easy', 'medium', 'hard', 'mystery']

const filteredChallenges = computed(() => {
  let list = props.challenges

  // Text search: title + description + tags
  const q = debouncedQuery.value.toLowerCase().trim()
  if (q) {
    list = list.filter(c => {
      const inTitle = c.title.toLowerCase().includes(q)
      const inDesc  = (c.description ?? '').toLowerCase().includes(q)
      const inTags  = (c.tags ?? []).join(' ').toLowerCase().includes(q)
      return inTitle || inDesc || inTags
    })
  }

  // Difficulty filter
  if (difficultyFilter.value) {
    list = list.filter(c => c.difficulty === difficultyFilter.value)
  }

  // Category filter
  if (categoryFilter.value) {
    list = list.filter(c => c.category === categoryFilter.value)
  }

  // Sort
  const dir = sortDir.value === 'asc' ? 1 : -1
  list = [...list].sort((a, b) => {
    if (sortField.value === 'id') {
      const ai = typeof a.id === 'number' ? a.id : parseInt(String(a.id ?? 0))
      const bi = typeof b.id === 'number' ? b.id : parseInt(String(b.id ?? 0))
      return (ai - bi) * dir
    }
    if (sortField.value === 'difficulty') {
      const ai = DIFFICULTY_ORDER.indexOf(a.difficulty ?? 'mystery')
      const bi = DIFFICULTY_ORDER.indexOf(b.difficulty ?? 'mystery')
      return (ai - bi) * dir
    }
    if (sortField.value === 'category') {
      return ((a.category ?? '').localeCompare(b.category ?? '')) * dir
    }
    if (sortField.value === 'date') {
      const da = a.date ? new Date(a.date).getTime() : 0
      const db = b.date ? new Date(b.date).getTime() : 0
      return (da - db) * dir
    }
    return 0
  })

  return list
})

// ─── Helpers ─────────────────────────────────────────────────────────────────
const difficultyBadge: Record<string, string> = {
  easy:    'ch-badge-easy',
  medium:  'ch-badge-medium',
  hard:    'ch-badge-hard',
  mystery: 'ch-badge-mystery',
}
const categoryBadge: Record<string, string> = {
  web: 'ch-badge-web',
}

function paddedId(id: number | string | undefined): string {
  const n = typeof id === 'number' ? id : parseInt(String(id ?? 0))
  return `#${String(n).padStart(3, '0')}`
}

function formatDate(d: string | null | undefined): string {
  if (!d) return ''
  return new Date(d).toLocaleDateString('zh-TW', { year: 'numeric', month: 'short', day: 'numeric' })
}

function toggleSortDir(): void {
  sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
}
</script>

<template>
  <div class="max-w-screen-xl mx-auto px-6 py-10">
    <header class="mb-8">
      <h1 class="text-[2em] font-bold m-0 mb-2 color-[var(--ch-text-1)]">Challenges</h1>
      <p class="m-0 color-[var(--ch-text-2)]">Choose a challenge to begin</p>
    </header>

    <!-- Toolbar -->
    <div class="flex flex-wrap gap-3 mb-6 items-center">
      <!-- Search -->
      <input
        v-model="searchQuery"
        type="text"
        :placeholder="$t('challenge_list.search_placeholder')"
        class="ch-input flex-1 min-w-[180px]"
      />

      <!-- Difficulty filter -->
      <select v-model="difficultyFilter" class="ch-select">
        <option value="">{{ $t('challenge_list.all_difficulties') }}</option>
        <option value="easy">Easy</option>
        <option value="medium">Medium</option>
        <option value="hard">Hard</option>
        <option value="mystery">Mystery</option>
      </select>

      <!-- Category filter -->
      <select v-model="categoryFilter" class="ch-select">
        <option value="">{{ $t('challenge_list.all_categories') }}</option>
        <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
      </select>

      <!-- Sort field -->
      <select v-model="sortField" class="ch-select">
        <option value="id">{{ $t('challenge_list.sort_by_id') }}</option>
        <option value="difficulty">{{ $t('challenge_list.sort_by_difficulty') }}</option>
        <option value="category">{{ $t('challenge_list.sort_by_category') }}</option>
        <option value="date">{{ $t('challenge_list.sort_by_date') }}</option>
      </select>

      <!-- Sort direction toggle -->
      <button
        :class="['ch-view-btn', 'text-sm font-mono']"
        :title="$t(sortDir === 'asc' ? 'challenge_list.sort_dir_asc' : 'challenge_list.sort_dir_desc')"
        @click="toggleSortDir"
      >{{ sortDir === 'asc' ? '↑' : '↓' }}</button>

      <!-- Grid/List toggle -->
      <div class="flex gap-1 ml-auto">
        <button
          :class="viewMode === 'grid' ? 'ch-view-btn-active' : 'ch-view-btn'"
          :title="$t('challenge_list.view_mode_grid')"
          @click="viewMode = 'grid'"
        >
          <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
            <rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/>
            <rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/>
          </svg>
        </button>
        <button
          :class="viewMode === 'list' ? 'ch-view-btn-active' : 'ch-view-btn'"
          :title="$t('challenge_list.view_mode_list')"
          @click="viewMode = 'list'"
        >
          <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
            <rect x="1" y="2" width="14" height="2" rx="1"/><rect x="1" y="7" width="14" height="2" rx="1"/>
            <rect x="1" y="12" width="14" height="2" rx="1"/>
          </svg>
        </button>
      </div>

      <!-- Result count -->
      <span class="text-sm color-[var(--ch-text-3)] whitespace-nowrap">{{ filteredChallenges.length }} {{ $t('challenge_list.count_suffix') }}</span>
    </div>

    <!-- Empty state -->
    <div
      v-if="filteredChallenges.length === 0"
      class="py-20 text-center color-[var(--ch-text-3)]"
    >
      <div class="text-4xl mb-4">🔍</div>
      <p class="text-base">{{ $t('challenge_list.empty_state') }}</p>
    </div>

    <!-- Grid view -->
    <div
      v-else-if="viewMode === 'grid'"
      class="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4"
    >
      <a
        v-for="c in filteredChallenges"
        :key="c.url"
        data-challenge-card
        data-challenge-link
        :href="withBase(c.url)"
        class="ch-card flex flex-col"
      >
        <!-- Title line: ID + Title -->
        <div class="flex items-center gap-2 mb-2">
          <span class="font-mono text-[0.75em] color-[var(--ch-accent)] font-bold shrink-0">{{ paddedId(c.id) }}</span>
          <span class="font-semibold text-[1.1em] color-[var(--ch-text-1)] leading-snug">{{ c.title }}</span>
        </div>
        <!-- Badges line -->
        <div class="flex gap-[6px] flex-wrap mb-3">
          <span v-if="c.difficulty" :class="difficultyBadge[c.difficulty] ?? 'ch-badge'">{{ c.difficulty }}</span>
          <span v-if="c.category" :class="categoryBadge[c.category] ?? 'ch-badge'">{{ c.category }}</span>
        </div>
        <!-- Description block -->
        <p v-if="c.description" class="m-0 mb-3 text-[0.85em] color-[var(--ch-text-2)] line-clamp-2 leading-relaxed">
          {{ c.description }}
        </p>
        <!-- Footer: Tags + Date -->
        <div class="flex items-center gap-2 mt-auto">
          <div v-if="c.tags && c.tags.length > 0" class="flex flex-wrap gap-1">
            <span v-for="tag in c.tags" :key="tag" class="ch-tag">{{ tag }}</span>
          </div>
          <span class="flex-1"></span>
          <span v-if="c.date" class="text-[0.75em] color-[var(--ch-text-3)] shrink-0 whitespace-nowrap">{{ formatDate(c.date) }}</span>
        </div>
      </a>
    </div>

    <!-- List view -->
    <div v-else class="rounded-xl border border-[var(--ch-border)] overflow-hidden">
      <a
        v-for="c in filteredChallenges"
        :key="c.url"
        :href="withBase(c.url)"
        class="ch-list-row no-underline"
      >
        <!-- Line 1: ID + Title + Badges + Date -->
        <div class="flex items-center gap-2 w-full">
          <span class="font-mono text-[0.75em] color-[var(--ch-accent)] font-bold shrink-0">{{ paddedId(c.id) }}</span>
          <span class="font-medium color-[var(--ch-text-1)] truncate">{{ c.title }}</span>
          <span v-if="c.difficulty" :class="difficultyBadge[c.difficulty] ?? 'ch-badge'" class="shrink-0">{{ c.difficulty }}</span>
          <span v-if="c.category" :class="categoryBadge[c.category] ?? 'ch-badge'" class="shrink-0">{{ c.category }}</span>
          <span class="text-[0.75em] color-[var(--ch-text-3)] shrink-0 ml-auto whitespace-nowrap">{{ formatDate(c.date) }}</span>
        </div>
        <!-- Line 2: Description + Tags -->
        <div class="flex items-center gap-2 w-full" v-if="c.description || (c.tags && c.tags.length > 0)">
          <span v-if="c.description" class="text-[0.8em] color-[var(--ch-text-2)] truncate">{{ c.description }}</span>
          <div v-if="c.tags && c.tags.length > 0" class="flex gap-1 shrink-0 ml-auto">
            <span v-for="tag in c.tags" :key="tag" class="ch-tag">{{ tag }}</span>
          </div>
        </div>
      </a>
    </div>
  </div>
</template>
