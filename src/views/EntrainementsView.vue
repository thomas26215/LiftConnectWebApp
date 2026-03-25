<template>
  <div class="view-wrapper">
    <PageHeader 
      title="Mes entraînements"
      :subtitle="`${totalWorkouts} entraînement${totalWorkouts !== 1 ? 's' : ''} créé${totalWorkouts !== 1 ? 's' : ''}`"
    >
      <template #actions>
        <button class="btn-primary">+ Nouvel entraînement</button>
      </template>
    </PageHeader>

    <ScrollArea @scroll="onScrollArea">
      <div v-if="loading" class="empty-state animate-in">
        <div class="empty-title">Chargement des entraînements...</div>
      </div>

      <div v-else-if="error" class="empty-state animate-in">
        <div class="empty-title">Impossible de charger les entraînements</div>
        <div class="empty-sub">Vérifie la route Firestore `workouts` et les permissions.</div>
      </div>

      <template v-else>
        <!-- Toolbar -->
        <div class="toolbar animate-in">
          <SearchBar v-model="search" placeholder="Rechercher un entraînement..." />
          <select class="filter-select" v-model="typeFilter">
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
            <button class="vt-btn refresh-btn" :disabled="loading" @click="forceRefresh" title="Forcer le rechargement">🔄</button>
          </div>
        </div>

        <!-- Grid view -->
        <div v-if="viewMode === 'grid'" class="workouts-grid">
          <WorkoutCardGrid
            v-for="(w, i) in filteredWorkouts"
            :key="w.id"
            :workout="w"
            class="animate-in"
            :class="`delay-${Math.min(i, 6)}`"
          />
        </div>

        <!-- List view -->
        <div v-else class="workouts-list">
          <WorkoutCard
            v-for="(w, i) in filteredWorkouts"
            :key="w.id"
            :workout="w"
            class="animate-in"
            :class="`delay-${Math.min(i, 6)}`"
          />
        </div>

        <!-- Empty state -->
        <div v-if="filteredWorkouts.length === 0" class="empty-state animate-in">
          <div class="empty-icon">🏋️</div>
          <div class="empty-title">Aucun entraînement trouvé</div>
          <div class="empty-sub">Essaie un autre terme de recherche ou un autre filtre.</div>
        </div>

        <div v-if="loadingMore" class="load-more">Chargement de plus d'entraînements...</div>

        <div v-else-if="hasMore && filteredWorkouts.length > 0" class="load-more hint">
          Descends pour charger plus d'entraînements
        </div>
      </template>
    </ScrollArea>
  </div>
</template>

<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import PageHeader     from '@/components/layout/PageHeader.vue'
import ScrollArea     from '@/components/layout/ScrollArea.vue'
import SearchBar      from '@/components/ui/SearchBar.vue'
import WorkoutCard    from '@/components/ui/WorkoutCard.vue'
import WorkoutCardGrid from '@/components/ui/WorkoutCardGrid.vue'
import { useCreatedWorkouts } from '@/composables/useCreatedWorkouts'
import { useAuthStore } from '@/stores/auth'

const {
  search,
  typeFilter,
  loading,
  loadingMore,
  error,
  totalWorkouts,
  hasMore,
  filteredWorkouts,
  loadWorkouts,
  loadMore,
} = useCreatedWorkouts()

const authStore = useAuthStore()
const viewMode = ref('grid')

function onScrollArea(event) {
  if (!event?.target) return
  const scrollTop = event.target.scrollTop
  const scrollHeight = event.target.scrollHeight
  const clientHeight = event.target.clientHeight

  // Déclencher loadMore si proche du bas
  if (scrollHeight - scrollTop - clientHeight < 200 && hasMore.value && !loadingMore.value) {
    loadMore(authStore.user?.uid)
  }
}

function forceRefresh() {
  if (authStore.user?.uid) {
    loadWorkouts(authStore.user.uid)
  }
}

// Charger au montage
watch(
  () => authStore.user?.uid,
  (uid) => {
    if (uid) {
      loadWorkouts(uid)
    }
  },
  { immediate: true }
)
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
.vt-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.refresh-btn:active { animation: spin 0.6s ease-in-out; }

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

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

.load-more {
  text-align: center; padding: 20px; color: var(--text-3); font-size: 0.8rem;
}
.load-more.hint {
  color: var(--text-2); font-style: italic;
}
</style>
