<template>
  <div class="view-wrapper">
    <PageHeader :title="`Mes entraînements`" :subtitle="`${workoutsStore.filtered.length} entraînements`">
      <template #actions>
        <button class="btn-primary">+ Nouvel entraînement</button>
      </template>
    </PageHeader>

    <ScrollArea>
      <!-- Toolbar -->
      <div class="toolbar animate-in">
        <SearchBar v-model="workoutsStore.searchQuery" placeholder="Rechercher un entraînement..." />
        <select class="filter-select" v-model="workoutsStore.typeFilter">
          <option value="all">Tous les types</option>
          <option value="push">Push</option>
          <option value="pull">Pull</option>
          <option value="legs">Jambes</option>
          <option value="full">Full Body</option>
          <option value="upper">Haut du corps</option>
        </select>
        <div class="view-toggle">
          <button class="vt-btn" :class="{ active: viewMode === 'grid' }" @click="viewMode = 'grid'">⊞</button>
          <button class="vt-btn" :class="{ active: viewMode === 'list' }" @click="viewMode = 'list'">≡</button>
        </div>
      </div>

      <!-- Grid view -->
      <div v-if="viewMode === 'grid'" class="workouts-grid">
        <WorkoutCardGrid
          v-for="(w, i) in workoutsStore.filtered"
          :key="w.id"
          :workout="w"
          class="animate-in"
          :class="`delay-${Math.min(i, 6)}`"
          @like="workoutsStore.toggleLike"
        />
      </div>

      <!-- List view -->
      <div v-else class="workouts-list">
        <WorkoutCard
          v-for="(w, i) in workoutsStore.filtered"
          :key="w.id"
          :workout="w"
          class="animate-in"
          :class="`delay-${Math.min(i, 6)}`"
          @like="workoutsStore.toggleLike"
        />
      </div>

      <!-- Empty state -->
      <div v-if="workoutsStore.filtered.length === 0" class="empty-state animate-in">
        <div class="empty-icon">🔍</div>
        <div class="empty-title">Aucun entraînement trouvé</div>
        <div class="empty-sub">Essaie un autre terme de recherche ou un autre filtre.</div>
      </div>
    </ScrollArea>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import PageHeader     from '@/components/layout/PageHeader.vue'
import ScrollArea     from '@/components/layout/ScrollArea.vue'
import SearchBar      from '@/components/ui/SearchBar.vue'
import WorkoutCard    from '@/components/ui/WorkoutCard.vue'
import WorkoutCardGrid from '@/components/ui/WorkoutCardGrid.vue'
import { useWorkoutsStore } from '@/stores/workouts'

const workoutsStore = useWorkoutsStore()
const viewMode = ref('grid')
</script>

<style scoped>
.view-wrapper { display: flex; flex-direction: column; height: 100vh; overflow: hidden; }

.toolbar { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }

.filter-select {
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-sm);
  padding: 9px 12px; color: var(--text-2); font-size: 0.8rem; cursor: pointer; outline: none;
  transition: border-color var(--transition);
}
.filter-select:focus { border-color: var(--border-mid); }

.view-toggle { display: flex; gap: 4px; }
.vt-btn {
  width: 34px; height: 34px; border-radius: 8px;
  background: var(--surface); border: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: var(--text-3); font-size: 0.8rem;
  transition: all var(--transition);
}
.vt-btn.active, .vt-btn:hover { background: rgba(186,242,216,0.1); border-color: var(--border-mid); color: var(--secondary); }

.workouts-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.workouts-list { display: flex; flex-direction: column; gap: 10px; }

.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 12px; padding: 48px 24px; text-align: center;
  background: var(--surface); border: 1px dashed rgba(255,255,255,0.08); border-radius: var(--r);
}
.empty-icon { font-size: 2rem; opacity: 0.3; }
.empty-title { font-size: 0.88rem; font-weight: 600; color: var(--text-2); }
.empty-sub { font-size: 0.78rem; color: var(--text-3); max-width: 300px; line-height: 1.6; }
</style>
