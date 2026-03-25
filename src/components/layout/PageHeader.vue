<template>
  <div class="topbar">
    <div class="topbar-text">
      <div class="page-title animate-slide-left">{{ title }}</div>
      <div class="page-date animate-slide-left delay-1">{{ subtitle }}</div>
    </div>
    <div class="topbar-actions animate-slide-right">
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
  background: var(--bg);
  border-bottom: 1px solid var(--border);
}

.topbar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(186, 242, 216, 0.1),
    transparent
  );
}

.topbar-text {
  flex: 1;
}

.page-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text-1);
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, var(--text-1), var(--secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-date {
  font-size: 0.75rem;
  color: var(--text-3);
  margin-top: 4px;
  transition: color var(--transition);
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
