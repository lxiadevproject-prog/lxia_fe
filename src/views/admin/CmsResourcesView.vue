<template>
  <div class="cms-resources-view">
    <div class="view-header">
      <div>
        <h2 class="view-title">Gestión de Recursos Descargables</h2>
        <p class="view-subtitle">
          Administra infografías, guías en PDF, audios y directorios de apoyo institucional.
        </p>
      </div>
      <button class="btn-primary" @click="openCreateModal">
        <Plus :size="18" />
        <span>Nuevo Recurso</span>
      </button>
    </div>

    <!-- Barra de Búsqueda y Filtros -->
    <div class="filters-card">
      <div class="search-box">
        <Search :size="18" class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar recurso por título o descripción..."
          class="search-input"
        />
        <button v-if="searchQuery" class="btn-clear" @click="searchQuery = ''"><X :size="16" /></button>
      </div>

      <div class="filters-group">
        <div class="type-pills">
          <button
            class="pill-btn"
            :class="{ active: selectedType === 'ALL' }"
            @click="selectedType = 'ALL'"
          >
            Todos
          </button>
          <button
            class="pill-btn"
            :class="{ active: selectedType === 'PDF' }"
            @click="selectedType = 'PDF'"
          >
            PDF
          </button>
          <button
            class="pill-btn"
            :class="{ active: selectedType === 'INFOGRAPHIC' }"
            @click="selectedType = 'INFOGRAPHIC'"
          >
            Infografía
          </button>
          <button
            class="pill-btn"
            :class="{ active: selectedType === 'EXTERNAL_LINK' }"
            @click="selectedType = 'EXTERNAL_LINK'"
          >
            Enlace
          </button>
          <button
            class="pill-btn"
            :class="{ active: selectedType === 'AUDIO' }"
            @click="selectedType = 'AUDIO'"
          >
            Audio
          </button>
        </div>

        <button class="btn-reload" title="Recargar lista" @click="fetchResources">
          <RefreshCw :size="16" :class="{ spinning: loading }" />
        </button>
      </div>
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

    <!-- Tabla de Recursos -->
    <div class="table-card">
      <div v-if="loading && resources.length === 0" class="empty-state">
        <div class="spinner"></div>
        <p>Cargando recursos...</p>
      </div>

      <div v-else-if="filteredResources.length === 0" class="empty-state">
        <FolderDown :size="40" class="empty-icon" />
        <h4 class="empty-title">No hay recursos</h4>
        <p class="empty-desc">No se encontraron materiales registrados con los criterios seleccionados.</p>
      </div>

      <div v-else class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Recurso y Descripción</th>
              <th>Tipo</th>
              <th>Categoría</th>
              <th>Descargas</th>
              <th>Destacado</th>
              <th>Enlace / Archivo</th>
              <th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in filteredResources" :key="r.id">
              <td class="main-cell">
                <span class="resource-cell-title">{{ r.title }}</span>
                <span class="resource-cell-desc">{{ r.description || 'Sin descripción' }}</span>
              </td>
              <td>
                <span class="type-badge" :class="'type-' + r.resource_type.toLowerCase()">
                  {{ r.resource_type_display || r.resource_type }}
                </span>
              </td>
              <td>
                <span class="category-tag">{{ r.category_name || 'General' }}</span>
              </td>
              <td>
                <span class="downloads-badge">{{ r.download_count }} descargas</span>
              </td>
              <td>
                <span class="featured-indicator" :class="r.is_featured ? 'featured-yes' : 'featured-no'">
                  {{ r.is_featured ? '★ Destacado' : 'Estándar' }}
                </span>
              </td>
              <td>
                <a
                  v-if="r.file || r.external_url"
                  :href="r.file || r.external_url || '#'"
                  target="_blank"
                  class="link-preview"
                >
                  <ExternalLink :size="14" />
                  <span>Ver archivo</span>
                </a>
                <span v-else class="text-muted">—</span>
              </td>
              <td class="text-right">
                <div class="action-buttons">
                  <button class="btn-action-icon" title="Editar recurso" @click="openEditModal(r)">
                    <Edit3 :size="16" />
                  </button>
                  <button class="btn-action-icon btn-action--delete" title="Eliminar recurso" @click="openDeleteModal(r)">
                    <Trash2 :size="16" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL: Crear / Editar Recurso -->
    <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
      <div class="modal-card">
        <div class="modal-header">
          <div class="modal-icon-badge">
            <FolderDown :size="20" />
          </div>
          <div>
            <h3 class="modal-title">
              {{ editingResource ? 'Editar Recurso' : 'Nuevo Recurso de Apoyo' }}
            </h3>
            <p class="modal-subtitle">Guía descargable, enlace de emergencia o material afirmativo</p>
          </div>
          <button class="modal-close-btn" @click="closeModal"><X :size="18" /></button>
        </div>

        <div v-if="modalError" class="modal-alert-error">
          <XCircle :size="16" />
          <span>{{ modalError }}</span>
        </div>

        <form @submit.prevent="handleSaveResource" class="modal-form">
          <div class="form-group">
            <label class="form-label">Título del Recurso *</label>
            <input
              v-model="form.title"
              type="text"
              required
              placeholder="Ej: Directorio Nacional de Redes Comunitarias Trans"
              class="form-input"
            />
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label class="form-label">Tipo de Recurso *</label>
              <select v-model="form.resource_type" class="form-select" required>
                <option value="PDF">Documento PDF descargable</option>
                <option value="INFOGRAPHIC">Infografía / Imagen gráfica</option>
                <option value="EXTERNAL_LINK">Enlace externo o portal oficial</option>
                <option value="AUDIO">Audio / Podcast</option>
              </select>
            </div>

            <div class="form-group flex-1">
              <label class="form-label">Categoría Asociada</label>
              <select v-model="form.category" class="form-select">
                <option :value="null">Sin categoría específica</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                  {{ cat.name }}
                </option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Descripción Informativa</label>
            <textarea
              v-model="form.description"
              rows="2"
              placeholder="Detalles sobre el contenido del archivo o propósito del recurso..."
              class="form-textarea"
            ></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Enlace Externo o URL de Almacenamiento (Firebase / Web) *</label>
            <input
              v-model="form.external_url"
              type="url"
              placeholder="https://ejemplo.org/recursos/guia.pdf"
              class="form-input"
            />
            <span class="input-hint">
              Permite entrega liviana sin ocupar espacio en disco del servidor.
            </span>
          </div>

          <div class="form-group-checkbox">
            <label class="checkbox-container">
              <input v-model="form.is_featured" type="checkbox" />
              <span class="checkbox-label">
                <strong>Destacar recurso</strong> en la página de inicio del portal ciudadano
              </span>
            </label>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-secondary" @click="closeModal">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="submitting">
              <span v-if="submitting" class="spinner-small"></span>
              <span>{{ submitting ? 'Guardando...' : (editingResource ? 'Guardar Cambios' : 'Crear Recurso') }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL: Confirmar Eliminación -->
    <div v-if="showDeleteModal && deletingResource" class="modal-backdrop" @click.self="showDeleteModal = false">
      <div class="modal-card modal-card--sm">
        <div class="modal-header">
          <div class="modal-icon-badge modal-icon-badge--danger">
            <Trash2 :size="20" />
          </div>
          <div>
            <h3 class="modal-title">Eliminar Recurso</h3>
            <p class="modal-subtitle">Acción irreversible</p>
          </div>
          <button class="modal-close-btn" @click="showDeleteModal = false"><X :size="18" /></button>
        </div>

        <p class="delete-msg">
          ¿Estás seguro de que deseas eliminar permanentemente el recurso
          <strong>"{{ deletingResource.title }}"</strong>?
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
import type { Resource, Category, ResourceType, ResourceWritePayload } from '@/types/content'
import {
  Plus,
  Search,
  X,
  RefreshCw,
  FolderDown,
  ExternalLink,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
} from '@lucide/vue'

const resources = ref<Resource[]>([])
const categories = ref<Category[]>([])
const loading = ref(false)
const submitting = ref(false)

const searchQuery = ref('')
const selectedType = ref('ALL')

const successMsg = ref('')
const errorMsg = ref('')

// Modal
const showModal = ref(false)
const editingResource = ref<Resource | null>(null)
const modalError = ref('')

const form = reactive({
  title: '',
  description: '',
  resource_type: 'PDF' as ResourceType,
  external_url: '',
  category: null as number | null,
  is_featured: false,
})

// Modal Delete
const showDeleteModal = ref(false)
const deletingResource = ref<Resource | null>(null)

const filteredResources = computed(() => {
  return resources.value.filter((r) => {
    if (selectedType.value !== 'ALL' && r.resource_type !== selectedType.value) {
      return false
    }
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim()
      const matchTitle = r.title.toLowerCase().includes(q)
      const matchDesc = (r.description || '').toLowerCase().includes(q)
      return matchTitle || matchDesc
    }
    return true
  })
})

