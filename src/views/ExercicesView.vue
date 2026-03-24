<template>
  <div class="view-wrapper">
    <PageHeader title="Exercices" subtitle="Bibliothèque personnelle">
      <template #actions>
        <button class="btn-primary">+ Ajouter un exercice</button>
      </template>
    </PageHeader>

    <ScrollArea>
      <!-- Toolbar -->
      <div class="toolbar animate-in">
        <SearchBar v-model="search" placeholder="Rechercher un exercice..." />
        <select class="filter-select" v-model="muscleFilter">
          <option value="Tous">Tous les muscles</option>
          <option v-for="g in muscleGroups.slice(1)" :key="g" :value="g">{{ g }}</option>
        </select>
      </div>

      <!-- Pills -->
      <div class="pill-row animate-in delay-1">
        <span
          v-for="g in muscleGroups"
          :key="g"
          class="pill"
          :class="{ active: muscleFilter === g }"
          @click="muscleFilter = g"
        >{{ g }}</span>
      </div>

      <!-- Grid -->
      <div class="exo-grid">
        <div
          v-for="(ex, i) in filteredExercises"
          :key="ex.id"
          class="exo-card animate-in"
          :class="`delay-${Math.min(i + 1, 6)}`"
        >
          <div class="exo-icon">{{ ex.icon }}</div>
          <div>
            <div class="exo-name">{{ ex.name }}</div>
            <div class="exo-muscle">{{ ex.muscle }}</div>
          </div>
          <div class="exo-tags">
            <span :class="['tag', `tag-${ex.type}`]">{{ typeLabels[ex.type] }}</span>
          </div>
          <div class="exo-footer">
            <span class="exo-used">Utilisé {{ ex.uses }}×</span>
            <button class="btn-ghost">Détail →</button>
          </div>
        </div>
      </div>

      <div v-if="filteredExercises.length === 0" class="empty-state animate-in">
        <div class="empty-icon">🏋️</div>
        <div class="empty-title">Aucun exercice trouvé</div>
        <div class="empty-sub">Essaie un autre terme ou un autre groupe musculaire.</div>
      </div>
    </ScrollArea>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import PageHeader  from '@/components/layout/PageHeader.vue'
import ScrollArea  from '@/components/layout/ScrollArea.vue'
import SearchBar   from '@/components/ui/SearchBar.vue'
import { exercises, muscleGroups, typeLabels } from '@/data'

const search = ref('')
const muscleFilter = ref('Tous')

const filteredExercises = computed(() => exercises.filter(ex => {
  const matchSearch = ex.name.toLowerCase().includes(search.value.toLowerCase())
  const matchMuscle = muscleFilter.value === 'Tous' || ex.muscle.includes(muscleFilter.value)
  return matchSearch && matchMuscle
}))
</script>

<style scoped>
.view-wrapper { display: flex; flex-direction: column; height: 100vh; overflow: hidden; }

.toolbar { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
.filter-select {
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-sm);
  padding: 9px 12px; color: var(--text-2); font-size: 0.8rem; cursor: pointer; outline: none;
  transition: border-color var(--transition);
}
.filter-select:focus { border-color: var(--border-mid); }

.pill-row { display: flex; gap: 7px; flex-wrap: wrap; margin-bottom: 20px; }
.pill {
  padding: 5px 14px; border-radius: 100px; font-size: 0.73rem; font-weight: 500;
  cursor: pointer; border: 1px solid var(--border); background: var(--surface);
  color: var(--text-2); transition: all var(--transition); user-select: none;
}
.pill:hover { border-color: var(--border-mid); color: var(--text-1); }
.pill.active { background: rgba(186,242,216,0.1); border-color: var(--border-mid); color: var(--secondary); }

.exo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.exo-card {
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--r);
  padding: 18px; cursor: pointer; transition: all var(--transition); backdrop-filter: blur(12px);
  display: flex; flex-direction: column; gap: 10px;
}
.exo-card:hover {
  border-color: var(--border-mid); background: var(--surface-hover); transform: translateY(-2px);
  box-shadow: 0 10px 28px rgba(0,0,0,0.2), 0 0 0 1px rgba(186,242,216,0.08), 0 4px 24px rgba(186,242,216,0.07);
}
.exo-icon {
  width: 44px; height: 44px; border-radius: 12px;
  background: rgba(186,242,216,0.07); border: 1px solid var(--border-mid);
  display: flex; align-items: center; justify-content: center; font-size: 1.2rem;
  transition: transform var(--spring), background var(--transition);
}
.exo-card:hover .exo-icon { transform: rotate(-5deg) scale(1.08); background: rgba(186,242,216,0.13); }
.exo-name { font-size: 0.88rem; font-weight: 600; color: var(--text-1); }
.exo-muscle { font-size: 0.72rem; color: var(--secondary-dim); margin-top: 2px; }
.exo-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 10px; border-top: 1px solid var(--border); margin-top: auto; }
.exo-used { font-size: 0.68rem; color: var(--text-3); }

.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 12px; padding: 48px; text-align: center;
  background: var(--surface); border: 1px dashed rgba(255,255,255,0.08); border-radius: var(--r);
}
.empty-icon { font-size: 2rem; opacity: 0.3; }
.empty-title { font-size: 0.88rem; font-weight: 600; color: var(--text-2); }
.empty-sub { font-size: 0.78rem; color: var(--text-3); max-width: 300px; line-height: 1.6; }
</style>
