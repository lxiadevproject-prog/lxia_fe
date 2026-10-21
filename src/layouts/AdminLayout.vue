<template>
  <div class="admin-wrapper" :class="{ 'sidebar-collapsed': !sidebarOpen }">
    <!-- Barra Lateral (Sidebar) -->
    <aside class="admin-sidebar">
      <div class="sidebar-brand">
        <div class="brand-logo">LX</div>
        <div class="brand-info" v-show="sidebarOpen">
          <span class="brand-name">LXIA Admin</span>
          <span class="brand-role">{{ authStore.userRole }}</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <!-- Dashboard -->
        <router-link to="/admin" class="nav-link" active-class="nav-link--active" exact>
          <LayoutDashboard :size="20" class="nav-icon" />
          <span class="nav-text" v-show="sidebarOpen">Panel General</span>
        </router-link>

        <!-- Módulo 1: Usuarios (Solo Superadmin) -->
        <div class="nav-group-label" v-show="sidebarOpen && authStore.isSuperadmin">ADMINISTRACIÓN</div>
        <router-link
          v-if="authStore.isSuperadmin"
          to="/admin/usuarios"
          class="nav-link"
          active-class="nav-link--active"
        >
          <Users :size="20" class="nav-icon" />
          <span class="nav-text" v-show="sidebarOpen">Gestión de Usuarios</span>
        </router-link>

        <!-- Módulo 2: CMS de Contenidos (Content Manager / Superadmin) -->
        <div class="nav-group-label" v-show="sidebarOpen && authStore.isContentManager">PORTAL Y CONTENIDOS</div>
        <router-link
          v-if="authStore.isContentManager"
          to="/admin/cms/articulos"
          class="nav-link"
          active-class="nav-link--active"
        >
          <BookOpen :size="20" class="nav-icon" />
          <span class="nav-text" v-show="sidebarOpen">Artículos y Guías</span>
        </router-link>

        <router-link
          v-if="authStore.isContentManager"
          to="/admin/cms/categorias"
          class="nav-link"
          active-class="nav-link--active"
        >
          <Layers :size="20" class="nav-icon" />
          <span class="nav-text" v-show="sidebarOpen">Categorías</span>
        </router-link>

        <router-link
          v-if="authStore.isContentManager"
          to="/admin/cms/recursos"
          class="nav-link"
          active-class="nav-link--active"
        >
          <FileDown :size="20" class="nav-icon" />
          <span class="nav-text" v-show="sidebarOpen">Recursos y Archivos</span>
        </router-link>

        <!-- Módulo 3: Base de Conocimiento RAG (Researcher / Superadmin) -->
        <div class="nav-group-label" v-show="sidebarOpen && authStore.isResearcher">IA CONVERSACIONAL Y RAG</div>
        <router-link
          v-if="authStore.isResearcher"
          to="/admin/rag/documentos"
          class="nav-link"
          active-class="nav-link--active"
        >
          <Database :size="20" class="nav-icon" />
          <span class="nav-text" v-show="sidebarOpen">Base de Conocimiento</span>
        </router-link>

        <router-link
          v-if="authStore.isResearcher"
          to="/admin/rag/test-search"
          class="nav-link"
          active-class="nav-link--active"
        >
          <Search :size="20" class="nav-icon" />
          <span class="nav-text" v-show="sidebarOpen">Test de Similitud</span>
        </router-link>

        <!-- Configuración / Perfil -->
        <div class="nav-group-label" v-show="sidebarOpen">CUENTA</div>
        <router-link to="/admin/perfil" class="nav-link" active-class="nav-link--active">
          <UserCheck :size="20" class="nav-icon" />
          <span class="nav-text" v-show="sidebarOpen">Mi Perfil</span>
        </router-link>

        <router-link to="/" class="nav-link nav-link--portal" target="_blank">
          <ExternalLink :size="20" class="nav-icon" />
          <span class="nav-text" v-show="sidebarOpen">Ver Portal Web</span>
        </router-link>
      </nav>

      <!-- Botón de colapsar sidebar al fondo -->
      <div class="sidebar-footer">
        <button class="btn-toggle-sidebar" @click="sidebarOpen = !sidebarOpen" :title="sidebarOpen ? 'Colapsar' : 'Expandir'">
          <ChevronLeft v-if="sidebarOpen" :size="18" />
          <ChevronRight v-else :size="18" />
        </button>
      </div>
    </aside>

    <!-- Área de Contenido Principal -->
    <div class="admin-main-container">
      <!-- Navbar Superior -->
      <header class="admin-navbar">
        <div class="navbar-left">
          <button class="btn-menu-mobile" @click="sidebarOpen = !sidebarOpen">
            <Menu :size="20" />
          </button>
          <h2 class="page-header-title">{{ currentRouteName }}</h2>
        </div>

        <div class="navbar-right">
          <div class="user-profile-badge">
            <div class="avatar-circle">
              {{ (authStore.user?.username || 'U').charAt(0).toUpperCase() }}
            </div>
            <div class="user-meta">
              <span class="user-username">{{ authStore.displayName }}</span>
              <span class="user-role-label">{{ authStore.userRole }}</span>
            </div>
          </div>

          <button class="btn-logout" @click="handleLogout" title="Cerrar sesión">
            <LogOut :size="18" />
            <span class="btn-logout-text">Salir</span>
          </button>
        </div>
      </header>

      <!-- Vista Activa -->
      <main class="admin-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Layers,
  FileDown,
  Database,
  Search,
  UserCheck,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Menu,
  LogOut,
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const sidebarOpen = ref(true)

