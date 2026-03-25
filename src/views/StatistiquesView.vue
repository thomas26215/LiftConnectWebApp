<template>
  <div class="view-wrapper">
    <PageHeader title="Statistiques" :subtitle="`Progression · ${rangeLabel}`">
      <template #actions>
        <select v-model="selectedRange" class="filter-select">
          <option value="90d">3 derniers mois</option>
          <option value="30d">Ce mois</option>
          <option value="7d">Cette semaine</option>
          <option value="365d">Cette année</option>
        </select>
      </template>
    </PageHeader>

    <ScrollArea>
      <div v-if="loading" class="state-card">Chargement des statistiques…</div>
      <div v-else-if="error" class="state-card error">Impossible de charger les statistiques.</div>

      <template v-else>
      <!-- KPIs -->
      <div class="kpi-row animate-in">
        <div v-for="(k, i) in statsKpis" :key="k.label" class="big-stat" :class="`delay-${i}`">
          <div class="big-stat-val">{{ k.value }}</div>
          <div class="big-stat-label">{{ k.label }}</div>
          <div class="big-stat-delta">{{ k.delta }}</div>
        </div>
      </div>

      <div class="insights-row animate-in delay-1">
        <div v-for="insight in insightCards" :key="insight.label" class="insight-card">
          <div class="insight-label">{{ insight.label }}</div>
          <div class="insight-value">{{ insight.value }}</div>
          <div class="insight-sub">{{ insight.sub }}</div>
        </div>
      </div>

      <div class="stats-grid">
        <!-- Volume hebdo -->
        <div v-if="periodMode !== 'day'" class="chart-card wide animate-in delay-1">
          <div class="chart-title">{{ volumeChartTitle }}</div>
          <div class="chart-sub">{{ volumeChartSubtitle }}</div>
          <div class="bar-legend">
            <button type="button" class="legend-chip load" :class="{ inactive: !volumeSeriesVisibility.load }" @click="toggleVolumeSeries('load')">Charge totale</button>
            <button type="button" class="legend-chip reps" :class="{ inactive: !volumeSeriesVisibility.reps }" @click="toggleVolumeSeries('reps')">Répétitions totales</button>
            <button type="button" class="legend-chip duration" :class="{ inactive: !volumeSeriesVisibility.duration }" @click="toggleVolumeSeries('duration')">Durée totale</button>
          </div>
          <div class="chart-shell">
            <div class="chart-y-labels">
              <span>{{ weeklyScaleLabels[0] }}</span>
              <span>{{ weeklyScaleLabels[1] }}</span>
              <span>{{ weeklyScaleLabels[2] }}</span>
            </div>
            <div class="bar-chart">
              <div class="bar-grid" aria-hidden="true">
                <div class="grid-line"></div>
                <div class="grid-line"></div>
                <div class="grid-line"></div>
              </div>
              <div
                v-for="b in weeklyBars"
                :key="b.label"
                class="bar-col"
                @mouseenter="hoveredVolumeKey = b.label"
                @mouseleave="hoveredVolumeKey = null"
              >
                <div v-if="hoveredVolumeKey === b.label" class="bar-tooltip">
                  <span v-if="volumeSeriesVisibility.load" class="bar-value load">{{ b.loadDisplay }}</span>
                  <span v-if="volumeSeriesVisibility.reps" class="bar-value reps">{{ b.repsDisplay }}</span>
                  <span v-if="volumeSeriesVisibility.duration" class="bar-value duration">{{ b.durationDisplay }}</span>
                </div>
                <div class="bar-track multi" :class="`series-${weeklyVisibleSeriesCount}`">
                  <div v-if="volumeSeriesVisibility.load" class="bar load" :style="`height:${b.loadHeight}%`"></div>
                  <div v-if="volumeSeriesVisibility.reps" class="bar reps" :style="`height:${b.repsHeight}%`"></div>
                  <div v-if="volumeSeriesVisibility.duration" class="bar duration" :style="`height:${b.durationHeight}%`"></div>
                </div>
                <div class="bar-label">{{ b.label }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Durée moyenne -->
        <div class="chart-card animate-in delay-2">
          <div class="chart-title">Durée des séances</div>
          <div class="chart-sub">{{ durationSubtitle }}</div>
          <div class="chart-shell">
            <div class="chart-y-labels">
              <span>{{ durationScaleLabels[0] }} min</span>
              <span>{{ durationScaleLabels[1] }} min</span>
              <span>{{ durationScaleLabels[2] }} min</span>
            </div>
            <div class="line-chart">
              <svg viewBox="0 0 260 80" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="line-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="rgba(186,242,216,0.18)"/>
                    <stop offset="100%" stop-color="rgba(186,242,216,0)"/>
                  </linearGradient>
                </defs>
                <line x1="0" y1="20" x2="260" y2="20" class="svg-grid-line" />
                <line x1="0" y1="42" x2="260" y2="42" class="svg-grid-line" />
                <line x1="0" y1="65" x2="260" y2="65" class="svg-grid-line" />
                <polygon :points="lineAreaPoints" fill="url(#line-fill)"/>
                <polyline :points="linePoints"
                  fill="none" stroke="rgba(186,242,216,0.78)" stroke-width="2.4"
                  stroke-linecap="round" stroke-linejoin="round"/>
                <circle
                  v-for="(point, idx) in linePointsMeta"
                  :key="idx"
                  :cx="point.x"
                  :cy="point.y"
                  :r="idx === linePointsMeta.length - 1 ? 4 : 2.6"
                  :class="idx === linePointsMeta.length - 1 ? 'line-point-active' : 'line-point'"
                >
                  <title>{{ durationSeries[idx] }} min</title>
                </circle>
              </svg>
              <div class="line-x-labels">
                <span v-for="label in durationXAxisLabels" :key="label">{{ label }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Type distribution donut -->
        <div class="chart-card animate-in delay-3">
          <div class="chart-title">Répartition des séances</div>
          <div class="chart-sub">Top 3 séances les plus réalisées</div>
          <div class="donut-wrap">
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="30" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="12" />
              <circle
                v-for="segment in donutSegments"
                :key="segment.type"
                cx="40"
                cy="40"
                r="30"
                fill="none"
                :stroke="segment.color"
                stroke-width="12"
                :stroke-dasharray="segment.dashArray"
                :stroke-dashoffset="segment.dashOffset"
                transform="rotate(-90 40 40)"
              />
            </svg>
            <div class="donut-legend">
              <div v-for="d in typeDistribution" :key="d.label" class="legend-item">
                <div class="legend-dot" :style="`background:${d.color}`"></div>
                <span class="legend-label">{{ d.label }}</span>
                <span class="legend-val">{{ d.pct }}%</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="periodMode !== 'day'" class="chart-card wide animate-in delay-4">
          <div class="chart-title">{{ cadenceTitle }}</div>
          <div class="chart-sub">{{ cadenceSubtitle }}</div>
          <div class="month-grid">
            <div v-for="period in cadenceRows" :key="period.key" class="month-row">
              <div class="month-name">{{ period.label }}</div>
              <div class="month-progress">
                <div class="month-progress-fill" :style="`width:${period.width}%`"></div>
              </div>
              <div class="month-meta">{{ period.sessions }} séances · {{ period.minutes }} min</div>
            </div>
          </div>
        </div>

        <!-- PRs -->
        <div class="chart-card wide animate-in delay-4">
          <div class="chart-title">Records personnels</div>
          <div class="chart-sub">Tes meilleures performances</div>
          <div v-if="!prs.length" class="empty-state">Pas encore de records disponibles.</div>
          <div v-else class="pr-grid">
            <div v-for="pr in prs" :key="pr.exercise" class="pr-card">
              <div class="pr-val">{{ pr.value }}</div>
              <div class="pr-exercise">{{ pr.exercise }}</div>
              <div class="pr-date">{{ pr.date }}</div>
            </div>
          </div>
        </div>

        <div class="chart-card wide animate-in delay-4">
          <div class="chart-title">Historique des entraînements</div>
          <div class="chart-sub">Clique sur une séance pour afficher le détail</div>

          <div class="history-layout">
            <div class="history-list">
              <button
                v-for="session in historySessions"
                :key="session.id"
                type="button"
                class="history-item"
                :class="{ active: selectedSessionId === session.id }"
                @click="openSessionDetail(session)"
              >
                <div class="history-item-top">
                  <span class="history-name">{{ session.name || 'Séance' }}</span>
                  <span class="history-duration">{{ formatDuration(session.durationMinutes) }}</span>
                </div>
                <div class="history-item-date">{{ formatSessionDate(session.startedAt) }}</div>
              </button>
              <div v-if="!historySessions.length" class="empty-state">Aucun entraînement trouvé.</div>
            </div>

            <div class="history-detail">
              <div v-if="detailLoading" class="mini-state">Chargement du détail…</div>
              <div v-else-if="detailError" class="mini-state error-text">Impossible de charger le détail.</div>

              <div v-else-if="selectedSessionDetail">
                <div class="detail-head">
                  <div>
                    <div class="detail-title">{{ selectedSessionDetail.name || 'Séance' }}</div>
                    <div v-if="!isEditingSession" class="detail-meta">
                      {{ formatSessionDate(selectedSessionDetail.startedAt) }} · {{ formatDuration(selectedSessionDetail.durationMinutes) }}
                    </div>
                  </div>

                  <div class="detail-actions">
                    <button v-if="!isEditingSession && selectedSessionDetail?.source !== 'sessions'" type="button" class="detail-btn" @click="startEditingSession">
                      Modifier
                    </button>
                    <button v-if="!isEditingSession" type="button" class="detail-btn danger" :disabled="deletingSession" @click="handleDeleteSession">
                      {{ deletingSession ? 'Suppression…' : 'Supprimer la séance' }}
                    </button>
                    <template v-if="isEditingSession">
                      <button type="button" class="detail-btn" @click="cancelEditingSession">Annuler</button>
                      <button type="button" class="detail-btn primary" :disabled="savingDetail" @click="saveSessionChanges">
                        {{ savingDetail ? 'Enregistrement…' : 'Enregistrer' }}
                      </button>
                    </template>
                  </div>
                </div>

                <div v-if="isEditingSession" class="timing-form">
                  <label class="timing-field">
                    <span>Début</span>
                    <input v-model="editableSession.started_at" type="datetime-local" class="timing-input" />
                  </label>
                  <label class="timing-field">
                    <span>Fin</span>
                    <input v-model="editableSession.ended_at" type="datetime-local" class="timing-input" />
                  </label>
                </div>

                <div v-if="!isEditingSession && !selectedSessionDetail.metrics?.length" class="mini-state">
                  Pas de détails d'exercices sur cette séance.
                </div>

                <div v-else-if="isEditingSession && !editableSession?.metrics?.length" class="mini-state">
                  Pas de détails d'exercices sur cette séance.
                </div>

                <div v-else-if="!isEditingSession" class="metric-list">
                  <div v-for="metric in selectedSessionDetail.metrics" :key="metric.id" class="metric-item">
                    <div class="metric-title">{{ metric.name }}</div>
                    <div class="metric-sub">{{ metric.sets.length }} série(s)</div>
                    <div class="set-list">
                      <span v-for="(setData, setIndex) in metric.sets" :key="setIndex" class="set-chip">
                        {{ formatSet(setData) }}
                      </span>
                    </div>
                  </div>
                </div>

                <div v-else class="metric-list">
                  <div v-for="(metric, metricIndex) in editableSession.metrics" :key="metric.id" class="metric-item">
                    <div class="metric-head">
                      <div>
                        <div class="metric-title">{{ metric.name }}</div>
                        <div class="metric-sub">{{ metric.sets.length }} série(s)</div>
                      </div>
                      <button type="button" class="set-remove metric-remove" @click="removeMetricRow(metricIndex)">Suppr. exo</button>
                    </div>

                    <div class="set-edit-list">
                      <div v-for="(setRow, setIndex) in metric.sets" :key="setRow.id || setIndex" class="set-edit-row">
                        <input v-model.number="setRow.weight_kg" type="number" min="0" class="set-input" placeholder="kg" />
                        <input v-model.number="setRow.reps" type="number" min="0" class="set-input" placeholder="reps" />
                        <button type="button" class="set-remove" @click="removeSetRow(metricIndex, setIndex)">Suppr.</button>
                      </div>
                    </div>

                    <button type="button" class="set-add" @click="addSetRow(metricIndex)">+ Ajouter une série</button>
                  </div>
                </div>
              </div>

              <div v-else class="mini-state">Sélectionne une séance dans la liste pour voir le détail.</div>
            </div>
          </div>
        </div>
      </div>
      </template>
    </ScrollArea>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { collection, limit, onSnapshot, query } from 'firebase/firestore'
import PageHeader from '@/components/layout/PageHeader.vue'
import ScrollArea from '@/components/layout/ScrollArea.vue'
import { useAuthStore } from '@/stores/auth'
import { useStatistics } from '@/composables/useStatistics.js'
import { db } from '@/firebase'

const authStore = useAuthStore()
const {
  rawSessions,
  loading,
  error,
  fetchUserStatistics,
  fetchSessionDetails,
  updateSessionTiming,
  addExerciseSet,
  updateExerciseSet,
  deleteExerciseSet,
  deleteTrackedMetric,
  deleteSession,
  subscribeStatisticsRevision,
  applyRealtimeSessionChange,
  buildTypeDistribution,
  buildPrs,
} = useStatistics()

const selectedRange = ref('90d')
const selectedSessionId = ref(null)
const selectedSessionDetail = ref(null)
const detailLoading = ref(false)
const detailError = ref(null)
const sessionDetailsCache = ref(new Map())
const isEditingSession = ref(false)
const savingDetail = ref(false)
const editableSession = ref(null)
const originalSessionSnapshot = ref(null)
const revisionKey = ref('')
const deletingSession = ref(false)
const hoveredVolumeKey = ref(null)
const volumeSeriesVisibility = ref({
  load: true,
  reps: true,
  duration: true,
})

function toggleVolumeSeries(seriesKey) {
  const visibility = volumeSeriesVisibility.value
  const activeCount = Object.values(visibility).filter(Boolean).length
  if (visibility[seriesKey] && activeCount <= 1) return

  volumeSeriesVisibility.value = {
    ...visibility,
    [seriesKey]: !visibility[seriesKey],
  }
}

const weeklyVisibleSeriesCount = computed(() =>
  Math.max(1, Object.values(volumeSeriesVisibility.value).filter(Boolean).length)
)

const rangeLabel = computed(() => {
  if (selectedRange.value === '7d') return 'Cette semaine'
  if (selectedRange.value === '30d') return 'Ce mois'
  if (selectedRange.value === '365d') return 'Cette année'
  return '3 derniers mois'
})

const rangeDays = computed(() => {
  if (selectedRange.value === '7d') return 7
  if (selectedRange.value === '30d') return 30
  if (selectedRange.value === '365d') return 365
  return 90
})

const filteredSessions = computed(() => {
  const now = Date.now()
  const limitMs = rangeDays.value * 24 * 60 * 60 * 1000
  return rawSessions.value.filter(session => {
    const started = session.startedAt?.getTime?.()
    if (!started) return false
    return now - started <= limitMs
  })
})

const chartSessions = computed(() => {
  return filteredSessions.value
})

const previousPeriodSessions = computed(() => {
  const now = Date.now()
  const periodMs = rangeDays.value * 24 * 60 * 60 * 1000
  const currentStart = now - periodMs
  const previousStart = currentStart - periodMs

  return rawSessions.value.filter(session => {
    const started = session.startedAt?.getTime?.()
    if (!started) return false
    return started >= previousStart && started < currentStart
  })
})

const firstUsageDate = computed(() => {
  const timestamps = rawSessions.value
    .map(session => session.startedAt?.getTime?.())
    .filter(ts => Number.isFinite(ts))

  if (!timestamps.length) return null
  return new Date(Math.min(...timestamps))
})

const averageWeeksFromUsage = computed(() => {
  if (!firstUsageDate.value) return 1

  const now = Date.now()
  const rangeStart = now - (rangeDays.value * 24 * 60 * 60 * 1000)
  const effectiveStart = Math.max(rangeStart, firstUsageDate.value.getTime())
  const elapsedDays = Math.max(1, (now - effectiveStart) / (24 * 60 * 60 * 1000))
  return Math.max(1, elapsedDays / 7)
})

function formatDelta(current, previous, unit = '') {
  if (!previous && current) return `↑ +${current}${unit}`
  if (!previous && !current) return '→ Stable'
  const diff = current - previous
  if (diff > 0) return `↑ +${diff}${unit}`
  if (diff < 0) return `↓ ${diff}${unit}`
  return '→ Stable'
}

const currentTotalMinutes = computed(() =>
  filteredSessions.value.reduce((sum, session) => sum + (session.durationMinutes || 0), 0)
)

const currentMetricsCount = computed(() =>
  filteredSessions.value.reduce((sum, session) => sum + session.metrics.length, 0)
)

const averageDuration = computed(() => {
  if (!filteredSessions.value.length) return 0
  return Math.round(currentTotalMinutes.value / filteredSessions.value.length)
})

const previousTotalMinutes = computed(() =>
  previousPeriodSessions.value.reduce((sum, session) => sum + (session.durationMinutes || 0), 0)
)

const previousMetricsCount = computed(() =>
  previousPeriodSessions.value.reduce((sum, session) => sum + session.metrics.length, 0)
)

const previousAverageDuration = computed(() => {
  if (!previousPeriodSessions.value.length) return 0
  const total = previousPeriodSessions.value.reduce((sum, session) => sum + (session.durationMinutes || 0), 0)
  return Math.round(total / previousPeriodSessions.value.length)
})

function startOfWeekMonday(date) {
  const d = startOfDay(new Date(date))
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

function weekKey(date) {
  const d = startOfWeekMonday(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const weeksWithSessions = computed(() => {
  return new Set(
    rawSessions.value
      .map(session => (session.startedAt ? weekKey(session.startedAt) : null))
      .filter(Boolean)
  )
})

const currentStreakWeeks = computed(() => {
  if (!weeksWithSessions.value.size) return 0

  let streak = 0
  let cursor = startOfWeekMonday(new Date())

  while (weeksWithSessions.value.has(weekKey(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 7)
  }

  return streak
})

const bestPeriodLabel = computed(() => 'Semaine la plus active')

const volumeUnitLabel = computed(() => 'séances')

const bestWeekInsight = computed(() => {
  const weekCounts = new Map()

  rawSessions.value.forEach(session => {
    if (!session.startedAt) return
    const key = weekKey(session.startedAt)
    weekCounts.set(key, (weekCounts.get(key) || 0) + 1)
  })

  if (!weekCounts.size) return { label: '—', count: 0 }

  let bestKey = null
  let bestCount = 0
  weekCounts.forEach((count, key) => {
    if (count > bestCount) {
      bestCount = count
      bestKey = key
    }
  })

  const start = bestKey ? new Date(bestKey) : null
  const label = start
    ? `du ${start.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}`
    : '—'

  return { label, count: bestCount }
})

const recent30Sessions = computed(() => {
  const now = Date.now()
  const start = now - (30 * 24 * 60 * 60 * 1000)
  return rawSessions.value.filter(session => {
    const started = session.startedAt?.getTime?.()
    return started && started >= start && started <= now
  })
})

const previous30Sessions = computed(() => {
  const now = Date.now()
  const currentStart = now - (30 * 24 * 60 * 60 * 1000)
  const previousStart = currentStart - (30 * 24 * 60 * 60 * 1000)
  return rawSessions.value.filter(session => {
    const started = session.startedAt?.getTime?.()
    return started && started >= previousStart && started < currentStart
  })
})

const recent30Minutes = computed(() =>
  recent30Sessions.value.reduce((sum, session) => sum + (session.durationMinutes || 0), 0)
)

const previous30Minutes = computed(() =>
  previous30Sessions.value.reduce((sum, session) => sum + (session.durationMinutes || 0), 0)
)

const recent30AverageDuration = computed(() => {
  if (!recent30Sessions.value.length) return 0
  return Math.round(recent30Minutes.value / recent30Sessions.value.length)
})

const previous30AverageDuration = computed(() => {
  if (!previous30Sessions.value.length) return 0
  return Math.round(previous30Minutes.value / previous30Sessions.value.length)
})

const recent30MetricsCount = computed(() =>
  recent30Sessions.value.reduce((sum, session) => sum + session.metrics.length, 0)
)

const previous30MetricsCount = computed(() =>
  previous30Sessions.value.reduce((sum, session) => sum + session.metrics.length, 0)
)

const lastSession = computed(() => rawSessions.value[0] || null)

const insightCards = computed(() => [
  {
    label: 'Streak actuel',
    value: `${currentStreakWeeks.value} semaine${currentStreakWeeks.value > 1 ? 's' : ''}`,
    sub: 'Série en cours',
  },
  {
    label: bestPeriodLabel.value,
    value: `${bestWeekInsight.value.label}`,
    sub: `${Math.round(bestWeekInsight.value.count)} ${volumeUnitLabel.value}`,
  },
  {
    label: 'Dernière séance',
    value: lastSession.value ? formatSessionDate(lastSession.value.startedAt) : '—',
    sub: lastSession.value ? formatDuration(lastSession.value.durationMinutes) : 'Aucune séance',
  },
  {
    label: 'Moyenne / semaine',
    value: `${(filteredSessions.value.length / averageWeeksFromUsage.value).toFixed(1)}`,
    sub: 'Séances hebdomadaires',
  },
])

const statsKpis = computed(() => [
  {
    value: String(filteredSessions.value.length),
    label: 'Séances totales',
    delta: formatDelta(filteredSessions.value.length, previousPeriodSessions.value.length),
  },
  {
    value: `${Math.floor(currentTotalMinutes.value / 60)}h`,
    label: "Temps d'entraînement",
    delta: formatDelta(currentTotalMinutes.value, previousTotalMinutes.value, ' min'),
  },
  {
    value: `${averageDuration.value} min`,
    label: 'Durée moyenne',
    delta: formatDelta(averageDuration.value, previousAverageDuration.value, ' min'),
  },
  {
    value: String(currentMetricsCount.value),
    label: 'Exercices réalisés',
    delta: formatDelta(currentMetricsCount.value, previousMetricsCount.value),
  },
])

function toNumeric(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function getSetWeight(setData) {
  return [setData?.weight_kg, setData?.weight, setData?.kg, setData?.load]
    .map(toNumeric)
    .find(value => value != null && value > 0) ?? null
}

function getSetReps(setData) {
  return [setData?.reps, setData?.repetitions, setData?.rep]
    .map(toNumeric)
    .find(value => value != null && value > 0) ?? null
}

function getSessionTonnage(session) {
  let total = 0
  let foundWeightedSet = false

  session.metrics.forEach(metric => {
    metric.sets.forEach(setData => {
      const weight = getSetWeight(setData)
      const reps = getSetReps(setData)
      if (weight != null && reps != null) {
        total += weight * reps
        foundWeightedSet = true
      }
    })
  })

  return {
    total,
    hasWeightedSets: foundWeightedSet,
  }
}

const weightedSessionCount = computed(() =>
  chartSessions.value.filter(session => getSessionTonnage(session).hasWeightedSets).length
)

const hasWeightVolumeData = computed(() =>
  chartSessions.value.length > 0 && (weightedSessionCount.value / chartSessions.value.length) >= 0.5
)

const periodMode = computed(() => {
  if (selectedRange.value === '7d') return 'day'
  if (selectedRange.value === '365d') return 'month'
  return 'week'
})

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addDays(date, days) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function addMonths(date, months) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1)
}

function buildBuckets(mode) {
  const now = new Date()

  if (mode === 'day') {
    const start = startOfDay(addDays(now, -6))
    return Array.from({ length: 7 }, (_, index) => {
      const bucketStart = addDays(start, index)
      const bucketEnd = addDays(bucketStart, 1)
      return {
        key: bucketStart.toISOString(),
        label: bucketStart.toLocaleDateString('fr-FR', { weekday: 'short' }),
        start: bucketStart,
        end: bucketEnd,
      }
    })
  }

  if (mode === 'month') {
    const currentMonth = startOfMonth(now)
    const firstMonth = addMonths(currentMonth, -11)
    return Array.from({ length: 12 }, (_, index) => {
      const bucketStart = addMonths(firstMonth, index)
      const bucketEnd = addMonths(bucketStart, 1)
      return {
        key: `${bucketStart.getFullYear()}-${bucketStart.getMonth() + 1}`,
        label: bucketStart.toLocaleDateString('fr-FR', { month: 'short' }),
        start: bucketStart,
        end: bucketEnd,
      }
    })
  }

  const currentDay = startOfDay(now)
  const start = addDays(currentDay, -77)
  return Array.from({ length: 12 }, (_, index) => {
    const bucketStart = addDays(start, index * 7)
    const bucketEnd = addDays(bucketStart, 7)
    return {
      key: bucketStart.toISOString(),
      label: `S${index + 1}`,
      start: bucketStart,
      end: bucketEnd,
    }
  })
}

const chartBuckets = computed(() => buildBuckets(periodMode.value))

const volumeChartTitle = computed(() => {
  if (periodMode.value === 'day') return 'Volume hebdomadaire'
  if (periodMode.value === 'month') return 'Volume mensuel'
  return 'Volume hebdomadaire'
})

const volumeChartSubtitle = computed(() => {
  if (periodMode.value === 'day') return 'Charge, reps et durée de la semaine'
  if (periodMode.value === 'month') return 'Charge, reps et durée par mois (12 mois)'
  return 'Charge, reps et durée par semaine'
})

function getSessionTotalReps(session) {
  let total = 0

  session.metrics.forEach(metric => {
    metric.sets.forEach(setData => {
      const reps = getSetReps(setData)
      if (reps != null) total += reps
    })
  })

  return total
}

const weeklyBars = computed(() => {
  const buckets = chartBuckets.value.map(bucket => {
    const sessions = chartSessions.value.filter(session => {
      const t = session.startedAt?.getTime?.()
      return t && t >= bucket.start.getTime() && t < bucket.end.getTime()
    })

    const totalLoad = sessions.reduce((sum, session) => sum + getSessionTonnage(session).total, 0)
    const totalReps = sessions.reduce((sum, session) => sum + getSessionTotalReps(session), 0)
    const totalDuration = sessions.reduce((sum, session) => sum + Number(session.durationMinutes || 0), 0)

    return {
      label: bucket.label,
      totalLoad,
      totalReps,
      totalDuration,
    }
  })

  const maxLoad = Math.max(...buckets.map(b => b.totalLoad), 1)
  const maxReps = Math.max(...buckets.map(b => b.totalReps), 1)
  const maxDuration = Math.max(...buckets.map(b => b.totalDuration), 1)

  return buckets.map(bucket => ({
    label: bucket.label,
    loadDisplay: `${Math.round(bucket.totalLoad)} kg`,
    repsDisplay: `${Math.round(bucket.totalReps)} reps`,
    durationDisplay: `${Math.round(bucket.totalDuration)} min`,
    loadHeight: bucket.totalLoad > 0 ? Math.max(10, Math.round((bucket.totalLoad / maxLoad) * 100)) : 0,
    repsHeight: bucket.totalReps > 0 ? Math.max(10, Math.round((bucket.totalReps / maxReps) * 100)) : 0,
    durationHeight: bucket.totalDuration > 0 ? Math.max(10, Math.round((bucket.totalDuration / maxDuration) * 100)) : 0,
  }))
})

const weeklyScaleLabels = computed(() => [100, 50, 0])

const durationSeries = computed(() => {
  return chartBuckets.value.map(bucket => {
    const sessions = filteredSessions.value.filter(session => {
      const t = session.startedAt?.getTime?.()
      return t && t >= bucket.start.getTime() && t < bucket.end.getTime()
    })

    if (!sessions.length) return 0
    const total = sessions.reduce((sum, session) => sum + (session.durationMinutes || 0), 0)
    return Math.round(total / sessions.length)
  })
})

const durationSubtitle = computed(() => {
  if (periodMode.value === 'day') return 'Durée moyenne par jour (7 jours)'
  if (periodMode.value === 'month') return 'Durée moyenne par mois (12 mois)'
  return 'Durée moyenne par semaine (12 semaines)'
})

const durationXAxisLabels = computed(() => chartBuckets.value.map(bucket => bucket.label))

const durationMax = computed(() => Math.max(...durationSeries.value, 0))
const durationScaleLabels = computed(() => {
  if (!durationMax.value) return [0, 0, 0]
  return [durationMax.value, Math.round(durationMax.value / 2), 0]
})

const linePointsMeta = computed(() => {
  const values = durationSeries.value
  const max = Math.max(...values, 1)
  return values.map((value, index) => {
    const x = Math.round((index / (values.length - 1 || 1)) * 260)
    const y = 65 - Math.round((value / max) * 45)
    return { x, y }
  })
})

const linePoints = computed(() => linePointsMeta.value.map(p => `${p.x},${p.y}`).join(' '))
const lineAreaPoints = computed(() => `${linePoints.value} 260,80 0,80`)

const typeDistribution = computed(() => buildTypeDistribution(chartSessions.value))

const donutSegments = computed(() => {
  const radius = 30
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return typeDistribution.value.map(item => {
    const dash = (item.pct / 100) * circumference
    const segment = {
      type: item.type,
      color: item.color,
      dashArray: `${dash} ${Math.max(circumference - dash, 0)}`,
      dashOffset: `${-offset}`,
    }
    offset += dash
    return segment
  })
})

const prs = computed(() => buildPrs(chartSessions.value))
const historySessions = computed(() => rawSessions.value)

const cadenceTitle = computed(() => {
  if (periodMode.value === 'day') return 'Rythme hebdomadaire'
  if (periodMode.value === 'month') return 'Rythme mensuel'
  return 'Rythme hebdomadaire'
})

const cadenceSubtitle = computed(() => {
  if (periodMode.value === 'day') return 'Volume et temps de la semaine'
  if (periodMode.value === 'month') return 'Volume et temps sur les 12 derniers mois'
  return 'Volume et temps sur les 12 dernières semaines'
})

const cadenceRows = computed(() => {
  const rows = chartBuckets.value.map(bucket => {
    return {
      key: bucket.key,
      label: bucket.label,
      start: bucket.start,
      end: bucket.end,
      sessions: 0,
      minutes: 0,
      width: 0,
    }
  })

  chartSessions.value.forEach(session => {
    if (!session.startedAt) return
    const started = session.startedAt.getTime()
    const slot = rows.find(row => started >= row.start.getTime() && started < row.end.getTime())
    if (!slot) return
    slot.sessions += 1
    slot.minutes += Number(session.durationMinutes || 0)
  })

  const maxSessions = Math.max(...rows.map(row => row.sessions), 1)
  return rows.map(row => {
    const { start, end, ...base } = row
    return {
      ...base,
      width: row.sessions > 0 ? Math.max(10, Math.round((row.sessions / maxSessions) * 100)) : 0,
    }
  })
})

function formatSessionDate(date) {
  if (!date) return 'Date inconnue'
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatDuration(minutes) {
  const value = Number(minutes || 0)
  if (!value) return '—'
  if (value < 60) return `${value} min`
  const h = Math.floor(value / 60)
  const m = value % 60
  return m ? `${h}h ${m}min` : `${h}h`
}

function formatSet(setData) {
  const reps = Number(setData?.reps ?? setData?.repetitions ?? setData?.rep)
  const weight = Number(setData?.weight_kg ?? setData?.weight ?? setData?.kg ?? setData?.load)

  if (Number.isFinite(weight) && Number.isFinite(reps)) return `${weight}kg × ${reps}`
  if (Number.isFinite(reps)) return `${reps} reps`
  if (Number.isFinite(weight)) return `${weight} kg`
  return 'Série'
}

function toDatetimeLocalValue(date) {
  if (!date) return ''
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function createEditableSession(detail) {
  return {
    started_at: toDatetimeLocalValue(detail.startedAt),
    ended_at: toDatetimeLocalValue(detail.endedAt),
    metrics: (detail.metrics || []).map(metric => ({
      id: metric.id,
      name: metric.name,
      sets: (metric.sets || []).map(setData => ({
        id: setData.id || null,
        reps: Number(setData.reps ?? setData.repetitions ?? setData.rep) || 0,
        weight_kg: Number(setData.weight_kg ?? setData.weight ?? setData.kg ?? setData.load) || 0,
      })),
    })),
  }
}

function startEditingSession() {
  if (!selectedSessionDetail.value) return
  editableSession.value = createEditableSession(selectedSessionDetail.value)
  originalSessionSnapshot.value = createEditableSession(selectedSessionDetail.value)
  isEditingSession.value = true
}

function cancelEditingSession() {
  isEditingSession.value = false
  editableSession.value = null
  originalSessionSnapshot.value = null
}

function addSetRow(metricIndex) {
  editableSession.value.metrics[metricIndex].sets.push({
    id: null,
    reps: 0,
    weight_kg: 0,
  })
}

function removeSetRow(metricIndex, setIndex) {
  editableSession.value.metrics[metricIndex].sets.splice(setIndex, 1)
}

function removeMetricRow(metricIndex) {
  editableSession.value.metrics.splice(metricIndex, 1)
}

async function saveSessionChanges() {
  const uid = authStore.user?.uid
  const sessionId = selectedSessionId.value
  if (!uid || !sessionId || !editableSession.value || !originalSessionSnapshot.value) return

  savingDetail.value = true
  detailError.value = null

  try {
    const timingUpdates = {}
    if (editableSession.value.started_at !== originalSessionSnapshot.value.started_at && editableSession.value.started_at) {
      timingUpdates.started_at = new Date(editableSession.value.started_at).toISOString()
    }
    if (editableSession.value.ended_at !== originalSessionSnapshot.value.ended_at && editableSession.value.ended_at) {
      timingUpdates.ended_at = new Date(editableSession.value.ended_at).toISOString()
    }
    if (Object.keys(timingUpdates).length) {
      await updateSessionTiming(uid, sessionId, timingUpdates)
    }

    const removedMetrics = originalSessionSnapshot.value.metrics.filter(
      originalMetric => !editableSession.value.metrics.some(metric => metric.id === originalMetric.id)
    )

    for (const removedMetric of removedMetrics) {
      await deleteTrackedMetric(uid, sessionId, removedMetric.id)
    }

    for (const metric of editableSession.value.metrics) {
      const originalMetric = originalSessionSnapshot.value.metrics.find(m => m.id === metric.id)
      const originalSets = originalMetric ? originalMetric.sets : []
      const originalIds = new Set(originalSets.filter(s => s.id).map(s => s.id))
      const currentIds = new Set(metric.sets.filter(s => s.id).map(s => s.id))

      for (const setRow of metric.sets) {
        const payload = {
          reps: Number(setRow.reps) || 0,
          weight_kg: Number(setRow.weight_kg) || 0,
        }

        if (setRow.id) {
          await updateExerciseSet(uid, sessionId, metric.id, setRow.id, payload)
        } else if (payload.reps > 0 || payload.weight_kg > 0) {
          await addExerciseSet(uid, sessionId, metric.id, payload)
        }
      }

      for (const originalId of originalIds) {
        if (!currentIds.has(originalId)) {
          await deleteExerciseSet(uid, sessionId, metric.id, originalId)
        }
      }
    }

    sessionDetailsCache.value.delete(sessionId)
    const updated = await fetchSessionDetails(uid, sessionId)
    if (updated) {
      sessionDetailsCache.value.set(sessionId, updated)
      selectedSessionDetail.value = updated
    }
    cancelEditingSession()
  } catch {
    detailError.value = 'error'
  } finally {
    savingDetail.value = false
  }
}

async function openSessionDetail(session) {
  if (!session?.id) return

  isEditingSession.value = false
  editableSession.value = null
  originalSessionSnapshot.value = null
  selectedSessionId.value = session.id
  detailError.value = null

  if (sessionDetailsCache.value.has(session.id)) {
    selectedSessionDetail.value = sessionDetailsCache.value.get(session.id)
    return
  }

  const uid = authStore.user?.uid
  if (!uid) return

  detailLoading.value = true
  try {
    const details = await fetchSessionDetails(uid, session.id)
    if (details) {
      sessionDetailsCache.value.set(session.id, details)
      selectedSessionDetail.value = details
    }
  } catch {
    detailError.value = 'error'
  } finally {
    detailLoading.value = false
  }
}

async function handleDeleteSession() {
  const uid = authStore.user?.uid
  const sessionId = selectedSessionId.value
  if (!uid || !sessionId || deletingSession.value) return

  const confirmed = window.confirm('Supprimer cette séance complète ? Cette action est irréversible.')
  if (!confirmed) return

  deletingSession.value = true
  detailError.value = null

  try {
    await deleteSession(uid, sessionId)
    sessionDetailsCache.value.delete(sessionId)
    selectedSessionId.value = null
    selectedSessionDetail.value = null
    isEditingSession.value = false
    editableSession.value = null
    originalSessionSnapshot.value = null
  } catch {
    detailError.value = 'error'
  } finally {
    deletingSession.value = false
  }
}

const sessionLimitByRange = {
  '7d': 60,
  '30d': 140,
  '90d': 220,
  '365d': 500,
}

async function loadStatistics(uid, forceRefresh = false) {
  if (!uid) {
    selectedSessionId.value = null
    selectedSessionDetail.value = null
    sessionDetailsCache.value.clear()
    return
  }

  await fetchUserStatistics(uid, {
    sessionLimit: sessionLimitByRange[selectedRange.value] || 220,
    includeMetrics: true,
    forceRefresh,
  })
}

watch([selectedRange, () => authStore.user?.uid], async ([, uid]) => {
  await loadStatistics(uid)
}, { immediate: true })

watch(() => authStore.user?.uid, (uid, _oldUid, onCleanup) => {
  revisionKey.value = ''

  if (!uid) return

  const unsubscribe = subscribeStatisticsRevision(uid, ({ revision, updatedAt }) => {
    const nextKey = `${revision}_${updatedAt}`
    if (!nextKey || nextKey === revisionKey.value) return

    revisionKey.value = nextKey
    loadStatistics(uid, true)
  })

  onCleanup(() => {
    unsubscribe?.()
  })
}, { immediate: true })

watch(() => authStore.user?.uid, (uid, _oldUid, onCleanup) => {
  if (!uid) return

  const listeners = [
    { source: 'statistics', q: query(collection(db, 'users', uid, 'statistics'), limit(1)) },
    { source: 'sessions', q: query(collection(db, 'sessions', uid, 'sessions'), limit(1)) },
    { source: 'exercises', q: query(collection(db, 'exercises', uid, 'exercises'), limit(1)) },
  ]

  const unsubs = listeners.map(target => {
    let initialized = false
    const targetQuery = target?.q || target
    const targetSource = target?.source || null

    return onSnapshot(targetQuery, snapshot => {
      if (!initialized) {
        initialized = true
        return
      }

      if (targetSource) {
        snapshot.docChanges().forEach(change => {
          applyRealtimeSessionChange(change, targetSource)
        })
        return
      }

      loadStatistics(uid, true)
    })
  })

  onCleanup(() => {
    unsubs.forEach(unsub => unsub?.())
  })
}, { immediate: true })
</script>

<style scoped>
.view-wrapper { display: flex; flex-direction: column; height: 100vh; overflow: hidden; }

.state-card {
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--r);
  padding: 20px; color: var(--text-2); font-size: 0.9rem;
}

.state-card.error {
  color: #fca5a5;
  border-color: rgba(252, 165, 165, 0.4);
}

.filter-select {
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-sm);
  padding: 9px 12px; color: var(--text-2); font-size: 0.8rem; cursor: pointer; outline: none;
}

.kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 14px; }
.insights-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 14px; }
.insight-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.insight-label { font-size: 0.66rem; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.08em; }
.insight-value { font-size: 1rem; color: var(--text-1); font-weight: 700; }
.insight-sub { font-size: 0.68rem; color: var(--text-2); }
.big-stat {
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--r);
  padding: 18px; backdrop-filter: blur(12px);
  display: flex; flex-direction: column; gap: 6px;
  transition: border-color var(--transition), transform var(--spring);
}
.big-stat:hover { border-color: var(--border-mid); transform: translateY(-2px); }
.big-stat-val { font-size: 1.8rem; font-weight: 700; color: var(--secondary); letter-spacing: -0.04em; line-height: 1; }
.big-stat-label { font-size: 0.68rem; color: var(--text-2); }
.big-stat-delta { font-size: 0.65rem; color: #34d399; }

.stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.stats-grid .wide { grid-column: 1 / -1; }

.chart-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); padding: 20px; backdrop-filter: blur(12px); }
.chart-title { font-size: 0.82rem; font-weight: 600; color: var(--text-1); margin-bottom: 4px; }
.chart-sub { font-size: 0.7rem; color: var(--text-3); margin-bottom: 16px; }

.bar-legend {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.legend-chip {
  font-size: 0.62rem;
  padding: 5px 10px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: rgba(255,255,255,0.03);
  color: var(--text-2);
  cursor: pointer;
  transition: all var(--transition);
}

.legend-chip.inactive {
  opacity: 0.42;
}

.legend-chip.load { color: #f97316; border-color: rgba(249, 115, 22, 0.38); }
.legend-chip.reps { color: #60a5fa; border-color: rgba(96, 165, 250, 0.38); }
.legend-chip.duration { color: #a78bfa; border-color: rgba(167, 139, 250, 0.38); }

.chart-shell { display: grid; grid-template-columns: 34px 1fr; gap: 8px; align-items: end; }
.chart-y-labels {
  height: 128px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  font-size: 0.62rem;
  color: var(--text-3);
  text-align: right;
  padding: 0 2px 16px 0;
}

.bar-chart {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 128px;
  position: relative;
}

.bar-grid {
  position: absolute;
  inset: 0 0 16px 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  pointer-events: none;
}

.grid-line {
  border-top: 1px dashed rgba(186, 242, 216, 0.14);
}

.bar-col {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 5px;
  z-index: 1;
}

.bar-track {
  width: 100%;
  flex: 1;
  min-height: 72px;
  display: flex;
  align-items: flex-end;
}
.bar-track.multi {
  gap: 4px;
}

.bar-tooltip {
  min-height: 32px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;
  justify-content: center;
}

.bar-value {
  font-size: 0.62rem;
  color: var(--text-3);
  line-height: 1;
  min-height: 12px;
}
.bar-value.load { color: #f97316; }
.bar-value.reps { color: #60a5fa; }
.bar-value.duration { color: #a78bfa; }

.bar {
  width: 100%; border-radius: 5px 5px 0 0;
  background: rgba(186,242,216,0.2);
  border: 1px solid rgba(186,242,216,0.16);
  transition: background var(--transition), transform var(--spring), box-shadow var(--transition);
  cursor: default;
  box-shadow: 0 8px 18px rgba(0,0,0,0.18);
}

.bar.load {
  background: rgba(249, 115, 22, 0.62);
  border-color: rgba(249, 115, 22, 0.85);
}

.bar.reps {
  background: rgba(96, 165, 250, 0.62);
  border-color: rgba(96, 165, 250, 0.85);
}

.bar.duration {
  background: rgba(167, 139, 250, 0.62);
  border-color: rgba(167, 139, 250, 0.85);
}

.bar:hover { transform: scaleY(1.03); transform-origin: bottom; }
.bar-label { font-size: 0.58rem; color: var(--text-3); }

.line-chart { position: relative; height: 128px; }
.line-chart svg { width: 100%; height: 100%; overflow: visible; }

.svg-grid-line {
  stroke: rgba(186, 242, 216, 0.14);
  stroke-width: 1;
  stroke-dasharray: 2 3;
}

.line-point {
  fill: rgba(186,242,216,0.68);
}

.line-point-active {
  fill: #baf2d8;
  filter: drop-shadow(0 0 6px rgba(186, 242, 216, 0.35));
}

.line-x-labels {
  position: absolute;
  left: 0;
  right: 0;
  bottom: -2px;
  display: flex;
  justify-content: space-between;
  font-size: 0.6rem;
  color: var(--text-3);
}

.donut-wrap { display: flex; align-items: center; gap: 20px; margin-top: 8px; }
.donut-legend { display: flex; flex-direction: column; gap: 8px; flex: 1; }
.legend-item { display: flex; align-items: center; gap: 8px; font-size: 0.72rem; }
.legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.legend-label { color: var(--text-2); flex: 1; }
.legend-val { font-weight: 600; color: var(--text-1); }

.pr-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 12px; }
.pr-card {
  background: rgba(255,255,255,0.03); border: 1px solid var(--border);
  border-radius: 10px; padding: 14px; text-align: center;
  transition: border-color var(--transition), transform var(--spring);
}
.pr-card:hover { border-color: var(--border-mid); transform: translateY(-2px); }
.pr-val { font-size: 1.3rem; font-weight: 700; color: var(--secondary); letter-spacing: -0.03em; }
.pr-exercise { font-size: 0.7rem; color: var(--text-2); margin-top: 3px; }
.pr-date { font-size: 0.62rem; color: var(--text-3); margin-top: 2px; }

.empty-state { color: var(--text-3); font-size: 0.8rem; margin-top: 8px; }


.weekday-chart {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  height: 160px;
}

.weekday-col {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  gap: 4px;
}

.weekday-track {
  width: 100%;
  height: 120px;
  display: flex;
  align-items: flex-end;
}

.weekday-bar {
  width: 100%;
  border-radius: 6px 6px 0 0;
  background: linear-gradient(180deg, rgba(96,165,250,0.42), rgba(96,165,250,0.12));
  border: 1px solid rgba(96,165,250,0.3);
}

.weekday-count { font-size: 0.65rem; color: var(--text-2); }
.weekday-label { font-size: 0.62rem; color: var(--text-3); }

.month-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.month-row {
  display: grid;
  grid-template-columns: 90px 1fr 170px;
  gap: 10px;
  align-items: center;
}

.month-name { font-size: 0.72rem; color: var(--text-2); }
.month-progress {
  height: 10px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: rgba(255,255,255,0.03);
  overflow: hidden;
}
.month-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, rgba(186,242,216,0.75), rgba(186,242,216,0.25));
}
.month-meta { font-size: 0.68rem; color: var(--text-3); text-align: right; }

.history-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 12px;
  margin-top: 8px;
}

.history-list {
  border: 1px solid var(--border);
  border-radius: 10px;
  max-height: 360px;
  overflow-y: auto;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.history-item {
  border: 1px solid var(--border);
  border-radius: 8px;
  background: rgba(255,255,255,0.02);
  color: var(--text-2);
  text-align: left;
  padding: 10px;
  cursor: pointer;
  transition: all var(--transition);
}

.history-item:hover,
.history-item.active {
  border-color: var(--border-mid);
  background: rgba(186,242,216,0.08);
}

.history-item-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.history-name {
  font-size: 0.76rem;
  font-weight: 600;
  color: var(--text-1);
}

.history-duration {
  font-size: 0.7rem;
  color: var(--secondary);
  font-weight: 600;
}

.history-item-date {
  margin-top: 4px;
  font-size: 0.66rem;
  color: var(--text-3);
}

.history-detail {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px;
  min-height: 180px;
}

.mini-state {
  color: var(--text-3);
  font-size: 0.78rem;
}

.error-text {
  color: #fca5a5;
}

.detail-head {
  margin-bottom: 10px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.detail-actions {
  display: flex;
  gap: 6px;
}

.detail-btn {
  border: 1px solid var(--border);
  background: rgba(255,255,255,0.03);
  color: var(--text-2);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 0.68rem;
  cursor: pointer;
  transition: all var(--transition);
}

.detail-btn:hover {
  border-color: var(--border-mid);
  color: var(--text-1);
}

.detail-btn.primary {
  background: rgba(186,242,216,0.16);
  border-color: rgba(186,242,216,0.35);
  color: var(--secondary);
  font-weight: 700;
}

.detail-btn.danger {
  border-color: rgba(252, 165, 165, 0.42);
  background: rgba(252, 165, 165, 0.08);
  color: #fca5a5;
}

.detail-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.detail-title {
  font-size: 0.9rem;
  color: var(--text-1);
  font-weight: 700;
}

.detail-meta {
  margin-top: 3px;
  font-size: 0.72rem;
  color: var(--text-3);
}

.timing-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 12px;
}

.timing-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.timing-field span {
  font-size: 0.66rem;
  color: var(--text-3);
}

.timing-input {
  border: 1px solid var(--border);
  border-radius: 8px;
  background: rgba(255,255,255,0.03);
  color: var(--text-1);
  padding: 8px;
  font-size: 0.74rem;
}

.timing-input:focus {
  outline: none;
  border-color: var(--border-mid);
}

.metric-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.metric-item {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px;
  background: rgba(255,255,255,0.02);
}

.metric-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}

.metric-title {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-1);
}

.metric-sub {
  margin-top: 3px;
  font-size: 0.68rem;
  color: var(--text-3);
}

.set-list {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.set-chip {
  padding: 4px 8px;
  border: 1px solid var(--border);
  border-radius: 999px;
  font-size: 0.66rem;
  color: var(--text-2);
  background: rgba(255,255,255,0.03);
}

.set-edit-list {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.set-edit-row {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 6px;
}

.set-input {
  border: 1px solid var(--border);
  border-radius: 8px;
  background: rgba(255,255,255,0.03);
  color: var(--text-1);
  padding: 7px 8px;
  font-size: 0.72rem;
}

.set-input:focus {
  outline: none;
  border-color: var(--border-mid);
}

.set-remove {
  border: 1px solid rgba(252, 165, 165, 0.4);
  border-radius: 8px;
  background: rgba(252, 165, 165, 0.08);
  color: #fca5a5;
  font-size: 0.68rem;
  padding: 0 10px;
  cursor: pointer;
}

.metric-remove {
  white-space: nowrap;
}

.set-add {
  margin-top: 8px;
  border: 1px dashed var(--border-mid);
  border-radius: 8px;
  background: rgba(186,242,216,0.08);
  color: var(--secondary);
  font-size: 0.7rem;
  padding: 7px 10px;
  cursor: pointer;
}

@media (max-width: 1080px) {
  .insights-row {
    grid-template-columns: 1fr 1fr;
  }

  .history-layout {
    grid-template-columns: 1fr;
  }

  .timing-form {
    grid-template-columns: 1fr;
  }

  .month-row {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .month-meta {
    text-align: left;
  }
}
</style>
