<template>
  <div class="scroll-area" @scroll="onScroll">
    <slot />
  </div>
</template>

<script setup>
const emit = defineEmits(['scroll'])

function onScroll(event) {
  emit('scroll', event)
}
</script>

<style scoped>
.scroll-area {
  flex: 1;
  overflow-y: auto;
  padding: 20px 32px 40px;
  position: relative;
  z-index: 2;
}
</style>
