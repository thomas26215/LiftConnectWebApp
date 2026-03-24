<template>
  <div class="scroll-area">
    <slot />
  </div>
</template>

<style scoped>
.scroll-area {
  flex: 1;
  overflow-y: auto;
  padding: 20px 32px 40px;
  position: relative;
  z-index: 2;
}
</style>
