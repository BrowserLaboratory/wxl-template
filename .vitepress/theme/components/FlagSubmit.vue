<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  verify: (flag: string) => Promise<boolean>
  onExport?: () => void
  onExportNotes?: () => void
}>()

const flag = ref('')
type State = 'idle' | 'success' | 'failure'
const state = ref<State>('idle')

async function submit() {
  state.value = (await props.verify(flag.value)) ? 'success' : 'failure'
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex gap-2">
      <input
        data-flag-input
        v-model="flag"
        type="text"
        placeholder="CTF{...}"
        class="flex-1 px-3 py-2 rounded border border-[var(--ch-border)] bg-[var(--ch-bg-soft)] color-[var(--ch-text-1)] font-mono text-[0.9em] outline-none focus:border-[var(--ch-accent)]"
      />
      <button
        data-submit
        class="px-4 py-2 rounded bg-[var(--ch-accent)] color-white text-[0.9em] font-medium cursor-pointer border-none hover:opacity-90"
        @click="submit"
      >Submit Flag</button>
    </div>

    <div
      v-if="state === 'success'"
      data-success
      class="flex items-center gap-2 px-3 py-2 rounded bg-[var(--ch-easy-bg)] color-[var(--ch-easy-fg)] text-[0.875em] font-medium"
    >
      <span>Correct! Challenge solved.</span>
      <button
        v-if="props.onExport"
        data-export
        class="px-3 py-1 rounded text-[0.85em] border border-[var(--ch-border)] bg-[var(--ch-bg-soft)] color-[var(--ch-text-1)] cursor-pointer hover:border-[var(--ch-accent)]"
        @click="props.onExport?.()"
      >下載攻擊紀錄</button>
      <button
        v-if="props.onExportNotes"
        data-export-notes
        class="px-3 py-1 rounded text-[0.85em] border border-[var(--ch-border)] bg-[var(--ch-bg-soft)] color-[var(--ch-text-1)] cursor-pointer hover:border-[var(--ch-accent)]"
        @click="props.onExportNotes?.()"
      >下載滲透筆記</button>
    </div>
    <div
      v-if="state === 'failure'"
      data-failure
      class="px-3 py-2 rounded bg-[var(--ch-hard-bg)] color-[var(--ch-hard-fg)] text-[0.875em]"
    >
      Incorrect flag. Try again.
    </div>
  </div>
</template>