const currentRouteName = computed(() => {
  return (route.meta?.title as string) || 'Panel Administrativo'
})

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.admin-wrapper {
  display: flex;
  min-height: 100vh;
  background-color: #f1f5f9;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #0f172a;
}

/* Sidebar */
.admin-sidebar {
  width: 260px;
  background: #0f172a;
  color: #94a3b8;
  display: flex;
  flex-direction: column;
  transition: width 0.25s ease;
  position: sticky;
  top: 0;
  height: 100vh;
  z-index: 40;
  border-right: 1px solid #1e293b;
}

.sidebar-collapsed .admin-sidebar {
  width: 72px;
}

.sidebar-brand {
  padding: 1.25rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-bottom: 1px solid #1e293b;
}

.brand-logo {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #7c3aed, #4f46e5);
  color: white;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
  flex-shrink: 0;
}

.brand-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  white-space: nowrap;
}

.brand-name {
  font-weight: 700;
  color: #f8fafc;
  font-size: 1.05rem;
}

.brand-role {
  font-size: 0.7rem;
  color: #a78bfa;
  font-weight: 600;
  text-transform: uppercase;
}

/* Nav */
.sidebar-nav {
  flex: 1;
  padding: 1rem 0.65rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  overflow-y: auto;
}

.nav-group-label {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #475569;
  padding: 0.85rem 0.65rem 0.35rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.65rem 0.85rem;
  border-radius: 8px;
  color: #94a3b8;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.nav-link:hover {
  background: #1e293b;
  color: #f8fafc;
}

.nav-link--active {
  background: #312e81;
  color: #c7d2fe;
  font-weight: 600;
}

.nav-link--active .nav-icon {
  color: #a78bfa;
}

.nav-link--portal {
  margin-top: auto;
  border: 1px dashed #334155;
  color: #38bdf8;
}

.nav-link--portal:hover {
  background: #082f49;
  color: #7dd3fc;
}

.sidebar-footer {
  padding: 0.75rem;
  border-top: 1px solid #1e293b;
  display: flex;
  justify-content: flex-end;
}

.btn-toggle-sidebar {
  background: #1e293b;
  border: none;
  color: #94a3b8;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-toggle-sidebar:hover {
  background: #334155;
  color: white;
}

/* Main Area */
.admin-main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.admin-navbar {
  height: 64px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  position: sticky;
  top: 0;
  z-index: 30;
}

.navbar-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.btn-menu-mobile {
  display: none;
  background: transparent;
  border: none;
  cursor: pointer;
}

.page-header-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.user-profile-badge {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.avatar-circle {
  width: 36px;
  height: 36px;
  background: #ede9fe;
  color: #6d28d9;
  font-weight: 700;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
}

.user-meta {
  display: flex;
  flex-direction: column;
}

.user-username {
  font-weight: 600;
  font-size: 0.88rem;
  color: #1e293b;
}

.user-role-label {
  font-size: 0.68rem;
  color: #64748b;
  font-weight: 600;
}

.btn-logout {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  background: #fee2e2;
  color: #b91c1c;
  border: none;
  padding: 0.45rem 0.85rem;
  border-radius: 6px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-logout:hover {
  background: #fecaca;
}

.admin-content {
  flex: 1;
  padding: 1.75rem;
}
</style>
