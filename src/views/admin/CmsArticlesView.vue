<template>
  <div class="cms-articles-view">
    <div class="view-header">
      <div>
        <h2 class="view-title">Gestión de Artículos del Portal (CMS)</h2>
        <p class="view-subtitle">
          Crea, edita, publica y archiva contenidos de autocuidado y salud integral.
        </p>
      </div>
      <button class="btn-primary" @click="openCreateModal">
        <Plus :size="18" />
        <span>Nuevo Artículo</span>
      </button>
    </div>

    <!-- Barra de Filtros y Búsqueda -->
    <div class="filters-card">
      <div class="search-box">
        <Search :size="18" class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar artículo por título o resumen..."
          class="search-input"
        />
        <button v-if="searchQuery" class="btn-clear" @click="searchQuery = ''">
          <X :size="16" />
        </button>
      </div>

      <div class="filters-group">
        <div class="status-pills">
          <button
            class="pill-btn"
            :class="{ active: selectedStatus === 'ALL' }"
            @click="selectedStatus = 'ALL'"
          >
            Todos
          </button>
          <button
            class="pill-btn"
            :class="{ active: selectedStatus === 'PUBLISHED' }"
            @click="selectedStatus = 'PUBLISHED'"
          >
            Publicados
          </button>
          <button
            class="pill-btn"
            :class="{ active: selectedStatus === 'DRAFT' }"
            @click="selectedStatus = 'DRAFT'"
          >
            Borradores
          </button>
          <button
            class="pill-btn"
            :class="{ active: selectedStatus === 'ARCHIVED' }"
            @click="selectedStatus = 'ARCHIVED'"
          >
            Archivados
          </button>
        </div>

        <button class="btn-reload" title="Recargar lista" @click="fetchArticles">
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

    <!-- Tabla de Artículos -->
    <div class="table-card">
      <div v-if="loading && articles.length === 0" class="empty-state">
        <div class="spinner"></div>
        <p>Cargando artículos...</p>
      </div>

      <div v-else-if="filteredArticles.length === 0" class="empty-state">
        <BookOpen :size="40" class="empty-icon" />
        <h4 class="empty-title">No hay artículos</h4>
        <p class="empty-desc">No se encontraron artículos con los criterios seleccionados.</p>
      </div>

      <div v-else class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Título y Resumen</th>
              <th>Categoría</th>
              <th>Estado</th>
              <th>Métricas</th>
              <th>Fecha</th>
              <th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="a in filteredArticles" :key="a.id">
              <td class="main-cell">
                <span class="article-cell-title">{{ a.title }}</span>
                <span class="article-cell-summary">{{ a.summary }}</span>
              </td>
              <td>
                <span class="category-tag">{{ a.category_name || 'General' }}</span>
              </td>
              <td>
                <span class="status-badge" :class="'status-' + a.status.toLowerCase()">
                  {{ a.status_display || a.status }}
                </span>
              </td>
              <td>
                <div class="metrics-cell">
                  <span class="metric-item">
                    <Eye :size="13" />
                    <span>{{ a.views_count }}</span>
                  </span>
                  <span class="metric-item">
                    <Clock :size="13" />
                    <span>{{ a.reading_time_minutes }} min</span>
                  </span>
                </div>
              </td>
              <td>
                <span class="date-text">
                  {{ a.published_at ? new Date(a.published_at).toLocaleDateString() : 'Borrador' }}
                </span>
              </td>
              <td class="text-right">
                <div class="action-buttons">
                  <!-- Publicar si está en borrador o archivado -->
                  <button
                    v-if="a.status !== 'PUBLISHED'"
                    class="btn-action-icon btn-action--publish"
                    title="Publicar inmediatamente"
                    @click="handlePublish(a)"
                  >
                    <UploadCloud :size="16" />
                  </button>

                  <!-- Archivar si está publicado -->
                  <button
                    v-if="a.status === 'PUBLISHED'"
                    class="btn-action-icon btn-action--archive"
                    title="Archivar artículo"
                    @click="handleArchive(a)"
                  >
                    <Archive :size="16" />
                  </button>

                  <!-- Editar -->
                  <button
                    class="btn-action-icon"
                    title="Editar contenido"
                    @click="openEditModal(a)"
                  >
                    <Edit3 :size="16" />
                  </button>

                  <!-- Eliminar -->
                  <button
                    class="btn-action-icon btn-action--delete"
                    title="Eliminar artículo"
                    @click="openDeleteModal(a)"
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

    <!-- MODAL: Crear / Editar Artículo -->
    <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
      <div class="modal-card modal-card--lg">
        <div class="modal-header">
          <div class="modal-icon-badge">
            <BookOpen :size="20" />
          </div>
          <div>
            <h3 class="modal-title">
              {{ editingArticle ? 'Editar Artículo' : 'Nuevo Artículo de Autocuidado' }}
            </h3>
            <p class="modal-subtitle">Redacción y categorización para el portal público</p>
          </div>
          <button class="modal-close-btn" @click="closeModal"><X :size="18" /></button>
        </div>

        <div v-if="modalError" class="modal-alert-error">
          <XCircle :size="16" />
          <span>{{ modalError }}</span>
        </div>

        <form @submit.prevent="handleSaveArticle" class="modal-form">
          <div class="form-group">
            <label class="form-label">Título del Artículo *</label>
            <input
              v-model="form.title"
              type="text"
              required
              placeholder="Ej: Protocolo de Acceso a Terapia Hormonal Afirmativa"
              class="form-input"
            />
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label class="form-label">Categoría Temática *</label>
              <select v-model="form.category" class="form-select" required>
                <option value="" disabled>Selecciona una categoría</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                  {{ cat.name }}
                </option>
              </select>
            </div>

            <div class="form-group flex-1">
              <label class="form-label">Estado de Publicación *</label>
              <select v-model="form.status" class="form-select" required>
                <option value="DRAFT">Borrador (Solo visible en panel CMS)</option>
                <option value="PUBLISHED">Publicado (Visible en el Portal)</option>
                <option value="ARCHIVED">Archivado (Oculto del público)</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Resumen Breve (Lead) *</label>
            <textarea
              v-model="form.summary"
              required
              rows="2"
              maxlength="500"
              placeholder="Resumen conciso optimizado para carga rápida en redes móviles..."
              class="form-textarea"
            ></textarea>
            <span class="input-hint">{{ form.summary.length }}/500 caracteres</span>
          </div>

          <div class="form-group">
            <label class="form-label">Cuerpo Completo del Artículo (Formato Markdown) *</label>
            <textarea
              v-model="form.body"
              required
              rows="8"
              placeholder="Escribe el contenido completo. Puedes usar subtítulos con ## o listas con -..."
              class="form-textarea font-mono"
            ></textarea>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-secondary" @click="closeModal">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="submitting">
              <span v-if="submitting" class="spinner-small"></span>
              <span>{{ submitting ? 'Guardando...' : (editingArticle ? 'Actualizar Artículo' : 'Crear Artículo') }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL: Confirmar Eliminación -->
    <div v-if="showDeleteModal && deletingArticle" class="modal-backdrop" @click.self="showDeleteModal = false">
      <div class="modal-card modal-card--sm">
        <div class="modal-header">
          <div class="modal-icon-badge modal-icon-badge--danger">
            <Trash2 :size="20" />
          </div>
          <div>
            <h3 class="modal-title">Eliminar Artículo</h3>
            <p class="modal-subtitle">Acción irreversible</p>
          </div>
          <button class="modal-close-btn" @click="showDeleteModal = false"><X :size="18" /></button>
        </div>

        <p class="delete-msg">
          ¿Estás seguro de que deseas eliminar permanentemente el artículo
          <strong>"{{ deletingArticle.title }}"</strong>?
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
import type { Article, Category, ArticleStatus, ArticleWritePayload } from '@/types/content'
import {
  Plus,
  Search,
  X,
  RefreshCw,
  BookOpen,
  Eye,
  Clock,
  Edit3,
  Trash2,
  UploadCloud,
  Archive,
  CheckCircle2,
  XCircle,
} from '@lucide/vue'

const articles = ref<Article[]>([])
const categories = ref<Category[]>([])
const loading = ref(false)
const submitting = ref(false)

const searchQuery = ref('')
const selectedStatus = ref('ALL')

const successMsg = ref('')
const errorMsg = ref('')

// Modal Crear/Editar
const showModal = ref(false)
const editingArticle = ref<Article | null>(null)
const modalError = ref('')

const form = reactive({
  title: '',
  summary: '',
  body: '',
  category: 0,
  status: 'DRAFT' as ArticleStatus,
})

// Modal Eliminar
const showDeleteModal = ref(false)
const deletingArticle = ref<Article | null>(null)

const filteredArticles = computed(() => {
  return articles.value.filter((a) => {
    if (selectedStatus.value !== 'ALL' && a.status !== selectedStatus.value) {
      return false
    }
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim()
      const matchTitle = a.title.toLowerCase().includes(q)
      const matchSumm = (a.summary || '').toLowerCase().includes(q)
      return matchTitle || matchSumm
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

async function fetchArticles() {
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await contentService.getCmsArticles()
    articles.value = res.results
  } catch (err: any) {
    errorMsg.value = err.message || 'Error al obtener artículos del CMS'
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  modalError.value = ''
  editingArticle.value = null
  form.title = ''
  form.summary = ''
  form.body = ''
  form.category = categories.value[0]?.id || 0
  form.status = 'DRAFT'
  showModal.value = true
}

async function openEditModal(a: Article) {
  modalError.value = ''
  editingArticle.value = a
  try {
    // Obtener el detalle completo incluyendo el body
    const detail = await contentService.getCmsArticleDetail(a.id)
    form.title = detail.title
    form.summary = detail.summary
    form.body = detail.body || ''
    form.category = typeof detail.category === 'object' && detail.category ? detail.category.id : (detail.category as number)
    form.status = detail.status
    showModal.value = true
  } catch (e: any) {
    errorMsg.value = 'No se pudo cargar el contenido del artículo para edición.'
  }
}

function closeModal() {
  showModal.value = false
  editingArticle.value = null
  modalError.value = ''
}

async function handleSaveArticle() {
  if (!form.category) {
    modalError.value = 'Debes seleccionar una categoría temática.'
    return
  }
  submitting.value = true
  modalError.value = ''

  try {
    const payload: ArticleWritePayload = {
      title: form.title,
      summary: form.summary,
      body: form.body,
      category: Number(form.category),
      status: form.status,
    }

    if (editingArticle.value) {
      const updated = await contentService.updateCmsArticle(editingArticle.value.id, payload)
      const idx = articles.value.findIndex((item) => item.id === updated.id)
      if (idx !== -1) articles.value[idx] = updated
      successMsg.value = `Artículo "${updated.title}" actualizado exitosamente.`
    } else {
      const created = await contentService.createCmsArticle(payload)
      articles.value.unshift(created)
      successMsg.value = `Artículo "${created.title}" creado exitosamente.`
    }
    closeModal()
  } catch (err: any) {
    modalError.value = err.message || 'Error al guardar el artículo.'
  } finally {
    submitting.value = false
  }
}

async function handlePublish(a: Article) {
  try {
    const res = await contentService.publishCmsArticle(a.id)
    const idx = articles.value.findIndex((item) => item.id === a.id)
    if (idx !== -1) articles.value[idx] = res
    successMsg.value = `Artículo "${a.title}" publicado en el portal web.`
  } catch (err: any) {
    errorMsg.value = err.message || 'Error al publicar el artículo'
  }
}

async function handleArchive(a: Article) {
  try {
    const res = await contentService.archiveCmsArticle(a.id)
    const idx = articles.value.findIndex((item) => item.id === a.id)
    if (idx !== -1) articles.value[idx] = res
    successMsg.value = `Artículo "${a.title}" archivado.`
  } catch (err: any) {
    errorMsg.value = err.message || 'Error al archivar el artículo'
  }
}

function openDeleteModal(a: Article) {
  deletingArticle.value = a
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (!deletingArticle.value) return
  submitting.value = true
  try {
    await contentService.deleteCmsArticle(deletingArticle.value.id)
    articles.value = articles.value.filter((item) => item.id !== deletingArticle.value!.id)
    successMsg.value = `Artículo eliminado correctamente.`
    showDeleteModal.value = false
  } catch (err: any) {
    errorMsg.value = err.message || 'Error al eliminar el artículo'
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  await fetchCategories()
  fetchArticles()
})
</script>

<style scoped>
.cms-articles-view {
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

/* Filters Card */
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

.status-pills {
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

.btn-reload:hover {
  color: #7c3aed;
  border-color: #7c3aed;
}

.spinning {
  animation: spin 1s linear infinite;
}

/* Table */
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

.main-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  max-width: 380px;
}

.article-cell-title {
  font-weight: 700;
  color: #0f172a;
}

.article-cell-summary {
  font-size: 0.8rem;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.category-tag {
  font-size: 0.78rem;
  font-weight: 600;
  color: #475569;
  background: #f1f5f9;
  padding: 0.2rem 0.55rem;
  border-radius: 6px;
}

.status-badge {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  text-transform: uppercase;
}

.status-published { background: #dcfce7; color: #15803d; }
.status-draft { background: #fef3c7; color: #b45309; }
.status-archived { background: #f1f5f9; color: #64748b; }

.metrics-cell {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.metric-item {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  color: #64748b;
}

.date-text {
  font-size: 0.82rem;
  color: #64748b;
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
  transition: all 0.15s;
}

.btn-action-icon:hover {
  border-color: #7c3aed;
  color: #7c3aed;
  background: #fbf9ff;
}

.btn-action--publish:hover {
  border-color: #15803d;
  color: #15803d;
  background: #f0fdf4;
}

.btn-action--archive:hover {
  border-color: #d97706;
  color: #d97706;
  background: #fffbeb;
}

.btn-action--delete:hover {
  border-color: #dc2626;
  color: #dc2626;
  background: #fef2f2;
}

.text-right {
  text-align: right;
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
  max-width: 680px;
  background: white;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  border: 1px solid #e2e8f0;
  max-height: 90vh;
  overflow-y: auto;
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

.form-label {
  font-size: 0.84rem;
  font-weight: 600;
  color: #334155;
}

.form-input,
.form-select,
.form-textarea {
  padding: 0.7rem 0.9rem;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-size: 0.9rem;
  outline: none;
  background: #f8fafc;
  transition: all 0.2s;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  background: white;
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.12);
}

.form-textarea {
  resize: vertical;
}

.font-mono {
  font-family: ui-monospace, SFMono-Regular, monospace;
}

.input-hint {
  font-size: 0.75rem;
  color: #94a3b8;
  text-align: right;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.25rem;
  padding-top: 1.25rem;
  border-top: 1px solid #f1f5f9;
}

.delete-msg {
  font-size: 0.95rem;
  color: #334155;
  line-height: 1.5;
}

/* Botones */
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
  transition: background 0.15s;
}

.btn-primary:hover:not(:disabled) {
  background: #6d28d9;
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
}

.btn-danger:hover:not(:disabled) {
  background: #b91c1c;
}

.alert-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1.15rem;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 500;
}

.alert-banner--success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d; }
.alert-banner--error { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; }

.btn-close-alert {
  margin-left: auto;
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
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
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
}

.empty-desc {
  font-size: 0.88rem;
  color: #64748b;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #e2e8f0;
  border-top-color: #7c3aed;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
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

@media (max-width: 640px) {
  .form-row {
    flex-direction: column;
    gap: 1.15rem;
  }
}
</style>
