<template>
  <div class="section-head">
    <span class="section-title">{{ title }}</span>
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
}
.section-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-1);
  letter-spacing: -0.01em;
}
</style>