async function fetchCategories() {
  try {
    const cats = await contentService.getCategories()
    categories.value = cats
  } catch (err) {
    console.error('Error cargando categorías para select:', err)
  }
}

async function fetchResources() {
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await contentService.getResources()
    resources.value = res.results
  } catch (err: any) {
    errorMsg.value = err.message || 'Error cargando recursos'
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  modalError.value = ''
  editingResource.value = null
  form.title = ''
  form.description = ''
  form.resource_type = 'PDF'
  form.external_url = ''
  form.category = categories.value[0]?.id || null
  form.is_featured = false
  showModal.value = true
}

function openEditModal(r: Resource) {
  modalError.value = ''
  editingResource.value = r
  form.title = r.title
  form.description = r.description || ''
  form.resource_type = r.resource_type
  form.external_url = r.external_url || (r.file as string) || ''
  form.category = typeof r.category === 'object' && r.category ? r.category.id : (r.category as number | null)
  form.is_featured = r.is_featured
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingResource.value = null
  modalError.value = ''
}

async function handleSaveResource() {
  if (!form.external_url) {
    modalError.value = 'Debes proporcionar una URL externa o de almacenamiento para el recurso.'
    return
  }

  submitting.value = true
  modalError.value = ''

  try {
    const payload: ResourceWritePayload = {
      title: form.title,
      description: form.description,
      resource_type: form.resource_type,
      external_url: form.external_url,
      category: form.category,
      is_featured: form.is_featured,
    }

    if (editingResource.value) {
      const updated = await contentService.updateResource(editingResource.value.id, payload)
      const idx = resources.value.findIndex((item) => item.id === updated.id)
      if (idx !== -1) resources.value[idx] = updated
      successMsg.value = `Recurso "${updated.title}" actualizado exitosamente.`
    } else {
      const created = await contentService.createResource(payload)
      resources.value.unshift(created)
      successMsg.value = `Recurso "${created.title}" creado exitosamente.`
    }
    closeModal()
  } catch (err: any) {
    modalError.value = err.message || 'Error al guardar el recurso.'
  } finally {
    submitting.value = false
  }
}

