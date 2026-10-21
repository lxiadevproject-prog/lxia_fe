<template>
  <div class="cms-categories-view">
    <div class="view-header">
      <div>
        <h2 class="view-title">Categorías Temáticas de Autocuidado</h2>
        <p class="view-subtitle">
          Estructura los ejes temáticos y la navegación pública del portal TransLúcidas.
        </p>
      </div>
      <button class="btn-primary" @click="openCreateModal">
        <Plus :size="18" />
        <span>Nueva Categoría</span>
      </button>
    </div>

    <!-- Barra de búsqueda -->
    <div class="filters-card">
      <div class="search-box">
        <Search :size="18" class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar categoría por nombre o descripción..."
          class="search-input"
        />
        <button v-if="searchQuery" class="btn-clear" @click="searchQuery = ''"><X :size="16" /></button>
      </div>

      <button class="btn-reload" title="Recargar lista" @click="fetchCategories">
        <RefreshCw :size="16" :class="{ spinning: loading }" />
      </button>
    </div>

    <!-- Notificaciones -->
    <div v-if="successMsg" class="alert-banner alert-banner--success">
      <CheckCircle2 :size="18" />
      <span>{{ successMsg }}</span>
      <button class="btn-close-alert" @click="successMsg = ''"><X :size="14" /></button>
    </div>
    <div v-if="errorMsg" class="alert-banner alert-banner--error">
      <XCircle :size="18" />
      <span>{{ errorMsg }}</span>
      <button class="btn-close-alert" @click="errorMsg = ''"><X :size="14" /></button>
    </div>

    <!-- Tabla de Categorías -->
    <div class="table-card">
      <div v-if="loading && categories.length === 0" class="empty-state">
        <div class="spinner"></div>
        <p>Cargando categorías...</p>
      </div>

      <div v-else-if="filteredCategories.length === 0" class="empty-state">
        <FolderTree :size="40" class="empty-icon" />
        <h4 class="empty-title">No hay categorías</h4>
        <p class="empty-desc">No se encontraron categorías temáticas registradas.</p>
      </div>

      <div v-else class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 70px;">Orden</th>
              <th>Nombre y Descripción</th>
              <th>Slug / Identificador</th>
              <th>Ícono</th>
              <th>Artículos</th>
              <th>Estado</th>
              <th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in filteredCategories" :key="c.id" :class="{ 'row-inactive': !c.is_active }">
              <td class="order-cell">{{ c.order }}</td>
              <td>
                <div class="cat-cell">
                  <span class="cat-name">{{ c.name }}</span>
                  <span class="cat-desc">{{ c.description || 'Sin descripción' }}</span>
                </div>
              </td>
              <td>
                <span class="slug-tag">{{ c.slug }}</span>
              </td>
              <td>
                <span class="icon-tag">
                  <code>{{ c.icon || 'book-open' }}</code>
                </span>
              </td>
              <td>
                <span class="articles-count-tag">
                  {{ c.articles_count ?? '0' }} guías
                </span>
              </td>
              <td>
                <button
                  class="status-toggle-btn"
                  :class="c.is_active ? 'status-active' : 'status-inactive'"
                  :title="c.is_active ? 'Click para desactivar' : 'Click para activar'"
                  @click="toggleActive(c)"
                >
                  <span class="status-dot"></span>
                  <span>{{ c.is_active ? 'Activa' : 'Inactiva' }}</span>
                </button>
              </td>
              <td class="text-right">
                <div class="action-buttons">
                  <button class="btn-action-icon" title="Editar categoría" @click="openEditModal(c)">
                    <Edit3 :size="16" />
                  </button>
                  <button class="btn-action-icon btn-action--delete" title="Eliminar categoría" @click="openDeleteModal(c)">
                    <Trash2 :size="16" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL: Crear / Editar Categoría -->
    <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
      <div class="modal-card">
        <div class="modal-header">
          <div class="modal-icon-badge">
            <FolderTree :size="20" />
          </div>
          <div>
            <h3 class="modal-title">
              {{ editingCategory ? 'Editar Categoría' : 'Nueva Categoría Temática' }}
            </h3>
            <p class="modal-subtitle">Organización temática para el portal de autocuidado</p>
          </div>
          <button class="modal-close-btn" @click="closeModal"><X :size="18" /></button>
        </div>

        <div v-if="modalError" class="modal-alert-error">
          <XCircle :size="16" />
          <span>{{ modalError }}</span>
        </div>

        <form @submit.prevent="handleSaveCategory" class="modal-form">
          <div class="form-group">
            <label class="form-label">Nombre de la Categoría *</label>
            <input
              v-model="form.name"
              type="text"
              required
              placeholder="Ej: Salud Mental y Apoyo Emocional"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Descripción</label>
            <textarea
              v-model="form.description"
              rows="2"
              placeholder="Breve explicación del tipo de contenidos albergados en este eje..."
              class="form-textarea"
            ></textarea>
          </div>

          <div class="form-row">
            <div class="form-group icon-field">
              <label class="form-label">Ícono Representativo</label>
              <select v-model="form.icon" class="form-select">
                <option value="heart">Corazón (heart) • Salud y Afectos</option>
                <option value="shield">Escudo (shield) • Derechos y Leyes</option>
                <option value="users">Comunidad (users) • Redes de Apoyo</option>
                <option value="book-open">Libro (book-open) • Guías Generales</option>
                <option value="sparkles">Destello (sparkles) • Bienestar</option>
              </select>
            </div>

            <div class="form-group order-field">
              <label class="form-label">Orden de Visualización</label>
              <input
                v-model.number="form.order"
                type="number"
                min="0"
                class="form-input"
                placeholder="0"
              />
            </div>
          </div>

          <div class="form-group-checkbox">
            <label class="checkbox-container">
              <input v-model="form.is_active" type="checkbox" />
              <span class="checkbox-label">
                <strong>Categoría visible y activa</strong> en el portal público
              </span>
            </label>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-secondary" @click="closeModal">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="submitting">
              <span v-if="submitting" class="spinner-small"></span>
              <span>{{ submitting ? 'Guardando...' : (editingCategory ? 'Guardar Cambios' : 'Crear Categoría') }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL: Confirmar Eliminación -->
    <div v-if="showDeleteModal && deletingCategory" class="modal-backdrop" @click.self="showDeleteModal = false">
      <div class="modal-card modal-card--sm">
        <div class="modal-header">
          <div class="modal-icon-badge modal-icon-badge--danger">
            <Trash2 :size="20" />
          </div>
          <div>
            <h3 class="modal-title">Eliminar Categoría</h3>
            <p class="modal-subtitle">Acción irreversible</p>
          </div>
          <button class="modal-close-btn" @click="showDeleteModal = false"><X :size="18" /></button>
        </div>

        <p class="delete-msg">
          ¿Estás seguro de que deseas eliminar la categoría
          <strong>"{{ deletingCategory.name }}"</strong>?
        </p>

        <div class="modal-footer">
          <button type="button" class="btn-secondary" @click="showDeleteModal = false">Cancelar</button>
          <button type="button" class="btn-danger" :disabled="submitting" @click="confirmDelete">
            <span>{{ submitting ? 'Eliminando...' : 'Sí, eliminar' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import contentService from '@/services/contentService'
import type { Category, CategoryWritePayload } from '@/types/content'
import {
  Plus,
  Search,
  X,
  RefreshCw,
  FolderTree,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
} from '@lucide/vue'

const categories = ref<Category[]>([])
const loading = ref(false)
const submitting = ref(false)

const searchQuery = ref('')
const successMsg = ref('')
const errorMsg = ref('')

// Modal
const showModal = ref(false)
const editingCategory = ref<Category | null>(null)
const modalError = ref('')

const form = reactive({
  name: '',
  description: '',
  icon: 'book-open',
  order: 0,
  is_active: true,
})

// Delete Modal
const showDeleteModal = ref(false)
const deletingCategory = ref<Category | null>(null)

const filteredCategories = computed(() => {
  if (!searchQuery.value.trim()) return categories.value
  const q = searchQuery.value.toLowerCase().trim()
  return categories.value.filter(
    (c) => c.name.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q)
  )
})

async function fetchCategories() {
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await contentService.getCategories()
    categories.value = res
  } catch (err: any) {
    errorMsg.value = err.message || 'Error cargando categorías'
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  modalError.value = ''
  editingCategory.value = null
  form.name = ''
  form.description = ''
  form.icon = 'book-open'
  form.order = categories.value.length
  form.is_active = true
  showModal.value = true
}

function openEditModal(c: Category) {
  modalError.value = ''
  editingCategory.value = c
  form.name = c.name
  form.description = c.description || ''
  form.icon = c.icon || 'book-open'
  form.order = c.order
  form.is_active = c.is_active
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingCategory.value = null
  modalError.value = ''
}

async function handleSaveCategory() {
  submitting.value = true
  modalError.value = ''

  try {
    const payload: CategoryWritePayload = {
      name: form.name,
      description: form.description,
      icon: form.icon,
      order: form.order,
      is_active: form.is_active,
    }

    if (editingCategory.value) {
      const updated = await contentService.updateCategory(editingCategory.value.slug, payload)
      const idx = categories.value.findIndex((item) => item.id === updated.id)
      if (idx !== -1) categories.value[idx] = updated
      successMsg.value = `Categoría "${updated.name}" actualizada.`
    } else {
      const created = await contentService.createCategory(payload)
      categories.value.push(created)
      successMsg.value = `Categoría "${created.name}" creada exitosamente.`
    }
    closeModal()
  } catch (err: any) {
    modalError.value = err.message || 'Error al guardar la categoría.'
  } finally {
    submitting.value = false
  }
}

async function toggleActive(c: Category) {
  try {
    const updated = await contentService.updateCategory(c.slug, { is_active: !c.is_active })
    const idx = categories.value.findIndex((item) => item.id === updated.id)
    if (idx !== -1) categories.value[idx] = updated
    successMsg.value = `Categoría "${c.name}" ahora está ${updated.is_active ? 'Activa' : 'Inactiva'}.`
  } catch (err: any) {
    errorMsg.value = err.message || 'No fue posible cambiar el estado de la categoría'
  }
}

function openDeleteModal(c: Category) {
  deletingCategory.value = c
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (!deletingCategory.value) return
  submitting.value = true
  try {
    await contentService.deleteCategory(deletingCategory.value.slug)
    categories.value = categories.value.filter((item) => item.id !== deletingCategory.value!.id)
    successMsg.value = 'Categoría eliminada correctamente.'
    showDeleteModal.value = false
  } catch (err: any) {
    errorMsg.value = err.message || 'Error al eliminar la categoría (verifica si tiene artículos vinculados).'
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchCategories()
})
</script>

<style scoped>
.cms-categories-view {
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
}

.view-subtitle {
  font-size: 0.9rem;
  color: #64748b;
  margin-top: 0.2rem;
}

.filters-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 0.9rem 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  max-width: 480px;
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

.btn-clear {
  position: absolute;
  right: 0.75rem;
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
}

.btn-reload {
  width: 38px;
  height: 38px;
  border: 1px solid #cbd5e1;
  background: white;
  border-radius: 10px;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinning { animation: spin 1s linear infinite; }

.table-card {
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
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

.order-cell {
  font-weight: 700;
  color: #64748b;
  font-size: 0.95rem;
}

.cat-cell {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.cat-name {
  font-weight: 700;
  color: #0f172a;
}

.cat-desc {
  font-size: 0.8rem;
  color: #64748b;
}

.slug-tag {
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 0.82rem;
  color: #64748b;
  background: #f1f5f9;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
}

.icon-tag code {
  color: #7c3aed;
  font-size: 0.82rem;
}

.articles-count-tag {
  font-size: 0.82rem;
  font-weight: 600;
  color: #0284c7;
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
}

.status-active { background: #dcfce7; color: #15803d; border-color: #bbf7d0; }
.status-inactive { background: #fee2e2; color: #b91c1c; border-color: #fecaca; }

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

.btn-action-icon {
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
}

.btn-action-icon:hover { border-color: #7c3aed; color: #7c3aed; }
.btn-action--delete:hover { border-color: #dc2626; color: #dc2626; background: #fef2f2; }

.text-right { text-align: right; }

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
  max-width: 520px;
  box-sizing: border-box;
  background: white;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  border: 1px solid #e2e8f0;
}

.modal-card--sm { max-width: 440px; }

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

.modal-icon-badge--danger { background: #fee2e2; color: #dc2626; }

.modal-title { font-size: 1.25rem; font-weight: 800; color: #0f172a; }
.modal-subtitle { font-size: 0.85rem; color: #64748b; }
.modal-close-btn { margin-left: auto; border: none; background: transparent; color: #94a3b8; cursor: pointer; }

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

.modal-form { display: flex; flex-direction: column; gap: 1.15rem; width: 100%; box-sizing: border-box; }
.form-row { display: flex; gap: 1rem; width: 100%; box-sizing: border-box; }
.flex-1 { flex: 1; min-width: 0; }
.icon-field { flex: 1.4; min-width: 0; }
.order-field { flex: 1; min-width: 0; }
.form-group { display: flex; flex-direction: column; gap: 0.35rem; min-width: 0; }
.form-label { font-size: 0.84rem; font-weight: 600; color: #334155; }

.form-input, .form-select, .form-textarea {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  min-width: 0;
  padding: 0.7rem 0.9rem;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-size: 0.9rem;
  outline: none;
  background: #f8fafc;
  transition: all 0.2s;
}

.form-select {
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

.form-input:focus, .form-select:focus, .form-textarea:focus {
  background: white;
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.12);
}

.form-group-checkbox { padding: 0.25rem 0; }
.checkbox-container { display: flex; align-items: center; gap: 0.65rem; cursor: pointer; }
.checkbox-label { font-size: 0.88rem; color: #334155; }

@media (max-width: 520px) {
  .modal-card {
    padding: 1.5rem;
  }
  .form-row {
    flex-direction: column;
  }
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.25rem;
  padding-top: 1.25rem;
  border-top: 1px solid #f1f5f9;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: #7c3aed;
  color: white;
  border: none;
  padding: 0.65rem 1.2rem;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary:hover:not(:disabled) { background: #6d28d9; }
.btn-secondary { padding: 0.65rem 1.2rem; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 10px; font-weight: 600; color: #475569; cursor: pointer; }
.btn-danger { padding: 0.65rem 1.2rem; background: #dc2626; border: none; border-radius: 10px; font-weight: 600; color: white; cursor: pointer; }

.alert-banner { display: flex; align-items: center; gap: 0.75rem; padding: 0.85rem 1.15rem; border-radius: 12px; font-size: 0.9rem; font-weight: 500; }
.alert-banner--success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d; }
.alert-banner--error { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; }
.btn-close-alert { margin-left: auto; background: transparent; border: none; color: inherit; cursor: pointer; }

.empty-state { padding: 3.5rem 1.5rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 0.75rem; }
.empty-icon { color: #cbd5e1; }
.empty-title { font-size: 1.15rem; font-weight: 700; color: #0f172a; }
.empty-desc { font-size: 0.88rem; color: #64748b; }

.spinner { width: 28px; height: 28px; border: 3px solid #e2e8f0; border-top-color: #7c3aed; border-radius: 50%; animation: spin 0.8s linear infinite; }
.spinner-small { width: 14px; height: 14px; border: 2px solid rgba(255, 255, 255, 0.3); border-radius: 50%; border-top-color: white; animation: spin 0.8s linear infinite; }

@keyframes spin { to { transform: rotate(360deg); } }
</style>
