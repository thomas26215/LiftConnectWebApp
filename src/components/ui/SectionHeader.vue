<template>
  <div class="section-head">
    <div class="section-head-content">
      <span class="section-indicator"></span>
      <span class="section-title">{{ title }}</span>
    </div>
    <slot name="action" />
  </div>
</template>

<script setup>
defineProps({ title: { type: String, required: true } })
</script>

<style scoped>
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
}

.section-head-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-indicator {
  width: 4px;
  height: 16px;
  background: linear-gradient(180deg, var(--secondary), rgba(186, 242, 216, 0.4));
  border-radius: 2px;
  animation: float 3s ease-in-out infinite;
}

.section-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-1);
  letter-spacing: 0.01em;
  text-transform: uppercase;
  background: linear-gradient(135deg, var(--text-1), var(--secondary-dim));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
</style>
