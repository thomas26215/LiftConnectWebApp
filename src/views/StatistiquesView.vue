<template>
  <div class="view-wrapper">
    <PageHeader title="Statistiques" subtitle="Progression · 3 derniers mois">
      <template #actions>
        <select class="filter-select">
          <option>3 derniers mois</option>
          <option>Ce mois</option>
          <option>Cette semaine</option>
          <option>Cette année</option>
        </select>
      </template>
    </PageHeader>

    <ScrollArea>
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
          <div class="chart-sub">Nombre de séances par semaine</div>
          <div class="bar-chart">
            <div v-for="b in weeklyBars" :key="b.label" class="bar-col">
              <div class="bar" :class="{ highlight: b.highlight }" :style="`height:${b.height}%`"></div>
              <div class="bar-label">{{ b.label }}</div>
            </div>
          </div>
        </div>

        <!-- Durée moyenne -->
        <div class="chart-card animate-in delay-2">
          <div class="chart-title">Durée des séances</div>
          <div class="chart-sub">Évolution sur 8 semaines</div>
          <div class="line-chart">
            <svg viewBox="0 0 260 80" preserveAspectRatio="none">
              <defs>
                <linearGradient id="line-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="rgba(186,242,216,0.18)"/>
                  <stop offset="100%" stop-color="rgba(186,242,216,0)"/>
                </linearGradient>
              </defs>
              <polygon points="0,65 37,55 74,60 111,40 148,45 185,30 222,35 260,20 260,80 0,80" fill="url(#line-fill)"/>
              <polyline points="0,65 37,55 74,60 111,40 148,45 185,30 222,35 260,20"
                fill="none" stroke="rgba(186,242,216,0.7)" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="260" cy="20" r="4" fill="#baf2d8"/>
            </svg>
          </div>
        </div>

        <!-- Type distribution donut -->
        <div class="chart-card animate-in delay-3">
          <div class="chart-title">Répartition des types</div>
          <div class="chart-sub">Par catégorie d'entraînement</div>
          <div class="donut-wrap">
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="30" fill="none" stroke="rgba(249,115,22,0.6)"  stroke-width="12" stroke-dasharray="75 114"  stroke-dashoffset="0"    transform="rotate(-90 40 40)"/>
              <circle cx="40" cy="40" r="30" fill="none" stroke="rgba(96,165,250,0.6)"  stroke-width="12" stroke-dasharray="45 144"  stroke-dashoffset="-75"   transform="rotate(-90 40 40)"/>
              <circle cx="40" cy="40" r="30" fill="none" stroke="rgba(167,139,250,0.6)" stroke-width="12" stroke-dasharray="38 151"  stroke-dashoffset="-120"  transform="rotate(-90 40 40)"/>
              <circle cx="40" cy="40" r="30" fill="none" stroke="rgba(52,211,153,0.6)"  stroke-width="12" stroke-dasharray="31 158"  stroke-dashoffset="-158"  transform="rotate(-90 40 40)"/>
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
          <div class="pr-grid">
            <div v-for="pr in prs" :key="pr.exercise" class="pr-card">
              <div class="pr-val">{{ pr.value }}</div>
              <div class="pr-exercise">{{ pr.exercise }}</div>
              <div class="pr-date">{{ pr.date }}</div>
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  </div>
</template>

<script setup>
import PageHeader from '@/components/layout/PageHeader.vue'
import ScrollArea from '@/components/layout/ScrollArea.vue'
import { statsKpis, weeklyBars, typeDistribution, prs } from '@/data'
</script>

<style scoped>
.view-wrapper { display: flex; flex-direction: column; height: 100vh; overflow: hidden; }

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

.bar-chart { display: flex; align-items: flex-end; gap: 8px; height: 100px; }
.bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 5px; }
.bar {
  width: 100%; border-radius: 5px 5px 0 0;
  background: rgba(186,242,216,0.15); border: 1px solid rgba(186,242,216,0.1);
  transition: background var(--transition), transform var(--spring);
  cursor: default;
}
.bar:hover { background: rgba(186,242,216,0.3); transform: scaleY(1.03); transform-origin: bottom; }
.bar.highlight { background: rgba(186,242,216,0.35); border-color: rgba(186,242,216,0.4); }
.bar-label { font-size: 0.58rem; color: var(--text-3); }

.line-chart { position: relative; height: 90px; }
.line-chart svg { width: 100%; height: 100%; overflow: visible; }

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
</style>
