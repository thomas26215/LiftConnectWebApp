<template>
  <div class="view-wrapper">
    <PageHeader title="Mon profil" :subtitle="subtitle">
      <template #actions>
        <button class="btn-logout" type="button" @click="handleLogout">Se déconnecter</button>
      </template>
    </PageHeader>

    <ScrollArea>
      <div v-if="loading" class="state-card">Chargement du profil…</div>

      <div v-else-if="error" class="state-card error">
        Impossible de charger le profil.
      </div>

      <div v-else class="profile-grid">
        <section class="card profile-main">
          <div class="profile-head">
            <div class="avatar">
              <img v-if="profilePhoto" :src="profilePhoto" alt="Photo de profil" />
              <span v-else>{{ initials }}</span>
            </div>
            <div class="identity">
              <h2 class="name">{{ displayName }}</h2>
              <p class="handle">{{ email }}</p>
              <p class="meta">Membre depuis {{ profile?.memberSince || '—' }}</p>
            </div>
            <div class="head-actions">
              <button v-if="!isEditing" class="btn-secondary" type="button" @click="startEditing">Modifier</button>
              <template v-else>
                <button class="btn-secondary" type="button" @click="cancelEditing">Annuler</button>
                <button class="btn-primary" type="button" :disabled="saving" @click="saveProfile">
                  {{ saving ? 'Enregistrement…' : 'Enregistrer' }}
                </button>
              </template>
            </div>
          </div>

          <div class="details-grid">
            <div class="detail-item">
              <span class="label">Niveau</span>
              <input v-if="isEditing" v-model="form.level" class="input" type="text" />
              <span v-else class="value">{{ profile?.level || profile?.experience_level || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Objectif</span>
              <input v-if="isEditing" v-model="form.objective" class="input" type="text" />
              <span v-else class="value">{{ profile?.objective || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Salle</span>
              <input v-if="isEditing" v-model="form.gymName" class="input" type="text" />
              <span v-else class="value">{{ profile?.gymName || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Localisation</span>
              <input v-if="isEditing" v-model="form.location" class="input" type="text" />
              <span v-else class="value">{{ profile?.location || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Taille</span>
              <input v-if="isEditing" v-model.number="form.height_cm" class="input" type="number" min="0" />
              <span v-else class="value">{{ profile?.height_cm ? `${profile.height_cm} cm` : '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Poids</span>
              <input v-if="isEditing" v-model.number="form.weight_kg" class="input" type="number" min="0" />
              <span v-else class="value">{{ profile?.weight_kg ? `${profile.weight_kg} kg` : '—' }}</span>
            </div>
          </div>
        </section>

        <div class="right-col">
          <section class="card stats-card">
            <h3 class="section-title">Statistiques</h3>
            <div class="stat-row">
              <span>Temps total</span>
              <strong>{{ profile?.totalTrainingFormatted || '—' }}</strong>
            </div>
            <div class="stat-row">
              <span>Séances totales</span>
              <strong>{{ profile?.totalSessions ?? '—' }}</strong>
            </div>
            <div class="stat-row">
              <span>Streak</span>
              <strong>{{ profile?.streakDays ?? 0 }} jours</strong>
            </div>
            <div class="stat-row">
              <span>Profil fitness</span>
              <strong>{{ profile?.fitness_profile_complete ? 'Complété' : 'Incomplet' }}</strong>
            </div>
          </section>

          <section class="card">
            <h3 class="section-title">Confidentialité</h3>
            <div class="privacy-row">
              <span>Profil public</span>
              <button class="toggle-btn" type="button" :disabled="visibilityLoading" @click="togglePublicVisibility">
                {{ profile?.public ? 'Activé' : 'Désactivé' }}
              </button>
            </div>
          </section>

          <section class="card">
            <h3 class="section-title">Derniers entraînements</h3>
            <div v-if="workoutsLoading" class="mini-state">Chargement…</div>
            <div v-else-if="!lastWorkouts.length" class="mini-state">Aucun entraînement récent.</div>
            <div v-else class="workouts-list">
              <div v-for="workout in lastWorkouts" :key="workout.id" class="workout-row">
                <span class="workout-name">{{ workout.name || workout.title || 'Entraînement' }}</span>
                <span class="workout-date">{{ workout.dateFormatted || '—' }}</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </ScrollArea>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { collection, doc, limit, onSnapshot, orderBy, query } from 'firebase/firestore'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUsers } from '@/composables/useUsers'
import PageHeader from '@/components/layout/PageHeader.vue'
import ScrollArea from '@/components/layout/ScrollArea.vue'
import { db } from '@/firebase'

const router = useRouter()
const authStore = useAuthStore()
const {
  currentUser,
  loading,
  error,
  fetchUser,
  updateUser,
  setPublicVisibility,
  fetchLastWorkouts,
} = useUsers()

const isEditing = ref(false)
const saving = ref(false)
const visibilityLoading = ref(false)
const workoutsLoading = ref(false)
const lastWorkouts = ref([])
const form = ref({
  level: '',
  objective: '',
  gymName: '',
  location: '',
  height_cm: null,
  weight_kg: null,
})

const today = new Date()
const subtitle = today.toLocaleDateString('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const profile = computed(() => currentUser.value)
const email = computed(() => profile.value?.email || authStore.user?.email || '—')
const displayName = computed(() => {
  const fullName = `${profile.value?.first_name || ''} ${profile.value?.last_name || ''}`.trim()
  if (fullName) return fullName
  return authStore.displayName
})

const profilePhoto = computed(() => profile.value?.photoURL || authStore.user?.photoURL || null)

const initials = computed(() => {
  if (!displayName.value) return 'A'
  return displayName.value
    .split(' ')
    .filter(Boolean)
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

function syncFormFromProfile() {
  form.value = {
    level: profile.value?.level || profile.value?.experience_level || '',
    objective: profile.value?.objective || '',
    gymName: profile.value?.gymName || '',
    location: profile.value?.location || '',
    height_cm: profile.value?.height_cm ?? null,
    weight_kg: profile.value?.weight_kg ?? null,
  }
}

function startEditing() {
  syncFormFromProfile()
  isEditing.value = true
}

function cancelEditing() {
  isEditing.value = false
  syncFormFromProfile()
}

async function saveProfile() {
  const uid = authStore.user?.uid
  if (!uid) return

  saving.value = true
  try {
    const level = form.value.level?.trim() || null
    await updateUser(uid, {
      level,
      experience_level: level,
      objective: form.value.objective?.trim() || null,
      gymName: form.value.gymName?.trim() || null,
      location: form.value.location?.trim() || null,
      height_cm: form.value.height_cm ?? null,
      weight_kg: form.value.weight_kg ?? null,
    })
    await fetchUser(uid)
    isEditing.value = false
  } finally {
    saving.value = false
  }
}

async function togglePublicVisibility() {
  const uid = authStore.user?.uid
  if (!uid || !profile.value) return

  visibilityLoading.value = true
  try {
    await setPublicVisibility(uid, !profile.value.public)
    await fetchUser(uid)
  } finally {
    visibilityLoading.value = false
  }
}

async function loadLastWorkouts(uid) {
  workoutsLoading.value = true
  try {
    lastWorkouts.value = await fetchLastWorkouts(uid, 5)
  } finally {
    workoutsLoading.value = false
  }
}

watch(
  () => authStore.user?.uid,
  async (uid, _oldUid, onCleanup) => {
    if (!uid) {
      lastWorkouts.value = []
      return
    }

    await fetchUser(uid)
    syncFormFromProfile()
    await loadLastWorkouts(uid)

    let userInitialized = false
    const unsubscribeUser = onSnapshot(doc(db, 'users', uid), async () => {
      if (!userInitialized) {
        userInitialized = true
        return
      }
      await fetchUser(uid)
    })

    let workoutsInitialized = false
    const unsubscribeWorkouts = onSnapshot(
      query(collection(db, 'users', uid, 'last_workouts'), orderBy('date', 'desc'), limit(1)),
      async () => {
        if (!workoutsInitialized) {
          workoutsInitialized = true
          return
        }
        await loadLastWorkouts(uid)
      }
    )

    onCleanup(() => {
      unsubscribeUser?.()
      unsubscribeWorkouts?.()
    })
  },
  { immediate: true }
)

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.view-wrapper {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.btn-logout {
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-2);
  padding: 8px 12px;
  border-radius: var(--r-sm);
  font-size: 0.78rem;
  cursor: pointer;
  transition: all var(--transition);
}

.btn-logout:hover {
  color: #fca5a5;
  border-color: rgba(252, 165, 165, 0.5);
  background: rgba(252, 165, 165, 0.08);
}

.profile-grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 20px;
}

.right-col {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.card,
.state-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r);
  padding: 20px;
  backdrop-filter: blur(12px);
}

.state-card {
  color: var(--text-2);
  font-size: 0.9rem;
}

.state-card.error {
  color: #fca5a5;
  border-color: rgba(252, 165, 165, 0.4);
}

.profile-main {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.profile-head {
  display: flex;
  align-items: center;
  gap: 14px;
}

.head-actions {
  margin-left: auto;
  display: flex;
  gap: 8px;
}

.btn-secondary,
.btn-primary {
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  padding: 8px 10px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all var(--transition);
}

.btn-secondary {
  background: var(--surface);
  color: var(--text-2);
}

.btn-secondary:hover {
  color: var(--text-1);
  border-color: var(--border-mid);
}

.btn-primary {
  background: var(--secondary);
  color: #071422;
  border-color: transparent;
  font-weight: 700;
}

.btn-primary:hover {
  background: #cef7e8;
}

.btn-primary:disabled,
.toggle-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  border: 1.5px solid var(--border-mid);
  background: rgba(255,255,255,0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--secondary);
  font-size: 1.2rem;
  font-weight: 700;
  overflow: hidden;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.name {
  margin: 0;
  font-size: 1.3rem;
  color: var(--text-1);
}

.handle,
.meta {
  margin: 2px 0 0;
  color: var(--text-3);
  font-size: 0.8rem;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.detail-item {
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.label {
  color: var(--text-3);
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.value {
  color: var(--text-1);
  font-size: 0.86rem;
  font-weight: 600;
}

.input {
  border: 1px solid var(--border);
  background: rgba(255,255,255,0.04);
  color: var(--text-1);
  border-radius: 8px;
  padding: 8px;
  font-size: 0.82rem;
  outline: none;
}

.input:focus {
  border-color: var(--border-mid);
}

.section-title {
  margin: 0 0 12px;
  color: var(--text-1);
  font-size: 0.95rem;
}

.stats-card {
  align-self: stretch;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
  color: var(--text-2);
  font-size: 0.8rem;
}

.stat-row strong {
  color: var(--text-1);
  font-size: 0.85rem;
}

.stat-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.privacy-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--text-2);
  font-size: 0.82rem;
}

.toggle-btn {
  border: 1px solid var(--border-mid);
  background: rgba(186,242,216,0.1);
  color: var(--secondary);
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 0.74rem;
  font-weight: 700;
  cursor: pointer;
}

.mini-state {
  color: var(--text-3);
  font-size: 0.78rem;
}

.workouts-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.workout-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  border-bottom: 1px solid var(--border);
  padding-bottom: 8px;
}

.workout-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.workout-name {
  color: var(--text-1);
  font-size: 0.78rem;
  font-weight: 600;
}

.workout-date {
  color: var(--text-3);
  font-size: 0.74rem;
}

@media (max-width: 1080px) {
  .profile-grid {
    grid-template-columns: 1fr;
  }

  .profile-head {
    flex-wrap: wrap;
  }

  .head-actions {
    margin-left: 0;
    width: 100%;
  }
}
</style>
