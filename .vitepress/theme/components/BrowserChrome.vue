<script setup lang="ts">
defineProps<{
  modelValue: string
  disabled?: boolean
}>()

defineEmits<{
  'update:modelValue': [value: string]
  navigate: []
  back: []
  forward: []
}>()
</script>

<template>
  <div class="flex items-center gap-1.5 px-2 py-1.5 bg-[var(--ch-bg-soft)] border-b border-[var(--ch-border)]">
    <!-- Navigation buttons (hidden on mobile) -->
    <div class="hidden md:flex items-center gap-1">
      <button
        data-nav-back
        class="ch-nav-icon-btn w-[24px] h-[24px] text-[0.75em]"
        title="Back"
        @click="$emit('back')"
      >←</button>
      <button
        data-nav-forward
        class="ch-nav-icon-btn w-[24px] h-[24px] text-[0.75em]"
        title="Forward"
        @click="$emit('forward')"
      >→</button>
      <button
        data-nav-reload
        class="ch-nav-icon-btn w-[24px] h-[24px] text-[0.75em]"
        title="Reload"
        @click="$emit('navigate')"
      >↻</button>
    </div>

    <!-- Capsule URL bar -->
    <div class="flex items-center flex-1 gap-1.5 px-3 py-1 rounded-[20px] border border-[var(--ch-border)] bg-[var(--ch-bg)] md:mx-1">
      <span data-lock-icon class="text-[0.75em] color-[var(--ch-text-3)] shrink-0">🔒</span>
      <input
        data-url-input
        type="text"
        :value="modelValue"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @keydown.enter="$emit('navigate')"
        placeholder="https://challenge-…"
        class="flex-1 bg-transparent border-none outline-none text-[0.8125em] font-mono color-[var(--ch-text-1)] min-w-0"
      />
    </div>

    <!-- Go button -->
    <button
      data-go
      class="px-3 py-1 rounded-[20px] bg-[var(--ch-accent)] color-white text-[0.8125em] border-none shrink-0"
      :class="disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'"
      :disabled="disabled"
      @click="$emit('navigate')"
    >{{ disabled ? '…' : 'Go' }}</button>
  </div>
</template>
