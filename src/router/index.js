import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  // ── Auth (publiques) ────────────────────────────────────────
  {
    path: '/login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { public: true, guestOnly: true },
  },
  {
    path: '/register',
    component: () => import('@/views/auth/RegisterView.vue'),
    meta: { public: true, guestOnly: true },
  },
  {
    path: '/forgot-password',
    component: () => import('@/views/auth/ForgotPasswordView.vue'),
    meta: { public: true, guestOnly: true },
  },

  // ── App (protégées) ─────────────────────────────────────────
  { path: '/',              redirect: '/dashboard' },
  { path: '/dashboard',     component: () => import('@/views/DashboardView.vue'),     meta: { title: 'Dashboard' } },
  { path: '/entrainements', component: () => import('@/views/EntrainementsView.vue'), meta: { title: 'Entraînements' } },
  { path: '/exercices',     component: () => import('@/views/ExercicesView.vue'),     meta: { title: 'Exercices' } },
  { path: '/statistiques',  component: () => import('@/views/StatistiquesView.vue'),  meta: { title: 'Statistiques' } },
  { path: '/profil',        component: () => import('@/views/ProfilView.vue'),        meta: { title: 'Profil' } },
  { path: '/feed',          component: () => import('@/views/FeedView.vue'),          meta: { title: 'Feed' } },
  { path: '/groupes',       component: () => import('@/views/GroupesView.vue'),       meta: { title: 'Groupes' } },

  // ── 404 ─────────────────────────────────────────────────────
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// ── Navigation guard ─────────────────────────────────────────────
router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  // Attend que Firebase ait vérifié la session au premier chargement
  if (authStore.loading) {
    await authStore.init()
  }

  const isPublic  = to.meta.public
  const guestOnly = to.meta.guestOnly
  const loggedIn  = authStore.isLoggedIn

  // Page réservée aux guests (login/register) → redirige si déjà connecté
  if (guestOnly && loggedIn) return '/dashboard'

  // Page protégée → redirige vers login si non connecté
  if (!isPublic && !loggedIn) return '/login'
})

export default router
