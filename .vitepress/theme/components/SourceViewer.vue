<script setup lang="ts">
withDefaults(
  defineProps<{
    sourceCode: string
    visible?: boolean
  }>(),
  { visible: false },
)
</script>

<template>
  <div v-if="visible" data-source-viewer class="source-viewer">
    <pre class="source-code"><code>{{ sourceCode }}</code></pre>
  </div>
</template>
