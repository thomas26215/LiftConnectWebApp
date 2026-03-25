<template>
  <div class="view-wrapper">
    <PageHeader title="Tableau de bord" :subtitle="subtitle">
      <template #actions>
        <RouterLink to="/entrainements" class="btn-primary">+ Nouvel entraînement</RouterLink>
      </template>
    </PageHeader>

    <ScrollArea>
      <!-- Stats strip -->
      <div class="stats-strip animate-in">
        <div
          v-for="(s, i) in dashboardStats"
          :key="s.label"
          class="stat-card animate-in"
          :class="`delay-${i}`"
          :style="`--c:${s.color}`"
        >
          <div class="stat-top">
            <span class="stat-label-sm">{{ s.label }}</span>
            <div class="stat-icon">{{ s.icon }}</div>
          </div>
          <div class="stat-val">{{ s.value }}</div>
          <div class="stat-sub">{{ s.sub }}</div>
        </div>
      </div>

      <!-- Week strip -->
      <div class="week-card animate-in delay-2">
        <div class="week-title">7 derniers jours</div>
        <div class="week-days">
          <div
            v-for="day in weekDays"
            :key="day.name"
            class="day-cell"
            :class="{ 'has-workout': day.hasWorkout, today: day.today }"
          >
            <div class="day-dot">{{ day.hasWorkout ? '✓' : day.today ? '○' : '' }}</div>
            <div class="day-name">{{ day.name }}</div>
            <div class="day-date">{{ day.date }}</div>
          </div>
        </div>
      </div>

      <!-- 2-col grid -->
      <div class="content-grid">
        <!-- Left: recent workouts -->
        <div>
          <SectionHeader title="Entraînements récents">
            <template #action>
              <RouterLink to="/entrainements" class="section-link">Voir tout</RouterLink>
            </template>
          </SectionHeader>
          <div class="workouts-list">
            <WorkoutCard
              v-for="(w, i) in recentWorkouts"
              :key="w.id"
              :workout="w"
              class="animate-in"
              :class="`delay-${i + 1}`"
              @like="workoutsStore.toggleLike"
            />
          </div>
        </div>

        <!-- Right col -->
        <div class="right-col">
          <!-- Next workout -->
          <div class="animate-in delay-2">
            <SectionHeader title="Prochain entraînement" />
            <div class="next-card">
              <div class="next-empty">
                <div class="next-icon">🗓</div>
                <div class="next-label">Aucun entraînement prévu</div>
                <button class="btn-plan">Planifier</button>
              </div>
            </div>
          </div>

          <!-- Quick actions -->
          <div class="animate-in delay-3">
            <SectionHeader title="Actions rapides" />
            <div class="quick-grid">
              <RouterLink
                v-for="qa in quickActions"
                :key="qa.title"
                to="/entrainements"
                class="quick-item"
                :class="{ primary: qa.primary }"
              >
                <div class="qi-icon">{{ qa.icon }}</div>
                <div class="qi-title">{{ qa.title }}</div>
                <div class="qi-sub">{{ qa.sub }}</div>
              </RouterLink>
            </div>
          </div>

          <!-- Mini stats -->
          <div class="stats-mini animate-in delay-4">
            <SectionHeader title="Statistiques" />
            <div
              v-for="s in miniStats"
              :key="s.label"
              class="stat-row-mini"
            >
              <span class="sr-label">{{ s.label }}</span>
              <span class="sr-val" :style="s.highlight ? 'color:var(--secondary)' : ''">{{ s.value }}</span>
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { collection, limit, onSnapshot, query } from 'firebase/firestore'
import PageHeader   from '@/components/layout/PageHeader.vue'
import ScrollArea   from '@/components/layout/ScrollArea.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import WorkoutCard  from '@/components/ui/WorkoutCard.vue'
import { useWorkoutsStore } from '@/stores/workouts'
import { useAuthStore } from '@/stores/auth'
import { db } from '@/firebase'
import { quickActions, typeLabels } from '@/data'

const workoutsStore = useWorkoutsStore()
const authStore = useAuthStore()

