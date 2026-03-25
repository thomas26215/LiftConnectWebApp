<template>
  <div class="view-wrapper">
    <PageHeader title="Groupes" subtitle="Tes groupes et communautés">
      <template #actions>
        <button class="btn-primary" @click="showCreateModal = true">+ Créer un groupe</button>
      </template>
    </PageHeader>

    <!-- Error/Success Toast -->
    <div v-if="errorMessage" class="toast">
      {{ errorMessage }}
    </div>

    <ScrollArea>
      <!-- My groups -->
      <SectionHeader title="Mes groupes" />
      <div v-if="isLoadingMyGroups" class="groups-grid" style="margin-bottom: 32px">
        <SkeletonLoader type="card" v-for="i in 2" :key="`skeleton-my-${i}`" />
      </div>
      <div v-else-if="hasMyGroups" class="groups-grid" style="margin-bottom: 32px">
        <div
          v-for="(group, i) in myGroups"
          :key="group.id"
          class="group-card group-card-modern animate-in"
          :class="`delay-${i + 1}`"
          @click="openGroupDetail(group)"
        >
          <div class="group-header">
            <div class="group-icon" :style="`background:${getGroupColor(group.sport).bg};border-color:${getGroupColor(group.sport).border}`">
              {{ getGroupEmoji(group.sport) }}
            </div>
            <div class="group-title-group">
              <div class="group-name">{{ group.name }}</div>
              <span class="group-tag" :style="`color:${getGroupColor(group.sport).color};background:${getGroupColor(group.sport).bg};border-color:${getGroupColor(group.sport).border}`">
                {{ group.sport }}
              </span>
            </div>
          </div>
          <div class="group-desc">{{ group.description }}</div>
          <div class="group-footer">
            <div class="group-members">
              <span>{{ group.membersCount || 0 }} 👥</span>
            </div>
            <button class="btn-ghost" @click.stop="openGroupDetail(group)">Voir →</button>
          </div>
        </div>
      </div>
      <div v-else class="empty-state animate-scale">
        <div class="empty-icon">📭</div>
        <div class="empty-text">Aucun groupe pour le moment</div>
        <div class="empty-sub">Découvre des groupes et rejoins une communauté</div>
      </div>

      <!-- Discover -->
      <SectionHeader title="Découvrir des groupes" />
      <div v-if="isLoadingDiscoverable" class="groups-grid" style="margin-bottom: 32px">
        <SkeletonLoader type="card" v-for="i in 3" :key="`skeleton-discover-${i}`" />
      </div>
      <div v-else-if="hasDiscoverableGroups" class="groups-grid" style="margin-bottom: 32px">
        <div
          v-for="(group, i) in discoverableGroupsNotJoined"
          :key="`discover-${group.id}`"
          class="group-card group-card-modern animate-in discover-card"
          :class="`delay-${i + 1}`"
          @click="openGroupDetail(group)"
        >
          <div class="group-header">
            <div class="group-icon" :style="`background:${getGroupColor(group.sport).bg};border-color:${getGroupColor(group.sport).border}`">
              {{ getGroupEmoji(group.sport) }}
            </div>
            <div class="group-title-group">
              <div class="group-name">{{ group.name }}</div>
              <span class="group-tag" :style="`color:${getGroupColor(group.sport).color};background:${getGroupColor(group.sport).bg};border-color:${getGroupColor(group.sport).border}`">
                {{ group.sport }}
              </span>
            </div>
          </div>
          <div class="group-desc">{{ group.description }}</div>
          <div class="group-footer">
            <div class="group-members">
              <span>{{ group.membersCount || 0 }} 👥</span>
            </div>
            <button 
              class="btn-ghost" 
              @click.stop="handleJoinGroup(group.id)"
              :disabled="isJoiningGroup"
            >
              {{ isJoiningGroup ? '⏳' : 'Rejoindre' }}
            </button>
          </div>
        </div>
      </div>
      <div v-else class="empty-state animate-scale">
        <div class="empty-icon">🔍</div>
        <div class="empty-text">Aucun groupe disponible</div>
        <div class="empty-sub">Sois le premier à créer un groupe !</div>
      </div>

      <!-- Create Group Modal -->
      <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
        <div class="modal-content">
          <div class="modal-header">
            <div class="modal-title">Créer un groupe</div>
            <button class="modal-close" @click="showCreateModal = false">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Nom du groupe</label>
              <input 
                v-model="newGroupForm.name" 
                type="text" 
                placeholder="ex: Squad de Musculation"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label>Sport</label>
              <select v-model="newGroupForm.sport" class="form-input">
                <option value="">Sélectionne un sport</option>
                <option value="Musculation">Musculation</option>
                <option value="Crossfit">Crossfit</option>
                <option value="Yoga">Yoga</option>
                <option value="Running">Running</option>
                <option value="Natation">Natation</option>
                <option value="Boxe">Boxe</option>
                <option value="Cyclisme">Cyclisme</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea 
                v-model="newGroupForm.description" 
                placeholder="Décris ton groupe..."
                class="form-input"
                rows="3"
              ></textarea>
            </div>
            <div class="form-group">
              <label>
                <input 
                  v-model="newGroupForm.isPublic" 
                  type="checkbox"
                  class="form-checkbox"
                />
                <span>Public (visible pour tous)</span>
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="showCreateModal = false">Annuler</button>
            <button 
              class="btn-primary" 
              @click="handleCreateGroup"
              :disabled="isCreatingGroup || !newGroupForm.name || !newGroupForm.sport"
            >
              {{ isCreatingGroup ? 'Création...' : 'Créer' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Group Detail Modal -->
      <div v-if="showGroupDetailModal && selectedGroup" class="modal-overlay" @click.self="closeGroupDetail">
        <div class="modal-content">
          <div class="modal-header">
            <div class="modal-title">Détail du groupe</div>
            <button class="modal-close" @click="closeGroupDetail">✕</button>
          </div>
          <div class="modal-body">
            <div class="group-detail-head">
              <div class="group-icon" :style="`background:${getGroupColor(selectedGroup.sport).bg};border-color:${getGroupColor(selectedGroup.sport).border}`">
                {{ getGroupEmoji(selectedGroup.sport) }}
              </div>
              <div>
                <div class="group-name">{{ selectedGroup.name }}</div>
                <span class="group-tag" :style="`color:${getGroupColor(selectedGroup.sport).color};background:${getGroupColor(selectedGroup.sport).bg};border-color:${getGroupColor(selectedGroup.sport).border}`">
                  {{ selectedGroup.sport }}
                </span>
              </div>
            </div>

            <div class="group-detail-grid">
              <div class="group-detail-item">
                <span class="group-detail-label">Membres</span>
                <span class="group-detail-value">{{ selectedGroup.membersCount || 0 }}</span>
              </div>
              <div class="group-detail-item">
                <span class="group-detail-label">Visibilité</span>
                <span class="group-detail-value">{{ selectedGroup.isPrivate ? 'Privé' : 'Public' }}</span>
              </div>
            </div>

            <div class="group-detail-description">
              {{ selectedGroup.description || 'Aucune description' }}
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="closeGroupDetail">Fermer</button>
          </div>
        </div>
      </div>
    </ScrollArea>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import PageHeader   from '@/components/layout/PageHeader.vue'
import ScrollArea   from '@/components/layout/ScrollArea.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import { useGroups } from '@/composables/useGroups'
import { getAuth } from 'firebase/auth'

const {
  myGroups,
  discoverableGroups,
  isLoadingMyGroups,
  isLoadingDiscoverable,
  isJoiningGroup,
  isCreatingGroup,
  error,
  loadMyGroups,
  loadDiscoverableGroupsWithMembership,
  watchDiscoverableGroups,
  join,
  createNewGroup,
  cleanup,
} = useGroups()

const showCreateModal = ref(false)
const showGroupDetailModal = ref(false)
const selectedGroup = ref(null)
const newGroupForm = ref({
  name: '',
  sport: '',
  description: '',
  isPublic: true,
})
const errorMessage = ref(null)

const hasMyGroups = computed(() => myGroups.value?.length > 0)
const hasDiscoverableGroups = computed(() => discoverableGroups.value?.length > 0)

// Filter out groups user already joined
const discoverableGroupsNotJoined = computed(() => {
  if (!discoverableGroups.value) return []
  const myGroupIds = new Set(myGroups.value?.map(g => g.id) || [])
  return discoverableGroups.value.filter(g => !myGroupIds.has(g.id))
})

// Watch for errors from composable
watch(() => error.value, (newError) => {
  if (newError) {
    errorMessage.value = newError
    setTimeout(() => {
      errorMessage.value = null
    }, 4000)
  }
})

// Sport emoji mapping
const sportEmojis = {
  'Musculation': '💪',
  'Crossfit': '🏋️',
  'Yoga': '🧘',
  'Running': '🏃',
  'Natation': '🏊',
  'Boxe': '🥊',
  'Cyclisme': '🚴',
  'Autre': '⚡',
}

// Sport color mapping
const sportColors = {
  'Musculation': { color: '#ff6b6b', bg: 'rgba(255, 107, 107, 0.1)', border: 'rgba(255, 107, 107, 0.3)' },
  'Crossfit': { color: '#ffa94d', bg: 'rgba(255, 169, 77, 0.1)', border: 'rgba(255, 169, 77, 0.3)' },
  'Yoga': { color: '#74c0fc', bg: 'rgba(116, 192, 252, 0.1)', border: 'rgba(116, 192, 252, 0.3)' },
  'Running': { color: '#51cf66', bg: 'rgba(81, 207, 102, 0.1)', border: 'rgba(81, 207, 102, 0.3)' },
  'Natation': { color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.1)', border: 'rgba(167, 139, 250, 0.3)' },
  'Boxe': { color: '#ff922b', bg: 'rgba(255, 146, 43, 0.1)', border: 'rgba(255, 146, 43, 0.3)' },
  'Cyclisme': { color: '#20c997', bg: 'rgba(32, 201, 151, 0.1)', border: 'rgba(32, 201, 151, 0.3)' },
  'Autre': { color: '#baf2d8', bg: 'rgba(186, 242, 216, 0.1)', border: 'rgba(186, 242, 216, 0.3)' },
}

function getGroupEmoji(sport) {
  return sportEmojis[sport] || '⚡'
}

function getGroupColor(sport) {
  return sportColors[sport] || sportColors['Autre']
}

async function handleCreateGroup() {
  if (!newGroupForm.value.name || !newGroupForm.value.sport) return
  
  const user = getAuth().currentUser
  if (!user) {
    errorMessage.value = 'Vous devez être connecté pour créer un groupe'
    return
  }

  const groupData = {
    name: newGroupForm.value.name,
    sport: newGroupForm.value.sport,
    description: newGroupForm.value.description,
    isPublic: newGroupForm.value.isPublic,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const success = await createNewGroup(groupData)
  
  if (success) {
    // Reset form et fermer modal
    newGroupForm.value = {
      name: '',
      sport: '',
      description: '',
      isPublic: true,
    }
    showCreateModal.value = false
    errorMessage.value = 'Groupe créé avec succès !'
    setTimeout(() => {
      errorMessage.value = null
    }, 2000)
  } else {
    errorMessage.value = error.value || 'Erreur lors de la création du groupe'
  }
}

async function handleJoinGroup(groupId) {
  const success = await join(groupId)
  if (success) {
    // Recharger les groupes
    await loadMyGroups(10)
    await loadDiscoverableGroupsWithMembership({ limit: 10 })
  } else {
    errorMessage.value = error.value || 'Erreur lors de la connexion au groupe'
  }
}

function openGroupDetail(group) {
  selectedGroup.value = group
  showGroupDetailModal.value = true
}

function closeGroupDetail() {
  showGroupDetailModal.value = false
  selectedGroup.value = null
}

onMounted(async () => {
  // Charger les groupes personnels et découvertes
  await loadMyGroups(10)
  await loadDiscoverableGroupsWithMembership({ limit: 10 })
  
  // Écouter les mises à jour en temps réel
  watchDiscoverableGroups(10)
})

onBeforeUnmount(() => {
  cleanup()
})
</script>

<style scoped>
.view-wrapper { display: flex; flex-direction: column; height: 100vh; overflow: hidden; }

.groups-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

/* Modern Group Card */
.group-card {
  background: var(--surface); 
  border: 1px solid var(--border); 
  border-radius: var(--r);
  padding: 20px; 
  backdrop-filter: blur(12px);
  transition: all var(--spring);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.group-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(186, 242, 216, 0.1),
    transparent
  );
  transition: left 0.5s;
}

.group-card:hover::before {
  left: 100%;
}

.group-card-modern:hover {
  border-color: var(--secondary);
  background: var(--surface-hover);
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(186, 242, 216, 0.15), 0 0 0 1px rgba(186, 242, 216, 0.2);
}

.group-card-modern:active {
  transform: translateY(-2px);
}

.group-header { 
  display: flex; 
  align-items: flex-start; 
  gap: 12px; 
  margin-bottom: 12px; 
}

.group-title-group {
  flex: 1;
}

.group-icon {
  width: 46px; 
  height: 46px; 
  border-radius: 13px; 
  flex-shrink: 0;
  display: flex; 
  align-items: center; 
  justify-content: center;
  font-size: 1.3rem; 
  border: 1px solid;
  transition: all var(--spring);
}

.group-card:hover .group-icon {
  transform: scale(1.08) rotate(5deg);
}

.group-name { 
  font-size: 0.9rem; 
  font-weight: 700; 
  color: var(--text-1); 
  margin-bottom: 4px;
  transition: color var(--transition);
}

.group-card:hover .group-name {
  color: var(--secondary);
}

.group-tag {
  font-size: 0.6rem; 
  font-weight: 700; 
  text-transform: uppercase; 
  letter-spacing: 0.08em;
  padding: 3px 8px; 
  border-radius: 6px;
  border: 1px solid;
  display: inline-block;
  transition: all var(--transition);
}

.group-card:hover .group-tag {
  transform: scale(1.05);
}

.group-desc { 
  font-size: 0.75rem; 
  color: var(--text-2); 
  line-height: 1.55; 
  margin-bottom: 14px;
  transition: color var(--transition);
}

.group-card:hover .group-desc {
  color: var(--text-1);
}

.group-footer {
  display: flex; 
  align-items: center; 
  justify-content: space-between;
  padding-top: 12px; 
  border-top: 1px solid var(--border);
  transition: border-color var(--transition);
}

.group-card:hover .group-footer {
  border-color: var(--border-mid);
}

.group-members { 
  display: flex; 
  align-items: center; 
  gap: 8px; 
  font-size: 0.7rem; 
  color: var(--text-3);
  transition: color var(--transition);
}

.group-card:hover .group-members {
  color: var(--text-2);
}

.member-stack { display: flex; }
.member-dot {
  width: 22px; 
  height: 22px; 
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(34,59,101,0.9), rgba(9,31,68,0.9));
  border: 1.5px solid rgba(186,242,216,0.15);
  margin-left: -6px; display: flex; align-items: center; justify-content: center;
  font-size: 0.5rem; font-weight: 700; color: var(--secondary);
}
.member-dot:first-child { margin-left: 0; }

.discover-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.group-find-card {
  background: rgba(186,242,216,0.04); border: 1px dashed rgba(186,242,216,0.15);
  border-radius: var(--r); padding: 32px 20px;
  display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center;
  cursor: pointer; transition: all var(--transition);
}
.group-find-card:hover { background: rgba(186,242,216,0.08); border-color: rgba(186,242,216,0.3); }
.find-icon { font-size: 2rem; opacity: 0.4; }
.find-title { font-size: 0.88rem; font-weight: 600; color: var(--text-2); }
.find-sub { font-size: 0.75rem; color: var(--text-3); max-width: 220px; line-height: 1.5; }

/* States */
.loading-state {
  text-align: center; padding: 40px 20px; color: var(--text-3); font-size: 0.9rem;
}
.empty-state {
  text-align: center; padding: 60px 20px; 
  background: rgba(186,242,216,0.02); border-radius: var(--r);
  border: 1px dashed rgba(186,242,216,0.15);
}
.empty-icon { font-size: 3rem; margin-bottom: 16px; }
.empty-text { font-size: 0.95rem; font-weight: 600; color: var(--text-2); margin-bottom: 8px; }
.empty-sub { font-size: 0.8rem; color: var(--text-3); }

.discover-card { opacity: 0.8; }

/* Toast */
.toast {
  position: fixed; top: 20px; right: 20px; z-index: 2000;
  background: var(--surface); border: 1px solid var(--border); border-radius: 8px;
  padding: 12px 16px; font-size: 0.9rem; color: var(--text-1);
  box-shadow: 0 10px 28px rgba(0,0,0,0.3); animation: slideInRight 0.3s ease-out;
}
@keyframes slideInRight {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

/* Modal */
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
}
.modal-content {
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--r);
  width: 90%; max-width: 500px; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease-out;
}
@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px; border-bottom: 1px solid var(--border);
}
.modal-title { font-size: 1.1rem; font-weight: 700; color: var(--text-1); }
.modal-close {
  background: none; border: none; font-size: 1.3rem; color: var(--text-3);
  cursor: pointer; padding: 0; transition: color var(--transition);
}
.modal-close:hover { color: var(--text-1); }
.modal-body { padding: 24px; }
.modal-footer {
  display: flex; gap: 12px; justify-content: flex-end;
  padding: 20px; border-top: 1px solid var(--border);
}

