import { computed, ref } from 'vue'
import { addDoc, collection, deleteDoc, doc, getDocs, query, limit, updateDoc } from 'firebase/firestore'
import { db } from '@/firebase'

const DISTRIBUTION_COLORS = ['#f97316', '#60a5fa', '#a78bfa', '#34d399', '#fbbf24', '#fb7185']
const CACHE_TTL_MS = 5 * 60 * 1000

function buildCacheKey(uid, sessionLimit, includeMetrics) {
  return `liftconnect_stats_cache_${uid}_${sessionLimit}_${includeMetrics ? 'full' : 'light'}`
}

function serializeSessions(sessions) {
  return sessions.map(session => ({
    ...session,
    startedAt: session.startedAt ? session.startedAt.toISOString() : null,
    endedAt: session.endedAt ? session.endedAt.toISOString() : null,
  }))
}

function deserializeSessions(sessions) {
  return (sessions || []).map(session => ({
    ...session,
    startedAt: toDate(session.startedAt),
    endedAt: toDate(session.endedAt),
    metrics: Array.isArray(session.metrics) ? session.metrics : [],
  }))
}

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

  async function fetchUserStatistics(uid, options = {}) {
    const {
      sessionLimit = 30,
      includeMetrics = false,
      forceRefresh = false,
    } = options

    if (!uid) {
      rawSessions.value = []
      return []
    }

    const cacheKey = buildCacheKey(uid, sessionLimit, includeMetrics)
    if (!forceRefresh) {
      try {
        const cachedRaw = localStorage.getItem(cacheKey)
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw)
          if (cached?.createdAt && Date.now() - cached.createdAt < CACHE_TTL_MS) {
            const restored = deserializeSessions(cached.sessions)
            rawSessions.value = restored
            return restored
          }
        }
      } catch {
      }
    }

    loading.value = true
    error.value = null

    try {
      const sessionsRef = collection(db, 'users', uid, 'statistics')
      const sessionsSnap = await getDocs(query(sessionsRef, limit(sessionLimit)))

      const sessions = await Promise.all(
        sessionsSnap.docs.map(async sessionDoc => {
          const sessionData = sessionDoc.data()
          const startedAt = toDate(sessionData.started_at || sessionData.startedAt || sessionData.date || sessionData.created_at)
          const endedAt = toDate(sessionData.ended_at || sessionData.endedAt)
          const durationMinutes = getSessionDurationMinutes(sessionData, startedAt, endedAt)

          let metrics = []
          if (includeMetrics) {
            const metricsSnap = await getDocs(collection(db, 'users', uid, 'statistics', sessionDoc.id, 'tracked_metric'))

            metrics = await Promise.all(
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
          }

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

      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          createdAt: Date.now(),
          sessions: serializeSessions(sessions),
        }))
      } catch {
      }

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

  async function fetchSessionDetails(uid, sessionId) {
    if (!uid || !sessionId) return null

    const baseSession = rawSessions.value.find(session => session.id === sessionId)
    if (!baseSession) return null

    try {
      const metricsSnap = await getDocs(collection(db, 'users', uid, 'statistics', sessionId, 'tracked_metric'))

      const metrics = await Promise.all(
        metricsSnap.docs.map(async metricDoc => {
          const metricData = metricDoc.data()
          const metricType = inferTypeFromText(
            metricData.type || metricData.category || metricData.muscle_group || metricData.name
          )

          const setsSnap = await getDocs(
            collection(db, 'users', uid, 'statistics', sessionId, 'tracked_metric', metricDoc.id, 'exercise_set')
          )

          const sets = setsSnap.docs.map(setDoc => ({ id: setDoc.id, ...setDoc.data() }))

          return {
            id: metricDoc.id,
            name: metricData.name || metricData.exercise_name || 'Exercice',
            type: metricType,
            sets,
          }
        })
      )

      return {
        ...baseSession,
        metrics,
      }
    } catch (e) {
      console.error('[useStatistics] fetchSessionDetails error:', e)
      return {
        ...baseSession,
        metrics: [],
      }
    }
  }

  async function updateSessionTiming(uid, sessionId, fields) {
    if (!uid || !sessionId) throw new Error('UID et sessionId requis')

    const payload = {}
    if (fields.started_at !== undefined) payload.started_at = fields.started_at
    if (fields.ended_at !== undefined) payload.ended_at = fields.ended_at

    await updateDoc(doc(db, 'users', uid, 'statistics', sessionId), payload)

    const idx = rawSessions.value.findIndex(session => session.id === sessionId)
    if (idx !== -1) {
      const current = rawSessions.value[idx]
      const startedAt = fields.started_at !== undefined ? toDate(fields.started_at) : current.startedAt
      const endedAt = fields.ended_at !== undefined ? toDate(fields.ended_at) : current.endedAt
      const nextDuration = startedAt && endedAt
        ? Math.max(0, Math.round((endedAt.getTime() - startedAt.getTime()) / 60000))
        : current.durationMinutes

      rawSessions.value[idx] = {
        ...current,
        startedAt,
        endedAt,
        durationMinutes: nextDuration,
      }
    }
  }

  async function addExerciseSet(uid, sessionId, metricId, fields) {
    if (!uid || !sessionId || !metricId) throw new Error('UID, sessionId et metricId requis')
    const ref = await addDoc(
      collection(db, 'users', uid, 'statistics', sessionId, 'tracked_metric', metricId, 'exercise_set'),
      fields
    )
    return ref.id
  }

  async function updateExerciseSet(uid, sessionId, metricId, setId, fields) {
    if (!uid || !sessionId || !metricId || !setId) throw new Error('UID, sessionId, metricId et setId requis')
    await updateDoc(doc(db, 'users', uid, 'statistics', sessionId, 'tracked_metric', metricId, 'exercise_set', setId), fields)
  }

  async function deleteExerciseSet(uid, sessionId, metricId, setId) {
    if (!uid || !sessionId || !metricId || !setId) throw new Error('UID, sessionId, metricId et setId requis')
    await deleteDoc(doc(db, 'users', uid, 'statistics', sessionId, 'tracked_metric', metricId, 'exercise_set', setId))
  }

  return {
    rawSessions,
    loading,
    error,
    totalSessions,
    fetchUserStatistics,
    fetchSessionDetails,
    updateSessionTiming,
    addExerciseSet,
    updateExerciseSet,
    deleteExerciseSet,
    buildTypeDistribution,
    buildPrs,
  }
}
