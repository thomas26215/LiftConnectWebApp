<template>
  <div class="app-layout">
    <AppSidebar />
    <main class="main">
      <div class="bg-grid-main" aria-hidden="true"></div>
      <slot />
    </main>
  </div>
</template>

<script setup>
import AppSidebar from './AppSidebar.vue'
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  width: 100%;
  overflow: hidden;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 100vh;
  position: relative;
}

.main::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 60% 40% at 70% 10%, rgba(34,59,101,0.35) 0%, transparent 70%),
    radial-gradient(ellipse 40% 30% at 20% 80%, rgba(186,242,216,0.04) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}

.bg-grid-main {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background-image:
    linear-gradient(rgba(186,242,216,0.018) 1px, transparent 1px),
    linear-gradient(90deg, rgba(186,242,216,0.018) 1px, transparent 1px);
  background-size: 50px 50px;
  mask-image: radial-gradient(ellipse 80% 60% at 60% 20%, black 10%, transparent 100%);
}
</style>
