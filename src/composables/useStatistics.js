import { computed, ref } from 'vue'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/firebase'

const DISTRIBUTION_COLORS = ['#f97316', '#60a5fa', '#a78bfa', '#34d399', '#fbbf24', '#fb7185']

function toDate(value) {
  if (!value) return null
  if (value?.toDate) return value.toDate()
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function parseMinutes(raw) {
  if (raw == null) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

function inferTypeFromText(raw) {
  const text = String(raw || '').toLowerCase()
  if (!text) return 'other'
  if (text.includes('push') || text.includes('pector') || text.includes('triceps') || text.includes('chest')) return 'push'
  if (text.includes('pull') || text.includes('dos') || text.includes('back') || text.includes('biceps')) return 'pull'
  if (text.includes('leg') || text.includes('jambe') || text.includes('squat') || text.includes('quadri') || text.includes('ischio')) return 'legs'
  if (text.includes('full')) return 'full'
  if (text.includes('upper') || text.includes('épaule') || text.includes('shoulder')) return 'upper'
  return 'other'
}

function getSessionDurationMinutes(sessionData, startedAt, endedAt) {
  const candidates = [
    sessionData.duration_minutes,
    sessionData.duration,
    sessionData.total_duration_minutes,
    sessionData.total_duration,
    sessionData.training_minutes,
  ]

  for (const candidate of candidates) {
    const minutes = parseMinutes(candidate)
    if (minutes != null) return minutes
  }

  if (startedAt && endedAt) {
    const diffMs = endedAt.getTime() - startedAt.getTime()
    if (diffMs > 0) return Math.round(diffMs / 60000)
  }

  return 0
}

function readBestLoadFromSet(setData) {
  const candidates = [
    setData.weight_kg,
    setData.weight,
    setData.kg,
    setData.load,
    setData.max_weight,
    setData.value,
  ]

  for (const candidate of candidates) {
    const numeric = Number(candidate)
    if (Number.isFinite(numeric) && numeric > 0) return numeric
  }
  return null
}

export function useStatistics() {
  const rawSessions = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function fetchUserStatistics(uid) {
    if (!uid) {
      rawSessions.value = []
      return []
    }

    loading.value = true
    error.value = null

    try {
      const sessionsRef = collection(db, 'users', uid, 'statistics')
      const sessionsSnap = await getDocs(sessionsRef)

      const sessions = await Promise.all(
        sessionsSnap.docs.map(async sessionDoc => {
          const sessionData = sessionDoc.data()
          const startedAt = toDate(sessionData.started_at || sessionData.startedAt || sessionData.date || sessionData.created_at)
          const endedAt = toDate(sessionData.ended_at || sessionData.endedAt)
          const durationMinutes = getSessionDurationMinutes(sessionData, startedAt, endedAt)

          const metricsSnap = await getDocs(collection(db, 'users', uid, 'statistics', sessionDoc.id, 'tracked_metric'))

          const metrics = await Promise.all(
            metricsSnap.docs.map(async metricDoc => {
              const metricData = metricDoc.data()
              const metricType = inferTypeFromText(
                metricData.type || metricData.category || metricData.muscle_group || metricData.name
              )

              const setsSnap = await getDocs(
                collection(db, 'users', uid, 'statistics', sessionDoc.id, 'tracked_metric', metricDoc.id, 'exercise_set')
              )

              const sets = setsSnap.docs.map(setDoc => setDoc.data())

              return {
                id: metricDoc.id,
                name: metricData.name || metricData.exercise_name || 'Exercice',
                type: metricType,
                sets,
              }
            })
          )

          return {
            id: sessionDoc.id,
            sourceId: sessionData.id ?? null,
            name: sessionData.session_name || sessionData.name || 'Séance',
            startedAt,
            endedAt,
            durationMinutes,
            metrics,
          }
        })
      )

      sessions.sort((a, b) => (b.startedAt?.getTime() || 0) - (a.startedAt?.getTime() || 0))
      rawSessions.value = sessions
      return sessions
    } catch (e) {
      console.error('[useStatistics] fetchUserStatistics error:', e)
      error.value = e
      rawSessions.value = []
      return []
    } finally {
      loading.value = false
    }
  }

  const totalSessions = computed(() => rawSessions.value.length)

  function buildTypeDistribution(sessions) {
    const counts = new Map()

    sessions.forEach(session => {
      const sessionLabel = String(session.name || 'Séance').trim() || 'Séance'
      counts.set(sessionLabel, (counts.get(sessionLabel) || 0) + 1)
    })

    const total = Array.from(counts.values()).reduce((sum, value) => sum + value, 0)
    if (!total) return []

    return Array.from(counts.entries())
      .map(([label, value], index) => ({
        type: label,
        label,
        color: DISTRIBUTION_COLORS[index % DISTRIBUTION_COLORS.length],
        pct: Math.round((value / total) * 100),
        count: value,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
  }

  function buildPrs(sessions) {
    const bestByExercise = new Map()

    sessions.forEach(session => {
      session.metrics.forEach(metric => {
        const bestLoad = metric.sets
          .map(readBestLoadFromSet)
          .filter(value => value != null)
          .reduce((max, value) => Math.max(max, value), 0)

        if (!bestLoad) return

        const current = bestByExercise.get(metric.name)
        if (!current || bestLoad > current.load) {
          bestByExercise.set(metric.name, {
            exercise: metric.name,
            value: `${bestLoad} kg`,
            date: session.startedAt ? session.startedAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—',
            load: bestLoad,
          })
        }
      })
    })

    return Array.from(bestByExercise.values())
      .sort((a, b) => b.load - a.load)
      .slice(0, 4)
      .map(({ load, ...rest }) => rest)
  }

  return {
    rawSessions,
    loading,
    error,
    totalSessions,
    fetchUserStatistics,
    buildTypeDistribution,
    buildPrs,
  }
}