function openDeleteModal(r: Resource) {
  deletingResource.value = r
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (!deletingResource.value) return
  submitting.value = true
  try {
    await contentService.deleteResource(deletingResource.value.id)
    resources.value = resources.value.filter((item) => item.id !== deletingResource.value!.id)
    successMsg.value = 'Recurso eliminado correctamente.'
    showDeleteModal.value = false
  } catch (err: any) {
    errorMsg.value = err.message || 'Error al eliminar el recurso.'
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  await fetchCategories()
  fetchResources()
})
</script>

<style scoped>
.cms-resources-view {
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

.btn-clear {
  position: absolute;
  right: 0.75rem;
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
}

.filters-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.type-pills {
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
  color: #0284c7;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
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

.main-cell {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  max-width: 340px;
}

.resource-cell-title {
  font-weight: 700;
  color: #0f172a;
}

.resource-cell-desc {
  font-size: 0.8rem;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.type-badge {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.2rem 0.55rem;
  border-radius: 6px;
  text-transform: uppercase;
}

.type-pdf { background: #fee2e2; color: #dc2626; }
.type-infographic { background: #fef3c7; color: #b45309; }
.type-external_link { background: #e0f2fe; color: #0284c7; }
.type-audio { background: #ede9fe; color: #7c3aed; }

.category-tag {
  font-size: 0.78rem;
  font-weight: 600;
  color: #475569;
  background: #f1f5f9;
  padding: 0.2rem 0.55rem;
  border-radius: 6px;
}

.downloads-badge {
  font-size: 0.82rem;
  color: #64748b;
  font-weight: 600;
}

.featured-indicator {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
}

.featured-yes { background: #fef3c7; color: #b45309; }
.featured-no { color: #94a3b8; }

.link-preview {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.82rem;
  color: #7c3aed;
  text-decoration: none;
  font-weight: 600;
}

.link-preview:hover { text-decoration: underline; }

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
.text-muted { color: #cbd5e1; }

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
  background: #e0f2fe;
  color: #0284c7;
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

.modal-form { display: flex; flex-direction: column; gap: 1.15rem; }
.form-row { display: flex; gap: 1rem; }
.flex-1 { flex: 1; }
.form-group { display: flex; flex-direction: column; gap: 0.35rem; }
.form-label { font-size: 0.84rem; font-weight: 600; color: #334155; }

.form-input, .form-select, .form-textarea {
  padding: 0.7rem 0.9rem;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-size: 0.9rem;
  outline: none;
  background: #f8fafc;
  transition: all 0.2s;
}

.form-input:focus, .form-select:focus, .form-textarea:focus {
  background: white;
  border-color: #0284c7;
  box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.12);
}

.input-hint { font-size: 0.75rem; color: #64748b; }
.form-group-checkbox { padding: 0.25rem 0; }
.checkbox-container { display: flex; align-items: center; gap: 0.65rem; cursor: pointer; }
.checkbox-label { font-size: 0.88rem; color: #334155; }

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
  background: #0284c7;
  color: white;
  border: none;
  padding: 0.65rem 1.2rem;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary:hover:not(:disabled) { background: #0369a1; }
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

.spinner { width: 28px; height: 28px; border: 3px solid #e2e8f0; border-top-color: #0284c7; border-radius: 50%; animation: spin 0.8s linear infinite; }
.spinner-small { width: 14px; height: 14px; border: 2px solid rgba(255, 255, 255, 0.3); border-radius: 50%; border-top-color: white; animation: spin 0.8s linear infinite; }

@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 640px) {
  .form-row {
    flex-direction: column;
    gap: 1.15rem;
  }
}
</style>
