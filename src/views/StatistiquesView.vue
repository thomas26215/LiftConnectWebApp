<template>
  <div class="view-wrapper">
    <PageHeader title="Statistiques" subtitle="Progression · 3 derniers mois">
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

      <div class="stats-grid">
        <!-- Volume hebdo -->
        <div class="chart-card wide animate-in delay-1">
          <div class="chart-title">Volume hebdomadaire</div>
          <div class="chart-sub">{{ weeklySubtitle }}</div>
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
              <div v-for="b in weeklyBars" :key="b.label" class="bar-col">
                <div class="bar-value">{{ b.displayValue }}</div>
                <div class="bar-track">
                  <div class="bar" :class="{ highlight: b.highlight }" :style="`height:${b.height}%`"></div>
                </div>
                <div class="bar-label">{{ b.label }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Durée moyenne -->
        <div class="chart-card animate-in delay-2">
          <div class="chart-title">Durée des séances</div>
          <div class="chart-sub">Évolution sur 8 semaines</div>
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
                <span>S-8</span>
                <span>S-6</span>
                <span>S-4</span>
                <span>S-2</span>
                <span>S-1</span>
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
      </div>
      </template>
    </ScrollArea>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import ScrollArea from '@/components/layout/ScrollArea.vue'
import { useAuthStore } from '@/stores/auth'
import { useStatistics } from '@/composables/useStatistics'

const authStore = useAuthStore()
const {
  rawSessions,
  loading,
  error,
  fetchUserStatistics,
  buildTypeDistribution,
  buildPrs,
} = useStatistics()

const selectedRange = ref('90d')

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

const previousPeriodSessions = computed(() => {
  const now = Date.now()
  const periodMs = rangeDays.value * 24 * 60 * 60 * 1000
  const startCurrent = now - periodMs
  const startPrevious = startCurrent - periodMs

  return rawSessions.value.filter(session => {
    const started = session.startedAt?.getTime?.()
    if (!started) return false
    return started >= startPrevious && started < startCurrent
  })
})

const chartSessions = computed(() => {
  if (filteredSessions.value.length) return filteredSessions.value
  return rawSessions.value
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

const previousTotalMinutes = computed(() =>
  previousPeriodSessions.value.reduce((sum, session) => sum + (session.durationMinutes || 0), 0)
)

const currentMetricsCount = computed(() =>
  filteredSessions.value.reduce((sum, session) => sum + session.metrics.length, 0)
)

const previousMetricsCount = computed(() =>
  previousPeriodSessions.value.reduce((sum, session) => sum + session.metrics.length, 0)
)

const averageDuration = computed(() => {
  if (!filteredSessions.value.length) return 0
  return Math.round(currentTotalMinutes.value / filteredSessions.value.length)
})

const previousAverageDuration = computed(() => {
  if (!previousPeriodSessions.value.length) return 0
  const total = previousPeriodSessions.value.reduce((sum, session) => sum + (session.durationMinutes || 0), 0)
  return Math.round(total / previousPeriodSessions.value.length)
})

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

const weeklySubtitle = computed(() =>
  hasWeightVolumeData.value
    ? 'Charge totale (kg × reps) par semaine'
    : 'Nombre de séances par semaine'
)

const weeklyBars = computed(() => {
  const weekMs = 7 * 24 * 60 * 60 * 1000
  const now = Date.now()

  const buckets = Array.from({ length: 12 }, (_, index) => {
    const start = now - (12 - index) * weekMs
    const end = start + weekMs
    const sessions = chartSessions.value.filter(session => {
      const t = session.startedAt?.getTime?.()
      return t && t >= start && t < end
    })

    if (hasWeightVolumeData.value) {
      const tonnage = sessions.reduce((sum, session) => sum + getSessionTonnage(session).total, 0)
      return { label: `S${index + 1}`, value: tonnage }
    }

    return { label: `S${index + 1}`, value: sessions.length }
  })

  const maxValue = Math.max(...buckets.map(b => b.value), 1)
  return buckets.map(bucket => ({
    label: bucket.label,
    count: bucket.value,
    displayValue: hasWeightVolumeData.value ? `${Math.round(bucket.value)} kg` : String(bucket.value),
    height: Math.max(8, Math.round((bucket.value / maxValue) * 100)),
    highlight: bucket.value === maxValue && bucket.value > 0,
  }))
})

const weeklyMaxCount = computed(() => Math.max(...weeklyBars.value.map(b => b.count), 0))
const weeklyScaleLabels = computed(() => {
  if (!weeklyMaxCount.value) return [0, 0, 0]
  return [weeklyMaxCount.value, Math.ceil(weeklyMaxCount.value / 2), 0]
})

const durationSeries = computed(() => {
  const weekMs = 7 * 24 * 60 * 60 * 1000
  const now = Date.now()

  return Array.from({ length: 8 }, (_, index) => {
    const start = now - (8 - index) * weekMs
    const end = start + weekMs
    const sessions = filteredSessions.value.filter(session => {
      const t = session.startedAt?.getTime?.()
      return t && t >= start && t < end
    })

    if (!sessions.length) return 0
    const total = sessions.reduce((sum, session) => sum + (session.durationMinutes || 0), 0)
    return Math.round(total / sessions.length)
  })
})

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
const lineLastPoint = computed(() => linePointsMeta.value[linePointsMeta.value.length - 1] || { x: 260, y: 65 })

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

onMounted(async () => {
  const uid = authStore.user?.uid
  if (!uid) return
  await fetchUserStatistics(uid)
})
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
.bar-value {
  font-size: 0.62rem;
  color: var(--secondary-dim);
  line-height: 1;
  min-height: 12px;
}
.bar {
  width: 100%; border-radius: 5px 5px 0 0;
  background: linear-gradient(180deg, rgba(186,242,216,0.36), rgba(186,242,216,0.12));
  border: 1px solid rgba(186,242,216,0.16);
  transition: background var(--transition), transform var(--spring), box-shadow var(--transition);
  cursor: default;
  box-shadow: 0 8px 18px rgba(0,0,0,0.18);
}
.bar:hover { background: rgba(186,242,216,0.3); transform: scaleY(1.03); transform-origin: bottom; }
.bar.highlight { background: rgba(186,242,216,0.35); border-color: rgba(186,242,216,0.4); }
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
</style>
