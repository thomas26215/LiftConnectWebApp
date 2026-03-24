<template>
  <div class="workout-card">
    <div class="wc-top">
      <div class="wc-tags">
        <span :class="['tag', `tag-${workout.type}`]">{{ typeLabels[workout.type] }}</span>
        <span v-if="workout.public" class="tag tag-pub">Public</span>
      </div>
      <div class="wc-menu">⋯</div>
    </div>
    <div class="wc-name">{{ workout.name }}</div>
    <div class="wc-meta">
      <span>⏱ {{ workout.duration }} min</span>
      <span>🏋️ {{ workout.exercises }} exercice{{ workout.exercises !== 1 ? 's' : '' }}</span>
    </div>
    <div class="wc-date">{{ workout.date }}</div>
    <div class="wc-bottom">
      <div class="wc-actions">
        <span class="wc-action" @click.stop="$emit('like', workout.id)">
          {{ workout.liked ? '❤️' : '🤍' }} {{ workout.likes }}
        </span>
      </div>
      <button class="btn-ghost">Voir →</button>
    </div>
  </div>
</template>

<script setup>
import { typeLabels } from '@/data'
defineProps({ workout: { type: Object, required: true } })
defineEmits(['like'])
</script>

<style scoped>
.workout-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r);
  padding: 16px 18px;
  cursor: pointer;
  transition: all var(--transition);
  backdrop-filter: blur(12px);
  position: relative;
  overflow: hidden;
}
.workout-card:hover {
  border-color: var(--border-mid);
  background: var(--surface-hover);
  transform: translateY(-2px);
  box-shadow:
    0 10px 28px rgba(0,0,0,0.2),
    0 0 0 1px rgba(186,242,216,0.08),
    0 4px 24px rgba(186,242,216,0.07);
}
.wc-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 8px;
}
.wc-tags { display: flex; gap: 5px; flex-wrap: wrap; }
.wc-menu {
  width: 24px; height: 24px;
  border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  color: var(--text-3);
  font-size: 1rem;
  transition: background var(--transition), color var(--transition);
  flex-shrink: 0;
}
.wc-menu:hover { background: rgba(255,255,255,0.06); color: var(--text-1); }
.wc-name {
  font-size: 0.93rem;
  font-weight: 600;
  color: var(--text-1);
  margin-bottom: 6px;
  letter-spacing: -0.01em;
  transition: color var(--transition);
}
.workout-card:hover .wc-name { color: #fff; }
.wc-meta {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 0.75rem;
  color: var(--text-2);
  margin-bottom: 6px;
}
.wc-meta span { display: flex; align-items: center; gap: 4px; }
.wc-date { font-size: 0.67rem; color: var(--text-3); }
.wc-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--border);
}
.wc-actions { display: flex; align-items: center; gap: 12px; }
.wc-action {
  display: flex; align-items: center; gap: 5px;
  font-size: 0.7rem; color: var(--text-3);
  cursor: pointer;
  transition: color var(--transition);
}
.wc-action:hover { color: var(--secondary-dim); }
</style>
