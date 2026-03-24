<template>
  <div class="view-wrapper">
    <PageHeader title="Groupes" subtitle="Tes groupes et communautés">
      <template #actions>
        <button class="btn-primary">+ Créer un groupe</button>
      </template>
    </PageHeader>

    <ScrollArea>
      <!-- My groups -->
      <SectionHeader title="Mes groupes" />
      <div class="groups-grid" style="margin-bottom: 32px">
        <div
          v-for="(g, i) in groups"
          :key="g.id"
          class="group-card animate-in"
          :class="`delay-${i + 1}`"
        >
          <div class="group-header">
            <div class="group-icon" :style="`background:${g.bg};border-color:${g.border}`">{{ g.icon }}</div>
            <div>
              <div class="group-name">{{ g.name }}</div>
              <span class="group-tag" :style="`color:${g.color};background:${g.bg};border-color:${g.border}`">
                {{ g.sport }}
              </span>
            </div>
          </div>
          <div class="group-desc">{{ g.desc }}</div>
          <div class="group-footer">
            <div class="group-members">
              <div class="member-stack">
                <div v-for="m in g.memberInitials" :key="m" class="member-dot">{{ m }}</div>
              </div>
              <span>{{ g.members }} membres</span>
            </div>
            <button class="btn-ghost">Voir →</button>
          </div>
        </div>
      </div>

      <!-- Discover -->
      <SectionHeader title="Découvrir des groupes" />
      <div class="discover-grid animate-in delay-4">
        <div class="group-find-card">
          <div class="find-icon">🔍</div>
          <div class="find-title">Trouver un groupe près de toi</div>
          <div class="find-sub">Rejoins des athlètes partageant tes objectifs dans ta ville</div>
          <button class="btn-primary" style="margin-top: 12px; align-self: center">Explorer</button>
        </div>
        <div class="group-find-card">
          <div class="find-icon">➕</div>
          <div class="find-title">Créer ton propre groupe</div>
          <div class="find-sub">Lance ta communauté et invite tes partenaires d'entraînement</div>
          <button class="btn-primary" style="margin-top: 12px; align-self: center">Créer</button>
        </div>
      </div>
    </ScrollArea>
  </div>
</template>

<script setup>
import PageHeader   from '@/components/layout/PageHeader.vue'
import ScrollArea   from '@/components/layout/ScrollArea.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import { groups } from '@/data'
</script>

<style scoped>
.view-wrapper { display: flex; flex-direction: column; height: 100vh; overflow: hidden; }

.groups-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.group-card {
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--r);
  padding: 20px; backdrop-filter: blur(12px);
  transition: all var(--transition); cursor: pointer;
}
.group-card:hover {
  border-color: var(--border-mid); background: var(--surface-hover); transform: translateY(-2px);
  box-shadow: 0 10px 28px rgba(0,0,0,0.2), 0 0 0 1px rgba(186,242,216,0.08), 0 4px 24px rgba(186,242,216,0.07);
}
.group-header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
.group-icon {
  width: 46px; height: 46px; border-radius: 13px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.3rem; border: 1px solid;
}
.group-name { font-size: 0.9rem; font-weight: 700; color: var(--text-1); margin-bottom: 4px; }
.group-tag {
  font-size: 0.6rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;
  padding: 3px 8px; border-radius: 6px; border: 1px solid; display: inline-block;
}
.group-desc { font-size: 0.75rem; color: var(--text-2); line-height: 1.55; margin-bottom: 14px; }
.group-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding-top: 12px; border-top: 1px solid var(--border);
}
.group-members { display: flex; align-items: center; gap: 8px; font-size: 0.7rem; color: var(--text-3); }
.member-stack { display: flex; }
.member-dot {
  width: 22px; height: 22px; border-radius: 50%;
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
</style>