/* Form */
.form-group { margin-bottom: 18px; }
.form-group label { display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-2); margin-bottom: 6px; }
.form-input {
  width: 100%; padding: 10px 12px; font-size: 0.9rem;
  background: var(--bg); border: 1px solid var(--border); border-radius: 8px;
  color: var(--text-1); transition: all var(--transition);
}
.form-input:focus {
  outline: none; border-color: var(--secondary); box-shadow: 0 0 0 3px rgba(186, 242, 216, 0.1);
}
.form-input::placeholder { color: var(--text-3); }

.form-checkbox {
  width: 18px; height: 18px; cursor: pointer; margin-right: 8px;
  vertical-align: middle;
}
.form-group label { display: flex; align-items: center; cursor: pointer; margin-bottom: 0; }

.group-detail-head {
  display: flex; align-items: center; gap: 12px; margin-bottom: 16px;
}

.group-detail-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;
}

.group-detail-item {
  display: flex; flex-direction: column; gap: 4px;
  background: var(--bg); border: 1px solid var(--border); border-radius: 8px;
  padding: 10px 12px;
}

.group-detail-label {
  font-size: 0.72rem; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.04em;
}

.group-detail-value {
  font-size: 0.9rem; color: var(--text-1); font-weight: 600;
}

.group-detail-description {
  color: var(--text-2); line-height: 1.5; font-size: 0.86rem;
}
</style>
