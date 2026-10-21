<template>
  <div class="dashboard-view">
    <div class="welcome-banner">
      <div class="welcome-text">
        <h1 class="welcome-title">¡Hola, {{ authStore.displayName }}!</h1>
        <p class="welcome-desc">
          Panel de administración y control del ecosistema LXIA • Rol activo:
          <span class="role-badge">{{ authStore.userRole }}</span>
        </p>
      </div>
    </div>

    <!-- Módulos disponibles según el rol -->
    <div class="modules-grid">
      <!-- Módulo 1 -->
      <div v-if="authStore.isSuperadmin" class="module-card">
        <div class="card-header">
          <div class="module-icon icon-users">
            <Users :size="24" />
          </div>
          <span class="badge-role">Superadmin</span>
        </div>
        <h3 class="module-title">Gestión de Usuarios y Roles</h3>
        <p class="module-desc">
          Control de acceso RBAC, activación de cuentas de colaboradores y asignación de permisos institucionales.
        </p>
        <router-link to="/admin/usuarios" class="module-btn">Administrar Usuarios &rarr;</router-link>
      </div>

      <!-- Módulo 2 -->
      <div v-if="authStore.isContentManager" class="module-card">
        <div class="card-header">
          <div class="module-icon icon-cms">
            <BookOpen :size="24" />
          </div>
          <span class="badge-role">Gestor de Contenido</span>
        </div>
        <h3 class="module-title">CMS del Portal Web</h3>
        <p class="module-desc">
          Creación, edición y publicación de artículos de autocuidado, categorías y biblioteca de recursos descargables.
        </p>
        <router-link to="/admin/cms/articulos" class="module-btn">Gestionar Artículos &rarr;</router-link>
      </div>

      <!-- Módulo 3 -->
      <div v-if="authStore.isResearcher" class="module-card">
        <div class="card-header">
          <div class="module-icon icon-rag">
            <Database :size="24" />
          </div>
          <span class="badge-role">Investigación</span>
        </div>
        <h3 class="module-title">Base de Conocimiento RAG</h3>
        <p class="module-desc">
          Indexación de fuentes documentales con Firebase Storage (0 MB en Render) y auditoría de similitud de coseno.
        </p>
        <router-link to="/admin/rag/documentos" class="module-btn">Base de Conocimiento &rarr;</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/authStore'
import { Users, BookOpen, Database } from '@lucide/vue'

const authStore = useAuthStore()
</script>

<style scoped>
.dashboard-view {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.welcome-banner {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.welcome-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 0.35rem;
}

.welcome-desc {
  color: #64748b;
  font-size: 0.95rem;
}

.role-badge {
  background: #ede9fe;
  color: #6d28d9;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.8rem;
}

.modules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.module-card {
  background: white;
  padding: 1.75rem;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s, box-shadow 0.2s;
}

.module-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.module-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-users {
  background: #e0f2fe;
  color: #0284c7;
}

.icon-cms {
  background: #ede9fe;
  color: #7c3aed;
}

.icon-rag {
  background: #fef3c7;
  color: #d97706;
}

.badge-role {
  font-size: 0.72rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
}

.module-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 0.5rem;
}

.module-desc {
  font-size: 0.88rem;
  color: #64748b;
  line-height: 1.55;
  margin-bottom: 1.5rem;
  flex: 1;
}

.module-btn {
  font-weight: 600;
  color: #7c3aed;
  text-decoration: none;
  font-size: 0.92rem;
}

.module-btn:hover {
  text-decoration: underline;
}
</style>
