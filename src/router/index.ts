import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import storage from '@/lib/storage'

// Layouts
import PublicLayout from '@/layouts/PublicLayout.vue'
import AdminLayout from '@/layouts/AdminLayout.vue'

// Vistas Públicas
import HomeView from '@/views/public/HomeView.vue'
import ArticlesView from '@/views/public/ArticlesView.vue'
import ArticleDetailView from '@/views/public/ArticleDetailView.vue'
import ResourcesView from '@/views/public/ResourcesView.vue'
import ChatView from '@/views/public/ChatView.vue'
import AlexiaAvatarView from '@/views/public/AlexiaAvatarView.vue'

// Vistas de Autenticación
import LoginView from '@/views/auth/LoginView.vue'

// Vistas Administrativas
import DashboardView from '@/views/admin/DashboardView.vue'
import ProfileView from '@/views/admin/ProfileView.vue'
import UsersManagementView from '@/views/admin/UsersManagementView.vue'
import CmsArticlesView from '@/views/admin/CmsArticlesView.vue'
import CmsCategoriesView from '@/views/admin/CmsCategoriesView.vue'
import CmsResourcesView from '@/views/admin/CmsResourcesView.vue'
import KnowledgeDocsView from '@/views/admin/KnowledgeDocsView.vue'
import TestSearchView from '@/views/admin/TestSearchView.vue'

const routes: RouteRecordRaw[] = [
  // --- Rutas Públicas (Portal Ciudadano y Alexia) ---
  {
    path: '/',
    component: PublicLayout,
    children: [
      {
        path: '',
        name: 'Home',
        component: HomeView,
        meta: { title: 'Inicio • LXIA TransLúcidas' },
      },
      {
        path: 'articulos',
        name: 'Articles',
        component: ArticlesView,
        meta: { title: 'Guías de Autocuidado' },
      },
      {
        path: 'articulos/:slug',
        name: 'ArticleDetail',
        component: ArticleDetailView,
        meta: { title: 'Lectura de Artículo' },
      },
      {
        path: 'recursos',
        name: 'Resources',
        component: ResourcesView,
        meta: { title: 'Biblioteca de Recursos' },
      },
      {
        path: 'chat',
        name: 'Chat',
        component: ChatView,
        meta: { title: 'Chat con Alexia' },
      },
      {
        path: 'alexia',
        name: 'AlexiaAvatar',
        component: AlexiaAvatarView,
        meta: { title: 'Avatar Interactivo Alexia' },
      },
    ],
  },

  // --- Ruta de Acceso / Login ---
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { title: 'Acceso Institucional' },
    beforeEnter: (to, from, next) => {
      // Si ya está autenticado, redirigir al panel admin
      if (storage.getToken()) {
        next('/admin')
      } else {
        next()
      }
    },
  },

  // --- Rutas Administrativas Protegidas ---
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'AdminDashboard',
        component: DashboardView,
        meta: { requiresAuth: true, title: 'Panel General' },
      },
      {
        path: 'perfil',
        name: 'AdminProfile',
        component: ProfileView,
        meta: { requiresAuth: true, title: 'Mi Perfil' },
      },
      // Módulo 1: Usuarios (Solo Superadmin)
      {
        path: 'usuarios',
        name: 'AdminUsers',
        component: UsersManagementView,
        meta: { requiresAuth: true, roles: ['SUPERADMIN'], title: 'Gestión de Usuarios' },
      },
      // Módulo 2: CMS de Contenidos (Content Manager / Superadmin)
      {
        path: 'cms/articulos',
        name: 'AdminCmsArticles',
        component: CmsArticlesView,
        meta: { requiresAuth: true, roles: ['SUPERADMIN', 'CONTENT_MANAGER'], title: 'CMS Artículos' },
      },
      {
        path: 'cms/categorias',
        name: 'AdminCmsCategories',
        component: CmsCategoriesView,
        meta: { requiresAuth: true, roles: ['SUPERADMIN', 'CONTENT_MANAGER'], title: 'CMS Categorías' },
      },
      {
        path: 'cms/recursos',
        name: 'AdminCmsResources',
        component: CmsResourcesView,
        meta: { requiresAuth: true, roles: ['SUPERADMIN', 'CONTENT_MANAGER'], title: 'CMS Recursos' },
      },
      // Módulo 3: Base de Conocimiento RAG (Researcher / Superadmin)
      {
        path: 'rag/documentos',
        name: 'AdminKnowledgeDocs',
        component: KnowledgeDocsView,
        meta: { requiresAuth: true, roles: ['SUPERADMIN', 'RESEARCHER'], title: 'Base de Conocimiento RAG' },
      },
      {
        path: 'rag/test-search',
        name: 'AdminTestSearch',
        component: TestSearchView,
        meta: { requiresAuth: true, roles: ['SUPERADMIN', 'RESEARCHER'], title: 'Consola de Similitud' },
      },
    ],
  },

  // Ruta 404 / Fallback
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

// Navigation Guards para autenticación y RBAC
router.beforeEach((to, from, next) => {
  // Actualizar título de la pestaña
  if (to.meta?.title) {
    document.title = `${to.meta.title} • LXIA`
  }

  const token = storage.getToken()
  const user = storage.getUser()

  // 1. Verificar si la ruta requiere autenticación
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    if (!token) {
      next({
        path: '/login',
        query: { redirect: to.fullPath },
      })
      return
    }

    // 2. Verificar permisos por rol si están definidos
    const requiredRoles = to.meta.roles as string[] | undefined
    if (requiredRoles && requiredRoles.length > 0) {
      const userRole = user?.role
      const isSuperadmin = userRole === 'SUPERADMIN' || user?.is_superuser

      if (!isSuperadmin && (!userRole || !requiredRoles.includes(userRole))) {
        alert('No cuentas con los permisos requeridos para acceder a esta sección.')
        next('/admin')
        return
      }
    }
  }

  next()
})

export default router
