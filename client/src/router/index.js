import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import HomeView from '../views/HomeView.vue'
import CompanyView from '../views/CompanyView.vue'
import ProjectView from '../views/ProjectView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/admin/login', name: 'admin-login', component: () => import('../views/admin/AdminLogin.vue') },
    { path: '/admin', component: () => import('../views/admin/AdminLayout.vue'), meta: { requiresAdmin: true }, children: [
      { path: '', name: 'admin-overview', component: () => import('../views/admin/AdminOverview.vue') },
      { path: ':resource(projects|companies|categories|hero)', name: 'admin-resource', component: () => import('../views/admin/AdminResources.vue') },
    ] },
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/companies/:companySlug',
      name: 'company',
      component: CompanyView,
    },
    {
      path: '/projects/:projectSlug',
      name: 'project',
      component: ProjectView,
    },
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, top: 116, behavior: 'smooth' }
    return { top: 0 }
  },
})



router.beforeEach(async (to) => {
  if (to.matched.some(record => record.meta.requiresAdmin)) {
    if (!(await useAuth().checkSession())) return { name: 'admin-login' }
  }
})

export default router