const subtitle = computed(() => new Date().toLocaleDateString('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}))

function toDate(value) {
  if (!value) return null
  if (value instanceof Date) return value
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function formatHours(minutes) {
  const total = Math.max(0, Number(minutes || 0))
  if (!total) return '0h'
  const hours = Math.floor(total / 60)
  const rest = total % 60
  if (!hours) return `${rest} min`
  return rest ? `${hours}h${rest}` : `${hours}h`
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function keyOfDay(date) {
  const d = startOfDay(date)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function startOfWeekMonday(date) {
  const d = startOfDay(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

const workoutsSorted = computed(() => {
  return [...workoutsStore.workouts].sort((a, b) => {
    const bt = toDate(b.createdAt)?.getTime?.() || 0
    const at = toDate(a.createdAt)?.getTime?.() || 0
    return bt - at
  })
})

const recentWorkouts = computed(() => workoutsSorted.value.slice(0, 4))

const workoutDates = computed(() =>
  workoutsSorted.value
    .map(workout => toDate(workout.createdAt))
    .filter(Boolean)
)

const thisWeekWorkouts = computed(() => {
  const start = startOfWeekMonday(new Date()).getTime()
  return workoutsSorted.value.filter(workout => {
    const time = toDate(workout.createdAt)?.getTime?.()
    return time && time >= start
  })
})

const totalMinutes = computed(() => workoutsSorted.value.reduce((sum, workout) => sum + Number(workout.duration || 0), 0))
const weekMinutes = computed(() => thisWeekWorkouts.value.reduce((sum, workout) => sum + Number(workout.duration || 0), 0))
const totalExercises = computed(() => workoutsSorted.value.reduce((sum, workout) => sum + Number(workout.exercises || 0), 0))

const streakDays = computed(() => {
  const keys = new Set(workoutDates.value.map(keyOfDay))
  if (!keys.size) return 0

  let streak = 0
  let cursor = startOfDay(new Date())
  while (keys.has(keyOfDay(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
})

const dashboardStats = computed(() => [
  { value: `${workoutsSorted.value.length}`, label: 'Total entraînements', sub: 'au total', icon: '📈', color: '#baf2d8' },
  { value: `${thisWeekWorkouts.value.length}`, label: 'Cette semaine', sub: `${weekMinutes.value} minutes`, icon: '🗓', color: '#60a5fa' },
  { value: formatHours(totalMinutes.value), label: 'Temps total', sub: `${totalMinutes.value} minutes`, icon: '⏱', color: '#f97316' },
  { value: `${totalExercises.value}`, label: 'Exercices', sub: 'réalisés', icon: '🏋️', color: '#a78bfa' },
  { value: `${streakDays.value}`, label: 'Série', sub: 'jours consécutifs', icon: '🔥', color: '#fbbf24' },
])

const weekDays = computed(() => {
  const today = startOfDay(new Date())
  const start = new Date(today)
  start.setDate(today.getDate() - 6)

  const daysWithWorkout = new Set(workoutDates.value.map(keyOfDay))

  return Array.from({ length: 7 }, (_, index) => {
    const current = new Date(start)
    current.setDate(start.getDate() + index)

    return {
      name: current.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', ''),
      date: current.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
      hasWorkout: daysWithWorkout.has(keyOfDay(current)),
      today: keyOfDay(current) === keyOfDay(today),
    }
  })
})

const monthlyCount = computed(() => {
  const now = new Date()
  return workoutsSorted.value.filter(workout => {
    const date = toDate(workout.createdAt)
    return date && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
  }).length
})

const favoriteType = computed(() => {
  const counts = new Map()

  workoutsSorted.value.forEach(workout => {
    const type = String(workout.type || '').trim() || 'full'
    counts.set(type, (counts.get(type) || 0) + 1)
  })

  let selected = 'full'
  let max = 0
  counts.forEach((count, type) => {
    if (count > max) {
      max = count
      selected = type
    }
  })

  return typeLabels[selected] || '—'
})

const bestWeekCount = computed(() => {
  const weeklyCounts = new Map()

  workoutDates.value.forEach(date => {
    const start = startOfWeekMonday(date)
    const key = `${start.getFullYear()}-${start.getMonth()}-${start.getDate()}`
    weeklyCounts.set(key, (weeklyCounts.get(key) || 0) + 1)
  })

  return Math.max(...weeklyCounts.values(), 0)
})

const averageDuration = computed(() => {
  if (!workoutsSorted.value.length) return 0
  return Math.round(totalMinutes.value / workoutsSorted.value.length)
})

const miniStats = computed(() => [
  { label: 'Durée moyenne', value: `${averageDuration.value} min` },
  { label: 'Ce mois-ci', value: `${monthlyCount.value} séances` },
  { label: 'Type favori', value: favoriteType.value, highlight: true },
  { label: 'Meilleure semaine', value: `${bestWeekCount.value} séances` },
])

watch(
  () => authStore.user?.uid,
  (uid, _oldUid, onCleanup) => {
    workoutsStore.loadWorkouts(uid)

    if (!uid) return

    let initialized = false
    const unsubscribeSessions = onSnapshot(
      query(collection(db, 'sessions', uid, 'sessions'), limit(1)),
      snapshot => {
        if (!initialized) {
          initialized = true
          return
        }
        snapshot.docChanges().forEach(change => {
          workoutsStore.applyRealtimeSessionChange(change, 'sessions')
        })
      }
    )

    let initializedStats = false
    const unsubscribeStatistics = onSnapshot(
      query(collection(db, 'users', uid, 'statistics'), limit(1)),
      snapshot => {
        if (!initializedStats) {
          initializedStats = true
          return
        }
        snapshot.docChanges().forEach(change => {
          workoutsStore.applyRealtimeSessionChange(change, 'statistics')
        })
      }
    )

    onCleanup(() => {
      unsubscribeSessions()
      unsubscribeStatistics()
    })
  },
  { immediate: true }
)
</script>

<style scoped>
.view-wrapper {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

/* Stats strip */
.stats-strip {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}
.stat-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r);
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(12px);
  cursor: default;
  transition: border-color var(--transition), transform var(--spring), box-shadow var(--transition);
}
.stat-card:hover {
  border-color: var(--border-mid);
  transform: translateY(-3px);
  box-shadow: 0 12px 30px rgba(0,0,0,0.25);
}
.stat-card::before {
  content: '';
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--c, #baf2d8), transparent);
  opacity: 0.5;
  transition: opacity var(--transition);
}
.stat-card:hover::before { opacity: 1; }
.stat-top { display: flex; align-items: flex-start; justify-content: space-between; }
.stat-label-sm { font-size: 0.68rem; color: var(--text-2); letter-spacing: 0.03em; }
.stat-icon {
  width: 28px; height: 28px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.85rem;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.07);
}
.stat-val { font-size: 1.8rem; font-weight: 700; color: var(--text-1); letter-spacing: -0.04em; line-height: 1; }
.stat-sub { font-size: 0.64rem; color: var(--text-3); }

/* Week card */
.week-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r);
  padding: 18px 22px;
  margin-bottom: 24px;
  backdrop-filter: blur(12px);
}
.week-title { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--text-3); margin-bottom: 14px; }
.week-days { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; }
.day-cell { display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: default; }
.day-dot {
  width: 36px; height: 36px; border-radius: 10px;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  transition: all var(--transition);
  font-size: 0.7rem; color: var(--text-3);
}
.day-cell.has-workout .day-dot { background: rgba(186,242,216,0.1); border-color: var(--border-mid); color: var(--secondary); }
.day-cell.today .day-dot { background: rgba(186,242,216,0.15); border-color: var(--secondary); box-shadow: 0 0 12px rgba(186,242,216,0.2); color: var(--secondary); }
.day-name { font-size: 0.6rem; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.08em; }
.day-date { font-size: 0.6rem; color: var(--text-3); }

/* 2-col */
.content-grid { display: grid; grid-template-columns: 1fr 300px; gap: 20px; }
.workouts-list { display: flex; flex-direction: column; gap: 10px; }
.section-link { font-size: 0.72rem; color: var(--secondary-dim); transition: color var(--transition); }
.section-link:hover { color: var(--secondary); }

/* Right col */
.right-col { display: flex; flex-direction: column; gap: 16px; align-self: start; }
.next-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); padding: 18px; backdrop-filter: blur(12px); }
.next-empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 16px 0; text-align: center; }
.next-icon { font-size: 1.5rem; opacity: 0.3; }
.next-label { font-size: 0.78rem; color: var(--text-3); }
.btn-plan {
  font-size: 0.75rem; font-weight: 600; color: var(--secondary);
  background: rgba(186,242,216,0.08); border: 1px solid var(--border-mid);
  padding: 7px 16px; border-radius: 8px; cursor: pointer; transition: all var(--transition);
}
.btn-plan:hover { background: rgba(186,242,216,0.14); }

.quick-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.quick-item {
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--r);
  padding: 14px; cursor: pointer; transition: all var(--transition); backdrop-filter: blur(12px);
  text-decoration: none; display: block;
}
.quick-item:hover { border-color: var(--border-mid); background: var(--surface-hover); transform: translateY(-2px); }
.quick-item.primary { grid-column: 1 / -1; background: rgba(186,242,216,0.07); border-color: var(--border-mid); }
.quick-item.primary:hover { background: rgba(186,242,216,0.12); border-color: var(--border-act); }
.qi-icon { font-size: 1rem; margin-bottom: 8px; }
.qi-title { font-size: 0.78rem; font-weight: 600; color: var(--text-1); margin-bottom: 2px; }
.qi-sub { font-size: 0.65rem; color: var(--text-3); }
.quick-item.primary .qi-title { color: var(--secondary); }

.stats-mini { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); padding: 18px; backdrop-filter: blur(12px); }
.stat-row-mini { display: flex; justify-content: space-between; align-items: center; padding: 7px 0; border-bottom: 1px solid var(--border); }
.stat-row-mini:last-child { border-bottom: none; padding-bottom: 0; }
.stat-row-mini:first-child { padding-top: 0; }
.sr-label { font-size: 0.74rem; color: var(--text-2); }
.sr-val { font-size: 0.78rem; font-weight: 600; color: var(--text-1); }
</style>
