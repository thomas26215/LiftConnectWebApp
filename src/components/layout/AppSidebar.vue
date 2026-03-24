<template>
  <aside class="sidebar">
    <!-- Logo -->
    <div class="sidebar-logo">
      <div class="logo-mark">💪</div>
      <span class="logo-text">Lift<em>Connect</em></span>
    </div>

    <!-- Nav -->
    <nav class="nav">
      <span class="nav-label">Menu</span>

      <RouterLink class="nav-item" to="/dashboard" active-class="active">
        <IconDashboard class="nav-icon" />
        Dashboard
      </RouterLink>
      <RouterLink class="nav-item" to="/entrainements" active-class="active">
        <IconCalendar class="nav-icon" />
        Entraînements
      </RouterLink>
      <RouterLink class="nav-item" to="/exercices" active-class="active">
        <IconClipboard class="nav-icon" />
        Exercices
      </RouterLink>
      <RouterLink class="nav-item" to="/statistiques" active-class="active">
        <IconChart class="nav-icon" />
        Statistiques
      </RouterLink>

      <span class="nav-label" style="margin-top: 8px">Communauté</span>
      <RouterLink class="nav-item" to="/feed" active-class="active">
        <IconChat class="nav-icon" />
        Feed
      </RouterLink>
      <RouterLink class="nav-item" to="/groupes" active-class="active">
        <IconUsers class="nav-icon" />
        Groupes
      </RouterLink>
    </nav>

    <!-- Footer -->
    <div class="sidebar-footer">
      <RouterLink to="/entrainements" class="btn-new">
        <span>+</span> Nouvel entraînement
      </RouterLink>
      <div class="user-card">
        <div class="avatar">TV</div>
        <div class="user-info">
          <div class="user-name">Thomas Venouil</div>
          <div class="user-handle">@thomas.v123456</div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import IconDashboard from '@/components/ui/icons/IconDashboard.vue'
import IconCalendar  from '@/components/ui/icons/IconCalendar.vue'
import IconClipboard from '@/components/ui/icons/IconClipboard.vue'
import IconChart     from '@/components/ui/icons/IconChart.vue'
import IconChat      from '@/components/ui/icons/IconChat.vue'
import IconUsers     from '@/components/ui/icons/IconUsers.vue'
</script>

<style scoped>
.sidebar {
  width: var(--sidebar-w);
  min-height: 100vh;
  background: rgba(8, 16, 36, 0.95);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  position: relative;
  z-index: 10;
  backdrop-filter: blur(20px);
}
.sidebar::after {
  content: '';
  position: absolute;
  top: 0; right: 0;
  width: 1px; height: 100%;
  background: linear-gradient(to bottom, transparent, rgba(186,242,216,0.08) 30%, rgba(186,242,216,0.04) 70%, transparent);
  pointer-events: none;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 22px 18px 20px;
  border-bottom: 1px solid var(--border);
}
.logo-mark {
  width: 32px; height: 32px;
  border-radius: 10px;
  background: linear-gradient(135deg, #baf2d8 0%, #6ee7b7 100%);
  display: flex; align-items: center; justify-content: center;
  font-size: 15px;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(186, 242, 216, 0.25);
}
.logo-text { font-size: 1rem; font-weight: 700; color: var(--text-1); letter-spacing: -0.03em; }
.logo-text em { font-style: normal; color: var(--secondary); font-weight: 400; }

.nav {
  flex: 1;
  padding: 16px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.nav-label {
  font-size: 0.6rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--text-3);
  padding: 10px 10px 6px;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: var(--r-sm);
  color: var(--text-2);
  font-size: 0.87rem;
  font-weight: 500;
  border: 1px solid transparent;
  transition: all var(--transition);
  text-decoration: none;
  user-select: none;
}
.nav-item:hover {
  background: var(--secondary-faint);
  color: var(--text-1);
  border-color: var(--border);
}
.nav-item.active {
  background: rgba(186, 242, 216, 0.1);
  color: var(--secondary);
  border-color: var(--border-mid);
}
.nav-icon {
  width: 18px; height: 18px;
  flex-shrink: 0;
  opacity: 0.7;
}
.nav-item.active .nav-icon,
.nav-item:hover .nav-icon { opacity: 1; }

.sidebar-footer {
  padding: 14px 12px;
  border-top: 1px solid var(--border);
}
.btn-new {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  width: 100%;
  padding: 10px;
  border-radius: var(--r-sm);
  background: var(--secondary);
  color: #071422;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: background var(--transition), transform var(--spring), box-shadow var(--transition);
  margin-bottom: 12px;
  letter-spacing: -0.01em;
  text-decoration: none;
  text-align: center;
}
.btn-new:hover {
  background: #cef7e8;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(186, 242, 216, 0.25);
}
.user-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: var(--r-sm);
  cursor: pointer;
  transition: background var(--transition);
}
.user-card:hover { background: var(--secondary-faint); }
.avatar {
  width: 32px; height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(34,59,101,0.9), rgba(9,31,68,0.9));
  border: 1.5px solid var(--border-mid);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.6rem; font-weight: 700;
  color: var(--secondary);
  flex-shrink: 0;
}
.user-info { flex: 1; min-width: 0; }
.user-name {
  font-size: 0.82rem; font-weight: 600;
  color: var(--text-1);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.user-handle {
  font-size: 0.67rem; color: var(--text-3);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
</style>
