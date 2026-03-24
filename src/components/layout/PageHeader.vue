<template>
  <div class="topbar">
    <div>
      <div class="page-title">{{ title }}</div>
      <div class="page-date">{{ subtitle }}</div>
    </div>
    <div class="topbar-actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title:    { type: String, required: true },
  subtitle: { type: String, default: '' },
})
</script>

<style scoped>
.topbar {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 32px 0;
  gap: 16px;
}
.page-title {
  font-size: 1.4rem;
  font-weight: 600;
  color: var(--text-1);
  letter-spacing: -0.02em;
}
.page-date {
  font-size: 0.75rem;
  color: var(--text-3);
  margin-top: 2px;
}
.topbar-actions { display: flex; align-items: center; gap: 10px; }
</style>
