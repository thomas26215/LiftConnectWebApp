<template>
  <div class="workout-card-grid">
    <div class="wc-tags">
      <span :class="['tag', `tag-${workout.type}`]">{{ typeLabels[workout.type] }}</span>
      <span v-if="workout.public" class="tag tag-pub">Public</span>
    </div>
    <div class="wcg-name">{{ workout.name }}</div>
    <div class="wcg-meta">⏱ {{ workout.duration }} min · 🏋️ {{ workout.exercises }} exercice{{ workout.exercises !== 1 ? 's' : '' }}</div>
    <div class="wcg-date">{{ workout.date }}</div>
    <div class="wcg-footer">
      <span class="wcg-likes" @click.stop="$emit('like', workout.id)">
        {{ workout.liked ? '❤️' : '🤍' }} {{ workout.likes }}
      </span>
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
.workout-card-grid {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r);
  padding: 18px;
  cursor: pointer;
  transition: all var(--transition);
  backdrop-filter: blur(12px);
  position: relative;
  overflow: hidden;
}
.workout-card-grid:hover {
  border-color: var(--border-mid);
  background: var(--surface-hover);
  transform: translateY(-3px);
  box-shadow:
    0 14px 36px rgba(0,0,0,0.25),
    0 0 0 1px rgba(186,242,216,0.08),
    0 4px 32px rgba(186,242,216,0.08);
}
.wcg-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-1);
  margin: 10px 0 5px;
  letter-spacing: -0.015em;
}
.wcg-meta { font-size: 0.7rem; color: var(--text-2); margin-bottom: 4px; }
.wcg-date { font-size: 0.67rem; color: var(--text-3); }
.wcg-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--border);
}
.wcg-likes {
  font-size: 0.7rem;
  color: var(--text-3);
  display: flex; align-items: center; gap: 4px;
  cursor: pointer;
  transition: color var(--transition);
}
.wcg-likes:hover { color: var(--secondary-dim); }
</style>
