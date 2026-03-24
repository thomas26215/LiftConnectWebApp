import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/',               redirect: '/dashboard' },
  { path: '/dashboard',      component: () => import('@/views/DashboardView.vue'),      meta: { title: 'Dashboard' } },
  { path: '/entrainements',  component: () => import('@/views/EntrainementsView.vue'),  meta: { title: 'Entraînements' } },
  { path: '/exercices',      component: () => import('@/views/ExercicesView.vue'),      meta: { title: 'Exercices' } },
  { path: '/statistiques',   component: () => import('@/views/StatistiquesView.vue'),   meta: { title: 'Statistiques' } },
  { path: '/feed',           component: () => import('@/views/FeedView.vue'),           meta: { title: 'Feed' } },
  { path: '/groupes',        component: () => import('@/views/GroupesView.vue'),        meta: { title: 'Groupes' } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
