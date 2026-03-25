<template>
  <div class="skeleton-wrapper">
    <div v-if="type === 'card'" class="skeleton-card">
      <div class="skeleton-header">
        <div class="skeleton-avatar"></div>
        <div class="skeleton-title-group">
          <div class="skeleton-title"></div>
          <div class="skeleton-subtitle"></div>
        </div>
      </div>
      <div class="skeleton-content">
        <div class="skeleton-line"></div>
        <div class="skeleton-line short"></div>
      </div>
    </div>

    <div v-else-if="type === 'list-item'" class="skeleton-list-item">
      <div class="skeleton-line full"></div>
      <div class="skeleton-line"></div>
    </div>

    <div v-else-if="type === 'chart'" class="skeleton-chart">
      <div class="skeleton-bar"></div>
      <div class="skeleton-bar"></div>
      <div class="skeleton-bar"></div>
    </div>

    <div v-else class="skeleton-text">
      <div class="skeleton-line"></div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  type: {
    type: String,
    default: 'text',
    validator: (val) => ['text', 'card', 'list-item', 'chart'].includes(val),
  },
})
</script>

<style scoped>
.skeleton-wrapper {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.skeleton-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r);
  padding: 20px;
}

.skeleton-header {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.skeleton-avatar {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: linear-gradient(
    90deg,
    var(--surface) 0%,
    rgba(186, 242, 216, 0.08) 50%,
    var(--surface) 100%
  );
  background-size: 1000px 100%;
  animation: shimmer 2s infinite;
  flex-shrink: 0;
}

.skeleton-title-group {
  flex: 1;
}

.skeleton-title {
  height: 16px;
  background: linear-gradient(
    90deg,
    var(--surface) 0%,
    rgba(186, 242, 216, 0.08) 50%,
    var(--surface) 100%
  );
  background-size: 1000px 100%;
  animation: shimmer 2s infinite;
  border-radius: 4px;
  margin-bottom: 8px;
}

.skeleton-subtitle {
  height: 12px;
  width: 70%;
  background: linear-gradient(
    90deg,
    var(--surface) 0%,
    rgba(186, 242, 216, 0.08) 50%,
    var(--surface) 100%
  );
  background-size: 1000px 100%;
  animation: shimmer 2s infinite;
  border-radius: 4px;
}

.skeleton-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-line {
  height: 12px;
  background: linear-gradient(
    90deg,
    var(--surface) 0%,
    rgba(186, 242, 216, 0.08) 50%,
    var(--surface) 100%
  );
  background-size: 1000px 100%;
  animation: shimmer 2s infinite;
  border-radius: 4px;
}

.skeleton-line.full {
  height: 16px;
  margin-bottom: 8px;
}

.skeleton-line.short {
  width: 60%;
}

.skeleton-list-item {
  padding: 12px;
  border-bottom: 1px solid var(--border);
}

.skeleton-chart {
  display: flex;
  gap: 8px;
  align-items: flex-end;
  height: 120px;
}

.skeleton-bar {
  flex: 1;
  background: linear-gradient(
    90deg,
    var(--surface) 0%,
    rgba(186, 242, 216, 0.08) 50%,
    var(--surface) 100%
  );
  background-size: 1000px 100%;
  animation: shimmer 2s infinite;
  border-radius: 4px 4px 0 0;
  min-height: 60%;
}

.skeleton-text {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
