<template>
  <div class="users-view">
    <!-- Encabezado y Estadísticas Rápidas -->
    <div class="view-header">
      <div>
        <h2 class="view-title">Control de Usuarios y Permisos (RBAC)</h2>
        <p class="view-subtitle">
          Administración de cuentas institucionales, asignación de roles y estados de acceso.
        </p>
      </div>
      <button class="btn-primary" @click="openCreateModal">
        <UserPlus :size="18" />
        <span>Nuevo Usuario</span>
      </button>
    </div>

    <!-- Tarjetas de métricas -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon stat-icon--purple">
          <Users :size="20" />
        </div>
        <div class="stat-content">
          <span class="stat-label">Total Cuentas</span>
          <span class="stat-value">{{ users.length }}</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon stat-icon--violet">
          <Shield :size="20" />
        </div>
        <div class="stat-content">
          <span class="stat-label">Superadmins</span>
          <span class="stat-value">{{ countByRole('SUPERADMIN') }}</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon stat-icon--blue">
          <Edit3 :size="20" />
        </div>
        <div class="stat-content">
          <span class="stat-label">Gestores de Contenido</span>
          <span class="stat-value">{{ countByRole('CONTENT_MANAGER') }}</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon stat-icon--amber">
          <CheckCircle2 :size="20" />
        </div>
        <div class="stat-content">
          <span class="stat-label">Investigadores</span>
          <span class="stat-value">{{ countByRole('RESEARCHER') }}</span>
        </div>
      </div>
    </div>

    <!-- Barra de Filtros y Búsqueda -->
    <div class="filters-card">
      <div class="search-box">
        <Search :size="18" class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar por nombre, usuario o email..."
          class="search-input"
        />
        <button v-if="searchQuery" class="btn-clear-search" @click="searchQuery = ''">
          <X :size="16" />
        </button>
      </div>

      <div class="filters-group">
        <!-- Filtro por Rol -->
        <div class="role-pills">
          <button
            class="pill-btn"
            :class="{ active: selectedRole === 'ALL' }"
            @click="selectedRole = 'ALL'"
          >
            Todos
          </button>
          <button
            class="pill-btn"
            :class="{ active: selectedRole === 'SUPERADMIN' }"
            @click="selectedRole = 'SUPERADMIN'"
          >
            Superadmins
          </button>
          <button
            class="pill-btn"
            :class="{ active: selectedRole === 'CONTENT_MANAGER' }"
            @click="selectedRole = 'CONTENT_MANAGER'"
          >
            Gestores
          </button>
          <button
            class="pill-btn"
            :class="{ active: selectedRole === 'RESEARCHER' }"
            @click="selectedRole = 'RESEARCHER'"
          >
            Investigadores
          </button>
        </div>

        <!-- Filtro por Estado -->
        <select v-model="selectedStatus" class="status-select">
          <option value="ALL">Todos los estados</option>
          <option value="ACTIVE">Solo Activos</option>
          <option value="INACTIVE">Solo Inactivos</option>
        </select>

        <button class="btn-reload" title="Recargar lista" @click="fetchUsers">
          <RefreshCw :size="16" :class="{ spinning: loading }" />
        </button>
      </div>
    </div>

    <!-- Alertas globales de éxito / error -->
    <div v-if="successNotification" class="alert-banner alert-banner--success">
      <CheckCircle2 :size="18" />
      <span>{{ successNotification }}</span>
      <button class="btn-close-alert" @click="successNotification = ''">
        <X :size="14" />
      </button>
    </div>

    <div v-if="errorNotification" class="alert-banner alert-banner--error">
      <XCircle :size="18" />
      <span>{{ errorNotification }}</span>
      <button class="btn-close-alert" @click="errorNotification = ''">
        <X :size="14" />
      </button>
    </div>

    <!-- Tabla de Usuarios -->
    <div class="table-card">
      <div v-if="loading && users.length === 0" class="empty-state">
        <div class="spinner"></div>
        <p>Cargando directorio de usuarios...</p>
      </div>

      <div v-else-if="filteredUsers.length === 0" class="empty-state">
        <Users :size="40" class="empty-icon" />
        <h4 class="empty-title">No se encontraron usuarios</h4>
        <p class="empty-desc">
          No hay registros que coincidan con los criterios de búsqueda o filtros seleccionados.
        </p>
      </div>

      <div v-else class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Contacto</th>
              <th>Rol Institucional</th>
              <th>Organización / Teléfono</th>
              <th>Estado</th>
              <th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in filteredUsers" :key="u.id" :class="{ 'row-inactive': !u.is_active }">
              <td>
                <div class="user-cell">
                  <div class="user-avatar" :class="'avatar-' + u.role?.toLowerCase()">
                    {{ getUserInitials(u) }}
                  </div>
                  <div class="user-info">
                    <span class="user-name">
                      {{ getFullName(u) }}
                    </span>
                    <span class="user-handle">@{{ u.username }}</span>
                  </div>
                </div>
              </td>
              <td>
                <span class="user-email">{{ u.email || '—' }}</span>
              </td>
              <td>
                <span class="role-badge" :class="'role-' + u.role?.toLowerCase()">
                  {{ u.role_display || u.role }}
                </span>
              </td>
              <td>
                <div class="meta-cell">
                  <span v-if="u.institution" class="meta-item">
                    <Building :size="13" />
                    <span>{{ u.institution }}</span>
                  </span>
                  <span v-if="u.phone" class="meta-item">
                    <Phone :size="13" />
                    <span>{{ u.phone }}</span>
                  </span>
                  <span v-if="!u.institution && !u.phone" class="meta-none">—</span>
                </div>
              </td>
              <td>
                <button
                  class="status-toggle-btn"
                  :class="u.is_active ? 'status-active' : 'status-inactive'"
                  :disabled="isCurrentUser(u)"
                  :title="isCurrentUser(u) ? 'No puedes cambiar tu propio estado' : (u.is_active ? 'Click para desactivar' : 'Click para activar')"
                  @click="toggleUserStatus(u)"
                >
                  <span class="status-dot"></span>
                  <span>{{ u.is_active ? 'Activo' : 'Inactivo' }}</span>
                </button>
              </td>
              <td class="text-right">
                <div class="action-buttons">
                  <button
                    class="btn-icon"
                    title="Editar usuario"
                    @click="openEditModal(u)"
                  >
                    <Edit3 :size="16" />
                  </button>
                  <button
                    class="btn-icon btn-icon--delete"
                    :disabled="isCurrentUser(u)"
                    :title="isCurrentUser(u) ? 'No puedes eliminar tu propia cuenta' : 'Eliminar usuario'"
                    @click="openDeleteModal(u)"
                  >
                    <Trash2 :size="16" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL 1: Crear Usuario -->
    <div v-if="showCreateModal" class="modal-backdrop" @click.self="closeCreateModal">
      <div class="modal-card">
        <div class="modal-header">
          <div class="modal-icon-badge">
            <UserPlus :size="20" />
          </div>
          <div>
            <h3 class="modal-title">Nuevo Usuario Institucional</h3>
            <p class="modal-subtitle">Asigna credenciales y rol en el sistema</p>
          </div>
          <button class="modal-close-btn" @click="closeCreateModal">
            <X :size="18" />
          </button>
        </div>

        <div v-if="modalError" class="modal-alert-error">
          <XCircle :size="16" />
          <span>{{ modalError }}</span>
        </div>

        <form @submit.prevent="handleCreateUser" class="modal-form">
          <div class="form-row">
            <div class="form-group flex-1">
              <label class="form-label">Nombre de Usuario *</label>
              <input
                v-model="createForm.username"
                type="text"
                required
                placeholder="Ej: carla_investigadora"
                class="form-input"
              />
            </div>
            <div class="form-group flex-1">
              <label class="form-label">Correo Electrónico *</label>
              <input
                v-model="createForm.email"
                type="email"
                required
                placeholder="usuario@transluz.org"
                class="form-input"
              />
            </div>
          </div>

          <div class="form-group">
            <div class="label-row">
              <label class="form-label">Contraseña de Acceso *</label>
              <button type="button" class="btn-link" @click="generateRandomPassword">
                Generar aleatoria
              </button>
            </div>
            <div class="input-with-action">
              <input
                v-model="createForm.password"
                :type="showCreatePassword ? 'text' : 'password'"
                required
                minlength="8"
                placeholder="Mínimo 8 caracteres"
                class="form-input"
              />
              <button
                type="button"
                class="btn-inline-toggle"
                @click="showCreatePassword = !showCreatePassword"
              >
                <EyeOff v-if="showCreatePassword" :size="16" />
                <Eye v-else :size="16" />
              </button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Rol Institucional (RBAC) *</label>
            <select v-model="createForm.role" class="form-select" required>
              <option value="CONTENT_MANAGER">Gestor de Contenido (Artículos y Recursos)</option>
              <option value="RESEARCHER">Investigador / RAG (Documentos y Similitud)</option>
              <option value="SUPERADMIN">Superadministrador (Acceso Total)</option>
            </select>
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label class="form-label">Nombres</label>
              <input
                v-model="createForm.first_name"
                type="text"
                placeholder="Ej: Carla"
                class="form-input"
              />
            </div>
            <div class="form-group flex-1">
              <label class="form-label">Apellidos</label>
              <input
                v-model="createForm.last_name"
                type="text"
                placeholder="Ej: Mendoza"
                class="form-input"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label class="form-label">Institución u Organización</label>
              <input
                v-model="createForm.institution"
                type="text"
                placeholder="Ej: Red TransLúcidas Bogotá"
                class="form-input"
              />
            </div>
            <div class="form-group flex-1">
              <label class="form-label">Teléfono de Contacto</label>
              <input
                v-model="createForm.phone"
                type="text"
                placeholder="Ej: +57 300 123 4567"
                class="form-input"
              />
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-secondary" @click="closeCreateModal">
              Cancelar
            </button>
            <button type="submit" class="btn-primary" :disabled="modalSubmitting">
              <span v-if="modalSubmitting" class="spinner-small"></span>
              <span>{{ modalSubmitting ? 'Creando...' : 'Crear Usuario' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL 2: Editar Usuario -->
    <div v-if="showEditModal && editingUser" class="modal-backdrop" @click.self="closeEditModal">
      <div class="modal-card">
        <div class="modal-header">
          <div class="modal-icon-badge modal-icon-badge--edit">
            <Edit3 :size="20" />
          </div>
          <div>
            <h3 class="modal-title">Editar Usuario</h3>
            <p class="modal-subtitle">Modificando datos de @{{ editingUser.username }}</p>
          </div>
          <button class="modal-close-btn" @click="closeEditModal">
            <X :size="18" />
          </button>
        </div>

        <div v-if="modalError" class="modal-alert-error">
          <XCircle :size="16" />
          <span>{{ modalError }}</span>
        </div>

        <form @submit.prevent="handleUpdateUser" class="modal-form">
          <div class="form-group">
            <label class="form-label">Correo Electrónico</label>
            <input
              v-model="editForm.email"
              type="email"
              placeholder="correo@ejemplo.org"
              class="form-input"
            />
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label class="form-label">Nombres</label>
              <input
                v-model="editForm.first_name"
                type="text"
                class="form-input"
              />
            </div>
            <div class="form-group flex-1">
              <label class="form-label">Apellidos</label>
              <input
                v-model="editForm.last_name"
                type="text"
                class="form-input"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Rol Institucional (RBAC)</label>
            <select
              v-model="editForm.role"
              class="form-select"
              :disabled="isCurrentUser(editingUser)"
            >
              <option value="CONTENT_MANAGER">Gestor de Contenido (Artículos y Recursos)</option>
              <option value="RESEARCHER">Investigador / RAG (Documentos y Similitud)</option>
              <option value="SUPERADMIN">Superadministrador (Acceso Total)</option>
            </select>
            <span v-if="isCurrentUser(editingUser)" class="input-hint">
              No puedes degradar tu propio rol desde aquí.
            </span>
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label class="form-label">Institución u Organización</label>
              <input
                v-model="editForm.institution"
                type="text"
                class="form-input"
              />
            </div>
            <div class="form-group flex-1">
              <label class="form-label">Teléfono</label>
              <input
                v-model="editForm.phone"
                type="text"
                class="form-input"
              />
            </div>
          </div>

          <div class="form-group-checkbox">
            <label class="checkbox-container">
              <input
                v-model="editForm.is_active"
                type="checkbox"
                :disabled="isCurrentUser(editingUser)"
              />
              <span class="checkbox-label">
                <strong>Cuenta activa</strong> (permite iniciar sesión en el panel institucional)
              </span>
            </label>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-secondary" @click="closeEditModal">
              Cancelar
            </button>
            <button type="submit" class="btn-primary" :disabled="modalSubmitting">
              <span v-if="modalSubmitting" class="spinner-small"></span>
              <span>{{ modalSubmitting ? 'Guardando...' : 'Guardar Cambios' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL 3: Confirmar Eliminación -->
    <div v-if="showDeleteModal && deletingUser" class="modal-backdrop" @click.self="closeDeleteModal">
      <div class="modal-card modal-card--sm">
        <div class="modal-header">
          <div class="modal-icon-badge modal-icon-badge--danger">
            <Trash2 :size="20" />
          </div>
          <div>
            <h3 class="modal-title">Eliminar Usuario</h3>
            <p class="modal-subtitle">Acción irreversible</p>
          </div>
          <button class="modal-close-btn" @click="closeDeleteModal">
            <X :size="18" />
          </button>
        </div>

        <div class="delete-content">
          <p>
            ¿Estás segurx de que deseas eliminar permanentemente a
            <strong>@{{ deletingUser.username }}</strong>
            ({{ deletingUser.email || 'sin email' }})?
          </p>
          <p class="delete-warning">
            Esta cuenta perderá el acceso a las funciones administrativas y RAG de LXIA.
          </p>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-secondary" @click="closeDeleteModal">
            Cancelar
          </button>
          <button
            type="button"
            class="btn-danger"
            :disabled="modalSubmitting"
            @click="handleConfirmDelete"
          >
            <span v-if="modalSubmitting" class="spinner-small"></span>
            <span>{{ modalSubmitting ? 'Eliminando...' : 'Sí, eliminar cuenta' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import authService from '@/services/authService'
import type { UserProfile, UserCreatePayload, UserUpdatePayload, Role } from '@/types/auth'
import {
  Users,
  UserPlus,
  Shield,
  Edit3,
  CheckCircle2,
  XCircle,
  Search,
  X,
  RefreshCw,
  Building,
  Phone,
  Trash2,
  Eye,
  EyeOff,
} from '@lucide/vue'

const authStore = useAuthStore()

// Estado principal
const users = ref<UserProfile[]>([])
const loading = ref<boolean>(false)
const searchQuery = ref<string>('')
const selectedRole = ref<string>('ALL')
const selectedStatus = ref<string>('ALL')

// Notificaciones
const successNotification = ref<string>('')
const errorNotification = ref<string>('')

// Modales
const showCreateModal = ref<boolean>(false)
const showEditModal = ref<boolean>(false)
const showDeleteModal = ref<boolean>(false)
const modalSubmitting = ref<boolean>(false)
const modalError = ref<string>('')
const showCreatePassword = ref<boolean>(false)

const editingUser = ref<UserProfile | null>(null)
const deletingUser = ref<UserProfile | null>(null)

// Formularios
const createForm = reactive<UserCreatePayload>({
  username: '',
  email: '',
  password: '',
  role: 'CONTENT_MANAGER',
  first_name: '',
  last_name: '',
  phone: '',
  institution: '',
})

const editForm = reactive<UserUpdatePayload>({
  email: '',
  role: 'CONTENT_MANAGER',
  first_name: '',
  last_name: '',
  phone: '',
  institution: '',
  is_active: true,
})

// Computadas
const filteredUsers = computed(() => {
  return users.value.filter((u) => {
    // 1. Filtro por Rol
    if (selectedRole.value !== 'ALL' && u.role !== selectedRole.value) {
      return false
    }

    // 2. Filtro por Estado
    if (selectedStatus.value === 'ACTIVE' && !u.is_active) {
      return false
    }
    if (selectedStatus.value === 'INACTIVE' && u.is_active) {
      return false
    }

    // 3. Filtro por Búsqueda de Texto
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim()
      const matchUsername = u.username.toLowerCase().includes(q)
      const matchEmail = (u.email || '').toLowerCase().includes(q)
      const matchName = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase().includes(q)
      const matchInst = (u.institution || '').toLowerCase().includes(q)
      return matchUsername || matchEmail || matchName || matchInst
    }

    return true
  })
})

function countByRole(role: Role): number {
  return users.value.filter((u) => u.role === role).length
}

function isCurrentUser(u: UserProfile): boolean {
  return authStore.user?.id === u.id || authStore.user?.username === u.username
}

function getUserInitials(u: UserProfile): string {
  if (u.first_name && u.last_name) {
    return `${u.first_name[0]}${u.last_name[0]}`.toUpperCase()
  }
  if (u.first_name) {
    return u.first_name.slice(0, 2).toUpperCase()
  }
  return u.username.slice(0, 2).toUpperCase()
}

function getFullName(u: UserProfile): string {
  if (u.first_name || u.last_name) {
    return `${u.first_name || ''} ${u.last_name || ''}`.trim()
  }
  return u.username
}

// Cargar usuarios
async function fetchUsers() {
  loading.value = true
  errorNotification.value = ''
  try {
    const res = await authService.getUsers()
    users.value = res.results
  } catch (err: any) {
    errorNotification.value = err.message || 'Error al cargar usuarios desde el servidor'
  } finally {
    loading.value = false
  }
}

// Modal Crear
function openCreateModal() {
  modalError.value = ''
  createForm.username = ''
  createForm.email = ''
  createForm.password = ''
  createForm.role = 'CONTENT_MANAGER'
  createForm.first_name = ''
  createForm.last_name = ''
  createForm.phone = ''
  createForm.institution = ''
  showCreatePassword.value = false
  showCreateModal.value = true
}

function closeCreateModal() {
  showCreateModal.value = false
  modalError.value = ''
}

function generateRandomPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*'
  let pwd = ''
  for (let i = 0; i < 12; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  createForm.password = pwd
  showCreatePassword.value = true
}

async function handleCreateUser() {
  modalError.value = ''
  modalSubmitting.value = true
  try {
    const newUser = await authService.createUser(createForm)
    users.value.unshift(newUser)
    successNotification.value = `Usuario @${newUser.username} creado exitosamente con rol ${newUser.role_display || newUser.role}.`
    closeCreateModal()
  } catch (err: any) {
    modalError.value = err.message || 'Error al crear el usuario. Verifica los campos.'
  } finally {
    modalSubmitting.value = false
  }
}

// Modal Editar
function openEditModal(u: UserProfile) {
  modalError.value = ''
  editingUser.value = u
  editForm.email = u.email || ''
  editForm.role = u.role
  editForm.first_name = u.first_name || ''
  editForm.last_name = u.last_name || ''
  editForm.phone = u.phone || ''
  editForm.institution = u.institution || ''
  editForm.is_active = u.is_active
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
  editingUser.value = null
  modalError.value = ''
}

async function handleUpdateUser() {
  if (!editingUser.value) return
  modalError.value = ''
  modalSubmitting.value = true
  try {
    const updated = await authService.updateUser(editingUser.value.id, editForm)
    const idx = users.value.findIndex((u) => u.id === updated.id)
    if (idx !== -1) {
      users.value[idx] = updated
    }
    // Si el usuario editado es el mismo en sesión, sincronizar el store
    if (isCurrentUser(updated)) {
      authStore.user = updated
    }
    successNotification.value = `Usuario @${updated.username} actualizado exitosamente.`
    closeEditModal()
  } catch (err: any) {
    modalError.value = err.message || 'Error al actualizar el usuario'
  } finally {
    modalSubmitting.value = false
  }
}

// Toggle Estado Activo / Inactivo
async function toggleUserStatus(u: UserProfile) {
  if (isCurrentUser(u)) return
  const newStatus = !u.is_active
  try {
    const updated = await authService.toggleUserStatus(u.id, newStatus)
    const idx = users.value.findIndex((item) => item.id === u.id)
    if (idx !== -1) {
      users.value[idx] = updated
    }
    successNotification.value = `El usuario @${u.username} ahora está ${newStatus ? 'Activo' : 'Inactivo'}.`
  } catch (err: any) {
    errorNotification.value = err.message || 'No fue posible cambiar el estado del usuario'
  }
}

// Modal Eliminar
function openDeleteModal(u: UserProfile) {
  if (isCurrentUser(u)) return
  deletingUser.value = u
  showDeleteModal.value = true
}

function closeDeleteModal() {
  showDeleteModal.value = false
  deletingUser.value = null
}

async function handleConfirmDelete() {
  if (!deletingUser.value) return
  modalSubmitting.value = true
  try {
    await authService.deleteUser(deletingUser.value.id)
    users.value = users.value.filter((item) => item.id !== deletingUser.value!.id)
    successNotification.value = `Usuario @${deletingUser.value.username} eliminado correctamente.`
    closeDeleteModal()
  } catch (err: any) {
    errorNotification.value = err.message || 'Error al eliminar el usuario'
  } finally {
    modalSubmitting.value = false
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.users-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.view-title {
  font-size: 1.45rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
}

.view-subtitle {
  font-size: 0.9rem;
  color: #64748b;
  margin-top: 0.2rem;
}

/* Métricas */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.15rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon--purple { background: #f3e8ff; color: #7c3aed; }
.stat-icon--violet { background: #ede9fe; color: #6d28d9; }
.stat-icon--blue { background: #e0f2fe; color: #0284c7; }
.stat-icon--amber { background: #fef3c7; color: #d97706; }

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
}

.stat-value {
  font-size: 1.45rem;
  font-weight: 800;
  color: #0f172a;
}

/* Barra de Filtros */
.filters-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 0.9rem 1.25rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 260px;
}

.search-icon {
  position: absolute;
  left: 0.85rem;
  color: #94a3b8;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.65rem 2.2rem 0.65rem 2.5rem;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-size: 0.9rem;
  outline: none;
  background: #f8fafc;
  transition: all 0.2s;
}

.search-input:focus {
  background: white;
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.12);
}

.btn-clear-search {
  position: absolute;
  right: 0.75rem;
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.filters-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.role-pills {
  display: flex;
  background: #f1f5f9;
  padding: 0.25rem;
  border-radius: 10px;
  gap: 0.2rem;
}

.pill-btn {
  border: none;
  background: transparent;
  font-size: 0.82rem;
  font-weight: 600;
  color: #64748b;
  padding: 0.4rem 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.pill-btn.active {
  background: white;
  color: #7c3aed;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.status-select {
  padding: 0.55rem 0.85rem;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-size: 0.85rem;
  color: #334155;
  background: white;
  outline: none;
  cursor: pointer;
}

.btn-reload {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: 1px solid #cbd5e1;
  background: white;
  border-radius: 10px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-reload:hover {
  color: #7c3aed;
  border-color: #7c3aed;
}

.spinning {
  animation: spin 1s linear infinite;
}

/* Alertas */
.alert-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1.15rem;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 500;
}

.alert-banner--success {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #15803d;
}

.alert-banner--error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
}

.btn-close-alert {
  margin-left: auto;
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
}

/* Tabla */
.table-card {
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.9rem;
}

.data-table th {
  background: #f8fafc;
  padding: 0.9rem 1.25rem;
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #475569;
  border-bottom: 1px solid #e2e8f0;
}

.data-table td {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  vertical-align: middle;
}

.row-inactive {
  background: #fafafa;
  opacity: 0.75;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.user-avatar {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 700;
  flex-shrink: 0;
}

.avatar-superadmin { background: #ede9fe; color: #6d28d9; }
.avatar-content_manager { background: #e0f2fe; color: #0369a1; }
.avatar-researcher { background: #fef3c7; color: #b45309; }

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 700;
  color: #0f172a;
}

.user-handle {
  font-size: 0.8rem;
  color: #64748b;
  font-family: ui-monospace, SFMono-Regular, monospace;
}

.user-email {
  font-size: 0.88rem;
  color: #475569;
}

.role-badge {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.65rem;
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.role-superadmin { background: #ede9fe; color: #6d28d9; }
.role-content_manager { background: #e0f2fe; color: #0284c7; }
.role-researcher { background: #fef3c7; color: #b45309; }

.meta-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: #64748b;
}

.meta-none {
  color: #cbd5e1;
}

.status-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s;
}

.status-toggle-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.status-active {
  background: #dcfce7;
  color: #15803d;
  border-color: #bbf7d0;
}

.status-inactive {
  background: #fee2e2;
  color: #b91c1c;
  border-color: #fecaca;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
}

.action-buttons {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.4rem;
}

.btn-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: white;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-icon:hover:not(:disabled) {
  border-color: #7c3aed;
  color: #7c3aed;
  background: #fbf9ff;
}

.btn-icon--delete:hover:not(:disabled) {
  border-color: #dc2626;
  color: #dc2626;
  background: #fef2f2;
}

.btn-icon:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.text-right {
  text-align: right;
}

.empty-state {
  padding: 3.5rem 1.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.empty-icon {
  color: #cbd5e1;
}

.empty-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
}

.empty-desc {
  font-size: 0.88rem;
  color: #64748b;
  max-width: 400px;
}

/* Modales */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  z-index: 1000;
}

.modal-card {
  width: 100%;
  max-width: 540px;
  background: white;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  border: 1px solid #e2e8f0;
}

.modal-card--sm {
  max-width: 440px;
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.modal-icon-badge {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #ede9fe;
  color: #7c3aed;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.modal-icon-badge--edit {
  background: #e0f2fe;
  color: #0284c7;
}

.modal-icon-badge--danger {
  background: #fee2e2;
  color: #dc2626;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
}

.modal-subtitle {
  font-size: 0.85rem;
  color: #64748b;
}

.modal-close-btn {
  margin-left: auto;
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.35rem;
  border-radius: 6px;
}

.modal-close-btn:hover {
  color: #0f172a;
}

.modal-alert-error {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  font-size: 0.85rem;
  margin-bottom: 1.25rem;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.flex-1 {
  flex: 1;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-label {
  font-size: 0.84rem;
  font-weight: 600;
  color: #334155;
}

.form-input,
.form-select {
  padding: 0.7rem 0.9rem;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-size: 0.9rem;
  outline: none;
  transition: all 0.2s;
  background: #f8fafc;
}

.form-input:focus,
.form-select:focus {
  background: white;
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.12);
}

.input-with-action {
  position: relative;
  display: flex;
  align-items: center;
}

.input-with-action input {
  width: 100%;
  padding-right: 2.5rem;
}

.btn-inline-toggle {
  position: absolute;
  right: 0.75rem;
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.btn-link {
  background: transparent;
  border: none;
  color: #7c3aed;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-link:hover {
  text-decoration: underline;
}

.input-hint {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 0.25rem;
}

.form-group-checkbox {
  padding: 0.5rem 0;
}

.checkbox-container {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  cursor: pointer;
}

.checkbox-label {
  font-size: 0.88rem;
  color: #334155;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid #f1f5f9;
}

.delete-content {
  font-size: 0.92rem;
  color: #334155;
  line-height: 1.5;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.delete-warning {
  background: #fff1f2;
  border: 1px solid #ffe4e6;
  color: #be123c;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.85rem;
}

/* Botones genéricos */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #7c3aed;
  color: white;
  border: none;
  padding: 0.65rem 1.2rem;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #6d28d9;
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 0.65rem 1.2rem;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-secondary:hover {
  background: #e2e8f0;
}

.btn-danger {
  padding: 0.65rem 1.2rem;
  background: #dc2626;
  border: none;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-danger:hover:not(:disabled) {
  background: #b91c1c;
}

.spinner-small {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    gap: 1.15rem;
  }
}
</style>
