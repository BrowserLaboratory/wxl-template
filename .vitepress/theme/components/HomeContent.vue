<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'
import type { ChallengeData } from '../../../docs/shared/challenges.data'

const props = defineProps<{
  challenges: ChallengeData[]
}>()

// Stats computation
const totalCount = computed(() => props.challenges.length)
const easyCount = computed(() => props.challenges.filter(c => c.difficulty === 'easy').length)
const mediumCount = computed(() => props.challenges.filter(c => c.difficulty === 'medium').length)
const hardCount = computed(() => props.challenges.filter(c => c.difficulty === 'hard').length)
const mysteryCount = computed(() => props.challenges.filter(c => !['easy','medium','hard'].includes(c.difficulty ?? '')).length)

// Latest 3 challenges sorted by date desc
const latestChallenges = computed(() => {
  return [...props.challenges]
    .filter(c => c.date)
    .sort((a, b) => {
      const da = new Date(a.date!).getTime()
      const db = new Date(b.date!).getTime()
      return db - da
    })
    .slice(0, 3)
})

const difficultyBadge: Record<string, string> = {
  easy:    'ch-badge-easy',
  medium:  'ch-badge-medium',
  hard:    'ch-badge-hard',
  mystery: 'ch-badge-mystery',
}

function formatDate(d: string | null | undefined): string {
  if (!d) return ''
  return new Date(d).toLocaleDateString('zh-TW', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>

<template>
  <div class="home-content-wrapper px-6 pb-20">
    <!-- Platform intro -->
    <section class="max-w-screen-lg mx-auto mb-16 text-center">
      <h2 class="text-2xl font-bold mb-4 color-[var(--ch-text-1)]">關於 WXL</h2>
      <p class="text-base color-[var(--ch-text-2)] leading-loose text-justify">
        WXL（網站滲透實驗室）是完全基於前端 WebAssembly 技術的 Web 資安挑戰平台。所有挑戰後端（Flask、FastAPI、PHP）均在瀏覽器中執行，無需任何伺服器即可進行真實的滲透測試練習。內建 HTTP Repeater、Python Code Editor、終端機模擬器等工具，提供完整的攻擊工具鏈。
      </p>
    </section>

    <!-- Stats -->
    <section class="max-w-screen-lg mx-auto mb-16">
      <h2 class="text-2xl font-bold mb-8 text-center color-[var(--ch-text-1)]">平台統計</h2>
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div class="bg-[var(--ch-bg-soft)] rounded-xl p-5 text-center border border-[var(--ch-border)]">
          <div class="text-3xl font-bold color-[var(--ch-accent)] mb-1">{{ totalCount }}</div>
          <div class="text-sm color-[var(--ch-text-2)]">題目總數</div>
        </div>
        <div class="bg-[var(--ch-bg-soft)] rounded-xl p-5 text-center border border-[var(--ch-border)]">
          <div class="text-3xl font-bold color-[var(--ch-easy-fg)] mb-1">{{ easyCount }}</div>
          <div class="text-sm color-[var(--ch-text-2)]">Easy</div>
        </div>
        <div class="bg-[var(--ch-bg-soft)] rounded-xl p-5 text-center border border-[var(--ch-border)]">
          <div class="text-3xl font-bold color-[var(--ch-med-fg)] mb-1">{{ mediumCount }}</div>
          <div class="text-sm color-[var(--ch-text-2)]">Medium</div>
        </div>
        <div class="bg-[var(--ch-bg-soft)] rounded-xl p-5 text-center border border-[var(--ch-border)]">
          <div class="text-3xl font-bold color-[var(--ch-hard-fg)] mb-1">{{ hardCount }}</div>
          <div class="text-sm color-[var(--ch-text-2)]">Hard</div>
        </div>
        <div class="bg-[var(--ch-bg-soft)] rounded-xl p-5 text-center border border-[var(--ch-border)]">
          <div class="text-3xl font-bold color-[var(--ch-myst-fg)] mb-1">{{ mysteryCount }}</div>
          <div class="text-sm color-[var(--ch-text-2)]">Mystery</div>
        </div>
      </div>
    </section>

    <!-- Latest challenges -->
    <section v-if="latestChallenges.length > 0" class="max-w-screen-lg mx-auto mb-16">
      <h2 class="text-2xl font-bold mb-8 text-center color-[var(--ch-text-1)]">最新題目</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a
          v-for="c in latestChallenges"
          :key="c.url"
          :href="withBase(c.url)"
          class="no-underline bg-[var(--ch-bg-soft)] rounded-xl p-5 border border-[var(--ch-border)] hover:border-[var(--ch-accent)] transition-colors cursor-pointer block"
        >
          <div class="flex items-start justify-between gap-2 mb-2">
            <span class="font-semibold color-[var(--ch-text-1)] text-base">{{ c.title }}</span>
            <span
              v-if="c.difficulty"
              :class="difficultyBadge[c.difficulty ?? 'mystery'] ?? 'ch-badge'"
              class="shrink-0"
            >{{ c.difficulty }}</span>
          </div>
          <p v-if="c.description" class="text-sm color-[var(--ch-text-2)] mb-2 line-clamp-2 m-0">{{ c.description }}</p>
          <div class="text-xs color-[var(--ch-text-3)]">{{ formatDate(c.date) }}</div>
        </a>
      </div>
    </section>

    <!-- Quick start -->
    <section class="max-w-screen-lg mx-auto">
      <h2 class="text-2xl font-bold mb-8 text-center color-[var(--ch-text-1)]">三步驟快速開始</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="text-center">
          <div class="w-12 h-12 rounded-full bg-[var(--ch-accent-soft)] flex items-center justify-center text-xl font-bold color-[var(--ch-accent)] mx-auto mb-4">1</div>
          <h3 class="font-semibold mb-2 color-[var(--ch-text-1)]">選擇挑戰</h3>
          <p class="text-sm color-[var(--ch-text-2)] leading-relaxed">前往題目總覽，依難度或類別選擇適合的挑戰題目。</p>
        </div>
        <div class="text-center">
          <div class="w-12 h-12 rounded-full bg-[var(--ch-accent-soft)] flex items-center justify-center text-xl font-bold color-[var(--ch-accent)] mx-auto mb-4">2</div>
          <h3 class="font-semibold mb-2 color-[var(--ch-text-1)]">使用工具</h3>
          <p class="text-sm color-[var(--ch-text-2)] leading-relaxed">使用內建的 Browser、Terminal、Code Editor、Repeater 分析並利用漏洞。</p>
        </div>
        <div class="text-center">
          <div class="w-12 h-12 rounded-full bg-[var(--ch-accent-soft)] flex items-center justify-center text-xl font-bold color-[var(--ch-accent)] mx-auto mb-4">3</div>
          <h3 class="font-semibold mb-2 color-[var(--ch-text-1)]">提交 Flag</h3>
          <p class="text-sm color-[var(--ch-text-2)] leading-relaxed">找到 Flag 後，輸入到題目頁面的提交框並確認答案是否正確。</p>
        </div>
      </div>
    </section>
  </div>
</template>
